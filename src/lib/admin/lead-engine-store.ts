import 'server-only';

import { supabase } from '@/lib/bot/db/supabase';

/**
 * Lead Engine v2: Supabase writer layer.
 *
 * The single source of persistence for outbound prospecting. Follows the
 * service-role pattern of src/lib/bot/db/queries/lead-engine-prospects.ts
 * (which handles the inbound Audit Flash sync): same client, same defensive
 * casting, same "missing relation" tolerance so callers degrade gracefully
 * before the migration is applied.
 */

type QueryError = { code?: string; message?: string };

export function missingLeadEngineRelation(error: QueryError | null): boolean {
  return error?.code === '42P01'
    || error?.code === 'PGRST205'
    || Boolean(error?.message?.includes('does not exist'))
    || Boolean(error?.message?.includes('Could not find the table'));
}

const WORKSPACE_SLUG = 'lucid-lab';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function clean(value?: string | null): string | null {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function normalizeUrl(value?: string | null): string | null {
  const trimmed = clean(value);
  return trimmed ? trimmed.replace(/\/+$/, '').toLowerCase() : null;
}

function normalizeDomain(value?: string | null): string | null {
  const trimmed = clean(value);
  if (!trimmed) return null;
  const host = trimmed.replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0]?.toLowerCase();
  return host || null;
}

function normalizeEmail(value?: string | null): string | null {
  return clean(value)?.toLowerCase() ?? null;
}

// ─── Workspace + campaigns ────────────────────────────────────────────────────

export async function ensureWorkspaceId(): Promise<string> {
  const { data, error } = await supabase
    .from('lead_engine_workspaces')
    .select('id')
    .eq('slug', WORKSPACE_SLUG)
    .maybeSingle();
  if (error && !missingLeadEngineRelation(error)) throw error;
  if (data?.id) return String(data.id);

  const { data: created, error: insertError } = await supabase
    .from('lead_engine_workspaces')
    .insert({ name: 'Lucid-Lab', slug: WORKSPACE_SLUG, owner_label: 'Lucid-Lab', default_language: 'fr' })
    .select('id')
    .single();
  if (insertError) throw insertError;
  return String(created.id);
}

export async function isOutreachEnabled(): Promise<boolean> {
  const { data, error } = await supabase
    .from('lead_engine_workspaces')
    .select('outreach_enabled')
    .eq('slug', WORKSPACE_SLUG)
    .maybeSingle();
  if (error) {
    if (missingLeadEngineRelation(error)) return false;
    throw error;
  }
  return data?.outreach_enabled !== false;
}

export interface LeadEngineCampaign {
  id: string;
  name: string;
  status: string;
  icpConfig: Record<string, unknown>;
  scoringConfig: Record<string, unknown>;
  outreachConfig: Record<string, unknown>;
  idealEmployeeMin: number;
  idealEmployeeMax: number;
  targetLocations: string[];
  targetLanguages: string[];
}

function mapCampaign(row: Record<string, unknown>): LeadEngineCampaign {
  return {
    id: String(row.id),
    name: String(row.name),
    status: String(row.status),
    icpConfig: (row.icp_config ?? {}) as Record<string, unknown>,
    scoringConfig: (row.scoring_config ?? {}) as Record<string, unknown>,
    outreachConfig: (row.outreach_config ?? {}) as Record<string, unknown>,
    idealEmployeeMin: Number(row.ideal_employee_min ?? 0),
    idealEmployeeMax: Number(row.ideal_employee_max ?? 0),
    targetLocations: (row.target_locations ?? []) as string[],
    targetLanguages: (row.target_languages ?? []) as string[],
  };
}

const CAMPAIGN_COLUMNS =
  'id,name,status,icp_config,scoring_config,outreach_config,ideal_employee_min,ideal_employee_max,target_locations,target_languages';

export async function listActiveCampaigns(): Promise<LeadEngineCampaign[]> {
  const workspaceId = await ensureWorkspaceId();
  const { data, error } = await supabase
    .from('lead_engine_campaigns')
    .select(CAMPAIGN_COLUMNS)
    .eq('workspace_id', workspaceId)
    .in('status', ['draft', 'active']);
  if (error) {
    if (missingLeadEngineRelation(error)) return [];
    throw error;
  }
  return (data ?? []).map((row) => mapCampaign(row as Record<string, unknown>));
}

export interface CaseStudy {
  vertical: string;
  proofLine: string;
  metric: string | null;
}

export async function listCaseStudies(workspaceId: string): Promise<CaseStudy[]> {
  const { data, error } = await supabase
    .from('outreach_case_studies')
    .select('vertical,proof_line,metric')
    .eq('workspace_id', workspaceId)
    .eq('is_active', true);
  if (error) {
    if (missingLeadEngineRelation(error)) return [];
    throw error;
  }
  return (data ?? []).map((row) => ({
    vertical: String(row.vertical),
    proofLine: String(row.proof_line),
    metric: row.metric ? String(row.metric) : null,
  }));
}

// ─── Sender accounts ──────────────────────────────────────────────────────────

export interface SenderAccount {
  id: string;
  label: string;
  channel: string;
  status: string;
  dailyInviteCap: number;
  dailyMessageCap: number;
  businessHoursStart: number;
  businessHoursEnd: number;
  timezone: string;
  runnerTokenHash: string | null;
}

export async function getSenderAccountByLabel(label: string, channel = 'linkedin'): Promise<SenderAccount | null> {
  const workspaceId = await ensureWorkspaceId();
  const { data, error } = await supabase
    .from('outreach_sender_accounts')
    .select('id,label,channel,status,daily_invite_cap,daily_message_cap,business_hours_start,business_hours_end,timezone,runner_token_hash')
    .eq('workspace_id', workspaceId)
    .eq('label', label)
    .eq('channel', channel)
    .maybeSingle();
  if (error) {
    if (missingLeadEngineRelation(error)) return null;
    throw error;
  }
  if (!data) return null;
  return {
    id: String(data.id),
    label: String(data.label),
    channel: String(data.channel),
    status: String(data.status),
    dailyInviteCap: Number(data.daily_invite_cap ?? 0),
    dailyMessageCap: Number(data.daily_message_cap ?? 0),
    businessHoursStart: Number(data.business_hours_start ?? 9),
    businessHoursEnd: Number(data.business_hours_end ?? 18),
    timezone: String(data.timezone ?? 'Europe/Paris'),
    runnerTokenHash: data.runner_token_hash ? String(data.runner_token_hash) : null,
  };
}

// ─── Suppression ──────────────────────────────────────────────────────────────

export async function isSuppressed(input: {
  email?: string | null;
  domain?: string | null;
  linkedinUrl?: string | null;
}): Promise<boolean> {
  const workspaceId = await ensureWorkspaceId();
  const email = normalizeEmail(input.email);
  const domain = normalizeDomain(input.domain);
  const linkedinUrl = normalizeUrl(input.linkedinUrl);
  if (!email && !domain && !linkedinUrl) return false;

  const checks: Array<Promise<boolean>> = [];
  const probe = async (column: string, value: string): Promise<boolean> => {
    const { data, error } = await supabase
      .from('suppression_list')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq(column, value)
      .limit(1)
      .maybeSingle();
    if (error) {
      if (missingLeadEngineRelation(error)) return false;
      throw error;
    }
    return Boolean(data?.id);
  };
  if (email) checks.push(probe('email', email));
  if (domain) checks.push(probe('domain', domain));
  if (linkedinUrl) checks.push(probe('linkedin_url', linkedinUrl));

  return (await Promise.all(checks)).some(Boolean);
}

// ─── Prospect companies ───────────────────────────────────────────────────────

export interface UpsertCompanyInput {
  workspaceId: string;
  campaignId?: string | null;
  name: string;
  domain?: string | null;
  linkedinUrl?: string | null;
  country?: string | null;
  city?: string | null;
  industry?: string | null;
  niche?: string | null;
  employeeCount?: number | null;
  source: string;
  sourceUrl?: string | null;
  status?: string;
  raw?: Record<string, unknown>;
}

async function findCompanyId(workspaceId: string, keys: {
  linkedinUrl: string | null;
  domain: string | null;
  name: string;
  country: string | null;
}): Promise<string | null> {
  const selectors: Array<['linkedin_url' | 'domain', string]> = [];
  if (keys.linkedinUrl) selectors.push(['linkedin_url', keys.linkedinUrl]);
  if (keys.domain) selectors.push(['domain', keys.domain]);

  for (const [column, value] of selectors) {
    const { data, error } = await supabase
      .from('prospect_companies')
      .select('id')
      .eq('workspace_id', workspaceId)
      .eq(column, value)
      .limit(1)
      .maybeSingle();
    if (error) {
      if (missingLeadEngineRelation(error)) return null;
      throw error;
    }
    if (data?.id) return String(data.id);
  }

  // Fall back to name + country (case-insensitive name).
  const { data, error } = await supabase
    .from('prospect_companies')
    .select('id')
    .eq('workspace_id', workspaceId)
    .ilike('name', keys.name)
    .limit(1)
    .maybeSingle();
  if (error) {
    if (missingLeadEngineRelation(error)) return null;
    throw error;
  }
  return data?.id ? String(data.id) : null;
}

export async function upsertProspectCompany(input: UpsertCompanyInput): Promise<string> {
  const domain = normalizeDomain(input.domain);
  const linkedinUrl = normalizeUrl(input.linkedinUrl);
  const payload = {
    campaign_id: input.campaignId ?? null,
    name: input.name,
    domain,
    linkedin_url: linkedinUrl,
    country: clean(input.country),
    city: clean(input.city),
    industry: clean(input.industry),
    niche: clean(input.niche),
    employee_count: typeof input.employeeCount === 'number' ? input.employeeCount : null,
    source: input.source,
    source_url: clean(input.sourceUrl),
    status: input.status ?? 'discovered',
    raw_data: input.raw ?? {},
  };

  const existingId = await findCompanyId(input.workspaceId, {
    linkedinUrl,
    domain,
    name: input.name,
    country: clean(input.country),
  });
  if (existingId) {
    const { error } = await supabase.from('prospect_companies').update(payload).eq('id', existingId);
    if (error) throw error;
    return existingId;
  }

  const { data, error } = await supabase
    .from('prospect_companies')
    .insert({ workspace_id: input.workspaceId, ...payload })
    .select('id')
    .single();
  if (error) throw error;
  return String(data.id);
}

// ─── Prospect people ──────────────────────────────────────────────────────────

const ALREADY_TOUCHED = new Set(['contacted', 'replied', 'meeting_booked', 'converted', 'do_not_contact']);

export type BuyerRole = 'champion' | 'economic_buyer' | 'executive_sponsor' | 'founder_ceo' | 'end_user' | 'unknown';

export interface UpsertPersonInput {
  workspaceId: string;
  companyId: string;
  fullName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  title?: string | null;
  seniority?: string | null;
  linkedinUrl?: string | null;
  email?: string | null;
  language?: string | null;
  country?: string | null;
  buyerRole?: BuyerRole;
  status?: string;
  research?: Record<string, unknown>;
  raw?: Record<string, unknown>;
}

export interface UpsertPersonResult {
  id: string;
  alreadyContacted: boolean;
}

async function findPerson(workspaceId: string, companyId: string, keys: {
  linkedinUrl: string | null;
  fullName: string | null;
}): Promise<{ id: string; status: string } | null> {
  if (keys.linkedinUrl) {
    const { data, error } = await supabase
      .from('prospect_people')
      .select('id,status')
      .eq('workspace_id', workspaceId)
      .eq('linkedin_url', keys.linkedinUrl)
      .limit(1)
      .maybeSingle();
    if (error) {
      if (missingLeadEngineRelation(error)) return null;
      throw error;
    }
    if (data?.id) return { id: String(data.id), status: String(data.status) };
  }
  if (keys.fullName) {
    const { data, error } = await supabase
      .from('prospect_people')
      .select('id,status')
      .eq('workspace_id', workspaceId)
      .eq('company_id', companyId)
      .ilike('full_name', keys.fullName)
      .limit(1)
      .maybeSingle();
    if (error) {
      if (missingLeadEngineRelation(error)) return null;
      throw error;
    }
    if (data?.id) return { id: String(data.id), status: String(data.status) };
  }
  return null;
}

export async function upsertProspectPerson(input: UpsertPersonInput): Promise<UpsertPersonResult> {
  const linkedinUrl = normalizeUrl(input.linkedinUrl);
  const email = normalizeEmail(input.email);
  const fullName = clean(input.fullName)
    ?? ([clean(input.firstName), clean(input.lastName)].filter(Boolean).join(' ') || null);

  const payload = {
    company_id: input.companyId,
    first_name: clean(input.firstName),
    last_name: clean(input.lastName),
    full_name: fullName,
    title: clean(input.title),
    seniority: clean(input.seniority),
    linkedin_url: linkedinUrl,
    email,
    email_status: email ? 'valid' : 'unknown',
    language: clean(input.language),
    country: clean(input.country),
    buyer_role: input.buyerRole ?? 'unknown',
    status: input.status ?? 'discovered',
    research: input.research ?? {},
    raw_data: input.raw ?? {},
  };

  const existing = await findPerson(input.workspaceId, input.companyId, { linkedinUrl, fullName });
  if (existing) {
    const alreadyContacted = ALREADY_TOUCHED.has(existing.status);
    // Never downgrade a contacted prospect back to 'discovered'.
    const safePayload = alreadyContacted ? { ...payload, status: existing.status } : payload;
    const { error } = await supabase.from('prospect_people').update(safePayload).eq('id', existing.id);
    if (error) throw error;
    return { id: existing.id, alreadyContacted };
  }

  const { data, error } = await supabase
    .from('prospect_people')
    .insert({ workspace_id: input.workspaceId, ...payload })
    .select('id')
    .single();
  if (error) throw error;
  return { id: String(data.id), alreadyContacted: false };
}

/**
 * True if this person already has a primary outreach message (invite or
 * human_touch). Makes the pipeline idempotent: a person already in the
 * pipeline is never re-queued or re-drafted on a later run.
 */
export async function hasActiveOutreach(personId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('outreach_messages')
    .select('id')
    .eq('person_id', personId)
    .in('step_kind', ['invite', 'human_touch'])
    .limit(1)
    .maybeSingle();
  if (error) {
    if (missingLeadEngineRelation(error)) return false;
    throw error;
  }
  return Boolean(data?.id);
}

// ─── Signals + scores ─────────────────────────────────────────────────────────

export interface SignalInput {
  workspaceId: string;
  companyId: string;
  personId?: string | null;
  runId?: string | null;
  signalType: string;
  label: string;
  value?: Record<string, unknown>;
  scoreDelta?: number;
  confidence?: number;
  source?: string | null;
  sourceUrl?: string | null;
  evidence?: string | null;
}

export async function insertSignals(signals: SignalInput[]): Promise<void> {
  if (signals.length === 0) return;
  const rows = signals.map((s) => ({
    workspace_id: s.workspaceId,
    company_id: s.companyId,
    person_id: s.personId ?? null,
    run_id: s.runId ?? null,
    signal_type: s.signalType,
    label: s.label,
    value: s.value ?? {},
    score_delta: s.scoreDelta ?? 0,
    confidence: typeof s.confidence === 'number' ? s.confidence : null,
    source: clean(s.source),
    source_url: clean(s.sourceUrl),
    evidence: clean(s.evidence),
  }));
  const { error } = await supabase.from('prospect_signals').insert(rows);
  if (error) throw error;
}

export interface ScoreInput {
  workspaceId: string;
  companyId: string;
  personId?: string | null;
  campaignId?: string | null;
  score: number;
  maxScore?: number;
  priority: 'high' | 'medium' | 'low' | 'skip';
  scoreVersion?: string;
  factors?: unknown[];
}

export async function upsertProspectScore(input: ScoreInput): Promise<void> {
  const { error } = await supabase.from('prospect_scores').insert({
    workspace_id: input.workspaceId,
    company_id: input.companyId,
    person_id: input.personId ?? null,
    campaign_id: input.campaignId ?? null,
    score: input.score,
    max_score: input.maxScore ?? 20,
    priority: input.priority,
    score_version: input.scoreVersion ?? 'lead_engine_v2_enterprise_ai',
    factors: input.factors ?? [],
  });
  if (error) throw error;
}

// ─── Outreach messages + events ───────────────────────────────────────────────

export interface OutreachMessageInput {
  workspaceId: string;
  campaignId?: string | null;
  companyId?: string | null;
  personId?: string | null;
  senderAccountId?: string | null;
  channel?: string;
  stepKind?: 'invite' | 'followup' | 'email' | 'human_touch';
  status?: string;
  subject?: string | null;
  bodyText?: string | null;
  scheduledAt?: string | null;
  parentMessageId?: string | null;
  personalization?: Record<string, unknown>;
}

export async function insertOutreachMessage(input: OutreachMessageInput): Promise<string> {
  const { data, error } = await supabase
    .from('outreach_messages')
    .insert({
      workspace_id: input.workspaceId,
      campaign_id: input.campaignId ?? null,
      company_id: input.companyId ?? null,
      person_id: input.personId ?? null,
      sender_account_id: input.senderAccountId ?? null,
      channel: input.channel ?? 'linkedin',
      step_kind: input.stepKind ?? null,
      status: input.status ?? 'draft',
      subject: clean(input.subject),
      body_text: clean(input.bodyText),
      scheduled_at: input.scheduledAt ?? null,
      parent_message_id: input.parentMessageId ?? null,
      personalization: input.personalization ?? {},
    })
    .select('id')
    .single();
  if (error) throw error;
  return String(data.id);
}

export interface OutreachEventInput {
  workspaceId: string;
  messageId?: string | null;
  companyId?: string | null;
  personId?: string | null;
  eventType: string;
  provider?: string | null;
  payload?: Record<string, unknown>;
}

export async function insertOutreachEvent(input: OutreachEventInput): Promise<void> {
  const { error } = await supabase.from('outreach_events').insert({
    workspace_id: input.workspaceId,
    message_id: input.messageId ?? null,
    company_id: input.companyId ?? null,
    person_id: input.personId ?? null,
    event_type: input.eventType,
    provider: clean(input.provider),
    payload: input.payload ?? {},
  });
  if (error) throw error;
}

// ─── Run tracking ─────────────────────────────────────────────────────────────

export async function createRun(input: {
  workspaceId: string;
  campaignId?: string | null;
  runType: string;
  config?: Record<string, unknown>;
}): Promise<string | null> {
  const { data, error } = await supabase
    .from('lead_engine_runs')
    .insert({
      workspace_id: input.workspaceId,
      campaign_id: input.campaignId ?? null,
      run_type: input.runType,
      status: 'running',
      config: input.config ?? {},
      started_at: new Date().toISOString(),
    })
    .select('id')
    .single();
  if (error) {
    if (missingLeadEngineRelation(error)) return null;
    throw error;
  }
  return String(data.id);
}

export async function finishRun(runId: string | null, patch: {
  status?: string;
  summary?: Record<string, unknown>;
  totalCount?: number;
  processedCount?: number;
  successCount?: number;
  errorCount?: number;
  errorMessage?: string | null;
}): Promise<void> {
  if (!runId) return;
  const { error } = await supabase
    .from('lead_engine_runs')
    .update({
      status: patch.status ?? 'completed',
      summary: patch.summary ?? {},
      total_count: patch.totalCount ?? 0,
      processed_count: patch.processedCount ?? 0,
      success_count: patch.successCount ?? 0,
      error_count: patch.errorCount ?? 0,
      error_message: patch.errorMessage ?? null,
      finished_at: new Date().toISOString(),
    })
    .eq('id', runId);
  if (error) throw error;
}

// Runner queue, results, heartbeat

export interface QueuedMessage {
  id: string;
  stepKind: string | null;
  bodyText: string | null;
  personId: string | null;
  companyId: string | null;
  personFullName: string | null;
  personLinkedinUrl: string | null;
  companyName: string | null;
}

function counterDate(): string {
  return new Date().toISOString().slice(0, 10);
}

export async function getDailyCounter(senderAccountId: string): Promise<{ invitesSent: number; messagesSent: number }> {
  const { data, error } = await supabase
    .from('outreach_sender_daily_counters')
    .select('invites_sent,messages_sent')
    .eq('sender_account_id', senderAccountId)
    .eq('counter_date', counterDate())
    .maybeSingle();
  if (error) {
    if (missingLeadEngineRelation(error)) return { invitesSent: 0, messagesSent: 0 };
    throw error;
  }
  return { invitesSent: Number(data?.invites_sent ?? 0), messagesSent: Number(data?.messages_sent ?? 0) };
}

type CounterField = 'invites_sent' | 'messages_sent' | 'invites_accepted' | 'replies' | 'errors';

export async function incrementDailyCounter(senderAccountId: string, field: CounterField, by = 1): Promise<void> {
  const date = counterDate();
  const { data } = await supabase
    .from('outreach_sender_daily_counters')
    .select(`id,${field}`)
    .eq('sender_account_id', senderAccountId)
    .eq('counter_date', date)
    .maybeSingle();
  if (data?.id) {
    const current = Number((data as Record<string, unknown>)[field] ?? 0);
    await supabase.from('outreach_sender_daily_counters').update({ [field]: current + by }).eq('id', data.id);
  } else {
    await supabase.from('outreach_sender_daily_counters').insert({ sender_account_id: senderAccountId, counter_date: date, [field]: by });
  }
}

export async function leaseDueMessages(senderAccountId: string, max: number): Promise<QueuedMessage[]> {
  if (max <= 0) return [];
  const nowIso = new Date().toISOString();
  const { data, error } = await supabase
    .from('outreach_messages')
    .select('id,step_kind,body_text,person_id,company_id')
    .eq('sender_account_id', senderAccountId)
    .eq('status', 'queued')
    .lte('scheduled_at', nowIso)
    .order('scheduled_at', { ascending: true })
    .limit(max);
  if (error) {
    if (missingLeadEngineRelation(error)) return [];
    throw error;
  }

  const leased: QueuedMessage[] = [];
  for (const row of data ?? []) {
    const { data: claimed, error: claimErr } = await supabase
      .from('outreach_messages')
      .update({ status: 'dispatched', dispatched_at: nowIso })
      .eq('id', row.id)
      .eq('status', 'queued')
      .select('id')
      .maybeSingle();
    if (claimErr) throw claimErr;
    if (!claimed) continue;

    let personFullName: string | null = null;
    let personLinkedinUrl: string | null = null;
    let companyName: string | null = null;
    if (row.person_id) {
      const { data: person } = await supabase.from('prospect_people').select('full_name,linkedin_url').eq('id', row.person_id).maybeSingle();
      personFullName = person?.full_name ? String(person.full_name) : null;
      personLinkedinUrl = person?.linkedin_url ? String(person.linkedin_url) : null;
    }
    if (row.company_id) {
      const { data: company } = await supabase.from('prospect_companies').select('name').eq('id', row.company_id).maybeSingle();
      companyName = company?.name ? String(company.name) : null;
    }
    leased.push({
      id: String(row.id),
      stepKind: row.step_kind ? String(row.step_kind) : null,
      bodyText: row.body_text ? String(row.body_text) : null,
      personId: row.person_id ? String(row.person_id) : null,
      companyId: row.company_id ? String(row.company_id) : null,
      personFullName,
      personLinkedinUrl,
      companyName,
    });
  }
  return leased;
}

export async function recordSendResult(input: {
  messageId: string;
  senderAccountId: string;
  outcome: 'sent' | 'failed' | 'skipped';
  linkedinThreadUrl?: string | null;
  error?: string | null;
}): Promise<void> {
  const { data: msg, error } = await supabase
    .from('outreach_messages')
    .select('workspace_id,step_kind,person_id,company_id')
    .eq('id', input.messageId)
    .maybeSingle();
  if (error) {
    if (missingLeadEngineRelation(error)) return;
    throw error;
  }
  if (!msg) return;

  const workspaceId = String(msg.workspace_id);
  const stepKind = msg.step_kind ? String(msg.step_kind) : null;
  const personId = msg.person_id ? String(msg.person_id) : null;
  const companyId = msg.company_id ? String(msg.company_id) : null;
  const nowIso = new Date().toISOString();
  const isFollowup = stepKind === 'followup';

  if (input.outcome === 'sent') {
    await supabase.from('outreach_messages')
      .update({ status: 'sent', sent_at: nowIso, linkedin_thread_url: input.linkedinThreadUrl ?? null })
      .eq('id', input.messageId);
    await insertOutreachEvent({ workspaceId, messageId: input.messageId, personId, companyId, eventType: isFollowup ? 'linkedin_message_sent' : 'linkedin_invite_sent' });
    await incrementDailyCounter(input.senderAccountId, isFollowup ? 'messages_sent' : 'invites_sent');
    if (personId) await supabase.from('prospect_people').update({ status: 'contacted', last_contacted_at: nowIso }).eq('id', personId);
    if (companyId) await supabase.from('prospect_companies').update({ status: 'contacted' }).eq('id', companyId);
  } else if (input.outcome === 'failed') {
    await supabase.from('outreach_messages').update({ status: 'failed', error_message: input.error ?? null }).eq('id', input.messageId);
    await insertOutreachEvent({ workspaceId, messageId: input.messageId, personId, companyId, eventType: 'linkedin_send_failed', payload: { error: input.error ?? null } });
    await incrementDailyCounter(input.senderAccountId, 'errors');
  } else {
    await supabase.from('outreach_messages').update({ status: 'skipped' }).eq('id', input.messageId);
    await insertOutreachEvent({ workspaceId, messageId: input.messageId, personId, companyId, eventType: 'linkedin_send_skipped' });
  }
}

export async function updateSenderHeartbeat(senderAccountId: string, sessionExpired = false): Promise<void> {
  await supabase.from('outreach_sender_accounts')
    .update({ last_seen_at: new Date().toISOString(), session_expired: sessionExpired })
    .eq('id', senderAccountId);
}

export async function findPersonByLinkedinUrl(workspaceId: string, linkedinUrl: string): Promise<{ personId: string; companyId: string | null } | null> {
  const url = normalizeUrl(linkedinUrl);
  if (!url) return null;
  const { data, error } = await supabase
    .from('prospect_people')
    .select('id,company_id')
    .eq('workspace_id', workspaceId)
    .eq('linkedin_url', url)
    .limit(1)
    .maybeSingle();
  if (error) {
    if (missingLeadEngineRelation(error)) return null;
    throw error;
  }
  return data?.id ? { personId: String(data.id), companyId: data.company_id ? String(data.company_id) : null } : null;
}

export async function promoteFollowup(personId: string, senderAccountId: string | null): Promise<void> {
  const update: Record<string, unknown> = { status: 'queued', scheduled_at: new Date().toISOString() };
  if (senderAccountId) update.sender_account_id = senderAccountId;
  await supabase.from('outreach_messages').update(update)
    .eq('person_id', personId).eq('step_kind', 'followup').eq('status', 'draft');
}

export async function setPersonStatus(personId: string, status: string): Promise<void> {
  const patch: Record<string, unknown> = { status };
  if (status === 'replied') patch.last_replied_at = new Date().toISOString();
  await supabase.from('prospect_people').update(patch).eq('id', personId);
}

// Conversion support (CRM bridge)

export interface ProspectForConversion {
  personId: string;
  companyId: string | null;
  fullName: string | null;
  firstName: string | null;
  lastName: string | null;
  title: string | null;
  linkedinUrl: string | null;
  email: string | null;
  buyerRole: string;
  companyName: string | null;
  companyDomain: string | null;
  companyIndustry: string | null;
  companyCity: string | null;
  companyCountry: string | null;
}

export async function getProspectForConversion(personId: string): Promise<ProspectForConversion | null> {
  const { data: person, error } = await supabase
    .from('prospect_people')
    .select('id,company_id,full_name,first_name,last_name,title,linkedin_url,email,buyer_role')
    .eq('id', personId)
    .maybeSingle();
  if (error) {
    if (missingLeadEngineRelation(error)) return null;
    throw error;
  }
  if (!person) return null;

  let companyName: string | null = null;
  let companyDomain: string | null = null;
  let companyIndustry: string | null = null;
  let companyCity: string | null = null;
  let companyCountry: string | null = null;
  if (person.company_id) {
    const { data: company } = await supabase
      .from('prospect_companies')
      .select('name,domain,industry,city,country')
      .eq('id', person.company_id)
      .maybeSingle();
    companyName = company?.name ? String(company.name) : null;
    companyDomain = company?.domain ? String(company.domain) : null;
    companyIndustry = company?.industry ? String(company.industry) : null;
    companyCity = company?.city ? String(company.city) : null;
    companyCountry = company?.country ? String(company.country) : null;
  }

  return {
    personId: String(person.id),
    companyId: person.company_id ? String(person.company_id) : null,
    fullName: person.full_name ? String(person.full_name) : null,
    firstName: person.first_name ? String(person.first_name) : null,
    lastName: person.last_name ? String(person.last_name) : null,
    title: person.title ? String(person.title) : null,
    linkedinUrl: person.linkedin_url ? String(person.linkedin_url) : null,
    email: person.email ? String(person.email) : null,
    buyerRole: person.buyer_role ? String(person.buyer_role) : 'unknown',
    companyName,
    companyDomain,
    companyIndustry,
    companyCity,
    companyCountry,
  };
}

export async function markConverted(personId: string, companyId: string | null): Promise<void> {
  await supabase.from('prospect_people').update({ status: 'converted' }).eq('id', personId);
  if (companyId) await supabase.from('prospect_companies').update({ status: 'converted' }).eq('id', companyId);
}

export async function listRepliedProspects(limit = 25): Promise<string[]> {
  const workspaceId = await ensureWorkspaceId();
  const { data, error } = await supabase
    .from('prospect_people')
    .select('id')
    .eq('workspace_id', workspaceId)
    .eq('status', 'replied')
    .limit(limit);
  if (error) {
    if (missingLeadEngineRelation(error)) return [];
    throw error;
  }
  return (data ?? []).map((row) => String(row.id));
}
