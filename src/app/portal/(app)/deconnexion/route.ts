import { NextResponse } from 'next/server';
import { clearPortalSessionCookie, portalRedirectUrl } from '@/lib/portal/auth';

export async function POST(request: Request) {
  await clearPortalSessionCookie();
  return NextResponse.redirect(portalRedirectUrl(request, '/connexion'), 303);
}
