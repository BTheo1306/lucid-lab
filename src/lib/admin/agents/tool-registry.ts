export type AgentToolGroup = 'ingest' | 'knowledge' | 'tasks' | 'crm' | 'documents' | 'incidents' | 'notifications' | 'delivery' | 'outreach';
export type AgentToolStatus = 'available' | 'planned';
export type AgentToolRiskLevel = 'low' | 'medium' | 'high' | 'critical';
export type AgentToolApprovalRequirement = 'never' | 'always' | 'conditional';

export interface AgentToolDefinition {
  name: string;
  label: string;
  group: AgentToolGroup;
  description: string;
  status: AgentToolStatus;
  ownerAgentSlugs: string[];
  inputSchema: Record<string, unknown>;
  outputSchema: Record<string, unknown>;
  riskLevel: AgentToolRiskLevel;
  externalSideEffect: boolean;
  approvalRequired: AgentToolApprovalRequirement;
  auditEventType: string;
  idempotencyStrategy: string;
}

const toolDefinitions = [
  {
    name: 'telegram.coo_ingest',
    label: 'Telegram COO ingest',
    group: 'ingest',
    description: 'Capture an allowlisted Telegram message as an agent run, task proposal, answer, or clarification.',
    status: 'available',
    ownerAgentSlugs: ['coo-agent'],
    inputSchema: { type: 'object', required: ['update_id', 'message_text'] },
    outputSchema: { type: 'object', required: ['run_id', 'mode'] },
    riskLevel: 'low',
    externalSideEffect: false,
    approvalRequired: 'never',
    auditEventType: 'telegram_coo_message_handled',
    idempotencyStrategy: 'Telegram update id plus message id.',
  },
  {
    name: 'knowledge.search',
    label: 'Knowledge search',
    group: 'knowledge',
    description: 'Read scoped Supabase runtime knowledge and CRM context for an agent answer.',
    status: 'available',
    ownerAgentSlugs: ['coo-agent', 'knowledge-agent'],
    inputSchema: { type: 'object', required: ['query', 'organization_id'] },
    outputSchema: { type: 'object', required: ['context'] },
    riskLevel: 'low',
    externalSideEffect: false,
    approvalRequired: 'never',
    auditEventType: 'knowledge_context_retrieved',
    idempotencyStrategy: 'Read-only.',
  },
  {
    name: 'knowledge.sync_obsidian',
    label: 'Sync Obsidian knowledge',
    group: 'knowledge',
    description: 'Sync curated business/shared Obsidian wiki pages into Supabase knowledge documents and chunks.',
    status: 'available',
    ownerAgentSlugs: ['knowledge-agent', 'coo-agent'],
    inputSchema: { type: 'object', required: ['scopes'] },
    outputSchema: { type: 'object', required: ['documents_synced', 'chunks_synced'] },
    riskLevel: 'medium',
    externalSideEffect: false,
    approvalRequired: 'conditional',
    auditEventType: 'obsidian_knowledge_synced',
    idempotencyStrategy: 'Stable source_uri and organization/slug upserts; chunks replaced per document.',
  },
  {
    name: 'agent_tasks.create',
    label: 'Create agent task',
    group: 'tasks',
    description: 'Create an internal Lucid OS task for an agent or human to review.',
    status: 'available',
    ownerAgentSlugs: ['coo-agent'],
    inputSchema: { type: 'object', required: ['title', 'description', 'priority'] },
    outputSchema: { type: 'object', required: ['task_id'] },
    riskLevel: 'low',
    externalSideEffect: false,
    approvalRequired: 'never',
    auditEventType: 'agent_task_created',
    idempotencyStrategy: 'Source run id plus request hash where available.',
  },
  {
    name: 'agent_approvals.request',
    label: 'Request approval',
    group: 'tasks',
    description: 'Open a human approval gate before an agent performs a governed action.',
    status: 'available',
    ownerAgentSlugs: ['coo-agent'],
    inputSchema: { type: 'object', required: ['action_type', 'risk_level', 'request_payload'] },
    outputSchema: { type: 'object', required: ['approval_id'] },
    riskLevel: 'low',
    externalSideEffect: false,
    approvalRequired: 'never',
    auditEventType: 'agent_approval_requested',
    idempotencyStrategy: 'One approval per task and proposed tool set.',
  },
  {
    name: 'crm.client.read',
    label: 'Read CRM client',
    group: 'crm',
    description: 'Read client, contact, opportunity, interaction, and task context from Lucid OS.',
    status: 'available',
    ownerAgentSlugs: ['coo-agent', 'crm-sales-agent'],
    inputSchema: { type: 'object', required: ['query'] },
    outputSchema: { type: 'object', required: ['matches'] },
    riskLevel: 'low',
    externalSideEffect: false,
    approvalRequired: 'never',
    auditEventType: 'crm_context_read',
    idempotencyStrategy: 'Read-only.',
  },
  {
    name: 'crm.client.write',
    label: 'Write CRM client',
    group: 'crm',
    description: 'Create or update clients, contacts, opportunities, interactions, or tasks.',
    status: 'planned',
    ownerAgentSlugs: ['crm-sales-agent', 'coo-agent'],
    inputSchema: { type: 'object', required: ['operation', 'payload'] },
    outputSchema: { type: 'object', required: ['record_id'] },
    riskLevel: 'medium',
    externalSideEffect: false,
    approvalRequired: 'always',
    auditEventType: 'crm_agent_write_requested',
    idempotencyStrategy: 'Client slug/contact key plus operation hash.',
  },
  {
    name: 'documents.draft_bdc',
    label: 'Draft commercial document',
    group: 'documents',
    description: 'Prepare a quote, facture, bon de commande, contract, or proposal draft.',
    status: 'planned',
    ownerAgentSlugs: ['finance-document-agent', 'coo-agent'],
    inputSchema: { type: 'object', required: ['client', 'document_type', 'commercial_terms'] },
    outputSchema: { type: 'object', required: ['document_id', 'status'] },
    riskLevel: 'medium',
    externalSideEffect: false,
    approvalRequired: 'always',
    auditEventType: 'document_draft_requested',
    idempotencyStrategy: 'Client id plus document type plus commercial terms checksum.',
  },
  {
    name: 'documents.send_docuseal',
    label: 'Send DocuSeal document',
    group: 'documents',
    description: 'Send a client document for signature through DocuSeal.',
    status: 'planned',
    ownerAgentSlugs: ['finance-document-agent'],
    inputSchema: { type: 'object', required: ['document_id', 'recipient'] },
    outputSchema: { type: 'object', required: ['submission_id', 'submission_url'] },
    riskLevel: 'high',
    externalSideEffect: true,
    approvalRequired: 'always',
    auditEventType: 'docuseal_send_requested',
    idempotencyStrategy: 'Document id and recipient email; never send twice without explicit new approval.',
  },
  {
    name: 'incidents.create',
    label: 'Create incident',
    group: 'incidents',
    description: 'Open or update a Lucid OS operational incident from monitoring or human reports.',
    status: 'planned',
    ownerAgentSlugs: ['monitoring-incident-agent', 'coo-agent'],
    inputSchema: { type: 'object', required: ['title', 'severity', 'summary'] },
    outputSchema: { type: 'object', required: ['incident_id'] },
    riskLevel: 'medium',
    externalSideEffect: false,
    approvalRequired: 'conditional',
    auditEventType: 'incident_agent_write_requested',
    idempotencyStrategy: 'Open incident fingerprint by monitor/client/severity/title.',
  },
  {
    name: 'notifications.telegram.reply',
    label: 'Telegram reply',
    group: 'notifications',
    description: 'Send a short internal reply to an allowlisted Telegram chat.',
    status: 'available',
    ownerAgentSlugs: ['coo-agent'],
    inputSchema: { type: 'object', required: ['chat_id', 'text'] },
    outputSchema: { type: 'object', required: ['ok'] },
    riskLevel: 'low',
    externalSideEffect: true,
    approvalRequired: 'conditional',
    auditEventType: 'telegram_coo_reply_sent',
    idempotencyStrategy: 'One reply per handled webhook result.',
  },
  {
    name: 'deployments.vercel_promote',
    label: 'Promote deployment',
    group: 'delivery',
    description: 'Promote or redeploy a Vercel production deployment.',
    status: 'planned',
    ownerAgentSlugs: ['delivery-project-agent'],
    inputSchema: { type: 'object', required: ['project', 'environment'] },
    outputSchema: { type: 'object', required: ['deployment_id', 'url'] },
    riskLevel: 'high',
    externalSideEffect: true,
    approvalRequired: 'always',
    auditEventType: 'deployment_agent_action_requested',
    idempotencyStrategy: 'Commit sha plus Vercel project/environment.',
  },
  {
    name: 'dns.cloudflare_change',
    label: 'Change DNS',
    group: 'delivery',
    description: 'Create, update, or delete DNS records in Cloudflare.',
    status: 'planned',
    ownerAgentSlugs: ['delivery-project-agent'],
    inputSchema: { type: 'object', required: ['zone', 'record_change'] },
    outputSchema: { type: 'object', required: ['change_id'] },
    riskLevel: 'critical',
    externalSideEffect: true,
    approvalRequired: 'always',
    auditEventType: 'dns_agent_change_requested',
    idempotencyStrategy: 'Zone id plus normalized record change checksum.',
  },
  {
    name: 'outreach.email_send',
    label: 'Send outreach email',
    group: 'outreach',
    description: 'Send an email or campaign message to a lead, prospect, client, or partner.',
    status: 'planned',
    ownerAgentSlugs: ['crm-sales-agent'],
    inputSchema: { type: 'object', required: ['recipient', 'subject', 'body'] },
    outputSchema: { type: 'object', required: ['message_id'] },
    riskLevel: 'high',
    externalSideEffect: true,
    approvalRequired: 'always',
    auditEventType: 'outreach_send_requested',
    idempotencyStrategy: 'Recipient plus campaign step plus body checksum.',
  },
] satisfies AgentToolDefinition[];

const riskOrder: AgentToolRiskLevel[] = ['low', 'medium', 'high', 'critical'];

export const COO_AGENT_TOOL_NAMES = [
  'telegram.coo_ingest',
  'knowledge.search',
  'agent_tasks.create',
  'agent_approvals.request',
  'notifications.telegram.reply',
  'crm.client.read',
  'crm.client.write',
  'documents.draft_bdc',
  'documents.send_docuseal',
  'incidents.create',
];

export function listAgentToolDefinitions(): AgentToolDefinition[] {
  return [...toolDefinitions].sort((left, right) => left.group.localeCompare(right.group) || left.name.localeCompare(right.name));
}

export function getAgentToolDefinition(name: string): AgentToolDefinition | null {
  return toolDefinitions.find((tool) => tool.name === name) ?? null;
}

export function highestToolRiskLevel(toolNames: string[], fallback: AgentToolRiskLevel = 'low'): AgentToolRiskLevel {
  return toolNames.reduce<AgentToolRiskLevel>((highest, toolName) => {
    const tool = getAgentToolDefinition(toolName);
    if (!tool) return highest;
    return riskOrder.indexOf(tool.riskLevel) > riskOrder.indexOf(highest) ? tool.riskLevel : highest;
  }, fallback);
}

export function mergeRiskLevels(left: AgentToolRiskLevel, right: AgentToolRiskLevel): AgentToolRiskLevel {
  return riskOrder.indexOf(left) > riskOrder.indexOf(right) ? left : right;
}

export function toolNamesForCooIntent(intent: string): string[] {
  switch (intent) {
    case 'business_question':
      return ['knowledge.search', 'crm.client.read', 'notifications.telegram.reply'];
    case 'finance_document':
      return ['documents.draft_bdc', 'documents.send_docuseal', 'agent_approvals.request'];
    case 'crm_or_sales':
      return ['crm.client.read', 'crm.client.write', 'outreach.email_send', 'agent_approvals.request'];
    case 'meeting_ops':
      return ['crm.client.read', 'crm.client.write', 'knowledge.search', 'agent_approvals.request'];
    case 'incident_ops':
      return ['incidents.create', 'agent_approvals.request'];
    case 'help':
    case 'small_talk':
      return ['notifications.telegram.reply'];
    case 'general_ops':
    case 'unclear':
    default:
      return ['agent_tasks.create', 'agent_approvals.request'];
  }
}

export function toolCatalogForPrompt(): string {
  return listAgentToolDefinitions()
    .filter((tool) => tool.status === 'available' || tool.approvalRequired === 'always')
    .map((tool) => `- ${tool.name}: ${tool.description} Risk=${tool.riskLevel}. Approval=${tool.approvalRequired}. External side effect=${tool.externalSideEffect ? 'yes' : 'no'}.`)
    .join('\n');
}