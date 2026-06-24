-- =============================================================================
-- Blog <-> LinkedIn link + LinkedIn-style validation workflow
-- =============================================================================
-- Aligns the blog editorial pipeline on the LinkedIn one so blog articles flow
-- the same way (queued -> approved -> published, "silence = approval"), and
-- links each article back to the LinkedIn post it was auto-generated from.
--
--   idea -> draft -> queued -> approved -> published   (+ rejected, archived)
--
-- "scheduled" is kept valid for safety but is no longer part of the canonical
-- flow: existing scheduled rows are migrated to "approved" below.

-- 1. New columns ---------------------------------------------------------------
ALTER TABLE blog_posts
  -- The LinkedIn post this article was expanded from (the "raccord").
  ADD COLUMN IF NOT EXISTS social_post_id uuid REFERENCES social_posts(id) ON DELETE SET NULL,
  -- Rejection reason, mirroring social_posts.review_note.
  ADD COLUMN IF NOT EXISTS review_note text;

-- 2. Status constraint: add queued / approved / rejected -----------------------
ALTER TABLE blog_posts DROP CONSTRAINT IF EXISTS blog_posts_status_check;
ALTER TABLE blog_posts ADD CONSTRAINT blog_posts_status_check CHECK (
  status IN ('idea', 'draft', 'queued', 'approved', 'scheduled', 'published', 'archived', 'rejected')
);

-- 3. A datetime is required once a post is in the publishing pipeline -----------
ALTER TABLE blog_posts DROP CONSTRAINT IF EXISTS blog_posts_schedule_required;
ALTER TABLE blog_posts ADD CONSTRAINT blog_posts_schedule_required CHECK (
  status NOT IN ('queued', 'approved', 'scheduled') OR scheduled_for IS NOT NULL
);

-- 4. Migrate legacy "scheduled" rows onto the new "approved" state -------------
-- (they already carry a scheduled_for, so the constraint above is satisfied).
UPDATE blog_posts SET status = 'approved' WHERE status = 'scheduled';

-- 5. Indexes -------------------------------------------------------------------
-- Replace the scheduled-only index with one covering the whole due-lookup set.
DROP INDEX IF EXISTS blog_posts_scheduled_for_idx;
CREATE INDEX IF NOT EXISTS blog_posts_due_idx
  ON blog_posts (scheduled_for)
  WHERE status IN ('queued', 'approved');

-- Fast lookup of an article from its LinkedIn post (and vice versa).
CREATE INDEX IF NOT EXISTS blog_posts_social_post_id_idx
  ON blog_posts (social_post_id)
  WHERE social_post_id IS NOT NULL;
