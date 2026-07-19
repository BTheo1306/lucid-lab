import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { adminRedirectUrl, isEmailAllowed, setAdminSessionCookie } from '@/lib/admin/auth';
import {
  GOOGLE_OAUTH_STATE_COOKIE,
  exchangeGoogleCode,
  fetchGoogleEmail,
  googleRedirectUri,
} from '@/lib/admin/google-sso';
import { logSecurityEvent } from '@/lib/bot/db/queries/security-audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /admin/auth/google/callback
 * Google redirects here with `code` + `state`. Verify the CSRF state, exchange
 * the code, resolve the verified email, enforce the allowlist, then issue the
 * admin session cookie (which carries the user's identity).
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  // adminRedirectUrl and not `new URL(..., request.url)`: after the subdomain
  // rewrite, request.url carries the internal origin.
  const fail = (error: string) =>
    NextResponse.redirect(adminRedirectUrl(request, `/login?error=${error}`));

  const oauthError = url.searchParams.get('error');
  if (oauthError) return fail('oauth_failed');

  const code = url.searchParams.get('code');
  const returnedState = url.searchParams.get('state');
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(GOOGLE_OAUTH_STATE_COOKIE)?.value;

  if (!code || !returnedState || !expectedState || returnedState !== expectedState) {
    return fail('oauth_state');
  }

  let email: string | null;
  try {
    const accessToken = await exchangeGoogleCode(code, googleRedirectUri(request));
    email = await fetchGoogleEmail(accessToken);
  } catch {
    return fail('oauth_failed');
  }

  if (!email) return fail('oauth_failed');

  if (!isEmailAllowed(email)) {
    await logSecurityEvent({
      event_type: 'admin_unauthorized',
      details: { route: 'admin/auth/google/callback', email },
    });
    const denied = fail('not_allowed');
    denied.cookies.set({ name: GOOGLE_OAUTH_STATE_COOKIE, value: '', path: '/', maxAge: 0 });
    return denied;
  }

  await setAdminSessionCookie(email);
  await logSecurityEvent({
    event_type: 'admin_access',
    details: { route: 'admin/auth/google/callback', email },
  });

  const response = NextResponse.redirect(adminRedirectUrl(request, '/lucid-os'));
  response.cookies.set({ name: GOOGLE_OAUTH_STATE_COOKIE, value: '', path: '/', maxAge: 0 });
  return response;
}
