-- =============================================================================
-- Lucid OS: social content posts (LinkedIn-first)
-- =============================================================================
-- Manages the LinkedIn (and future social) content pipeline: drafts, the weekly
-- review queue, what was posted, and per-post metrics. Workflow:
--   draft -> queued (weekly review) -> approved -> posted.
-- "Silence = approval": a queued post left unchanged past its review window is
-- treated as approved (enforced in app logic). RLS is enabled; the internal MVP
-- uses server-only service-role access, consistent with other Lucid OS tables.

CREATE TABLE social_posts (
	id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
	platform text NOT NULL DEFAULT 'linkedin',
	author_label text NOT NULL DEFAULT 'company',
	pillar text,
	hook text,
	body text NOT NULL,
	link_in_comment text,
	status text NOT NULL DEFAULT 'draft',
	review_note text,
	scheduled_for timestamptz,
	posted_at timestamptz,
	post_url text,
	impressions integer,
	reactions integer,
	comments integer,
	reposts integer,
	clicks integer,
	metrics_updated_at timestamptz,
	metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
	created_at timestamptz NOT NULL DEFAULT now(),
	updated_at timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT social_posts_platform_check CHECK (platform IN ('linkedin', 'x', 'youtube', 'other')),
	CONSTRAINT social_posts_status_check CHECK (status IN ('draft', 'queued', 'approved', 'posted', 'rejected', 'skipped'))
);

CREATE INDEX social_posts_org_status_idx ON social_posts (organization_id, status);
CREATE INDEX social_posts_scheduled_for_idx ON social_posts (scheduled_for);

CREATE OR REPLACE FUNCTION social_posts_set_updated_at()
RETURNS trigger AS $$
BEGIN
	NEW.updated_at := now();
	RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER social_posts_set_updated_at
	BEFORE UPDATE ON social_posts
	FOR EACH ROW EXECUTE FUNCTION social_posts_set_updated_at();

ALTER TABLE social_posts ENABLE ROW LEVEL SECURITY;
