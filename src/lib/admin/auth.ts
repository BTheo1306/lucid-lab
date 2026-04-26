import 'server-only';

import { createHash, createHmac, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { config } from '@/lib/bot/config';

export const ADMIN_SESSION_COOKIE = 'll_admin_session';
export const ADMIN_SESSION_MAX_AGE_SECONDS = 60 * 60 * 12;

function constantTimeEquals(left: string, right: string): boolean {
  const leftHash = createHash('sha256').update(left).digest();
  const rightHash = createHash('sha256').update(right).digest();
  return timingSafeEqual(leftHash, rightHash);
}


function signSession(expiresAt: number): string {
  return createHmac('sha256', config.adminApiKey)
    .update(`admin:${expiresAt}`)
    .digest('hex');
}

export function isAdminApiKeyConfigured(): boolean {
  return config.adminApiKey.length > 0;
}

export function isValidAdminKey(candidate: string): boolean {
  if (!config.adminApiKey || !candidate) return false;
  return constantTimeEquals(candidate, config.adminApiKey);
}

export function createAdminSessionToken(now = new Date()): string {
  const expiresAt = now.getTime() + ADMIN_SESSION_MAX_AGE_SECONDS * 1000;
  return `v1.${expiresAt}.${signSession(expiresAt)}`;
}

export function verifyAdminSessionToken(token: string | undefined): boolean {
  if (!config.adminApiKey || !token) return false;

  const [version, expiresAtValue, signature] = token.split('.');
  const expiresAt = Number(expiresAtValue);

  if (version !== 'v1' || !Number.isFinite(expiresAt) || !signature) return false;
  if (Date.now() > expiresAt) return false;

  return constantTimeEquals(signature, signSession(expiresAt));
}

export async function isAdminAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  return verifyAdminSessionToken(cookieStore.get(ADMIN_SESSION_COOKIE)?.value);
}

export async function requireAdmin(): Promise<void> {
  if (!(await isAdminAuthenticated())) {
    redirect('/admin/login');
  }
}

export async function setAdminSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set({
    name: ADMIN_SESSION_COOKIE,
    value: createAdminSessionToken(),
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