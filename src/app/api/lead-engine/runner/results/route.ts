import { NextResponse } from 'next/server';
import { authenticateRunner } from '../auth';
import { getSenderAccountByLabel, recordSendResult } from '@/lib/admin/lead-engine-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface ResultItem {
  messageId?: string;
  outcome?: string;
  linkedinThreadUrl?: string;
  error?: string;
}

/** The runner reports the outcome of each send it attempted. */
export async function POST(req: Request) {
  const auth = authenticateRunner(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });

  const sender = await getSenderAccountByLabel(auth.senderLabel, 'linkedin');
  if (!sender) return NextResponse.json({ error: 'sender account not found' }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as { results?: ResultItem[] };
  const results = Array.isArray(body.results) ? body.results : [];

  let processed = 0;
  for (const r of results) {
    if (!r.messageId) continue;
    if (r.outcome !== 'sent' && r.outcome !== 'failed' && r.outcome !== 'skipped') continue;
    await recordSendResult({
      messageId: r.messageId,
      senderAccountId: sender.id,
      outcome: r.outcome,
      linkedinThreadUrl: r.linkedinThreadUrl ?? null,
      error: r.error ?? null,
    });
    processed += 1;
  }

  return NextResponse.json({ ok: true, processed });
}
