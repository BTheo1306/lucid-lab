import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthenticated, isValidAdminKey } from '@/lib/admin/auth';
import { sendBonDeCommandeForSignature } from '@/lib/admin/documents/workflow';

/**
 * Temporary debug endpoint — remove after root cause is identified.
 * POST /api/admin/debug-send-bdc?document_id=<uuid>
 * Auth: session cookie OR Authorization: Bearer <ADMIN_API_KEY>
 */
export async function POST(req: NextRequest) {
  const bearerToken = req.headers.get('authorization')?.replace(/^Bearer\s+/i, '') ?? '';
  const authed = bearerToken ? isValidAdminKey(bearerToken) : await isAdminAuthenticated();
  if (!authed) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const documentId = req.nextUrl.searchParams.get('document_id');
  if (!documentId) {
    return NextResponse.json({ error: 'document_id query param is required' }, { status: 400 });
  }

  try {
    await sendBonDeCommandeForSignature(documentId);
    return NextResponse.json({ ok: true, message: 'Document sent for signature successfully.' });
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const stack = err instanceof Error ? err.stack : undefined;
    console.error('[debug-send-bdc]', message, stack);
    return NextResponse.json({ ok: false, error: message, stack }, { status: 500 });
  }
}
