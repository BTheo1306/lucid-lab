import 'server-only';

import { config } from '@/lib/bot/config';
import { supabase } from '@/lib/bot/db/supabase';
import {
  sendPortalInvite,
  sendPortalRequestAnsweredToClient,
  sendPortalRequestToClient,
} from '@/lib/bot/integrations/email-client';
import { PORTAL_INVITE_TOKEN_TTL_MS, generatePortalToken } from '@/lib/portal/auth';
import { ensureLucidOrganizationId, recordLucidAuditEvent } from './lucid-os';

/** Agency-side management of the client portal (access, invites, visibility). */

export interface PortalContactAccess {
  id: string;
  fullName: string;
  email: string | null;
  isPrimary: boolean;
  portalAccess: boolean;
  portalInvitedAt: string | null;
  portalLastLoginAt: string | null;
}

interface PortalContactRow {
  id: string;
  client_id: string;
  organization_id: string;
  full_name: string | null;
  email: string | null;
  is_primary: boolean;
  portal_access: boolean;
  portal_invited_at: string | null;
  portal_last_login_at: string | null;
  client: { id: string; name: string; slug: string; status: string } | null;
}

export async function listPortalContactsForClient(clientId: string): Promise<PortalContactAccess[]> {
  const { data, error } = await supabase
    .from('client_contacts')
    .select('id,full_name,email,is_primary,portal_access,portal_invited_at,portal_last_login_at')
    .eq('client_id', clientId)
    .neq('status', 'archived')
    .order('is_primary', { ascending: false })
    .order('updated_at', { ascending: false })
    .limit(20);

  if (error) throw new Error(`listPortalContactsForClient: ${error.message}`);

  return (data ?? []).map((row) => ({
    id: String(row.id),
    fullName: String(row.full_name ?? ''),
    email: row.email ? String(row.email) : null,
    isPrimary: Boolean(row.is_primary),
    portalAccess: Boolean(row.portal_access),
    portalInvitedAt: row.portal_invited_at ? String(row.portal_invited_at) : null,
    portalLastLoginAt: row.portal_last_login_at ? String(row.portal_last_login_at) : null,
  }));
}

async function getPortalContact(contactId: string): Promise<PortalContactRow> {
  const { data, error } = await supabase
    .from('client_contacts')
    .select('id,client_id,organization_id,full_name,email,is_primary,portal_access,portal_invited_at,portal_last_login_at,client:clients(id,name,slug,status)')
    .eq('id', contactId)
    .maybeSingle();

  if (error) throw new Error(`getPortalContact: ${error.message}`);
  if (!data) throw new Error('Contact introuvable.');
  return data as unknown as PortalContactRow;
}

export async function setContactPortalAccess(contactId: string, enabled: boolean): Promise<void> {
  const contact = await getPortalContact(contactId);

  const { error } = await supabase
    .from('client_contacts')
    .update({ portal_access: enabled })
    .eq('id', contactId);

  if (error) throw new Error(`setContactPortalAccess: ${error.message}`);

  await recordLucidAuditEvent({
    clientId: contact.client_id,
    actorType: 'admin',
    eventType: enabled ? 'portal_access_enabled' : 'portal_access_disabled',
    targetTable: 'client_contacts',
    targetId: contact.id,
    summary: `${enabled ? 'Accès portail activé' : 'Accès portail désactivé'} pour ${contact.full_name ?? contact.email ?? contact.id}`,
  });
}

export interface ClientRequestSummary {
  id: string;
  clientId: string;
  direction: 'agency_to_client' | 'client_to_agency';
  requestType: string;
  status: string;
  title: string;
  body: string | null;
  responseNote: string | null;
  createdByContactName: string | null;
  clientName: string | null;
  clientSlug: string | null;
  dueAt: string | null;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const REQUEST_SELECT =
  'id,client_id,direction,request_type,status,title,body,response_note,due_at,resolved_at,created_at,updated_at,client:clients(name,slug),created_by:client_contacts!client_requests_created_by_contact_id_fkey(full_name)';

function normalizeRequest(row: Record<string, unknown>): ClientRequestSummary {
  const client = (row.client ?? null) as { name?: string; slug?: string } | null;
  const createdBy = (row.created_by ?? null) as { full_name?: string } | null;

  return {
    id: String(row.id),
    clientId: String(row.client_id),
    direction: row.direction === 'agency_to_client' ? 'agency_to_client' : 'client_to_agency',
    requestType: String(row.request_type ?? 'question'),
    status: String(row.status ?? 'open'),
    title: String(row.title ?? ''),
    body: row.body ? String(row.body) : null,
    responseNote: row.response_note ? String(row.response_note) : null,
    createdByContactName: createdBy?.full_name ? String(createdBy.full_name) : null,
    clientName: client?.name ? String(client.name) : null,
    clientSlug: client?.slug ? String(client.slug) : null,
    dueAt: row.due_at ? String(row.due_at) : null,
    resolvedAt: row.resolved_at ? String(row.resolved_at) : null,
    createdAt: String(row.created_at ?? ''),
    updatedAt: String(row.updated_at ?? ''),
  };
}

/** Open client-to-agency requests across all clients (inbox view). */
export async function listOpenClientRequests(limit = 20): Promise<ClientRequestSummary[]> {
  const { data, error } = await supabase
    .from('client_requests')
    .select(REQUEST_SELECT)
    .eq('direction', 'client_to_agency')
    .in('status', ['open', 'in_progress', 'waiting'])
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`listOpenClientRequests: ${error.message}`);
  return (data ?? []).map((row) => normalizeRequest(row as Record<string, unknown>));
}

/** All requests of one client, both directions (client page panel). */
export async function listClientRequestsForClient(clientId: string, limit = 30): Promise<ClientRequestSummary[]> {
  const { data, error } = await supabase
    .from('client_requests')
    .select(REQUEST_SELECT)
    .eq('client_id', clientId)
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`listClientRequestsForClient: ${error.message}`);
  return (data ?? []).map((row) => normalizeRequest(row as Record<string, unknown>));
}

/**
 * Agency request to the client (validation, assets, information). Emails
 * every portal-enabled contact so the request is seen without a login habit.
 */
export async function createAgencyRequest(input: {
  clientId: string;
  requestType: 'approval' | 'asset_request' | 'info_request' | 'question';
  title: string;
  body?: string | null;
  dueAt?: string | null;
}): Promise<void> {
  const title = input.title.trim();
  if (!title) throw new Error('Le titre de la demande est requis.');

  const organizationId = await ensureLucidOrganizationId();

  const { data: request, error } = await supabase
    .from('client_requests')
    .insert({
      organization_id: organizationId,
      client_id: input.clientId,
      direction: 'agency_to_client',
      request_type: input.requestType,
      status: 'open',
      title,
      body: input.body?.trim() || null,
      due_at: input.dueAt || null,
    })
    .select('id')
    .single();

  if (error) throw new Error(`createAgencyRequest: ${error.message}`);

  const { data: client } = await supabase
    .from('clients')
    .select('name')
    .eq('id', input.clientId)
    .maybeSingle();
  const clientName = client?.name ? String(client.name) : 'votre entreprise';

  const contacts = await listPortalContactsForClient(input.clientId);
  const recipients = contacts.filter((contact) => contact.portalAccess && contact.email);
  for (const contact of recipients) {
    try {
      await sendPortalRequestToClient({
        to: contact.email as string,
        contactName: contact.fullName,
        clientName,
        requestType: input.requestType,
        title,
        body: input.body?.trim() || null,
        portalUrl: `${config.portalBaseUrl}/echanges/${String(request.id)}`,
      });
    } catch (emailError) {
      console.error('[portal] agency request email failed:', emailError instanceof Error ? emailError.message : emailError);
    }
  }

  await recordLucidAuditEvent({
    clientId: input.clientId,
    actorType: 'admin',
    eventType: 'portal_request_sent',
    targetTable: 'client_requests',
    targetId: String(request.id),
    summary: `Demande envoyée au client via le portail : ${title}`,
    details: { request_type: input.requestType, recipients: recipients.length },
  });
}

/** Answer a client request (status move + note), notifying its author. */
export async function answerClientRequest(input: {
  requestId: string;
  status: 'in_progress' | 'done' | 'declined';
  responseNote?: string | null;
}): Promise<void> {
  const resolved = input.status === 'done' || input.status === 'declined';
  const { data, error } = await supabase
    .from('client_requests')
    .update({
      status: input.status,
      response_note: input.responseNote?.trim() || null,
      resolved_at: resolved ? new Date().toISOString() : null,
    })
    .eq('id', input.requestId)
    .eq('direction', 'client_to_agency')
    .select('id,title,client_id,created_by_contact_id')
    .maybeSingle();

  if (error) throw new Error(`answerClientRequest: ${error.message}`);
  if (!data) throw new Error('Demande introuvable.');

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
          responseNote: input.responseNote?.trim() || null,
          portalUrl: `${config.portalBaseUrl}/echanges/${String(data.id)}`,
        });
      } catch (emailError) {
        console.error('[portal] request answer email failed:', emailError instanceof Error ? emailError.message : emailError);
      }
    }
  }

  await recordLucidAuditEvent({
    clientId: String(data.client_id),
    actorType: 'admin',
    eventType: 'portal_request_answered',
    targetTable: 'client_requests',
    targetId: String(data.id),
    summary: `Demande client traitée (${input.status}) : ${String(data.title)}`,
  });
}

export interface MeetingRecapSummary {
  id: string;
  summary: string;
  occurredAt: string;
  clientVisible: boolean;
  clientSummary: string | null;
  sourceUri: string | null;
}

/** Meeting interactions of a client, with portal visibility state (admin view). */
export async function listMeetingInteractionsForClient(clientId: string, limit = 10): Promise<MeetingRecapSummary[]> {
  const { data, error } = await supabase
    .from('client_interactions')
    .select('id,summary,occurred_at,client_visible,client_summary,source_uri')
    .eq('client_id', clientId)
    .eq('interaction_type', 'meeting')
    .order('occurred_at', { ascending: false })
    .limit(limit);

  if (error) throw new Error(`listMeetingInteractionsForClient: ${error.message}`);

  return (data ?? []).map((row) => ({
    id: String(row.id),
    summary: String(row.summary ?? 'Réunion'),
    occurredAt: String(row.occurred_at ?? ''),
    clientVisible: row.client_visible === true,
    clientSummary: row.client_summary ? String(row.client_summary) : null,
    sourceUri: row.source_uri ? String(row.source_uri) : null,
  }));
}

/** Show or hide a meeting recap on the client portal. */
export async function setInteractionClientVisibility(interactionId: string, visible: boolean): Promise<void> {
  const { data, error } = await supabase
    .from('client_interactions')
    .update({ client_visible: visible })
    .eq('id', interactionId)
    .select('id,summary,client_id')
    .maybeSingle();

  if (error) throw new Error(`setInteractionClientVisibility: ${error.message}`);
  if (!data) throw new Error('Compte rendu introuvable.');

  await recordLucidAuditEvent({
    clientId: String(data.client_id),
    actorType: 'admin',
    eventType: visible ? 'portal_recap_shown' : 'portal_recap_hidden',
    targetTable: 'client_interactions',
    targetId: String(data.id),
    summary: `${visible ? 'Compte rendu publié sur le portail' : 'Compte rendu masqué du portail'} : ${String(data.summary)}`,
  });
}

/** Edit the client-facing recap text of a meeting interaction. */
export async function updateInteractionClientSummary(interactionId: string, clientSummary: string): Promise<void> {
  const trimmed = clientSummary.trim();
  const { data, error } = await supabase
    .from('client_interactions')
    .update({ client_summary: trimmed || null })
    .eq('id', interactionId)
    .select('id,summary,client_id')
    .maybeSingle();

  if (error) throw new Error(`updateInteractionClientSummary: ${error.message}`);
  if (!data) throw new Error('Compte rendu introuvable.');

  await recordLucidAuditEvent({
    clientId: String(data.client_id),
    actorType: 'admin',
    eventType: 'portal_recap_edited',
    targetTable: 'client_interactions',
    targetId: String(data.id),
    summary: `Compte rendu client modifié : ${String(data.summary)}`,
  });
}

/** Publish or hide a task on the client portal, with an audit trail. */
export async function setTaskClientVisibility(taskId: string, visible: boolean): Promise<void> {
  const { data, error } = await supabase
    .from('client_tasks')
    .update({ client_visible: visible })
    .eq('id', taskId)
    .select('id,title,client_id')
    .maybeSingle();

  if (error) throw new Error(`setTaskClientVisibility: ${error.message}`);
  if (!data) throw new Error('Tâche introuvable.');

  if (data.client_id) {
    await recordLucidAuditEvent({
      clientId: String(data.client_id),
      actorType: 'admin',
      eventType: visible ? 'portal_task_shown' : 'portal_task_hidden',
      targetTable: 'client_tasks',
      targetId: String(data.id),
      summary: `${visible ? 'Tâche publiée sur le portail' : 'Tâche masquée du portail'} : ${String(data.title)}`,
    });
  }
}

/**
 * Invite = enable access + 7-day magic link by email. Reusable to re-send an
 * invitation at any time.
 */
export async function sendPortalInviteForContact(contactId: string): Promise<void> {
  const contact = await getPortalContact(contactId);

  if (!contact.email) {
    throw new Error("Ce contact n'a pas d'adresse email. Ajoutez un email avant d'envoyer l'invitation.");
  }
  if (!contact.client) {
    throw new Error('Client introuvable pour ce contact.');
  }
  if (['offboarded', 'archived'].includes(contact.client.status)) {
    throw new Error('Ce client est archivé ou terminé : le portail ne peut pas être ouvert.');
  }

  const nowIso = new Date().toISOString();
  const { error: updateError } = await supabase
    .from('client_contacts')
    .update({ portal_access: true, portal_invited_at: nowIso })
    .eq('id', contactId);
  if (updateError) throw new Error(`sendPortalInviteForContact: ${updateError.message}`);

  const { token, tokenHash } = generatePortalToken();
  const { error: tokenError } = await supabase.from('portal_login_tokens').insert({
    organization_id: contact.organization_id,
    client_id: contact.client_id,
    contact_id: contact.id,
    token_hash: tokenHash,
    purpose: 'invite',
    expires_at: new Date(Date.now() + PORTAL_INVITE_TOKEN_TTL_MS).toISOString(),
  });
  if (tokenError) throw new Error(`sendPortalInviteForContact: ${tokenError.message}`);

  const inviteUrl = `${config.portalBaseUrl}/connexion/verifier?token=${token}`;
  if (config.nodeEnv !== 'production') {
    console.info(`[portal] Lien d'invitation pour ${contact.email}: ${inviteUrl}`);
  }

  await sendPortalInvite({
    to: contact.email,
    contactName: contact.full_name,
    clientName: contact.client.name,
    inviteUrl,
  });

  await recordLucidAuditEvent({
    clientId: contact.client_id,
    actorType: 'admin',
    eventType: 'portal_invite_sent',
    targetTable: 'client_contacts',
    targetId: contact.id,
    summary: `Invitation portail envoyée à ${contact.email}`,
  });
}
