-- =============================================================================
-- Blog post author (first-class, per-post field)
-- =============================================================================
-- Adds an optional `author` column so each article can be attributed to a
-- specific team member. NULL means "auto by expertise at read time" (see
-- src/lib/blog/authors.ts `pickAuthor`/`resolveAuthor`): legacy rows stay NULL
-- and get a stable, varied author from that fallback instead of a backfill.

ALTER TABLE blog_posts ADD COLUMN author text;

ALTER TABLE blog_posts ADD CONSTRAINT blog_posts_author_check CHECK (
  author IS NULL OR author IN ('theo', 'anthony', 'jules')
);
