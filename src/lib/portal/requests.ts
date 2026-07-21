import 'server-only';

import { config } from '@/lib/bot/config';
import { supabase } from '@/lib/bot/db/supabase';
import {
  sendPortalClientResponseTeamNotification,
  sendPortalRequestCreatedTeamNotification,
} from '@/lib/bot/integrations/email-client';
import { recordPortalAuditEvent } from './audit';
import type { PortalSession } from './auth';

/** Client-side reads and writes on client_requests, always session-scoped. */

export interface PortalRequest {
  id: string;
  direction: 'agency_to_client' | 'client_to_agency';
  requestType: string;
  status: string;
  title: string;
  body: string | null;
  responseNote: string | null;
  dueAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const CLIENT_CREATABLE_TYPES = new Set(['question', 'change_request']);
const RESPONDABLE_STATUSES = new Set(['open', 'in_progress', 'waiting']);

function normalizePortalRequest(row: Record<string, unknown>): PortalRequest {
  return {
    id: String(row.id),
    direction: row.direction === 'agency_to_client' ? 'agency_to_client' : 'client_to_agency',
    requestType: String(row.request_type ?? 'question'),
    status: String(row.status ?? 'open'),
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
    .select('id,direction,request_type,status,title,body,response_note,due_at,resolved_at,created_at,updated_at')
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
    .select('id,direction,request_type,status,title,body,response_note,due_at,resolved_at,created_at,updated_at')
    .eq('organization_id', session.organizationId)
    .eq('client_id', session.clientId)
    .eq('id', requestId)
    .maybeSingle();

  if (error || !data) return null;
  return normalizePortalRequest(data as Record<string, unknown>);
}

export async function createClientRequest(
  session: PortalSession,
  input: { requestType: string; title: string; body: string },
): Promise<{ ok: true; requestId: string } | { ok: false; error: string }> {
  const title = input.title.trim().slice(0, 200);
  const body = input.body.trim().slice(0, 5000);
  const requestType = CLIENT_CREATABLE_TYPES.has(input.requestType) ? input.requestType : 'question';

  if (!title) return { ok: false, error: 'missing_title' };

  const { data, error } = await supabase
    .from('client_requests')
    .insert({
      organization_id: session.organizationId,
      client_id: session.clientId,
      direction: 'client_to_agency',
      request_type: requestType,
      status: 'open',
      title,
      body: body || null,
      created_by_contact_id: session.contactId,
    })
    .select('id')
    .single();

  if (error) {
    console.error('[portal] createClientRequest failed:', error.message);
    return { ok: false, error: 'insert_failed' };
  }

  try {
    await sendPortalRequestCreatedTeamNotification({
      clientName: session.clientName,
      contactName: session.contactName,
      requestType,
      title,
      body: body || null,
      adminUrl: `${config.adminBaseUrl}/lucid-os/clients/${session.clientSlug}`,
    });
  } catch (emailError) {
    console.error('[portal] team notification failed:', emailError instanceof Error ? emailError.message : emailError);
  }

  await recordPortalAuditEvent({
    organizationId: session.organizationId,
    clientId: session.clientId,
    eventType: 'portal_request_created',
    summary: `Demande client via le portail : ${title}`,
    actorId: session.contactId,
    targetTable: 'client_requests',
    targetId: String(data.id),
    details: { request_type: requestType },
  });

  return { ok: true, requestId: String(data.id) };
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

/** Portal base URL helper kept here for request emails. */
export function portalRequestUrl(requestId: string): string {
  return `${config.portalBaseUrl}/echanges/${requestId}`;
}
