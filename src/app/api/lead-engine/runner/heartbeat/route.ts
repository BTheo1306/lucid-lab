import { NextResponse } from 'next/server';
import { authenticateRunner } from '../auth';
import { isOutreachEnabled, getSenderAccountByLabel, updateSenderHeartbeat } from '@/lib/admin/lead-engine-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** The runner pings on each loop so the UI can show worker health, and learns the kill-switch state. */
export async function POST(req: Request) {
  const auth = authenticateRunner(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });

  const sender = await getSenderAccountByLabel(auth.senderLabel, 'linkedin');
  if (!sender) return NextResponse.json({ error: 'sender account not found' }, { status: 404 });

  const body = (await req.json().catch(() => ({}))) as { sessionExpired?: boolean };
  await updateSenderHeartbeat(sender.id, Boolean(body.sessionExpired));

  const enabled = await isOutreachEnabled();
  return NextResponse.json({ ok: true, killSwitch: !enabled });
}
