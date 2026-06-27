import { NextResponse } from 'next/server';

import { config } from '@/lib/bot/config';
import { logSecurityEvent } from '@/lib/bot/db/queries/security-audit';
import { runLeadPipeline } from '@/lib/admin/lead-engine-pipeline';
import { isOutreachEnabled } from '@/lib/admin/lead-engine-store';

export const runtime = 'nodejs';
export const maxDuration = 300;

function isAuthorized(req: Request): boolean {
  if (!config.cronSecret) return false;
  return req.headers.get('authorization') === `Bearer ${config.cronSecret}`;
}

/**
 * GET /api/cron/lead-pipeline
 * One pass of the outbound pipeline per active campaign: source, score,
 * research, draft, and route to the send queue or the human-touch lane.
 * Batch is intentionally small to fit the function timeout; the funnel fills
 * over successive days.
 */
export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    await logSecurityEvent({ event_type: 'cron_unauthorized', details: { route: 'lead-pipeline' } });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!(await isOutreachEnabled())) {
    return NextResponse.json({ ok: true, skipped: 'outreach disabled' });
  }

  const result = await runLeadPipeline({ limitPerCampaign: 5 });
  return NextResponse.json({ ok: true, ...result });
}
