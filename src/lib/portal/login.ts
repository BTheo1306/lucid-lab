import 'server-only';

import { createHash } from 'node:crypto';
import { config } from '@/lib/bot/config';
import { supabase } from '@/lib/bot/db/supabase';
import { incrementRateLimit } from '@/lib/bot/db/queries/rate-limit';
import { sendPortalLoginLink } from '@/lib/bot/integrations/email-client';
import {
  PORTAL_LOGIN_TOKEN_TTL_MS,
  generatePortalToken,
  hashPortalToken,
  isPortalConfigured,
  loadPortalContact,
  setPortalSessionCookie,
} from './auth';
import { recordPortalAuditEvent } from './audit';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function hashIp(ip: string): string {
  return createHash('sha256').update(`${config.ipHashSalt}:${ip}`).digest('hex').slice(0, 32);
}

interface EligibleContactRow {
  id: string;
  client_id: string;
  organization_id: string;
  full_name: string | null;
  email: string | null;
  status: string;
  portal_access: boolean;
  updated_at: string;
  client: { id: string; name: string; slug: string; status: string } | null;
}

async function findPortalContactByEmail(email: string): Promise<EligibleContactRow | null> {
  // ilike without wildcards = case-insensitive equality; escape % and _ so an
  // email like jules_g@x.fr cannot pattern-match other addresses.
  const pattern = email.replace(/([%_\\])/g, '\\$1');

  const { data, error } = await supabase
    .from('client_contacts')
    .select('id,client_id,organization_id,full_name,email,status,portal_access,updated_at,client:clients(id,name,slug,status)')
    .ilike('email', pattern)
    .eq('portal_access', true)
    .eq('status', 'active')
    .order('updated_at', { ascending: false })
    .limit(5);

  if (error || !data) return null;

  for (const raw of data) {
    const row = raw as unknown as EligibleContactRow;
    if (row.client && !['offboarded', 'archived'].includes(row.client.status)) {
      return row;
    }
  }
  return null;
}

/**
 * Magic-link request. Always resolves to { ok: true }: the caller shows the
 * same neutral message whether or not an account exists (no email enumeration).
 */
export async function requestPortalLogin(input: { email: string; ip: string | null }): Promise<{ ok: true }> {
  if (!isPortalConfigured()) {
    console.warn('[portal] PORTAL_SESSION_SECRET missing, login link not sent');
    return { ok: true };
  }

  const email = input.email.trim().toLowerCase();
  if (!EMAIL_PATTERN.test(email) || email.length > 254) return { ok: true };

  if (input.ip) {
    const ipBucket = await incrementRateLimit(`portal-login-ip:${hashIp(input.ip)}`, 10, 900);
    if (!ipBucket.allowed) return { ok: true };
  }
  const emailBucket = await incrementRateLimit(`portal-login-email:${email}`, 5, 900);
  if (!emailBucket.allowed) return { ok: true };

  const contact = await findPortalContactByEmail(email);
  if (!contact || !contact.email) {
    if (config.nodeEnv !== 'production') {
      console.info(`[portal] No eligible portal contact for ${email}`);
    }
    return { ok: true };
  }

  const { token, tokenHash } = generatePortalToken();
  const { error } = await supabase.from('portal_login_tokens').insert({
    organization_id: contact.organization_id,
    client_id: contact.client_id,
    contact_id: contact.id,
    token_hash: tokenHash,
    purpose: 'login',
    expires_at: new Date(Date.now() + PORTAL_LOGIN_TOKEN_TTL_MS).toISOString(),
    created_ip: input.ip ? hashIp(input.ip) : null,
  });

  if (error) {
    console.error('[portal] Could not create login token:', error.message);
    return { ok: true };
  }

  const loginUrl = `${config.portalBaseUrl}/connexion/verifier?token=${token}`;
  if (config.nodeEnv !== 'production') {
    console.info(`[portal] Lien de connexion pour ${email}: ${loginUrl}`);
  }

  try {
    await sendPortalLoginLink({
      to: contact.email,
      contactName: contact.full_name,
      loginUrl,
    });
  } catch (error) {
    console.error('[portal] Could not send login link:', error instanceof Error ? error.message : error);
  }

  await recordPortalAuditEvent({
    organizationId: contact.organization_id,
    clientId: contact.client_id,
    eventType: 'portal_login_link_requested',
    summary: `Lien de connexion portail demandé pour ${email}`,
    actorId: contact.id,
    targetTable: 'portal_login_tokens',
  });

  return { ok: true };
}

export type ConsumeLoginTokenResult =
  | { ok: true }
  | { ok: false; reason: 'invalid' | 'expired' | 'revoked' };

/**
 * Single-use consumption: the conditional UPDATE only returns a row when the
 * token exists, is unused and unexpired, so replays and races lose atomically.
 */
export async function consumePortalLoginToken(input: { token: string; ip: string | null }): Promise<ConsumeLoginTokenResult> {
  if (!isPortalConfigured() || !input.token || input.token.length > 200) {
    return { ok: false, reason: 'invalid' };
  }

  const tokenHash = hashPortalToken(input.token);
  const nowIso = new Date().toISOString();

  const { data, error } = await supabase
    .from('portal_login_tokens')
    .update({ used_at: nowIso, used_ip: input.ip ? hashIp(input.ip) : null })
    .eq('token_hash', tokenHash)
    .is('used_at', null)
    .gt('expires_at', nowIso)
    .select('id,contact_id,client_id,organization_id,purpose');

  if (error) {
    console.error('[portal] consumePortalLoginToken failed:', error.message);
    return { ok: false, reason: 'invalid' };
  }

  const consumed = data?.[0] as
    | { id: string; contact_id: string; client_id: string; organization_id: string; purpose: string }
    | undefined;

  if (!consumed) {
    const { data: existing } = await supabase
      .from('portal_login_tokens')
      .select('used_at,expires_at')
      .eq('token_hash', tokenHash)
      .maybeSingle();

    if (existing && !existing.used_at && existing.expires_at <= nowIso) {
      return { ok: false, reason: 'expired' };
    }
    return { ok: false, reason: 'invalid' };
  }

  const session = await loadPortalContact(consumed.contact_id, consumed.client_id);
  if (!session) return { ok: false, reason: 'revoked' };

  await setPortalSessionCookie(session.contactId, session.clientId);

  await supabase
    .from('client_contacts')
    .update({ portal_last_login_at: nowIso })
    .eq('id', session.contactId);

  await recordPortalAuditEvent({
    organizationId: session.organizationId,
    clientId: session.clientId,
    eventType: 'portal_login',
    summary: `Connexion au portail client (${session.contactName || session.contactEmail || session.contactId})`,
    actorId: session.contactId,
    targetTable: 'client_contacts',
    details: { purpose: consumed.purpose },
  });

  return { ok: true };
}
