import 'server-only';

import { config } from '@/lib/bot/config';
import { supabase } from '@/lib/bot/db/supabase';
import {
  sendPortalClientMessageTeamNotification,
  sendPortalClientResponseTeamNotification,
  sendPortalRequestCreatedTeamNotification,
} from '@/lib/bot/integrations/email-client';
import { sendTeamTelegramNotification } from '@/lib/bot/integrations/telegram-notify';
import { recordPortalAuditEvent } from './audit';
import type { PortalSession } from './auth';
import { portalStrings } from './strings';

/** Client-side reads and writes on client_requests, always session-scoped. */

export interface PortalRequest {
  id: string;
  reference: number;
  direction: 'agency_to_client' | 'client_to_agency';
  requestType: string;
  status: string;
  priority: string;
  title: string;
  body: string | null;
  responseNote: string | null;
  dueAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PortalRequestMessage {
  id: string;
  sender: 'client' | 'team';
  authorLabel: string | null;
  body: string;
  createdAt: string;
}

const CLIENT_CREATABLE_TYPES = new Set(['question', 'change_request', 'incident']);
/** Le client choisit seulement entre normal et urgent ; l'equipe affine ensuite. */
const CLIENT_CREATABLE_PRIORITIES = new Set(['normal', 'urgent']);
const RESPONDABLE_STATUSES = new Set(['open', 'in_progress', 'waiting']);

const PORTAL_REQUEST_SELECT =
  'id,reference,direction,request_type,status,priority,title,body,response_note,due_at,resolved_at,created_at,updated_at';

function normalizePortalRequest(row: Record<string, unknown>): PortalRequest {
  return {
    id: String(row.id),
    reference: Number(row.reference ?? 0),
    direction: row.direction === 'agency_to_client' ? 'agency_to_client' : 'client_to_agency',
    requestType: String(row.request_type ?? 'question'),
    status: String(row.status ?? 'open'),
    priority: String(row.priority ?? 'normal'),
    title: String(row.title ?? ''),
    body: row.body ? String(row.body) : null,
    responseNote: row.response_note ? String(row.response_note) : null,
    dueAt: row.due_at ? String(row.due_at) : null,
    resolvedAt: row.resolved_at ? String(row.resolved_at) : null,
    createdAt: String(row.created_at ?? ''),
    updatedAt: String(row.updated_at ?? ''),
  };
}

export async function listPortalRequests(session: PortalSession, limit = 50): Promise<PortalRequest[]> {
  const { data, error } = await supabase
    .from('client_requests')
    .select(PORTAL_REQUEST_SELECT)
    .eq('organization_id', session.organizationId)
    .eq('client_id', session.clientId)
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[portal] listPortalRequests failed:', error.message);
    return [];
  }
  return (data ?? []).map((row) => normalizePortalRequest(row as Record<string, unknown>));
}

export async function getPortalRequest(session: PortalSession, requestId: string): Promise<PortalRequest | null> {
  const { data, error } = await supabase
    .from('client_requests')
    .select(PORTAL_REQUEST_SELECT)
    .eq('organization_id', session.organizationId)
    .eq('client_id', session.clientId)
    .eq('id', requestId)
    .maybeSingle();

  if (error || !data) return null;
  return normalizePortalRequest(data as Record<string, unknown>);
}

/** Thread of one request, oldest first. The opening post stays request.body. */
export async function listPortalRequestMessages(
  session: PortalSession,
  requestId: string,
): Promise<PortalRequestMessage[]> {
  const { data, error } = await supabase
    .from('client_request_messages')
    .select('id,sender,author_label,body,created_at')
    .eq('organization_id', session.organizationId)
    .eq('client_id', session.clientId)
    .eq('request_id', requestId)
    .order('created_at', { ascending: true })
    .limit(200);

  if (error) {
    console.error('[portal] listPortalRequestMessages failed:', error.message);
    return [];
  }
  return (data ?? []).map((row) => ({
    id: String(row.id),
    sender: row.sender === 'team' ? 'team' : 'client',
    authorLabel: row.author_label ? String(row.author_label) : null,
    body: String(row.body ?? ''),
    createdAt: String(row.created_at ?? ''),
  }));
}

function ticketAdminUrl(requestId: string): string {
  return `${config.adminBaseUrl}/lucid-os/tickets/${requestId}`;
}

const TELEGRAM_PRIORITY_LABELS: Record<string, string> = {
  low: 'basse',
  normal: 'normale',
  high: 'haute',
  urgent: 'URGENTE',
};

export async function createClientRequest(
  session: PortalSession,
  input: { requestType: string; title: string; body: string; priority?: string },
  /** Valeurs structurées portées par la demande, par exemple des informations à valider. */
  metadata?: Record<string, unknown>,
): Promise<{ ok: true; requestId: string; reference: number } | { ok: false; error: string }> {
  const title = input.title.trim().slice(0, 200);
  const body = input.body.trim().slice(0, 5000);
  const requestType = CLIENT_CREATABLE_TYPES.has(input.requestType) ? input.requestType : 'question';
  const priority = input.priority && CLIENT_CREATABLE_PRIORITIES.has(input.priority) ? input.priority : 'normal';

  if (!title) return { ok: false, error: 'missing_title' };

  const { data, error } = await supabase
    .from('client_requests')
    .insert({
      organization_id: session.organizationId,
      client_id: session.clientId,
      direction: 'client_to_agency',
      request_type: requestType,
      status: 'open',
      priority,
      title,
      body: body || null,
      created_by_contact_id: session.contactId,
      metadata: metadata ?? {},
    })
    .select('id,reference')
    .single();

  if (error) {
    console.error('[portal] createClientRequest failed:', error.message);
    return { ok: false, error: 'insert_failed' };
  }

  const requestId = String(data.id);
  const reference = Number(data.reference ?? 0);

  try {
    await sendPortalRequestCreatedTeamNotification({
      clientName: session.clientName,
      contactName: session.contactName,
      requestType,
      title,
      body: body || null,
      adminUrl: ticketAdminUrl(requestId),
      reference,
      priority,
    });
  } catch (emailError) {
    console.error('[portal] team notification failed:', emailError instanceof Error ? emailError.message : emailError);
  }

  await sendTeamTelegramNotification(
    [
      `Nouveau ticket #${reference} (priorite ${TELEGRAM_PRIORITY_LABELS[priority] ?? priority})`,
      `${session.clientName} : ${title}`,
      `Par ${session.contactName || 'un contact du portail'}`,
      ticketAdminUrl(requestId),
    ].join('\n'),
  );

  await recordPortalAuditEvent({
    organizationId: session.organizationId,
    clientId: session.clientId,
    eventType: 'portal_request_created',
    summary: `Demande client via le portail : #${reference} ${title}`,
    actorId: session.contactId,
    targetTable: 'client_requests',
    targetId: requestId,
    details: { request_type: requestType, priority, reference },
  });

  return { ok: true, requestId, reference };
}

/**
 * Message libre du client dans le fil d'une demande, quelle que soit la
 * direction. Sur un ticket client vers agence, le statut repasse a open :
 * toute reponse du client remet le ticket dans la file a traiter. Sur une
 * demande agence vers client, le statut ne bouge pas mais l'UPDATE (meme
 * valeur) rafraichit updated_at via le trigger.
 */
export async function addClientMessage(
  session: PortalSession,
  requestId: string,
  rawBody: string,
): Promise<{ ok: boolean }> {
  const body = rawBody.trim().slice(0, 5000);
  if (!body) return { ok: false };

  const request = await getPortalRequest(session, requestId);
  if (!request || !RESPONDABLE_STATUSES.has(request.status)) return { ok: false };

  const { error: messageError } = await supabase.from('client_request_messages').insert({
    organization_id: session.organizationId,
    client_id: session.clientId,
    request_id: requestId,
    sender: 'client',
    contact_id: session.contactId,
    author_label: session.contactName || null,
    body,
  });

  if (messageError) {
    console.error('[portal] addClientMessage failed:', messageError.message);
    return { ok: false };
  }

  const nextStatus = request.direction === 'client_to_agency' ? 'open' : request.status;
  const { error: statusError } = await supabase
    .from('client_requests')
    .update({ status: nextStatus, resolved_at: null })
    .eq('organization_id', session.organizationId)
    .eq('client_id', session.clientId)
    .eq('id', requestId);
  if (statusError) {
    console.error('[portal] addClientMessage status update failed:', statusError.message);
  }

  try {
    await sendPortalClientMessageTeamNotification({
      clientName: session.clientName,
      contactName: session.contactName,
      title: request.title,
      body,
      adminUrl: ticketAdminUrl(requestId),
      reference: request.reference,
    });
  } catch (emailError) {
    console.error('[portal] team notification failed:', emailError instanceof Error ? emailError.message : emailError);
  }

  await sendTeamTelegramNotification(
    [
      `Message client sur le ticket #${request.reference}`,
      `${session.clientName} : ${request.title}`,
      ticketAdminUrl(requestId),
    ].join('\n'),
  );

  await recordPortalAuditEvent({
    organizationId: session.organizationId,
    clientId: session.clientId,
    eventType: 'portal_request_message',
    summary: `Message client sur la demande #${request.reference} : ${request.title}`,
    actorId: session.contactId,
    targetTable: 'client_requests',
    targetId: requestId,
    details: { reference: request.reference },
  });

  return { ok: true };
}

/** Le client marque son propre ticket comme resolu. */
export async function resolveOwnRequest(session: PortalSession, requestId: string): Promise<{ ok: boolean }> {
  const { data, error } = await supabase
    .from('client_requests')
    .update({ status: 'done', resolved_at: new Date().toISOString() })
    .eq('organization_id', session.organizationId)
    .eq('client_id', session.clientId)
    .eq('id', requestId)
    .eq('direction', 'client_to_agency')
    .in('status', Array.from(RESPONDABLE_STATUSES))
    .select('id,title,reference');

  if (error) {
    console.error('[portal] resolveOwnRequest failed:', error.message);
    return { ok: false };
  }
  const updated = data?.[0] as { id: string; title: string; reference: number } | undefined;
  if (!updated) return { ok: false };

  try {
    await sendPortalClientResponseTeamNotification({
      clientName: session.clientName,
      contactName: session.contactName,
      title: `#${Number(updated.reference)} ${String(updated.title)}`,
      status: 'done',
      note: null,
      adminUrl: ticketAdminUrl(requestId),
    });
  } catch (emailError) {
    console.error('[portal] team notification failed:', emailError instanceof Error ? emailError.message : emailError);
  }

  await recordPortalAuditEvent({
    organizationId: session.organizationId,
    clientId: session.clientId,
    eventType: 'portal_request_resolved_by_client',
    summary: `Ticket #${Number(updated.reference)} marque comme resolu par le client : ${String(updated.title)}`,
    actorId: session.contactId,
    targetTable: 'client_requests',
    targetId: requestId,
  });

  return { ok: true };
}

/**
 * Client answer on an agency request: approve, mark done, or ask for changes.
 * Scoped update: the WHERE clause carries client and direction, so a foreign
 * request id can never be mutated.
 */
export async function respondToAgencyRequest(
  session: PortalSession,
  requestId: string,
  input: { action: 'approve' | 'done' | 'changes'; note: string },
): Promise<{ ok: boolean }> {
  const note = input.note.trim().slice(0, 5000);
  const status = input.action === 'approve' ? 'approved' : input.action === 'done' ? 'done' : 'changes_requested';
  if (input.action === 'changes' && !note) return { ok: false };

  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from('client_requests')
    .update({
      status,
      response_note: note || null,
      responded_by_contact_id: session.contactId,
      resolved_at: input.action === 'changes' ? null : nowIso,
    })
    .eq('organization_id', session.organizationId)
    .eq('client_id', session.clientId)
    .eq('id', requestId)
    .eq('direction', 'agency_to_client')
    .in('status', Array.from(RESPONDABLE_STATUSES))
    .select('id,title,request_type');

  if (error) {
    console.error('[portal] respondToAgencyRequest failed:', error.message);
    return { ok: false };
  }
  const updated = data?.[0] as { id: string; title: string; request_type: string } | undefined;
  if (!updated) return { ok: false };

  // La reponse rejoint aussi le fil de discussion.
  if (note) {
    const { error: messageError } = await supabase.from('client_request_messages').insert({
      organization_id: session.organizationId,
      client_id: session.clientId,
      request_id: requestId,
      sender: 'client',
      contact_id: session.contactId,
      author_label: session.contactName || null,
      body: note,
    });
    if (messageError) {
      console.error('[portal] respondToAgencyRequest message insert failed:', messageError.message);
    }
  }

  try {
    await sendPortalClientResponseTeamNotification({
      clientName: session.clientName,
      contactName: session.contactName,
      title: String(updated.title),
      status,
      note: note || null,
      adminUrl: `${config.adminBaseUrl}/lucid-os/clients/${session.clientSlug}`,
    });
  } catch (emailError) {
    console.error('[portal] team notification failed:', emailError instanceof Error ? emailError.message : emailError);
  }

  await recordPortalAuditEvent({
    organizationId: session.organizationId,
    clientId: session.clientId,
    eventType: 'portal_request_response',
    summary: `Réponse client (${status}) : ${String(updated.title)}`,
    actorId: session.contactId,
    targetTable: 'client_requests',
    targetId: requestId,
    riskLevel: 'medium',
    details: { action: input.action, note: note || null },
  });

  return { ok: true };
}

/** Libelle d'auteur d'un message du fil, cote portail. */
export function portalMessageAuthorLabel(message: PortalRequestMessage): string {
  if (message.sender === 'team') return portalStrings.brand;
  return message.authorLabel || portalStrings.requests.you;
}

/** Portal base URL helper kept here for request emails. */
export function portalRequestUrl(requestId: string): string {
  return `${config.portalBaseUrl}/echanges/${requestId}`;
}
