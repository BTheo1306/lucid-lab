-- =============================================================================
-- Lucid OS Client Portal
-- =============================================================================
-- Adds the client-facing portal layer (client.lucid-lab.fr): portal access
-- flags and magic-link login tokens on client contacts, per-item client
-- visibility (tasks, interactions), client-safe meeting recaps, and the
-- two-way client_requests exchange table. RLS is enabled for every new public
-- table; access remains server-only via the service role. Portal reads are
-- scoped per authenticated contact in src/lib/portal/.

-- Portal columns on existing tables
ALTER TABLE client_contacts
	ADD COLUMN portal_access boolean NOT NULL DEFAULT false,
	ADD COLUMN portal_invited_at timestamptz,
	ADD COLUMN portal_last_login_at timestamptz;

ALTER TABLE client_tasks
	ADD COLUMN client_visible boolean NOT NULL DEFAULT false;

ALTER TABLE client_interactions
	ADD COLUMN client_visible boolean NOT NULL DEFAULT false,
	ADD COLUMN client_summary text;

-- Fireflies meeting recaps write client_interactions with source_system 'fireflies'
ALTER TABLE client_interactions DROP CONSTRAINT client_interactions_source_system_check;
ALTER TABLE client_interactions ADD CONSTRAINT client_interactions_source_system_check
	CHECK (source_system IN ('admin', 'tidycal', 'email', 'website', 'chat', 'github', 'obsidian', 'integration', 'agent', 'fireflies'));

-- Portal visitors act on their own data (requests, approvals, intake)
ALTER TABLE audit_events DROP CONSTRAINT audit_events_actor_type_check;
ALTER TABLE audit_events ADD CONSTRAINT audit_events_actor_type_check
	CHECK (actor_type IN ('admin', 'agent', 'automation', 'system', 'integration', 'client'));

-- Magic-link login and invite tokens (single use, hashed at rest)
CREATE TABLE portal_login_tokens (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
	client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
	contact_id uuid NOT NULL REFERENCES client_contacts(id) ON DELETE CASCADE,
	token_hash text NOT NULL,
	purpose text NOT NULL DEFAULT 'login',
	expires_at timestamptz NOT NULL,
	used_at timestamptz,
	created_ip text,
	used_ip text,
	metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
	created_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT portal_login_tokens_purpose_check CHECK (purpose IN ('login', 'invite'))
);

CREATE UNIQUE INDEX idx_portal_login_tokens_hash ON portal_login_tokens(token_hash);
CREATE INDEX idx_portal_login_tokens_contact_created ON portal_login_tokens(contact_id, created_at DESC);
CREATE INDEX idx_portal_login_tokens_expires ON portal_login_tokens(expires_at);

-- Two-way exchange between the agency and the client (questions, requests, approvals)
CREATE TABLE client_requests (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
	client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
	direction text NOT NULL,
	request_type text NOT NULL DEFAULT 'question',
	status text NOT NULL DEFAULT 'open',
	title text NOT NULL,
	body text,
	response_note text,
	created_by_contact_id uuid REFERENCES client_contacts(id) ON DELETE SET NULL,
	responded_by_contact_id uuid REFERENCES client_contacts(id) ON DELETE SET NULL,
	related_task_id uuid REFERENCES client_tasks(id) ON DELETE SET NULL,
	related_document_id uuid REFERENCES client_documents(id) ON DELETE SET NULL,
	due_at timestamptz,
	resolved_at timestamptz,
	metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT client_requests_direction_check CHECK (direction IN ('agency_to_client', 'client_to_agency')),
	CONSTRAINT client_requests_type_check CHECK (request_type IN ('question', 'change_request', 'asset_request', 'approval', 'info_request')),
	CONSTRAINT client_requests_status_check CHECK (status IN ('open', 'in_progress', 'waiting', 'approved', 'changes_requested', 'done', 'declined'))
);

CREATE INDEX idx_client_requests_client_status ON client_requests(client_id, status, updated_at DESC);
CREATE INDEX idx_client_requests_org_direction_status ON client_requests(organization_id, direction, status, updated_at DESC);

-- Partial indexes for the portal read paths
CREATE INDEX idx_client_contacts_portal_email ON client_contacts(organization_id, lower(email)) WHERE portal_access;
CREATE INDEX idx_client_tasks_client_visible ON client_tasks(client_id, status, due_at) WHERE client_visible;
CREATE INDEX idx_client_interactions_client_visible ON client_interactions(client_id, occurred_at DESC) WHERE client_visible;

CREATE TRIGGER client_requests_updated_at
	BEFORE UPDATE ON client_requests
	FOR EACH ROW
	EXECUTE FUNCTION touch_updated_at();

-- Server-only access (no policies): portal reads go through the service role,
-- scoped in code. Anon/authenticated access stays deny-all.
ALTER TABLE portal_login_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_requests ENABLE ROW LEVEL SECURITY;
