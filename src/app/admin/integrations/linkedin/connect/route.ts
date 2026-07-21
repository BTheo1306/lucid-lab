import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';

import { adminRedirectUrl, isAdminAuthenticated } from '@/lib/admin/auth';
import { config } from '@/lib/bot/config';
import { LINKEDIN_OAUTH_STATE_COOKIE, buildAuthorizeUrl } from '@/lib/admin/linkedin/client';

export const runtime = 'nodejs';

/**
 * GET /admin/integrations/linkedin/connect
 * Starts the LinkedIn OAuth flow. Sets a short-lived CSRF state cookie and
 * redirects to LinkedIn's authorization screen. Redirects go through
 * adminRedirectUrl so they stay in the clean space on the admin subdomain.
 */
export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.redirect(adminRedirectUrl(request, '/login'));
  }
  if (!config.linkedinClientId || !config.linkedinClientSecret) {
    return NextResponse.redirect(
      adminRedirectUrl(request, '/lucid-os/social?linkedin_error=App+LinkedIn+non+configur%C3%A9e'),
    );
  }

  const state = randomBytes(16).toString('hex');
  const response = NextResponse.redirect(buildAuthorizeUrl(state));
  response.cookies.set({
    name: LINKEDIN_OAUTH_STATE_COOKIE,
    value: state,
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 600,
  });
  return response;
}
