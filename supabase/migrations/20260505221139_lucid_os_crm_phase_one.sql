-- =============================================================================
-- Lucid OS CRM Phase 1
-- =============================================================================
-- Adds the relational client-management foundation for Lucid OS: contacts,
-- opportunities, interactions, human tasks/follow-ups, imported documents, and
-- client-level lifecycle/next-action fields. RLS is enabled for all new public
-- tables; the internal MVP continues to use server-only service-role access.

ALTER TABLE clients
	ADD COLUMN lifecycle_stage text NOT NULL DEFAULT 'lead',
	ADD COLUMN owner_label text,
	ADD COLUMN health_status text NOT NULL DEFAULT 'unknown',
	ADD COLUMN health_score integer,
	ADD COLUMN health_summary text,
	ADD COLUMN next_action text,
	ADD COLUMN next_action_due_at timestamptz,
	ADD COLUMN last_contacted_at timestamptz;

ALTER TABLE clients
	ADD CONSTRAINT clients_lifecycle_stage_check CHECK (lifecycle_stage IN (
		'lead',
		'qualified',
		'meeting_booked',
		'discovery_done',
		'proposal_needed',
		'proposal_sent',
		'negotiation',
		'won',
		'lost',
		'onboarding',
		'in_delivery',
		'live_managed',
		'success_retention',
		'expansion_opportunity',
		'archived'
	)),
	ADD CONSTRAINT clients_health_status_check CHECK (health_status IN ('unknown', 'healthy', 'watch', 'risk', 'critical')),
	ADD CONSTRAINT clients_health_score_check CHECK (health_score IS NULL OR (health_score >= 0 AND health_score <= 100));

CREATE TABLE client_contacts (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
	client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
	full_name text NOT NULL,
	role text,
	email text,
	phone text,
	linkedin_url text,
	is_primary boolean NOT NULL DEFAULT false,
	is_decision_maker boolean NOT NULL DEFAULT false,
	influence_level text NOT NULL DEFAULT 'unknown',
	status text NOT NULL DEFAULT 'active',
	notes text,
	metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT client_contacts_status_check CHECK (status IN ('active', 'inactive', 'left_company', 'archived')),
	CONSTRAINT client_contacts_influence_level_check CHECK (influence_level IN ('unknown', 'low', 'medium', 'high', 'champion', 'blocker'))
);

CREATE TABLE client_opportunities (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
	client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
	primary_contact_id uuid REFERENCES client_contacts(id) ON DELETE SET NULL,
	title text NOT NULL,
	stage text NOT NULL DEFAULT 'discovery',
	status text NOT NULL DEFAULT 'open',
	offer_type text NOT NULL DEFAULT 'custom',
	value_estimate_eur numeric(12,2),
	setup_value_eur numeric(12,2),
	monthly_value_eur numeric(12,2),
	probability_percent integer NOT NULL DEFAULT 20,
	source text,
	expected_close_at timestamptz,
	closed_at timestamptz,
	win_loss_reason text,
	next_step text,
	next_step_due_at timestamptz,
	notes text,
	metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT client_opportunities_stage_check CHECK (stage IN ('new', 'qualified', 'discovery', 'proposal_needed', 'proposal_sent', 'negotiation', 'won', 'lost', 'paused')),
	CONSTRAINT client_opportunities_status_check CHECK (status IN ('open', 'won', 'lost', 'paused', 'archived')),
	CONSTRAINT client_opportunities_offer_type_check CHECK (offer_type IN ('managed_website', 'website_database', 'ai_automation', 'ai_agent', 'custom_app', 'retainer', 'audit', 'custom')),
	CONSTRAINT client_opportunities_probability_check CHECK (probability_percent >= 0 AND probability_percent <= 100),
	CONSTRAINT client_opportunities_value_check CHECK (
		(value_estimate_eur IS NULL OR value_estimate_eur >= 0)
		AND (setup_value_eur IS NULL OR setup_value_eur >= 0)
		AND (monthly_value_eur IS NULL OR monthly_value_eur >= 0)
	)
);

CREATE TABLE client_interactions (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
	client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
	contact_id uuid REFERENCES client_contacts(id) ON DELETE SET NULL,
	opportunity_id uuid REFERENCES client_opportunities(id) ON DELETE SET NULL,
	interaction_type text NOT NULL DEFAULT 'note',
	direction text NOT NULL DEFAULT 'internal',
	summary text NOT NULL,
	notes text,
	occurred_at timestamptz NOT NULL DEFAULT now(),
	next_step text,
	next_step_due_at timestamptz,
	sentiment text NOT NULL DEFAULT 'neutral',
	source_system text NOT NULL DEFAULT 'admin',
	source_uri text,
	metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT client_interactions_type_check CHECK (interaction_type IN ('note', 'meeting', 'call', 'email', 'chat', 'form', 'import', 'support', 'delivery_update', 'decision')),
	CONSTRAINT client_interactions_direction_check CHECK (direction IN ('inbound', 'outbound', 'internal')),
	CONSTRAINT client_interactions_sentiment_check CHECK (sentiment IN ('positive', 'neutral', 'negative', 'risk')),
	CONSTRAINT client_interactions_source_system_check CHECK (source_system IN ('admin', 'tidycal', 'email', 'website', 'chat', 'github', 'obsidian', 'integration', 'agent'))
);

CREATE TABLE client_tasks (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
	client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
	contact_id uuid REFERENCES client_contacts(id) ON DELETE SET NULL,
	opportunity_id uuid REFERENCES client_opportunities(id) ON DELETE SET NULL,
	interaction_id uuid REFERENCES client_interactions(id) ON DELETE SET NULL,
	title text NOT NULL,
	description text,
	status text NOT NULL DEFAULT 'todo',
	priority text NOT NULL DEFAULT 'normal',
	owner_label text,
	due_at timestamptz,
	completed_at timestamptz,
	created_by text NOT NULL DEFAULT 'admin',
	metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT client_tasks_status_check CHECK (status IN ('todo', 'in_progress', 'waiting', 'done', 'cancelled')),
	CONSTRAINT client_tasks_priority_check CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
	CONSTRAINT client_tasks_completed_check CHECK ((status = 'done' AND completed_at IS NOT NULL) OR status <> 'done' OR completed_at IS NULL)
);

CREATE TABLE client_imports (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
	client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
	knowledge_document_id uuid REFERENCES knowledge_documents(id) ON DELETE SET NULL,
	title text NOT NULL,
	source_type text NOT NULL DEFAULT 'note',
	source_uri text,
	raw_content text NOT NULL,
	extracted_summary text,
	status text NOT NULL DEFAULT 'processed',
	indexed_as_knowledge boolean NOT NULL DEFAULT false,
	metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT client_imports_source_type_check CHECK (source_type IN ('note', 'meeting_notes', 'email', 'doc', 'linkedin', 'website', 'chat', 'github', 'other')),
	CONSTRAINT client_imports_status_check CHECK (status IN ('pending', 'processed', 'needs_review', 'failed', 'archived'))
);

CREATE INDEX idx_clients_organization_lifecycle_next_action ON clients(organization_id, lifecycle_stage, next_action_due_at);
CREATE INDEX idx_clients_organization_health ON clients(organization_id, health_status, updated_at DESC);

CREATE INDEX idx_client_contacts_client_status ON client_contacts(client_id, status, is_primary DESC);
CREATE INDEX idx_client_contacts_organization_email ON client_contacts(organization_id, lower(email)) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX idx_client_contacts_client_primary_unique ON client_contacts(client_id) WHERE is_primary;

CREATE INDEX idx_client_opportunities_client_stage ON client_opportunities(client_id, stage, updated_at DESC);
CREATE INDEX idx_client_opportunities_organization_forecast ON client_opportunities(organization_id, status, expected_close_at, probability_percent);
CREATE INDEX idx_client_opportunities_next_step_due ON client_opportunities(organization_id, next_step_due_at) WHERE status = 'open';

CREATE INDEX idx_client_interactions_client_occurred ON client_interactions(client_id, occurred_at DESC);
CREATE INDEX idx_client_interactions_organization_type ON client_interactions(organization_id, interaction_type, occurred_at DESC);
CREATE INDEX idx_client_interactions_next_step_due ON client_interactions(organization_id, next_step_due_at) WHERE next_step IS NOT NULL;

CREATE INDEX idx_client_tasks_client_status_due ON client_tasks(client_id, status, due_at);
CREATE INDEX idx_client_tasks_organization_status_due ON client_tasks(organization_id, status, due_at);
CREATE INDEX idx_client_tasks_opportunity ON client_tasks(opportunity_id) WHERE opportunity_id IS NOT NULL;

CREATE INDEX idx_client_imports_client_created ON client_imports(client_id, created_at DESC);
CREATE INDEX idx_client_imports_knowledge_document ON client_imports(knowledge_document_id) WHERE knowledge_document_id IS NOT NULL;

CREATE TRIGGER client_contacts_updated_at
	BEFORE UPDATE ON client_contacts
	FOR EACH ROW
	EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER client_opportunities_updated_at
	BEFORE UPDATE ON client_opportunities
	FOR EACH ROW
	EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER client_interactions_updated_at
	BEFORE UPDATE ON client_interactions
	FOR EACH ROW
	EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER client_tasks_updated_at
	BEFORE UPDATE ON client_tasks
	FOR EACH ROW
	EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER client_imports_updated_at
	BEFORE UPDATE ON client_imports
	FOR EACH ROW
	EXECUTE FUNCTION touch_updated_at();

ALTER TABLE client_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_imports ENABLE ROW LEVEL SECURITY;

UPDATE clients
SET
	lifecycle_stage = CASE COALESCE(metadata #>> '{intake,stage}', '')
		WHEN 'meeting_booked' THEN 'meeting_booked'
		WHEN 'meeting_done' THEN 'discovery_done'
		WHEN 'proposal_sent' THEN 'proposal_sent'
		WHEN 'won' THEN 'won'
		WHEN 'lost' THEN 'lost'
		ELSE CASE status
			WHEN 'active' THEN 'in_delivery'
			WHEN 'archived' THEN 'archived'
			ELSE 'lead'
		END
	END,
	next_action = NULLIF(metadata #>> '{intake,next_step}', ''),
	last_contacted_at = COALESCE(
		NULLIF(metadata #>> '{intake,meeting_done_at}', '')::timestamptz,
		NULLIF(metadata #>> '{intake,meeting_booked_at}', '')::timestamptz,
		last_contacted_at
	)
WHERE metadata ? 'intake';

INSERT INTO client_contacts (
	organization_id,
	client_id,
	full_name,
	role,
	email,
	phone,
	is_primary,
	status,
	notes,
	metadata
)
SELECT
	organization_id,
	id,
	COALESCE(NULLIF(primary_contact_name, ''), NULLIF(primary_contact_email, ''), name || ' contact'),
	'Primary contact',
	NULLIF(primary_contact_email, ''),
	NULLIF(primary_contact_phone, ''),
	true,
	'active',
	NULLIF(notes, ''),
	jsonb_build_object('seeded_from', 'clients.primary_contact')
FROM clients
WHERE primary_contact_name IS NOT NULL
	OR primary_contact_email IS NOT NULL
	OR primary_contact_phone IS NOT NULL
ON CONFLICT DO NOTHING;

WITH lucid_org AS (
	SELECT id FROM organizations WHERE slug = 'lucid-lab'
), upserted_document AS (
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
		'supabase/migrations/20260505221139_lucid_os_crm_phase_one.sql',
		'Lucid OS CRM Phase 1 Foundation',
		'lucid-os-crm-phase-one-foundation',
		'active',
		'internal',
		now(),
		'Phase 1 adds relational CRM foundations for contacts, opportunities, interactions, tasks, imports, lifecycle stages, next actions, and client health.',
		'Lucid OS Phase 1 CRM separates the client account from contacts, opportunities/deals, interactions/meetings, human tasks/follow-ups, and imported source documents. Client records now carry lifecycle_stage, owner_label, health_status, health_score, health_summary, next_action, next_action_due_at, and last_contacted_at. New public tables are RLS-enabled and intended for server-only admin access until user/portal policies are designed. This foundation supports follow-up queues, project handoff, customer-success health tracking, revenue forecasting, and source-once imported notes.',
		jsonb_build_object(
			'phase', 'crm_phase_one',
			'tables', ARRAY['client_contacts', 'client_opportunities', 'client_interactions', 'client_tasks', 'client_imports'],
			'internal_only', true,
			'portal_ready_later', true
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
		updated_at = now()
	RETURNING id, organization_id
)
INSERT INTO knowledge_chunks (organization_id, document_id, chunk_index, heading, content, metadata)
SELECT
	organization_id,
	id,
	0,
	'CRM Phase 1 foundation',
	'Phase 1 CRM in Lucid OS uses relational client_contacts, client_opportunities, client_interactions, client_tasks, and client_imports tables. Keep raw imported source content in client_imports/knowledge_documents, then use extracted fields and structured tasks/opportunities/interactions for operations. Every active prospect/client should have a next action and due date. Customer-success tracking starts with lifecycle_stage, health_status, health_score, health_summary, last_contacted_at, and open tasks.',
	jsonb_build_object('phase', 'crm_phase_one')
FROM upserted_document
ON CONFLICT (document_id, chunk_index) DO UPDATE SET
	heading = EXCLUDED.heading,
	content = EXCLUDED.content,
	metadata = knowledge_chunks.metadata || EXCLUDED.metadata;

WITH lucid_org AS (
	SELECT id FROM organizations WHERE slug = 'lucid-lab'
), phase_doc AS (
	SELECT kd.id, kd.organization_id
	FROM knowledge_documents kd
	JOIN lucid_org lo ON lo.id = kd.organization_id
	WHERE kd.slug = 'lucid-os-crm-phase-one-foundation'
)
INSERT INTO audit_events (organization_id, actor_type, event_type, target_table, target_id, risk_level, summary, details)
SELECT
	organization_id,
	'system',
	'lucid_os_crm_phase_one_schema_seeded',
	'knowledge_documents',
	id,
	'low',
	'Lucid OS CRM Phase 1 schema and runtime knowledge added.',
	jsonb_build_object('migration', '20260505221139_lucid_os_crm_phase_one', 'tables', ARRAY['client_contacts', 'client_opportunities', 'client_interactions', 'client_tasks', 'client_imports'])
FROM phase_doc;
