import 'server-only';

import { assertSupabaseServiceRoleConfigured, supabase } from '@/lib/bot/db/supabase';
import { ensureLucidOrganizationId, recordLucidAuditEvent } from '@/lib/admin/lucid-os';
import { getAgentToolDefinition } from './tool-registry';

type UnknownRecord = Record<string, unknown>;
type AutomationRunStatus = 'queued' | 'running' | 'completed' | 'completed_with_errors' | 'failed' | 'cancelled' | 'paused';
type ToolCallStatus = 'queued' | 'running' | 'completed' | 'failed' | 'cancelled';
type AuditRiskLevel = 'low' | 'medium' | 'high' | 'critical';
type ClientLifecycleStage = 'lead' | 'qualified' | 'meeting_booked' | 'discovery_done' | 'proposal_needed' | 'proposal_sent' | 'negotiation' | 'won' | 'lost' | 'onboarding' | 'in_delivery' | 'live_managed' | 'success_retention' | 'expansion_opportunity' | 'archived';
type OpportunityStage = 'new' | 'qualified' | 'discovery' | 'proposal_needed' | 'proposal_sent' | 'negotiation' | 'won' | 'lost' | 'paused';

interface AgentApprovalRecord {
  id: string;
  organizationId: string;
  clientId: string | null;
  projectId: string | null;
  agentId: string | null;
  runId: string | null;
  taskId: string | null;
  actionType: string;
  status: string;
  riskLevel: string;
  requestPayload: UnknownRecord;
}

interface AutomationRunRecord {
  id: string;
  organizationId: string;
  clientId: string | null;
  projectId: string | null;
  agentId: string | null;
  workflowKey: string;
  runType: string;
  status: AutomationRunStatus;
  input: UnknownRecord;
  summary: UnknownRecord;
}

export interface ApprovalDecisionResult {
  approvalId: string;
  automationRunId: string | null;
  status: 'approved' | 'rejected';
}

export interface AgentWorkflowProcessResult {
  scanned: number;
  completed: number;
  paused: number;
  failed: number;
  toolCallsCreated: number;
  runIds: string[];
}

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as UnknownRecord : null;
}

function asString(value: unknown): string | null {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map(asString).filter((item): item is string => Boolean(item));
}

function asAuditRiskLevel(value: unknown): AuditRiskLevel {
  return value === 'low' || value === 'medium' || value === 'high' || value === 'critical' ? value : 'medium';
}

function normalizeForMatch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function matchTokens(value: string): string[] {
  return normalizeForMatch(value).split(' ').filter((token) => token.length > 2);
}

function cleanExtractedPhrase(value: string | null): string | null {
  if (!value) return null;
  const cleaned = value
    .replace(/["“”]/g, '')
    .replace(/\s+/g, ' ')
    .replace(/^(un|une|le|la|l')\s+/i, '')
    .replace(/[.,;:]+$/g, '')
    .trim();

  if (cleaned.length < 3) return null;
  return `${cleaned[0]?.toUpperCase() ?? ''}${cleaned.slice(1)}`.slice(0, 120);
}

function approvalFromRow(value: unknown): AgentApprovalRecord | null {
  const record = asRecord(value);
  if (!record?.id || !record.organization_id) return null;

  return {
    id: String(record.id),
    organizationId: String(record.organization_id),
    clientId: asString(record.client_id),
    projectId: asString(record.project_id),
    agentId: asString(record.agent_id),
    runId: asString(record.run_id),
    taskId: asString(record.task_id),
    actionType: asString(record.action_type) ?? 'unknown_action',
    status: asString(record.status) ?? 'pending',
    riskLevel: asString(record.risk_level) ?? 'medium',
    requestPayload: asRecord(record.request_payload) ?? {},
  };
}

function automationRunFromRow(value: unknown): AutomationRunRecord | null {
  const record = asRecord(value);
  if (!record?.id || !record.organization_id) return null;

  return {
    id: String(record.id),
    organizationId: String(record.organization_id),
    clientId: asString(record.client_id),
    projectId: asString(record.project_id),
    agentId: asString(record.agent_id),
    workflowKey: asString(record.workflow_key) ?? 'agent.approval.execute',
    runType: asString(record.run_type) ?? 'approval_execution',
    status: (asString(record.status) ?? 'queued') as AutomationRunStatus,
    input: asRecord(record.input) ?? {},
    summary: asRecord(record.summary) ?? {},
  };
}

function proposedToolsFromApproval(approval: AgentApprovalRecord): string[] {
  return asStringArray(approval.requestPayload.proposed_tools);
}

function requestTextFromRun(run: AutomationRunRecord): string {
  const requestPayload = asRecord(run.input.request_payload) ?? {};
  return [
    asString(requestPayload.requested_text),
    asString(requestPayload.proposed_summary),
    asString(requestPayload.task_title),
    asString(run.input.action_type),
  ].filter(Boolean).join('\n');
}

function inferIndustry(text: string): string | null {
  const compact = text.replace(/\s+/g, ' ').trim();
  const patterns = [
    /activit[ée]\s+(?:de|du|d'|d’)?[^.,;:]{0,90}?\s+en\s+(.+?)(?:\s+et\s+(?:les|la|le|l'|l’)|[,.;:]|$)/i,
    /secteur\s+(?:de|du|d'|d’)?[^.,;:]{0,90}?\s+en\s+(.+?)(?:\s+et\s+(?:les|la|le|l'|l’)|[,.;:]|$)/i,
    /m[ée]tier\s+(?:de|du|d'|d’)?[^.,;:]{0,90}?\s+en\s+(.+?)(?:\s+et\s+(?:les|la|le|l'|l’)|[,.;:]|$)/i,
  ];

  for (const pattern of patterns) {
    const match = compact.match(pattern)?.[1];
    const cleaned = cleanExtractedPhrase(match ?? null);
    if (cleaned) return cleaned;
  }

  return null;
}

function inferLifecycleStage(text: string): ClientLifecycleStage | null {
  const normalized = normalizeForMatch(text);
  if (/\b(signe|signature|signed|accepte|valide|won)\b/.test(normalized)) return 'won';
  if (/\b(proposition|propositions|devis|bdc|bon de commande|contrat|contrats)\b/.test(normalized) && /\b(envoye|envoyes|envoyee|sent|send)\b/.test(normalized)) return 'proposal_sent';
  if (/\b(proposition|devis|bdc|bon de commande|contrat)\b/.test(normalized)) return 'proposal_needed';
  if (/\b(rdv fait|meeting done|decouverte faite|discovery done)\b/.test(normalized)) return 'discovery_done';
  return null;
}

function lifecycleToOpportunityStage(stage: ClientLifecycleStage | null): OpportunityStage | null {
  switch (stage) {
    case 'qualified': return 'qualified';
    case 'discovery_done': return 'discovery';
    case 'proposal_needed': return 'proposal_needed';
    case 'proposal_sent': return 'proposal_sent';
    case 'negotiation': return 'negotiation';
    case 'won': return 'won';
    case 'lost': return 'lost';
    default: return null;
  }
}

function nextActionForStage(stage: ClientLifecycleStage | null): string | null {
  switch (stage) {
    case 'proposal_sent': return 'Suivre le retour client sur les propositions, BDC et contrats envoyés.';
    case 'proposal_needed': return 'Préparer ou finaliser la proposition commerciale.';
    case 'won': return 'Lancer l’onboarding et la livraison.';
    default: return null;
  }
}

function optionalToolIsNotRequired(run: AutomationRunRecord, toolName: string): boolean {
  const normalized = normalizeForMatch(requestTextFromRun(run));
  if (toolName === 'outreach.email_send') {
    return !/\b(email|mail|outreach|prospection|relance|envoie|envoyer|send|sent)\b/.test(normalized);
  }
  return false;
}

async function findBestClientForText(organizationId: string, text: string): Promise<UnknownRecord | null> {
  const { data, error } = await supabase
    .from('clients')
    .select('id,name,slug,industry,lifecycle_stage,status,metadata')
    .eq('organization_id', organizationId)
    .order('updated_at', { ascending: false })
    .limit(200);

  if (error) throw new Error(`findBestClientForText: ${error.message}`);

  const textTokens = new Set(matchTokens(text));
  let best: { score: number; client: UnknownRecord } | null = null;

  for (const row of data ?? []) {
    const client = asRecord(row);
    const name = asString(client?.name);
    if (!client || !name) continue;
    const tokens = matchTokens(name);
    const score = tokens.reduce((count, token) => count + (textTokens.has(token) ? 1 : 0), 0);
    if (score > (best?.score ?? 0)) best = { score, client };
  }

  return best && best.score > 0 ? best.client : null;
}

async function updateLatestOpenOpportunity(input: {
  organizationId: string;
  clientId: string;
  stage: OpportunityStage | null;
  nextAction: string | null;
}): Promise<string | null> {
  if (!input.stage) return null;

  const { data: opportunityRows, error: selectError } = await supabase
    .from('client_opportunities')
    .select('id')
    .eq('organization_id', input.organizationId)
    .eq('client_id', input.clientId)
    .neq('status', 'archived')
    .order('updated_at', { ascending: false })
    .limit(1);

  if (selectError) throw new Error(`updateLatestOpenOpportunity select: ${selectError.message}`);
  const opportunityId = asString(asRecord(opportunityRows?.[0])?.id);
  if (!opportunityId) return null;

  const { error } = await supabase
    .from('client_opportunities')
    .update({
      stage: input.stage,
      status: input.stage === 'won' ? 'won' : input.stage === 'lost' ? 'lost' : 'open',
      next_step: input.nextAction,
      updated_at: new Date().toISOString(),
    })
    .eq('organization_id', input.organizationId)
    .eq('id', opportunityId);

  if (error) throw new Error(`updateLatestOpenOpportunity update: ${error.message}`);
  return opportunityId;
}

async function executeCrmClientWrite(run: AutomationRunRecord): Promise<UnknownRecord> {
  const requestText = requestTextFromRun(run);
  const client = await findBestClientForText(run.organizationId, requestText);
  const clientId = asString(client?.id);
  const clientName = asString(client?.name);
  if (!client || !clientId || !clientName) {
    throw new Error('No matching Lucid OS client found for the approved CRM update.');
  }

  const now = new Date().toISOString();
  const industry = inferIndustry(requestText);
  const lifecycleStage = inferLifecycleStage(requestText);
  const opportunityStage = lifecycleToOpportunityStage(lifecycleStage);
  const nextAction = nextActionForStage(lifecycleStage);
  const existingMetadata = asRecord(client.metadata) ?? {};
  const updates: UnknownRecord = {
    metadata: {
      ...existingMetadata,
      last_agent_crm_update: {
        source: 'agent_workflow_runner',
        automation_run_id: run.id,
        approved_at: now,
        request_preview: requestText.slice(0, 500),
      },
    },
    last_contacted_at: now,
    updated_at: now,
  };

  if (industry) updates.industry = industry;
  if (lifecycleStage) updates.lifecycle_stage = lifecycleStage;
  if (nextAction !== null) updates.next_action = nextAction;

  const { error: clientError } = await supabase
    .from('clients')
    .update(updates)
    .eq('organization_id', run.organizationId)
    .eq('id', clientId);

  if (clientError) throw new Error(`executeCrmClientWrite client update: ${clientError.message}`);

  const opportunityId = await updateLatestOpenOpportunity({
    organizationId: run.organizationId,
    clientId,
    stage: opportunityStage,
    nextAction,
  });

  const interactionSummary = lifecycleStage === 'proposal_sent'
    ? 'Documents commerciaux envoyés: propositions d’accompagnement, BDC et contrats.'
    : `Mise à jour CRM validée depuis Telegram: ${requestText.slice(0, 180)}`;

  const { data: interactionRow, error: interactionError } = await supabase
    .from('client_interactions')
    .insert({
      organization_id: run.organizationId,
      client_id: clientId,
      opportunity_id: opportunityId,
      interaction_type: 'decision',
      direction: 'internal',
      summary: interactionSummary,
      notes: requestText.slice(0, 2000),
      occurred_at: now,
      next_step: nextAction,
      sentiment: 'neutral',
      source_system: 'agent',
      source_uri: `automation_runs:${run.id}`,
      metadata: {
        automation_run_id: run.id,
        approval_id: asString(run.input.approval_id),
        extracted_industry: industry,
        extracted_lifecycle_stage: lifecycleStage,
      },
    })
    .select('id')
    .single();

  if (interactionError) throw new Error(`executeCrmClientWrite interaction: ${interactionError.message}`);
  const interactionId = asString(asRecord(interactionRow)?.id);

  await recordLucidAuditEvent({
    eventType: 'crm_agent_write_executed',
    actorType: 'automation',
    actorId: 'agent-workflow-worker',
    targetTable: 'clients',
    targetId: clientId,
    clientId,
    riskLevel: 'medium',
    summary: `Approved CRM update executed for ${clientName}.`,
    details: {
      automation_run_id: run.id,
      approval_id: asString(run.input.approval_id),
      industry,
      lifecycle_stage: lifecycleStage,
      opportunity_id: opportunityId,
      interaction_id: interactionId,
    },
  });

  return {
    execution: 'crm_client_write_executed',
    client_id: clientId,
    client_name: clientName,
    industry,
    lifecycle_stage: lifecycleStage,
    opportunity_stage: opportunityStage,
    opportunity_id: opportunityId,
    interaction_id: interactionId,
    next_action: nextAction,
  };
}

async function getApproval(organizationId: string, approvalId: string): Promise<AgentApprovalRecord> {
  const { data, error } = await supabase
    .from('agent_approvals')
    .select('id,organization_id,client_id,project_id,agent_id,run_id,task_id,action_type,status,risk_level,request_payload')
    .eq('organization_id', organizationId)
    .eq('id', approvalId)
    .maybeSingle();

  if (error) throw new Error(`getApproval: ${error.message}`);
  const approval = approvalFromRow(data);
  if (!approval) throw new Error('Approval not found.');
  return approval;
}

async function findAutomationRunByIdempotencyKey(organizationId: string, idempotencyKey: string): Promise<AutomationRunRecord | null> {
  const { data, error } = await supabase
    .from('automation_runs')
    .select('id,organization_id,client_id,project_id,agent_id,workflow_key,run_type,status,input,summary')
    .eq('organization_id', organizationId)
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle();

  if (error) throw new Error(`findAutomationRunByIdempotencyKey: ${error.message}`);
  return automationRunFromRow(data);
}

async function createAutomationRunForApproval(approval: AgentApprovalRecord, actorLabel: string): Promise<string> {
  const idempotencyKey = `agent-approval:${approval.id}`;
  const existing = await findAutomationRunByIdempotencyKey(approval.organizationId, idempotencyKey);
  if (existing) return existing.id;

  const proposedTools = proposedToolsFromApproval(approval);
  const { data, error } = await supabase
    .from('automation_runs')
    .insert({
      organization_id: approval.organizationId,
      client_id: approval.clientId,
      project_id: approval.projectId,
      agent_id: approval.agentId,
      workflow_key: 'agent.approval.execute',
      run_type: 'approval_execution',
      status: 'queued',
      idempotency_key: idempotencyKey,
      input: {
        approval_id: approval.id,
        source_run_id: approval.runId,
        task_id: approval.taskId,
        action_type: approval.actionType,
        risk_level: approval.riskLevel,
        request_payload: approval.requestPayload,
        proposed_tools: proposedTools,
        approved_by: actorLabel,
      },
      summary: {
        stage: 'queued_after_approval',
        proposed_tools: proposedTools,
        external_side_effects_allowed: false,
        note: 'Durable execution queued. Planned or side-effecting tools remain paused until their executor is implemented.',
      },
    })
    .select('id')
    .single();

  if (error) throw new Error(`createAutomationRunForApproval: ${error.message}`);
  const record = asRecord(data);
  const automationRunId = asString(record?.id);
  if (!automationRunId) throw new Error('createAutomationRunForApproval: missing inserted id');
  return automationRunId;
}

export async function approveAgentApprovalAndEnqueue(input: {
  approvalId: string;
  actorLabel?: string;
  decisionNotes?: string | null;
}): Promise<ApprovalDecisionResult> {
  assertSupabaseServiceRoleConfigured();

  const organizationId = await ensureLucidOrganizationId();
  const approval = await getApproval(organizationId, input.approvalId);
  const actorLabel = input.actorLabel ?? 'lucid_os_admin';

  if (approval.status !== 'pending' && approval.status !== 'approved') {
    throw new Error(`Approval is already ${approval.status}.`);
  }

  const automationRunId = await createAutomationRunForApproval(approval, actorLabel);
  const now = new Date().toISOString();

  const { error: approvalError } = await supabase
    .from('agent_approvals')
    .update({
      status: 'approved',
      approved_by: actorLabel,
      decision_notes: input.decisionNotes ?? null,
      decided_at: now,
      updated_at: now,
    })
    .eq('organization_id', organizationId)
    .eq('id', approval.id);

  if (approvalError) throw new Error(`approveAgentApprovalAndEnqueue approval: ${approvalError.message}`);

  if (approval.taskId) {
    const { error: taskError } = await supabase
      .from('agent_tasks')
      .update({
        status: 'in_progress',
        result_summary: {
          approval_id: approval.id,
          automation_run_id: automationRunId,
          phase: 'queued_for_durable_execution',
        },
        updated_at: now,
      })
      .eq('organization_id', organizationId)
      .eq('id', approval.taskId);

    if (taskError) throw new Error(`approveAgentApprovalAndEnqueue task: ${taskError.message}`);
  }

  if (approval.runId) {
    const { error: runError } = await supabase
      .from('agent_runs')
      .update({
        automation_run_id: automationRunId,
        output_summary: {
          approval_id: approval.id,
          automation_run_id: automationRunId,
          action_type: approval.actionType,
          proposed_tools: proposedToolsFromApproval(approval),
          phase: 'approved_and_queued',
        },
        updated_at: now,
      })
      .eq('organization_id', organizationId)
      .eq('id', approval.runId);

    if (runError) throw new Error(`approveAgentApprovalAndEnqueue run: ${runError.message}`);
  }

  await recordLucidAuditEvent({
    eventType: 'agent_approval_approved_workflow_queued',
    actorType: 'admin',
    actorId: actorLabel,
    targetTable: 'automation_runs',
    targetId: automationRunId,
    clientId: approval.clientId,
    projectId: approval.projectId,
    riskLevel: asAuditRiskLevel(approval.riskLevel),
    summary: `Approved ${approval.actionType}; durable workflow queued.`,
    details: {
      approval_id: approval.id,
      task_id: approval.taskId,
      run_id: approval.runId,
      automation_run_id: automationRunId,
      proposed_tools: proposedToolsFromApproval(approval),
    },
  });

  return { approvalId: approval.id, automationRunId, status: 'approved' };
}

export async function rejectAgentApproval(input: {
  approvalId: string;
  actorLabel?: string;
  decisionNotes?: string | null;
}): Promise<ApprovalDecisionResult> {
  assertSupabaseServiceRoleConfigured();

  const organizationId = await ensureLucidOrganizationId();
  const approval = await getApproval(organizationId, input.approvalId);
  const actorLabel = input.actorLabel ?? 'lucid_os_admin';

  if (approval.status !== 'pending') {
    throw new Error(`Approval is already ${approval.status}.`);
  }

  const now = new Date().toISOString();
  const { error: approvalError } = await supabase
    .from('agent_approvals')
    .update({
      status: 'rejected',
      approved_by: actorLabel,
      decision_notes: input.decisionNotes ?? null,
      decided_at: now,
      updated_at: now,
    })
    .eq('organization_id', organizationId)
    .eq('id', approval.id);

  if (approvalError) throw new Error(`rejectAgentApproval approval: ${approvalError.message}`);

  if (approval.taskId) {
    const { error: taskError } = await supabase
      .from('agent_tasks')
      .update({
        status: 'cancelled',
        closed_at: now,
        result_summary: {
          approval_id: approval.id,
          phase: 'approval_rejected',
        },
        updated_at: now,
      })
      .eq('organization_id', organizationId)
      .eq('id', approval.taskId);

    if (taskError) throw new Error(`rejectAgentApproval task: ${taskError.message}`);
  }

  await recordLucidAuditEvent({
    eventType: 'agent_approval_rejected',
    actorType: 'admin',
    actorId: actorLabel,
    targetTable: 'agent_approvals',
    targetId: approval.id,
    clientId: approval.clientId,
    projectId: approval.projectId,
    riskLevel: asAuditRiskLevel(approval.riskLevel),
    summary: `Rejected ${approval.actionType}.`,
    details: {
      approval_id: approval.id,
      task_id: approval.taskId,
      run_id: approval.runId,
      proposed_tools: proposedToolsFromApproval(approval),
    },
  });

  return { approvalId: approval.id, automationRunId: null, status: 'rejected' };
}

async function createAgentStep(input: {
  runId: string;
  stepNumber: number;
  name: string;
  status: 'completed' | 'failed';
  stepInput?: UnknownRecord;
  output?: UnknownRecord;
  errorMessage?: string | null;
}): Promise<string> {
  const now = new Date().toISOString();
  const { data, error } = await supabase
    .from('agent_steps')
    .insert({
      run_id: input.runId,
      step_number: input.stepNumber,
      name: input.name,
      status: input.status,
      input: input.stepInput ?? {},
      output: input.output ?? {},
      started_at: now,
      finished_at: now,
      error_message: input.errorMessage ?? null,
    })
    .select('id')
    .single();

  if (error) throw new Error(`createAgentStep: ${error.message}`);
  const record = asRecord(data);
  const stepId = asString(record?.id);
  if (!stepId) throw new Error('createAgentStep: missing inserted id');
  return stepId;
}

async function createToolCall(input: {
  runId: string;
  stepId: string;
  toolName: string;
  status: ToolCallStatus;
  toolArguments: UnknownRecord;
  resultSummary: UnknownRecord;
  externalSideEffect: boolean;
  errorMessage?: string | null;
}): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase.from('agent_tool_calls').insert({
    run_id: input.runId,
    step_id: input.stepId,
    tool_name: input.toolName,
    status: input.status,
    arguments: input.toolArguments,
    result_summary: input.resultSummary,
    external_side_effect: input.externalSideEffect,
    started_at: now,
    finished_at: now,
    error_message: input.errorMessage ?? null,
  });

  if (error) throw new Error(`createToolCall: ${error.message}`);
}

async function markAutomationRun(run: AutomationRunRecord, status: AutomationRunStatus, summary: UnknownRecord, errorMessage?: string | null): Promise<void> {
  const now = new Date().toISOString();
  const { error } = await supabase
    .from('automation_runs')
    .update({
      status,
      summary,
      error_message: errorMessage ?? null,
      finished_at: ['completed', 'completed_with_errors', 'failed', 'cancelled'].includes(status) ? now : null,
      updated_at: now,
    })
    .eq('organization_id', run.organizationId)
    .eq('id', run.id);

  if (error) throw new Error(`markAutomationRun: ${error.message}`);
}

async function executeQueuedAutomationRun(run: AutomationRunRecord): Promise<{ status: AutomationRunStatus; toolCallsCreated: number }> {
  const now = new Date().toISOString();
  const { error: startError } = await supabase
    .from('automation_runs')
    .update({ status: 'running', started_at: now, updated_at: now })
    .eq('organization_id', run.organizationId)
    .eq('id', run.id)
    .eq('status', 'queued');

  if (startError) throw new Error(`executeQueuedAutomationRun start: ${startError.message}`);

  const approvalStepId = await createAgentStep({
    runId: run.id,
    stepNumber: 0,
    name: 'approval_gate',
    status: 'completed',
    stepInput: { approval_id: asString(run.input.approval_id), action_type: asString(run.input.action_type) },
    output: { approved: true, durable_execution_started: true },
  });

  await createToolCall({
    runId: run.id,
    stepId: approvalStepId,
    toolName: 'agent_approvals.request',
    status: 'completed',
    toolArguments: { approval_id: asString(run.input.approval_id) },
    resultSummary: { approval_status: 'approved', source: 'human_gate' },
    externalSideEffect: false,
  });

  const dispatchStepId = await createAgentStep({
    runId: run.id,
    stepNumber: 1,
    name: 'tool_dispatch_plan',
    status: 'completed',
    stepInput: { proposed_tools: asStringArray(run.input.proposed_tools) },
    output: { external_side_effects_allowed: false },
  });

  const proposedTools = asStringArray(run.input.proposed_tools).filter((toolName) => toolName !== 'agent_approvals.request');
  const completedTools: string[] = [];
  const pausedTools: string[] = [];
  const failedTools: string[] = [];
  const skippedTools: string[] = [];
  let toolCallsCreated = 1;

  for (const toolName of proposedTools) {
    const tool = getAgentToolDefinition(toolName);
    if (!tool) {
      failedTools.push(toolName);
      await createToolCall({
        runId: run.id,
        stepId: dispatchStepId,
        toolName,
        status: 'failed',
        toolArguments: { workflow_key: run.workflowKey },
        resultSummary: { reason: 'unknown_tool' },
        externalSideEffect: false,
        errorMessage: 'Tool is not registered in Lucid OS.',
      });
      toolCallsCreated++;
      continue;
    }

    if (optionalToolIsNotRequired(run, toolName)) {
      skippedTools.push(toolName);
      await createToolCall({
        runId: run.id,
        stepId: dispatchStepId,
        toolName,
        status: 'cancelled',
        toolArguments: { workflow_key: run.workflowKey, approval_id: asString(run.input.approval_id) },
        resultSummary: { execution: 'optional_tool_not_required_for_request' },
        externalSideEffect: tool.externalSideEffect,
        errorMessage: 'Skipped because the approved request did not ask for this optional side effect.',
      });
      toolCallsCreated++;
      continue;
    }

    if (toolName === 'crm.client.write') {
      try {
        const resultSummary = await executeCrmClientWrite(run);
        completedTools.push(toolName);
        await createToolCall({
          runId: run.id,
          stepId: dispatchStepId,
          toolName,
          status: 'completed',
          toolArguments: { workflow_key: run.workflowKey, approval_id: asString(run.input.approval_id) },
          resultSummary,
          externalSideEffect: false,
        });
      } catch (error) {
        const message = error instanceof Error ? error.message : 'CRM client write failed';
        failedTools.push(toolName);
        await createToolCall({
          runId: run.id,
          stepId: dispatchStepId,
          toolName,
          status: 'failed',
          toolArguments: { workflow_key: run.workflowKey, approval_id: asString(run.input.approval_id) },
          resultSummary: { execution: 'crm_client_write_failed' },
          externalSideEffect: false,
          errorMessage: message,
        });
      }
      toolCallsCreated++;
      continue;
    }

    const executableNow = tool.status === 'available' && !tool.externalSideEffect;
    if (executableNow) {
      completedTools.push(toolName);
      await createToolCall({
        runId: run.id,
        stepId: dispatchStepId,
        toolName,
        status: 'completed',
        toolArguments: { workflow_key: run.workflowKey, approval_id: asString(run.input.approval_id) },
        resultSummary: {
          execution: 'satisfied_by_existing_lucid_os_records',
          note: 'This phase records durable execution traces for read/internal tools without additional side effects.',
        },
        externalSideEffect: false,
      });
      toolCallsCreated++;
      continue;
    }

    pausedTools.push(toolName);
    await createToolCall({
      runId: run.id,
      stepId: dispatchStepId,
      toolName,
      status: 'cancelled',
      toolArguments: { workflow_key: run.workflowKey, approval_id: asString(run.input.approval_id) },
      resultSummary: {
        execution: 'paused_for_executor',
        tool_status: tool.status,
        external_side_effect: tool.externalSideEffect,
        approval_required: tool.approvalRequired,
      },
      externalSideEffect: tool.externalSideEffect,
      errorMessage: tool.externalSideEffect
        ? 'External side-effect tools are not executed by the Phase 3 worker yet.'
        : 'Planned tool executor is not implemented yet.',
    });
    toolCallsCreated++;
  }

  const finalStatus: AutomationRunStatus = failedTools.length > 0
    ? 'completed_with_errors'
    : pausedTools.length > 0
      ? 'paused'
      : 'completed';

  const summary = {
    stage: finalStatus === 'completed' ? 'completed' : finalStatus === 'paused' ? 'paused_for_tool_executors' : 'completed_with_errors',
    approval_id: asString(run.input.approval_id),
    action_type: asString(run.input.action_type),
    completed_tools: completedTools,
    paused_tools: pausedTools,
    failed_tools: failedTools,
    skipped_tools: skippedTools,
    external_side_effects_allowed: false,
  };

  await markAutomationRun(run, finalStatus, summary, failedTools.length > 0 ? 'One or more proposed tools are unknown.' : null);

  const taskId = asString(run.input.task_id);
  if (taskId) {
    const { error: taskError } = await supabase
      .from('agent_tasks')
      .update({
        status: finalStatus === 'completed' ? 'done' : 'blocked',
        result_summary: summary,
        closed_at: finalStatus === 'completed' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('organization_id', run.organizationId)
      .eq('id', taskId);

    if (taskError) throw new Error(`executeQueuedAutomationRun task: ${taskError.message}`);
  }

  await recordLucidAuditEvent({
    eventType: finalStatus === 'completed' ? 'agent_workflow_run_completed' : 'agent_workflow_run_paused',
    actorType: 'automation',
    actorId: 'agent-workflow-worker',
    targetTable: 'automation_runs',
    targetId: run.id,
    clientId: run.clientId,
    projectId: run.projectId,
    riskLevel: finalStatus === 'completed' ? 'low' : 'medium',
    summary: finalStatus === 'completed'
      ? `Agent workflow completed for ${asString(run.input.action_type) ?? run.workflowKey}.`
      : `Agent workflow paused for executor wiring: ${pausedTools.join(', ') || failedTools.join(', ')}.`,
    details: summary,
  });

  return { status: finalStatus, toolCallsCreated };
}

export async function processAgentWorkflowRunById(automationRunId: string): Promise<AgentWorkflowProcessResult> {
  assertSupabaseServiceRoleConfigured();

  const organizationId = await ensureLucidOrganizationId();
  const { data, error } = await supabase
    .from('automation_runs')
    .select('id,organization_id,client_id,project_id,agent_id,workflow_key,run_type,status,input,summary')
    .eq('organization_id', organizationId)
    .eq('id', automationRunId)
    .maybeSingle();

  if (error) throw new Error(`processAgentWorkflowRunById: ${error.message}`);
  const run = automationRunFromRow(data);
  if (!run) throw new Error('Automation run not found.');

  const result: AgentWorkflowProcessResult = {
    scanned: 1,
    completed: 0,
    paused: 0,
    failed: 0,
    toolCallsCreated: 0,
    runIds: [run.id],
  };

  if (run.status !== 'queued') {
    if (run.status === 'completed') result.completed = 1;
    else if (run.status === 'paused') result.paused = 1;
    else if (run.status === 'failed' || run.status === 'completed_with_errors') result.failed = 1;
    return result;
  }

  try {
    const runResult = await executeQueuedAutomationRun(run);
    result.toolCallsCreated = runResult.toolCallsCreated;
    if (runResult.status === 'completed') result.completed = 1;
    else if (runResult.status === 'paused') result.paused = 1;
    else result.failed = 1;
  } catch (error) {
    result.failed = 1;
    const message = error instanceof Error ? error.message : 'Unknown workflow execution error';
    await markAutomationRun(run, 'failed', { stage: 'failed', error: message }, message);
    await recordLucidAuditEvent({
      eventType: 'agent_workflow_run_failed',
      actorType: 'automation',
      actorId: 'agent-workflow-worker',
      targetTable: 'automation_runs',
      targetId: run.id,
      clientId: run.clientId,
      projectId: run.projectId,
      riskLevel: 'medium',
      summary: `Agent workflow failed: ${message}`,
      details: { automation_run_id: run.id, error: message },
    });
  }

  return result;
}

export async function processQueuedAgentWorkflowRuns(limit = 5): Promise<AgentWorkflowProcessResult> {
  assertSupabaseServiceRoleConfigured();

  const organizationId = await ensureLucidOrganizationId();
  const { data, error } = await supabase
    .from('automation_runs')
    .select('id,organization_id,client_id,project_id,agent_id,workflow_key,run_type,status,input,summary')
    .eq('organization_id', organizationId)
    .eq('workflow_key', 'agent.approval.execute')
    .eq('status', 'queued')
    .order('created_at', { ascending: true })
    .limit(limit);

  if (error) throw new Error(`processQueuedAgentWorkflowRuns: ${error.message}`);

  const runs = (data ?? []).map(automationRunFromRow).filter((run): run is AutomationRunRecord => Boolean(run));
  const result: AgentWorkflowProcessResult = {
    scanned: runs.length,
    completed: 0,
    paused: 0,
    failed: 0,
    toolCallsCreated: 0,
    runIds: [],
  };

  for (const run of runs) {
    try {
      const runResult = await executeQueuedAutomationRun(run);
      result.runIds.push(run.id);
      result.toolCallsCreated += runResult.toolCallsCreated;
      if (runResult.status === 'completed') result.completed++;
      else if (runResult.status === 'paused') result.paused++;
      else result.failed++;
    } catch (error) {
      result.failed++;
      const message = error instanceof Error ? error.message : 'Unknown workflow execution error';
      await markAutomationRun(run, 'failed', { stage: 'failed', error: message }, message);
      await recordLucidAuditEvent({
        eventType: 'agent_workflow_run_failed',
        actorType: 'automation',
        actorId: 'agent-workflow-worker',
        targetTable: 'automation_runs',
        targetId: run.id,
        clientId: run.clientId,
        projectId: run.projectId,
        riskLevel: 'medium',
        summary: `Agent workflow failed: ${message}`,
        details: { automation_run_id: run.id, error: message },
      });
    }
  }

  return result;
}