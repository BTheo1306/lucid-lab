import { NextResponse } from 'next/server';
import { recordPortalAuditEvent } from '@/lib/portal/audit';
import { getPortalSession, portalRedirectUrl } from '@/lib/portal/auth';
import { downloadPortalDocumentFile } from '@/lib/portal/data';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Authenticated PDF proxy: session check, client-scoped document lookup
 * (someone else's document id resolves to 404, never 403), then the Drive
 * file is streamed through the server. No Drive URL ever reaches the client.
 */
export async function GET(request: Request, context: { params: Promise<{ documentId: string }> }) {
  const session = await getPortalSession();
  if (!session) {
    return NextResponse.redirect(portalRedirectUrl(request, '/connexion'), 303);
  }

  const { documentId } = await context.params;

  try {
    const file = await downloadPortalDocumentFile(session, documentId);
    if (!file) {
      return new NextResponse('Document introuvable.', { status: 404 });
    }

    await recordPortalAuditEvent({
      organizationId: session.organizationId,
      clientId: session.clientId,
      eventType: 'portal_document_downloaded',
      summary: `Document téléchargé depuis le portail : ${file.fileName}`,
      actorId: session.contactId,
      targetTable: 'client_documents',
      targetId: documentId,
    });

    const asciiName = file.fileName.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^\x20-\x7E]/g, '_');
    return new NextResponse(file.body, {
      status: 200,
      headers: {
        'Content-Type': file.contentType,
        'Content-Disposition': `attachment; filename="${asciiName}"; filename*=UTF-8''${encodeURIComponent(file.fileName)}`,
        'Cache-Control': 'private, no-store',
        'X-Robots-Tag': 'noindex, nofollow',
      },
    });
  } catch (error) {
    console.error('[portal] document download failed:', error instanceof Error ? error.message : error);
    return new NextResponse('Le document est temporairement indisponible. Réessayez dans quelques minutes.', {
      status: 502,
    });
  }
}
