import { NextResponse } from 'next/server';
import { getPortalSession, portalRedirectUrl, isPortalReadOnly } from '@/lib/portal/auth';
import { addClientMessage, resolveOwnRequest, respondToAgencyRequest } from '@/lib/portal/requests';

/**
 * POST /echanges/[id]/repondre.
 * Actions : reply (message libre dans le fil), resolve (le client clot son
 * ticket), et les reponses aux demandes agence (approve, done, changes).
 */
export async function POST(request: Request, context: { params: Promise<{ requestId: string }> }) {
  const session = await getPortalSession();
  if (!session) {
    return NextResponse.redirect(portalRedirectUrl(request, '/connexion'), 303);
  }

  // Un apercu admin est en lecture seule : sans ca, la demande serait
  // enregistree au nom du client alors qu'il n'a rien fait.
  if (isPortalReadOnly(session)) {
    return NextResponse.redirect(portalRedirectUrl(request, '/?apercu=lecture-seule'), 303);
  }

  const { requestId } = await context.params;
  const formData = await request.formData();
  const rawAction = String(formData.get('action') ?? '');

  if (rawAction === 'reply') {
    const result = await addClientMessage(session, requestId, String(formData.get('message') ?? ''));
    const suffix = result.ok ? '?message=1' : '';
    return NextResponse.redirect(portalRedirectUrl(request, `/echanges/${requestId}${suffix}`), 303);
  }

  if (rawAction === 'resolve') {
    const result = await resolveOwnRequest(session, requestId);
    const suffix = result.ok ? '?resolu=1' : '';
    return NextResponse.redirect(portalRedirectUrl(request, `/echanges/${requestId}${suffix}`), 303);
  }

  const action = rawAction === 'approve' ? 'approve' : rawAction === 'done' ? 'done' : 'changes';
  const result = await respondToAgencyRequest(session, requestId, {
    action,
    note: String(formData.get('note') ?? ''),
  });

  const suffix = result.ok ? '?repondu=1' : '';
  return NextResponse.redirect(portalRedirectUrl(request, `/echanges/${requestId}${suffix}`), 303);
}
