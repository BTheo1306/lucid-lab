import { NextResponse } from 'next/server';
import { authenticateRunner } from '../auth';
import {
  ensureWorkspaceId,
  getSenderAccountByLabel,
  findPersonByLinkedinUrl,
  insertOutreachEvent,
  incrementDailyCounter,
  promoteFollowup,
  setPersonStatus,
} from '@/lib/admin/lead-engine-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface SignalItem {
  type?: string;
  personLinkedinUrl?: string;
  text?: string;
}

/**
 * The runner reports network/inbox detections: an invite was accepted, or a
 * prospect replied. On acceptance we promote the follow-up into the queue; on a
 * reply we mark the prospect replied (the reply-sync cron + CRM bridge convert).
 */
export async function POST(req: Request) {
  const auth = authenticateRunner(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });

  const workspaceId = await ensureWorkspaceId();
  const sender = await getSenderAccountByLabel(auth.senderLabel, 'linkedin');

  const body = (await req.json().catch(() => ({}))) as { signals?: SignalItem[] };
  const signals = Array.isArray(body.signals) ? body.signals : [];

  let processed = 0;
  for (const s of signals) {
    if (!s.personLinkedinUrl) continue;
    if (s.type !== 'accepted' && s.type !== 'replied') continue;
    const match = await findPersonByLinkedinUrl(workspaceId, s.personLinkedinUrl);
    if (!match) continue;

    if (s.type === 'accepted') {
      await insertOutreachEvent({ workspaceId, personId: match.personId, companyId: match.companyId, eventType: 'linkedin_invite_accepted' });
      await setPersonStatus(match.personId, 'contacted');
      await promoteFollowup(match.personId, sender?.id ?? null);
      if (sender) await incrementDailyCounter(sender.id, 'invites_accepted');
    } else {
      await insertOutreachEvent({ workspaceId, personId: match.personId, companyId: match.companyId, eventType: 'linkedin_replied', payload: { text: s.text ?? null } });
      await setPersonStatus(match.personId, 'replied');
      if (sender) await incrementDailyCounter(sender.id, 'replies');
    }
    processed += 1;
  }

  return NextResponse.json({ ok: true, processed });
}
