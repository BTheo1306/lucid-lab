import { NextResponse } from 'next/server';
import { authenticateRunner } from '../auth';
import {
  isOutreachEnabled,
  getSenderAccountByLabel,
  getDailyCounter,
  leaseDueMessages,
} from '@/lib/admin/lead-engine-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * The runner pulls its due send queue. The endpoint enforces the kill switch
 * and the per-account daily cap (it never returns more than the remaining cap),
 * and leases each returned message (queued -> dispatched) to avoid double sends.
 */
export async function GET(req: Request) {
  const auth = authenticateRunner(req);
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: 401 });

  const enabled = await isOutreachEnabled();
  const sender = await getSenderAccountByLabel(auth.senderLabel, 'linkedin');
  if (!sender) return NextResponse.json({ error: 'sender account not found' }, { status: 404 });

  if (!enabled || sender.status !== 'active') {
    return NextResponse.json({ killSwitch: !enabled, paused: true, account: { label: sender.label }, messages: [] });
  }

  const counter = await getDailyCounter(sender.id);
  const remainingInvites = Math.max(0, sender.dailyInviteCap - counter.invitesSent);
  const remainingMessages = Math.max(0, sender.dailyMessageCap - counter.messagesSent);
  const maxLease = Math.min(remainingInvites + remainingMessages, 25);
  const messages = await leaseDueMessages(sender.id, maxLease);

  return NextResponse.json({
    killSwitch: false,
    paused: false,
    account: {
      label: sender.label,
      timezone: sender.timezone,
      businessHours: { start: sender.businessHoursStart, end: sender.businessHoursEnd },
      remainingInvites,
      remainingMessages,
    },
    messages: messages.map((m) => ({
      id: m.id,
      stepKind: m.stepKind,
      body: m.bodyText,
      person: { name: m.personFullName, linkedinUrl: m.personLinkedinUrl },
      company: m.companyName,
    })),
  });
}
