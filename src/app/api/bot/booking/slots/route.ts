import { NextResponse } from 'next/server';
import { checkOrigin, corsHeaders } from '@/lib/bot/middleware/origin-check';
import { checkRateLimit } from '@/lib/bot/middleware/rate-limiter';
import { config } from '@/lib/bot/config';
import { listAvailableTimes } from '@/lib/bot/integrations/tidycal-client';
import { hashIp } from '@/lib/bot/utils/crypto';
import { getClientIp } from '@/lib/bot/utils/request';

export const runtime = 'nodejs';
export const maxDuration = 15;

/** GET /api/bot/booking/slots?days_ahead=14 — Proxy TidyCal availability. */
export async function GET(req: Request) {
  const origin = req.headers.get('origin');
  if (!(await checkOrigin(req))) {
    return NextResponse.json({ error: 'Origin not allowed' }, { status: 403, headers: corsHeaders(origin) });
  }

  if (!config.tidycalApiKey || !config.tidycalBookingTypeId) {
    return NextResponse.json(
      { error: 'TidyCal API unavailable', booking_url: config.tidycalPublicUrl },
      { status: 503, headers: corsHeaders(origin) },
    );
  }

  const ipHash = hashIp(getClientIp(req));
  const rl = await checkRateLimit(`ip:${ipHash}:slots`, { limit: 30, windowSec: 600, ipHash });
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Rate limited' }, { status: 429, headers: corsHeaders(origin) });
  }

  const url = new URL(req.url);
  const daysAhead = Math.max(1, Math.min(30, parseInt(url.searchParams.get('days_ahead') ?? '14', 10)));
  const startsAt = new Date();
  const endsAt = new Date(startsAt.getTime() + daysAhead * 86_400_000);

  try {
    const slots = await listAvailableTimes(config.tidycalBookingTypeId, startsAt, endsAt);
    return NextResponse.json({ slots: slots.slice(0, 20) }, { headers: corsHeaders(origin) });
  } catch (err) {
    console.error('[slots] failed:', err);
    return NextResponse.json({ error: 'Slot lookup failed' }, { status: 502, headers: corsHeaders(origin) });
  }
}

export async function OPTIONS(req: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(req.headers.get('origin')) });
}
