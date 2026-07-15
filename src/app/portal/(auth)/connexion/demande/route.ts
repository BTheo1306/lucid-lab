import { NextResponse } from 'next/server';
import { portalRedirectUrl } from '@/lib/portal/auth';
import { requestPortalLogin } from '@/lib/portal/login';

function requestIp(request: Request): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0]?.trim() || null;
  return request.headers.get('x-real-ip');
}

/** POST /connexion/demande: request a magic login link (always neutral). */
export async function POST(request: Request) {
  const formData = await request.formData();
  const email = String(formData.get('email') ?? '');

  await requestPortalLogin({ email, ip: requestIp(request) });

  return NextResponse.redirect(portalRedirectUrl(request, '/connexion?envoye=1'), 303);
}
