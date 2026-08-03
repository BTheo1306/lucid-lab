import { NextResponse } from 'next/server';
import {
  clearPortalSessionCookie,
  consumePortalPreviewToken,
  portalRedirectUrl,
  setPortalPreviewCookie,
} from '@/lib/portal/auth';

/**
 * Ouverture d'un aperçu admin du portail.
 *
 * L'admin vit sur admin.lucid-lab.fr et le portail sur client.lucid-lab.fr : un
 * domaine ne peut pas poser de cookie sur l'autre. Le passage se fait donc par
 * un jeton à usage unique et à durée très courte, sur le même principe que le
 * lien de connexion client.
 *
 * L'aperçu obtenu est en lecture seule : toutes les routes d'écriture du
 * portail le refusent.
 */
export async function GET(request: Request): Promise<NextResponse> {
  const token = new URL(request.url).searchParams.get('jeton');
  const parsed = token ? await consumePortalPreviewToken(token) : null;

  if (!parsed) {
    return NextResponse.redirect(portalRedirectUrl(request, '/connexion'), 303);
  }

  // Un aperçu ne doit pas cohabiter avec une session cliente restée ouverte sur
  // ce navigateur : la session prime, l'aperçu passerait inaperçu.
  await clearPortalSessionCookie();
  await setPortalPreviewCookie(parsed.contactId, parsed.clientId);

  return NextResponse.redirect(portalRedirectUrl(request, '/'), 303);
}
