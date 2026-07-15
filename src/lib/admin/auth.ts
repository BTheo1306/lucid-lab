import 'server-only';

import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { config } from '@/lib/bot/config';

export const ADMIN_SESSION_COOKIE = 'll_admin_session';
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

export async function requireAdmin(): Promise<void> {
  if (!(await isAdminAuthenticated())) {
    redirect('/admin/login');
  }
}

export async function setAdminSessionCookie(email: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set({
    name: ADMIN_SESSION_COOKIE,
    value: createAdminSessionToken(email),
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'lax',
    path: '/admin',
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearAdminSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set({
    name: ADMIN_SESSION_COOKIE,
    value: '',
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'lax',
    path: '/admin',
    maxAge: 0,
  });
}
