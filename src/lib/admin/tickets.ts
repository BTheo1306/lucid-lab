import 'server-only';

import { config } from '@/lib/bot/config';
import { supabase } from '@/lib/bot/db/supabase';
import { sendPortalRequestAnsweredToClient } from '@/lib/bot/integrations/email-client';
import { recordLucidAuditEvent } from './lucid-os';
import { REQUEST_SELECT, normalizeRequest, type ClientRequestSummary } from './portal';

/**
 * Espace Tickets de l'admin : la file des demandes client vers agence
 * (client_requests, direction client_to_agency) avec leur fil de discussion.
 * Les demandes agence vers client restent gerees depuis la fiche client
 * (RequestsPanel) ; le detail d'un ticket sait toutefois afficher les deux.
 */

export type TicketStatusGroup = 'a_traiter' | 'en_cours' | 'attente' | 'resolus';

export const TICKET_STATUS_GROUPS: Record<TicketStatusGroup, string[]> = {
  a_traiter: ['open'],
  en_cours: ['in_progress'],
  attente: ['waiting'],
  resolus: ['done', 'declined', 'approved', 'changes_requested'],
};

export const TICKET_GROUP_LABELS: Record<TicketStatusGroup, string> = {
  a_traiter: 'À traiter',
  en_cours: 'En cours',
  attente: 'En attente client',
  resolus: 'Résolus',
};

export const TICKET_TYPE_LABELS: Record<string, string> = {
  question: 'Question',
  change_request: 'Modification',
  incident: 'Incident',
  asset_request: 'Éléments à fournir',
  approval: 'Validation',
  info_request: 'Informations',
};

export const TICKET_STATUS_META: Record<string, { label: string; tone: 'neutral' | 'good' | 'warning' | 'danger' }> = {
  open: { label: 'Ouvert', tone: 'warning' },
  in_progress: { label: 'En cours', tone: 'neutral' },
  waiting: { label: 'Attente client', tone: 'neutral' },
  done: { label: 'Résolu', tone: 'good' },
  declined: { label: 'Refusé', tone: 'neutral' },
  approved: { label: 'Approuvé', tone: 'good' },
  changes_requested: { label: 'Modifications demandées', tone: 'warning' },
};

export const TICKET_PRIORITY_META: Record<string, { label: string; tone: 'neutral' | 'good' | 'warning' | 'danger'; rank: number }> = {
  urgent: { label: 'Urgente', tone: 'danger', rank: 0 },
  high: { label: 'Haute', tone: 'warning', rank: 1 },
  normal: { label: 'Normale', tone: 'neutral', rank: 2 },
  low: { label: 'Basse', tone: 'neutral', rank: 3 },
};

const STATUS_RANK: Record<string, number> = {
  open: 0,
  in_progress: 1,
  waiting: 2,
  done: 3,
  declined: 3,
  approved: 3,
  changes_requested: 3,
};

export interface TicketMessage {
  id: string;
  sender: 'client' | 'team';
  authorLabel: string | null;
  contactName: string | null;
  body: string;
  createdAt: string;
}

/** File des tickets, tries : a traiter d'abord, puis priorite, puis activite. */
export async function listTickets(options: {
  group?: TicketStatusGroup | null;
  clientId?: string | null;
  limit?: number;
} = {}): Promise<ClientRequestSummary[]> {
  let query = supabase
    .from('client_requests')
    .select(REQUEST_SELECT)
    .eq('direction', 'client_to_agency')
    .order('updated_at', { ascending: false })
    .limit(options.limit ?? 200);

  if (options.group) query = query.in('status', TICKET_STATUS_GROUPS[options.group]);
  if (options.clientId) query = query.eq('client_id', options.clientId);

  const { data, error } = await query;
  if (error) throw new Error(`listTickets: ${error.message}`);

  const tickets = (data ?? []).map((row) => normalizeRequest(row as Record<string, unknown>));
  return tickets.sort((a, b) => {
    const statusDelta = (STATUS_RANK[a.status] ?? 9) - (STATUS_RANK[b.status] ?? 9);
    if (statusDelta !== 0) return statusDelta;
    const priorityDelta = (TICKET_PRIORITY_META[a.priority]?.rank ?? 9) - (TICKET_PRIORITY_META[b.priority]?.rank ?? 9);
    if (priorityDelta !== 0) return priorityDelta;
    return b.updatedAt.localeCompare(a.updatedAt);
  });
}

async function countTicketStatuses(statuses: string[]): Promise<number> {
  const { count, error } = await supabase
    .from('client_requests')
    .select('id', { count: 'exact', head: true })
    .eq('direction', 'client_to_agency')
    .in('status', statuses);
  if (error) {
    console.error('[tickets] count failed:', error.message);
    return 0;
  }
  return count ?? 0;
}

export async function countTicketGroups(): Promise<Record<TicketStatusGroup, number>> {
  const [aTraiter, enCours, attente, resolus] = await Promise.all([
    countTicketStatuses(TICKET_STATUS_GROUPS.a_traiter),
    countTicketStatuses(TICKET_STATUS_GROUPS.en_cours),
    countTicketStatuses(TICKET_STATUS_GROUPS.attente),
    countTicketStatuses(TICKET_STATUS_GROUPS.resolus),
  ]);
  return { a_traiter: aTraiter, en_cours: enCours, attente, resolus };
}

/** Badge de la sidebar : tickets ouverts (a traiter). Ne throw jamais. */
export async function countOpenTickets(): Promise<number> {
  try {
    return await countTicketStatuses(TICKET_STATUS_GROUPS.a_traiter);
  } catch (error) {
    console.error('[tickets] countOpenTickets failed:', error instanceof Error ? error.message : error);
    return 0;
  }
}

export async function getTicketDetail(requestId: string): Promise<{
  ticket: ClientRequestSummary;
  organizationId: string;
  messages: TicketMessage[];
} | null> {
  const { data, error } = await supabase
    .from('client_requests')
    .select(`${REQUEST_SELECT},organization_id`)
    .eq('id', requestId)
    .maybeSingle();

  if (error) throw new Error(`getTicketDetail: ${error.message}`);
  if (!data) return null;

  const { data: messageRows, error: messagesError } = await supabase
    .from('client_request_messages')
    .select('id,sender,author_label,body,created_at,contact:client_contacts(full_name)')
    .eq('request_id', requestId)
    .order('created_at', { ascending: true })
    .limit(200);

  if (messagesError) throw new Error(`getTicketDetail messages: ${messagesError.message}`);

  const messages: TicketMessage[] = (messageRows ?? []).map((row) => {
    const contact = (row.contact ?? null) as { full_name?: string } | null;
    return {
      id: String(row.id),
      sender: row.sender === 'team' ? 'team' : 'client',
      authorLabel: row.author_label ? String(row.author_label) : null,
      contactName: contact?.full_name ? String(contact.full_name) : null,
      body: String(row.body ?? ''),
      createdAt: String(row.created_at ?? ''),
    };
  });

  return {
    ticket: normalizeRequest(data as Record<string, unknown>),
    organizationId: String((data as Record<string, unknown>).organization_id ?? ''),
    messages,
  };
}

export type TicketReplyStatus = 'waiting' | 'in_progress' | 'done' | 'declined';

/**
 * Reponse de l'equipe sur un ticket : message optionnel dans le fil + statut.
 * "Repondre" passe le ticket en waiting (au client de reagir), "Prendre en
 * charge" en in_progress, "Resoudre"/"Refuser" le clot.
 */
export async function replyToTicket(input: {
  requestId: string;
  status: TicketReplyStatus;
  body?: string | null;
}): Promise<void> {
  const body = input.body?.trim().slice(0, 5000) || null;
  const resolved = input.status === 'done' || input.status === 'declined';

  const update: Record<string, unknown> = {
    status: input.status,
    resolved_at: resolved ? new Date().toISOString() : null,
  };
  // response_note reste le miroir de la derniere note de l'equipe.
  if (body) update.response_note = body;

  const { data, error } = await supabase
    .from('client_requests')
    .update(update)
    .eq('id', input.requestId)
    .eq('direction', 'client_to_agency')
    .select('id,reference,title,client_id,organization_id,created_by_contact_id')
    .maybeSingle();

  if (error) throw new Error(`replyToTicket: ${error.message}`);
  if (!data) throw new Error('Ticket introuvable.');

  if (body) {
    const { error: messageError } = await supabase.from('client_request_messages').insert({
      organization_id: String(data.organization_id),
      client_id: String(data.client_id),
      request_id: String(data.id),
      sender: 'team',
      author_label: 'Lucid-Lab',
      body,
    });
    if (messageError) {
      console.error('[tickets] replyToTicket message insert failed:', messageError.message);
    }
  }

  if (data.created_by_contact_id) {
    const { data: contact } = await supabase
      .from('client_contacts')
      .select('full_name,email')
      .eq('id', data.created_by_contact_id)
      .maybeSingle();

    if (contact?.email) {
      try {
        await sendPortalRequestAnsweredToClient({
          to: String(contact.email),
          contactName: contact.full_name ? String(contact.full_name) : null,
          title: String(data.title),
          status: input.status,
          responseNote: body,
          portalUrl: `${config.portalBaseUrl}/echanges/${String(data.id)}`,
          reference: Number(data.reference ?? 0) || null,
        });
      } catch (emailError) {
        console.error('[tickets] client email failed:', emailError instanceof Error ? emailError.message : emailError);
      }
    }
  }

  await recordLucidAuditEvent({
    clientId: String(data.client_id),
    actorType: 'admin',
    eventType: 'portal_ticket_answered',
    targetTable: 'client_requests',
    targetId: String(data.id),
    summary: `Ticket #${Number(data.reference)} traite (${input.status}) : ${String(data.title)}`,
    details: { status: input.status, with_message: Boolean(body) },
  });
}

const TICKET_PRIORITIES = new Set(['low', 'normal', 'high', 'urgent']);

export async function setTicketPriority(requestId: string, priority: string): Promise<void> {
  if (!TICKET_PRIORITIES.has(priority)) throw new Error(`Priorite inconnue : ${priority}`);

  const { data, error } = await supabase
    .from('client_requests')
    .update({ priority })
    .eq('id', requestId)
    .eq('direction', 'client_to_agency')
    .select('id,reference,title,client_id')
    .maybeSingle();

  if (error) throw new Error(`setTicketPriority: ${error.message}`);
  if (!data) throw new Error('Ticket introuvable.');

  await recordLucidAuditEvent({
    clientId: String(data.client_id),
    actorType: 'admin',
    eventType: 'portal_ticket_priority_changed',
    targetTable: 'client_requests',
    targetId: String(data.id),
    summary: `Priorite du ticket #${Number(data.reference)} passee a ${priority} : ${String(data.title)}`,
    details: { priority },
  });
}

export interface DigestTicket {
  reference: number;
  title: string;
  clientName: string | null;
  createdAt: string;
}

/** Les plus vieux tickets encore ouverts, pour le digest du matin. */
export async function listOpenTicketsForDigest(limit = 5): Promise<DigestTicket[]> {
  const { data, error } = await supabase
    .from('client_requests')
    .select('reference,title,created_at,client:clients(name)')
    .eq('direction', 'client_to_agency')
    .in('status', ['open', 'in_progress', 'waiting'])
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) throw new Error(`listOpenTicketsForDigest: ${error.message}`);

  return (data ?? []).map((row) => {
    const client = (row.client ?? null) as { name?: string } | null;
    return {
      reference: Number(row.reference ?? 0),
      title: String(row.title ?? ''),
      clientName: client?.name ? String(client.name) : null,
      createdAt: String(row.created_at ?? ''),
    };
  });
}

/** Nombre total de tickets encore ouverts (open, in_progress, waiting). */
export async function countOpenTicketsForDigest(): Promise<number> {
  return countTicketStatuses(['open', 'in_progress', 'waiting']);
}
