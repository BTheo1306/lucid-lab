import { NextResponse } from 'next/server';

import { config } from '@/lib/bot/config';
import { logSecurityEvent } from '@/lib/bot/db/queries/security-audit';
import { autoApproveDuePosts } from '@/lib/admin/social';

export const runtime = 'nodejs';
export const maxDuration = 30;

const REVIEW_WINDOW_HOURS = 24;

function isAuthorized(req: Request): boolean {
  if (!config.cronSecret) return false;
  return req.headers.get('authorization') === `Bearer ${config.cronSecret}`;
}

/**
 * GET /api/cron/linkedin-autoapprove
 * Silence = approval: any `queued` LinkedIn post whose scheduled time is within
 * the review window and that nobody rejected or edited flips to `approved`, so
 * the posting cron will publish it.
 */
export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    await logSecurityEvent({ event_type: 'cron_unauthorized', details: { route: 'linkedin-autoapprove' } });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const approved = await autoApproveDuePosts(REVIEW_WINDOW_HOURS);
  return NextResponse.json({ ok: true, approved });
}
