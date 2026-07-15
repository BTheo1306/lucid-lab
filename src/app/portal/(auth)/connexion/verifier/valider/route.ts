import { NextResponse } from 'next/server';
import { portalRedirectUrl } from '@/lib/portal/auth';
import { consumePortalLoginToken } from '@/lib/portal/login';

function requestIp(request: Request): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || null;
  return request.headers.get('x-real-ip');
}

/** POST /connexion/verifier/valider: consume the single-use token, open the session. */
export async function POST(request: Request) {
  const formData = await request.formData();
  const token = String(formData.get('token') ?? '');

  const result = await consumePortalLoginToken({ token, ip: requestIp(request) });

  if (result.ok) {
    return NextResponse.redirect(portalRedirectUrl(request, '/'), 303);
  }

  const reason =
    result.reason === 'expired' ? 'expiree' : result.reason === 'revoked' ? 'acces' : 'invalide';
  return NextResponse.redirect(portalRedirectUrl(request, `/connexion?erreur=${reason}`), 303);
}
