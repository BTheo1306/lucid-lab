import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { isGoogleSsoConfigured } from '@/lib/admin/auth';
import { GOOGLE_OAUTH_STATE_COOKIE, buildGoogleAuthorizeUrl, googleRedirectUri } from '@/lib/admin/google-sso';
import { config } from '@/lib/bot/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /admin/auth/google
 * Public entry point of the admin sign-in flow. Sets a short-lived CSRF state
 * cookie and redirects to Google's account chooser. No session required (this
 * is how a session is obtained).
 */
export async function GET(request: Request) {
  if (!isGoogleSsoConfigured()) {
    return NextResponse.redirect(new URL('/admin/login?error=config', request.url));
  }

  const state = randomBytes(16).toString('hex');
  const redirectUri = googleRedirectUri(request);
  const response = NextResponse.redirect(buildGoogleAuthorizeUrl(state, redirectUri));
  response.cookies.set({
    name: GOOGLE_OAUTH_STATE_COOKIE,
    value: state,
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'lax',
    path: '/admin',
    maxAge: 600,
  });
  return response;
}
