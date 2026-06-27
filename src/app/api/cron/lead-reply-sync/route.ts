import { NextResponse } from 'next/server';

import { config } from '@/lib/bot/config';
import { logSecurityEvent } from '@/lib/bot/db/queries/security-audit';
import { listRepliedProspects } from '@/lib/admin/lead-engine-store';
import { convertProspectToCrm } from '@/lib/admin/lead-engine-crm-bridge';

export const runtime = 'nodejs';
export const maxDuration = 60;

function isAuthorized(req: Request): boolean {
  if (!config.cronSecret) return false;
  return req.headers.get('authorization') === `Bearer ${config.cronSecret}`;
}

/**
 * GET /api/cron/lead-reply-sync
 * Safety sweep: convert any prospects that replied into CRM clients + tasks.
 * (Most conversions happen event-driven as the runner reports replies; this
 * catches any that were missed.)
 */
export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    await logSecurityEvent({ event_type: 'cron_unauthorized', details: { route: 'lead-reply-sync' } });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const replied = await listRepliedProspects(25);
  let converted = 0;
  for (const personId of replied) {
    try {
      const result = await convertProspectToCrm(personId);
      if (result) converted += 1;
    } catch {
      // Leave the prospect as 'replied' to retry next run.
    }
  }

  return NextResponse.json({ ok: true, replied: replied.length, converted });
}
