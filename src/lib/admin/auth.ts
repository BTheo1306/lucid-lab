import 'server-only';

import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
import { config } from '@/lib/bot/config';
import { isAdminHost } from '@/lib/admin/urls';

/**
 * Renamed when the admin moved to its own subdomain, and the new name matters.
 *
 * The session cookie went from `path: '/admin'` to `path: '/'` (the browser
 * scopes cookies on the URL it sees, and the proxy rewrites /x to /admin/x on
 * the subdomain). Had the name stayed the same, a browser holding both would
 * send both on /admin/*, and RFC 6265 serves the *more specific* path first, so
 * the stale /admin cookie would shadow the fresh one and make logout look inert.
 *
 * Renaming sidesteps that entirely: nothing reads the old name anymore, so it
 * cannot shadow. It also lets `clearAdminSessionCookie` kill both in one
 * response, which the same name could not: ResponseCookies keys its map by name
 * alone, so two set() calls on one name collapse into a single Set-Cookie.
 *
 * Cost: the admins re-authenticate once on deploy.
 */
export const ADMIN_SESSION_COOKIE = 'll_admin_sid';

/** Pre-subdomain cookie. Only ever cleared, never read. Drop after 2026-08. */
const LEGACY_ADMIN_SESSION_COOKIE = 'll_admin_session';
const LEGACY_ADMIN_COOKIE_PATH = '/admin';

export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

export interface AdminUser {
  email: string;
}

function constantTimeEquals(left: string, right: string): boolean {
  const leftHash = createHash('sha256').update(left).digest();
  const rightHash = createHash('sha256').update(right).digest();
  return timingSafeEqual(leftHash, rightHash);
}

/** Session cookie signature binds the user's email to the expiry. */
function signSession(email: string, expiresAt: number): string {
  return createHmac('sha256', config.adminSessionSecret)
    .update(`admin:${email}:${expiresAt}`)
    .digest('hex');
}

// ── Machine credential (kept for backend API routes only) ────────────────────

export function isAdminApiKeyConfigured(): boolean {
  return config.adminApiKey.length > 0;
}

/** Constant-time check of the shared ADMIN_API_KEY. Machine-to-machine only:
 *  it can no longer create a browser session (see the Google SSO flow). */
export function isValidAdminKey(candidate: string): boolean {
  if (!config.adminApiKey || !candidate) return false;
  return constantTimeEquals(candidate, config.adminApiKey);
}

// ── Google SSO email allowlist ───────────────────────────────────────────────

export function isGoogleSsoConfigured(): boolean {
  return Boolean(config.googleOAuthClientId && config.googleOAuthClientSecret);
}

export function isEmailAllowed(email: string | null | undefined): boolean {
  if (!email) return false;
  const normalized = email.trim().toLowerCase();
  return config.adminAllowedEmails.includes(normalized);
}

// ── Human session (issued only by the Google SSO callback) ───────────────────

export function createAdminSessionToken(email: string, now = new Date()): string {
  const expiresAt = now.getTime() + ADMIN_SESSION_MAX_AGE_SECONDS * 1000;
  const encodedEmail = Buffer.from(email, 'utf8').toString('base64url');
  return `v2.${encodedEmail}.${expiresAt}.${signSession(email, expiresAt)}`;
}

/** Returns the verified admin email, or null. Re-checks the allowlist on every
 *  call so removing an email from ADMIN_ALLOWED_EMAILS revokes access. */
export function verifyAdminSessionToken(token: string | undefined): string | null {
  if (!config.adminSessionSecret || !token) return null;

  const [version, encodedEmail, expiresAtValue, signature] = token.split('.');
  if (version !== 'v2' || !encodedEmail || !expiresAtValue || !signature) return null;

  const expiresAt = Number(expiresAtValue);
  if (!Number.isFinite(expiresAt) || Date.now() > expiresAt) return null;

  let email: string;
  try {
    email = Buffer.from(encodedEmail, 'base64url').toString('utf8');
  } catch {
    return null;
  }

  if (!constantTimeEquals(signature, signSession(email, expiresAt))) return null;
  if (!isEmailAllowed(email)) return null;

  return email;
}

export async function getAdminUser(): Promise<AdminUser | null> {
  const cookieStore = await cookies();
  const email = verifyAdminSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
  return email ? { email } : null;
}

export async function isAdminAuthenticated(): Promise<boolean> {
  return (await getAdminUser()) !== null;
}

/**
 * Link prefix for the current request: '' on the admin subdomain (the proxy
 * rewrites /x to /admin/x), '/admin' when the routes are reached directly
 * (local dev on localhost:3000, Vercel preview URLs). Mirrors `portalBasePath`.
 */
export async function adminBasePath(): Promise<string> {
  const headerList = await headers();
  return isAdminHost(headerList.get('host')) ? '' : '/admin';
}

/**
 * Browser-facing absolute URL for admin route handlers.
 *
 * `request.url` carries the *internal* origin after a proxy rewrite, so building
 * a redirect from it would leak the rewritten path. Read the Host header
 * instead. Mirrors `portalRedirectUrl`.
 */
export function adminRedirectUrl(request: Request, path: string): string {
  const host = request.headers.get('host') ?? new URL(request.url).host;
  const proto =
    request.headers.get('x-forwarded-proto') ?? (host.includes('localhost') ? 'http' : 'https');
  const base = isAdminHost(host) ? '' : '/admin';
  return `${proto}://${host}${base}${path}`;
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAdminAuthenticated())) {
    redirect(`${await adminBasePath()}/login`);
  }
}

// Host-only cookie: never set a Domain attribute, so the admin session stays on
// the admin host and is never sent to lucid-lab.fr or the client portal.
// `path: '/'` and not '/admin': the browser scopes a cookie on the URL it sees,
// and on the admin subdomain the proxy rewrites /x to /admin/x, so a
// `Path=/admin` cookie would never be sent back. Same reasoning as the portal
// (see `setPortalSessionCookie`). It stays correct on lucid-lab.fr/admin too,
// since '/' also matches '/admin/*'.
export async function setAdminSessionCookie(email: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set({
    name: ADMIN_SESSION_COOKIE,
    value: createAdminSessionToken(email),
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearAdminSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  const expired = {
    value: '',
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'lax' as const,
    maxAge: 0,
  };
  cookieStore.set({ name: ADMIN_SESSION_COOKIE, path: '/', ...expired });
  // Distinct name, so this does not collapse into the set above.
  cookieStore.set({
    name: LEGACY_ADMIN_SESSION_COOKIE,
    path: LEGACY_ADMIN_COOKIE_PATH,
    ...expired,
  });
}
