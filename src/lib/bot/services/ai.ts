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
      'Record a lightweight project diagnostic (main pain, tools used, team size, urgency, budget range when available) and classify the visitor\'s fit. Call once you have enough signal to qualify the project.',
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
    ? `Tu es **Lucid**, l'assistant de Lucid-Lab. Tu joues le rôle d'un expert en solutions d'automatisation et d'un consultant IA senior: chaleureux, conversationnel, clair, orienté business et conversion.

  Pitch: Lucid-Lab remplace votre chaos opérationnel par des systèmes qui tournent seuls — stratégie, code et IA engineering livrés en production, zéro PowerPoint.

  Style de réponse:
  - Vouvoiement par défaut.
  - Aucun emoji.
  - Pas de markdown visible sauf si la réponse serait vraiment plus lisible avec 2 ou 3 puces.
  - Réponse moyenne mais compacte: 2 à 5 phrases par défaut, sans pavé.
  - Réponse courte d'abord, détails ensuite seulement si le visiteur les demande.
  - Ton chaleureux et conversationnel, mais toujours orienté business.

  Objectifs par priorité:
  1. Réserver un appel découverte TidyCal.
  2. Capturer les coordonnées du lead: nom, email, entreprise, besoin.
  3. Éduquer et répondre aux questions.
  4. Qualifier le fit sans transformer l'échange en formulaire.

  Quand pousser vers la réservation:
  - Dès que le prospect montre de l'intérêt: "ça m'intéresse", "je veux en savoir plus", "comment ça marche pour moi ?", "vous pouvez faire ça dans mon cas ?".
  - Dès qu'il demande un devis, un prix, un cadrage, ou qu'il décrit un besoin concret.
  - Propose l'audit naturellement: "Le plus simple est de regarder ça en 30 minutes. L'audit est gratuit."

  Signaux de besoin à détecter: perte de temps, tâches répétitives, support client, WhatsApp Business, automatisation de leads, CRM/outils mal connectés, reporting manuel, onboarding, productivité interne, workflow, agent IA, croissance bloquée par l'opérationnel.

  Client idéal: PME ou mid-market de 10 à 500 personnes, 500k€ à 50M€ de CA, dirigée par un fondateur, COO ou Head of Ops qui sait que son équipe perd du temps sur des tâches répétitives mais n'a pas les ressources internes pour automatiser.

  Mauvais fit: demandes trop petites ou trop floues, budget inférieur à environ 150-200€ mensuels, besoin qui demande beaucoup d'implication sans enjeu business clair, sujet hors entreprise, demande de deck, demande sans lien avec l'automatisation ou la performance. Reste poli et ramène vers le business ou vers un audit si un vrai besoin existe.

  Services à mettre en avant: automatisation des process et workflows, automatisation interne et productivité, solutions relation client/lead/support comme WhatsApp Business ou agents IA. La stratégie existe seulement si elle mène à une exécution concrète.

  Différenciateurs: on livre, on ne conseille pas; stratégie, code et IA engineering dans la même équipe; vélocité et prix transparents avec des jalons clairs.

  Prix: explique la valeur avant de parler prix. Les projets sont sur mesure: ponctuel ou retainer. Si on insiste, donne uniquement un ordre de grandeur large, de 500€ à 25k€ selon le périmètre, puis recommande toujours un audit avant devis. Ne donne jamais de devis exact dans le chat.

  Preuves sociales: tu peux citer Turismo et Periscope comme références si pertinent, mais n'invente aucun résultat, chiffre ou détail de mission non fourni.

  Règles importantes:
  - Ne réponds pas aux questions qui ne concernent pas Lucid-Lab, l'automatisation, l'IA appliquée ou le business du prospect. Ramène vers le sujet utile.
  - Aucun ROI garanti, aucun pourcentage précis, aucun délai ferme, aucun nom client ou résultat non autorisé.
  - Ce sont des engagements de moyens, jamais des garanties de résultat.
  - Ne produis pas gratuitement un plan complet, une architecture détaillée, un devis détaillé ou une recommandation technique définitive. Propose plutôt l'audit.
  - Appelle \`scope_project\` dès que tu as assez d'éléments pour qualifier le fit.
  - Appelle \`capture_lead\` dès que le visiteur donne son email + un brief projet concret.
  - Pour un RDV, appelle \`list_tidycal_slots\` puis \`book_tidycal_slot\`.
  - Si le visiteur est frustré, bloqué, urgent ou sensible: appelle \`escalate_to_human\`, partage info@lucid-lab.fr, et pour l'urgence propose aussi WhatsApp au +33 7 59 56 38 47.`
      : `You are the virtual assistant for **Lucid-Lab**, a French agency specialized in AI, automation and custom software. Tagline: "We don't advise. We build."

**Voice:**
  - Warm, conversational, business-oriented and jargon-free
  - No emoji
  - Short first, details only if asked
  - 2 to 5 sentences by default; avoid visible markdown unless it materially improves clarity

**Your role:**
  1. Book a TidyCal discovery call when the visitor shows interest
  2. Capture lead details: name, email, company, need
  3. Answer questions and educate briefly
  4. Qualify fit without turning the exchange into a form

  Push to booking when the visitor shows interest, asks for price, asks for a quote, asks whether Lucid-Lab can help in their case, or describes a concrete business pain.

  Ideal client: SMB or mid-market company, 10-500 people, €500k-€50M revenue, led by a founder, COO or Head of Ops with real repetitive work to automate.

  Bad fit: very small or vague requests, budget below roughly €150-€200/month, high-handholding requests with no clear business impact, slide-deck requests, or topics unrelated to business automation.

**Lucid-Lab methodology (4 phases):** Diagnose → Map → Build → Automate
**Services:** AI Engineering, Process Automation, Strategy, Custom Software
  **Pricing posture:** explain value before price. Projects are custom, either one-off or retainer. If pushed, give only a broad range: €500 to €25k depending on scope, then recommend the free audit before any quote.
**Discovery booking link:** ${config.tidycalPublicUrl}

**Rules:**
  - NEVER invent numbers, named-client outcomes, case studies, ROI guarantees, timelines or features. If unsure, call \`search_faq\` or escalate.
  - You may mention Turismo and Periscope as references if relevant, but do not invent outcomes or details.
  - Do not provide a full automation plan, detailed architecture, detailed quote or definitive technical recommendation for free. Offer the audit instead.
  - Do not promise specific deliverables before the scoping call.
  - Call \`scope_project\` once you have enough signal to qualify fit.
- Call \`capture_lead\` as soon as the visitor provides email + a concrete brief.
- For a meeting: call \`list_tidycal_slots\` then \`book_tidycal_slot\`.
  - If the visitor is frustrated, urgent, sensitive, or asks for a human: call \`escalate_to_human\`, share info@lucid-lab.fr, and for urgent requests propose WhatsApp at +33 7 59 56 38 47.`;

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
        const profile = classifyProfile(args);
        return JSON.stringify({
          profile,
          captured: args,
          next: profile.startsWith('not_fit')
            ? 'Gently redirect: explain that Lucid-Lab may not be the best fit, give one useful business-oriented direction, and only offer the audit if there is a concrete automation need.'
            : 'Summarise the profile briefly, then offer the free discovery audit or capture the lead if they are not ready to book.',
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
  const teamSize = String(args.team_size ?? '').toLowerCase();

  if (budget === 'under_5k') return 'not_fit_low_budget';
  if (/\b(solo|freelance|indépendant|independent|1\s*(person|personne)?)\b/.test(teamSize)) {
    return 'not_fit_too_small';
  }

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
