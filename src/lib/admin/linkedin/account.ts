import 'server-only';

import { supabase } from '@/lib/bot/db/supabase';
import { getLucidOrganizationId } from '@/lib/admin/social';
import {
  linkedInScopes,
  refreshAccessToken,
  type LinkedInMember,
  type LinkedInToken,
} from './client';

/**
 * Persistence for the connected LinkedIn member account.
 *
 * The OAuth tokens live in `integration_accounts.metadata` (service-role only,
 * RLS on, never exposed to the browser). The parent `integrations` row is
 * created lazily on first connect so the data model stays explicit.
 */

const PROVIDER = 'linkedin';
const TOKEN_EXPIRY_SKEW_MS = 5 * 60 * 1000;

export type LinkedInAccountSummary = {
  id: string;
  status: string;
  memberName: string | null;
  memberSub: string | null;
  scopes: string[];
  connectedAt: string | null;
  accessTokenExpiresAt: string | null;
  hasRefreshToken: boolean;
  lastError: string | null;
};

type AccountRow = {
  id: string;
  status: string;
  account_identifier: string | null;
  scopes: string[] | null;
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
      name: 'LinkedIn',
      provider: PROVIDER,
      category: 'other',
      status: 'active',
      docs_url: 'https://learn.microsoft.com/linkedin/marketing/',
    })
    .select('id')
    .single();
  if (error || !data) throw new Error(`Could not create LinkedIn integration: ${error?.message ?? 'unknown'}`);
  return (data as { id: string }).id;
}

async function loadAccountRow(): Promise<{ organizationId: string; row: AccountRow } | null> {
  const organizationId = await getLucidOrganizationId();
  if (!organizationId) return null;
  const integrationId = await findIntegrationId(organizationId);
  if (!integrationId) return null;

  const { data } = await supabase
    .from('integration_accounts')
    .select('id,status,account_identifier,scopes,metadata')
    .eq('organization_id', organizationId)
    .eq('integration_id', integrationId)
    .limit(1)
    .maybeSingle();
  if (!data) return null;
  return { organizationId, row: data as AccountRow };
}

/** Connection summary for the admin UI. Never returns the raw tokens. */
export async function getLinkedInAccount(): Promise<LinkedInAccountSummary | null> {
  const loaded = await loadAccountRow();
  if (!loaded) return null;
  const { row } = loaded;
  const meta = row.metadata ?? {};
  return {
    id: row.id,
    status: row.status,
    memberName: asString(meta.member_name),
    memberSub: row.account_identifier ?? asString(meta.member_sub),
    scopes: Array.isArray(row.scopes) ? row.scopes : [],
    connectedAt: asString(meta.connected_at),
    accessTokenExpiresAt: asString(meta.access_token_expires_at),
    hasRefreshToken: Boolean(asString(meta.refresh_token)),
    lastError: asString(meta.last_error),
  };
}

/** Upsert the connected account after a successful OAuth exchange. */
export async function saveLinkedInAccount(input: {
  token: LinkedInToken;
  member: LinkedInMember;
}): Promise<void> {
  const organizationId = await getLucidOrganizationId();
  if (!organizationId) throw new Error('No organization configured.');
  const integrationId = await ensureIntegrationId(organizationId);

  const nowIso = new Date().toISOString();
  const metadata: Record<string, unknown> = {
    member_sub: input.member.sub,
    member_name: input.member.name,
    member_email: input.member.email,
    access_token: input.token.accessToken,
    access_token_expires_at: isoFromNow(input.token.expiresInSeconds),
    refresh_token: input.token.refreshToken,
    refresh_token_expires_at: input.token.refreshTokenExpiresInSeconds
      ? isoFromNow(input.token.refreshTokenExpiresInSeconds)
      : null,
    connected_at: nowIso,
    connected_by: 'admin',
    last_error: null,
  };
  const scopes = input.token.scope ? input.token.scope.split(/[\s,]+/).filter(Boolean) : linkedInScopes();

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
    label: input.member.name ? `LinkedIn (${input.member.name})` : 'LinkedIn',
    account_identifier: input.member.sub,
    status: 'active',
    scopes,
    metadata,
    updated_at: nowIso,
  };

  const result = existing.data
    ? await supabase.from('integration_accounts').update(payload).eq('id', (existing.data as { id: string }).id)
    : await supabase.from('integration_accounts').insert(payload);
  if (result.error) throw new Error(`Could not save LinkedIn account: ${result.error.message}`);
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
 * Returns a usable access token + member URN for posting, refreshing the token
 * when it is close to expiry. Returns null (and flags the account for reauth)
 * when no valid credentials can be obtained.
 */
export async function getPostingCredentials(): Promise<{ accessToken: string; memberSub: string } | null> {
  const loaded = await loadAccountRow();
  if (!loaded) return null;
  const { row } = loaded;
  const meta = row.metadata ?? {};

  const memberSub = row.account_identifier ?? asString(meta.member_sub);
  const accessToken = asString(meta.access_token);
  if (!memberSub || !accessToken) {
    await markNeedsReauth(row.id, 'Connexion LinkedIn incomplète, reconnectez le compte.');
    return null;
  }

  const expiresAtMs = asString(meta.access_token_expires_at)
    ? Date.parse(meta.access_token_expires_at as string)
    : 0;
  if (Number.isFinite(expiresAtMs) && Date.now() < expiresAtMs - TOKEN_EXPIRY_SKEW_MS) {
    return { accessToken, memberSub };
  }

  const refreshToken = asString(meta.refresh_token);
  if (!refreshToken) {
    await markNeedsReauth(row.id, 'Token LinkedIn expiré et aucun refresh token disponible. Reconnectez le compte.');
    return null;
  }

  try {
    const refreshed = await refreshAccessToken(refreshToken);
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
    return { accessToken: refreshed.accessToken, memberSub };
  } catch (error) {
    await markNeedsReauth(row.id, error instanceof Error ? error.message : 'Refresh LinkedIn échoué.');
    return null;
  }
}
