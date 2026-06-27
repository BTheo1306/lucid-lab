-- =============================================================================
-- Lead Engine v2: Signal-Led Outbound (LinkedIn-first)
-- =============================================================================
-- Additive migration. Extends the existing lead_engine schema
-- (20260427134527_lead_engine_schema.sql) for the redesigned outbound engine:
--   - automated LinkedIn channel + lifecycle events + run types
--   - multi-account sender model with per-account daily caps + counters
--   - outreach_messages reused as the send queue (assigned sender, step kind)
--   - buyer-role multi-threading + gap-selling research on prospect_people
--   - a vertical case-study library
--   - a workspace-level kill switch
--   - two seed campaigns (Motion 1 founders/SMB, Motion 2 bigger companies)
--     and the Anthony LinkedIn sender account
-- RLS stays deny-all (service-role only), matching the existing model.

-- =============================================================================
-- 1. Channel / event / run-type CHECK extensions (drop + re-add full lists)
-- =============================================================================

ALTER TABLE outreach_sequences DROP CONSTRAINT outreach_sequences_channel_check;
ALTER TABLE outreach_sequences ADD CONSTRAINT outreach_sequences_channel_check
	CHECK (channel IN ('email', 'linkedin', 'linkedin_manual', 'phone', 'other'));

ALTER TABLE outreach_messages DROP CONSTRAINT outreach_messages_channel_check;
ALTER TABLE outreach_messages ADD CONSTRAINT outreach_messages_channel_check
	CHECK (channel IN ('email', 'linkedin', 'linkedin_manual', 'phone', 'other'));

ALTER TABLE outreach_messages DROP CONSTRAINT outreach_messages_status_check;
ALTER TABLE outreach_messages ADD CONSTRAINT outreach_messages_status_check
	CHECK (status IN (
		'draft', 'approved', 'scheduled', 'queued', 'dispatched',
		'sent', 'failed', 'cancelled', 'skipped', 'handed_to_human',
		'replied', 'bounced', 'unsubscribed'
	));

ALTER TABLE outreach_events DROP CONSTRAINT outreach_events_event_type_check;
ALTER TABLE outreach_events ADD CONSTRAINT outreach_events_event_type_check
	CHECK (event_type IN (
		'draft_created', 'approved', 'sent', 'opened', 'clicked', 'replied',
		'bounced', 'unsubscribed', 'manual_linkedin_touch', 'meeting_booked',
		'converted_to_crm', 'disqualified',
		-- automated LinkedIn lifecycle (v2)
		'linkedin_invite_sent', 'linkedin_invite_accepted', 'linkedin_message_sent',
		'linkedin_replied', 'linkedin_profile_scraped', 'handed_to_human',
		'linkedin_send_failed', 'linkedin_send_skipped', 'kill_switch_engaged'
	));

ALTER TABLE lead_engine_runs DROP CONSTRAINT lead_engine_runs_run_type_check;
ALTER TABLE lead_engine_runs ADD CONSTRAINT lead_engine_runs_run_type_check
	CHECK (run_type IN (
		'company_discovery', 'company_enrichment', 'people_enrichment',
		'linkedin_profile_enrichment', 'scoring', 'outreach_draft_generation',
		'outreach_send', 'crm_conversion',
		-- v2 runs
		'theirstack_source', 'gouv_enrich', 'gap_selling_research',
		'send_queue_build', 'reply_sync'
	));

-- =============================================================================
-- 2. Workspace kill switch
-- =============================================================================

ALTER TABLE lead_engine_workspaces
	ADD COLUMN IF NOT EXISTS outreach_enabled boolean NOT NULL DEFAULT true;

-- =============================================================================
-- 3. prospect_people: buyer role + gap-selling research
-- =============================================================================

ALTER TABLE prospect_people
	ADD COLUMN IF NOT EXISTS buyer_role text NOT NULL DEFAULT 'unknown',
	ADD COLUMN IF NOT EXISTS research jsonb NOT NULL DEFAULT '{}'::jsonb;

ALTER TABLE prospect_people
	ADD CONSTRAINT prospect_people_buyer_role_check
	CHECK (buyer_role IN (
		'champion', 'economic_buyer', 'executive_sponsor',
		'founder_ceo', 'end_user', 'unknown'
	));

-- =============================================================================
-- 4. Sender accounts (multi-account) + per-account daily counters
-- =============================================================================

CREATE TABLE outreach_sender_accounts (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	workspace_id uuid NOT NULL REFERENCES lead_engine_workspaces(id) ON DELETE CASCADE,
	label text NOT NULL,
	channel text NOT NULL DEFAULT 'linkedin',
	identifier text,
	status text NOT NULL DEFAULT 'active',
	daily_invite_cap integer NOT NULL DEFAULT 20,
	daily_message_cap integer NOT NULL DEFAULT 30,
	business_hours_start smallint NOT NULL DEFAULT 9,
	business_hours_end smallint NOT NULL DEFAULT 18,
	timezone text NOT NULL DEFAULT 'Europe/Paris',
	runner_token_hash text,
	last_seen_at timestamptz,
	session_expired boolean NOT NULL DEFAULT false,
	metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT outreach_sender_accounts_channel_check CHECK (channel IN ('linkedin', 'email')),
	CONSTRAINT outreach_sender_accounts_status_check CHECK (status IN ('active', 'paused', 'cooldown', 'disabled')),
	CONSTRAINT outreach_sender_accounts_hours_check CHECK (
		business_hours_start >= 0 AND business_hours_start < 24
		AND business_hours_end > business_hours_start AND business_hours_end <= 24
	),
	CONSTRAINT outreach_sender_accounts_caps_check CHECK (daily_invite_cap >= 0 AND daily_message_cap >= 0),
	UNIQUE (workspace_id, label, channel)
);

CREATE TABLE outreach_sender_daily_counters (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	sender_account_id uuid NOT NULL REFERENCES outreach_sender_accounts(id) ON DELETE CASCADE,
	counter_date date NOT NULL,
	invites_sent integer NOT NULL DEFAULT 0,
	messages_sent integer NOT NULL DEFAULT 0,
	invites_accepted integer NOT NULL DEFAULT 0,
	replies integer NOT NULL DEFAULT 0,
	errors integer NOT NULL DEFAULT 0,
	UNIQUE (sender_account_id, counter_date),
	CONSTRAINT outreach_sender_daily_counters_nonneg CHECK (
		invites_sent >= 0 AND messages_sent >= 0 AND invites_accepted >= 0
		AND replies >= 0 AND errors >= 0
	)
);

-- =============================================================================
-- 5. outreach_messages reused as the send queue
-- =============================================================================

ALTER TABLE outreach_messages
	ADD COLUMN IF NOT EXISTS sender_account_id uuid REFERENCES outreach_sender_accounts(id) ON DELETE SET NULL,
	ADD COLUMN IF NOT EXISTS step_kind text,
	ADD COLUMN IF NOT EXISTS dispatched_at timestamptz,
	ADD COLUMN IF NOT EXISTS attempt_count integer NOT NULL DEFAULT 0,
	ADD COLUMN IF NOT EXISTS linkedin_thread_url text,
	ADD COLUMN IF NOT EXISTS parent_message_id uuid REFERENCES outreach_messages(id) ON DELETE SET NULL;

ALTER TABLE outreach_messages
	ADD CONSTRAINT outreach_messages_step_kind_check
	CHECK (step_kind IS NULL OR step_kind IN ('invite', 'followup', 'email', 'human_touch'));

-- Queue pull: "what is due for sender X right now?"
CREATE INDEX idx_outreach_messages_queue
	ON outreach_messages (sender_account_id, status, scheduled_at)
	WHERE status IN ('queued', 'scheduled');

-- =============================================================================
-- 6. Vertical case-study library (proof points for gap-selling drafts)
-- =============================================================================

CREATE TABLE outreach_case_studies (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	workspace_id uuid NOT NULL REFERENCES lead_engine_workspaces(id) ON DELETE CASCADE,
	vertical text NOT NULL,
	client_label text,
	problem text NOT NULL,
	solution text,
	metric text,
	proof_line text NOT NULL,
	language text NOT NULL DEFAULT 'fr',
	is_real boolean NOT NULL DEFAULT true,
	is_active boolean NOT NULL DEFAULT true,
	metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT outreach_case_studies_language_check CHECK (language IN ('fr', 'en'))
);

-- =============================================================================
-- 7. Indexes
-- =============================================================================

CREATE INDEX idx_outreach_sender_accounts_workspace ON outreach_sender_accounts(workspace_id, status);
CREATE INDEX idx_outreach_sender_daily_counters_account_date ON outreach_sender_daily_counters(sender_account_id, counter_date DESC);
CREATE INDEX idx_outreach_messages_sender_status ON outreach_messages(sender_account_id, status);
CREATE INDEX idx_outreach_case_studies_workspace_vertical ON outreach_case_studies(workspace_id, vertical) WHERE is_active;
CREATE INDEX idx_prospect_people_workspace_buyer_role ON prospect_people(workspace_id, buyer_role);

-- =============================================================================
-- 8. Triggers (updated_at)
-- =============================================================================

CREATE TRIGGER outreach_sender_accounts_updated_at
	BEFORE UPDATE ON outreach_sender_accounts
	FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

CREATE TRIGGER outreach_case_studies_updated_at
	BEFORE UPDATE ON outreach_case_studies
	FOR EACH ROW EXECUTE FUNCTION touch_updated_at();

-- =============================================================================
-- 9. RLS: deny-all by default; service role bypasses (matches existing model)
-- =============================================================================

ALTER TABLE outreach_sender_accounts       ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_sender_daily_counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_case_studies          ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- 10. Seed: two campaigns (Motion 1 + Motion 2), Anthony sender, case study
-- =============================================================================

-- Motion 1: Founders / small companies, Claude + Obsidian setup (2-5k)
INSERT INTO lead_engine_campaigns (
	workspace_id, name, status,
	target_niches, target_locations, target_languages,
	min_employee_count, ideal_employee_min, ideal_employee_max,
	icp_config, scoring_config, outreach_config
)
SELECT
	ws.id,
	'Motion 1: Fondateurs & PME (Claude + Obsidian)',
	'draft',
	ARRAY['startup', 'pme', 'tpe', 'agence', 'cabinet', 'ecommerce', 'industrie_legere'],
	ARRAY['France', 'Belgium', 'Switzerland', 'Luxembourg'],
	ARRAY['fr', 'en'],
	1, 1, 20,
	jsonb_build_object(
		'motion', 'founder_smb',
		'offer', 'Setup Claude + Obsidian (2-5k EUR)',
		'target_roles', ARRAY['Founder', 'Co-founder', 'CEO', 'COO', 'Gérant', 'Dirigeant', 'Président'],
		'target_buyer_roles', ARRAY['founder_ceo'],
		'channels', ARRAY['linkedin'],
		'sourcing', ARRAY['pappers', 'communities', 'incubators', 'referrals'],
		'excluded_niches', ARRAY['real_estate', 'medical', 'restaurant_low_budget']
	),
	jsonb_build_object(
		'score_version', 'lead_engine_v2_enterprise_ai',
		'max_score', 20,
		'priority_thresholds', jsonb_build_object('high', 15, 'medium', 10, 'low', 6),
		'human_touch_priority', 'high'
	),
	jsonb_build_object(
		'framework', 'gap_selling',
		'sequence', ARRAY['linkedin_invite', 'linkedin_followup'],
		'cta', 'un échange de 30 minutes',
		'max_steps', 2
	)
FROM lead_engine_workspaces ws
WHERE ws.slug = 'lucid-lab'
	AND NOT EXISTS (
		SELECT 1 FROM lead_engine_campaigns c
		WHERE c.workspace_id = ws.id AND c.name = 'Motion 1: Fondateurs & PME (Claude + Obsidian)'
	);

-- Motion 2: Bigger companies (10+): AI audit + roadmap + training. Hiring-signal led.
INSERT INTO lead_engine_campaigns (
	workspace_id, name, status,
	target_niches, target_locations, target_languages,
	min_employee_count, ideal_employee_min, ideal_employee_max,
	icp_config, scoring_config, outreach_config
)
SELECT
	ws.id,
	'Motion 2: Grandes structures (Audit + Roadmap IA)',
	'draft',
	ARRAY['scaleup', 'eti', 'industrie', 'services', 'finance', 'sante_admin', 'retail'],
	ARRAY['France', 'Belgium', 'Switzerland', 'Luxembourg'],
	ARRAY['fr', 'en'],
	10, 10, 200,
	jsonb_build_object(
		'motion', 'enterprise',
		'offer', 'Audit IA + feuille de route + formation',
		'hiring_roles', ARRAY['COO', 'CAO', 'Chief AI Officer', 'Head of AI', 'Head of Data', 'VP Operations', 'AI Project Manager', 'IT Project Manager', 'Chef de projet IA', 'Responsable transformation'],
		'target_buyer_roles', ARRAY['champion', 'economic_buyer', 'executive_sponsor'],
		'channels', ARRAY['linkedin'],
		'sourcing', ARRAY['theirstack', 'pappers'],
		'excluded_niches', ARRAY['real_estate', 'medical', 'restaurant_low_budget']
	),
	jsonb_build_object(
		'score_version', 'lead_engine_v2_enterprise_ai',
		'max_score', 20,
		'priority_thresholds', jsonb_build_object('high', 16, 'medium', 11, 'low', 7),
		'human_touch_priority', 'high',
		'weights', jsonb_build_object(
			'hiring_role_exec', 8, 'hiring_role_pm', 5, 'founder_or_c_suite', 4,
			'employee_band_fit', 3, 'ai_interest', 2, 'geo_fit', 2, 'reachable_channel', 1
		)
	),
	jsonb_build_object(
		'framework', 'gap_selling',
		'sequence', ARRAY['linkedin_invite', 'linkedin_followup'],
		'cta', 'un atelier de 30 minutes',
		'max_steps', 2
	)
FROM lead_engine_workspaces ws
WHERE ws.slug = 'lucid-lab'
	AND NOT EXISTS (
		SELECT 1 FROM lead_engine_campaigns c
		WHERE c.workspace_id = ws.id AND c.name = 'Motion 2: Grandes structures (Audit + Roadmap IA)'
	);

-- Anthony LinkedIn sender (runner_token_hash set later when the token is generated)
INSERT INTO outreach_sender_accounts (
	workspace_id, label, channel, status,
	daily_invite_cap, daily_message_cap, business_hours_start, business_hours_end, timezone,
	metadata
)
SELECT
	ws.id, 'Anthony', 'linkedin', 'active',
	20, 30, 9, 18, 'Europe/Paris',
	jsonb_build_object('runs_on', 'jules_computer', 'warmup', true, 'note', 'Real logged-in Chrome profile; ramp from ~5/day.')
FROM lead_engine_workspaces ws
WHERE ws.slug = 'lucid-lab'
	AND NOT EXISTS (
		SELECT 1 FROM outreach_sender_accounts s
		WHERE s.workspace_id = ws.id AND s.label = 'Anthony' AND s.channel = 'linkedin'
	);

-- Case-study library: the real printing-company proof point (from delivered work).
INSERT INTO outreach_case_studies (
	workspace_id, vertical, client_label, problem, solution, metric, proof_line, language, is_real
)
SELECT
	ws.id, 'imprimerie', 'Imprimerie (PME)',
	'Devis et suivi administratif faits à la main, chronophages et source d''erreurs.',
	'Setup Claude + Obsidian: contacts centralisés, pipeline de devis automatique, paiements et finances suivis automatiquement.',
	'Devis générés automatiquement à chaque email entrant, suivi financier et CRM automatisés.',
	'Pour une imprimerie, nous avons automatisé la génération des devis et le suivi financier avec un setup Claude + Obsidian.',
	'fr', true
FROM lead_engine_workspaces ws
WHERE ws.slug = 'lucid-lab'
	AND NOT EXISTS (
		SELECT 1 FROM outreach_case_studies cs
		WHERE cs.workspace_id = ws.id AND cs.vertical = 'imprimerie'
	);
