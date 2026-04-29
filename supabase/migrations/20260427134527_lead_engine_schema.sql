-- =============================================================================
-- Lucid-Lab Lead Engine Schema
-- =============================================================================
-- Outbound prospecting, scoring, worker runs, outreach drafts/events, and CRM handoff.
-- RLS is enabled on every table; no policies are added yet, matching the existing
-- service-role-only admin/bot access model.

-- =============================================
-- CORE LEAD ENGINE TABLES
-- =============================================

CREATE TABLE lead_engine_workspaces (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	name text NOT NULL,
	slug text NOT NULL UNIQUE,
	owner_label text,
	default_language text NOT NULL DEFAULT 'fr',
	settings jsonb NOT NULL DEFAULT '{}'::jsonb,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT lead_engine_workspaces_default_language_check CHECK (default_language IN ('fr', 'en'))
);

CREATE TABLE lead_engine_campaigns (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	workspace_id uuid NOT NULL REFERENCES lead_engine_workspaces(id) ON DELETE CASCADE,
	name text NOT NULL,
	status text NOT NULL DEFAULT 'draft',
	target_niches text[] NOT NULL DEFAULT '{}'::text[],
	target_locations text[] NOT NULL DEFAULT '{}'::text[],
	target_languages text[] NOT NULL DEFAULT '{}'::text[],
	min_employee_count integer NOT NULL DEFAULT 5,
	ideal_employee_min integer NOT NULL DEFAULT 10,
	ideal_employee_max integer NOT NULL DEFAULT 100,
	icp_config jsonb NOT NULL DEFAULT '{}'::jsonb,
	scoring_config jsonb NOT NULL DEFAULT '{}'::jsonb,
	outreach_config jsonb NOT NULL DEFAULT '{}'::jsonb,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT lead_engine_campaigns_status_check CHECK (status IN ('draft', 'active', 'paused', 'completed', 'archived')),
	CONSTRAINT lead_engine_campaigns_employee_count_check CHECK (
		min_employee_count >= 0
		AND ideal_employee_min >= 0
		AND ideal_employee_max >= ideal_employee_min
	)
);

CREATE TABLE lead_engine_runs (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	workspace_id uuid NOT NULL REFERENCES lead_engine_workspaces(id) ON DELETE CASCADE,
	campaign_id uuid REFERENCES lead_engine_campaigns(id) ON DELETE SET NULL,
	run_type text NOT NULL,
	status text NOT NULL DEFAULT 'queued',
	config jsonb NOT NULL DEFAULT '{}'::jsonb,
	summary jsonb NOT NULL DEFAULT '{}'::jsonb,
	total_count integer NOT NULL DEFAULT 0,
	processed_count integer NOT NULL DEFAULT 0,
	success_count integer NOT NULL DEFAULT 0,
	not_found_count integer NOT NULL DEFAULT 0,
	blocked_count integer NOT NULL DEFAULT 0,
	error_count integer NOT NULL DEFAULT 0,
	session_expired boolean NOT NULL DEFAULT false,
	started_at timestamptz,
	finished_at timestamptz,
	last_checkpoint jsonb,
	error_message text,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT lead_engine_runs_run_type_check CHECK (run_type IN (
		'company_discovery',
		'company_enrichment',
		'people_enrichment',
		'linkedin_profile_enrichment',
		'scoring',
		'outreach_draft_generation',
		'outreach_send',
		'crm_conversion'
	)),
	CONSTRAINT lead_engine_runs_status_check CHECK (status IN (
		'queued',
		'running',
		'completed',
		'completed_with_errors',
		'failed',
		'cancelled',
		'paused'
	)),
	CONSTRAINT lead_engine_runs_count_check CHECK (
		total_count >= 0
		AND processed_count >= 0
		AND success_count >= 0
		AND not_found_count >= 0
		AND blocked_count >= 0
		AND error_count >= 0
	)
);

CREATE TABLE prospect_companies (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	workspace_id uuid NOT NULL REFERENCES lead_engine_workspaces(id) ON DELETE CASCADE,
	campaign_id uuid REFERENCES lead_engine_campaigns(id) ON DELETE SET NULL,
	name text NOT NULL,
	domain text,
	website_url text,
	linkedin_url text,
	country text,
	city text,
	region text,
	industry text,
	niche text,
	employee_count integer,
	employee_count_source text,
	revenue_estimate text,
	description text,
	source text,
	source_url text,
	status text NOT NULL DEFAULT 'discovered',
	validation_status text NOT NULL DEFAULT 'unknown',
	disqualification_reason text,
	raw_data jsonb NOT NULL DEFAULT '{}'::jsonb,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT prospect_companies_status_check CHECK (status IN (
		'discovered',
		'enriched',
		'validated',
		'approved',
		'contacted',
		'replied',
		'meeting_booked',
		'converted',
		'disqualified',
		'do_not_contact'
	)),
	CONSTRAINT prospect_companies_validation_status_check CHECK (validation_status IN (
		'unknown',
		'pending',
		'valid',
		'validated',
		'invalid',
		'disqualified',
		'needs_review'
	)),
	CONSTRAINT prospect_companies_employee_count_check CHECK (employee_count IS NULL OR employee_count >= 0)
);

CREATE TABLE prospect_people (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	workspace_id uuid NOT NULL REFERENCES lead_engine_workspaces(id) ON DELETE CASCADE,
	company_id uuid NOT NULL REFERENCES prospect_companies(id) ON DELETE CASCADE,
	contact_id uuid REFERENCES contacts(id) ON DELETE SET NULL,
	lead_id uuid REFERENCES leads(id) ON DELETE SET NULL,
	first_name text,
	last_name text,
	full_name text,
	title text,
	department text,
	seniority text,
	email text,
	email_status text NOT NULL DEFAULT 'unknown',
	linkedin_url text,
	phone text,
	language text,
	country text,
	status text NOT NULL DEFAULT 'discovered',
	validation_status text NOT NULL DEFAULT 'unknown',
	preferred_channel text,
	last_contacted_at timestamptz,
	last_replied_at timestamptz,
	disqualification_reason text,
	raw_data jsonb NOT NULL DEFAULT '{}'::jsonb,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT prospect_people_email_status_check CHECK (email_status IN ('unknown', 'valid', 'risky', 'invalid', 'bounced', 'unsubscribed', 'suppressed')),
	CONSTRAINT prospect_people_status_check CHECK (status IN (
		'discovered',
		'enriched',
		'validated',
		'approved',
		'contacted',
		'replied',
		'meeting_booked',
		'converted',
		'disqualified',
		'do_not_contact'
	)),
	CONSTRAINT prospect_people_validation_status_check CHECK (validation_status IN (
		'unknown',
		'pending',
		'valid',
		'validated',
		'invalid',
		'disqualified',
		'needs_review'
	))
);

CREATE TABLE prospect_signals (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	workspace_id uuid NOT NULL REFERENCES lead_engine_workspaces(id) ON DELETE CASCADE,
	company_id uuid REFERENCES prospect_companies(id) ON DELETE CASCADE,
	person_id uuid REFERENCES prospect_people(id) ON DELETE CASCADE,
	run_id uuid REFERENCES lead_engine_runs(id) ON DELETE SET NULL,
	signal_type text NOT NULL,
	label text NOT NULL,
	value jsonb,
	score_delta integer NOT NULL DEFAULT 0,
	confidence numeric(4,3),
	source text,
	source_url text,
	evidence text,
	detected_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT prospect_signals_target_check CHECK (company_id IS NOT NULL OR person_id IS NOT NULL),
	CONSTRAINT prospect_signals_confidence_check CHECK (confidence IS NULL OR (confidence >= 0 AND confidence <= 1))
);

CREATE TABLE prospect_scores (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	workspace_id uuid NOT NULL REFERENCES lead_engine_workspaces(id) ON DELETE CASCADE,
	company_id uuid NOT NULL REFERENCES prospect_companies(id) ON DELETE CASCADE,
	person_id uuid REFERENCES prospect_people(id) ON DELETE CASCADE,
	campaign_id uuid REFERENCES lead_engine_campaigns(id) ON DELETE SET NULL,
	score integer NOT NULL,
	max_score integer NOT NULL DEFAULT 20,
	priority text NOT NULL,
	score_version text NOT NULL DEFAULT 'lead_engine_v1',
	factors jsonb NOT NULL DEFAULT '[]'::jsonb,
	created_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT prospect_scores_priority_check CHECK (priority IN ('high', 'medium', 'low', 'skip')),
	CONSTRAINT prospect_scores_score_check CHECK (score >= 0 AND max_score > 0 AND score <= max_score)
);

-- =============================================
-- OUTREACH TABLES
-- =============================================

CREATE TABLE outreach_sequences (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	workspace_id uuid NOT NULL REFERENCES lead_engine_workspaces(id) ON DELETE CASCADE,
	campaign_id uuid REFERENCES lead_engine_campaigns(id) ON DELETE SET NULL,
	name text NOT NULL,
	status text NOT NULL DEFAULT 'draft',
	language text NOT NULL DEFAULT 'fr',
	channel text NOT NULL DEFAULT 'email',
	settings jsonb NOT NULL DEFAULT '{}'::jsonb,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT outreach_sequences_status_check CHECK (status IN ('draft', 'active', 'paused', 'archived')),
	CONSTRAINT outreach_sequences_channel_check CHECK (channel IN ('email', 'linkedin_manual', 'phone', 'other'))
);

CREATE TABLE outreach_sequence_steps (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	sequence_id uuid NOT NULL REFERENCES outreach_sequences(id) ON DELETE CASCADE,
	step_number integer NOT NULL,
	delay_hours integer NOT NULL DEFAULT 0,
	subject_template text,
	body_template text NOT NULL,
	cta text,
	is_active boolean NOT NULL DEFAULT true,
	created_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT outreach_sequence_steps_step_number_check CHECK (step_number > 0),
	CONSTRAINT outreach_sequence_steps_delay_hours_check CHECK (delay_hours >= 0),
	UNIQUE (sequence_id, step_number)
);

CREATE TABLE outreach_messages (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	workspace_id uuid NOT NULL REFERENCES lead_engine_workspaces(id) ON DELETE CASCADE,
	campaign_id uuid REFERENCES lead_engine_campaigns(id) ON DELETE SET NULL,
	sequence_id uuid REFERENCES outreach_sequences(id) ON DELETE SET NULL,
	sequence_step_id uuid REFERENCES outreach_sequence_steps(id) ON DELETE SET NULL,
	company_id uuid REFERENCES prospect_companies(id) ON DELETE SET NULL,
	person_id uuid REFERENCES prospect_people(id) ON DELETE SET NULL,
	status text NOT NULL DEFAULT 'draft',
	channel text NOT NULL DEFAULT 'email',
	to_email text,
	from_email text,
	subject text,
	body_text text,
	body_html text,
	personalization jsonb NOT NULL DEFAULT '{}'::jsonb,
	provider text,
	provider_message_id text,
	scheduled_at timestamptz,
	sent_at timestamptz,
	approved_at timestamptz,
	approved_by text,
	error_message text,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT outreach_messages_status_check CHECK (status IN ('draft', 'approved', 'scheduled', 'sent', 'failed', 'cancelled', 'replied', 'bounced', 'unsubscribed')),
	CONSTRAINT outreach_messages_channel_check CHECK (channel IN ('email', 'linkedin_manual', 'phone', 'other'))
);

CREATE TABLE outreach_events (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	workspace_id uuid NOT NULL REFERENCES lead_engine_workspaces(id) ON DELETE CASCADE,
	message_id uuid REFERENCES outreach_messages(id) ON DELETE SET NULL,
	company_id uuid REFERENCES prospect_companies(id) ON DELETE SET NULL,
	person_id uuid REFERENCES prospect_people(id) ON DELETE SET NULL,
	event_type text NOT NULL,
	provider text,
	provider_event_id text,
	payload jsonb NOT NULL DEFAULT '{}'::jsonb,
	created_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT outreach_events_event_type_check CHECK (event_type IN (
		'draft_created',
		'approved',
		'sent',
		'opened',
		'clicked',
		'replied',
		'bounced',
		'unsubscribed',
		'manual_linkedin_touch',
		'meeting_booked',
		'converted_to_crm',
		'disqualified'
	))
);

CREATE TABLE suppression_list (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	workspace_id uuid NOT NULL REFERENCES lead_engine_workspaces(id) ON DELETE CASCADE,
	email text,
	domain text,
	linkedin_url text,
	reason text NOT NULL,
	source text,
	created_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT suppression_list_reason_check CHECK (reason IN ('unsubscribed', 'bounced', 'manual_do_not_contact', 'excluded_industry', 'gdpr_request', 'client_blacklist')),
	CONSTRAINT suppression_list_identifier_check CHECK (email IS NOT NULL OR domain IS NOT NULL OR linkedin_url IS NOT NULL)
);

-- =============================================
-- INDEXES
-- =============================================

CREATE INDEX idx_lead_engine_campaigns_workspace_status ON lead_engine_campaigns(workspace_id, status);
CREATE INDEX idx_lead_engine_runs_workspace_status_created ON lead_engine_runs(workspace_id, status, created_at DESC);
CREATE INDEX idx_lead_engine_runs_campaign_created ON lead_engine_runs(campaign_id, created_at DESC);
CREATE INDEX idx_prospect_companies_workspace_status_created ON prospect_companies(workspace_id, status, created_at DESC);
CREATE INDEX idx_prospect_companies_workspace_validation ON prospect_companies(workspace_id, validation_status);
CREATE INDEX idx_prospect_companies_workspace_domain ON prospect_companies(workspace_id, domain);
CREATE INDEX idx_prospect_companies_campaign_status ON prospect_companies(campaign_id, status);
CREATE INDEX idx_prospect_people_workspace_status_created ON prospect_people(workspace_id, status, created_at DESC);
CREATE INDEX idx_prospect_people_company ON prospect_people(company_id);
CREATE INDEX idx_prospect_people_workspace_email ON prospect_people(workspace_id, email);
CREATE INDEX idx_prospect_signals_company_signal_type ON prospect_signals(company_id, signal_type);
CREATE INDEX idx_prospect_scores_workspace_score ON prospect_scores(workspace_id, score DESC);
CREATE INDEX idx_prospect_scores_company_created ON prospect_scores(company_id, created_at DESC);
CREATE INDEX idx_outreach_messages_workspace_status_created ON outreach_messages(workspace_id, status, created_at DESC);
CREATE INDEX idx_outreach_messages_person_created ON outreach_messages(person_id, created_at DESC);
CREATE INDEX idx_outreach_events_person_created ON outreach_events(person_id, created_at DESC);
CREATE INDEX idx_suppression_list_workspace_email ON suppression_list(workspace_id, email);
CREATE INDEX idx_suppression_list_workspace_domain ON suppression_list(workspace_id, domain);

CREATE INDEX idx_prospect_signals_person_signal_type ON prospect_signals(person_id, signal_type);
CREATE INDEX idx_outreach_events_message_created ON outreach_events(message_id, created_at DESC);
CREATE UNIQUE INDEX idx_suppression_list_workspace_email_unique ON suppression_list(workspace_id, lower(email)) WHERE email IS NOT NULL;
CREATE UNIQUE INDEX idx_suppression_list_workspace_domain_unique ON suppression_list(workspace_id, lower(domain)) WHERE domain IS NOT NULL;

-- =============================================
-- TRIGGERS
-- =============================================

CREATE TRIGGER lead_engine_workspaces_updated_at
	BEFORE UPDATE ON lead_engine_workspaces
	FOR EACH ROW
	EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER lead_engine_campaigns_updated_at
	BEFORE UPDATE ON lead_engine_campaigns
	FOR EACH ROW
	EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER lead_engine_runs_updated_at
	BEFORE UPDATE ON lead_engine_runs
	FOR EACH ROW
	EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER prospect_companies_updated_at
	BEFORE UPDATE ON prospect_companies
	FOR EACH ROW
	EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER prospect_people_updated_at
	BEFORE UPDATE ON prospect_people
	FOR EACH ROW
	EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER outreach_sequences_updated_at
	BEFORE UPDATE ON outreach_sequences
	FOR EACH ROW
	EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER outreach_messages_updated_at
	BEFORE UPDATE ON outreach_messages
	FOR EACH ROW
	EXECUTE FUNCTION touch_updated_at();

-- =============================================
-- RLS — deny-all by default; admin/worker uses service role server-side
-- =============================================

ALTER TABLE lead_engine_workspaces   ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_engine_campaigns    ENABLE ROW LEVEL SECURITY;
ALTER TABLE lead_engine_runs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospect_companies       ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospect_people          ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospect_signals         ENABLE ROW LEVEL SECURITY;
ALTER TABLE prospect_scores          ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_sequences       ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_sequence_steps  ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_messages        ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_events          ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppression_list         ENABLE ROW LEVEL SECURITY;

-- No policies = deny all access to anon/authenticated roles.
-- The service_role key bypasses RLS and must remain server-side only.

-- =============================================
-- SEED DATA
-- =============================================

WITH lucid_workspace AS (
	INSERT INTO lead_engine_workspaces (name, slug, owner_label, default_language, settings)
	VALUES (
		'Lucid-Lab',
		'lucid-lab',
		'Lucid-Lab',
		'fr',
		jsonb_build_object(
			'positioning', 'AI Lead Search & Outreach Engine',
			'primary_offer', 'Lead Leakage & Operations Audit'
		)
	)
	ON CONFLICT (slug) DO UPDATE SET
		name = EXCLUDED.name,
		owner_label = EXCLUDED.owner_label,
		default_language = EXCLUDED.default_language,
		settings = lead_engine_workspaces.settings || EXCLUDED.settings,
		updated_at = now()
	RETURNING id
)
INSERT INTO lead_engine_campaigns (
	workspace_id,
	name,
	status,
	target_niches,
	target_locations,
	target_languages,
	min_employee_count,
	ideal_employee_min,
	ideal_employee_max,
	icp_config,
	scoring_config,
	outreach_config
)
SELECT
	id,
	'Mobility, Rental & Tourism - FR/EN',
	'draft',
	ARRAY[
		'vehicle_rental',
		'long_term_rental',
		'mobility',
		'private_transport',
		'airport_transfer',
		'premium_tourism',
		'experience_operator'
	],
	ARRAY['France', 'Belgium', 'Switzerland', 'Luxembourg'],
	ARRAY['fr', 'en'],
	5,
	10,
	100,
	jsonb_build_object(
		'excluded_niches', ARRAY['real estate', 'medical', 'low-budget restaurants'],
		'proof_point', 'long-term rental company case study',
		'target_roles', ARRAY['Founder', 'CEO', 'Managing Director', 'COO', 'Operations Manager', 'Sales Director', 'Revenue Lead', 'Marketing Lead', 'Customer Support Lead', 'Customer Experience Manager']
	),
	jsonb_build_object(
		'score_version', 'lead_engine_v1',
		'max_score', 20,
		'priority_thresholds', jsonb_build_object('high', 16, 'medium', 11, 'low', 7),
		'hard_disqualifiers', ARRAY['real_estate', 'medical', 'restaurant_low_budget']
	),
	jsonb_build_object(
		'core_message_angles', ARRAY['lead leakage', 'manual customer handling', 'slow response time', 'CRM discipline', 'review follow-up'],
		'cta', '20-30 minute discovery call',
		'audit_offer', 'Lead Leakage & Operations Audit starting at EUR 2k',
		'build_offer', 'Custom builds start at EUR 5k/month retainer',
		'approval_required', true
	)
FROM lucid_workspace
WHERE NOT EXISTS (
	SELECT 1
	FROM lead_engine_campaigns
	WHERE workspace_id = lucid_workspace.id
		AND name = 'Mobility, Rental & Tourism - FR/EN'
);
