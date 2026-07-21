import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { adminRedirectUrl, isAdminAuthenticated } from '@/lib/admin/auth';
import {
  LINKEDIN_OAUTH_STATE_COOKIE,
  exchangeCodeForToken,
  fetchMemberInfo,
} from '@/lib/admin/linkedin/client';
import { saveLinkedInAccount } from '@/lib/admin/linkedin/account';

export const runtime = 'nodejs';

/**
 * GET /admin/integrations/linkedin/callback
 * LinkedIn redirects here with `code` + `state`. We verify the CSRF state,
 * exchange the code for tokens, resolve the member URN, persist the account,
 * then bounce back to the LinkedIn content page.
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const socialUrl = (params: string) =>
    NextResponse.redirect(adminRedirectUrl(request, `/lucid-os/social?${params}`));
  const fail = (message: string) => socialUrl(`linkedin_error=${encodeURIComponent(message)}`);

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
  const expectedState = cookieStore.get(LINKEDIN_OAUTH_STATE_COOKIE)?.value;

  if (!code || !returnedState || !expectedState || returnedState !== expectedState) {
    return fail('Vérification OAuth échouée (state invalide). Réessayez la connexion.');
  }

  try {
    const token = await exchangeCodeForToken(code);
    const member = await fetchMemberInfo(token.accessToken);
    await saveLinkedInAccount({ token, member });
  } catch (error) {
    return fail(error instanceof Error ? error.message : 'Erreur inconnue pendant la connexion LinkedIn.');
  }

  const response = socialUrl('linkedin_connected=1');
  response.cookies.set({ name: LINKEDIN_OAUTH_STATE_COOKIE, value: '', path: '/', maxAge: 0 });
  return response;
}
