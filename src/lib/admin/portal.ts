import 'server-only';

import { config } from '@/lib/bot/config';
import { supabase } from '@/lib/bot/db/supabase';
import { sendPortalInvite } from '@/lib/bot/integrations/email-client';
import { PORTAL_INVITE_TOKEN_TTL_MS, generatePortalToken } from '@/lib/portal/auth';
import { recordLucidAuditEvent } from './lucid-os';

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
