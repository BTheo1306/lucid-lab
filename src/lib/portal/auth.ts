import 'server-only';

import { createHash, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { cache } from 'react';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { config } from '@/lib/bot/config';
import { supabase } from '@/lib/bot/db/supabase';

export const PORTAL_SESSION_COOKIE = 'll_portal_session';
export const PORTAL_SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 14;
export const PORTAL_LOGIN_TOKEN_TTL_MS = 15 * 60 * 1000;
export const PORTAL_INVITE_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

/** Client statuses that keep portal access open. */
const BLOCKED_CLIENT_STATUSES = new Set(['offboarded', 'archived']);

export interface PortalSession {
  contactId: string;
  clientId: string;
  organizationId: string;
  clientName: string;
  clientSlug: string;
  contactName: string;
  contactEmail: string | null;
}

export function isPortalConfigured(): boolean {
  return config.portalSessionSecret.length > 0;
}

function constantTimeEquals(left: string, right: string): boolean {
  const leftHash = createHash('sha256').update(left).digest();
  const rightHash = createHash('sha256').update(right).digest();
  return timingSafeEqual(leftHash, rightHash);
}

/** Opaque single-use token sent by email; only its sha256 is stored. */
export function generatePortalToken(): { token: string; tokenHash: string } {
  const token = randomBytes(32).toString('base64url');
  return { token, tokenHash: hashPortalToken(token) };
}

export function hashPortalToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

function signPortalSession(contactId: string, clientId: string, expiresAt: number): string {
  return createHmac('sha256', config.portalSessionSecret)
    .update(`portal:${contactId}:${clientId}:${expiresAt}`)
    .digest('hex');
}

export function createPortalSessionToken(contactId: string, clientId: string, now = new Date()): string {
  const expiresAt = now.getTime() + PORTAL_SESSION_MAX_AGE_SECONDS * 1000;
  return `v1.${contactId}.${clientId}.${expiresAt}.${signPortalSession(contactId, clientId, expiresAt)}`;
}

export function verifyPortalSessionToken(
  token: string | undefined,
): { contactId: string; clientId: string } | null {
  if (!isPortalConfigured() || !token) return null;

  const [version, contactId, clientId, expiresAtValue, signature] = token.split('.');
  const expiresAt = Number(expiresAtValue);

  if (version !== 'v1' || !contactId || !clientId || !Number.isFinite(expiresAt) || !signature) return null;
  if (Date.now() > expiresAt) return null;
  if (!constantTimeEquals(signature, signPortalSession(contactId, clientId, expiresAt))) return null;

  return { contactId, clientId };
}

export async function setPortalSessionCookie(contactId: string, clientId: string): Promise<void> {
  const cookieStore = await cookies();
  // Host-only cookie: never set a Domain attribute, so the session stays on
  // the portal host and is never sent to lucid-lab.fr or the admin.
  cookieStore.set({
    name: PORTAL_SESSION_COOKIE,
    value: createPortalSessionToken(contactId, clientId),
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: PORTAL_SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearPortalSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set({
    name: PORTAL_SESSION_COOKIE,
    value: '',
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
}

interface PortalContactRow {
  id: string;
  client_id: string;
  organization_id: string;
  full_name: string | null;
  email: string | null;
  status: string;
  portal_access: boolean;
  client: { id: string; name: string; slug: string; status: string } | null;
}

/**
 * Load a contact and re-check portal eligibility (access flag, contact and
 * client statuses). Returns null when access should be denied, which makes
 * admin-side revocation effective on the next request.
 */
export async function loadPortalContact(contactId: string, clientId: string): Promise<PortalSession | null> {
  const { data, error } = await supabase
    .from('client_contacts')
    .select('id,client_id,organization_id,full_name,email,status,portal_access,client:clients(id,name,slug,status)')
    .eq('id', contactId)
    .eq('client_id', clientId)
    .maybeSingle();

  if (error || !data) return null;

  const row = data as unknown as PortalContactRow;
  if (!row.portal_access || row.status !== 'active') return null;
  if (!row.client || BLOCKED_CLIENT_STATUSES.has(row.client.status)) return null;

  return {
    contactId: String(row.id),
    clientId: String(row.client_id),
    organizationId: String(row.organization_id),
    clientName: row.client.name,
    clientSlug: row.client.slug,
    contactName: row.full_name ?? '',
    contactEmail: row.email ?? null,
  };
}

/** Per-request cached session lookup (cookie -> HMAC check -> DB re-check). */
export const getPortalSession = cache(async (): Promise<PortalSession | null> => {
  const cookieStore = await cookies();
  const parsed = verifyPortalSessionToken(cookieStore.get(PORTAL_SESSION_COOKIE)?.value);
  if (!parsed) return null;
  return loadPortalContact(parsed.contactId, parsed.clientId);
});

/** True when the request reaches us through the portal subdomain. */
export function isPortalHost(host: string | null | undefined): boolean {
  const hostname = (host ?? '').toLowerCase().split(':')[0];
  if (!hostname) return false;
  if (hostname === 'client.localhost') return true;
  try {
    return hostname === new URL(config.portalBaseUrl).hostname;
  } catch {
    return false;
  }
}

/**
 * Link prefix for the current request: '' on the portal subdomain (the proxy
 * rewrites /x to /portal/x), '/portal' when the routes are reached directly
 * (local dev on localhost:3000, Vercel preview URLs).
 */
export async function portalBasePath(): Promise<string> {
  const headerList = await headers();
  return isPortalHost(headerList.get('host')) ? '' : '/portal';
}

export async function requirePortalUser(): Promise<PortalSession> {
  const session = await getPortalSession();
  if (!session) {
    redirect(`${await portalBasePath()}/connexion`);
  }
  return session;
}

/**
 * Browser-facing absolute redirect URL for portal route handlers.
 *
 * Portal mutations use plain HTML form POSTs to route handlers, not server
 * actions: action redirects resolve inside the app's internal route tree
 * (where the portal lives under /portal), so on the rewritten subdomain they
 * would land on the marketing pages. A route-handler 303 with an absolute URL
 * forces a full browser navigation, which the proxy rewrites correctly.
 * request.url carries the internal origin after a rewrite, hence the Host
 * header.
 */
export function portalRedirectUrl(request: Request, path: string): string {
  const host = request.headers.get('host') ?? new URL(request.url).host;
  const proto =
    request.headers.get('x-forwarded-proto') ?? (host.includes('localhost') ? 'http' : 'https');
  const base = isPortalHost(host) ? '' : '/portal';
  const suffix = path === '/' ? (base ? '' : '/') : path;
  return `${proto}://${host}${base}${suffix}` || `${proto}://${host}/`;
}
