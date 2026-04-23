import { getAIProvider, type ChatMessage, type ToolCall, type ToolDefinition } from '../integrations/ai-client';
import type { Contact } from '../db/queries/contacts';
import type { Conversation } from '../db/queries/conversations';
import type { Message } from '../db/queries/messages';
import { getRelevantKnowledge, getKnowledgeByCategory } from './knowledge-base';
import { captureLead } from './lead';
import { escalateToHuman } from './escalation';
import * as tidycal from '../integrations/tidycal-client';
import { config } from '../config';
import { isBudgetExceeded, recordAiUsage } from '../db/queries/ai-budget';
import { formatDateTime } from '../utils/formatters';

// ---------------------------------------------------------------------------
// Tool definitions — 9 tools exposed to the LLM
// ---------------------------------------------------------------------------

const toolDefinitions: ToolDefinition[] = [
  {
    name: 'search_faq',
    description:
      'Search the Lucid-Lab knowledge base (services, methodology, case studies, pricing, FAQ). Use this whenever the visitor asks a factual question about the agency.',
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'The search query (visitor\'s question or keywords).' },
        category: {
          type: 'string',
          description: 'Optional category filter',
          enum: ['services', 'methodology', 'case_studies', 'pricing', 'faq', 'about', 'tech_stack'],
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'scope_project',
    description:
      'Record a 5-question project diagnostic (tools used, team size, main pain, urgency, budget range) and classify the visitor\'s transformation profile. Call once you have answers to these five questions.',
    parameters: {
      type: 'object',
      properties: {
        tools_used: { type: 'string', description: 'Current tools / stack the team uses' },
        team_size: { type: 'string', description: 'Team size or headcount range' },
        main_pain: { type: 'string', description: 'Main operational pain or bottleneck' },
        urgency: {
          type: 'string',
          description: 'Urgency of the transformation',
          enum: ['exploring', '3_months', 'asap'],
        },
        budget_range: {
          type: 'string',
          description: 'Budget range',
          enum: ['under_5k', '5k_15k', '15k_30k', '30k_plus', 'unknown'],
        },
      },
      required: ['tools_used', 'team_size', 'main_pain', 'urgency'],
    },
  },
  {
    name: 'estimate_roi',
    description:
      'Estimate time-savings ROI from automating a process. Provide hours saved per week, team size affected, and hourly rate. Returns yearly euro savings.',
    parameters: {
      type: 'object',
      properties: {
        hours_per_week: { type: 'number', description: 'Hours saved per person per week' },
        team_size: { type: 'number', description: 'Number of people impacted' },
        hourly_rate_eur: { type: 'number', description: 'Average loaded hourly rate in EUR' },
      },
      required: ['hours_per_week', 'team_size'],
    },
  },
  {
    name: 'show_case_study',
    description: 'Return a case study from the KB matching an industry or problem type.',
    parameters: {
      type: 'object',
      properties: {
        industry: { type: 'string', description: 'Industry keyword (marketing, real estate, finance, etc.)' },
        problem_type: { type: 'string', description: 'Problem keyword (lead gen, reporting, data entry, etc.)' },
      },
      required: [],
    },
  },
  {
    name: 'get_methodology',
    description:
      'Return Lucid-Lab\'s 4-phase methodology (Diagnose → Map → Build → Automate). Use this when the visitor asks how we work.',
    parameters: { type: 'object', properties: {}, required: [] },
  },
  {
    name: 'capture_lead',
    description:
      'Save the visitor\'s contact details and project brief. Requires email + a non-empty project brief. Set marketing_consent=true ONLY if the visitor has explicitly opted in to follow-ups. This tool notifies the Lucid-Lab team by email.',
    parameters: {
      type: 'object',
      properties: {
        email: { type: 'string', description: 'Visitor email address' },
        first_name: { type: 'string', description: 'First name, if given' },
        company: { type: 'string', description: 'Company name, if given' },
        project_brief: { type: 'string', description: 'Concise summary of what they want to build/improve' },
        marketing_consent: {
          type: 'boolean',
          description: 'True only if the visitor explicitly accepted follow-up emails',
        },
      },
      required: ['email', 'project_brief'],
    },
  },
  {
    name: 'list_tidycal_slots',
    description:
      'List available TidyCal discovery-call slots within the next N days. Call when the visitor wants to book a call.',
    parameters: {
      type: 'object',
      properties: {
        days_ahead: { type: 'number', description: 'How many days ahead to search (default 14)' },
      },
      required: [],
    },
  },
  {
    name: 'book_tidycal_slot',
    description:
      'Create a TidyCal booking. Requires visitor name, email, and an ISO 8601 starts_at from a slot list. TidyCal will automatically email confirmation to both parties.',
    parameters: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Visitor full name' },
        email: { type: 'string', description: 'Visitor email' },
        starts_at: { type: 'string', description: 'ISO 8601 start time (from list_tidycal_slots)' },
        timezone: { type: 'string', description: 'IANA timezone (default Europe/Paris)' },
      },
      required: ['name', 'email', 'starts_at'],
    },
  },
  {
    name: 'escalate_to_human',
    description:
      'Transfer the conversation to the Lucid-Lab team. CALL THIS when the visitor explicitly asks for a human, is frustrated, or the topic is out of scope. The team will get the transcript by email. NEVER tell the visitor their request has been transferred without calling this tool first.',
    parameters: {
      type: 'object',
      properties: {
        reason: { type: 'string', description: 'Short reason for escalation' },
      },
      required: ['reason'],
    },
  },
];

// ---------------------------------------------------------------------------
// Lucid-Lab system prompt
// ---------------------------------------------------------------------------

function buildSystemPrompt(contact: Contact, conversation: Conversation, kbContext: string): string {
  const lang = contact.language === 'en' ? 'en' : 'fr';

  const voice =
    lang === 'fr'
      ? `Tu es l'assistant virtuel de **Lucid-Lab**, une agence française spécialisée en IA, automatisation et logiciel sur mesure. Slogan: "On ne conseille pas. On construit."

**Ton style:**
- Direct, pragmatique, sans jargon
- Curieux et à l'écoute — tu poses des questions avant de proposer
- Honnête sur ce qui est possible et ce qui ne l'est pas
- Zéro PowerPoint, zéro vente agressive
- Tutoiement si le visiteur tutoie, sinon vouvoiement

**Ton rôle:**
1. Comprendre le besoin du visiteur (contexte, douleur, urgence)
2. Partager des exemples concrets (case studies, méthodologie)
3. Qualifier l'intérêt: capture_lead si l'email est donné, book_tidycal_slot pour un call découverte
4. Escalader à l'équipe humaine si le sujet sort du cadre ou si le visiteur insiste

**Méthodologie Lucid-Lab (4 phases):**
1. **Diagnose** — audit rapide du problème et des données
2. **Map** — cartographie du processus cible
3. **Build** — on construit (IA, automatisation, logiciel)
4. **Automate** — mise en production + transfert de connaissance

**Services:** AI Engineering, Process Automation, Strategy, Custom Software.
**Posture pricing:** découverte gratuite. Premier système ~8k€+. Transformation complète 25k€+.
**Lien de réservation découverte:** ${config.tidycalPublicUrl}

**Règles importantes:**
- Ne JAMAIS inventer de chiffre, cas client, ou feature. Si tu ne sais pas, appelle \`search_faq\` ou escalade.
- Ne promets pas de livrables précis avant le call de cadrage.
- Appelle \`capture_lead\` dès que le visiteur donne son email + un brief projet concret.
- Pour un RDV, appelle \`list_tidycal_slots\` puis \`book_tidycal_slot\`.
- Si le visiteur demande un humain: appelle \`escalate_to_human\`.`
      : `You are the virtual assistant for **Lucid-Lab**, a French agency specialized in AI, automation and custom software. Tagline: "We don't advise. We build."

**Voice:**
- Direct, pragmatic, jargon-free
- Curious — you ask questions before proposing
- Honest about what's possible and what isn't
- Zero PowerPoint, zero hard selling

**Your role:**
1. Understand the visitor's need (context, pain, urgency)
2. Share concrete examples (case studies, methodology)
3. Qualify: call \`capture_lead\` once you have an email + brief; \`book_tidycal_slot\` for a discovery call
4. Escalate to the human team if the topic is out of scope or the visitor insists

**Lucid-Lab methodology (4 phases):** Diagnose → Map → Build → Automate
**Services:** AI Engineering, Process Automation, Strategy, Custom Software
**Pricing posture:** discovery call free. First system ~€8k+. Full transformation €25k+.
**Discovery booking link:** ${config.tidycalPublicUrl}

**Rules:**
- NEVER invent numbers, case studies, or features. If unsure, call \`search_faq\` or escalate.
- Don't promise specific deliverables before the scoping call.
- Call \`capture_lead\` as soon as the visitor provides email + a concrete brief.
- For a meeting: call \`list_tidycal_slots\` then \`book_tidycal_slot\`.
- If the visitor asks for a human: call \`escalate_to_human\`.`;

  const kbBlock = kbContext ? `\n\n**KB context:**\n${kbContext}` : '';

  const stateBlock =
    conversation.status === 'escalated'
      ? `\n\n**⚠ Conversation escalated — the human team will take over. Stop proactively capturing. Just be polite until a human replies.**`
      : '';

  return `${voice}${kbBlock}${stateBlock}

Respond in ${lang === 'fr' ? 'French' : 'English'} unless the visitor writes in another language.`;
}

// ---------------------------------------------------------------------------
// Tool execution
// ---------------------------------------------------------------------------

async function executeTool(
  toolCall: ToolCall,
  contact: Contact,
  conversation: Conversation,
): Promise<string> {
  const args = toolCall.arguments;
  const lang = (contact.language as 'fr' | 'en') ?? 'fr';

  try {
    switch (toolCall.name) {
      case 'search_faq': {
        const query = String(args.query ?? '');
        const category = args.category as string | undefined;
        const result = category
          ? await getKnowledgeByCategory(category, lang)
          : await getRelevantKnowledge(query, lang);
        return result || 'No KB entry matched. Consider escalating or asking a clarifying question.';
      }

      case 'scope_project': {
        return JSON.stringify({
          profile: classifyProfile(args),
          captured: args,
          next: 'Summarise the profile to the visitor briefly, then offer to book a discovery call or capture a lead.',
        });
      }

      case 'estimate_roi': {
        const hours = Number(args.hours_per_week ?? 0);
        const team = Number(args.team_size ?? 1);
        const rate = Number(args.hourly_rate_eur ?? 50);
        const yearly = hours * 48 * team * rate;
        return `Estimated yearly savings: €${Math.round(yearly).toLocaleString('fr-FR')} (${hours}h/week × ${team} people × €${rate}/h × 48 weeks). Present this as an order of magnitude, not a guarantee.`;
      }

      case 'show_case_study': {
        const terms = [args.industry, args.problem_type].filter(Boolean).map(String);
        const kb = await getRelevantKnowledge(terms.join(' ') || 'case study', lang);
        return kb || 'No matching case study in KB. Suggest a discovery call instead.';
      }

      case 'get_methodology': {
        const m = await getKnowledgeByCategory('methodology', lang);
        return m || 'Lucid-Lab methodology: Diagnose → Map → Build → Automate.';
      }

      case 'capture_lead': {
        const email = String(args.email ?? '');
        if (!email || !email.includes('@')) return 'ERROR: valid email required.';
        const projectBrief = String(args.project_brief ?? '').trim();
        if (!projectBrief) return 'ERROR: project_brief required.';

        await captureLead({
          contact,
          email,
          firstName: args.first_name ? String(args.first_name) : undefined,
          company: args.company ? String(args.company) : undefined,
          projectBrief,
          marketingConsent: Boolean(args.marketing_consent),
          conversationId: conversation.id,
        });
        return 'Lead captured and team notified. Thank the visitor and suggest booking a discovery call.';
      }

      case 'list_tidycal_slots': {
        // Fallback when TidyCal API isn't configured — hand out the public URL.
        if (!config.tidycalApiKey || !config.tidycalBookingTypeId) {
          return JSON.stringify({
            mode: 'public_url',
            booking_url: config.tidycalPublicUrl,
            instruction:
              lang === 'fr'
                ? `Partage ce lien au visiteur pour qu'il choisisse son créneau : ${config.tidycalPublicUrl}. TidyCal envoie la confirmation par email. Ne tente pas de réserver pour lui.`
                : `Share this link so the visitor picks a slot: ${config.tidycalPublicUrl}. TidyCal emails the confirmation. Do not attempt to book for them.`,
          });
        }
        const daysAhead = Math.max(1, Math.min(30, Number(args.days_ahead ?? 14)));
        const startsAt = new Date();
        const endsAt = new Date(startsAt.getTime() + daysAhead * 86_400_000);
        const slots = await tidycal.listAvailableTimes(
          config.tidycalBookingTypeId,
          startsAt,
          endsAt,
        );
        if (slots.length === 0) return 'No available slots in that range.';
        // Limit to first 6 slots across next `daysAhead` days
        const top = slots.slice(0, 6).map((s) => ({
          starts_at: s.starts_at,
          human: formatDateTime(s.starts_at, lang),
        }));
        return JSON.stringify({ slots: top, booking_type_id: config.tidycalBookingTypeId });
      }

      case 'book_tidycal_slot': {
        if (!config.tidycalApiKey || !config.tidycalBookingTypeId) {
          return JSON.stringify({
            mode: 'public_url',
            booking_url: config.tidycalPublicUrl,
            instruction:
              lang === 'fr'
                ? `Réservation auto indisponible. Renvoie le visiteur vers ${config.tidycalPublicUrl} pour finaliser lui-même.`
                : `Auto-booking unavailable. Send the visitor to ${config.tidycalPublicUrl} to pick a slot themselves.`,
          });
        }
        const name = String(args.name ?? '').trim();
        const email = String(args.email ?? '').trim();
        const startsAt = String(args.starts_at ?? '').trim();
        if (!name || !email || !startsAt) return 'ERROR: name, email, starts_at required.';

        const booking = await tidycal.createBooking(config.tidycalBookingTypeId, {
          name,
          email,
          starts_at: startsAt,
          timezone: args.timezone ? String(args.timezone) : 'Europe/Paris',
        });
        return `Booking confirmed for ${formatDateTime(booking.starts_at, lang)} (id ${booking.id}). TidyCal has sent the confirmation email.`;
      }

      case 'escalate_to_human': {
        await escalateToHuman(contact, conversation, String(args.reason ?? 'Visitor request'));
        return 'Escalated. Tell the visitor the Lucid-Lab team has been notified and will reply by email within one business day.';
      }

      default:
        return `Unknown tool: ${toolCall.name}`;
    }
  } catch (err) {
    console.error(`[ai] tool ${toolCall.name} failed:`, err);
    return `Tool error: ${(err as Error).message}. Apologize and offer to capture the visitor\'s email for manual follow-up.`;
  }
}

function classifyProfile(args: Record<string, unknown>): string {
  const urgency = String(args.urgency ?? '');
  const budget = String(args.budget_range ?? '');
  if (urgency === 'asap' && (budget === '15k_30k' || budget === '30k_plus')) return 'hot_transformation';
  if (urgency === '3_months') return 'warm_project';
  if (urgency === 'exploring') return 'early_explorer';
  return 'unclassified';
}

// ---------------------------------------------------------------------------
// Main entry — processWithAI
// ---------------------------------------------------------------------------

export interface ProcessResult {
  text: string;
  tokensUsed: number;
}

export async function processWithAI(
  contact: Contact,
  conversation: Conversation,
  recentMessages: Message[],
  userMessage: string,
): Promise<ProcessResult> {
  if (await isBudgetExceeded()) {
    return {
      text:
        contact.language === 'en'
          ? "Sorry — our assistant is temporarily offline. Please email info@lucid-lab.fr and we'll respond within one business day."
          : "Désolé, notre assistant est momentanément indisponible. Écrivez-nous à info@lucid-lab.fr et on revient vers vous sous 24h.",
      tokensUsed: 0,
    };
  }

  const provider = getAIProvider();
  const kbContext = await getRelevantKnowledge(userMessage, contact.language);
  const system = buildSystemPrompt(contact, conversation, kbContext);

  const messages: ChatMessage[] = [{ role: 'system', content: system }];

  // Condensed recent history
  const history = summarizeMessages(recentMessages);
  messages.push(...history);
  messages.push({ role: 'user', content: userMessage });

  let totalTokens = 0;
  let iterations = 8;

  while (iterations-- > 0) {
    const response = await provider.chat(messages, toolDefinitions);
    totalTokens += response.tokensUsed.total;

    if (response.finishReason !== 'tool_calls' || response.toolCalls.length === 0) {
      const text =
        response.text ??
        (contact.language === 'en'
          ? "Sorry, I couldn't process that. How else can I help?"
          : "Désolé, je n'ai pas pu traiter votre demande. Puis-je vous aider autrement ?");

      // Safety net: detect "I've escalated" phrases without actual tool call
      const escalationPhrases = /transmis.*équipe|équipe.*notifié|human.*team|escalated|humaine? va|notified the team/i;
      const wasEscalated = messages.some((m) =>
        m.toolCalls?.some((tc) => tc.name === 'escalate_to_human'),
      );
      if (escalationPhrases.test(text) && !wasEscalated && conversation.status === 'active') {
        await escalateToHuman(contact, conversation, 'Auto-escalation safety net');
      }

      await recordAiUsage(totalTokens);
      return { text, tokensUsed: totalTokens };
    }

    messages.push({
      role: 'assistant',
      content: response.text ?? '',
      toolCalls: response.toolCalls,
    });

    for (const toolCall of response.toolCalls) {
      const result = await executeTool(toolCall, contact, conversation);
      messages.push({ role: 'tool', content: result, toolCallId: toolCall.id });
    }
  }

  await recordAiUsage(totalTokens);
  return {
    text:
      contact.language === 'en'
        ? "I'm having trouble helping right now. The Lucid-Lab team will reach out by email."
        : "Je n'arrive pas à traiter votre demande. L'équipe Lucid-Lab vous contactera par email.",
    tokensUsed: totalTokens,
  };
}

/** Condense long conversations into a summary + last 10 verbatim messages. */
function summarizeMessages(messages: Message[]): ChatMessage[] {
  if (messages.length <= 15) {
    return messages.map((msg) => ({
      role: msg.direction === 'inbound' ? ('user' as const) : ('assistant' as const),
      content:
        typeof msg.content === 'object' && msg.content !== null && 'text' in msg.content
          ? String((msg.content as { text: unknown }).text)
          : JSON.stringify(msg.content),
    }));
  }

  const older = messages.slice(0, -10);
  const recent = messages.slice(-10);

  const summaryParts = older.map((m) => {
    const who = m.direction === 'inbound' ? 'Visitor' : 'Bot';
    const text =
      typeof m.content === 'object' && m.content !== null && 'text' in m.content
        ? String((m.content as { text: unknown }).text)
        : JSON.stringify(m.content);
    return `${who}: ${text.slice(0, 120)}`;
  });

  const out: ChatMessage[] = [
    {
      role: 'user',
      content: `[SUMMARY of ${older.length} earlier messages]\n${summaryParts.join('\n')}\n[END]`,
    },
  ];

  for (const m of recent) {
    const text =
      typeof m.content === 'object' && m.content !== null && 'text' in m.content
        ? String((m.content as { text: unknown }).text)
        : JSON.stringify(m.content);
    out.push({
      role: m.direction === 'inbound' ? 'user' : 'assistant',
      content: text,
    });
  }
  return out;
}
