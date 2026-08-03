import { NextResponse } from 'next/server';
import { getPortalSession, portalRedirectUrl, isPortalReadOnly } from '@/lib/portal/auth';
import { createPortalImport } from '@/lib/portal/data';

/** POST /informations/contexte: free-text context fed into client_imports. */
export async function POST(request: Request) {
  const session = await getPortalSession();
  if (!session) {
    return NextResponse.redirect(portalRedirectUrl(request, '/connexion'), 303);
  }

  // Un apercu admin est en lecture seule : sans ca, la demande serait
  // enregistree au nom du client alors qu'il n'a rien fait.
  if (isPortalReadOnly(session)) {
    return NextResponse.redirect(portalRedirectUrl(request, '/?apercu=lecture-seule'), 303);
  }

  const formData = await request.formData();
  const result = await createPortalImport(session, {
    content: String(formData.get('content') ?? ''),
  });

  const suffix = result.ok ? '?envoye=1' : '?erreur=1';
  return NextResponse.redirect(portalRedirectUrl(request, `/informations${suffix}`), 303);
}
