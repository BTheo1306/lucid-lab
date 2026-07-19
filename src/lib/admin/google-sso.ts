import 'server-only';

import { adminRedirectUrl } from '@/lib/admin/auth';
import { config } from '@/lib/bot/config';

/**
 * Minimal Google OAuth 2.0 authorization-code flow for admin sign-in.
 * Scope is limited to the user's email; no Google data is stored. Access is
 * gated by the ADMIN_ALLOWED_EMAILS allowlist (see auth.ts).
 */

export const GOOGLE_OAUTH_STATE_COOKIE = 'll_admin_oauth_state';

const AUTHORIZE_ENDPOINT = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_ENDPOINT = 'https://oauth2.googleapis.com/token';
const USERINFO_ENDPOINT = 'https://openidconnect.googleapis.com/v1/userinfo';

/**
 * Registered redirect URI.
 *
 * Google requires an exact match against a pre-registered value, and the same
 * string on both the authorize and the token-exchange call, so
 * GOOGLE_OAUTH_REDIRECT_URI is the intended way to set this in production.
 *
 * The fallback derives it from the request for localhost. It goes through
 * `adminRedirectUrl` rather than `request.url`, because after the admin
 * subdomain rewrite `request.url` carries the internal origin and would produce
 * a URI Google never saw.
 */
export function googleRedirectUri(request: Request): string {
  if (config.googleOAuthRedirectUri) return config.googleOAuthRedirectUri;
  return adminRedirectUrl(request, '/auth/google/callback');
}

export function buildGoogleAuthorizeUrl(state: string, redirectUri: string): string {
  const params = new URLSearchParams({
    client_id: config.googleOAuthClientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email',
    state,
    access_type: 'online',
    // Always let the user pick which of their Google accounts to use.
    prompt: 'select_account',
  });
  return `${AUTHORIZE_ENDPOINT}?${params.toString()}`;
}

export async function exchangeGoogleCode(code: string, redirectUri: string): Promise<string> {
  const response = await fetch(TOKEN_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: config.googleOAuthClientId,
      client_secret: config.googleOAuthClientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });
  const body = (await response.json()) as { access_token?: string; error_description?: string; error?: string };
  if (!response.ok || !body.access_token) {
    throw new Error(`Google token exchange failed: ${body.error_description ?? body.error ?? response.statusText}`);
  }
  return body.access_token;
}

/** Returns the verified email, or null when Google reports it unverified. */
export async function fetchGoogleEmail(accessToken: string): Promise<string | null> {
  const response = await fetch(USERINFO_ENDPOINT, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const body = (await response.json()) as { email?: string; email_verified?: boolean | string };
  if (!response.ok || !body.email) {
    throw new Error(`Google userinfo failed: ${response.statusText}`);
  }
  const verified = body.email_verified === true || body.email_verified === 'true';
  return verified ? body.email.trim().toLowerCase() : null;
}
