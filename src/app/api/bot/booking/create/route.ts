import { NextResponse } from 'next/server';
import { checkOrigin, corsHeaders } from '@/lib/bot/middleware/origin-check';
import { checkRateLimit } from '@/lib/bot/middleware/rate-limiter';
import { findContactBySessionId, updateContact } from '@/lib/bot/db/queries/contacts';
import { syncAuditFlashProspect } from '@/lib/bot/db/queries/lead-engine-prospects';
import { upsertCrmProspectFromBooking } from '@/lib/bot/db/queries/crm-prospect';
import { findLeadByContactId } from '@/lib/bot/db/queries/leads';
import { config } from '@/lib/bot/config';
import { createBooking } from '@/lib/bot/integrations/tidycal-client';
import { supabase } from '@/lib/bot/db/supabase';
import { hashIp } from '@/lib/bot/utils/crypto';
import { getClientIp } from '@/lib/bot/utils/request';

export const runtime = 'nodejs';
export const maxDuration = 30;

/** POST /api/bot/booking/create — Create a TidyCal booking from the widget. */
export async function POST(req: Request) {
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

  let body: {
    session_id?: string;
    conversation_id?: string;
    lead_id?: string | null;
    name?: string;
    email?: string;
    starts_at?: string;
    timezone?: string;
  } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400, headers: corsHeaders(origin) });
  }

  if (!body.session_id || !body.name || !body.email || !body.starts_at) {
    return NextResponse.json(
      { error: 'session_id, name, email and starts_at required' },
      { status: 400, headers: corsHeaders(origin) },
    );
  }
  if (!body.email.includes('@')) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400, headers: corsHeaders(origin) });
  }

  const contact = await findContactBySessionId(body.session_id);
  if (!contact) {
    return NextResponse.json({ error: 'Unknown session' }, { status: 404, headers: corsHeaders(origin) });
  }

  const ipHash = hashIp(getClientIp(req));
  const rl = await checkRateLimit(`session:${body.session_id}:booking`, {
    limit: 3,
    windowSec: 3600,
    contactId: contact.id,
    ipHash,
  });
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many bookings' }, { status: 429, headers: corsHeaders(origin) });
  }

  let booking;
  try {
    booking = await createBooking(config.tidycalBookingTypeId, {
      name: body.name,
      email: body.email,
      starts_at: body.starts_at,
      timezone: body.timezone ?? 'Europe/Paris',
    });
  } catch (err) {
    console.error('[booking] tidycal failed:', err);
    return NextResponse.json({ error: 'Booking failed' }, { status: 502, headers: corsHeaders(origin) });
  }

  // Persist
  await supabase.from('tidycal_bookings').insert({
    contact_id: contact.id,
    conversation_id: body.conversation_id ?? null,
    tidycal_booking_id: booking.id,
    booking_type_id: Number(config.tidycalBookingTypeId),
    starts_at: booking.starts_at,
    name: body.name,
    email: body.email,
    timezone: body.timezone ?? 'Europe/Paris',
    status: 'confirmed',
  });

  // Update contact email if not yet set
  if (!contact.email) {
    await updateContact(contact.id, { email: body.email.toLowerCase() });
  }

  const lead = await findLeadByContactId(contact.id).catch(() => null);

  try {
    await syncAuditFlashProspect({
      contact,
      lead,
      email: body.email,
      name: body.name,
      projectBrief: lead?.project_brief ?? null,
      status: 'meeting_booked',
      bookingStartsAt: booking.starts_at,
      tidycalBookingId: booking.id,
    });
  } catch (err) {
    console.error('[booking] lead engine prospect sync failed:', err);
  }

  // Bridge the booked call into the CRM clients board (Prospects section).
  try {
    await upsertCrmProspectFromBooking({
      name: body.name,
      email: body.email,
      company: contact.company,
      projectBrief: lead?.project_brief ?? null,
      bookingStartsAt: booking.starts_at,
      slugSeed: contact.id,
      bookingSource: 'website_widget',
    });
  } catch (err) {
    console.error('[booking] CRM prospect sync failed:', err);
  }

  return NextResponse.json(
    {
      ok: true,
      booking_id: booking.id,
      starts_at: booking.starts_at,
    },
    { headers: corsHeaders(origin) },
  );
}

export async function OPTIONS(req: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(req.headers.get('origin')) });
}
