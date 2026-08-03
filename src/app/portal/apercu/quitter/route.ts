import { NextResponse } from 'next/server';
import { clearPortalPreviewCookie, portalRedirectUrl } from '@/lib/portal/auth';

/** Ferme l'aperçu admin. Le lien du bandeau, en GET pour rester cliquable. */
export async function GET(request: Request): Promise<NextResponse> {
  await clearPortalPreviewCookie();
  return NextResponse.redirect(portalRedirectUrl(request, '/connexion'), 303);
}
