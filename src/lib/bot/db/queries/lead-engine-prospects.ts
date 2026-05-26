import { supabase } from '../supabase';
import type { Contact } from './contacts';
import type { Lead } from './leads';

type QueryError = {
  code?: string;
  message?: string;
};

type AuditFlashProspectStatus = 'validated' | 'meeting_booked';

export type AuditFlashProspectSyncInput = {
  contact: Pick<Contact, 'id' | 'email' | 'first_name' | 'last_name' | 'company' | 'language'>;
  lead?: Pick<Lead, 'id' | 'project_brief' | 'interest' | 'marketing_consent'> | null;
  email?: string | null;
  name?: string | null;
  role?: string | null;
  company?: string | null;
  companyRegistration?: string | null;
  headquartersAddress?: string | null;
  teamSize?: string | null;
  sector?: string | null;
  projectBrief?: string | null;
  status?: AuditFlashProspectStatus;
  bookingStartsAt?: string | null;
  tidycalBookingId?: number | string | null;
};

type ProspectPersonLink = {
  id: string;
  company_id: string;
  workspace_id: string;
};

type ProspectPersonSelector = readonly ['contact_id' | 'lead_id' | 'email', string];

type ProspectSignalInsert = {
  workspace_id: string;
  company_id: string;
  person_id: string;
  signal_type: string;
  label: string;
  score_delta: number;
  confidence: number;
  source: string;
  source_url: string;
  value: Record<string, string | number | boolean | null>;
};

function missingLeadEngineRelation(error: QueryError | null): boolean {
  return error?.code === '42P01'
    || error?.code === 'PGRST205'
    || Boolean(error?.message?.includes('does not exist'))
    || Boolean(error?.message?.includes('Could not find the table'));
}

function clean(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeEmail(value: string | null | undefined): string | null {
  return clean(value)?.toLowerCase() ?? null;
}

function emailDomain(email: string | null): string | null {
  const domain = email?.split('@')[1]?.trim().toLowerCase();
  return domain || null;
}

function fullName(input: AuditFlashProspectSyncInput): string | null {
  return clean(input.name)
    ?? [clean(input.contact.first_name), clean(input.contact.last_name)].filter(Boolean).join(' ')
    ?? null;
}

function companyName(input: AuditFlashProspectSyncInput, email: string | null): string {
  return clean(input.company)
    ?? clean(input.contact.company)
    ?? fullName(input)
    ?? email
    ?? 'Audit Flash prospect';
}

function splitName(name: string | null): { firstName: string | null; lastName: string | null } {
  const firstName = clean(name?.split(/\s+/)[0]);
  const lastName = clean(name?.split(/\s+/).slice(1).join(' '));
  return { firstName, lastName };
}

function scoreForStatus(status: AuditFlashProspectStatus): { score: number; priority: 'high' | 'medium' } {
  return status === 'meeting_booked'
    ? { score: 18, priority: 'high' }
    : { score: 14, priority: 'medium' };
}

async function ensureWorkspaceId(): Promise<string | null> {
  const { data, error } = await supabase
    .from('lead_engine_workspaces')
    .select('id')
    .eq('slug', 'lucid-lab')
    .maybeSingle();

  if (error) {
    if (missingLeadEngineRelation(error)) return null;
    throw error;
  }
  if (data?.id) return String(data.id);

  const { data: inserted, error: insertError } = await supabase
    .from('lead_engine_workspaces')
    .insert({
      name: 'Lucid-Lab',
      slug: 'lucid-lab',
      owner_label: 'Lucid-Lab',
      default_language: 'fr',
      settings: {
        positioning: 'AI Lead Search & Outreach Engine',
        primary_offer: 'Audit Flash',
      },
    })
    .select('id')
    .single();

  if (insertError) throw insertError;
  return String(inserted.id);
}

async function findExistingPerson(input: {
  contactId: string;
  leadId: string | null;
  email: string | null;
}): Promise<ProspectPersonLink | null> {
  const selectors: ProspectPersonSelector[] = [
    input.contactId ? ['contact_id', input.contactId] as const : null,
    input.leadId ? ['lead_id', input.leadId] as const : null,
    input.email ? ['email', input.email] as const : null,
  ].filter((selector): selector is ProspectPersonSelector => selector !== null);

  for (const [column, value] of selectors) {
    const { data, error } = await supabase
      .from('prospect_people')
      .select('id, company_id, workspace_id')
      .eq(column, value)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      if (missingLeadEngineRelation(error)) return null;
      throw error;
    }
    if (data?.id && data.company_id && data.workspace_id) {
      return {
        id: String(data.id),
        company_id: String(data.company_id),
        workspace_id: String(data.workspace_id),
      };
    }
  }

  return null;
}

function rawData(input: AuditFlashProspectSyncInput, email: string | null) {
  return {
    source: 'audit_flash_form',
    contact_id: input.contact.id,
    lead_id: input.lead?.id ?? null,
    email,
    role: clean(input.role),
    company_registration: clean(input.companyRegistration),
    headquarters_address: clean(input.headquartersAddress),
    team_size: clean(input.teamSize),
    sector: clean(input.sector),
    project_brief: clean(input.projectBrief) ?? clean(input.lead?.project_brief),
    interest: input.lead?.interest ?? null,
    requested_call: 'audit_flash',
    booking_starts_at: clean(input.bookingStartsAt),
    tidycal_booking_id: input.tidycalBookingId ?? null,
    synced_at: new Date().toISOString(),
  };
}

async function addSignals(input: {
  workspaceId: string;
  companyId: string;
  personId: string;
  status: AuditFlashProspectStatus;
  sector: string | null;
  bookingStartsAt: string | null;
}) {
  const signals: ProspectSignalInsert[] = [
    {
      workspace_id: input.workspaceId,
      company_id: input.companyId,
      person_id: input.personId,
      signal_type: 'inbound_request',
      label: 'Formulaire Audit Flash renseigné',
      score_delta: 8,
      confidence: 1,
      source: 'website',
      source_url: 'https://lucid-lab.fr/audit-flash',
      value: { status: input.status },
    },
  ];

  if (input.bookingStartsAt) {
    signals.push({
      workspace_id: input.workspaceId,
      company_id: input.companyId,
      person_id: input.personId,
      signal_type: 'meeting_booked',
      label: 'Rendez-vous Audit Flash confirmé',
      score_delta: 10,
      confidence: 1,
      source: 'tidycal',
      source_url: 'https://tidycal.com/lucid-lab/audit-flash-30-minutes',
      value: { starts_at: input.bookingStartsAt },
    });
  }

  if (input.sector) {
    signals.push({
      workspace_id: input.workspaceId,
      company_id: input.companyId,
      person_id: input.personId,
      signal_type: 'declared_context',
      label: `Secteur: ${input.sector}`,
      score_delta: 2,
      confidence: 0.9,
      source: 'website',
      source_url: 'https://lucid-lab.fr/audit-flash',
      value: { sector: input.sector },
    });
  }

  if (signals.length === 0) return;

  const { error } = await supabase.from('prospect_signals').insert(signals);
  if (error) throw error;
}

async function addScore(input: {
  workspaceId: string;
  companyId: string;
  personId: string;
  status: AuditFlashProspectStatus;
}) {
  const { score, priority } = scoreForStatus(input.status);
  const { error } = await supabase.from('prospect_scores').insert({
    workspace_id: input.workspaceId,
    company_id: input.companyId,
    person_id: input.personId,
    score,
    max_score: 20,
    priority,
    score_version: 'inbound_audit_flash_v1',
    factors: [
      { label: 'Formulaire Audit Flash renseigné', score_delta: 8 },
      ...(input.status === 'meeting_booked' ? [{ label: 'Rendez-vous confirmé', score_delta: 10 }] : []),
    ],
  });

  if (error) throw error;
}

async function addMeetingBookedEvent(input: {
  workspaceId: string;
  companyId: string;
  personId: string;
  bookingStartsAt: string | null;
  tidycalBookingId: number | string | null;
}) {
  const { error } = await supabase.from('outreach_events').insert({
    workspace_id: input.workspaceId,
    company_id: input.companyId,
    person_id: input.personId,
    event_type: 'meeting_booked',
    provider: 'tidycal',
    provider_event_id: input.tidycalBookingId ? String(input.tidycalBookingId) : null,
    payload: {
      source: 'audit_flash_form',
      starts_at: input.bookingStartsAt,
    },
  });

  if (error) throw error;
}

export async function syncAuditFlashProspect(input: AuditFlashProspectSyncInput): Promise<ProspectPersonLink | null> {
  const workspaceId = await ensureWorkspaceId();
  if (!workspaceId) return null;

  const status = input.status ?? 'validated';
  const email = normalizeEmail(input.email) ?? normalizeEmail(input.contact.email);
  const leadId = input.lead?.id ?? null;
  const name = fullName(input);
  const { firstName, lastName } = splitName(name);
  const sector = clean(input.sector);
  const payload = rawData(input, email);
  const existing = await findExistingPerson({ contactId: input.contact.id, leadId, email });
  const now = new Date().toISOString();
  const companyPayload = {
    name: companyName(input, email),
    domain: emailDomain(email),
    industry: sector,
    niche: sector ?? 'inbound_audit_flash',
    description: clean(input.projectBrief) ?? clean(input.lead?.project_brief),
    source: 'audit_flash_form',
    source_url: 'https://lucid-lab.fr/audit-flash',
    status,
    validation_status: 'valid',
    raw_data: payload,
  };
  const personPayload = {
    contact_id: input.contact.id,
    lead_id: leadId,
    first_name: clean(input.contact.first_name) ?? firstName,
    last_name: clean(input.contact.last_name) ?? lastName,
    full_name: name,
    title: clean(input.role),
    email,
    email_status: email ? 'valid' : 'unknown',
    language: input.contact.language,
    status,
    validation_status: 'valid',
    preferred_channel: 'email',
    last_contacted_at: status === 'meeting_booked' ? now : null,
    raw_data: payload,
  };

  let link = existing;
  if (link) {
    const [{ error: companyError }, { error: personError }] = await Promise.all([
      supabase.from('prospect_companies').update(companyPayload).eq('id', link.company_id),
      supabase.from('prospect_people').update(personPayload).eq('id', link.id),
    ]);

    if (companyError) throw companyError;
    if (personError) throw personError;
  } else {
    const { data: company, error: companyError } = await supabase
      .from('prospect_companies')
      .insert({ workspace_id: workspaceId, ...companyPayload })
      .select('id')
      .single();

    if (companyError) throw companyError;

    const { data: person, error: personError } = await supabase
      .from('prospect_people')
      .insert({ workspace_id: workspaceId, company_id: company.id, ...personPayload })
      .select('id, company_id, workspace_id')
      .single();

    if (personError) throw personError;
    link = {
      id: String(person.id),
      company_id: String(person.company_id),
      workspace_id: String(person.workspace_id),
    };
  }

  await addSignals({
    workspaceId: link.workspace_id,
    companyId: link.company_id,
    personId: link.id,
    status,
    sector,
    bookingStartsAt: clean(input.bookingStartsAt),
  });
  await addScore({ workspaceId: link.workspace_id, companyId: link.company_id, personId: link.id, status });

  if (status === 'meeting_booked') {
    await addMeetingBookedEvent({
      workspaceId: link.workspace_id,
      companyId: link.company_id,
      personId: link.id,
      bookingStartsAt: clean(input.bookingStartsAt),
      tidycalBookingId: input.tidycalBookingId ?? null,
    });
  }

  return link;
}