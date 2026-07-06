import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';

import { isAdminAuthenticated } from '@/lib/admin/auth';
import { config } from '@/lib/bot/config';
import { LINKEDIN_ORG_OAUTH_STATE_COOKIE, buildOrgAuthorizeUrl } from '@/lib/admin/linkedin/client';

export const runtime = 'nodejs';

/**
 * GET /admin/integrations/linkedin-org/connect
 * Starts the OAuth flow for the Lucid-Lab page's own LinkedIn developer app
 * (Community Management API), kept separate from the member-posting app at
 * /admin/integrations/linkedin because LinkedIn requires that product to be
 * the only one on its app.
 */
export async function GET(request: Request) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }
  if (!config.linkedinOrgClientId || !config.linkedinOrgClientSecret) {
    return NextResponse.redirect(
      new URL('/admin/lucid-os/social?linkedin_org_error=App+LinkedIn+page+non+configur%C3%A9e', request.url),
    );
  }

  const state = randomBytes(16).toString('hex');
  const response = NextResponse.redirect(buildOrgAuthorizeUrl(state));
  response.cookies.set({
    name: LINKEDIN_ORG_OAUTH_STATE_COOKIE,
    value: state,
    httpOnly: true,
    secure: config.nodeEnv === 'production',
    sameSite: 'lax',
    path: '/admin',
    maxAge: 600,
  });
  return response;
}
