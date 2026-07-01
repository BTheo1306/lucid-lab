import { NextRequest, NextResponse } from 'next/server';
import { randomUUID, timingSafeEqual } from 'crypto';
import { supabase } from '@/lib/bot/db/supabase';
import { findContactByEmail, createContact } from '@/lib/bot/db/queries/contacts';
import { syncAuditFlashProspect } from '@/lib/bot/db/queries/lead-engine-prospects';
import { upsertCrmProspectFromBooking } from '@/lib/bot/db/queries/crm-prospect';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

const ORG_ID = '2ee10622-ce92-454a-af4e-693b2007b42c';

/**
 * Inbound webhook for TidyCal bookings.
 *
 * TidyCal has no native webhooks, so this endpoint is fed by a relay (Zapier /
 * Make / Pabbly) configured with a "New booking" trigger. It captures the call
 * into `tidycal_bookings`, the Lead Engine prospect tables, and the CRM clients
 * board (Prospects section) so direct-link bookings are no longer lost. Auth is a
 * shared secret (TIDYCAL_WEBHOOK_SECRET) passed as `x-webhook-secret` header or
 * `?secret=` query param.
 */

function secretOk(req: NextRequest): boolean {
  const secret = process.env.TIDYCAL_WEBHOOK_SECRET;
  if (!secret) return false;
  const provided =
    req.headers.get('x-webhook-secret') ?? new URL(req.url).searchParams.get('secret') ?? '';
  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  if (a.length !== b.length) return false;
  try {
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

function asRecord(v: unknown): Record<string, unknown> | undefined {
  return v && typeof v === 'object' ? (v as Record<string, unknown>) : undefined;
}

function str(...candidates: unknown[]): string | null {
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) return c.trim();
    if (typeof c === 'number' && Number.isFinite(c)) return String(c);
  }
  return null;
}

type NormalizedBooking = {
  name: string | null;
  email: string | null;
  startsAt: string | null;
  bookingId: number | null;
  bookingTypeId: number | null;
  timezone: string | null;
  cancelled: boolean;
};

/** Probe the common shapes a relay may forward (flat fields, nested booking/data/contact). */
function normalize(payload: Record<string, unknown>): NormalizedBooking {
  const data = asRecord(payload.data);
  const booking = asRecord(payload.booking) ?? asRecord(data?.booking) ?? data ?? payload;
  const contact = asRecord(payload.contact) ?? asRecord(booking.contact);

  const event = (str(payload.event, payload.event_type, payload.type, booking.status) ?? '').toLowerCase();
  const cancelled =
    event.includes('cancel') ||
    payload.cancelled === true ||
    booking.cancelled === true ||
    str(booking.status, payload.status)?.toLowerCase() === 'cancelled';

  const idRaw = str(payload.booking_id, payload.id, booking.id, data?.id);
  const typeRaw = str(payload.booking_type_id, booking.booking_type_id);

  return {
    name: str(payload.name, contact?.name, booking.name, payload.invitee_name),
    email: str(payload.email, contact?.email, booking.email, payload.invitee_email),
    startsAt: str(payload.starts_at, booking.starts_at, payload.startsAt, data?.starts_at),
    bookingId: idRaw ? Number(idRaw) : null,
    bookingTypeId: typeRaw ? Number(typeRaw) : null,
    timezone: str(payload.timezone, booking.timezone),
    cancelled,
  };
}

function splitName(name: string | null): { first: string | null; last: string | null } {
  const parts = (name ?? '').trim().split(/\s+/).filter(Boolean);
  return { first: parts[0] ?? null, last: parts.slice(1).join(' ') || null };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!secretOk(request)) {
    return NextResponse.json({ error: 'Invalid secret' }, { status: 401 });
  }

  let payload: Record<string, unknown>;
  try {
    payload = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const b = normalize(payload);

  // Cancellation: flip the stored booking status, nothing else to sync.
  if (b.cancelled) {
    if (b.bookingId) {
      await supabase
        .from('tidycal_bookings')
        .update({ status: 'cancelled' })
        .eq('tidycal_booking_id', b.bookingId);
    }
    return NextResponse.json({ ok: true, cancelled: true, bookingId: b.bookingId });
  }

  // Surface a visible failure (not a silent 200) if the relay mapping is wrong.
  if (!b.email || !b.startsAt) {
    return NextResponse.json(
      { error: 'email and starts_at required', receivedKeys: Object.keys(payload) },
      { status: 400 },
    );
  }

  const email = b.email.toLowerCase();
  const { first, last } = splitName(b.name);

  try {
    let contact = await findContactByEmail(email).catch(() => null);
    if (!contact) {
      contact = await createContact({
        session_id: randomUUID(),
        email,
        first_name: first,
        last_name: last,
        language: 'fr',
        source: 'tidycal_booking',
        privacy_notice_shown: true,
      });
    }

    // Idempotent by tidycal_booking_id when present.
    if (b.bookingId) {
      await supabase.from('tidycal_bookings').delete().eq('tidycal_booking_id', b.bookingId);
    }
    await supabase.from('tidycal_bookings').insert({
      contact_id: contact.id,
      tidycal_booking_id: b.bookingId,
      booking_type_id: b.bookingTypeId,
      starts_at: b.startsAt,
      name: b.name ?? email,
      email,
      timezone: b.timezone ?? 'Europe/Paris',
      status: 'confirmed',
    });

    try {
      await syncAuditFlashProspect({
        contact,
        lead: null,
        email,
        name: b.name,
        status: 'meeting_booked',
        bookingStartsAt: b.startsAt,
        tidycalBookingId: b.bookingId,
      });
    } catch (err) {
      console.error('[tidycal-webhook] lead engine sync failed:', err);
    }

    let crmResult: { clientId: string; isNew: boolean } | null = null;
    try {
      crmResult = await upsertCrmProspectFromBooking({
        name: b.name,
        email,
        company: contact.company,
        bookingStartsAt: b.startsAt,
        slugSeed: contact.id,
        bookingSource: 'tidycal_relay',
      });
    } catch (err) {
      console.error('[tidycal-webhook] CRM prospect sync failed:', err);
    }

    await supabase.from('audit_events').insert({
      organization_id: ORG_ID,
      actor_type: 'integration',
      event_type: 'tidycal_booking_webhook',
      target_table: 'tidycal_bookings',
      risk_level: 'low',
      summary: `Booking TidyCal reçu (relais) : ${b.name ?? email}`,
      details: {
        source: 'tidycal_webhook',
        tidycal_booking_id: b.bookingId,
        starts_at: b.startsAt,
        email,
        crm_client_id: crmResult?.clientId ?? null,
        crm_created: crmResult?.isNew ?? null,
      },
    });

    return NextResponse.json({ ok: true, bookingId: b.bookingId, crm: crmResult });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur webhook';
    console.error('[tidycal-webhook]', message);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
