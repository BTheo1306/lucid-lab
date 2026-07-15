import { NextResponse } from 'next/server';
import { getPortalSession, portalRedirectUrl } from '@/lib/portal/auth';
import { respondToAgencyRequest } from '@/lib/portal/requests';

/** POST /echanges/[id]/repondre: approve, mark done, or request changes. */
export async function POST(request: Request, context: { params: Promise<{ requestId: string }> }) {
  const session = await getPortalSession();
  if (!session) {
    return NextResponse.redirect(portalRedirectUrl(request, '/connexion'), 303);
  }

  const { requestId } = await context.params;
  const formData = await request.formData();
  const rawAction = String(formData.get('action') ?? '');
  const action = rawAction === 'approve' ? 'approve' : rawAction === 'done' ? 'done' : 'changes';

  const result = await respondToAgencyRequest(session, requestId, {
    action,
    note: String(formData.get('note') ?? ''),
  });

  const suffix = result.ok ? '?repondu=1' : '';
  return NextResponse.redirect(portalRedirectUrl(request, `/echanges/${requestId}${suffix}`), 303);
}
