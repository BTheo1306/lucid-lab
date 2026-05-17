import 'server-only';

import { supabase } from '@/lib/bot/db/supabase';
import { markLucidClientDeletedInObsidian, syncLucidClientToObsidian, type LucidObsidianSyncReason } from './obsidian-sync';

const DEFAULT_ORGANIZATION_SLUG = 'lucid-lab';

type QueryError = {
  code?: string;
  message?: string;
};

type CountResult = {
  count: number | null;
  error: QueryError | null;
};

export type LucidClientStatus = 'lead' | 'active' | 'paused' | 'offboarded' | 'archived';
export type LucidClientIntakeStage = 'potential' | 'meeting_booked' | 'meeting_done' | 'proposal_sent' | 'won' | 'lost';
export type LucidClientMeetingStatus = 'not_booked' | 'booked' | 'done' | 'cancelled';
export type LucidProjectStatus = 'idea' | 'planned' | 'active' | 'blocked' | 'completed' | 'archived';
export type LucidWebsiteStatus = 'planned' | 'designing' | 'building' | 'live' | 'paused' | 'archived';
export type LucidHealthStatus = 'unknown' | 'healthy' | 'degraded' | 'down';
export type LucidAgentStatus = 'draft' | 'active' | 'paused' | 'retired';
export type LucidApprovalStatus = 'pending' | 'approved' | 'rejected' | 'expired' | 'cancelled';
export type LucidIncidentStatus = 'open' | 'investigating' | 'identified' | 'monitoring' | 'resolved' | 'closed';
export type LucidKnowledgeStatus = 'draft' | 'active' | 'archived' | 'stale';
export type LucidClientLifecycleStage = 'lead' | 'qualified' | 'meeting_booked' | 'discovery_done' | 'proposal_needed' | 'proposal_sent' | 'negotiation' | 'won' | 'lost' | 'onboarding' | 'in_delivery' | 'live_managed' | 'success_retention' | 'expansion_opportunity' | 'archived';
export type LucidClientHealthStatus = 'unknown' | 'healthy' | 'watch' | 'risk' | 'critical';
export type LucidContactInfluenceLevel = 'unknown' | 'low' | 'medium' | 'high' | 'champion' | 'blocker';
export type LucidContactStatus = 'active' | 'inactive' | 'left_company' | 'archived';
export type LucidOpportunityStage = 'new' | 'qualified' | 'discovery' | 'proposal_needed' | 'proposal_sent' | 'negotiation' | 'won' | 'lost' | 'paused';
export type LucidOpportunityStatus = 'open' | 'won' | 'lost' | 'paused' | 'archived';
export type LucidOfferType = 'managed_website' | 'website_database' | 'ai_automation' | 'ai_agent' | 'custom_app' | 'retainer' | 'audit' | 'custom';
export type LucidInteractionType = 'note' | 'meeting' | 'call' | 'email' | 'chat' | 'form' | 'import' | 'support' | 'delivery_update' | 'decision';
export type LucidInteractionDirection = 'inbound' | 'outbound' | 'internal';
export type LucidInteractionSentiment = 'positive' | 'neutral' | 'negative' | 'risk';
export type LucidInteractionSourceSystem = 'admin' | 'tidycal' | 'email' | 'website' | 'chat' | 'github' | 'obsidian' | 'integration' | 'agent';
export type LucidClientTaskStatus = 'todo' | 'in_progress' | 'waiting' | 'done' | 'cancelled';
export type LucidClientTaskPriority = 'low' | 'normal' | 'high' | 'urgent';
export type LucidClientImportSourceType = 'note' | 'meeting_notes' | 'email' | 'doc' | 'linkedin' | 'website' | 'chat' | 'github' | 'other';
export type LucidClientImportStatus = 'pending' | 'processed' | 'needs_review' | 'failed' | 'archived';

export interface LucidOrganizationSummary {
  id: string;
  name: string;
  slug: string;
  status: string;
  settings: Record<string, unknown>;
  updatedAt: string;
}

export interface LucidClientSummary {
  id: string;
  name: string;
  slug: string;
  status: LucidClientStatus;
  lifecycleStage: LucidClientLifecycleStage;
  ownerLabel: string | null;
  clientHealthStatus: LucidClientHealthStatus;
  healthScore: number | null;
  healthSummary: string | null;
  nextAction: string | null;
  nextActionDueAt: string | null;
  lastContactedAt: string | null;
  industry: string | null;
  websiteUrl: string | null;
  firstName: string | null;
  lastName: string | null;
  primaryContactName: string | null;
  primaryContactEmail: string | null;
  primaryContactPhone: string | null;
  notes: string | null;
  tools: string[];
  billingPlanName: string | null;
  billingPlanTier: string | null;
  intake: {
    stage: LucidClientIntakeStage;
    meetingStatus: LucidClientMeetingStatus;
    meetingBookedAt: string | null;
    meetingDoneAt: string | null;
    meetingNotes: string | null;
    desiredOutcome: string | null;
    budgetRange: string | null;
    timeline: string | null;
    nextStep: string | null;
    source: string | null;
    rawContextPreview: string | null;
    extractionMethod: string | null;
    extractedBy: string | null;
    extractionSkill: string | null;
  };
  updatedAt: string;
  createdAt: string;
}

export interface LucidClientIntakeExtractionTrace {
  agentSlug: string;
  skillName: string;
  method: 'ai' | 'rules';
  provider: string | null;
  model: string | null;
  promptVersion: string;
  tokensInput: number;
  tokensOutput: number;
  tokensTotal: number;
  latencyMs: number | null;
  error: string | null;
}

export interface LucidClientContactSummary {
  id: string;
  fullName: string;
  role: string | null;
  email: string | null;
  phone: string | null;
  linkedinUrl: string | null;
  isPrimary: boolean;
  isDecisionMaker: boolean;
  influenceLevel: LucidContactInfluenceLevel;
  status: LucidContactStatus;
  notes: string | null;
  updatedAt: string;
  createdAt: string;
}

export interface LucidClientOpportunitySummary {
  id: string;
  title: string;
  stage: LucidOpportunityStage;
  status: LucidOpportunityStatus;
  offerType: LucidOfferType;
  valueEstimateEur: number | null;
  setupValueEur: number | null;
  monthlyValueEur: number | null;
  probabilityPercent: number;
  source: string | null;
  expectedCloseAt: string | null;
  closedAt: string | null;
  winLossReason: string | null;
  nextStep: string | null;
  nextStepDueAt: string | null;
  notes: string | null;
  primaryContactName: string | null;
  updatedAt: string;
  createdAt: string;
}

export interface LucidClientInteractionSummary {
  id: string;
  interactionType: LucidInteractionType;
  direction: LucidInteractionDirection;
  summary: string;
  notes: string | null;
  occurredAt: string;
  nextStep: string | null;
  nextStepDueAt: string | null;
  sentiment: LucidInteractionSentiment;
  sourceSystem: LucidInteractionSourceSystem;
  sourceUri: string | null;
  contactName: string | null;
  opportunityTitle: string | null;
  updatedAt: string;
  createdAt: string;
}

export interface LucidClientTaskSummary {
  id: string;
  title: string;
  description: string | null;
  status: LucidClientTaskStatus;
  priority: LucidClientTaskPriority;
  ownerLabel: string | null;
  dueAt: string | null;
  completedAt: string | null;
  createdBy: string;
  contactName: string | null;
  opportunityTitle: string | null;
  interactionSummary: string | null;
  updatedAt: string;
  createdAt: string;
}

export interface LucidClientImportSummary {
  id: string;
  title: string;
  sourceType: LucidClientImportSourceType;
  sourceUri: string | null;
  rawContentPreview: string;
  extractedSummary: string | null;
  status: LucidClientImportStatus;
  indexedAsKnowledge: boolean;
  knowledgeDocumentId: string | null;
  updatedAt: string;
  createdAt: string;
}

export interface CreateLucidClientContactInput {
  clientId: string;
  fullName: string;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
  linkedinUrl?: string | null;
  isPrimary?: boolean;
  isDecisionMaker?: boolean;
  influenceLevel?: LucidContactInfluenceLevel;
  status?: LucidContactStatus;
  notes?: string | null;
}

export interface CreateLucidClientOpportunityInput {
  clientId: string;
  title: string;
  primaryContactId?: string | null;
  stage?: LucidOpportunityStage;
  status?: LucidOpportunityStatus;
  offerType?: LucidOfferType;
  valueEstimateEur?: number | null;
  setupValueEur?: number | null;
  monthlyValueEur?: number | null;
  probabilityPercent?: number;
  source?: string | null;
  expectedCloseAt?: string | null;
  nextStep?: string | null;
  nextStepDueAt?: string | null;
  notes?: string | null;
}

export interface CreateLucidClientInteractionInput {
  clientId: string;
  contactId?: string | null;
  opportunityId?: string | null;
  interactionType?: LucidInteractionType;
  direction?: LucidInteractionDirection;
  summary: string;
  notes?: string | null;
  occurredAt?: string | null;
  nextStep?: string | null;
  nextStepDueAt?: string | null;
  sentiment?: LucidInteractionSentiment;
  sourceSystem?: LucidInteractionSourceSystem;
  sourceUri?: string | null;
}

export interface CreateLucidClientTaskInput {
  clientId: string;
  contactId?: string | null;
  opportunityId?: string | null;
  interactionId?: string | null;
  title: string;
  description?: string | null;
  status?: LucidClientTaskStatus;
  priority?: LucidClientTaskPriority;
  ownerLabel?: string | null;
  dueAt?: string | null;
  createdBy?: string;
}

export interface CreateLucidClientImportInput {
  clientId: string;
  title: string;
  sourceType?: LucidClientImportSourceType;
  sourceUri?: string | null;
  rawContent: string;
  extractedSummary?: string | null;
  status?: LucidClientImportStatus;
  indexAsKnowledge?: boolean;
}

export interface UpsertLucidClientIntakeInput {
  name: string;
  firstName?: string | null;
  lastName?: string | null;
  slug?: string | null;
  status?: LucidClientStatus;
  industry?: string | null;
  websiteUrl?: string | null;
  primaryContactName?: string | null;
  primaryContactEmail?: string | null;
  primaryContactPhone?: string | null;
  notes?: string | null;
  tools?: string[];
  intakeStage?: LucidClientIntakeStage;
  meetingStatus?: LucidClientMeetingStatus;
  meetingBookedAt?: string | null;
  meetingDoneAt?: string | null;
  meetingNotes?: string | null;
  desiredOutcome?: string | null;
  budgetRange?: string | null;
  timeline?: string | null;
  nextStep?: string | null;
  source?: string | null;
  rawContext?: string | null;
  indexAsKnowledge?: boolean;
  extractionTrace?: LucidClientIntakeExtractionTrace | null;
}

export interface UpsertLucidClientIntakeResult {
  id: string;
  slug: string;
}

export interface DeleteLucidClientResult {
  id: string;
  name: string;
  slug: string;
}

export interface LucidProjectSummary {
  id: string;
  name: string;
  projectType: string;
  status: LucidProjectStatus;
  priority: string;
  summary: string | null;
  dueAt: string | null;
  clientName: string | null;
  updatedAt: string;
  createdAt: string;
}

export interface LucidWebsiteSummary {
  id: string;
  name: string;
  status: LucidWebsiteStatus;
  healthStatus: LucidHealthStatus;
  primaryDomain: string | null;
  productionUrl: string | null;
  hostingProvider: string;
  clientName: string | null;
  projectName: string | null;
  lastCheckedAt: string | null;
  updatedAt: string;
}

export interface LucidAgentSummary {
  id: string;
  name: string;
  slug: string;
  role: string;
  status: LucidAgentStatus;
  providerPreference: string | null;
  modelPreference: string | null;
  approvalPolicy: string;
  memoryScope: string;
  tools: string[];
  updatedAt: string;
}

export interface LucidApprovalSummary {
  id: string;
  actionType: string;
  status: LucidApprovalStatus;
  riskLevel: string;
  decisionNotes: string | null;
  expiresAt: string | null;
  createdAt: string;
  agentName: string | null;
  clientName: string | null;
  projectName: string | null;
}

export interface LucidIncidentSummary {
  id: string;
  title: string;
  status: LucidIncidentStatus;
  severity: string;
  summary: string | null;
  startedAt: string;
  resolvedAt: string | null;
  clientName: string | null;
  websiteName: string | null;
}

export interface LucidKnowledgeDocumentSummary {
  id: string;
  title: string;
  slug: string;
  sourceSystem: string;
  sourceUri: string | null;
  status: LucidKnowledgeStatus;
  visibility: string;
  freshnessAt: string | null;
  summary: string | null;
  updatedAt: string;
  clientName: string | null;
  projectName: string | null;
}

export interface LucidClientKnowledgeSummary {
  id: string;
  title: string;
  slug: string;
  sourceUri: string | null;
  summary: string | null;
  content: string | null;
  updatedAt: string;
}

export interface LucidAuditEventSummary {
  id: string;
  actorType: string;
  eventType: string;
  riskLevel: string;
  summary: string;
  targetTable: string | null;
  targetId: string | null;
  createdAt: string;
}

export interface LucidOsDashboardData {
  schemaReady: boolean;
  organization: LucidOrganizationSummary | null;
  stats: {
    clientsTotal: number;
    clientsActive: number;
    projectsActive: number;
    websitesLive: number;
    agentsActive: number;
    approvalsPending: number;
    incidentsOpen: number;
    knowledgeDocuments: number;
  };
  recentClients: LucidClientSummary[];
  recentProjects: LucidProjectSummary[];
  recentWebsites: LucidWebsiteSummary[];
  activeAgents: LucidAgentSummary[];
  pendingApprovals: LucidApprovalSummary[];
  openIncidents: LucidIncidentSummary[];
  recentKnowledge: LucidKnowledgeDocumentSummary[];
  recentAuditEvents: LucidAuditEventSummary[];
}

export interface UpsertKnowledgeDocumentInput {
  title: string;
  slug: string;
  sourceSystem: 'obsidian' | 'supabase' | 'github' | 'admin' | 'web' | 'integration';
  sourceUri?: string | null;
  summary?: string | null;
  content?: string | null;
  clientId?: string | null;
  projectId?: string | null;
  visibility?: 'internal' | 'client' | 'public';
  status?: LucidKnowledgeStatus;
  freshnessAt?: string | null;
  metadata?: Record<string, unknown>;
  chunks?: Array<{ heading?: string | null; content: string; tokenCount?: number | null; metadata?: Record<string, unknown> }>;
  auditActorType?: RecordAuditEventInput['actorType'];
}

export interface RecordAuditEventInput {
  eventType: string;
  summary: string;
  actorType?: 'admin' | 'agent' | 'automation' | 'system' | 'integration';
  actorId?: string | null;
  clientId?: string | null;
  projectId?: string | null;
  targetTable?: string | null;
  targetId?: string | null;
  riskLevel?: 'low' | 'medium' | 'high' | 'critical';
  details?: Record<string, unknown>;
}

const emptyStats: LucidOsDashboardData['stats'] = {
  clientsTotal: 0,
  clientsActive: 0,
  projectsActive: 0,
  websitesLive: 0,
  agentsActive: 0,
  approvalsPending: 0,
  incidentsOpen: 0,
  knowledgeDocuments: 0,
};

function missingLucidOsRelation(error: QueryError): boolean {
  return error.code === '42P01'
    || error.code === 'PGRST205'
    || Boolean(error.message?.includes('does not exist'))
    || Boolean(error.message?.includes('Could not find the table'));
}

async function countRows(query: PromiseLike<CountResult>): Promise<number> {
  const { count, error } = await query;
  if (error) {
    if (missingLucidOsRelation(error)) return 0;
    throw error;
  }
  return count ?? 0;
}

async function selectRows<T>(query: PromiseLike<{ data: T[] | null; error: QueryError | null }>): Promise<T[]> {
  const { data, error } = await query;
  if (error) {
    if (missingLucidOsRelation(error)) return [];
    throw error;
  }
  return data ?? [];
}

async function selectMaybe<T>(query: PromiseLike<{ data: T | null; error: QueryError | null }>): Promise<T | null> {
  const { data, error } = await query;
  if (error) {
    if (missingLucidOsRelation(error)) return null;
    throw error;
  }
  return data ?? null;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) return asRecord(value[0]);
  if (!value || typeof value !== 'object') return null;
  return value as Record<string, unknown>;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function asBoolean(value: unknown): boolean {
  return value === true;
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizeOptionalDate(value: string | null | undefined): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function normalizePercent(value: number | null | undefined, fallback: number): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) return fallback;
  return Math.min(100, Math.max(0, Math.round(value)));
}

function firstText(...values: Array<string | null | undefined>): string | null {
  return values.find((value): value is string => typeof value === 'string' && value.trim().length > 0)?.trim() ?? null;
}

function truncateText(value: string | null | undefined, maxLength: number): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.length > maxLength ? `${trimmed.slice(0, maxLength - 1)}...` : trimmed;
}

function comparableText(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value.replace(/\s+/g, ' ').trim().toLowerCase();
  return normalized.length > 0 ? normalized : null;
}

function uniqueSection(seen: Set<string>, heading: string, value: string | null | undefined): string | null {
  const text = firstText(value);
  const comparable = comparableText(text);
  if (!text || !comparable || seen.has(comparable)) return null;
  seen.add(comparable);
  return `## ${heading}\n${text}`;
}

function typedValue<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === 'string' && allowed.includes(value as T) ? value as T : fallback;
}

function slugifyValue(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function normalizeClientUrl(value: string | null | undefined): string | null {
  const trimmed = firstText(value);
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return `https://${trimmed}`;
}

function normalizeOrganization(value: unknown): LucidOrganizationSummary {
  const record = asRecord(value) ?? {};

  return {
    id: String(record.id ?? ''),
    name: asString(record.name) ?? 'Lucid-Lab',
    slug: asString(record.slug) ?? DEFAULT_ORGANIZATION_SLUG,
    status: asString(record.status) ?? 'active',
    settings: asRecord(record.settings) ?? {},
    updatedAt: String(record.updated_at ?? ''),
  };
}

function normalizeClient(value: unknown): LucidClientSummary {
  const record = asRecord(value) ?? {};
  const billingPlan = asRecord(record.billing_plan);
  const metadata = asRecord(record.metadata) ?? {};
  const intake = asRecord(metadata.intake) ?? {};

  return {
    id: String(record.id ?? ''),
    name: asString(record.name) ?? 'Untitled client',
    slug: asString(record.slug) ?? '',
    status: typedValue(record.status, ['lead', 'active', 'paused', 'offboarded', 'archived'] satisfies LucidClientStatus[], 'lead'),
    lifecycleStage: typedValue(record.lifecycle_stage, ['lead', 'qualified', 'meeting_booked', 'discovery_done', 'proposal_needed', 'proposal_sent', 'negotiation', 'won', 'lost', 'onboarding', 'in_delivery', 'live_managed', 'success_retention', 'expansion_opportunity', 'archived'] satisfies LucidClientLifecycleStage[], 'lead'),
    ownerLabel: asString(record.owner_label),
    clientHealthStatus: typedValue(record.health_status, ['unknown', 'healthy', 'watch', 'risk', 'critical'] satisfies LucidClientHealthStatus[], 'unknown'),
    healthScore: asNumber(record.health_score),
    healthSummary: asString(record.health_summary),
    nextAction: asString(record.next_action) ?? asString(intake.next_step),
    nextActionDueAt: asString(record.next_action_due_at),
    lastContactedAt: asString(record.last_contacted_at),
    industry: asString(record.industry),
    websiteUrl: asString(record.website_url),
    firstName: asString(metadata.first_name),
    lastName: asString(metadata.last_name),
    primaryContactName: asString(record.primary_contact_name),
    primaryContactEmail: asString(record.primary_contact_email),
    primaryContactPhone: asString(record.primary_contact_phone),
    notes: asString(record.notes),
    tools: asStringArray(metadata.tools),
    billingPlanName: asString(billingPlan?.name),
    billingPlanTier: asString(billingPlan?.tier),
    intake: {
      stage: typedValue(intake.stage, ['potential', 'meeting_booked', 'meeting_done', 'proposal_sent', 'won', 'lost'] satisfies LucidClientIntakeStage[], 'potential'),
      meetingStatus: typedValue(intake.meeting_status, ['not_booked', 'booked', 'done', 'cancelled'] satisfies LucidClientMeetingStatus[], 'not_booked'),
      meetingBookedAt: asString(intake.meeting_booked_at),
      meetingDoneAt: asString(intake.meeting_done_at),
      meetingNotes: asString(intake.meeting_notes),
      desiredOutcome: asString(intake.desired_outcome),
      budgetRange: asString(intake.budget_range),
      timeline: asString(intake.timeline),
      nextStep: asString(intake.next_step),
      source: asString(intake.source),
      rawContextPreview: asString(intake.raw_context_preview),
      extractionMethod: asString(intake.extraction_method),
      extractedBy: asString(intake.extracted_by),
      extractionSkill: asString(intake.extraction_skill),
    },
    updatedAt: String(record.updated_at ?? ''),
    createdAt: String(record.created_at ?? ''),
  };
}

function normalizeProject(value: unknown): LucidProjectSummary {
  const record = asRecord(value) ?? {};
  const client = asRecord(record.client);

  return {
    id: String(record.id ?? ''),
    name: asString(record.name) ?? 'Untitled project',
    projectType: asString(record.project_type) ?? 'website',
    status: typedValue(record.status, ['idea', 'planned', 'active', 'blocked', 'completed', 'archived'] satisfies LucidProjectStatus[], 'planned'),
    priority: asString(record.priority) ?? 'normal',
    summary: asString(record.summary),
    dueAt: asString(record.due_at),
    clientName: asString(client?.name),
    updatedAt: String(record.updated_at ?? ''),
    createdAt: String(record.created_at ?? ''),
  };
}

function normalizeWebsite(value: unknown): LucidWebsiteSummary {
  const record = asRecord(value) ?? {};
  const client = asRecord(record.client);
  const project = asRecord(record.project);

  return {
    id: String(record.id ?? ''),
    name: asString(record.name) ?? 'Untitled website',
    status: typedValue(record.status, ['planned', 'designing', 'building', 'live', 'paused', 'archived'] satisfies LucidWebsiteStatus[], 'planned'),
    healthStatus: typedValue(record.health_status, ['unknown', 'healthy', 'degraded', 'down'] satisfies LucidHealthStatus[], 'unknown'),
    primaryDomain: asString(record.primary_domain),
    productionUrl: asString(record.production_url),
    hostingProvider: asString(record.hosting_provider) ?? 'vercel',
    clientName: asString(client?.name),
    projectName: asString(project?.name),
    lastCheckedAt: asString(record.last_checked_at),
    updatedAt: String(record.updated_at ?? ''),
  };
}

function normalizeAgent(value: unknown): LucidAgentSummary {
  const record = asRecord(value) ?? {};

  return {
    id: String(record.id ?? ''),
    name: asString(record.name) ?? 'Untitled agent',
    slug: asString(record.slug) ?? '',
    role: asString(record.role) ?? 'No role recorded yet.',
    status: typedValue(record.status, ['draft', 'active', 'paused', 'retired'] satisfies LucidAgentStatus[], 'draft'),
    providerPreference: asString(record.provider_preference),
    modelPreference: asString(record.model_preference),
    approvalPolicy: asString(record.approval_policy) ?? 'human_for_side_effects',
    memoryScope: asString(record.memory_scope) ?? 'organization',
    tools: asStringArray(record.tools),
    updatedAt: String(record.updated_at ?? ''),
  };
}

function normalizeApproval(value: unknown): LucidApprovalSummary {
  const record = asRecord(value) ?? {};
  const agent = asRecord(record.agent);
  const client = asRecord(record.client);
  const project = asRecord(record.project);

  return {
    id: String(record.id ?? ''),
    actionType: asString(record.action_type) ?? 'unknown_action',
    status: typedValue(record.status, ['pending', 'approved', 'rejected', 'expired', 'cancelled'] satisfies LucidApprovalStatus[], 'pending'),
    riskLevel: asString(record.risk_level) ?? 'medium',
    decisionNotes: asString(record.decision_notes),
    expiresAt: asString(record.expires_at),
    createdAt: String(record.created_at ?? ''),
    agentName: asString(agent?.name),
    clientName: asString(client?.name),
    projectName: asString(project?.name),
  };
}

function normalizeIncident(value: unknown): LucidIncidentSummary {
  const record = asRecord(value) ?? {};
  const client = asRecord(record.client);
  const website = asRecord(record.website);

  return {
    id: String(record.id ?? ''),
    title: asString(record.title) ?? 'Untitled incident',
    status: typedValue(record.status, ['open', 'investigating', 'identified', 'monitoring', 'resolved', 'closed'] satisfies LucidIncidentStatus[], 'open'),
    severity: asString(record.severity) ?? 'minor',
    summary: asString(record.summary),
    startedAt: String(record.started_at ?? ''),
    resolvedAt: asString(record.resolved_at),
    clientName: asString(client?.name),
    websiteName: asString(website?.name),
  };
}

function normalizeKnowledgeDocument(value: unknown): LucidKnowledgeDocumentSummary {
  const record = asRecord(value) ?? {};
  const client = asRecord(record.client);
  const project = asRecord(record.project);

  return {
    id: String(record.id ?? ''),
    title: asString(record.title) ?? 'Untitled knowledge document',
    slug: asString(record.slug) ?? '',
    sourceSystem: asString(record.source_system) ?? 'admin',
    sourceUri: asString(record.source_uri),
    status: typedValue(record.status, ['draft', 'active', 'archived', 'stale'] satisfies LucidKnowledgeStatus[], 'active'),
    visibility: asString(record.visibility) ?? 'internal',
    freshnessAt: asString(record.freshness_at),
    summary: asString(record.summary),
    updatedAt: String(record.updated_at ?? ''),
    clientName: asString(client?.name),
    projectName: asString(project?.name),
  };
}

function normalizeClientKnowledge(value: unknown): LucidClientKnowledgeSummary {
  const record = asRecord(value) ?? {};

  return {
    id: String(record.id ?? ''),
    title: asString(record.title) ?? 'Untitled knowledge document',
    slug: asString(record.slug) ?? '',
    sourceUri: asString(record.source_uri),
    summary: asString(record.summary),
    content: asString(record.content),
    updatedAt: String(record.updated_at ?? ''),
  };
}

function normalizeAuditEvent(value: unknown): LucidAuditEventSummary {
  const record = asRecord(value) ?? {};

  return {
    id: String(record.id ?? ''),
    actorType: asString(record.actor_type) ?? 'system',
    eventType: asString(record.event_type) ?? 'unknown_event',
    riskLevel: asString(record.risk_level) ?? 'low',
    summary: asString(record.summary) ?? 'No summary recorded.',
    targetTable: asString(record.target_table),
    targetId: asString(record.target_id),
    createdAt: String(record.created_at ?? ''),
  };
}

function normalizeClientContact(value: unknown): LucidClientContactSummary {
  const record = asRecord(value) ?? {};

  return {
    id: String(record.id ?? ''),
    fullName: asString(record.full_name) ?? 'Unnamed contact',
    role: asString(record.role),
    email: asString(record.email),
    phone: asString(record.phone),
    linkedinUrl: asString(record.linkedin_url),
    isPrimary: asBoolean(record.is_primary),
    isDecisionMaker: asBoolean(record.is_decision_maker),
    influenceLevel: typedValue(record.influence_level, ['unknown', 'low', 'medium', 'high', 'champion', 'blocker'] satisfies LucidContactInfluenceLevel[], 'unknown'),
    status: typedValue(record.status, ['active', 'inactive', 'left_company', 'archived'] satisfies LucidContactStatus[], 'active'),
    notes: asString(record.notes),
    updatedAt: String(record.updated_at ?? ''),
    createdAt: String(record.created_at ?? ''),
  };
}

function normalizeClientOpportunity(value: unknown): LucidClientOpportunitySummary {
  const record = asRecord(value) ?? {};
  const primaryContact = asRecord(record.primary_contact);

  return {
    id: String(record.id ?? ''),
    title: asString(record.title) ?? 'Untitled opportunity',
    stage: typedValue(record.stage, ['new', 'qualified', 'discovery', 'proposal_needed', 'proposal_sent', 'negotiation', 'won', 'lost', 'paused'] satisfies LucidOpportunityStage[], 'discovery'),
    status: typedValue(record.status, ['open', 'won', 'lost', 'paused', 'archived'] satisfies LucidOpportunityStatus[], 'open'),
    offerType: typedValue(record.offer_type, ['managed_website', 'website_database', 'ai_automation', 'ai_agent', 'custom_app', 'retainer', 'audit', 'custom'] satisfies LucidOfferType[], 'custom'),
    valueEstimateEur: asNumber(record.value_estimate_eur),
    setupValueEur: asNumber(record.setup_value_eur),
    monthlyValueEur: asNumber(record.monthly_value_eur),
    probabilityPercent: asNumber(record.probability_percent) ?? 20,
    source: asString(record.source),
    expectedCloseAt: asString(record.expected_close_at),
    closedAt: asString(record.closed_at),
    winLossReason: asString(record.win_loss_reason),
    nextStep: asString(record.next_step),
    nextStepDueAt: asString(record.next_step_due_at),
    notes: asString(record.notes),
    primaryContactName: asString(primaryContact?.full_name),
    updatedAt: String(record.updated_at ?? ''),
    createdAt: String(record.created_at ?? ''),
  };
}

function normalizeClientInteraction(value: unknown): LucidClientInteractionSummary {
  const record = asRecord(value) ?? {};
  const contact = asRecord(record.contact);
  const opportunity = asRecord(record.opportunity);

  return {
    id: String(record.id ?? ''),
    interactionType: typedValue(record.interaction_type, ['note', 'meeting', 'call', 'email', 'chat', 'form', 'import', 'support', 'delivery_update', 'decision'] satisfies LucidInteractionType[], 'note'),
    direction: typedValue(record.direction, ['inbound', 'outbound', 'internal'] satisfies LucidInteractionDirection[], 'internal'),
    summary: asString(record.summary) ?? 'No summary recorded.',
    notes: asString(record.notes),
    occurredAt: String(record.occurred_at ?? ''),
    nextStep: asString(record.next_step),
    nextStepDueAt: asString(record.next_step_due_at),
    sentiment: typedValue(record.sentiment, ['positive', 'neutral', 'negative', 'risk'] satisfies LucidInteractionSentiment[], 'neutral'),
    sourceSystem: typedValue(record.source_system, ['admin', 'tidycal', 'email', 'website', 'chat', 'github', 'obsidian', 'integration', 'agent'] satisfies LucidInteractionSourceSystem[], 'admin'),
    sourceUri: asString(record.source_uri),
    contactName: asString(contact?.full_name),
    opportunityTitle: asString(opportunity?.title),
    updatedAt: String(record.updated_at ?? ''),
    createdAt: String(record.created_at ?? ''),
  };
}

function normalizeClientTask(value: unknown): LucidClientTaskSummary {
  const record = asRecord(value) ?? {};
  const contact = asRecord(record.contact);
  const opportunity = asRecord(record.opportunity);
  const interaction = asRecord(record.interaction);

  return {
    id: String(record.id ?? ''),
    title: asString(record.title) ?? 'Untitled task',
    description: asString(record.description),
    status: typedValue(record.status, ['todo', 'in_progress', 'waiting', 'done', 'cancelled'] satisfies LucidClientTaskStatus[], 'todo'),
    priority: typedValue(record.priority, ['low', 'normal', 'high', 'urgent'] satisfies LucidClientTaskPriority[], 'normal'),
    ownerLabel: asString(record.owner_label),
    dueAt: asString(record.due_at),
    completedAt: asString(record.completed_at),
    createdBy: asString(record.created_by) ?? 'admin',
    contactName: asString(contact?.full_name),
    opportunityTitle: asString(opportunity?.title),
    interactionSummary: asString(interaction?.summary),
    updatedAt: String(record.updated_at ?? ''),
    createdAt: String(record.created_at ?? ''),
  };
}

function normalizeClientImport(value: unknown): LucidClientImportSummary {
  const record = asRecord(value) ?? {};

  return {
    id: String(record.id ?? ''),
    title: asString(record.title) ?? 'Untitled import',
    sourceType: typedValue(record.source_type, ['note', 'meeting_notes', 'email', 'doc', 'linkedin', 'website', 'chat', 'github', 'other'] satisfies LucidClientImportSourceType[], 'note'),
    sourceUri: asString(record.source_uri),
    rawContentPreview: truncateText(asString(record.raw_content), 500) ?? '',
    extractedSummary: asString(record.extracted_summary),
    status: typedValue(record.status, ['pending', 'processed', 'needs_review', 'failed', 'archived'] satisfies LucidClientImportStatus[], 'processed'),
    indexedAsKnowledge: asBoolean(record.indexed_as_knowledge),
    knowledgeDocumentId: asString(record.knowledge_document_id),
    updatedAt: String(record.updated_at ?? ''),
    createdAt: String(record.created_at ?? ''),
  };
}

function emptyDashboardData(schemaReady = false, organization: LucidOrganizationSummary | null = null): LucidOsDashboardData {
  return {
    schemaReady,
    organization,
    stats: emptyStats,
    recentClients: [],
    recentProjects: [],
    recentWebsites: [],
    activeAgents: [],
    pendingApprovals: [],
    openIncidents: [],
    recentKnowledge: [],
    recentAuditEvents: [],
  };
}

export async function getLucidOrganization(slug = DEFAULT_ORGANIZATION_SLUG): Promise<LucidOrganizationSummary | null> {
  const row = await selectMaybe<unknown>(
    supabase
      .from('organizations')
      .select('id,name,slug,status,settings,updated_at')
      .eq('slug', slug)
      .maybeSingle(),
  );

  return row ? normalizeOrganization(row) : null;
}

async function getLucidOrganizationId(): Promise<string | null> {
  const organization = await getLucidOrganization();
  return organization?.id ?? null;
}

export async function ensureLucidOrganizationId(): Promise<string> {
  const existingOrganizationId = await getLucidOrganizationId();
  if (existingOrganizationId) return existingOrganizationId;

  const { data, error } = await supabase
    .from('organizations')
    .upsert({
      name: 'Lucid-Lab',
      slug: DEFAULT_ORGANIZATION_SLUG,
      status: 'active',
      owner_label: 'Lucid-Lab internal OS',
      primary_language: 'fr',
      timezone: 'Europe/Paris',
      settings: {
        initialized_by: 'lucid_os_write_path',
      },
    }, { onConflict: 'slug' })
    .select('id')
    .single();

  if (error) {
    if (missingLucidOsRelation(error)) {
      throw new Error('Lucid OS tables are not available in this Supabase project. Run the Lucid OS migrations before saving clients.');
    }
    throw new Error(`ensureLucidOrganizationId: ${error.message}`);
  }

  return String(data.id);
}

export async function listLucidClients(limit = 50): Promise<LucidClientSummary[]> {
  const organizationId = await getLucidOrganizationId();
  if (!organizationId) return [];

  const rows = await selectRows<unknown>(
    supabase
      .from('clients')
      .select('id,name,slug,status,lifecycle_stage,owner_label,health_status,health_score,health_summary,next_action,next_action_due_at,last_contacted_at,industry,website_url,primary_contact_name,primary_contact_email,primary_contact_phone,notes,metadata,created_at,updated_at,billing_plan:billing_plans(name,tier)')
      .eq('organization_id', organizationId)
      .order('updated_at', { ascending: false })
      .limit(limit),
  );

  return rows.map(normalizeClient);
}

export async function getLucidClientBySlug(slug: string): Promise<LucidClientSummary | null> {
  const organizationId = await getLucidOrganizationId();
  if (!organizationId) return null;

  const row = await selectMaybe<unknown>(
    supabase
      .from('clients')
      .select('id,name,slug,status,lifecycle_stage,owner_label,health_status,health_score,health_summary,next_action,next_action_due_at,last_contacted_at,industry,website_url,primary_contact_name,primary_contact_email,primary_contact_phone,notes,metadata,created_at,updated_at,billing_plan:billing_plans(name,tier)')
      .eq('organization_id', organizationId)
      .eq('slug', slug)
      .maybeSingle(),
  );

  return row ? normalizeClient(row) : null;
}

export async function listLucidClientContactsForClient(clientId: string, limit = 50): Promise<LucidClientContactSummary[]> {
  const organizationId = await getLucidOrganizationId();
  if (!organizationId) return [];

  const rows = await selectRows<unknown>(
    supabase
      .from('client_contacts')
      .select('id,full_name,role,email,phone,linkedin_url,is_primary,is_decision_maker,influence_level,status,notes,created_at,updated_at')
      .eq('organization_id', organizationId)
      .eq('client_id', clientId)
      .order('is_primary', { ascending: false })
      .order('updated_at', { ascending: false })
      .limit(limit),
  );

  return rows.map(normalizeClientContact);
}

export async function listLucidClientOpportunitiesForClient(clientId: string, limit = 50): Promise<LucidClientOpportunitySummary[]> {
  const organizationId = await getLucidOrganizationId();
  if (!organizationId) return [];

  const rows = await selectRows<unknown>(
    supabase
      .from('client_opportunities')
      .select('id,title,stage,status,offer_type,value_estimate_eur,setup_value_eur,monthly_value_eur,probability_percent,source,expected_close_at,closed_at,win_loss_reason,next_step,next_step_due_at,notes,created_at,updated_at,primary_contact:client_contacts(full_name)')
      .eq('organization_id', organizationId)
      .eq('client_id', clientId)
      .order('updated_at', { ascending: false })
      .limit(limit),
  );

  return rows.map(normalizeClientOpportunity);
}

export async function listLucidClientInteractionsForClient(clientId: string, limit = 50): Promise<LucidClientInteractionSummary[]> {
  const organizationId = await getLucidOrganizationId();
  if (!organizationId) return [];

  const rows = await selectRows<unknown>(
    supabase
      .from('client_interactions')
      .select('id,interaction_type,direction,summary,notes,occurred_at,next_step,next_step_due_at,sentiment,source_system,source_uri,created_at,updated_at,contact:client_contacts(full_name),opportunity:client_opportunities(title)')
      .eq('organization_id', organizationId)
      .eq('client_id', clientId)
      .order('occurred_at', { ascending: false })
      .limit(limit),
  );

  return rows.map(normalizeClientInteraction);
}

export async function listLucidClientTasksForClient(clientId: string, limit = 50): Promise<LucidClientTaskSummary[]> {
  const organizationId = await getLucidOrganizationId();
  if (!organizationId) return [];

  const rows = await selectRows<unknown>(
    supabase
      .from('client_tasks')
      .select('id,title,description,status,priority,owner_label,due_at,completed_at,created_by,created_at,updated_at,contact:client_contacts(full_name),opportunity:client_opportunities(title),interaction:client_interactions(summary)')
      .eq('organization_id', organizationId)
      .eq('client_id', clientId)
      .order('status', { ascending: true })
      .order('due_at', { ascending: true, nullsFirst: false })
      .limit(limit),
  );

  return rows.map(normalizeClientTask);
}

export async function listLucidClientImportsForClient(clientId: string, limit = 25): Promise<LucidClientImportSummary[]> {
  const organizationId = await getLucidOrganizationId();
  if (!organizationId) return [];

  const rows = await selectRows<unknown>(
    supabase
      .from('client_imports')
      .select('id,title,source_type,source_uri,raw_content,extracted_summary,status,indexed_as_knowledge,knowledge_document_id,created_at,updated_at')
      .eq('organization_id', organizationId)
      .eq('client_id', clientId)
      .order('created_at', { ascending: false })
      .limit(limit),
  );

  return rows.map(normalizeClientImport);
}

export async function listLucidProjects(limit = 50): Promise<LucidProjectSummary[]> {
  const organizationId = await getLucidOrganizationId();
  if (!organizationId) return [];

  const rows = await selectRows<unknown>(
    supabase
      .from('projects')
      .select('id,name,project_type,status,priority,summary,due_at,created_at,updated_at,client:clients(name)')
      .eq('organization_id', organizationId)
      .order('updated_at', { ascending: false })
      .limit(limit),
  );

  return rows.map(normalizeProject);
}

export async function listLucidProjectsForClient(clientId: string, limit = 50): Promise<LucidProjectSummary[]> {
  const organizationId = await getLucidOrganizationId();
  if (!organizationId) return [];

  const rows = await selectRows<unknown>(
    supabase
      .from('projects')
      .select('id,name,project_type,status,priority,summary,due_at,created_at,updated_at,client:clients(name)')
      .eq('organization_id', organizationId)
      .eq('client_id', clientId)
      .order('updated_at', { ascending: false })
      .limit(limit),
  );

  return rows.map(normalizeProject);
}

export async function listLucidWebsites(limit = 50): Promise<LucidWebsiteSummary[]> {
  const organizationId = await getLucidOrganizationId();
  if (!organizationId) return [];

  const rows = await selectRows<unknown>(
    supabase
      .from('websites')
      .select('id,name,status,health_status,primary_domain,production_url,hosting_provider,last_checked_at,updated_at,client:clients(name),project:projects(name)')
      .eq('organization_id', organizationId)
      .order('updated_at', { ascending: false })
      .limit(limit),
  );

  return rows.map(normalizeWebsite);
}

export async function listLucidWebsitesForClient(clientId: string, limit = 50): Promise<LucidWebsiteSummary[]> {
  const organizationId = await getLucidOrganizationId();
  if (!organizationId) return [];

  const rows = await selectRows<unknown>(
    supabase
      .from('websites')
      .select('id,name,status,health_status,primary_domain,production_url,hosting_provider,last_checked_at,updated_at,client:clients(name),project:projects(name)')
      .eq('organization_id', organizationId)
      .eq('client_id', clientId)
      .order('updated_at', { ascending: false })
      .limit(limit),
  );

  return rows.map(normalizeWebsite);
}

export async function listLucidAgents(limit = 50): Promise<LucidAgentSummary[]> {
  const organizationId = await getLucidOrganizationId();
  if (!organizationId) return [];

  const rows = await selectRows<unknown>(
    supabase
      .from('agents')
      .select('id,name,slug,role,status,provider_preference,model_preference,approval_policy,memory_scope,tools,updated_at')
      .eq('organization_id', organizationId)
      .order('updated_at', { ascending: false })
      .limit(limit),
  );

  return rows.map(normalizeAgent);
}

export async function listLucidApprovals(limit = 50, status?: LucidApprovalStatus): Promise<LucidApprovalSummary[]> {
  const organizationId = await getLucidOrganizationId();
  if (!organizationId) return [];

  let query = supabase
    .from('agent_approvals')
    .select('id,action_type,status,risk_level,decision_notes,expires_at,created_at,agent:agents(name),client:clients(name),project:projects(name)')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (status) query = query.eq('status', status);

  const rows = await selectRows<unknown>(query);
  return rows.map(normalizeApproval);
}

export async function listLucidIncidents(limit = 50): Promise<LucidIncidentSummary[]> {
  const organizationId = await getLucidOrganizationId();
  if (!organizationId) return [];

  const rows = await selectRows<unknown>(
    supabase
      .from('incidents')
      .select('id,title,status,severity,summary,started_at,resolved_at,client:clients(name),website:websites(name)')
      .eq('organization_id', organizationId)
      .order('started_at', { ascending: false })
      .limit(limit),
  );

  return rows.map(normalizeIncident);
}

export async function listLucidKnowledgeDocuments(limit = 50): Promise<LucidKnowledgeDocumentSummary[]> {
  const organizationId = await getLucidOrganizationId();
  if (!organizationId) return [];

  const rows = await selectRows<unknown>(
    supabase
      .from('knowledge_documents')
      .select('id,title,slug,source_system,source_uri,status,visibility,freshness_at,summary,updated_at,client:clients(name),project:projects(name)')
      .eq('organization_id', organizationId)
      .order('updated_at', { ascending: false })
      .limit(limit),
  );

  return rows.map(normalizeKnowledgeDocument);
}

export async function getLucidClientIntakeKnowledge(clientSlug: string): Promise<LucidClientKnowledgeSummary | null> {
  const organizationId = await getLucidOrganizationId();
  if (!organizationId) return null;

  const row = await selectMaybe<unknown>(
    supabase
      .from('knowledge_documents')
      .select('id,title,slug,source_uri,summary,content,updated_at')
      .eq('organization_id', organizationId)
      .eq('slug', `client-${clientSlug}-intake`)
      .maybeSingle(),
  );

  return row ? normalizeClientKnowledge(row) : null;
}

export async function listLucidAuditEvents(limit = 20): Promise<LucidAuditEventSummary[]> {
  const organizationId = await getLucidOrganizationId();
  if (!organizationId) return [];

  const rows = await selectRows<unknown>(
    supabase
      .from('audit_events')
      .select('id,actor_type,event_type,risk_level,summary,target_table,target_id,created_at')
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false })
      .limit(limit),
  );

  return rows.map(normalizeAuditEvent);
}

export async function getLucidOsDashboardData(): Promise<LucidOsDashboardData> {
  const organization = await getLucidOrganization();
  if (!organization) return emptyDashboardData(false, null);

  const organizationId = organization.id;

  const [
    clientsTotal,
    clientsActive,
    projectsActive,
    websitesLive,
    agentsActive,
    approvalsPending,
    incidentsOpen,
    knowledgeDocuments,
    recentClients,
    recentProjects,
    recentWebsites,
    activeAgents,
    pendingApprovals,
    openIncidents,
    recentKnowledge,
    recentAuditEvents,
  ] = await Promise.all([
    countRows(supabase.from('clients').select('id', { count: 'exact', head: true }).eq('organization_id', organizationId)),
    countRows(supabase.from('clients').select('id', { count: 'exact', head: true }).eq('organization_id', organizationId).eq('status', 'active')),
    countRows(supabase.from('projects').select('id', { count: 'exact', head: true }).eq('organization_id', organizationId).in('status', ['active', 'blocked'])),
    countRows(supabase.from('websites').select('id', { count: 'exact', head: true }).eq('organization_id', organizationId).eq('status', 'live')),
    countRows(supabase.from('agents').select('id', { count: 'exact', head: true }).eq('organization_id', organizationId).eq('status', 'active')),
    countRows(supabase.from('agent_approvals').select('id', { count: 'exact', head: true }).eq('organization_id', organizationId).eq('status', 'pending')),
    countRows(supabase.from('incidents').select('id', { count: 'exact', head: true }).eq('organization_id', organizationId).in('status', ['open', 'investigating', 'identified', 'monitoring'])),
    countRows(supabase.from('knowledge_documents').select('id', { count: 'exact', head: true }).eq('organization_id', organizationId).eq('status', 'active')),
    listLucidClients(5),
    listLucidProjects(5),
    listLucidWebsites(5),
    listLucidAgents(5),
    listLucidApprovals(5, 'pending'),
    listLucidIncidents(5),
    listLucidKnowledgeDocuments(5),
    listLucidAuditEvents(8),
  ]);

  return {
    schemaReady: true,
    organization,
    stats: {
      clientsTotal,
      clientsActive,
      projectsActive,
      websitesLive,
      agentsActive,
      approvalsPending,
      incidentsOpen,
      knowledgeDocuments,
    },
    recentClients,
    recentProjects,
    recentWebsites,
    activeAgents,
    pendingApprovals,
    openIncidents,
    recentKnowledge,
    recentAuditEvents,
  };
}

export async function recordLucidAuditEvent(input: RecordAuditEventInput): Promise<void> {
  const organizationId = await ensureLucidOrganizationId();

  const { error } = await supabase.from('audit_events').insert({
    organization_id: organizationId,
    client_id: input.clientId ?? null,
    project_id: input.projectId ?? null,
    actor_type: input.actorType ?? 'system',
    actor_id: input.actorId ?? null,
    event_type: input.eventType,
    target_table: input.targetTable ?? null,
    target_id: input.targetId ?? null,
    risk_level: input.riskLevel ?? 'low',
    summary: input.summary,
    details: input.details ?? {},
  });

  if (error) throw new Error(`recordLucidAuditEvent: ${error.message}`);
}

async function getLucidClientMutationContext(clientId: string): Promise<{ id: string; name: string; slug: string; organizationId: string }> {
  const organizationId = await ensureLucidOrganizationId();
  const row = await selectMaybe<unknown>(
    supabase
      .from('clients')
      .select('id,name,slug')
      .eq('organization_id', organizationId)
      .eq('id', clientId)
      .maybeSingle(),
  );
  const record = asRecord(row);
  if (!record) throw new Error('Client not found for Lucid OS CRM mutation.');

  return {
    id: String(record.id ?? clientId),
    name: asString(record.name) ?? 'Untitled client',
    slug: asString(record.slug) ?? clientId,
    organizationId,
  };
}

export async function syncLucidClientRecordToObsidian(clientSlug: string, reason: LucidObsidianSyncReason): Promise<void> {
  try {
    const client = await getLucidClientBySlug(clientSlug);
    if (!client) return;

    const [contacts, opportunities, interactions, tasks, imports] = await Promise.all([
      listLucidClientContactsForClient(client.id, 50),
      listLucidClientOpportunitiesForClient(client.id, 50),
      listLucidClientInteractionsForClient(client.id, 50),
      listLucidClientTasksForClient(client.id, 50),
      listLucidClientImportsForClient(client.id, 25),
    ]);

    await syncLucidClientToObsidian({ client, contacts, opportunities, interactions, tasks, imports, reason });
  } catch (error) {
    await recordLucidAuditEvent({
      eventType: 'obsidian_sync_failed',
      summary: `Obsidian sync failed for client ${clientSlug}`,
      actorType: 'system',
      riskLevel: 'medium',
      details: { client_slug: clientSlug, error: error instanceof Error ? error.message : 'unknown error' },
    });
  }
}

function lifecycleFromOpportunityStage(stage: LucidOpportunityStage): LucidClientLifecycleStage | null {
  switch (stage) {
    case 'qualified': return 'qualified';
    case 'discovery': return 'discovery_done';
    case 'proposal_needed': return 'proposal_needed';
    case 'proposal_sent': return 'proposal_sent';
    case 'negotiation': return 'negotiation';
    case 'won': return 'won';
    case 'lost': return 'lost';
    default: return null;
  }
}

function lifecycleFromIntakeStage(stage: LucidClientIntakeStage, status: LucidClientStatus): LucidClientLifecycleStage {
  switch (stage) {
    case 'meeting_booked': return 'meeting_booked';
    case 'meeting_done': return 'discovery_done';
    case 'proposal_sent': return 'proposal_sent';
    case 'won': return 'won';
    case 'lost': return 'lost';
    default: return status === 'active' ? 'in_delivery' : status === 'archived' ? 'archived' : 'lead';
  }
}

export async function updateClientStatusAndLifecycle(
  clientId: string,
  status?: LucidClientStatus,
  lifecycleStage?: LucidClientLifecycleStage
): Promise<void> {
  const updates: Record<string, unknown> = {};
  if (status) updates.status = status;
  if (lifecycleStage) updates.lifecycle_stage = lifecycleStage;
  if (Object.keys(updates).length === 0) return;

  const { error } = await supabase
    .from('clients')
    .update(updates)
    .eq('id', clientId);

  if (error) throw new Error(`updateClientStatusAndLifecycle: ${error.message}`);
}

async function updateClientOperationalHints(input: {
  clientId: string;
  lifecycleStage?: LucidClientLifecycleStage | null;
  nextAction?: string | null;
  nextActionDueAt?: string | null;
  lastContactedAt?: string | null;
}): Promise<void> {
  const updates: Record<string, unknown> = {};
  if (input.lifecycleStage) updates.lifecycle_stage = input.lifecycleStage;
  if (input.nextAction !== undefined) updates.next_action = firstText(input.nextAction);
  if (input.nextActionDueAt !== undefined) updates.next_action_due_at = normalizeOptionalDate(input.nextActionDueAt);
  if (input.lastContactedAt !== undefined) updates.last_contacted_at = normalizeOptionalDate(input.lastContactedAt);
  if (Object.keys(updates).length === 0) return;

  const { error } = await supabase
    .from('clients')
    .update(updates)
    .eq('id', input.clientId);

  if (error) throw new Error(`updateClientOperationalHints: ${error.message}`);
}

export async function createLucidClientContact(input: CreateLucidClientContactInput): Promise<string> {
  const client = await getLucidClientMutationContext(input.clientId);
  if (input.isPrimary) {
    const { error: unsetError } = await supabase
      .from('client_contacts')
      .update({ is_primary: false })
      .eq('organization_id', client.organizationId)
      .eq('client_id', client.id)
      .eq('is_primary', true);
    if (unsetError) throw new Error(`createLucidClientContact unset primary: ${unsetError.message}`);
  }

  const { data, error } = await supabase
    .from('client_contacts')
    .insert({
      organization_id: client.organizationId,
      client_id: client.id,
      full_name: input.fullName,
      role: firstText(input.role),
      email: firstText(input.email),
      phone: firstText(input.phone),
      linkedin_url: firstText(input.linkedinUrl),
      is_primary: input.isPrimary ?? false,
      is_decision_maker: input.isDecisionMaker ?? false,
      influence_level: input.influenceLevel ?? 'unknown',
      status: input.status ?? 'active',
      notes: firstText(input.notes),
    })
    .select('id')
    .single();

  if (error) throw new Error(`createLucidClientContact: ${error.message}`);
  const contactId = String(data.id);

  await recordLucidAuditEvent({
    eventType: 'client_contact_created',
    summary: `Contact added to ${client.name}: ${input.fullName}`,
    actorType: 'admin',
    clientId: client.id,
    targetTable: 'client_contacts',
    targetId: contactId,
    details: { client_slug: client.slug, is_primary: input.isPrimary ?? false },
  });

  await syncLucidClientRecordToObsidian(client.slug, 'contact');

  return contactId;
}

export async function createLucidClientOpportunity(input: CreateLucidClientOpportunityInput): Promise<string> {
  const client = await getLucidClientMutationContext(input.clientId);
  const stage = input.stage ?? 'discovery';
  const status = input.status ?? (stage === 'won' ? 'won' : stage === 'lost' ? 'lost' : 'open');

  const { data, error } = await supabase
    .from('client_opportunities')
    .insert({
      organization_id: client.organizationId,
      client_id: client.id,
      primary_contact_id: input.primaryContactId ?? null,
      title: input.title,
      stage,
      status,
      offer_type: input.offerType ?? 'custom',
      value_estimate_eur: input.valueEstimateEur ?? null,
      setup_value_eur: input.setupValueEur ?? null,
      monthly_value_eur: input.monthlyValueEur ?? null,
      probability_percent: normalizePercent(input.probabilityPercent, 20),
      source: firstText(input.source),
      expected_close_at: normalizeOptionalDate(input.expectedCloseAt),
      next_step: firstText(input.nextStep),
      next_step_due_at: normalizeOptionalDate(input.nextStepDueAt),
      notes: firstText(input.notes),
    })
    .select('id')
    .single();

  if (error) throw new Error(`createLucidClientOpportunity: ${error.message}`);
  const opportunityId = String(data.id);

  await updateClientOperationalHints({
    clientId: client.id,
    lifecycleStage: lifecycleFromOpportunityStage(stage),
    nextAction: input.nextStep,
    nextActionDueAt: input.nextStepDueAt,
  });

  await recordLucidAuditEvent({
    eventType: 'client_opportunity_created',
    summary: `Opportunity added to ${client.name}: ${input.title}`,
    actorType: 'admin',
    clientId: client.id,
    targetTable: 'client_opportunities',
    targetId: opportunityId,
    details: { client_slug: client.slug, stage, status, value_estimate_eur: input.valueEstimateEur ?? null },
  });

  await syncLucidClientRecordToObsidian(client.slug, 'opportunity');

  return opportunityId;
}

export async function createLucidClientInteraction(input: CreateLucidClientInteractionInput): Promise<string> {
  const client = await getLucidClientMutationContext(input.clientId);
  const occurredAt = normalizeOptionalDate(input.occurredAt) ?? new Date().toISOString();

  const { data, error } = await supabase
    .from('client_interactions')
    .insert({
      organization_id: client.organizationId,
      client_id: client.id,
      contact_id: input.contactId ?? null,
      opportunity_id: input.opportunityId ?? null,
      interaction_type: input.interactionType ?? 'note',
      direction: input.direction ?? 'internal',
      summary: input.summary,
      notes: firstText(input.notes),
      occurred_at: occurredAt,
      next_step: firstText(input.nextStep),
      next_step_due_at: normalizeOptionalDate(input.nextStepDueAt),
      sentiment: input.sentiment ?? 'neutral',
      source_system: input.sourceSystem ?? 'admin',
      source_uri: firstText(input.sourceUri),
    })
    .select('id')
    .single();

  if (error) throw new Error(`createLucidClientInteraction: ${error.message}`);
  const interactionId = String(data.id);

  await updateClientOperationalHints({
    clientId: client.id,
    nextAction: input.nextStep,
    nextActionDueAt: input.nextStepDueAt,
    lastContactedAt: occurredAt,
  });

  await recordLucidAuditEvent({
    eventType: 'client_interaction_created',
    summary: `Interaction recorded for ${client.name}: ${input.summary}`,
    actorType: 'admin',
    clientId: client.id,
    targetTable: 'client_interactions',
    targetId: interactionId,
    details: { client_slug: client.slug, interaction_type: input.interactionType ?? 'note', sentiment: input.sentiment ?? 'neutral' },
  });

  await syncLucidClientRecordToObsidian(client.slug, 'interaction');

  return interactionId;
}

export async function createLucidClientTask(input: CreateLucidClientTaskInput): Promise<string> {
  const client = await getLucidClientMutationContext(input.clientId);
  const status = input.status ?? 'todo';

  const { data, error } = await supabase
    .from('client_tasks')
    .insert({
      organization_id: client.organizationId,
      client_id: client.id,
      contact_id: input.contactId ?? null,
      opportunity_id: input.opportunityId ?? null,
      interaction_id: input.interactionId ?? null,
      title: input.title,
      description: firstText(input.description),
      status,
      priority: input.priority ?? 'normal',
      owner_label: firstText(input.ownerLabel),
      due_at: normalizeOptionalDate(input.dueAt),
      completed_at: status === 'done' ? new Date().toISOString() : null,
      created_by: input.createdBy ?? 'admin',
    })
    .select('id')
    .single();

  if (error) throw new Error(`createLucidClientTask: ${error.message}`);
  const taskId = String(data.id);

  if (status !== 'done') {
    await updateClientOperationalHints({
      clientId: client.id,
      nextAction: input.title,
      nextActionDueAt: input.dueAt,
    });
  }

  await recordLucidAuditEvent({
    eventType: 'client_task_created',
    summary: `Task added for ${client.name}: ${input.title}`,
    actorType: 'admin',
    clientId: client.id,
    targetTable: 'client_tasks',
    targetId: taskId,
    details: { client_slug: client.slug, status, priority: input.priority ?? 'normal' },
  });

  await syncLucidClientRecordToObsidian(client.slug, 'task');

  return taskId;
}

export async function createLucidClientImport(input: CreateLucidClientImportInput): Promise<string> {
  const client = await getLucidClientMutationContext(input.clientId);
  const summary = firstText(input.extractedSummary, truncateText(input.rawContent, 500));
  let knowledgeDocumentId: string | null = null;

  if (input.indexAsKnowledge !== false) {
    const importSlug = slugifyValue(`${client.slug}-${input.title}-${Date.now()}`);
    knowledgeDocumentId = await upsertLucidKnowledgeDocument({
      title: `${client.name}: ${input.title}`,
      slug: `client-${importSlug}`,
      sourceSystem: 'admin',
      sourceUri: input.sourceUri ?? `admin://lucid-os/clients/${client.slug}/imports`,
      summary: summary ?? `Imported source for ${client.name}`,
      content: input.rawContent,
      clientId: client.id,
      visibility: 'internal',
      status: 'active',
      metadata: {
        captured_by: 'admin_client_import_form',
        source_type: input.sourceType ?? 'note',
        client_slug: client.slug,
      },
      chunks: [{ heading: input.title, content: input.rawContent }],
      auditActorType: 'admin',
    });
  }

  const { data, error } = await supabase
    .from('client_imports')
    .insert({
      organization_id: client.organizationId,
      client_id: client.id,
      knowledge_document_id: knowledgeDocumentId,
      title: input.title,
      source_type: input.sourceType ?? 'note',
      source_uri: firstText(input.sourceUri),
      raw_content: input.rawContent,
      extracted_summary: summary,
      status: input.status ?? 'processed',
      indexed_as_knowledge: Boolean(knowledgeDocumentId),
    })
    .select('id')
    .single();

  if (error) throw new Error(`createLucidClientImport: ${error.message}`);
  const importId = String(data.id);

  await createLucidClientInteraction({
    clientId: client.id,
    interactionType: 'import',
    direction: 'internal',
    summary: `Imported source: ${input.title}`,
    notes: summary,
    sourceSystem: 'admin',
    sourceUri: input.sourceUri ?? null,
  });

  await recordLucidAuditEvent({
    eventType: 'client_import_created',
    summary: `Source imported for ${client.name}: ${input.title}`,
    actorType: 'admin',
    clientId: client.id,
    targetTable: 'client_imports',
    targetId: importId,
    details: { client_slug: client.slug, source_type: input.sourceType ?? 'note', indexed_as_knowledge: Boolean(knowledgeDocumentId) },
  });

  await syncLucidClientRecordToObsidian(client.slug, 'import');

  return importId;
}

export async function upsertLucidClientIntake(input: UpsertLucidClientIntakeInput): Promise<UpsertLucidClientIntakeResult> {
  const organizationId = await ensureLucidOrganizationId();

  const now = new Date().toISOString();
  const slug = firstText(input.slug, slugifyValue(input.name));
  if (!slug) throw new Error('Client slug could not be generated');

  const existingClient = await selectMaybe<unknown>(
    supabase
      .from('clients')
      .select('metadata')
      .eq('organization_id', organizationId)
      .eq('slug', slug)
      .maybeSingle(),
  );
  const existingMetadata = asRecord(asRecord(existingClient)?.metadata) ?? {};

  const rawContext = firstText(input.rawContext);
  const meetingNotes = firstText(input.meetingNotes);
  const desiredOutcome = firstText(input.desiredOutcome);
  const notes = firstText(input.notes, desiredOutcome);
  const extractionTrace = input.extractionTrace ?? null;
  const resolvedStatus = input.status ?? 'lead';
  const resolvedIntakeStage = input.intakeStage ?? 'potential';
  const intakeMetadata = {
    stage: resolvedIntakeStage,
    meeting_status: input.meetingStatus ?? 'not_booked',
    meeting_booked_at: input.meetingBookedAt ?? null,
    meeting_done_at: input.meetingDoneAt ?? null,
    meeting_notes: meetingNotes,
    desired_outcome: desiredOutcome,
    budget_range: firstText(input.budgetRange),
    timeline: firstText(input.timeline),
    next_step: firstText(input.nextStep),
    source: firstText(input.source),
    raw_context_preview: truncateText(rawContext, 1000),
    captured_by: 'admin_client_intake_form',
    extracted_by: extractionTrace?.agentSlug ?? null,
    extraction_skill: extractionTrace?.skillName ?? null,
    extraction_method: extractionTrace?.method ?? null,
    extraction_provider: extractionTrace?.provider ?? null,
    extraction_model: extractionTrace?.model ?? null,
    extraction_prompt_version: extractionTrace?.promptVersion ?? null,
    extraction_tokens_total: extractionTrace?.tokensTotal ?? 0,
    extraction_latency_ms: extractionTrace?.latencyMs ?? null,
    extraction_error: extractionTrace?.error ?? null,
    captured_at: now,
  };

  const { data, error } = await supabase
    .from('clients')
    .upsert({
      organization_id: organizationId,
      name: input.name,
      slug,
      status: resolvedStatus,
      lifecycle_stage: lifecycleFromIntakeStage(resolvedIntakeStage, resolvedStatus),
      next_action: firstText(input.nextStep),
      last_contacted_at: normalizeOptionalDate(input.meetingDoneAt ?? input.meetingBookedAt ?? null),
      industry: firstText(input.industry),
      website_url: normalizeClientUrl(input.websiteUrl),
      primary_contact_name: firstText(input.primaryContactName),
      primary_contact_email: firstText(input.primaryContactEmail),
      primary_contact_phone: firstText(input.primaryContactPhone),
      notes,
      metadata: {
        ...existingMetadata,
        first_name: firstText(input.firstName) || existingMetadata.first_name || null,
        last_name: firstText(input.lastName) || existingMetadata.last_name || null,
        tools: input.tools ?? (existingMetadata.tools as string[] | undefined) ?? [],
        intake: intakeMetadata,
      },
    }, { onConflict: 'organization_id,slug' })
    .select('id')
    .single();

  if (error) throw new Error(`upsertLucidClientIntake: ${error.message}`);
  const clientId = String(data.id);

  const primaryContactLabel = firstText(input.primaryContactName);
  if (primaryContactLabel) {
    try {
      const existingPrimaryContact = await selectMaybe<unknown>(
        supabase
          .from('client_contacts')
          .select('id')
          .eq('organization_id', organizationId)
          .eq('client_id', clientId)
          .eq('is_primary', true)
          .maybeSingle(),
      );
      const existingPrimaryContactId = asString(asRecord(existingPrimaryContact)?.id);
      const contactPayload = {
        full_name: primaryContactLabel,
        role: 'Primary contact',
        email: firstText(input.primaryContactEmail),
        phone: firstText(input.primaryContactPhone),
        is_primary: true,
        status: 'active',
        notes: null,
      };

      if (existingPrimaryContactId) {
        const { error: contactUpdateError } = await supabase
          .from('client_contacts')
          .update(contactPayload)
          .eq('id', existingPrimaryContactId);
        if (contactUpdateError && !missingLucidOsRelation(contactUpdateError)) throw contactUpdateError;
      } else {
        const { error: contactInsertError } = await supabase
          .from('client_contacts')
          .insert({
            organization_id: organizationId,
            client_id: clientId,
            ...contactPayload,
            metadata: { captured_by: 'client_intake_upsert' },
          });
        if (contactInsertError && !missingLucidOsRelation(contactInsertError)) throw contactInsertError;
      }
    } catch (contactError) {
      if (!(asRecord(contactError) && missingLucidOsRelation(asRecord(contactError) as QueryError))) {
        throw new Error(`upsertLucidClientIntake primary contact sync: ${contactError instanceof Error ? contactError.message : 'unknown error'}`);
      }
    }
  }

  if (input.indexAsKnowledge !== false) {
    const seenSections = new Set<string>();
    const knowledgeContent = [
      uniqueSection(seenSections, 'Extracted client need', desiredOutcome),
      uniqueSection(seenSections, 'Meeting summary', meetingNotes),
      uniqueSection(seenSections, 'Budget', firstText(input.budgetRange)),
      uniqueSection(seenSections, 'Timeline', firstText(input.timeline)),
      uniqueSection(seenSections, 'Next step', firstText(input.nextStep)),
      uniqueSection(seenSections, 'Source note', rawContext),
      uniqueSection(seenSections, 'Internal notes', notes),
    ].filter((value): value is string => Boolean(value));

    if (knowledgeContent.length > 0) {
      const knowledgeSummary = firstText(desiredOutcome, meetingNotes, notes, rawContext?.slice(0, 500)) ?? `Client intake for ${input.name}`;
      await upsertLucidKnowledgeDocument({
        title: `${input.name} intake notes`,
        slug: `client-${slug}-intake`,
        sourceSystem: 'admin',
        sourceUri: `admin://lucid-os/clients/${slug}/intake`,
        summary: knowledgeSummary,
        content: knowledgeContent.join('\n\n'),
        clientId,
        visibility: 'internal',
        status: 'active',
        metadata: {
          captured_by: 'admin_client_intake_form',
          extracted_by: extractionTrace?.agentSlug ?? null,
          extraction_skill: extractionTrace?.skillName ?? null,
          extraction_method: extractionTrace?.method ?? null,
          extraction_provider: extractionTrace?.provider ?? null,
          extraction_model: extractionTrace?.model ?? null,
          extraction_prompt_version: extractionTrace?.promptVersion ?? null,
          extraction_tokens_total: extractionTrace?.tokensTotal ?? 0,
          extraction_error: extractionTrace?.error ?? null,
          client_slug: slug,
          intake_stage: intakeMetadata.stage,
          meeting_status: intakeMetadata.meeting_status,
        },
        chunks: [{ heading: `${input.name} intake`, content: knowledgeContent.join('\n\n') }],
        auditActorType: extractionTrace ? 'agent' : 'admin',
      });
    }
  }

  await recordLucidAuditEvent({
    eventType: 'client_intake_recorded',
    summary: `Client intake recorded: ${input.name}`,
    actorType: 'admin',
    clientId,
    targetTable: 'clients',
    targetId: clientId,
    riskLevel: 'low',
    details: {
      slug,
      intake_stage: intakeMetadata.stage,
      meeting_status: intakeMetadata.meeting_status,
      source: intakeMetadata.source,
      indexed_as_knowledge: input.indexAsKnowledge !== false,
      extracted_by: extractionTrace?.agentSlug ?? null,
      extraction_method: extractionTrace?.method ?? null,
      extraction_error: extractionTrace?.error ?? null,
    },
  });

  await syncLucidClientRecordToObsidian(slug, 'intake');

  return { id: clientId, slug };
}

export async function deleteLucidClient(clientId: string): Promise<DeleteLucidClientResult> {
  const client = await getLucidClientMutationContext(clientId);
  const knowledgeDocuments = await selectRows<unknown>(
    supabase
      .from('knowledge_documents')
      .select('id')
      .eq('organization_id', client.organizationId)
      .eq('client_id', client.id),
  );
  const knowledgeDocumentIds = knowledgeDocuments
    .map((record) => asString(asRecord(record)?.id))
    .filter((id): id is string => Boolean(id));

  if (knowledgeDocumentIds.length > 0) {
    const { error: knowledgeDeleteError } = await supabase
      .from('knowledge_documents')
      .delete()
      .eq('organization_id', client.organizationId)
      .in('id', knowledgeDocumentIds);
    if (knowledgeDeleteError) throw new Error(`deleteLucidClient knowledge documents: ${knowledgeDeleteError.message}`);
  }

  const { error } = await supabase
    .from('clients')
    .delete()
    .eq('organization_id', client.organizationId)
    .eq('id', client.id);

  if (error) throw new Error(`deleteLucidClient: ${error.message}`);

  await recordLucidAuditEvent({
    eventType: 'client_deleted',
    summary: `Client deleted from Lucid OS: ${client.name}`,
    actorType: 'admin',
    targetTable: 'clients',
    targetId: client.id,
    riskLevel: 'high',
    details: { client_slug: client.slug, deleted_knowledge_documents: knowledgeDocumentIds.length },
  });

  try {
    await markLucidClientDeletedInObsidian({
      clientName: client.name,
      clientSlug: client.slug,
      deletedAt: new Date().toISOString(),
    });
  } catch (syncError) {
    await recordLucidAuditEvent({
      eventType: 'obsidian_sync_failed',
      summary: `Obsidian deletion sync failed for client ${client.slug}`,
      actorType: 'system',
      riskLevel: 'medium',
      details: { client_slug: client.slug, error: syncError instanceof Error ? syncError.message : 'unknown error' },
    });
  }

  return { id: client.id, name: client.name, slug: client.slug };
}

export async function upsertLucidKnowledgeDocument(input: UpsertKnowledgeDocumentInput): Promise<string> {
  const organizationId = await ensureLucidOrganizationId();

  const { data, error } = await supabase
    .from('knowledge_documents')
    .upsert({
      organization_id: organizationId,
      client_id: input.clientId ?? null,
      project_id: input.projectId ?? null,
      source_system: input.sourceSystem,
      source_uri: input.sourceUri ?? null,
      title: input.title,
      slug: input.slug,
      status: input.status ?? 'active',
      visibility: input.visibility ?? 'internal',
      freshness_at: input.freshnessAt ?? new Date().toISOString(),
      summary: input.summary ?? null,
      content: input.content ?? null,
      metadata: input.metadata ?? {},
    }, { onConflict: 'organization_id,slug' })
    .select('id')
    .single();

  if (error) throw new Error(`upsertLucidKnowledgeDocument: ${error.message}`);
  const documentId = String(data.id);

  if (input.chunks) {
    const { error: deleteError } = await supabase
      .from('knowledge_chunks')
      .delete()
      .eq('document_id', documentId);
    if (deleteError) throw new Error(`upsertLucidKnowledgeDocument chunks delete: ${deleteError.message}`);

    if (input.chunks.length > 0) {
      const { error: insertError } = await supabase
        .from('knowledge_chunks')
        .insert(input.chunks.map((chunk, index) => ({
          organization_id: organizationId,
          client_id: input.clientId ?? null,
          project_id: input.projectId ?? null,
          document_id: documentId,
          chunk_index: index,
          heading: chunk.heading ?? null,
          content: chunk.content,
          token_count: chunk.tokenCount ?? null,
          metadata: chunk.metadata ?? {},
        })));
      if (insertError) throw new Error(`upsertLucidKnowledgeDocument chunks insert: ${insertError.message}`);
    }
  }

  await recordLucidAuditEvent({
    eventType: 'knowledge_document_upserted',
    summary: `Knowledge document updated: ${input.title}`,
    actorType: input.auditActorType ?? 'system',
    clientId: input.clientId ?? null,
    projectId: input.projectId ?? null,
    targetTable: 'knowledge_documents',
    targetId: documentId,
    riskLevel: 'low',
    details: {
      slug: input.slug,
      source_system: input.sourceSystem,
      source_uri: input.sourceUri ?? null,
      chunk_count: input.chunks?.length ?? null,
    },
  });

  return documentId;
}
