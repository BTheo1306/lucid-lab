import { NextResponse } from 'next/server';
import { getPortalSession, portalRedirectUrl } from '@/lib/portal/auth';
import { createClientRequest } from '@/lib/portal/requests';

/** POST /echanges/creer: the client submits a request to the agency. */
export async function POST(request: Request) {
  const session = await getPortalSession();
  if (!session) {
    return NextResponse.redirect(portalRedirectUrl(request, '/connexion'), 303);
  }

  const formData = await request.formData();
  const result = await createClientRequest(session, {
    requestType: String(formData.get('request_type') ?? 'question'),
    title: String(formData.get('title') ?? ''),
    body: String(formData.get('body') ?? ''),
  });

  if (!result.ok) {
    return NextResponse.redirect(portalRedirectUrl(request, '/echanges'), 303);
  }
  return NextResponse.redirect(portalRedirectUrl(request, '/echanges?cree=1'), 303);
}
