import 'server-only';

import { supabase } from '@/lib/bot/db/supabase';
import { getLeadEngineSandboxState, type SandboxMessage, type SandboxProspect, type SandboxRun } from '@/lib/admin/lead-engine-sandbox';

export type LeadEngineRunStatus = 'queued' | 'running' | 'completed' | 'completed_with_errors' | 'failed' | 'cancelled' | 'paused';
export type LeadEngineProspectStatus = 'discovered' | 'enriched' | 'validated' | 'approved' | 'contacted' | 'replied' | 'meeting_booked' | 'converted' | 'disqualified' | 'do_not_contact';
export type LeadEnginePriority = 'high' | 'medium' | 'low' | 'skip';
export type LeadEngineCampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived';
export type LeadEngineMessageStatus = 'draft' | 'approved' | 'scheduled' | 'sent' | 'failed' | 'cancelled' | 'replied' | 'bounced' | 'unsubscribed';

export interface LeadEngineStats {
  totalProspectsDiscovered: number;
  validatedProspects: number;
  outreachReadyProspects: number;
  draftsPendingApproval: number;
  contactedProspects: number;
  replies: number;
  meetingsBooked: number;
  convertedToCrm: number;
  disqualifiedProspects: number;
  activeRuns: number;
}

export interface LeadEngineProspectSummary {
  id: string;
  companyName: string;
  niche: string | null;
  location: string | null;
  websiteUrl: string | null;
  linkedinUrl: string | null;
  employeeCount: number | null;
  score: number | null;
  priority: LeadEnginePriority;
  topSignals: string[];
  decisionMaker: string | null;
  decisionMakerEmail: string | null;
  decisionMakerPhone: string | null;
  decisionMakerLinkedinUrl: string | null;
  emailStatus: string | null;
  status: LeadEngineProspectStatus;
  lastTouchAt: string | null;
  source: 'supabase' | 'sandbox';
}

export interface LeadEngineRunSummary {
  id: string;
  runType: string;
  campaignName: string | null;
  status: LeadEngineRunStatus;
  processedCount: number;
  successCount: number;
  notFoundCount: number;
  blockedCount: number;
  errorCount: number;
  startedAt: string | null;
  finishedAt: string | null;
  durationMs: number | null;
  errorMessage: string | null;
}

export interface LeadEngineCampaignSummary {
  id: string;
  name: string;
  status: LeadEngineCampaignStatus;
  targetNiches: string[];
  targetLocations: string[];
  targetLanguages: string[];
  minEmployeeCount: number;
  idealEmployeeMin: number;
  idealEmployeeMax: number;
  createdAt: string;
  source: 'supabase' | 'sandbox';
}

export interface LeadEngineCampaignPerformance {
  campaignName: string;
  validatedProspects: number;
  draftsCreated: number;
  replies: number;
  meetingsBooked: number;
}

export interface LeadEngineOutreachMessageSummary {
  id: string;
  companyName: string;
  personName: string | null;
  personTitle: string | null;
  personEmail: string | null;
  personPhone: string | null;
  personLinkedinUrl: string | null;
  status: LeadEngineMessageStatus;
  channel: string;
  subject: string | null;
  bodyText: string | null;
  companyWebsite: string | null;
  linkedinUrl: string | null;
  createdAt: string;
  source: 'supabase' | 'sandbox';
}

export interface LeadEngineWorkerHealth {
  status: 'not_configured' | 'healthy' | 'degraded' | 'offline';
  label: string;
  checkedAt: string | null;
  message: string;
}

export interface LeadEngineOverviewData {
  stats: LeadEngineStats;
  workerHealth: LeadEngineWorkerHealth;
  recentHighScoreProspects: LeadEngineProspectSummary[];
  pendingDrafts: LeadEngineOutreachMessageSummary[];
  latestRuns: LeadEngineRunSummary[];
  campaignPerformance: LeadEngineCampaignPerformance[];
  errorsNeedingAttention: LeadEngineRunSummary[];
}

export interface LeadEngineProspectsPageData {
  prospects: LeadEngineProspectSummary[];
}

export interface LeadEngineCampaignsPageData {
  campaigns: LeadEngineCampaignSummary[];
  defaultCampaign: typeof defaultLeadEngineCampaignConfig;
}

export interface LeadEngineRunsPageData {
  runs: LeadEngineRunSummary[];
}

export interface LeadEngineOutreachPageData {
  messages: LeadEngineOutreachMessageSummary[];
  counts: Record<LeadEngineMessageStatus, number>;
}

type QueryError = {
  code?: string;
  message?: string;
};

type CountResult = {
  count: number | null;
  error: QueryError | null;
};

const runStatuses: LeadEngineRunStatus[] = ['queued', 'running', 'completed', 'completed_with_errors', 'failed', 'cancelled', 'paused'];
const prospectStatuses: LeadEngineProspectStatus[] = ['discovered', 'enriched', 'validated', 'approved', 'contacted', 'replied', 'meeting_booked', 'converted', 'disqualified', 'do_not_contact'];
const campaignStatuses: LeadEngineCampaignStatus[] = ['draft', 'active', 'paused', 'completed', 'archived'];
const messageStatuses: LeadEngineMessageStatus[] = ['draft', 'approved', 'scheduled', 'sent', 'failed', 'cancelled', 'replied', 'bounced', 'unsubscribed'];

export const defaultLeadEngineCampaignConfig = {
  name: 'Mobility, Rental & Tourism - FR/EN',
  targetNiches: [
    'vehicle_rental',
    'long_term_rental',
    'mobility',
    'private_transport',
    'airport_transfer',
    'premium_tourism',
    'experience_operator',
  ],
  targetLocations: ['France', 'Belgium', 'Switzerland', 'Luxembourg'],
  targetLanguages: ['fr', 'en'],
  minEmployeeCount: 5,
  idealEmployeeMin: 10,
  idealEmployeeMax: 100,
  excludedNiches: ['real estate', 'medical', 'low-budget restaurants'],
  coreMessageAngles: ['lead leakage', 'manual customer handling', 'slow response time', 'CRM discipline', 'review follow-up'],
  proofPoint: 'long-term rental company case study',
  cta: '30-minute discovery call',
  auditOffer: 'Lead Leakage & Operations Audit starting at EUR 2k',
  buildOffer: 'Custom builds start at EUR 5k/month retainer',
} as const;

const emptyOutreachCounts: Record<LeadEngineMessageStatus, number> = {
  draft: 0,
  approved: 0,
  scheduled: 0,
  sent: 0,
  failed: 0,
  cancelled: 0,
  replied: 0,
  bounced: 0,
  unsubscribed: 0,
};

function missingLeadEngineRelation(error: QueryError): boolean {
  return error.code === '42P01'
    || error.code === 'PGRST205'
    || Boolean(error.message?.includes('does not exist'))
    || Boolean(error.message?.includes('Could not find the table'));
}

async function countRows(query: PromiseLike<CountResult>): Promise<number> {
  const { count, error } = await query;
  if (error) {
    if (missingLeadEngineRelation(error)) return 0;
    throw error;
  }
  return count ?? 0;
}

async function selectRows<T>(query: PromiseLike<{ data: T[] | null; error: QueryError | null }>): Promise<T[]> {
  const { data, error } = await query;
  if (error) {
    if (missingLeadEngineRelation(error)) return [];
    throw error;
  }
  return data ?? [];
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) return asRecord(value[0]);
  if (!value || typeof value !== 'object') return null;
  return value as Record<string, unknown>;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function typedValue<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && allowed.includes(value as T) ? value as T : fallback;
}

function formatLocation(record: Record<string, unknown>): string | null {
  const parts = [asString(record.city), asString(record.region), asString(record.country)].filter(Boolean);
  return parts.length > 0 ? parts.join(', ') : null;
}

function scorePriority(score: number | null): LeadEnginePriority {
  if (score === null) return 'skip';
  if (score >= 16) return 'high';
  if (score >= 11) return 'medium';
  if (score >= 7) return 'low';
  return 'skip';
}

function factorLabels(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      const record = asRecord(item);
      return asString(record?.label) ?? asString(record?.signal_type) ?? asString(record?.type);
    })
    .filter((item): item is string => Boolean(item))
    .slice(0, 3);
}

function normalizeRun(value: unknown): LeadEngineRunSummary {
  const record = asRecord(value) ?? {};
  const campaign = asRecord(record.campaign);

  const startedAt = asString(record.started_at);
  const finishedAt = asString(record.finished_at);
  const durationMs = startedAt && finishedAt ? new Date(finishedAt).getTime() - new Date(startedAt).getTime() : null;

  return {
    id: String(record.id ?? ''),
    runType: asString(record.run_type) ?? 'company_discovery',
    campaignName: asString(campaign?.name),
    status: typedValue(record.status, runStatuses, 'queued'),
    processedCount: asNumber(record.processed_count) ?? 0,
    successCount: asNumber(record.success_count) ?? 0,
    notFoundCount: asNumber(record.not_found_count) ?? 0,
    blockedCount: asNumber(record.blocked_count) ?? 0,
    errorCount: asNumber(record.error_count) ?? 0,
    startedAt,
    finishedAt,
    durationMs: durationMs !== null && Number.isFinite(durationMs) && durationMs >= 0 ? durationMs : null,
    errorMessage: asString(record.error_message),
  };
}

function normalizeCampaign(value: unknown): LeadEngineCampaignSummary {
  const record = asRecord(value) ?? {};

  return {
    id: String(record.id ?? ''),
    name: asString(record.name) ?? 'Untitled campaign',
    status: typedValue(record.status, campaignStatuses, 'draft'),
    targetNiches: asStringArray(record.target_niches),
    targetLocations: asStringArray(record.target_locations),
    targetLanguages: asStringArray(record.target_languages),
    minEmployeeCount: asNumber(record.min_employee_count) ?? 0,
    idealEmployeeMin: asNumber(record.ideal_employee_min) ?? 0,
    idealEmployeeMax: asNumber(record.ideal_employee_max) ?? 0,
    createdAt: String(record.created_at ?? ''),
    source: 'supabase',
  };
}

function normalizeMessage(value: unknown): LeadEngineOutreachMessageSummary {
  const record = asRecord(value) ?? {};
  const company = asRecord(record.company);
  const person = asRecord(record.person);

  return {
    id: String(record.id ?? ''),
    companyName: asString(company?.name) ?? 'Unknown company',
    personName: asString(person?.full_name),
    personTitle: asString(person?.title),
    personEmail: asString(person?.email),
    personPhone: asString(person?.phone),
    personLinkedinUrl: asString(person?.linkedin_url),
    status: typedValue(record.status, messageStatuses, 'draft'),
    channel: asString(record.channel) ?? 'email',
    subject: asString(record.subject),
    bodyText: asString(record.body_text),
    companyWebsite: null,
    linkedinUrl: null,
    createdAt: String(record.created_at ?? ''),
    source: 'supabase',
  };
}

function normalizeScoredProspect(value: unknown): LeadEngineProspectSummary {
  const record = asRecord(value) ?? {};
  const company = asRecord(record.company) ?? {};
  const person = asRecord(record.person);
  const score = asNumber(record.score);
  const priority = typedValue(record.priority, ['high', 'medium', 'low', 'skip'] satisfies LeadEnginePriority[], scorePriority(score));

  return {
    id: String(company.id ?? record.id ?? ''),
    companyName: asString(company.name) ?? 'Unknown company',
    niche: asString(company.niche),
    location: formatLocation(company),
    websiteUrl: asString(company.website_url),
    linkedinUrl: asString(company.linkedin_url),
    employeeCount: asNumber(company.employee_count),
    score,
    priority,
    topSignals: factorLabels(record.factors),
    decisionMaker: asString(person?.full_name),
    decisionMakerEmail: asString(person?.email),
    decisionMakerPhone: asString(person?.phone),
    decisionMakerLinkedinUrl: asString(person?.linkedin_url),
    emailStatus: asString(person?.email_status),
    status: typedValue(company.status, prospectStatuses, 'discovered'),
    lastTouchAt: asString(person?.last_contacted_at),
    source: 'supabase',
  };
}

function normalizeProspectCompany(
  companyValue: unknown,
  scoreValue?: unknown,
  personValue?: unknown,
  signalValues: unknown[] = [],
): LeadEngineProspectSummary {
  const company = asRecord(companyValue) ?? {};
  const scoreRecord = asRecord(scoreValue);
  const person = asRecord(personValue);
  const score = asNumber(scoreRecord?.score);

  return {
    id: String(company.id ?? ''),
    companyName: asString(company.name) ?? 'Unknown company',
    niche: asString(company.niche),
    location: formatLocation(company),
    websiteUrl: asString(company.website_url),
    linkedinUrl: asString(company.linkedin_url),
    employeeCount: asNumber(company.employee_count),
    score,
    priority: typedValue(scoreRecord?.priority, ['high', 'medium', 'low', 'skip'] satisfies LeadEnginePriority[], scorePriority(score)),
    topSignals: signalValues.map((signal) => asString(asRecord(signal)?.label)).filter((item): item is string => Boolean(item)).slice(0, 3),
    decisionMaker: asString(person?.full_name),
    decisionMakerEmail: asString(person?.email),
    decisionMakerPhone: asString(person?.phone),
    decisionMakerLinkedinUrl: asString(person?.linkedin_url),
    emailStatus: asString(person?.email_status),
    status: typedValue(company.status, prospectStatuses, 'discovered'),
    lastTouchAt: asString(person?.last_contacted_at),
    source: 'supabase',
  };
}

function normalizeSandboxProspect(prospect: SandboxProspect): LeadEngineProspectSummary {
  return {
    id: prospect.id,
    companyName: prospect.companyName,
    niche: prospect.niche,
    location: `${prospect.city}, ${prospect.country}`,
    websiteUrl: prospect.websiteUrl,
    linkedinUrl: prospect.linkedinSearchUrl,
    employeeCount: prospect.employeeCount,
    score: prospect.score,
    priority: prospect.priority,
    topSignals: prospect.topSignals,
    decisionMaker: `${prospect.decisionMaker} (${prospect.decisionMakerTitle})`,
    decisionMakerEmail: prospect.decisionMakerEmail ?? null,
    decisionMakerPhone: prospect.decisionMakerPhone ?? null,
    decisionMakerLinkedinUrl: prospect.decisionMakerLinkedinUrl ?? null,
    emailStatus: prospect.decisionMakerEmail ? 'verified' : 'linkedin_manual',
    status: prospect.status,
    lastTouchAt: prospect.lastTouchAt,
    source: 'sandbox',
  };
}

function normalizeSandboxMessage(message: SandboxMessage): LeadEngineOutreachMessageSummary {
  return {
    id: message.id,
    companyName: message.companyName,
    personName: message.personName,
    personTitle: message.personTitle,
    personEmail: message.personEmail ?? null,
    personPhone: message.personPhone ?? null,
    personLinkedinUrl: message.personLinkedinUrl ?? null,
    status: message.status,
    channel: message.channel,
    subject: message.subject,
    bodyText: message.bodyText,
    companyWebsite: message.companyWebsite,
    linkedinUrl: message.linkedinSearchUrl,
    createdAt: message.createdAt,
    source: 'sandbox',
  };
}

function normalizeSandboxRun(run: SandboxRun): LeadEngineRunSummary {
  const durationMs = new Date(run.finishedAt).getTime() - new Date(run.startedAt).getTime();

  return {
    id: run.id,
    runType: run.runType,
    campaignName: run.campaignName,
    status: run.status,
    processedCount: run.processedCount,
    successCount: run.successCount,
    notFoundCount: run.notFoundCount,
    blockedCount: run.blockedCount,
    errorCount: run.errorCount,
    startedAt: run.startedAt,
    finishedAt: run.finishedAt,
    durationMs: Number.isFinite(durationMs) && durationMs >= 0 ? durationMs : null,
    errorMessage: run.errorMessage,
  };
}

function sortProspectsByScore(prospects: LeadEngineProspectSummary[]): LeadEngineProspectSummary[] {
  return [...prospects].sort((left, right) => (right.score ?? 0) - (left.score ?? 0));
}

function sortMessagesByCreatedAt(messages: LeadEngineOutreachMessageSummary[]): LeadEngineOutreachMessageSummary[] {
  return [...messages].sort((left, right) => right.createdAt.localeCompare(left.createdAt));
}

function sortRunsByStartedAt(runs: LeadEngineRunSummary[]): LeadEngineRunSummary[] {
  return [...runs].sort((left, right) => (right.startedAt ?? '').localeCompare(left.startedAt ?? ''));
}

async function getLatestRuns(limit = 8): Promise<LeadEngineRunSummary[]> {
  const rows = await selectRows<unknown>(supabase
    .from('lead_engine_runs')
    .select('id, run_type, status, processed_count, success_count, not_found_count, blocked_count, error_count, started_at, finished_at, error_message, campaign:lead_engine_campaigns(name)')
    .order('created_at', { ascending: false })
    .limit(limit));

  return rows.map(normalizeRun);
}

async function getPendingDrafts(limit = 8): Promise<LeadEngineOutreachMessageSummary[]> {
  const rows = await selectRows<unknown>(supabase
    .from('outreach_messages')
    .select('id, status, channel, subject, created_at, company:prospect_companies(name), person:prospect_people(full_name)')
    .eq('status', 'draft')
    .order('created_at', { ascending: false })
    .limit(limit));

  return rows.map(normalizeMessage);
}

async function getRecentHighScoreProspects(limit = 8): Promise<LeadEngineProspectSummary[]> {
  const rows = await selectRows<unknown>(supabase
    .from('prospect_scores')
    .select('id, score, priority, factors, created_at, company:prospect_companies(id, name, niche, country, city, region, employee_count, status), person:prospect_people(id, full_name, email_status, last_contacted_at, status)')
    .order('score', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit));

  return rows.map(normalizeScoredProspect);
}

export async function getLeadEngineOverviewData(): Promise<LeadEngineOverviewData> {
  const sandboxState = await getLeadEngineSandboxState();
  const sandboxProspects = sandboxState.prospects.map(normalizeSandboxProspect);
  const sandboxMessages = sandboxState.messages.map(normalizeSandboxMessage);
  const sandboxRuns = sandboxState.runs.map(normalizeSandboxRun);

  const [
    totalProspectsDiscovered,
    validatedProspects,
    outreachReadyProspects,
    draftsPendingApproval,
    contactedProspects,
    replies,
    meetingsBooked,
    convertedToCrm,
    disqualifiedProspects,
    activeRuns,
    recentHighScoreProspects,
    pendingDrafts,
    latestRuns,
    campaignRows,
  ] = await Promise.all([
    countRows(supabase.from('prospect_companies').select('*', { count: 'exact', head: true })),
    countRows(supabase.from('prospect_companies').select('*', { count: 'exact', head: true }).in('validation_status', ['valid', 'validated'])),
    countRows(supabase.from('prospect_companies').select('*', { count: 'exact', head: true }).in('status', ['validated', 'approved'])),
    countRows(supabase.from('outreach_messages').select('*', { count: 'exact', head: true }).eq('status', 'draft')),
    countRows(supabase.from('prospect_companies').select('*', { count: 'exact', head: true }).eq('status', 'contacted')),
    countRows(supabase.from('outreach_events').select('*', { count: 'exact', head: true }).eq('event_type', 'replied')),
    countRows(supabase.from('outreach_events').select('*', { count: 'exact', head: true }).eq('event_type', 'meeting_booked')),
    countRows(supabase.from('prospect_companies').select('*', { count: 'exact', head: true }).eq('status', 'converted')),
    countRows(supabase.from('prospect_companies').select('*', { count: 'exact', head: true }).eq('status', 'disqualified')),
    countRows(supabase.from('lead_engine_runs').select('*', { count: 'exact', head: true }).in('status', ['queued', 'running', 'paused'])),
    getRecentHighScoreProspects(8),
    getPendingDrafts(8),
    getLatestRuns(8),
    selectRows<unknown>(supabase
      .from('lead_engine_campaigns')
      .select('id, name')
      .order('created_at', { ascending: false })
      .limit(5)),
  ]);

  const combinedLatestRuns = sortRunsByStartedAt([...sandboxRuns, ...latestRuns]).slice(0, 8);
  const combinedPendingDrafts = sortMessagesByCreatedAt([
    ...sandboxMessages.filter((message) => message.status === 'draft'),
    ...pendingDrafts,
  ]).slice(0, 8);

  return {
    stats: {
      totalProspectsDiscovered: totalProspectsDiscovered + sandboxProspects.length,
      validatedProspects: validatedProspects + sandboxProspects.filter((prospect) => prospect.status === 'validated' || prospect.status === 'approved' || prospect.status === 'contacted').length,
      outreachReadyProspects: outreachReadyProspects + sandboxProspects.filter((prospect) => prospect.status === 'validated' || prospect.status === 'approved').length,
      draftsPendingApproval: draftsPendingApproval + sandboxMessages.filter((message) => message.status === 'draft').length,
      contactedProspects: contactedProspects + sandboxProspects.filter((prospect) => prospect.status === 'contacted').length,
      replies,
      meetingsBooked,
      convertedToCrm,
      disqualifiedProspects,
      activeRuns,
    },
    workerHealth: {
      status: sandboxRuns.length > 0 ? 'healthy' : 'not_configured',
      label: sandboxRuns.length > 0 ? 'Sandbox dry-run ready' : 'Worker not configured',
      checkedAt: sandboxRuns[0]?.finishedAt ?? null,
      message: sandboxRuns.length > 0
        ? 'Local sandbox discovery, scoring, and draft generation are working. Production worker integration remains separate from Next.js requests.'
        : 'The worker API is not connected yet. Discovery, enrichment, scoring, and outreach jobs must run outside the Next.js request lifecycle.',
    },
    recentHighScoreProspects: sortProspectsByScore([...sandboxProspects, ...recentHighScoreProspects]).slice(0, 8),
    pendingDrafts: combinedPendingDrafts,
    latestRuns: combinedLatestRuns,
    campaignPerformance: [
      ...(sandboxState.campaign ? [{
        campaignName: sandboxState.campaign.name,
        validatedProspects: sandboxProspects.filter((prospect) => prospect.status === 'validated' || prospect.status === 'approved' || prospect.status === 'contacted').length,
        draftsCreated: sandboxMessages.length,
        replies: 0,
        meetingsBooked: 0,
      }] : []),
      ...campaignRows.map((campaignRow) => {
      const campaign = asRecord(campaignRow) ?? {};
      return {
        campaignName: asString(campaign.name) ?? 'Untitled campaign',
        validatedProspects: 0,
        draftsCreated: 0,
        replies: 0,
        meetingsBooked: 0,
      };
    })],
    errorsNeedingAttention: combinedLatestRuns.filter((run) => run.status === 'failed' || run.status === 'completed_with_errors' || run.blockedCount > 0 || run.errorCount > 0),
  };
}

export async function getLeadEngineProspectsPageData(): Promise<LeadEngineProspectsPageData> {
  const sandboxState = await getLeadEngineSandboxState();
  const sandboxProspects = sandboxState.prospects.map(normalizeSandboxProspect);
  const companyRows = await selectRows<unknown>(supabase
    .from('prospect_companies')
    .select('id, name, niche, country, city, region, employee_count, website_url, linkedin_url, status, created_at')
    .order('created_at', { ascending: false })
    .limit(100));

  const companyIds = companyRows
    .map((row) => String(asRecord(row)?.id ?? ''))
    .filter(Boolean);

  if (companyIds.length === 0) return { prospects: sandboxProspects };

  const [scoreRows, peopleRows, signalRows] = await Promise.all([
    selectRows<unknown>(supabase
      .from('prospect_scores')
      .select('company_id, score, priority, created_at')
      .in('company_id', companyIds)
      .order('created_at', { ascending: false })),
    selectRows<unknown>(supabase
      .from('prospect_people')
      .select('company_id, full_name, title, email, email_status, phone, linkedin_url, last_contacted_at, status, created_at')
      .in('company_id', companyIds)
      .order('created_at', { ascending: false })),
    selectRows<unknown>(supabase
      .from('prospect_signals')
      .select('company_id, label, signal_type, detected_at')
      .in('company_id', companyIds)
      .order('detected_at', { ascending: false })),
  ]);

  const scoreByCompany = new Map<string, unknown>();
  scoreRows.forEach((scoreRow) => {
    const companyId = asString(asRecord(scoreRow)?.company_id);
    if (companyId && !scoreByCompany.has(companyId)) scoreByCompany.set(companyId, scoreRow);
  });

  const personByCompany = new Map<string, unknown>();
  peopleRows.forEach((personRow) => {
    const companyId = asString(asRecord(personRow)?.company_id);
    if (companyId && !personByCompany.has(companyId)) personByCompany.set(companyId, personRow);
  });

  const signalsByCompany = new Map<string, unknown[]>();
  signalRows.forEach((signalRow) => {
    const companyId = asString(asRecord(signalRow)?.company_id);
    if (!companyId) return;
    const signals = signalsByCompany.get(companyId) ?? [];
    signals.push(signalRow);
    signalsByCompany.set(companyId, signals);
  });

  return {
    prospects: sortProspectsByScore([...sandboxProspects, ...companyRows.map((companyRow) => {
      const companyId = String(asRecord(companyRow)?.id ?? '');
      return normalizeProspectCompany(companyRow, scoreByCompany.get(companyId), personByCompany.get(companyId), signalsByCompany.get(companyId));
    })]),
  };
}

export async function getLeadEngineCampaignsPageData(): Promise<LeadEngineCampaignsPageData> {
  const sandboxState = await getLeadEngineSandboxState();
  const rows = await selectRows<unknown>(supabase
    .from('lead_engine_campaigns')
    .select('id, name, status, target_niches, target_locations, target_languages, min_employee_count, ideal_employee_min, ideal_employee_max, created_at')
    .order('created_at', { ascending: false })
    .limit(100));

  return {
    campaigns: [
      ...(sandboxState.campaign ? [{
        id: sandboxState.campaign.id,
        name: sandboxState.campaign.name,
        status: 'active' as LeadEngineCampaignStatus,
        targetNiches: [...defaultLeadEngineCampaignConfig.targetNiches],
        targetLocations: [...defaultLeadEngineCampaignConfig.targetLocations],
        targetLanguages: [...defaultLeadEngineCampaignConfig.targetLanguages],
        minEmployeeCount: defaultLeadEngineCampaignConfig.minEmployeeCount,
        idealEmployeeMin: defaultLeadEngineCampaignConfig.idealEmployeeMin,
        idealEmployeeMax: defaultLeadEngineCampaignConfig.idealEmployeeMax,
        createdAt: sandboxState.campaign.createdAt,
        source: 'sandbox' as const,
      }] : []),
      ...rows.map(normalizeCampaign),
    ],
    defaultCampaign: defaultLeadEngineCampaignConfig,
  };
}

export async function getLeadEngineRunsPageData(): Promise<LeadEngineRunsPageData> {
  const sandboxState = await getLeadEngineSandboxState();
  return { runs: sortRunsByStartedAt([...sandboxState.runs.map(normalizeSandboxRun), ...await getLatestRuns(100)]) };
}

export async function getLeadEngineOutreachPageData(): Promise<LeadEngineOutreachPageData> {
  const sandboxState = await getLeadEngineSandboxState();
  const sandboxMessages = sandboxState.messages.map(normalizeSandboxMessage);
  const [messages, counts] = await Promise.all([
    selectRows<unknown>(supabase
      .from('outreach_messages')
      .select('id, status, channel, subject, body_text, created_at, company:prospect_companies(name), person:prospect_people(full_name, title)')
      .order('created_at', { ascending: false })
      .limit(100)),
    Promise.all(messageStatuses.map(async (status) => [
      status,
      await countRows(supabase.from('outreach_messages').select('*', { count: 'exact', head: true }).eq('status', status)),
    ] as const)),
  ]);

  return {
    messages: sortMessagesByCreatedAt([...sandboxMessages, ...messages.map(normalizeMessage)]),
    counts: {
      ...emptyOutreachCounts,
      ...Object.fromEntries(counts),
      draft: (Object.fromEntries(counts).draft ?? 0) + sandboxMessages.filter((message) => message.status === 'draft').length,
      approved: (Object.fromEntries(counts).approved ?? 0) + sandboxMessages.filter((message) => message.status === 'approved').length,
      sent: (Object.fromEntries(counts).sent ?? 0) + sandboxMessages.filter((message) => message.status === 'sent').length,
    },
  };
}