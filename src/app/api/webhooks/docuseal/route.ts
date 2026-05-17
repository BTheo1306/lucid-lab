import { NextRequest, NextResponse } from 'next/server';
import { verifyDocuSealWebhookSignature } from '@/lib/admin/documents/docuseal';
import { recordDocuSealWebhookEvent } from '@/lib/admin/documents/workflow';

export const dynamic = 'force-dynamic';

function signatureHeaders(request: NextRequest): Array<string | null> {
  return [
    request.headers.get('x-docuseal-webhook-secret'),
    request.headers.get('x-docuseal-signature'),
    request.headers.get('x-webhook-signature'),
    request.headers.get('x-hub-signature-256'),
    request.headers.get('x-signature'),
  ];
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const rawBody = await request.text();
  if (!verifyDocuSealWebhookSignature(rawBody, signatureHeaders(request))) {
    return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  try {
    await recordDocuSealWebhookEvent(payload as { event_type?: string; timestamp?: string; data?: unknown }, rawBody);
    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown webhook error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}