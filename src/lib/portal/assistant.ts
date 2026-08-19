import 'server-only';

import { config } from '@/lib/bot/config';
import { supabase } from '@/lib/bot/db/supabase';
import { isBudgetExceeded, recordAiUsage } from '@/lib/bot/db/queries/ai-budget';
import {
  getAIProvider,
  type ChatMessage,
  type ToolCall,
  type ToolDefinition,
} from '@/lib/bot/integrations/ai-client';
import { getRelevantKnowledge } from '@/lib/bot/services/knowledge-base';
import type { PortalSession } from './auth';
import { createClientRequest, listPortalRequests } from './requests';
import { portalStrings } from './strings';

/**
 * Assistant SAV du portail client.
 *
 * Reutilise la couche IA du bot du site (provider, budget journalier, base de
 * connaissances) avec un prompt et des outils dedies au service client :
 * repondre aux questions generales, donner le statut des demandes du client,
 * et escalader en creant un ticket (createClientRequest, qui notifie l'equipe
 * par email et Telegram exactement comme un ticket cree au formulaire).
 */

const MAX_MESSAGE_LENGTH = 4000;
const MAX_TOOL_ITERATIONS = 6;
const HISTORY_LIMIT = 20;

const FALLBACK_UNAVAILABLE =
  "Désolé, l'assistant est momentanément indisponible. Créez un ticket depuis la page Support : l'équipe est prévenue immédiatement.";
const FALLBACK_STUCK =
  "Je n'arrive pas à traiter votre demande. Créez un ticket depuis la page Support, ou reformulez votre question.";

export interface PortalAssistantResult {
  reply: string;
  conversationId: string;
  ticket?: { id: string; reference: number };
}

interface ConversationRow {
  id: string;
  status: string;
  escalated_request_id: string | null;
}

async function getOrCreateConversation(
  session: PortalSession,
  conversationId: string | null,
): Promise<ConversationRow | null> {
  if (conversationId) {
    const { data } = await supabase
      .from('portal_conversations')
      .select('id,status,escalated_request_id')
      .eq('organization_id', session.organizationId)
      .eq('client_id', session.clientId)
      .eq('id', conversationId)
      .maybeSingle();
    if (data) return data as ConversationRow;
  }

  const { data, error } = await supabase
    .from('portal_conversations')
    .insert({
      organization_id: session.organizationId,
      client_id: session.clientId,
      contact_id: session.contactId,
      status: 'active',
    })
    .select('id,status,escalated_request_id')
    .single();

  if (error) {
    console.error('[assistant] conversation create failed:', error.message);
    return null;
  }
  return data as ConversationRow;
}

async function insertAssistantMessage(
  conversationId: string,
  session: PortalSession,
  sender: 'client' | 'assistant',
  body: string,
  aiMetadata: Record<string, unknown> | null,
): Promise<void> {
  const { error } = await supabase.from('portal_messages').insert({
    organization_id: session.organizationId,
    client_id: session.clientId,
    conversation_id: conversationId,
    sender,
    body,
    ai_metadata: aiMetadata,
  });
  if (error) console.error('[assistant] message insert failed:', error.message);
}

async function touchConversation(conversationId: string): Promise<void> {
  const { error } = await supabase
    .from('portal_conversations')
    .update({ last_message_at: new Date().toISOString() })
    .eq('id', conversationId);
  if (error) console.error('[assistant] conversation touch failed:', error.message);
}

interface HistoryEntry {
  sender: 'client' | 'assistant';
  body: string;
}

/** Les N derniers messages du fil, du plus ancien au plus recent. */
async function loadRecentMessages(conversationId: string, limit = HISTORY_LIMIT): Promise<HistoryEntry[]> {
  const { data, error } = await supabase
    .from('portal_messages')
    .select('sender,body,created_at')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[assistant] history load failed:', error.message);
    return [];
  }
  return (data ?? [])
    .reverse()
    .map((row) => ({
      sender: row.sender === 'assistant' ? 'assistant' : 'client',
      body: String(row.body ?? ''),
    }));
}

const TOOL_DEFINITIONS: ToolDefinition[] = [
  {
    name: 'get_my_requests',
    description:
      "Liste les tickets et demandes recents du client connecte, avec leur reference, leur statut et leur derniere activite. A utiliser pour toute question du type 'ou en est ma demande'.",
    parameters: { type: 'object', properties: {} },
  },
  {
    name: 'create_ticket',
    description:
      "Cree un ticket de support pour l'equipe Lucid-Lab au nom du client. L'equipe est notifiee immediatement (email et Telegram) et repond par email et sur le portail. A utiliser pour toute question specifique au projet, a la facturation, un bug, un changement a faire, ou quand le client demande un humain.",
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Objet court et precis du ticket' },
        summary: {
          type: 'string',
          description: 'Resume clair du besoin du client, redige a partir de la conversation',
        },
        request_type: {
          type: 'string',
          description: 'Nature du ticket',
          enum: ['question', 'change_request', 'incident'],
        },
        priority: {
          type: 'string',
          description: "Urgence exprimee par le client ('urgent' seulement si c'est bloquant)",
          enum: ['normal', 'urgent'],
        },
      },
      required: ['title', 'summary'],
    },
  },
];

function buildSystemPrompt(session: PortalSession, kbContext: string): string {
  return [
    "Tu es l'assistant du portail client de Lucid-Lab, une agence francaise qui construit des sites web et des solutions d'IA pour ses clients.",
    `Tu parles a ${session.contactName || 'un contact'} de ${session.clientName}, deja client de l'agence, connecte a son espace client securise.`,
    '',
    'Ton role : le service client.',
    '- Reponds en francais, de facon breve, claire et chaleureuse. Jamais de tiret long dans tes reponses.',
    "- Texte simple uniquement : pas de mise en forme markdown (pas d'asterisques, pas de titres), elle s'affiche en brut.",
    '- Tu peux repondre aux questions generales sur Lucid-Lab et ses services grace au contexte ci-dessous.',
    "- Pour toute question sur l'avancement d'une demande deja envoyee, utilise l'outil get_my_requests.",
    "- Tu ne connais pas le detail des projets, de la facturation ni des acces du client : n'invente jamais une information. Dans ces cas, cree un ticket.",
    '',
    "Escalade : utilise l'outil create_ticket des que :",
    '- la question porte sur le projet du client, sa facturation, un bug, une panne ou un changement a realiser ;',
    '- le client demande a parler a un humain ;',
    "- tu n'arrives pas a aider apres deux tentatives.",
    "Si le besoin est flou, pose une question pour le clarifier avant de creer le ticket. Apres creation, donne le numero du ticket et explique que l'equipe vient d'etre prevenue et repondra par email et sur la page Support du portail.",
    `Si c'est urgent et que le client prefere un echange direct, propose aussi ce lien de rendez-vous : ${config.tidycalPublicUrl}`,
    '',
    'Contexte Lucid-Lab :',
    kbContext || '(aucun contexte trouve)',
  ].join('\n');
}

async function executeTool(
  toolCall: ToolCall,
  session: PortalSession,
  conversation: ConversationRow,
  transcript: HistoryEntry[],
  onTicketCreated: (ticket: { id: string; reference: number }) => void,
): Promise<string> {
  try {
    switch (toolCall.name) {
      case 'get_my_requests': {
        const requests = await listPortalRequests(session, 10);
        if (requests.length === 0) return "Le client n'a aucune demande enregistree.";
        const lines = requests.map((request) => {
          const status = portalStrings.requests.statusLabels[request.status] ?? request.status;
          return `#${request.reference} "${request.title}" : ${status} (derniere activite ${request.updatedAt.slice(0, 10)})`;
        });
        return `Demandes du client :\n${lines.join('\n')}`;
      }

      case 'create_ticket': {
        // Un seul ticket par conversation : les suites se passent dans le fil du ticket.
        if (conversation.status === 'escalated' && conversation.escalated_request_id) {
          return 'Un ticket a deja ete cree pour cette conversation. Invite le client a suivre la page Support, ou a repondre dans le fil du ticket existant.';
        }

        const title = String(toolCall.arguments.title ?? '').trim();
        const summary = String(toolCall.arguments.summary ?? '').trim();
        if (!title || !summary) return 'Erreur : title et summary sont requis.';

        const excerpt = transcript
          .slice(-6)
          .map((entry) => `${entry.sender === 'client' ? 'Client' : 'Assistant'} : ${entry.body.slice(0, 300)}`)
          .join('\n');
        const body = `${summary}\n\nTicket cree par l'assistant du portail. Extrait de la conversation :\n${excerpt}`;

        const result = await createClientRequest(
          session,
          {
            requestType: String(toolCall.arguments.request_type ?? 'question'),
            title,
            body,
            priority: String(toolCall.arguments.priority ?? 'normal'),
          },
          { source: 'sav_bot', conversation_id: conversation.id },
        );

        if (!result.ok) return "Erreur : le ticket n'a pas pu etre cree. Excuse-toi et oriente le client vers la page Support.";

        const { error } = await supabase
          .from('portal_conversations')
          .update({ status: 'escalated', escalated_request_id: result.requestId })
          .eq('id', conversation.id);
        if (error) console.error('[assistant] escalation update failed:', error.message);
        conversation.status = 'escalated';
        conversation.escalated_request_id = result.requestId;

        onTicketCreated({ id: result.requestId, reference: result.reference });
        return `Ticket #${result.reference} cree. L'equipe Lucid-Lab vient d'etre notifiee et repondra par email et sur la page Support.`;
      }

      default:
        return `Outil inconnu : ${toolCall.name}`;
    }
  } catch (error) {
    console.error(`[assistant] tool ${toolCall.name} failed:`, error);
    return `Erreur d'outil : ${(error as Error).message}. Excuse-toi et oriente le client vers la page Support.`;
  }
}

export async function runPortalAssistant(
  session: PortalSession,
  input: { conversationId?: string | null; message: string },
): Promise<PortalAssistantResult | null> {
  const message = input.message.trim().slice(0, MAX_MESSAGE_LENGTH);
  if (!message) return null;

  const conversation = await getOrCreateConversation(session, input.conversationId ?? null);
  if (!conversation) return null;

  // Historique charge AVANT d'ecrire le message entrant, pour ne pas le doubler.
  const history = await loadRecentMessages(conversation.id);
  await insertAssistantMessage(conversation.id, session, 'client', message, null);

  const finishTurn = async (reply: string, tokens: number, ticket: { id: string; reference: number } | null) => {
    await insertAssistantMessage(conversation.id, session, 'assistant', reply, {
      model: config.aiModel,
      provider: config.aiProvider,
      tokens,
    });
    await touchConversation(conversation.id);
    if (tokens > 0) await recordAiUsage(tokens);
    return { reply, conversationId: conversation.id, ticket: ticket ?? undefined };
  };

  if (await isBudgetExceeded()) {
    return finishTurn(FALLBACK_UNAVAILABLE, 0, null);
  }

  const provider = getAIProvider();
  const kbContext = await getRelevantKnowledge(message, 'fr');

  const messages: ChatMessage[] = [{ role: 'system', content: buildSystemPrompt(session, kbContext) }];
  for (const entry of history) {
    messages.push({ role: entry.sender === 'client' ? 'user' : 'assistant', content: entry.body });
  }
  messages.push({ role: 'user', content: message });

  const fullTranscript: HistoryEntry[] = [...history, { sender: 'client', body: message }];

  let createdTicket: { id: string; reference: number } | null = null;
  let totalTokens = 0;
  let iterations = MAX_TOOL_ITERATIONS;

  try {
    while (iterations-- > 0) {
      const response = await provider.chat(messages, TOOL_DEFINITIONS);
      totalTokens += response.tokensUsed.total;

      if (response.finishReason !== 'tool_calls' || response.toolCalls.length === 0) {
        const text = response.text ?? FALLBACK_STUCK;
        return await finishTurn(text, totalTokens, createdTicket);
      }

      messages.push({ role: 'assistant', content: response.text ?? '', toolCalls: response.toolCalls });
      for (const toolCall of response.toolCalls) {
        const result = await executeTool(toolCall, session, conversation, fullTranscript, (ticket) => {
          createdTicket = ticket;
        });
        messages.push({ role: 'tool', content: result, toolCallId: toolCall.id });
      }
    }

    return await finishTurn(FALLBACK_STUCK, totalTokens, createdTicket);
  } catch (error) {
    console.error('[assistant] run failed:', error instanceof Error ? error.message : error);
    return await finishTurn(FALLBACK_UNAVAILABLE, totalTokens, createdTicket);
  }
}
