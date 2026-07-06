import 'server-only';

import { supabase } from '@/lib/bot/db/supabase';
import { config } from '@/lib/bot/config';
import { getLucidOrganizationId } from '@/lib/admin/social';
import { refreshOrgAccessToken, type LinkedInToken } from './client';

/**
 * Persistence for the LinkedIn Community Management API connection: the
 * Lucid-Lab page's own OAuth account, kept separate from the member account
 * in `account.ts` because LinkedIn requires that product to live on its own
 * developer app (see the comment in `client.ts`). No member identity is
 * stored here, only a page-scoped token.
 */

const PROVIDER = 'linkedin_org';
const TOKEN_EXPIRY_SKEW_MS = 5 * 60 * 1000;

export type LinkedInOrgAccountSummary = {
  id: string;
  status: string;
  connectedAt: string | null;
  accessTokenExpiresAt: string | null;
  hasRefreshToken: boolean;
  lastError: string | null;
};

type AccountRow = {
  id: string;
  status: string;
  metadata: Record<string, unknown> | null;
};

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.length > 0 ? value : null;
}

function isoFromNow(seconds: number): string {
  return new Date(Date.now() + seconds * 1000).toISOString();
}

async function findIntegrationId(organizationId: string): Promise<string | null> {
  const { data } = await supabase
    .from('integrations')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('provider', PROVIDER)
    .limit(1)
    .maybeSingle();
  return data ? (data as { id: string }).id : null;
}

async function ensureIntegrationId(organizationId: string): Promise<string> {
  const existing = await findIntegrationId(organizationId);
  if (existing) return existing;

  const { data, error } = await supabase
    .from('integrations')
    .insert({
      organization_id: organizationId,
      name: 'LinkedIn (page Lucid-Lab)',
      provider: PROVIDER,
      category: 'other',
      status: 'active',
      docs_url: 'https://learn.microsoft.com/linkedin/marketing/community-management-api/',
    })
    .select('id')
    .single();
  if (error || !data) throw new Error(`Could not create LinkedIn org integration: ${error?.message ?? 'unknown'}`);
  return (data as { id: string }).id;
}

async function loadAccountRow(): Promise<{ organizationId: string; row: AccountRow } | null> {
  const organizationId = await getLucidOrganizationId();
  if (!organizationId) return null;
  const integrationId = await findIntegrationId(organizationId);
  if (!integrationId) return null;

  const { data } = await supabase
    .from('integration_accounts')
    .select('id,status,metadata')
    .eq('organization_id', organizationId)
    .eq('integration_id', integrationId)
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  return { organizationId, row: data as AccountRow };
}

/** Connection summary for the admin UI. Never returns the raw tokens. */
export async function getLinkedInOrgAccount(): Promise<LinkedInOrgAccountSummary | null> {
  const loaded = await loadAccountRow();
  if (!loaded) return null;
  const { row } = loaded;
  const meta = row.metadata ?? {};
  return {
    id: row.id,
    status: row.status,
    connectedAt: asString(meta.connected_at),
    accessTokenExpiresAt: asString(meta.access_token_expires_at),
    hasRefreshToken: Boolean(asString(meta.refresh_token)),
    lastError: asString(meta.last_error),
  };
}

/** Upsert the connected page account after a successful OAuth exchange. */
export async function saveLinkedInOrgAccount(token: LinkedInToken): Promise<void> {
  const organizationId = await getLucidOrganizationId();
  if (!organizationId) throw new Error('No organization configured.');
  const integrationId = await ensureIntegrationId(organizationId);

  const nowIso = new Date().toISOString();
  const metadata: Record<string, unknown> = {
    access_token: token.accessToken,
    access_token_expires_at: isoFromNow(token.expiresInSeconds),
    refresh_token: token.refreshToken,
    refresh_token_expires_at: token.refreshTokenExpiresInSeconds
      ? isoFromNow(token.refreshTokenExpiresInSeconds)
      : null,
    connected_at: nowIso,
    connected_by: 'admin',
    last_error: null,
  };
  const scopes = token.scope ? token.scope.split(/[\s,]+/).filter(Boolean) : ['w_organization_social'];

  const existing = await supabase
    .from('integration_accounts')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('integration_id', integrationId)
    .limit(1)
    .maybeSingle();

  const payload = {
    organization_id: organizationId,
    integration_id: integrationId,
    label: 'Page Lucid-Lab',
    account_identifier: config.linkedinOrganizationId || null,
    status: 'active',
    scopes,
    metadata,
    updated_at: nowIso,
  };

  const result = existing.data
    ? await supabase.from('integration_accounts').update(payload).eq('id', (existing.data as { id: string }).id)
    : await supabase.from('integration_accounts').insert(payload);
  if (result.error) throw new Error(`Could not save LinkedIn org account: ${result.error.message}`);
}

async function patchMetadata(id: string, patch: Record<string, unknown>, status?: string): Promise<void> {
  const { data } = await supabase.from('integration_accounts').select('metadata').eq('id', id).maybeSingle();
  const current = (data as { metadata: Record<string, unknown> | null } | null)?.metadata ?? {};
  const update: Record<string, unknown> = {
    metadata: { ...current, ...patch },
    updated_at: new Date().toISOString(),
  };
  if (status) update.status = status;
  await supabase.from('integration_accounts').update(update).eq('id', id);
}

async function markNeedsReauth(id: string, reason: string): Promise<void> {
  await patchMetadata(id, { last_error: reason }, 'needs_reauth');
}

/**
 * Returns a usable access token for the Lucid-Lab page, refreshing it when
 * close to expiry. Returns null (and flags the account for reauth) when no
 * valid credentials can be obtained. Callers must treat this as best-effort:
 * a missing page token should never block the member post.
 */
export async function getOrgPostingCredentials(): Promise<{ accessToken: string } | null> {
  const loaded = await loadAccountRow();
  if (!loaded) return null;
  const { row } = loaded;
  const meta = row.metadata ?? {};

  const accessToken = asString(meta.access_token);
  if (!accessToken) {
    await markNeedsReauth(row.id, 'Connexion de la page LinkedIn incomplète, reconnectez-la.');
    return null;
  }

  const expiresAtMs = asString(meta.access_token_expires_at)
    ? Date.parse(meta.access_token_expires_at as string)
    : 0;
  if (Number.isFinite(expiresAtMs) && Date.now() < expiresAtMs - TOKEN_EXPIRY_SKEW_MS) {
    return { accessToken };
  }

  const refreshToken = asString(meta.refresh_token);
  if (!refreshToken) {
    await markNeedsReauth(row.id, 'Token de la page LinkedIn expiré et aucun refresh token disponible. Reconnectez.');
    return null;
  }

  try {
    const refreshed = await refreshOrgAccessToken(refreshToken);
    await patchMetadata(
      row.id,
      {
        access_token: refreshed.accessToken,
        access_token_expires_at: isoFromNow(refreshed.expiresInSeconds),
        refresh_token: refreshed.refreshToken ?? refreshToken,
        refresh_token_expires_at: refreshed.refreshTokenExpiresInSeconds
          ? isoFromNow(refreshed.refreshTokenExpiresInSeconds)
          : (asString(meta.refresh_token_expires_at) ?? null),
        last_refreshed_at: new Date().toISOString(),
        last_error: null,
      },
      'active',
    );
    return { accessToken: refreshed.accessToken };
  } catch (error) {
    await markNeedsReauth(row.id, error instanceof Error ? error.message : 'Refresh de la page LinkedIn échoué.');
    return null;
  }
}
