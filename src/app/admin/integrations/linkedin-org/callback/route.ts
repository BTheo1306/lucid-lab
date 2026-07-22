import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { adminRedirectUrl, isAdminAuthenticated } from '@/lib/admin/auth';
import { LINKEDIN_ORG_OAUTH_STATE_COOKIE, exchangeOrgCodeForToken } from '@/lib/admin/linkedin/client';
import { saveLinkedInOrgAccount } from '@/lib/admin/linkedin/org-account';

export const runtime = 'nodejs';

/**
 * GET /admin/integrations/linkedin-org/callback
 * LinkedIn redirects here with `code` + `state` for the page's Community
 * Management API app. No member identity to resolve here (that app carries
 * only `w_organization_social`): just verify the CSRF state, exchange the
 * code, and persist the page token.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const socialUrl = (params: string) =>
    NextResponse.redirect(adminRedirectUrl(request, `/lucid-os/social?${params}`));
  const fail = (message: string) => socialUrl(`linkedin_org_error=${encodeURIComponent(message)}`);

  if (!(await isAdminAuthenticated())) {
    return NextResponse.redirect(adminRedirectUrl(request, '/login'));
  }

  const oauthError = url.searchParams.get('error');
  if (oauthError) {
    return fail(url.searchParams.get('error_description') || oauthError);
  }

  const code = url.searchParams.get('code');
  const returnedState = url.searchParams.get('state');
  const cookieStore = await cookies();
  const expectedState = cookieStore.get(LINKEDIN_ORG_OAUTH_STATE_COOKIE)?.value;

  if (!code || !returnedState || !expectedState || returnedState !== expectedState) {
    return fail('Vérification OAuth échouée (state invalide). Réessayez la connexion.');
  }

  try {
    const token = await exchangeOrgCodeForToken(code);
    await saveLinkedInOrgAccount(token);
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'Erreur inconnue pendant la connexion de la page LinkedIn.');
  }

  const response = socialUrl('linkedin_org_connected=1');
  response.cookies.set({ name: LINKEDIN_ORG_OAUTH_STATE_COOKIE, value: '', path: '/', maxAge: 0 });
  return response;
}
