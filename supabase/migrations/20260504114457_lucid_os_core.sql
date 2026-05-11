-- =============================================================================
-- Lucid OS Core Schema
-- =============================================================================
-- Internal agency operating system tables for clients, projects, infrastructure,
-- AI agents, approvals, incidents, audit events, and operational knowledge.
-- RLS is enabled on every public table. The internal MVP keeps using the
-- server-only Supabase service role client; no anon/authenticated policies are
-- created in this migration.

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

-- =============================================
-- CORE AGENCY OPERATIONS
-- =============================================

CREATE TABLE organizations (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	name text NOT NULL,
	slug text NOT NULL UNIQUE,
	status text NOT NULL DEFAULT 'active',
	owner_label text,
	primary_language text NOT NULL DEFAULT 'fr',
	timezone text NOT NULL DEFAULT 'Europe/Paris',
	settings jsonb NOT NULL DEFAULT '{}'::jsonb,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT organizations_status_check CHECK (status IN ('active', 'paused', 'archived')),
	CONSTRAINT organizations_primary_language_check CHECK (primary_language IN ('fr', 'en'))
);

CREATE TABLE billing_plans (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
	name text NOT NULL,
	tier text NOT NULL,
	status text NOT NULL DEFAULT 'active',
	monthly_price_eur numeric(12,2),
	setup_price_eur numeric(12,2),
	features text[] NOT NULL DEFAULT '{}'::text[],
	metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT billing_plans_tier_check CHECK (tier IN ('managed_website', 'website_database', 'ai_automation', 'ai_agent', 'custom_app', 'enterprise')),
	CONSTRAINT billing_plans_status_check CHECK (status IN ('active', 'draft', 'archived')),
	CONSTRAINT billing_plans_price_check CHECK (
		(monthly_price_eur IS NULL OR monthly_price_eur >= 0)
		AND (setup_price_eur IS NULL OR setup_price_eur >= 0)
	)
);

CREATE TABLE clients (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
	billing_plan_id uuid REFERENCES billing_plans(id) ON DELETE SET NULL,
	name text NOT NULL,
	slug text NOT NULL,
	status text NOT NULL DEFAULT 'lead',
	industry text,
	website_url text,
	primary_contact_name text,
	primary_contact_email text,
	primary_contact_phone text,
	notes text,
	metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT clients_status_check CHECK (status IN ('lead', 'active', 'paused', 'offboarded', 'archived')),
	CONSTRAINT clients_slug_unique UNIQUE (organization_id, slug)
);

CREATE TABLE projects (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
	client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
	name text NOT NULL,
	project_type text NOT NULL DEFAULT 'website',
	status text NOT NULL DEFAULT 'planned',
	priority text NOT NULL DEFAULT 'normal',
	summary text,
	started_at timestamptz,
	due_at timestamptz,
	completed_at timestamptz,
	metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT projects_type_check CHECK (project_type IN ('website', 'automation', 'agent', 'app', 'strategy', 'ops')),
	CONSTRAINT projects_status_check CHECK (status IN ('idea', 'planned', 'active', 'blocked', 'completed', 'archived')),
	CONSTRAINT projects_priority_check CHECK (priority IN ('low', 'normal', 'high', 'urgent'))
);

CREATE TABLE websites (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
	client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
	project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
	name text NOT NULL,
	status text NOT NULL DEFAULT 'planned',
	primary_domain text,
	framework text NOT NULL DEFAULT 'nextjs',
	hosting_provider text NOT NULL DEFAULT 'vercel',
	repository_url text,
	production_url text,
	preview_url text,
	health_status text NOT NULL DEFAULT 'unknown',
	last_checked_at timestamptz,
	metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT websites_status_check CHECK (status IN ('planned', 'designing', 'building', 'live', 'paused', 'archived')),
	CONSTRAINT websites_health_status_check CHECK (health_status IN ('unknown', 'healthy', 'degraded', 'down'))
);

CREATE TABLE domains (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
	client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
	website_id uuid REFERENCES websites(id) ON DELETE SET NULL,
	hostname text NOT NULL,
	status text NOT NULL DEFAULT 'planned',
	registrar text,
	dns_provider text NOT NULL DEFAULT 'cloudflare',
	ssl_status text NOT NULL DEFAULT 'unknown',
	expires_at timestamptz,
	last_checked_at timestamptz,
	metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT domains_status_check CHECK (status IN ('planned', 'active', 'transferring', 'expired', 'archived')),
	CONSTRAINT domains_ssl_status_check CHECK (ssl_status IN ('unknown', 'valid', 'expiring', 'invalid', 'missing'))
);

CREATE TABLE databases (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
	client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
	project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
	name text NOT NULL,
	provider text NOT NULL DEFAULT 'supabase',
	status text NOT NULL DEFAULT 'planned',
	external_ref text,
	region text,
	purpose text,
	backup_status text NOT NULL DEFAULT 'unknown',
	last_backup_at timestamptz,
	metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT databases_status_check CHECK (status IN ('planned', 'active', 'paused', 'migrating', 'archived')),
	CONSTRAINT databases_backup_status_check CHECK (backup_status IN ('unknown', 'healthy', 'warning', 'failed', 'not_required'))
);

CREATE TABLE deployments (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
	client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
	project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
	website_id uuid REFERENCES websites(id) ON DELETE SET NULL,
	provider text NOT NULL DEFAULT 'vercel',
	environment text NOT NULL DEFAULT 'production',
	status text NOT NULL DEFAULT 'queued',
	external_id text,
	commit_sha text,
	branch text,
	deployment_url text,
	deployed_at timestamptz,
	metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT deployments_environment_check CHECK (environment IN ('production', 'preview', 'staging', 'development')),
	CONSTRAINT deployments_status_check CHECK (status IN ('queued', 'building', 'ready', 'failed', 'cancelled', 'rolled_back'))
);

CREATE TABLE integrations (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
	client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
	name text NOT NULL,
	provider text NOT NULL,
	category text NOT NULL,
	status text NOT NULL DEFAULT 'planned',
	config jsonb NOT NULL DEFAULT '{}'::jsonb,
	docs_url text,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT integrations_category_check CHECK (category IN ('hosting', 'database', 'dns', 'monitoring', 'analytics', 'crm', 'workflow', 'ai', 'secrets', 'support', 'other')),
	CONSTRAINT integrations_status_check CHECK (status IN ('planned', 'active', 'needs_attention', 'paused', 'archived'))
);

CREATE TABLE integration_accounts (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
	client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
	integration_id uuid NOT NULL REFERENCES integrations(id) ON DELETE CASCADE,
	label text NOT NULL,
	account_identifier text,
	status text NOT NULL DEFAULT 'planned',
	secret_ref text,
	scopes text[] NOT NULL DEFAULT '{}'::text[],
	metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT integration_accounts_status_check CHECK (status IN ('planned', 'active', 'needs_reauth', 'disabled', 'archived'))
);

-- =============================================
-- AGENT OPERATIONS AND WORKFLOWS
-- =============================================

CREATE TABLE agents (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
	client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
	project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
	name text NOT NULL,
	slug text NOT NULL,
	role text NOT NULL,
	status text NOT NULL DEFAULT 'draft',
	provider_preference text,
	model_preference text,
	prompt_version text,
	system_prompt_ref text,
	tools text[] NOT NULL DEFAULT '{}'::text[],
	approval_policy text NOT NULL DEFAULT 'human_for_side_effects',
	memory_scope text NOT NULL DEFAULT 'organization',
	config jsonb NOT NULL DEFAULT '{}'::jsonb,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT agents_status_check CHECK (status IN ('draft', 'active', 'paused', 'retired')),
	CONSTRAINT agents_memory_scope_check CHECK (memory_scope IN ('organization', 'client', 'project', 'task')),
	CONSTRAINT agents_slug_unique UNIQUE (organization_id, slug)
);

CREATE TABLE automation_runs (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
	client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
	project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
	agent_id uuid REFERENCES agents(id) ON DELETE SET NULL,
	workflow_key text NOT NULL,
	run_type text NOT NULL,
	status text NOT NULL DEFAULT 'queued',
	idempotency_key text,
	input jsonb NOT NULL DEFAULT '{}'::jsonb,
	summary jsonb NOT NULL DEFAULT '{}'::jsonb,
	started_at timestamptz,
	finished_at timestamptz,
	error_message text,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT automation_runs_status_check CHECK (status IN ('queued', 'running', 'completed', 'completed_with_errors', 'failed', 'cancelled', 'paused'))
);

CREATE TABLE agent_runs (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
	client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
	project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
	agent_id uuid REFERENCES agents(id) ON DELETE SET NULL,
	automation_run_id uuid REFERENCES automation_runs(id) ON DELETE SET NULL,
	status text NOT NULL DEFAULT 'queued',
	trigger_source text NOT NULL DEFAULT 'manual',
	model text,
	prompt_version text,
	input jsonb NOT NULL DEFAULT '{}'::jsonb,
	output_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
	tokens_input integer NOT NULL DEFAULT 0,
	tokens_output integer NOT NULL DEFAULT 0,
	cost_eur numeric(12,6) NOT NULL DEFAULT 0,
	latency_ms integer,
	started_at timestamptz,
	finished_at timestamptz,
	error_message text,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT agent_runs_status_check CHECK (status IN ('queued', 'running', 'waiting_approval', 'completed', 'completed_with_errors', 'failed', 'cancelled')),
	CONSTRAINT agent_runs_usage_check CHECK (
		tokens_input >= 0
		AND tokens_output >= 0
		AND cost_eur >= 0
		AND (latency_ms IS NULL OR latency_ms >= 0)
	)
);

CREATE TABLE agent_steps (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	run_id uuid NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
	step_number integer NOT NULL,
	name text NOT NULL,
	status text NOT NULL DEFAULT 'queued',
	input jsonb NOT NULL DEFAULT '{}'::jsonb,
	output jsonb NOT NULL DEFAULT '{}'::jsonb,
	started_at timestamptz,
	finished_at timestamptz,
	error_message text,
	created_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT agent_steps_status_check CHECK (status IN ('queued', 'running', 'completed', 'failed', 'skipped')),
	CONSTRAINT agent_steps_step_number_check CHECK (step_number >= 0),
	CONSTRAINT agent_steps_run_step_unique UNIQUE (run_id, step_number)
);

CREATE TABLE agent_tool_calls (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	run_id uuid NOT NULL REFERENCES agent_runs(id) ON DELETE CASCADE,
	step_id uuid REFERENCES agent_steps(id) ON DELETE SET NULL,
	tool_name text NOT NULL,
	status text NOT NULL DEFAULT 'queued',
	arguments jsonb NOT NULL DEFAULT '{}'::jsonb,
	result_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
	external_side_effect boolean NOT NULL DEFAULT false,
	started_at timestamptz,
	finished_at timestamptz,
	error_message text,
	created_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT agent_tool_calls_status_check CHECK (status IN ('queued', 'running', 'completed', 'failed', 'cancelled'))
);

CREATE TABLE agent_tasks (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
	client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
	project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
	agent_id uuid REFERENCES agents(id) ON DELETE SET NULL,
	assigned_to_agent_id uuid REFERENCES agents(id) ON DELETE SET NULL,
	parent_task_id uuid REFERENCES agent_tasks(id) ON DELETE SET NULL,
	title text NOT NULL,
	description text,
	status text NOT NULL DEFAULT 'backlog',
	priority text NOT NULL DEFAULT 'normal',
	due_at timestamptz,
	context jsonb NOT NULL DEFAULT '{}'::jsonb,
	result_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),
	closed_at timestamptz,
	CONSTRAINT agent_tasks_status_check CHECK (status IN ('backlog', 'ready', 'in_progress', 'blocked', 'waiting_approval', 'done', 'cancelled')),
	CONSTRAINT agent_tasks_priority_check CHECK (priority IN ('low', 'normal', 'high', 'urgent'))
);

CREATE TABLE agent_approvals (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
	client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
	project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
	agent_id uuid REFERENCES agents(id) ON DELETE SET NULL,
	run_id uuid REFERENCES agent_runs(id) ON DELETE SET NULL,
	task_id uuid REFERENCES agent_tasks(id) ON DELETE SET NULL,
	action_type text NOT NULL,
	status text NOT NULL DEFAULT 'pending',
	risk_level text NOT NULL DEFAULT 'medium',
	requested_by_agent boolean NOT NULL DEFAULT true,
	approved_by text,
	request_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
	decision_notes text,
	expires_at timestamptz,
	decided_at timestamptz,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT agent_approvals_status_check CHECK (status IN ('pending', 'approved', 'rejected', 'expired', 'cancelled')),
	CONSTRAINT agent_approvals_risk_level_check CHECK (risk_level IN ('low', 'medium', 'high', 'critical'))
);

CREATE TABLE agent_artifacts (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
	client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
	project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
	run_id uuid REFERENCES agent_runs(id) ON DELETE SET NULL,
	tool_call_id uuid REFERENCES agent_tool_calls(id) ON DELETE SET NULL,
	artifact_type text NOT NULL,
	title text NOT NULL,
	uri text,
	content text,
	metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
	created_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT agent_artifacts_type_check CHECK (artifact_type IN ('draft', 'document', 'code', 'report', 'dataset', 'image', 'link', 'other')),
	CONSTRAINT agent_artifacts_location_check CHECK (uri IS NOT NULL OR content IS NOT NULL)
);

-- =============================================
-- MONITORING, INCIDENTS, AND KNOWLEDGE
-- =============================================

CREATE TABLE monitors (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
	client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
	website_id uuid REFERENCES websites(id) ON DELETE SET NULL,
	domain_id uuid REFERENCES domains(id) ON DELETE SET NULL,
	integration_account_id uuid REFERENCES integration_accounts(id) ON DELETE SET NULL,
	name text NOT NULL,
	monitor_type text NOT NULL,
	provider text NOT NULL DEFAULT 'better_stack',
	external_id text,
	status text NOT NULL DEFAULT 'unknown',
	check_url text,
	last_checked_at timestamptz,
	last_success_at timestamptz,
	last_failure_at timestamptz,
	metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT monitors_type_check CHECK (monitor_type IN ('uptime', 'ssl', 'dns', 'cron', 'api', 'database', 'automation', 'other')),
	CONSTRAINT monitors_status_check CHECK (status IN ('unknown', 'healthy', 'degraded', 'down', 'paused'))
);

CREATE TABLE incidents (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
	client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
	project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
	website_id uuid REFERENCES websites(id) ON DELETE SET NULL,
	monitor_id uuid REFERENCES monitors(id) ON DELETE SET NULL,
	title text NOT NULL,
	status text NOT NULL DEFAULT 'open',
	severity text NOT NULL DEFAULT 'minor',
	summary text,
	root_cause text,
	resolution text,
	started_at timestamptz NOT NULL DEFAULT now(),
	resolved_at timestamptz,
	metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT incidents_status_check CHECK (status IN ('open', 'investigating', 'identified', 'monitoring', 'resolved', 'closed')),
	CONSTRAINT incidents_severity_check CHECK (severity IN ('info', 'minor', 'major', 'critical'))
);

CREATE TABLE knowledge_documents (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
	client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
	project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
	source_system text NOT NULL,
	source_uri text,
	title text NOT NULL,
	slug text NOT NULL,
	status text NOT NULL DEFAULT 'active',
	visibility text NOT NULL DEFAULT 'internal',
	freshness_at timestamptz,
	checksum text,
	summary text,
	content text,
	metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT knowledge_documents_source_system_check CHECK (source_system IN ('obsidian', 'supabase', 'github', 'admin', 'web', 'integration')),
	CONSTRAINT knowledge_documents_status_check CHECK (status IN ('draft', 'active', 'archived', 'stale')),
	CONSTRAINT knowledge_documents_visibility_check CHECK (visibility IN ('internal', 'client', 'public')),
	CONSTRAINT knowledge_documents_slug_unique UNIQUE (organization_id, slug)
);

CREATE TABLE knowledge_chunks (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
	client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
	project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
	document_id uuid NOT NULL REFERENCES knowledge_documents(id) ON DELETE CASCADE,
	chunk_index integer NOT NULL,
	heading text,
	content text NOT NULL,
	token_count integer,
	embedding extensions.vector(1536),
	metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
	created_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT knowledge_chunks_chunk_index_check CHECK (chunk_index >= 0),
	CONSTRAINT knowledge_chunks_token_count_check CHECK (token_count IS NULL OR token_count >= 0),
	CONSTRAINT knowledge_chunks_document_chunk_unique UNIQUE (document_id, chunk_index)
);

CREATE TABLE audit_events (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	organization_id uuid REFERENCES organizations(id) ON DELETE SET NULL,
	client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
	project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
	actor_type text NOT NULL DEFAULT 'system',
	actor_id text,
	event_type text NOT NULL,
	target_table text,
	target_id uuid,
	risk_level text NOT NULL DEFAULT 'low',
	summary text NOT NULL,
	details jsonb NOT NULL DEFAULT '{}'::jsonb,
	ip_hash text,
	created_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT audit_events_actor_type_check CHECK (actor_type IN ('admin', 'agent', 'automation', 'system', 'integration')),
	CONSTRAINT audit_events_risk_level_check CHECK (risk_level IN ('low', 'medium', 'high', 'critical'))
);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX idx_billing_plans_organization_status ON billing_plans(organization_id, status);
CREATE INDEX idx_clients_organization_status_updated ON clients(organization_id, status, updated_at DESC);
CREATE INDEX idx_clients_billing_plan ON clients(billing_plan_id);
CREATE INDEX idx_projects_organization_status_updated ON projects(organization_id, status, updated_at DESC);
CREATE INDEX idx_projects_client_status ON projects(client_id, status);
CREATE INDEX idx_websites_organization_status_updated ON websites(organization_id, status, updated_at DESC);
CREATE INDEX idx_websites_client_status ON websites(client_id, status);
CREATE INDEX idx_websites_project ON websites(project_id);
CREATE INDEX idx_domains_organization_status ON domains(organization_id, status);
CREATE INDEX idx_domains_client ON domains(client_id);
CREATE INDEX idx_domains_website ON domains(website_id);
CREATE UNIQUE INDEX idx_domains_hostname_unique ON domains(lower(hostname));
CREATE INDEX idx_databases_organization_status ON databases(organization_id, status);
CREATE INDEX idx_databases_client ON databases(client_id);
CREATE INDEX idx_databases_project ON databases(project_id);
CREATE INDEX idx_deployments_organization_status_created ON deployments(organization_id, status, created_at DESC);
CREATE INDEX idx_deployments_client_created ON deployments(client_id, created_at DESC);
CREATE INDEX idx_deployments_website_created ON deployments(website_id, created_at DESC);
CREATE INDEX idx_integrations_organization_category_status ON integrations(organization_id, category, status);
CREATE INDEX idx_integrations_client_status ON integrations(client_id, status);
CREATE INDEX idx_integration_accounts_integration_status ON integration_accounts(integration_id, status);
CREATE INDEX idx_integration_accounts_client_status ON integration_accounts(client_id, status);

CREATE INDEX idx_agents_organization_status ON agents(organization_id, status);
CREATE INDEX idx_agents_client_status ON agents(client_id, status);
CREATE INDEX idx_automation_runs_organization_status_created ON automation_runs(organization_id, status, created_at DESC);
CREATE INDEX idx_automation_runs_agent_created ON automation_runs(agent_id, created_at DESC);
CREATE UNIQUE INDEX idx_automation_runs_idempotency_unique ON automation_runs(organization_id, idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE INDEX idx_agent_runs_organization_status_created ON agent_runs(organization_id, status, created_at DESC);
CREATE INDEX idx_agent_runs_agent_created ON agent_runs(agent_id, created_at DESC);
CREATE INDEX idx_agent_runs_client_created ON agent_runs(client_id, created_at DESC);
CREATE INDEX idx_agent_steps_run_step ON agent_steps(run_id, step_number);
CREATE INDEX idx_agent_tool_calls_run_created ON agent_tool_calls(run_id, created_at DESC);
CREATE INDEX idx_agent_tool_calls_step ON agent_tool_calls(step_id);
CREATE INDEX idx_agent_tasks_organization_status_due ON agent_tasks(organization_id, status, due_at);
CREATE INDEX idx_agent_tasks_client_status ON agent_tasks(client_id, status);
CREATE INDEX idx_agent_tasks_agent_status ON agent_tasks(agent_id, status);
CREATE INDEX idx_agent_approvals_organization_status_created ON agent_approvals(organization_id, status, created_at DESC);
CREATE INDEX idx_agent_approvals_agent_status ON agent_approvals(agent_id, status);
CREATE INDEX idx_agent_approvals_client_status ON agent_approvals(client_id, status);
CREATE INDEX idx_agent_artifacts_run_created ON agent_artifacts(run_id, created_at DESC);
CREATE INDEX idx_agent_artifacts_client_created ON agent_artifacts(client_id, created_at DESC);

CREATE INDEX idx_monitors_organization_status ON monitors(organization_id, status);
CREATE INDEX idx_monitors_client_status ON monitors(client_id, status);
CREATE INDEX idx_monitors_website_status ON monitors(website_id, status);
CREATE INDEX idx_incidents_organization_status_started ON incidents(organization_id, status, started_at DESC);
CREATE INDEX idx_incidents_client_status ON incidents(client_id, status);
CREATE INDEX idx_incidents_monitor ON incidents(monitor_id);
CREATE INDEX idx_knowledge_documents_organization_status_updated ON knowledge_documents(organization_id, status, updated_at DESC);
CREATE INDEX idx_knowledge_documents_client_status ON knowledge_documents(client_id, status);
CREATE UNIQUE INDEX idx_knowledge_documents_source_uri_unique ON knowledge_documents(organization_id, source_system, source_uri) WHERE source_uri IS NOT NULL;
CREATE INDEX idx_knowledge_chunks_document_index ON knowledge_chunks(document_id, chunk_index);
CREATE INDEX idx_knowledge_chunks_organization_created ON knowledge_chunks(organization_id, created_at DESC);
CREATE INDEX idx_knowledge_chunks_embedding ON knowledge_chunks USING ivfflat (embedding extensions.vector_cosine_ops) WITH (lists = 100) WHERE embedding IS NOT NULL;
CREATE INDEX idx_audit_events_organization_created ON audit_events(organization_id, created_at DESC);
CREATE INDEX idx_audit_events_client_created ON audit_events(client_id, created_at DESC);
CREATE INDEX idx_audit_events_event_type_created ON audit_events(event_type, created_at DESC);
CREATE INDEX idx_audit_events_target ON audit_events(target_table, target_id);

-- =============================================
-- TRIGGERS
-- =============================================

CREATE OR REPLACE FUNCTION touch_updated_at()
RETURNS trigger AS $$
BEGIN
	NEW.updated_at = now();
	RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = '';

CREATE TRIGGER organizations_updated_at
	BEFORE UPDATE ON organizations
	FOR EACH ROW
	EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER billing_plans_updated_at
	BEFORE UPDATE ON billing_plans
	FOR EACH ROW
	EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER clients_updated_at
	BEFORE UPDATE ON clients
	FOR EACH ROW
	EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER projects_updated_at
	BEFORE UPDATE ON projects
	FOR EACH ROW
	EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER websites_updated_at
	BEFORE UPDATE ON websites
	FOR EACH ROW
	EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER domains_updated_at
	BEFORE UPDATE ON domains
	FOR EACH ROW
	EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER databases_updated_at
	BEFORE UPDATE ON databases
	FOR EACH ROW
	EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER deployments_updated_at
	BEFORE UPDATE ON deployments
	FOR EACH ROW
	EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER integrations_updated_at
	BEFORE UPDATE ON integrations
	FOR EACH ROW
	EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER integration_accounts_updated_at
	BEFORE UPDATE ON integration_accounts
	FOR EACH ROW
	EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER agents_updated_at
	BEFORE UPDATE ON agents
	FOR EACH ROW
	EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER automation_runs_updated_at
	BEFORE UPDATE ON automation_runs
	FOR EACH ROW
	EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER agent_runs_updated_at
	BEFORE UPDATE ON agent_runs
	FOR EACH ROW
	EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER agent_tasks_updated_at
	BEFORE UPDATE ON agent_tasks
	FOR EACH ROW
	EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER agent_approvals_updated_at
	BEFORE UPDATE ON agent_approvals
	FOR EACH ROW
	EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER monitors_updated_at
	BEFORE UPDATE ON monitors
	FOR EACH ROW
	EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER incidents_updated_at
	BEFORE UPDATE ON incidents
	FOR EACH ROW
	EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER knowledge_documents_updated_at
	BEFORE UPDATE ON knowledge_documents
	FOR EACH ROW
	EXECUTE FUNCTION touch_updated_at();

-- =============================================
-- RLS - deny all anon/authenticated access by default
-- =============================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE billing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE websites ENABLE ROW LEVEL SECURITY;
ALTER TABLE domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE databases ENABLE ROW LEVEL SECURITY;
ALTER TABLE deployments ENABLE ROW LEVEL SECURITY;
ALTER TABLE integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_tool_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE monitors ENABLE ROW LEVEL SECURITY;
ALTER TABLE incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;

-- =============================================
-- SEED DATA
-- =============================================

WITH lucid_org AS (
	INSERT INTO organizations (name, slug, status, owner_label, primary_language, settings)
	VALUES (
		'Lucid-Lab',
		'lucid-lab',
		'active',
		'Lucid-Lab internal operations',
		'fr',
		jsonb_build_object(
			'operating_system', 'Lucid OS',
			'delivery_model', 'standardized agency control plane',
			'default_stack', ARRAY['Vercel', 'Supabase', 'Cloudflare', 'Trigger.dev or Inngest', 'Better Stack', 'Sentry', 'PostHog', 'Langfuse or LangSmith']
		)
	)
	ON CONFLICT (slug) DO UPDATE SET
		name = EXCLUDED.name,
		status = EXCLUDED.status,
		owner_label = EXCLUDED.owner_label,
		settings = organizations.settings || EXCLUDED.settings,
		updated_at = now()
	RETURNING id
), seeded_plans AS (
	INSERT INTO billing_plans (organization_id, name, tier, status, features, metadata)
	SELECT id, name, tier, 'active', features, metadata
	FROM lucid_org
	CROSS JOIN (VALUES
		('Managed Website', 'managed_website', ARRAY['Vercel hosting', 'Cloudflare DNS', 'Sentry errors', 'Better Stack uptime']::text[], jsonb_build_object('standard_stack', ARRAY['Vercel', 'Cloudflare', 'Sentry', 'Better Stack'])),
		('AI Automation Package', 'ai_automation', ARRAY['Lucid OS tracking', 'n8n or Pipedream', 'Trigger.dev or Inngest', 'approval gates']::text[], jsonb_build_object('approval_required', true)),
		('AI Agent Package', 'ai_agent', ARRAY['Supabase memory', 'agent runs', 'human approvals', 'AI observability']::text[], jsonb_build_object('approval_required', true))
	) AS plan_data(name, tier, features, metadata)
	WHERE NOT EXISTS (
		SELECT 1 FROM billing_plans WHERE organization_id = lucid_org.id AND name = plan_data.name
	)
), seeded_agents AS (
	INSERT INTO agents (organization_id, name, slug, role, status, provider_preference, tools, approval_policy, memory_scope, config)
	SELECT id, name, slug, role, 'active', provider_preference, tools, approval_policy, memory_scope, config
	FROM lucid_org
	CROSS JOIN (VALUES
		(
			'Blog Strategist',
			'blog-strategist',
			'Plans, drafts, updates, schedules, and audits Lucid-Lab editorial work.',
			'anthropic',
			ARRAY['blog_posts', 'knowledge_documents', 'agent_approvals', 'audit_events']::text[],
			'human_for_publishing',
			'organization',
			jsonb_build_object('source_module', 'src/lib/admin/blog-content-generator.ts')
		),
		(
			'Lead Engine Operator',
			'lead-engine-operator',
			'Discovers, validates, scores, and drafts outreach for qualified prospects.',
			'anthropic',
			ARRAY['lead_engine_campaigns', 'prospect_companies', 'prospect_people', 'outreach_messages', 'agent_approvals', 'audit_events']::text[],
			'human_for_outreach',
			'organization',
			jsonb_build_object('source_module', 'src/lib/admin/lead-engine-generator.ts')
		),
		(
			'Knowledge Steward',
			'knowledge-steward',
			'Updates Obsidian and Supabase knowledge after significant work, then records an audit event.',
			'anthropic',
			ARRAY['obsidian_vault', 'knowledge_documents', 'knowledge_chunks', 'audit_events']::text[],
			'human_for_vault_writes',
			'organization',
			jsonb_build_object('significant_work_protocol', true, 'obsidian_scope', ARRAY['business', 'shared'])
		)
	) AS agent_data(name, slug, role, provider_preference, tools, approval_policy, memory_scope, config)
	ON CONFLICT (organization_id, slug) DO UPDATE SET
		name = EXCLUDED.name,
		role = EXCLUDED.role,
		status = EXCLUDED.status,
		provider_preference = EXCLUDED.provider_preference,
		tools = EXCLUDED.tools,
		approval_policy = EXCLUDED.approval_policy,
		memory_scope = EXCLUDED.memory_scope,
		config = agents.config || EXCLUDED.config,
		updated_at = now()
)
INSERT INTO knowledge_documents (
	organization_id,
	source_system,
	source_uri,
	title,
	slug,
	status,
	visibility,
	freshness_at,
	summary,
	content,
	metadata
)
SELECT
	id,
	'github',
	'AGENTS.md#significant-work-knowledge-update-protocol',
	'Significant Work Knowledge Update Protocol',
	'significant-work-knowledge-update-protocol',
	'active',
	'internal',
	now(),
	'Operational protocol requiring agents to update Obsidian and Supabase knowledge records after significant work.',
	'When an agent completes significant work for Lucid-Lab, it must update durable knowledge in two places when relevant: Obsidian for human-readable business memory and Supabase knowledge_documents/knowledge_chunks for runtime retrieval. Significant work includes schema changes, new agents or workflows, client delivery decisions, provider/infrastructure changes, incident/root-cause learnings, production runbooks, and major business decisions. Obsidian writes must follow the vault workflow: read index.md first, read CLAUDE.md before writing, only touch business/shared pages unless explicitly asked otherwise, cite sources, update index.md and log.md, and never modify raw/. Supabase knowledge updates should be scoped by organization/client/project, summarized instead of dumped, linked to source_uri, and paired with an audit_events record.',
	jsonb_build_object(
		'protocol_version', 'lucid_os_v1',
		'obsidian_required', true,
		'supabase_knowledge_required', true,
		'audit_required', true
	)
FROM lucid_org
ON CONFLICT (organization_id, slug) DO UPDATE SET
	source_uri = EXCLUDED.source_uri,
	status = EXCLUDED.status,
	visibility = EXCLUDED.visibility,
	freshness_at = EXCLUDED.freshness_at,
	summary = EXCLUDED.summary,
	content = EXCLUDED.content,
	metadata = knowledge_documents.metadata || EXCLUDED.metadata,
	updated_at = now();

WITH lucid_org AS (
	SELECT id FROM organizations WHERE slug = 'lucid-lab'
), protocol_doc AS (
	SELECT kd.id, kd.organization_id
	FROM knowledge_documents kd
	JOIN lucid_org lo ON lo.id = kd.organization_id
	WHERE kd.slug = 'significant-work-knowledge-update-protocol'
)
INSERT INTO knowledge_chunks (organization_id, document_id, chunk_index, heading, content, metadata)
SELECT
	organization_id,
	id,
	0,
	'Significant work knowledge protocol',
	'Agents update Obsidian and Supabase knowledge after significant work. Significant work includes architecture decisions, schema changes, new agents or workflows, client delivery patterns, incidents and runbooks, provider changes, and major business decisions. Obsidian writes must follow vault rules and stay scoped to business/shared pages. Supabase knowledge updates must be scoped, summarized, source-linked, and paired with audit_events.',
	jsonb_build_object('protocol_version', 'lucid_os_v1')
FROM protocol_doc
ON CONFLICT (document_id, chunk_index) DO UPDATE SET
	heading = EXCLUDED.heading,
	content = EXCLUDED.content,
	metadata = knowledge_chunks.metadata || EXCLUDED.metadata;

WITH lucid_org AS (
	SELECT id FROM organizations WHERE slug = 'lucid-lab'
)
INSERT INTO audit_events (organization_id, actor_type, event_type, target_table, risk_level, summary, details)
SELECT
	id,
	'system',
	'lucid_os_schema_seeded',
	'knowledge_documents',
	'low',
	'Lucid OS core schema seeded with agents and knowledge update protocol.',
	jsonb_build_object('migration', '20260504114457_lucid_os_core', 'seeded_agents', ARRAY['blog-strategist', 'lead-engine-operator', 'knowledge-steward'])
FROM lucid_org;
