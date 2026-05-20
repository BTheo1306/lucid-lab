import 'server-only';

import { z } from 'zod';
import { ensureLucidOrganizationId, recordLucidAuditEvent } from '@/lib/admin/lucid-os';
import { config } from '@/lib/bot/config';
import { assertSupabaseServiceRoleConfigured, supabase } from '@/lib/bot/db/supabase';
import { isBudgetExceeded, recordAiUsage } from '@/lib/bot/db/queries/ai-budget';
import { getAIProvider } from '@/lib/bot/integrations/ai-client';
import { approveAgentApprovalAndEnqueue, processAgentWorkflowRunById, rejectAgentApproval, type AgentWorkflowProcessResult } from './workflow-runner';
import { COO_AGENT_TOOL_NAMES, highestToolRiskLevel, mergeRiskLevels, toolCatalogForPrompt, toolNamesForCooIntent } from './tool-registry';

const COO_AGENT_SLUG = 'coo-agent';
const PROMPT_VERSION = 'coo-agent-v1.5-smart-routing';

type TelegramId = string;

type TelegramUser = {
  id?: number | string;
  is_bot?: boolean;
  first_name?: string;
  last_name?: string;
  username?: string;
};

type TelegramChat = {
  id?: number | string;
  type?: string;
  title?: string;
  username?: string;
};

type TelegramMessage = {
  message_id?: number;
  date?: number;
  text?: string;
  caption?: string;
  from?: TelegramUser;
  chat?: TelegramChat;
};

export type TelegramUpdate = {
  update_id?: number;
  message?: TelegramMessage;
  edited_message?: TelegramMessage;
  channel_post?: TelegramMessage;
};

export type CooTelegramIntent =
  | 'business_question'
  | 'finance_document'
  | 'crm_or_sales'
  | 'meeting_ops'
  | 'incident_ops'
  | 'help'
  | 'general_ops'
  | 'small_talk'
  | 'unclear';

type CooTelegramMode = 'answer' | 'action' | 'clarify' | 'ignore' | 'help';
type CooRiskLevel = 'low' | 'medium' | 'high' | 'critical';

interface CooDecision {
  mode: CooTelegramMode;
  intent: CooTelegramIntent;
  confidence: number;
  replyText: string | null;
  taskTitle: string | null;
  taskDescription: string | null;
  approvalSummary: string | null;
  routedTo: string | null;
  riskLevel: CooRiskLevel;
  requiresApproval: boolean;
}

export interface CooTelegramDispatchResult {
  processed: boolean;
  authorized: boolean;
  chatId: TelegramId | null;
  senderId: TelegramId | null;
  replyText: string | null;
  runId: string | null;
  taskId: string | null;
  approvalId: string | null;
  reason: string | null;
}

export interface TelegramSendResult {
  ok: boolean;
  error: string | null;
}

const COO_INTENT_VALUES = ['business_question', 'finance_document', 'crm_or_sales', 'meeting_ops', 'incident_ops', 'help', 'general_ops', 'small_talk', 'unclear'] as const;

const cooDecisionSchema = z.object({
  mode: z.enum(['answer', 'action', 'clarify', 'ignore', 'help']).catch('answer'),
  intent: z.enum(COO_INTENT_VALUES).catch('unclear'),
  confidence: z.number().min(0).max(1).optional(),
  replyText: z.string().nullable().optional(),
  taskTitle: z.string().nullable().optional(),
  taskDescription: z.string().nullable().optional(),
  approvalSummary: z.string().nullable().optional(),
  routedTo: z.string().nullable().optional(),
  riskLevel: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  requiresApproval: z.boolean().optional(),
});

function parseIdSet(value: string): Set<TelegramId> {
  return new Set(
    value
      .split(',')
      .map((item) => item.trim())
      .filter((item) => item.length > 0),
  );
}

function telegramId(value: number | string | undefined): TelegramId | null {
  if (typeof value === 'number') return String(value);
  if (typeof value === 'string' && value.trim().length > 0) return value.trim();
  return null;
}

function telegramDisplayName(user: TelegramUser | undefined): string | null {
  if (!user) return null;
  const fullName = [user.first_name, user.last_name]
    .map((part) => part?.trim())
    .filter((part): part is string => Boolean(part))
    .join(' ')
    .trim();

  if (fullName) return fullName;
  return user.username ? `@${user.username}` : null;
}

function extractMessage(update: TelegramUpdate): TelegramMessage | null {
  return update.message ?? update.edited_message ?? update.channel_post ?? null;
}

function extractMessageText(message: TelegramMessage): string | null {
  const text = message.text ?? message.caption ?? '';
  const trimmed = text.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function isAuthorized(senderId: TelegramId | null, chatId: TelegramId | null): boolean {
  const allowedUserIds = parseIdSet(config.telegramCooAllowedUserIds);
  const allowedChatIds = parseIdSet(config.telegramCooAllowedChatIds);

  if (allowedUserIds.size === 0 && allowedChatIds.size === 0) return false;
  if (senderId && allowedUserIds.has(senderId)) return true;
  return Boolean(chatId && allowedChatIds.has(chatId));
}

function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9?]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function cleanText(value: unknown, maxLength = 2400): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.replace(/\s+/g, ' ').trim();
  if (!trimmed) return null;
  return trimmed.length > maxLength ? `${trimmed.slice(0, maxLength - 3)}...` : trimmed;
}

function providerKeyConfigured(): boolean {
  switch (config.aiProvider) {
    case 'anthropic': return Boolean(config.anthropicApiKey);
    case 'openai': return Boolean(config.openaiApiKey);
    case 'gemini': return Boolean(config.googleAiApiKey);
    case 'mistral': return Boolean(config.mistralApiKey);
    default: return false;
  }
}

async function aiBudgetAvailable(): Promise<boolean> {
  try {
    return !(await isBudgetExceeded());
  } catch {
    return true;
  }
}

async function recordUsageBestEffort(tokens: number): Promise<void> {
  try {
    await recordAiUsage(tokens);
  } catch {
    return;
  }
}

function classifyIntent(text: string): CooTelegramIntent {
  const normalized = normalizeSearchText(text);

  if (/^\/(start|help)\b/.test(normalized)) return 'help';
  if (/\?$/.test(text.trim()) || /\b(what|who|when|where|why|how|combien|comment|pourquoi|qui|quoi|quel|quelle|est ce que|c est quoi)\b/.test(normalized)) return 'business_question';
  if (/\b(facture|invoice|devis|bon de commande|bdc|paiement|payment|contrat|docuseal)\b/.test(normalized)) return 'finance_document';
  if (/\b(client|crm|prospect|lead|contact|pipeline|opportunite|opportunity)\b/.test(normalized)) return 'crm_or_sales';
  if (/\b(meeting|reunion|rdv|rendez vous|call|notes|transcript|compte rendu)\b/.test(normalized)) return 'meeting_ops';
  if (/\b(incident|down|bug|erreur|error|urgent|monitor|alerte|alert)\b/.test(normalized)) return 'incident_ops';
  if (/^(ok|okay|merci|thanks|thank you|bien recu|noted|parfait|super)[.!\s]*$/.test(normalized)) return 'small_talk';
  return 'general_ops';
}

function fallbackModeForText(text: string, intent: CooTelegramIntent): CooTelegramMode {
  const normalized = normalizeSearchText(text);
  if (intent === 'help') return 'help';
  if (intent === 'small_talk') return 'ignore';
  if (intent === 'business_question') return 'answer';
  if (/\b(create|add|update|change|prepare|draft|send|make|do|book|schedule|relance|ajoute|cree|mets|met|prepare|fais|lance|envoie|corrige|modifie)\b/.test(normalized)) return 'action';
  if (text.trim().length < 18) return 'clarify';
  return 'action';
}

function specialistForIntent(intent: CooTelegramIntent): string {
  switch (intent) {
    case 'business_question':
      return 'COO Agent';
    case 'finance_document':
      return 'Finance / Document Agent';
    case 'crm_or_sales':
      return 'CRM / Sales Agent';
    case 'meeting_ops':
      return 'Meeting Ops Agent';
    case 'incident_ops':
      return 'Ops Incident Agent';
    case 'help':
      return 'COO Agent';
    case 'small_talk':
      return 'COO Agent';
    case 'unclear':
      return 'COO Agent';
    case 'general_ops':
      return 'COO Agent';
  }
}

function taskTitle(intent: CooTelegramIntent, text: string): string {
  const preview = text.replace(/\s+/g, ' ').slice(0, 80);
  switch (intent) {
    case 'business_question':
      return `Telegram COO: business question - ${preview}`;
    case 'finance_document':
      return `Telegram COO: finance/document request - ${preview}`;
    case 'crm_or_sales':
      return `Telegram COO: CRM/sales request - ${preview}`;
    case 'meeting_ops':
      return `Telegram COO: meeting request - ${preview}`;
    case 'incident_ops':
      return `Telegram COO: incident request - ${preview}`;
    case 'help':
      return `Telegram COO: help request - ${preview}`;
    case 'small_talk':
      return `Telegram COO: small talk - ${preview}`;
    case 'unclear':
      return `Telegram COO: clarify request - ${preview}`;
    case 'general_ops':
      return `Telegram COO: operations request - ${preview}`;
  }
}

function priorityForIntent(intent: CooTelegramIntent): 'normal' | 'high' | 'urgent' {
  if (intent === 'incident_ops') return 'urgent';
  if (intent === 'finance_document' || intent === 'meeting_ops') return 'high';
  return 'normal';
}

function helpReply(): string {
  return [
    'COO agent active.',
    'Send me an operational request like:',
    '- create or prepare a facture/devis/bon de commande',
    '- summarize a meeting or capture next steps',
    '- update a client/prospect in Lucid OS',
    '- investigate an incident or blocked task',
    'For now I create a logged task and audit trail. Execution workflows stay behind approvals.',
  ].join('\n');
}

function actionApprovalReply(decision: CooDecision, runId: string | null, taskId: string | null, approvalId: string | null): string {
  const references = [
    taskId ? `Task ${taskId.slice(0, 8)}` : null,
    approvalId ? `Approval ${approvalId.slice(0, 8)}` : null,
    !taskId && !approvalId && runId ? `Run ${runId.slice(0, 8)}` : null,
  ].filter(Boolean).join(' - ');

  return [
    'I can handle this, but I will not execute it yet.',
    `Plan: ${decision.approvalSummary ?? decision.taskDescription ?? decision.taskTitle ?? 'prepare the requested Lucid OS work'}`,
    references ? `${references} is in Lucid OS.` : 'This is logged in Lucid OS.',
    'Approve it before I delegate, mutate CRM, send anything, or trigger external side effects.',
  ].join('\n');
}

function replyForDecision(decision: CooDecision, runId: string | null, taskId: string | null, approvalId: string | null): string | null {
  switch (decision.mode) {
    case 'help':
      return helpReply();
    case 'answer':
    case 'clarify':
      return decision.replyText;
    case 'ignore':
      return null;
    case 'action':
      return actionApprovalReply(decision, runId, taskId, approvalId);
  }
}

function proposedToolNames(decision: CooDecision): string[] {
  return toolNamesForCooIntent(decision.intent);
}

function governedRiskLevel(decision: CooDecision): CooRiskLevel {
  return mergeRiskLevels(decision.riskLevel, highestToolRiskLevel(proposedToolNames(decision), decision.riskLevel));
}

function approvalActionType(decision: CooDecision): string {
  const primaryTool = proposedToolNames(decision)[0];
  return primaryTool ? `tool.${primaryTool.replace(/\./g, '_')}` : `telegram_coo_${decision.intent}`;
}

function accessDeniedReply(senderId: TelegramId | null, chatId: TelegramId | null): string {
  return [
    'COO Telegram access is not enabled for this sender or chat.',
    `Sender ID: ${senderId ?? 'unknown'}`,
    `Chat ID: ${chatId ?? 'unknown'}`,
    'Ask an admin to add the right ID to TELEGRAM_COO_ALLOWED_USER_IDS or TELEGRAM_COO_ALLOWED_CHAT_IDS.',
  ].join('\n');
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) return asRecord(value[0]);
  return value && typeof value === 'object' ? value as Record<string, unknown> : null;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

type TelegramApprovalCommand = 'approve' | 'reject';

interface PendingTelegramApproval {
  id: string;
  taskId: string | null;
  runId: string | null;
  actionType: string;
  riskLevel: string;
  requestPayload: Record<string, unknown>;
  createdAt: string;
}

function approvalCommandFromText(text: string): TelegramApprovalCommand | null {
  const normalized = normalizeSearchText(text);
  if (/\b(refuse|refuser|rejette|reject|cancel|annule|annuler|bloque|bloquer)\b/.test(normalized)) return 'reject';
  if (/\b(approve|approved|approuve|approuver|valide|valider|validation|execute|executer|go|tu as la validation|you have the validation|ok execute)\b/.test(normalized)) return 'approve';
  return null;
}

function approvalPayloadMatchesTelegram(payload: Record<string, unknown>, chatId: TelegramId | null, senderId: TelegramId | null): boolean {
  const payloadChatId = asString(payload.chat_id);
  const payloadSenderId = asString(payload.sender_id);
  if (chatId && payloadChatId && payloadChatId === chatId) return true;
  if (senderId && payloadSenderId && payloadSenderId === senderId) return true;
  return false;
}

function textMentionsRecord(text: string, approval: PendingTelegramApproval): boolean {
  const normalized = normalizeSearchText(text);
  const identifiers = [approval.id, approval.taskId, approval.runId]
    .filter((value): value is string => Boolean(value))
    .flatMap((value) => [value, value.slice(0, 8)]);
  return identifiers.some((identifier) => normalized.includes(normalizeSearchText(identifier)));
}

async function findPendingTelegramApproval(input: {
  organizationId: string;
  chatId: TelegramId | null;
  senderId: TelegramId | null;
  text: string;
}): Promise<{ approval: PendingTelegramApproval | null; ambiguous: PendingTelegramApproval[] }> {
  const { data, error } = await supabase
    .from('agent_approvals')
    .select('id,task_id,run_id,action_type,risk_level,request_payload,created_at')
    .eq('organization_id', input.organizationId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error) throw new Error(`findPendingTelegramApproval: ${error.message}`);

  const matching = (data ?? [])
    .map((row) => {
      const record = asRecord(row) ?? {};
      return {
        id: String(record.id ?? ''),
        taskId: asString(record.task_id),
        runId: asString(record.run_id),
        actionType: asString(record.action_type) ?? 'unknown_action',
        riskLevel: asString(record.risk_level) ?? 'medium',
        requestPayload: asRecord(record.request_payload) ?? {},
        createdAt: String(record.created_at ?? ''),
      } satisfies PendingTelegramApproval;
    })
    .filter((approval) => approval.id && approvalPayloadMatchesTelegram(approval.requestPayload, input.chatId, input.senderId));

  if (matching.length === 0) return { approval: null, ambiguous: [] };

  const explicitMatch = matching.find((approval) => textMentionsRecord(input.text, approval));
  if (explicitMatch) return { approval: explicitMatch, ambiguous: [] };

  return { approval: matching[0] ?? null, ambiguous: [] };
}

function approvalSummaryForReply(approval: PendingTelegramApproval): string {
  return cleanText(approval.requestPayload.proposed_summary, 700)
    ?? cleanText(approval.requestPayload.requested_text, 700)
    ?? cleanText(approval.requestPayload.task_title, 700)
    ?? approval.actionType;
}

function approvalExecutionReply(input: {
  approval: PendingTelegramApproval;
  automationRunId: string | null;
  processResult: AgentWorkflowProcessResult | null;
}): string {
  const processResult = input.processResult;
  const statusLine = processResult
    ? processResult.completed > 0
      ? 'Execution completed in Lucid OS.'
      : processResult.paused > 0
        ? 'Execution started, but one or more tools still need a human/manual executor.'
        : processResult.failed > 0
          ? 'Execution was attempted but failed. Check Lucid OS for the exact error.'
          : 'Execution has been queued in Lucid OS.'
    : 'Execution has been queued in Lucid OS.';

  return [
    'Validation received. I am executing the pending Lucid OS task now.',
    `Task: ${approvalSummaryForReply(input.approval)}`,
    input.automationRunId ? `Workflow run: ${input.automationRunId.slice(0, 8)}.` : null,
    statusLine,
  ].filter(Boolean).join('\n');
}

function approvalRejectedReply(approval: PendingTelegramApproval): string {
  return [
    'Validation rejected. I cancelled the pending Lucid OS task.',
    `Task: ${approvalSummaryForReply(approval)}`,
  ].join('\n');
}

async function safeRows<T>(query: PromiseLike<{ data: T[] | null; error: { message?: string } | null }>): Promise<T[]> {
  const { data, error } = await query;
  if (error) return [];
  return data ?? [];
}

function formatKnowledgeRow(value: unknown): string | null {
  const row = asRecord(value);
  if (!row) return null;
  const client = asRecord(row.client);
  const project = asRecord(row.project);
  const scope = [asString(client?.name), asString(project?.name)].filter(Boolean).join(' / ');
  const body = cleanText(asString(row.summary) ?? asString(row.content), 700);
  if (!body) return null;
  const sourceSystem = asString(row.source_system);
  const sourceUri = asString(row.source_uri)?.replace(/^obsidian:\/\//, '');
  const source = sourceSystem && sourceUri ? ` [${sourceSystem}:${sourceUri}]` : '';
  return `- ${asString(row.title) ?? 'Knowledge'}${scope ? ` (${scope})` : ''}${source}: ${body}`;
}

const CONTEXT_STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'from', 'that', 'this', 'what', 'when', 'where', 'why', 'how', 'who', 'does', 'dans', 'avec', 'pour', 'quoi', 'qui', 'que', 'quel', 'quelle', 'quels', 'quelles', 'comment', 'pourquoi', 'est', 'une', 'des', 'les', 'aux', 'sur', 'par', 'pas', 'plus', 'lucid', 'lab', 'lucidlab',
]);

function contextTokens(text: string): string[] {
  return Array.from(new Set(
    normalizeSearchText(text)
      .split(' ')
      .map((token) => token.trim())
      .filter((token) => token.length >= 3 && !CONTEXT_STOP_WORDS.has(token)),
  )).slice(0, 18);
}

function scoreKnowledgeRow(value: unknown, tokens: string[]): number {
  const row = asRecord(value);
  if (!row || tokens.length === 0) return 0;
  const title = normalizeSearchText(asString(row.title) ?? '');
  const summary = normalizeSearchText(asString(row.summary) ?? '');
  const content = normalizeSearchText(asString(row.content) ?? '');
  const sourceUri = normalizeSearchText(asString(row.source_uri) ?? '');

  return tokens.reduce((score, token) => {
    let nextScore = score;
    if (title.includes(token)) nextScore += 8;
    if (summary.includes(token)) nextScore += 4;
    if (sourceUri.includes(token)) nextScore += 3;
    if (content.includes(token)) nextScore += 1;
    return nextScore;
  }, asString(row.source_system) === 'obsidian' ? 0.5 : 0);
}

function selectKnowledgeRows(rows: unknown[], query: string): unknown[] {
  const tokens = contextTokens(query);
  const scoredRows = rows
    .map((row, index) => ({ row, index, score: scoreKnowledgeRow(row, tokens) }))
    .sort((left, right) => right.score - left.score || left.index - right.index);
  const relevantRows = scoredRows.filter((item) => item.score > 0).slice(0, 8).map((item) => item.row);
  return relevantRows.length > 0 ? relevantRows : rows.slice(0, 10);
}

function formatClientRow(value: unknown): string | null {
  const row = asRecord(value);
  if (!row) return null;
  const parts = [
    `status ${asString(row.status) ?? 'unknown'}`,
    `stage ${asString(row.lifecycle_stage) ?? 'unknown'}`,
    asString(row.industry),
    asString(row.next_action) ? `next: ${asString(row.next_action)}` : null,
    asString(row.health_status) ? `health: ${asString(row.health_status)}` : null,
  ].filter(Boolean);
  return `- ${asString(row.name) ?? 'Client'}: ${parts.join('; ')}`;
}

function formatOpportunityRow(value: unknown): string | null {
  const row = asRecord(value);
  if (!row) return null;
  const client = asRecord(row.client);
  const parts = [
    asString(client?.name),
    asString(row.stage),
    asString(row.status),
    asString(row.offer_type),
    asString(row.next_step) ? `next: ${asString(row.next_step)}` : null,
  ].filter(Boolean);
  return `- ${asString(row.title) ?? 'Opportunity'}: ${parts.join('; ')}`;
}

function formatAgentTaskRow(value: unknown): string | null {
  const row = asRecord(value);
  if (!row) return null;
  const context = asRecord(row.context) ?? {};
  const resultSummary = asRecord(row.result_summary) ?? {};
  const parts = [
    `status ${asString(row.status) ?? 'unknown'}`,
    asString(context.intent) ? `intent ${asString(context.intent)}` : null,
    asString(context.approval_summary) ?? asString(row.description),
    asString(resultSummary.phase) ? `result ${asString(resultSummary.phase)}` : null,
  ].filter(Boolean);
  return `- Task ${String(row.id ?? '').slice(0, 8)} ${asString(row.title) ?? 'Untitled'}: ${parts.join('; ')}`;
}

function formatApprovalRow(value: unknown): string | null {
  const row = asRecord(value);
  if (!row) return null;
  const payload = asRecord(row.request_payload) ?? {};
  const summary = asString(payload.proposed_summary) ?? asString(payload.requested_text);
  return `- Approval ${String(row.id ?? '').slice(0, 8)} status ${asString(row.status) ?? 'unknown'} action ${asString(row.action_type) ?? 'unknown'}${summary ? `: ${cleanText(summary, 240)}` : ''}`;
}

function formatAutomationRunRow(value: unknown): string | null {
  const row = asRecord(value);
  if (!row) return null;
  const input = asRecord(row.input) ?? {};
  const summary = asRecord(row.summary) ?? {};
  const parts = [
    `status ${asString(row.status) ?? 'unknown'}`,
    asString(input.action_type),
    asString(summary.stage),
    Array.isArray(summary.completed_tools) ? `completed ${summary.completed_tools.join(', ')}` : null,
    Array.isArray(summary.paused_tools) ? `paused ${summary.paused_tools.join(', ')}` : null,
  ].filter(Boolean);
  return `- Workflow ${String(row.id ?? '').slice(0, 8)}: ${parts.join('; ')}`;
}

function compactSection(title: string, rows: Array<string | null>, fallback: string): string {
  const content = rows.filter((row): row is string => Boolean(row)).join('\n');
  return `## ${title}\n${content || fallback}`;
}

async function loadBusinessContext(organizationId: string, queryText: string): Promise<string> {
  const [knowledgeRows, clientRows, opportunityRows, taskRows, approvalRows, automationRows] = await Promise.all([
    safeRows<unknown>(
      supabase
        .from('knowledge_documents')
        .select('title,summary,content,source_system,source_uri,updated_at,client:clients(name),project:projects(name)')
        .eq('organization_id', organizationId)
        .eq('status', 'active')
        .order('freshness_at', { ascending: false, nullsFirst: false })
        .limit(80),
    ),
    safeRows<unknown>(
      supabase
        .from('clients')
        .select('name,status,lifecycle_stage,health_status,next_action,industry,website_url,primary_contact_name,updated_at')
        .eq('organization_id', organizationId)
        .order('updated_at', { ascending: false })
        .limit(12),
    ),
    safeRows<unknown>(
      supabase
        .from('client_opportunities')
        .select('title,stage,status,offer_type,next_step,updated_at,client:clients(name)')
        .eq('organization_id', organizationId)
        .neq('status', 'archived')
        .order('updated_at', { ascending: false })
        .limit(10),
    ),
    safeRows<unknown>(
      supabase
        .from('agent_tasks')
        .select('id,title,description,status,priority,context,result_summary,created_at,updated_at')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(12),
    ),
    safeRows<unknown>(
      supabase
        .from('agent_approvals')
        .select('id,action_type,status,risk_level,request_payload,created_at')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(10),
    ),
    safeRows<unknown>(
      supabase
        .from('automation_runs')
        .select('id,workflow_key,run_type,status,input,summary,error_message,created_at,updated_at')
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false })
        .limit(10),
    ),
  ]);

  const selectedKnowledgeRows = selectKnowledgeRows(knowledgeRows, queryText);

  return [
    compactSection('Runtime knowledge', selectedKnowledgeRows.map(formatKnowledgeRow), 'No active knowledge documents available.'),
    compactSection('CRM clients', clientRows.map(formatClientRow), 'No clients available.'),
    compactSection('CRM opportunities', opportunityRows.map(formatOpportunityRow), 'No opportunities available.'),
    compactSection('COO task memory', taskRows.map(formatAgentTaskRow), 'No recent COO tasks.'),
    compactSection('COO approvals', approvalRows.map(formatApprovalRow), 'No recent approvals.'),
    compactSection('COO durable executions', automationRows.map(formatAutomationRunRow), 'No recent durable executions.'),
  ].join('\n\n').slice(0, 12000);
}

function parseJsonObject(value: string | null): unknown {
  if (!value) return null;
  const trimmed = value.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]?.trim();
  const candidate = fenced ?? trimmed;
  const objectMatch = candidate.match(/\{[\s\S]*\}/);
  return JSON.parse(objectMatch?.[0] ?? candidate);
}

function normalizeDecision(value: z.infer<typeof cooDecisionSchema>, fallbackIntent: CooTelegramIntent, text: string): CooDecision {
  const mode = value.mode;
  // If the model returned 'unclear' (possibly because .catch() coerced a bad intent value), use the regex-based fallback.
  const intent = (value.intent === 'unclear' ? fallbackIntent : value.intent) ?? fallbackIntent;
  const confidence = typeof value.confidence === 'number' ? value.confidence : 0.6;
  const routedTo = cleanText(value.routedTo, 120) ?? specialistForIntent(intent);
  const rawReplyText = cleanText(value.replyText, 3200);
  const replyText = rawReplyText
    ?? (mode === 'answer' ? 'I do not have enough Lucid OS context to answer that reliably yet.' : null)
    ?? (mode === 'clarify' ? 'What should I do with this in Lucid OS?' : null);
  const taskDescription = cleanText(value.taskDescription, 1400) ?? text;
  const approvalSummary = cleanText(value.approvalSummary, 1200) ?? taskDescription;
  const requiresApproval = mode === 'action';

  if (mode === 'action' && confidence < 0.55) {
    return {
      mode: 'clarify',
      intent: 'unclear',
      confidence,
      replyText: replyText ?? 'I need one detail before I create work in Lucid OS: what outcome do you want me to prepare or update?',
      taskTitle: null,
      taskDescription: null,
      approvalSummary: null,
      routedTo: 'COO Agent',
      riskLevel: 'low',
      requiresApproval: false,
    };
  }

  return {
    mode,
    intent,
    confidence,
    replyText,
    taskTitle: cleanText(value.taskTitle, 180) ?? taskTitle(intent, text),
    taskDescription,
    approvalSummary,
    routedTo,
    riskLevel: value.riskLevel ?? (intent === 'incident_ops' ? 'medium' : 'low'),
    requiresApproval,
  };
}

function fallbackDecision(text: string, error: string | null = null): CooDecision {
  const intent = classifyIntent(text);
  const mode = fallbackModeForText(text, intent);

  if (mode === 'help') {
    return {
      mode,
      intent: 'help',
      confidence: 1,
      replyText: helpReply(),
      taskTitle: null,
      taskDescription: null,
      approvalSummary: null,
      routedTo: 'COO Agent',
      riskLevel: 'low',
      requiresApproval: false,
    };
  }

  if (mode === 'answer') {
    return {
      mode,
      intent,
      confidence: 0.35,
      replyText: error
        ? `I cannot answer this reliably yet because the smart COO model is unavailable (${error}). I did not create a task.`
        : 'I need the smart COO model to answer that from Lucid OS knowledge. I did not create a task.',
      taskTitle: null,
      taskDescription: null,
      approvalSummary: null,
      routedTo: 'COO Agent',
      riskLevel: 'low',
      requiresApproval: false,
    };
  }

  if (mode === 'clarify') {
    return {
      mode,
      intent: 'unclear',
      confidence: 0.45,
      replyText: 'What should I do with this in Lucid OS: answer a question, create a task, update CRM, or prepare a document?',
      taskTitle: null,
      taskDescription: null,
      approvalSummary: null,
      routedTo: 'COO Agent',
      riskLevel: 'low',
      requiresApproval: false,
    };
  }

  if (mode === 'ignore') {
    return {
      mode,
      intent: 'small_talk',
      confidence: 0.8,
      replyText: null,
      taskTitle: null,
      taskDescription: null,
      approvalSummary: null,
      routedTo: 'COO Agent',
      riskLevel: 'low',
      requiresApproval: false,
    };
  }

  return {
    mode: 'action',
    intent,
    confidence: 0.5,
    replyText: null,
    taskTitle: taskTitle(intent, text),
    taskDescription: text,
    approvalSummary: `Proposed Lucid OS action: ${text}`,
    routedTo: specialistForIntent(intent),
    riskLevel: intent === 'incident_ops' ? 'medium' : 'low',
    requiresApproval: true,
  };
}

async function decideCooResponse(input: { organizationId: string; text: string; senderName: string | null; chatType: string | null }): Promise<CooDecision> {
  const fallbackIntent = classifyIntent(input.text);
  if (!providerKeyConfigured()) return fallbackDecision(input.text, `${config.aiProvider} key is not configured`);
  if (!(await aiBudgetAvailable())) return fallbackDecision(input.text, 'daily AI budget exceeded');

  try {
    const businessContext = await loadBusinessContext(input.organizationId, input.text);
    const provider = getAIProvider();
    const response = await provider.chat([
      {
        role: 'system',
        content: [
          'You are the Lucid OS COO Agent for Lucid-Lab, an agency that sells websites, AI agents, automations, lead generation systems, marketing workflows, and operational AI systems.',
          'You answer in Telegram for trusted internal team members only.',
          'Your first job is intent discipline: do not create work for questions, thanks, chatter, or ambiguous messages.',
          'Modes:',
          '- answer: the user asked a business/CRM/operations question. Answer directly from the provided Lucid OS context. If the context is insufficient, say what is missing and do not invent facts.',
          '- action: the user clearly wants Lucid OS to do or prepare work. Summarize what you would do and require approval before any business mutation, delegation, document send, outreach, deployment, provider change, or external side effect.',
          '- clarify: the message is ambiguous. Ask one short clarifying question.',
          '- ignore: the message is just acknowledgement/small talk and needs no reply or task.',
          '- help: the user asked for help/start.',
          'Telegram action requests should create a proposed task and approval, not execute the work directly. Internal web-app CRM controls can update state separately.',
          'For action mode, reason against this Lucid OS tool registry. The app will attach proposed tool names and approval gates after your decision:',
          toolCatalogForPrompt(),
          'Match the user language. Keep Telegram replies short and operational.',
          'Return ONLY valid JSON — no markdown, no prose outside the object. Required keys and valid values:',
          '  mode: one of answer|action|clarify|ignore|help',
          '  intent: MUST be exactly one of these strings — business_question|finance_document|crm_or_sales|meeting_ops|incident_ops|help|general_ops|small_talk|unclear — never a sentence or description',
          '  confidence: number 0–1',
          '  replyText: string or null',
          '  taskTitle: string or null',
          '  taskDescription: string or null',
          '  approvalSummary: string or null',
          '  routedTo: string or null',
          '  riskLevel: one of low|medium|high|critical',
          '  requiresApproval: true or false',
          'For any company/business knowledge question (TVA, pricing, team, tech stack, clients, revenue, methodology): use mode=answer, intent=business_question.',
          'Example of a valid response: {"mode":"answer","intent":"business_question","confidence":0.9,"replyText":"...","taskTitle":null,"taskDescription":null,"approvalSummary":null,"routedTo":null,"riskLevel":"low","requiresApproval":false}',
        ].join('\n'),
      },
      {
        role: 'user',
        content: [
          `Sender: ${input.senderName ?? 'unknown'}`,
          `Chat type: ${input.chatType ?? 'unknown'}`,
          `Message:\n${input.text}`,
          '',
          'Lucid OS context:',
          businessContext,
        ].join('\n'),
      },
    ]);
    await recordUsageBestEffort(response.tokensUsed.total);

    const parsedJson = parseJsonObject(response.text);
    const parsed = cooDecisionSchema.safeParse(parsedJson);
    if (!parsed.success) return fallbackDecision(input.text, `invalid COO model response: ${parsed.error.message}`);
    return normalizeDecision(parsed.data, fallbackIntent, input.text);
  } catch (error) {
    return fallbackDecision(input.text, error instanceof Error ? error.message : 'COO model failed');
  }
}

async function getOrCreateCooAgentId(organizationId: string): Promise<string> {
  const { data, error } = await supabase
    .from('agents')
    .select('id,tools')
    .eq('organization_id', organizationId)
    .eq('slug', COO_AGENT_SLUG)
    .maybeSingle();

  if (error) throw new Error(`getOrCreateCooAgentId: ${error.message}`);

  const existing = data as { id?: string; tools?: string[] | null } | null;
  if (existing?.id) {
    const existingTools = Array.isArray(existing.tools) ? existing.tools : [];
    const hasCurrentTools = COO_AGENT_TOOL_NAMES.every((toolName) => existingTools.includes(toolName));
    if (!hasCurrentTools) {
      await supabase
        .from('agents')
        .update({ tools: Array.from(new Set([...existingTools, ...COO_AGENT_TOOL_NAMES])) })
        .eq('organization_id', organizationId)
        .eq('id', existing.id);
    }
    return existing.id;
  }

  const { data: inserted, error: insertError } = await supabase
    .from('agents')
    .insert({
      organization_id: organizationId,
      name: 'COO Agent',
      slug: COO_AGENT_SLUG,
      role: 'Routes operational requests from Telegram and Lucid OS to specialized agents, tools, tasks, and approvals.',
      status: 'active',
      provider_preference: config.aiProvider,
      model_preference: config.aiModel,
      prompt_version: PROMPT_VERSION,
      system_prompt_ref: 'src/lib/admin/agents/coo-agent.ts',
      tools: COO_AGENT_TOOL_NAMES,
      approval_policy: 'human_for_side_effects',
      memory_scope: 'organization',
      config: {
        source_module: 'src/lib/admin/agents/coo-agent.ts',
        telegram_access: 'allowlist',
        side_effects: 'approval_required',
      },
    })
    .select('id')
    .single();

  if (insertError) throw new Error(`createCooAgentId: ${insertError.message}`);

  const created = inserted as { id?: string } | null;
  if (!created?.id) throw new Error('createCooAgentId: missing inserted id');
  return created.id;
}

async function createCooRun(input: {
  organizationId: string;
  agentId: string;
  decision: CooDecision;
  text: string;
  chatId: TelegramId | null;
  senderId: TelegramId | null;
  senderName: string | null;
  updateId: number | null;
  messageId: number | null;
}): Promise<string> {
  const now = new Date().toISOString();
  const tools = proposedToolNames(input.decision);
  const { data, error } = await supabase
    .from('agent_runs')
    .insert({
      organization_id: input.organizationId,
      agent_id: input.agentId,
      status: 'completed',
      trigger_source: 'telegram',
      model: config.aiModel,
      prompt_version: PROMPT_VERSION,
      input: {
        source: 'telegram',
        text: input.text,
        mode: input.decision.mode,
        intent: input.decision.intent,
        sender_id: input.senderId,
        sender_name: input.senderName,
        chat_id: input.chatId,
        update_id: input.updateId,
        message_id: input.messageId,
        proposed_tools: tools,
      },
      output_summary: {
        mode: input.decision.mode,
        confidence: input.decision.confidence,
        routed_to: input.decision.routedTo ?? specialistForIntent(input.decision.intent),
        execution_mode: input.decision.mode === 'action' ? 'approval_requested_no_external_side_effects' : 'answered_or_clarified_no_task_created',
        reply_preview: input.decision.replyText?.slice(0, 240) ?? null,
        approval_required: input.decision.requiresApproval,
        proposed_tools: tools,
        governed_risk_level: governedRiskLevel(input.decision),
      },
      started_at: now,
      finished_at: now,
    })
    .select('id')
    .single();

  if (error) throw new Error(`createCooRun: ${error.message}`);

  const row = data as { id?: string } | null;
  if (!row?.id) throw new Error('createCooRun: missing inserted id');
  return row.id;
}

async function createCooTask(input: {
  organizationId: string;
  agentId: string;
  runId: string;
  decision: CooDecision;
  text: string;
  chatId: TelegramId | null;
  senderId: TelegramId | null;
  senderName: string | null;
}): Promise<string | null> {
  if (input.decision.mode !== 'action') return null;
  const tools = proposedToolNames(input.decision);

  const { data, error } = await supabase
    .from('agent_tasks')
    .insert({
      organization_id: input.organizationId,
      agent_id: input.agentId,
      assigned_to_agent_id: input.agentId,
      title: input.decision.taskTitle ?? taskTitle(input.decision.intent, input.text),
      description: input.decision.taskDescription ?? input.text,
      status: input.decision.requiresApproval ? 'waiting_approval' : 'ready',
      priority: priorityForIntent(input.decision.intent),
      context: {
        source: 'telegram',
        run_id: input.runId,
        mode: input.decision.mode,
        intent: input.decision.intent,
        routed_to: input.decision.routedTo ?? specialistForIntent(input.decision.intent),
        proposed_tools: tools,
        governed_risk_level: governedRiskLevel(input.decision),
        sender_id: input.senderId,
        sender_name: input.senderName,
        chat_id: input.chatId,
        approval_summary: input.decision.approvalSummary,
        approval_required: input.decision.requiresApproval,
        external_side_effects_allowed: false,
      },
    })
    .select('id')
    .single();

  if (error) throw new Error(`createCooTask: ${error.message}`);

  const row = data as { id?: string } | null;
  return row?.id ?? null;
}

async function createCooApproval(input: {
  organizationId: string;
  agentId: string;
  runId: string;
  taskId: string | null;
  decision: CooDecision;
  text: string;
  chatId: TelegramId | null;
  senderId: TelegramId | null;
  senderName: string | null;
}): Promise<string | null> {
  if (input.decision.mode !== 'action' || !input.decision.requiresApproval) return null;

  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const tools = proposedToolNames(input.decision);
  const riskLevel = governedRiskLevel(input.decision);
  const { data, error } = await supabase
    .from('agent_approvals')
    .insert({
      organization_id: input.organizationId,
      agent_id: input.agentId,
      run_id: input.runId,
      task_id: input.taskId,
      action_type: approvalActionType(input.decision),
      status: 'pending',
      risk_level: riskLevel,
      requested_by_agent: true,
      request_payload: {
        source: 'telegram',
        mode: input.decision.mode,
        intent: input.decision.intent,
        requested_text: input.text,
        proposed_summary: input.decision.approvalSummary,
        task_title: input.decision.taskTitle,
        routed_to: input.decision.routedTo,
        proposed_tools: tools,
        governed_risk_level: riskLevel,
        sender_id: input.senderId,
        sender_name: input.senderName,
        chat_id: input.chatId,
        external_side_effects_allowed: false,
      },
      expires_at: expiresAt,
    })
    .select('id')
    .single();

  if (error) throw new Error(`createCooApproval: ${error.message}`);

  const row = data as { id?: string } | null;
  return row?.id ?? null;
}

export async function handleCooTelegramUpdate(update: TelegramUpdate): Promise<CooTelegramDispatchResult> {
  const message = extractMessage(update);
  const chatId = telegramId(message?.chat?.id);
  const senderId = telegramId(message?.from?.id);
  const senderName = telegramDisplayName(message?.from);

  if (!message) {
    return {
      processed: false,
      authorized: false,
      chatId,
      senderId,
      replyText: null,
      runId: null,
      taskId: null,
      approvalId: null,
      reason: 'unsupported_update',
    };
  }

  const text = extractMessageText(message);
  if (!text) {
    return {
      processed: false,
      authorized: false,
      chatId,
      senderId,
      replyText: null,
      runId: null,
      taskId: null,
      approvalId: null,
      reason: 'empty_message',
    };
  }

  assertSupabaseServiceRoleConfigured();

  const authorized = isAuthorized(senderId, chatId);
  if (!authorized) {
    await recordLucidAuditEvent({
      eventType: 'telegram_coo_access_denied',
      actorType: 'integration',
      riskLevel: 'medium',
      summary: 'Rejected Telegram COO message from unauthorized sender or chat.',
      details: {
        sender_id: senderId,
        sender_name: senderName,
        chat_id: chatId,
        chat_type: message.chat?.type ?? null,
        update_id: update.update_id ?? null,
        message_id: message.message_id ?? null,
        message_preview: text.slice(0, 240),
      },
    });

    return {
      processed: true,
      authorized: false,
      chatId,
      senderId,
      replyText: accessDeniedReply(senderId, chatId),
      runId: null,
      taskId: null,
      approvalId: null,
      reason: 'access_denied',
    };
  }

  const organizationId = await ensureLucidOrganizationId();
  const agentId = await getOrCreateCooAgentId(organizationId);
  const approvalCommand = approvalCommandFromText(text);
  if (approvalCommand) {
    const { approval, ambiguous } = await findPendingTelegramApproval({ organizationId, chatId, senderId, text });

    if (!approval) {
      return {
        processed: true,
        authorized: true,
        chatId,
        senderId,
        replyText: 'I do not see a pending Lucid OS approval linked to this Telegram chat. Use the task/approval short ID if you want me to target a specific item.',
        runId: null,
        taskId: null,
        approvalId: null,
        reason: 'approval_not_found',
      };
    }

    if (ambiguous.length > 0) {
      return {
        processed: true,
        authorized: true,
        chatId,
        senderId,
        replyText: `I found several pending approvals. Reply with the short task or approval ID. Latest: ${ambiguous.slice(0, 3).map((item) => `${item.taskId?.slice(0, 8) ?? item.id.slice(0, 8)} ${approvalSummaryForReply(item).slice(0, 80)}`).join(' / ')}`,
        runId: null,
        taskId: null,
        approvalId: null,
        reason: 'approval_ambiguous',
      };
    }

    if (approvalCommand === 'reject') {
      await rejectAgentApproval({ approvalId: approval.id, actorLabel: senderName ?? senderId ?? 'telegram_coo', decisionNotes: text });
      await recordLucidAuditEvent({
        eventType: 'telegram_coo_approval_rejected',
        actorType: 'integration',
        actorId: senderId,
        targetTable: 'agent_approvals',
        targetId: approval.id,
        riskLevel: governedRiskLevel({ mode: 'action', intent: 'general_ops', confidence: 1, replyText: null, taskTitle: null, taskDescription: null, approvalSummary: null, routedTo: null, riskLevel: 'medium', requiresApproval: true }),
        summary: 'Telegram COO approval rejected by follow-up message.',
        details: { approval_id: approval.id, task_id: approval.taskId, message_preview: text.slice(0, 240) },
      });

      return {
        processed: true,
        authorized: true,
        chatId,
        senderId,
        replyText: approvalRejectedReply(approval),
        runId: approval.runId,
        taskId: approval.taskId,
        approvalId: approval.id,
        reason: 'approval_rejected',
      };
    }

    const approvalResult = await approveAgentApprovalAndEnqueue({ approvalId: approval.id, actorLabel: senderName ?? senderId ?? 'telegram_coo', decisionNotes: text });
    const processResult = approvalResult.automationRunId ? await processAgentWorkflowRunById(approvalResult.automationRunId) : null;
    await recordLucidAuditEvent({
      eventType: 'telegram_coo_approval_executed',
      actorType: 'integration',
      actorId: senderId,
      targetTable: approvalResult.automationRunId ? 'automation_runs' : 'agent_approvals',
      targetId: approvalResult.automationRunId ?? approval.id,
      riskLevel: governedRiskLevel({ mode: 'action', intent: 'general_ops', confidence: 1, replyText: null, taskTitle: null, taskDescription: null, approvalSummary: null, routedTo: null, riskLevel: 'medium', requiresApproval: true }),
      summary: 'Telegram COO approval executed by follow-up message.',
      details: {
        approval_id: approval.id,
        task_id: approval.taskId,
        automation_run_id: approvalResult.automationRunId,
        process_result: processResult,
        message_preview: text.slice(0, 240),
      },
    });

    return {
      processed: true,
      authorized: true,
      chatId,
      senderId,
      replyText: approvalExecutionReply({ approval, automationRunId: approvalResult.automationRunId, processResult }),
      runId: approval.runId,
      taskId: approval.taskId,
      approvalId: approval.id,
      reason: 'approval_executed',
    };
  }

  const decision = await decideCooResponse({
    organizationId,
    text,
    senderName,
    chatType: message.chat?.type ?? null,
  });
  const runId = await createCooRun({
    organizationId,
    agentId,
    decision,
    text,
    chatId,
    senderId,
    senderName,
    updateId: update.update_id ?? null,
    messageId: message.message_id ?? null,
  });
  const taskId = await createCooTask({
    organizationId,
    agentId,
    runId,
    decision,
    text,
    chatId,
    senderId,
    senderName,
  });
  const approvalId = await createCooApproval({
    organizationId,
    agentId,
    runId,
    taskId,
    decision,
    text,
    chatId,
    senderId,
    senderName,
  });

  const auditEventType: Record<CooTelegramMode, string> = {
    answer: 'telegram_coo_question_answered',
    action: 'telegram_coo_action_proposed',
    clarify: 'telegram_coo_clarification_requested',
    help: 'telegram_coo_help_requested',
    ignore: 'telegram_coo_message_ignored',
  };

  await recordLucidAuditEvent({
    eventType: auditEventType[decision.mode],
    actorType: 'integration',
    actorId: senderId,
    targetTable: approvalId ? 'agent_approvals' : taskId ? 'agent_tasks' : 'agent_runs',
    targetId: approvalId ?? taskId ?? runId,
    riskLevel: governedRiskLevel(decision),
    summary: decision.mode === 'action'
      ? `Telegram COO action proposed for ${decision.routedTo ?? specialistForIntent(decision.intent)}.`
      : `Telegram COO message handled in ${decision.mode} mode.`,
    details: {
      mode: decision.mode,
      intent: decision.intent,
      confidence: decision.confidence,
      run_id: runId,
      task_id: taskId,
      approval_id: approvalId,
      sender_id: senderId,
      sender_name: senderName,
      chat_id: chatId,
      chat_type: message.chat?.type ?? null,
      update_id: update.update_id ?? null,
      message_id: message.message_id ?? null,
      message_preview: text.slice(0, 240),
      routed_to: decision.routedTo,
      proposed_tools: proposedToolNames(decision),
      governed_risk_level: governedRiskLevel(decision),
      approval_required: decision.requiresApproval,
      external_side_effects_allowed: false,
    },
  });

  return {
    processed: true,
    authorized: true,
    chatId,
    senderId,
    replyText: replyForDecision(decision, runId, taskId, approvalId),
    runId,
    taskId,
    approvalId,
    reason: decision.mode,
  };
}

export async function sendTelegramCooMessage(chatId: TelegramId, text: string): Promise<TelegramSendResult> {
  if (!config.telegramCooBotToken) {
    return { ok: false, error: 'TELEGRAM_COO_BOT_TOKEN is not configured' };
  }

  const response = await fetch(`https://api.telegram.org/bot${config.telegramCooBotToken}/sendMessage`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
  });

  if (!response.ok) {
    const responseText = await response.text().catch(() => '');
    return { ok: false, error: responseText || `Telegram sendMessage failed with ${response.status}` };
  }

  return { ok: true, error: null };
}