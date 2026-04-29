-- =============================================================================
-- Lucid-Lab Blog Schema
-- =============================================================================
-- Single table that holds the entire editorial pipeline:
--   idea  → drafting → scheduled → published → archived
-- Only `title` is required at the `idea` stage; the other fields fill in
-- progressively as the post moves through the pipeline.
-- RLS is enabled but no policies are added — service-role only, matching the
-- existing admin/bot access pattern.

CREATE TABLE blog_posts (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Editorial state. Cron flips `scheduled` → `published` when scheduled_for ≤ now().
  status          text NOT NULL DEFAULT 'idea',
  -- URL slug. Required once status >= 'draft'. Unique per locale.
  slug            text,
  locale          text NOT NULL DEFAULT 'fr',
  -- Required at idea stage.
  title           text NOT NULL,
  description     text,
  content         text,
  category        text,
  tags            text[] NOT NULL DEFAULT '{}'::text[],
  funnel_stage    text,
  is_pillar       boolean NOT NULL DEFAULT false,
  is_cornerstone  boolean NOT NULL DEFAULT false,
  hero_image      text,
  hero_image_alt  text,
  og_image        text,
  -- Editorial planning.
  notes           text,
  -- When the post should auto-publish (UTC). NULL when not scheduled.
  scheduled_for   timestamptz,
  -- Filled by cron (or manual publish) when status flips to 'published'.
  published_at    timestamptz,
  -- For the "updated XX" line on the article page.
  content_updated_at timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT blog_posts_status_check CHECK (
    status IN ('idea', 'draft', 'scheduled', 'published', 'archived')
  ),
  CONSTRAINT blog_posts_locale_check CHECK (locale IN ('fr', 'en')),
  CONSTRAINT blog_posts_funnel_stage_check CHECK (
    funnel_stage IS NULL OR funnel_stage IN ('TOFU', 'MOFU', 'BOFU')
  ),
  CONSTRAINT blog_posts_category_check CHECK (
    category IS NULL OR category IN ('automatisation', 'ia-pme', 'outils-internes', 'methode')
  ),
  -- Once a post leaves the idea stage it must have a slug.
  CONSTRAINT blog_posts_slug_required CHECK (
    status = 'idea' OR (slug IS NOT NULL AND length(slug) > 0)
  ),
  -- Scheduled posts must have a scheduled_for date.
  CONSTRAINT blog_posts_schedule_required CHECK (
    status <> 'scheduled' OR scheduled_for IS NOT NULL
  ),
  -- Published posts must have published_at and content.
  CONSTRAINT blog_posts_publish_required CHECK (
    status <> 'published' OR (published_at IS NOT NULL AND content IS NOT NULL)
  )
);

-- Slug must be unique per locale among posts that actually have a slug.
CREATE UNIQUE INDEX blog_posts_slug_locale_idx
  ON blog_posts (locale, slug)
  WHERE slug IS NOT NULL;

CREATE INDEX blog_posts_status_idx ON blog_posts (status);
CREATE INDEX blog_posts_scheduled_for_idx ON blog_posts (scheduled_for)
  WHERE status = 'scheduled';
CREATE INDEX blog_posts_published_at_idx ON blog_posts (published_at DESC)
  WHERE status = 'published';

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

-- Auto-update updated_at on every UPDATE.
CREATE OR REPLACE FUNCTION blog_posts_set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER blog_posts_set_updated_at
  BEFORE UPDATE ON blog_posts
  FOR EACH ROW EXECUTE FUNCTION blog_posts_set_updated_at();
