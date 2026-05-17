-- =============================================================================
-- Lucid OS Document Automation
-- =============================================================================
-- Adds the operational document layer for bon de commande and facture flows:
-- drafts, validation state, DocuSeal submissions, signer events, archive
-- locations, and billing events. RLS is enabled for every new public table; the
-- internal MVP continues to use server-only service-role access.

CREATE TABLE client_documents (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
	client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
	project_id uuid REFERENCES projects(id) ON DELETE SET NULL,
	opportunity_id uuid REFERENCES client_opportunities(id) ON DELETE SET NULL,
	primary_contact_id uuid REFERENCES client_contacts(id) ON DELETE SET NULL,
	document_type text NOT NULL,
	status text NOT NULL DEFAULT 'draft',
	title text NOT NULL,
	document_number text,
	template_key text NOT NULL,
	template_version text NOT NULL DEFAULT 'v1',
	currency text NOT NULL DEFAULT 'EUR',
	amount_ht_eur numeric(12,2),
	setup_amount_eur numeric(12,2),
	monthly_amount_eur numeric(12,2),
	vat_rate numeric(5,2) NOT NULL DEFAULT 20.00,
	vat_amount_eur numeric(12,2),
	amount_ttc_eur numeric(12,2),
	issued_at timestamptz,
	due_at timestamptz,
	sent_at timestamptz,
	viewed_at timestamptz,
	started_at timestamptz,
	completed_at timestamptz,
	declined_at timestamptz,
	expired_at timestamptz,
	archived_at timestamptz,
	docuseal_template_id text,
	docuseal_submission_id text,
	docuseal_submission_slug text,
	docuseal_submission_url text,
	docuseal_audit_log_url text,
	docuseal_combined_document_url text,
	google_drive_folder_id text,
	validation_errors jsonb NOT NULL DEFAULT '[]'::jsonb,
	generation_payload jsonb NOT NULL DEFAULT '{}'::jsonb,
	docuseal_response jsonb NOT NULL DEFAULT '{}'::jsonb,
	metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
	idempotency_key text,
	created_by text NOT NULL DEFAULT 'admin',
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT client_documents_type_check CHECK (document_type IN ('bon_de_commande', 'facture', 'contrat', 'proposal', 'other')),
	CONSTRAINT client_documents_status_check CHECK (status IN ('draft', 'needs_review', 'approved', 'generated', 'ready_to_send', 'sent_for_signature', 'viewed', 'in_progress', 'signed', 'declined', 'expired', 'cancelled', 'archived', 'failed')),
	CONSTRAINT client_documents_currency_check CHECK (currency IN ('EUR')),
	CONSTRAINT client_documents_amount_check CHECK (
		(amount_ht_eur IS NULL OR amount_ht_eur >= 0)
		AND (setup_amount_eur IS NULL OR setup_amount_eur >= 0)
		AND (monthly_amount_eur IS NULL OR monthly_amount_eur >= 0)
		AND vat_rate >= 0
		AND (vat_amount_eur IS NULL OR vat_amount_eur >= 0)
		AND (amount_ttc_eur IS NULL OR amount_ttc_eur >= 0)
	),
	CONSTRAINT client_documents_validation_errors_array CHECK (jsonb_typeof(validation_errors) = 'array')
);

CREATE TABLE client_document_recipients (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
	client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
	document_id uuid NOT NULL REFERENCES client_documents(id) ON DELETE CASCADE,
	contact_id uuid REFERENCES client_contacts(id) ON DELETE SET NULL,
	role text NOT NULL DEFAULT 'Client',
	name text,
	email text,
	phone text,
	status text NOT NULL DEFAULT 'pending',
	docuseal_submitter_id text,
	docuseal_submitter_uuid text,
	docuseal_submitter_slug text,
	docuseal_embed_src text,
	external_id text,
	values jsonb NOT NULL DEFAULT '[]'::jsonb,
	preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
	sent_at timestamptz,
	opened_at timestamptz,
	started_at timestamptz,
	completed_at timestamptz,
	declined_at timestamptz,
	decline_reason text,
	metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT client_document_recipients_status_check CHECK (status IN ('pending', 'awaiting', 'sent', 'opened', 'in_progress', 'completed', 'declined', 'expired', 'failed')),
	CONSTRAINT client_document_recipients_values_array CHECK (jsonb_typeof(values) = 'array')
);

CREATE TABLE client_document_events (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
	client_id uuid REFERENCES clients(id) ON DELETE SET NULL,
	document_id uuid REFERENCES client_documents(id) ON DELETE SET NULL,
	recipient_id uuid REFERENCES client_document_recipients(id) ON DELETE SET NULL,
	source text NOT NULL DEFAULT 'docuseal',
	event_type text NOT NULL,
	idempotency_key text,
	external_event_id text,
	external_submission_id text,
	external_submitter_id text,
	event_timestamp timestamptz NOT NULL DEFAULT now(),
	payload jsonb NOT NULL DEFAULT '{}'::jsonb,
	created_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT client_document_events_source_check CHECK (source IN ('lucid_os', 'docuseal', 'google_drive', 'system', 'other'))
);

CREATE TABLE client_document_storage_locations (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
	client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
	document_id uuid NOT NULL REFERENCES client_documents(id) ON DELETE CASCADE,
	storage_provider text NOT NULL DEFAULT 'google_drive',
	file_kind text NOT NULL,
	file_name text NOT NULL,
	file_id text,
	folder_id text,
	url text,
	mime_type text,
	size_bytes bigint,
	checksum text,
	metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT client_document_storage_provider_check CHECK (storage_provider IN ('google_drive', 'supabase_storage', 'docuseal', 'local', 'other')),
	CONSTRAINT client_document_storage_kind_check CHECK (file_kind IN ('draft_docx', 'draft_pdf', 'signed_pdf', 'audit_log', 'combined_pdf', 'invoice_pdf', 'source_docx', 'other')),
	CONSTRAINT client_document_storage_size_check CHECK (size_bytes IS NULL OR size_bytes >= 0)
);

CREATE TABLE client_billing_events (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
	client_id uuid NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
	opportunity_id uuid REFERENCES client_opportunities(id) ON DELETE SET NULL,
	document_id uuid REFERENCES client_documents(id) ON DELETE SET NULL,
	event_type text NOT NULL,
	billing_status text NOT NULL DEFAULT 'pending',
	currency text NOT NULL DEFAULT 'EUR',
	amount_ht_eur numeric(12,2),
	setup_amount_eur numeric(12,2),
	monthly_amount_eur numeric(12,2),
	vat_amount_eur numeric(12,2),
	amount_ttc_eur numeric(12,2),
	due_at timestamptz,
	occurred_at timestamptz NOT NULL DEFAULT now(),
	source text NOT NULL DEFAULT 'lucid_os',
	metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT client_billing_events_type_check CHECK (event_type IN ('bdc_drafted', 'bdc_sent', 'bdc_signed', 'invoice_generated', 'invoice_sent', 'payment_due', 'payment_received', 'payment_overdue', 'credit_note', 'other')),
	CONSTRAINT client_billing_events_status_check CHECK (billing_status IN ('pending', 'quoted', 'signed', 'invoiced', 'due', 'paid', 'overdue', 'cancelled')),
	CONSTRAINT client_billing_events_currency_check CHECK (currency IN ('EUR')),
	CONSTRAINT client_billing_events_amount_check CHECK (
		(amount_ht_eur IS NULL OR amount_ht_eur >= 0)
		AND (setup_amount_eur IS NULL OR setup_amount_eur >= 0)
		AND (monthly_amount_eur IS NULL OR monthly_amount_eur >= 0)
		AND (vat_amount_eur IS NULL OR vat_amount_eur >= 0)
		AND (amount_ttc_eur IS NULL OR amount_ttc_eur >= 0)
	)
);

CREATE INDEX idx_client_documents_client_status_updated ON client_documents(client_id, status, updated_at DESC);
CREATE INDEX idx_client_documents_organization_type_status ON client_documents(organization_id, document_type, status, updated_at DESC);
CREATE INDEX idx_client_documents_opportunity ON client_documents(opportunity_id) WHERE opportunity_id IS NOT NULL;
CREATE UNIQUE INDEX idx_client_documents_idempotency_unique ON client_documents(organization_id, idempotency_key) WHERE idempotency_key IS NOT NULL;
CREATE UNIQUE INDEX idx_client_documents_docuseal_submission_unique ON client_documents(organization_id, docuseal_submission_id) WHERE docuseal_submission_id IS NOT NULL;

CREATE INDEX idx_client_document_recipients_document_status ON client_document_recipients(document_id, status, updated_at DESC);
CREATE INDEX idx_client_document_recipients_client_email ON client_document_recipients(client_id, lower(email)) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX idx_client_document_recipients_docuseal_unique ON client_document_recipients(organization_id, docuseal_submitter_id) WHERE docuseal_submitter_id IS NOT NULL;

CREATE INDEX idx_client_document_events_document_created ON client_document_events(document_id, created_at DESC);
CREATE INDEX idx_client_document_events_client_created ON client_document_events(client_id, created_at DESC);
CREATE INDEX idx_client_document_events_external_submission ON client_document_events(organization_id, external_submission_id, created_at DESC) WHERE external_submission_id IS NOT NULL;
CREATE UNIQUE INDEX idx_client_document_events_idempotency_unique ON client_document_events(organization_id, source, idempotency_key) WHERE idempotency_key IS NOT NULL;

CREATE INDEX idx_client_document_storage_document_kind ON client_document_storage_locations(document_id, file_kind, created_at DESC);
CREATE INDEX idx_client_document_storage_client_provider ON client_document_storage_locations(client_id, storage_provider, created_at DESC);

CREATE INDEX idx_client_billing_events_client_created ON client_billing_events(client_id, occurred_at DESC);
CREATE INDEX idx_client_billing_events_organization_status_due ON client_billing_events(organization_id, billing_status, due_at);
CREATE INDEX idx_client_billing_events_document ON client_billing_events(document_id) WHERE document_id IS NOT NULL;

CREATE TRIGGER client_documents_updated_at
	BEFORE UPDATE ON client_documents
	FOR EACH ROW
	EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER client_document_recipients_updated_at
	BEFORE UPDATE ON client_document_recipients
	FOR EACH ROW
	EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER client_document_storage_locations_updated_at
	BEFORE UPDATE ON client_document_storage_locations
	FOR EACH ROW
	EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER client_billing_events_updated_at
	BEFORE UPDATE ON client_billing_events
	FOR EACH ROW
	EXECUTE FUNCTION touch_updated_at();

ALTER TABLE client_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_document_recipients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_document_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_document_storage_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_billing_events ENABLE ROW LEVEL SECURITY;

WITH lucid_org AS (
	SELECT id FROM organizations WHERE slug = 'lucid-lab'
)
INSERT INTO integrations (organization_id, name, provider, category, status, config, docs_url)
SELECT
	id,
	'DocuSeal',
	'docuseal',
	'workflow',
	'planned',
	jsonb_build_object(
		'hosting', 'railway',
		'custom_domain', 'sign.lucid-lab.fr',
		'purpose', 'bon_de_commande_signature'
	),
	'https://github.com/docusealco/docuseal'
FROM lucid_org
WHERE NOT EXISTS (
	SELECT 1 FROM integrations WHERE organization_id = lucid_org.id AND provider = 'docuseal'
);

WITH lucid_org AS (
	SELECT id FROM organizations WHERE slug = 'lucid-lab'
)
INSERT INTO integrations (organization_id, name, provider, category, status, config, docs_url)
SELECT
	id,
	'Google Drive',
	'google_drive',
	'other',
	'planned',
	jsonb_build_object(
		'purpose', 'client_document_archive',
		'auth_model', 'service_account_or_oauth'
	),
	'https://developers.google.com/drive/api'
FROM lucid_org
WHERE NOT EXISTS (
	SELECT 1 FROM integrations WHERE organization_id = lucid_org.id AND provider = 'google_drive'
);

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
		'supabase/migrations/20260516170200_lucid_os_document_automation.sql',
		'Lucid OS Document Automation Foundation',
		'lucid-os-document-automation-foundation',
		'active',
		'internal',
		now(),
		'Adds structured document, signature, archive, and billing event tables for DocuSeal-powered bon de commande and facture workflows.',
		'Lucid OS document automation tracks generated client documents from draft through approval, DocuSeal signature, Google Drive archive, and billing update. client_documents is the source of truth for each bon de commande, facture, contrat, proposal, or other document. client_document_recipients tracks signers and DocuSeal submitters. client_document_events stores webhook and system events with idempotency keys. client_document_storage_locations records Drive, DocuSeal, Supabase Storage, local, or other archive files. client_billing_events records quoted, signed, invoiced, due, paid, overdue, and cancelled billing states. External side effects still require server-only code, audit_events, and human approval before sending to clients.',
		jsonb_build_object(
			'workflow', 'docuseal_document_automation',
			'tables', ARRAY['client_documents', 'client_document_recipients', 'client_document_events', 'client_document_storage_locations', 'client_billing_events'],
			'internal_only', true,
			'docuseal_hosting', 'railway'
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
	'DocuSeal document automation foundation',
	'Use client_documents as the operational record for bon de commande and facture generation. Validate client, contact, opportunity, amount, VAT, template version, and Drive folder before sending. Use DocuSeal submissions for signature, client_document_events for webhooks, client_document_storage_locations for signed PDFs/audit logs in Google Drive, and client_billing_events for signed amount, invoice, payment, and dashboard rollups. Keep DocuSeal itself isolated on Railway with its own Postgres database; Lucid OS stores only business state and external IDs.',
	jsonb_build_object('workflow', 'docuseal_document_automation')
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
	WHERE kd.slug = 'lucid-os-document-automation-foundation'
)
INSERT INTO audit_events (organization_id, actor_type, event_type, target_table, target_id, risk_level, summary, details)
SELECT
	organization_id,
	'system',
	'lucid_os_document_automation_schema_seeded',
	'knowledge_documents',
	id,
	'low',
	'Lucid OS document automation schema and runtime knowledge added.',
	jsonb_build_object('migration', '20260516170200_lucid_os_document_automation', 'tables', ARRAY['client_documents', 'client_document_recipients', 'client_document_events', 'client_document_storage_locations', 'client_billing_events'])
FROM phase_doc;
