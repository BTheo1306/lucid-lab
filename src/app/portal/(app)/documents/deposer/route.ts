import { NextResponse } from 'next/server';
import { getPortalSession, isPortalReadOnly, portalRedirectUrl } from '@/lib/portal/auth';
import { createPortalUpload } from '@/lib/portal/uploads';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** POST /documents/deposer : le client remet une pièce, qui part sur son dossier Drive. */
export async function POST(request: Request) {
  const session = await getPortalSession();
  if (!session) {
    return NextResponse.redirect(portalRedirectUrl(request, '/connexion'), 303);
  }

  // Un apercu admin est en lecture seule : sans ca, le depot serait enregistre
  // au nom du client alors qu'il n'a rien fait.
  if (isPortalReadOnly(session)) {
    return NextResponse.redirect(portalRedirectUrl(request, '/documents?apercu=lecture-seule'), 303);
  }

  const formData = await request.formData();
  const file = formData.get('fichier');

  if (!(file instanceof File)) {
    return NextResponse.redirect(portalRedirectUrl(request, '/documents?depot=vide'), 303);
  }

  const result = await createPortalUpload(session, {
    file,
    note: String(formData.get('note') ?? ''),
    documentId: String(formData.get('document_id') ?? '') || null,
  });

  const suffix = result.ok ? '?depot=1' : `?depot=${result.reason}`;
  return NextResponse.redirect(portalRedirectUrl(request, `/documents${suffix}`), 303);
}
