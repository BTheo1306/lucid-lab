import { NextResponse } from 'next/server';

import { config } from '@/lib/bot/config';
import { bearerMatches } from '@/lib/security/constant-time';
import { logSecurityEvent } from '@/lib/bot/db/queries/security-audit';
import { syncDougsInvoices } from '@/lib/admin/dougs';

export const runtime = 'nodejs';
export const maxDuration = 60;

function isAuthorized(req: Request): boolean {
  if (!config.cronSecret) return false;
  return bearerMatches(req.headers.get('authorization'), config.cronSecret);
}

/**
 * GET /api/cron/dougs-sync
 * Fetches paid invoices from Dougs and upserts them into client_billing_events.
 * Runs every 3 days via Vercel cron (schedule: 0 9 *\/3 * *).
 * Requires DOUGS_SESSION_COOKIE and DOUGS_COMPANY_ID env vars.
 * If the session expires, update DOUGS_SESSION_COOKIE in Vercel env vars
 * (Application > Cookies > app.dougs.fr in browser DevTools).
 */
export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    await logSecurityEvent({ event_type: 'cron_unauthorized', details: { route: 'dougs-sync' } });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const result = await syncDougsInvoices();

  if (result.sessionExpired) {
    console.error('[dougs-sync] Session expired — update DOUGS_SESSION_COOKIE in Vercel env vars');
    return NextResponse.json({ ok: false, reason: 'dougs_session_expired', ...result });
  }

  return NextResponse.json({ ok: true, ...result });
}
