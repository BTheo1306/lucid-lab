import { supabase } from '../supabase';

/**
 * Bridge an inbound booked call into the Lucid OS CRM `clients` board so it shows
 * up in the Prospects section. This is deliberately separate from the Lead Engine
 * prospect sync (`lead-engine-prospects.ts`): the Lead Engine tracks the outbound
 * sourcing funnel, while `clients` is the human-curated agency pipeline.
 *
 * Only *booked* calls flow here (not bare form submissions) to keep the CRM board
 * free of unqualified noise.
 */

const ORG_ID = '2ee10622-ce92-454a-af4e-693b2007b42c';

export type CrmBookingProspectInput = {
  name: string | null;
  email: string;
  company?: string | null;
  sector?: string | null;
  projectBrief?: string | null;
  /** ISO 8601 start time of the booked call, when known. */
  bookingStartsAt?: string | null;
  /** Extra entropy for slug uniqueness (e.g. a contact or session id). */
  slugSeed?: string | null;
  /** Where the booking originated, for audit + task labelling. */
  bookingSource: 'website_widget' | 'tidycal_relay' | 'manual';
};

export type CrmProspectResult = { clientId: string; isNew: boolean };

function clean(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function slugify(value: string): string {
  const base = value
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
  return base || 'prospect';
}

async function slugExists(slug: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('clients')
    .select('id')
    .eq('organization_id', ORG_ID)
    .eq('slug', slug)
    .maybeSingle();
  if (error) throw error;
  return Boolean(data?.id);
}

async function uniqueSlug(base: string, seed: string | null): Promise<string> {
  if (!(await slugExists(base))) return base;
  const suffix = (seed ?? '').replace(/[^a-z0-9]/gi, '').slice(-4).toLowerCase() || 'lead';
  const candidate = `${base}-${suffix}`.slice(0, 58);
  if (!(await slugExists(candidate))) return candidate;
  const extra = (seed ?? '').replace(/[^a-z0-9]/gi, '').slice(0, 4).toLowerCase() || 'x';
  return `${candidate}-${extra}`.slice(0, 60);
}

async function findClientByEmail(email: string): Promise<{ id: string } | null> {
  const { data, error } = await supabase
    .from('clients')
    .select('id')
    .eq('organization_id', ORG_ID)
    .ilike('primary_contact_email', email)
    .limit(1)
    .maybeSingle();
  if (error) throw error;
  return data ? { id: String(data.id) } : null;
}

/**
 * Idempotent by primary_contact_email: an existing client is nudged (fresh touch
 * + upcoming-call action) without downgrading its status; an unknown contact is
 * created as a `lead` at the `meeting_booked` stage with a primary contact and a
 * prep task. Returns null when there is no usable email.
 */
export async function upsertCrmProspectFromBooking(
  input: CrmBookingProspectInput,
): Promise<CrmProspectResult | null> {
  const email = clean(input.email)?.toLowerCase();
  if (!email) return null;

  const name = clean(input.name);
  const company = clean(input.company);
  const displayName = company ?? name ?? email;
  const startsAt = clean(input.bookingStartsAt);
  const now = new Date().toISOString();
  const nextAction = `Préparer le call Audit Flash${name ? ` avec ${name}` : ''}`;

  const existing = await findClientByEmail(email);
  let clientId: string;
  let isNew: boolean;

  if (existing) {
    // Never downgrade a real client: only record the fresh touch + upcoming call.
    const { error } = await supabase
      .from('clients')
      .update({ last_contacted_at: now, next_action: nextAction, next_action_due_at: startsAt })
      .eq('id', existing.id);
    if (error) throw error;
    clientId = existing.id;
    isNew = false;
  } else {
    const slug = await uniqueSlug(slugify(displayName), input.slugSeed ?? email);
    const { data, error } = await supabase
      .from('clients')
      .insert({
        organization_id: ORG_ID,
        slug,
        name: displayName,
        status: 'lead',
        lifecycle_stage: 'meeting_booked',
        health_status: 'healthy',
        health_score: 55,
        health_summary: 'Lead entrant : a réservé un call Audit Flash.',
        industry: clean(input.sector),
        primary_contact_name: name,
        primary_contact_email: email,
        owner_label: 'Jules',
        next_action: nextAction,
        next_action_due_at: startsAt,
        last_contacted_at: now,
        notes: clean(input.projectBrief),
        metadata: {
          source: 'booking',
          booking_source: input.bookingSource,
          // Mirror the shape the CRM clients UI reads (metadata.intake) so a booked
          // lead shows "meeting booked", not the default "not booked".
          intake: {
            meeting_status: 'booked',
            meeting_booked_at: startsAt,
            source: input.bookingSource === 'website_widget' ? 'inbound_booking_website' : 'inbound_booking_tidycal',
            captured_by: 'booking_bridge',
            captured_at: now,
          },
        },
      })
      .select('id')
      .single();
    if (error) throw error;
    clientId = String(data.id);
    isNew = true;

    const { error: contactError } = await supabase.from('client_contacts').insert({
      organization_id: ORG_ID,
      client_id: clientId,
      full_name: name ?? email,
      email,
      is_primary: true,
      is_decision_maker: true,
      influence_level: 'high',
      status: 'active',
      metadata: { source: 'booking' },
    });
    if (contactError) throw contactError;
  }

  // Refresh the single booking-sourced prep task so repeat bookings don't stack.
  await supabase
    .from('client_tasks')
    .delete()
    .eq('organization_id', ORG_ID)
    .eq('client_id', clientId)
    .eq('status', 'todo')
    .eq('metadata->>source', 'booking');

  const { error: taskError } = await supabase.from('client_tasks').insert({
    organization_id: ORG_ID,
    client_id: clientId,
    title: `${nextAction}${startsAt ? '' : ' (heure à confirmer)'}`,
    status: 'todo',
    priority: 'high',
    owner_label: 'Jules',
    due_at: startsAt,
    created_by: 'agent',
    metadata: { source: 'booking', booking_source: input.bookingSource },
  });
  if (taskError) throw taskError;

  await supabase.from('audit_events').insert({
    organization_id: ORG_ID,
    actor_type: 'automation',
    event_type: 'inbound_booking_synced',
    target_table: 'clients',
    risk_level: 'low',
    summary: `Call entrant synchronisé au CRM : ${displayName}${isNew ? ' (nouveau prospect)' : ' (client existant)'}`,
    details: {
      source: 'booking_bridge',
      booking_source: input.bookingSource,
      client_id: clientId,
      email,
      starts_at: startsAt,
      created: isNew,
    },
  });

  return { clientId, isNew };
}
