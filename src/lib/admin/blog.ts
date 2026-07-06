import 'server-only';

import { supabase } from '@/lib/bot/db/supabase';
import type { BlogAuthorSlug } from '@/lib/blog/authors';

export type BlogStatus =
  | 'idea'
  | 'draft'
  | 'queued'
  | 'approved'
  | 'scheduled'
  | 'published'
  | 'archived'
  | 'rejected';
export type BlogLocale = 'fr' | 'en';

const SITE_URL = 'https://lucid-lab.fr';

/** Public URL of a published article, mirroring src/lib/blog/metadata.ts. */
export function blogPublicUrl(locale: BlogLocale, slug: string): string {
  return locale === 'en' ? `${SITE_URL}/en/blog/${slug}` : `${SITE_URL}/blog/${slug}`;
}

export interface BlogPostRow {
  id: string;
  status: BlogStatus;
  slug: string | null;
  locale: BlogLocale;
  title: string;
  description: string | null;
  content: string | null;
  category: string | null;
  tags: string[];
  funnel_stage: string | null;
  is_pillar: boolean;
  is_cornerstone: boolean;
  hero_image: string | null;
  hero_image_alt: string | null;
  og_image: string | null;
  notes: string | null;
  scheduled_for: string | null;
  published_at: string | null;
  content_updated_at: string | null;
  social_post_id: string | null;
  review_note: string | null;
  author: BlogAuthorSlug | null;
  created_at: string;
  updated_at: string;
}

export const ADMIN_FIELDS =
  'id,status,slug,locale,title,description,content,category,tags,funnel_stage,is_pillar,is_cornerstone,hero_image,hero_image_alt,og_image,notes,scheduled_for,published_at,content_updated_at,social_post_id,review_note,author,created_at,updated_at';

export async function listAllAdminPosts(): Promise<BlogPostRow[]> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select(ADMIN_FIELDS)
    .order('updated_at', { ascending: false });
  if (error) throw new Error(`listAllAdminPosts: ${error.message}`);
  return (data ?? []) as BlogPostRow[];
}

export async function getAdminPostById(id: string): Promise<BlogPostRow | null> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select(ADMIN_FIELDS)
    .eq('id', id)
    .maybeSingle();
  if (error) throw new Error(`getAdminPostById: ${error.message}`);
  return (data as BlogPostRow | null) ?? null;
}

// =============================================================================
// LinkedIn-style validation workflow (queued -> approved -> published)
// =============================================================================

/** Transition a blog post's status, optionally recording a rejection note. */
export async function setBlogPostStatus(
  id: string,
  status: BlogStatus,
  reviewNote?: string | null,
): Promise<void> {
  const update: Record<string, unknown> = { status };
  if (reviewNote !== undefined) update.review_note = reviewNote;
  const { error } = await supabase.from('blog_posts').update(update).eq('id', id);
  if (error) throw new Error(`setBlogPostStatus: ${error.message}`);
}

/** Silence = approval: queued blog posts within the review window become approved. */
export async function autoApproveDueBlogPosts(windowHours = 24): Promise<number> {
  const cutoff = new Date(Date.now() + windowHours * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('blog_posts')
    .update({ status: 'approved' })
    .eq('status', 'queued')
    .lte('scheduled_for', cutoff)
    .select('id');
  if (error || !data) return 0;
  return (data as unknown[]).length;
}

export interface PublishableBlogPost {
  id: string;
  locale: BlogLocale;
  slug: string | null;
}

/** Approved posts whose slot has passed and which actually have content to publish. */
export async function listPublishableBlogPosts(): Promise<PublishableBlogPost[]> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('id,locale,slug')
    .eq('status', 'approved')
    .lte('scheduled_for', new Date().toISOString())
    .not('content', 'is', null);
  if (error || !data) return [];
  return data as PublishableBlogPost[];
}

/** Mark a post published now (content + published_at satisfy the publish constraint). */
export async function markBlogPostPublished(id: string): Promise<void> {
  const { error } = await supabase
    .from('blog_posts')
    .update({ status: 'published', published_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw new Error(`markBlogPostPublished: ${error.message}`);
}

// =============================================================================
// SEO idea backlog (the blog's own editorial pipeline, decoupled from LinkedIn)
// =============================================================================

export interface BlogIdeaRow {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  tags: string[];
  funnel_stage: string | null;
  is_pillar: boolean;
  notes: string | null;
  locale: BlogLocale;
}

/** Idea rows awaiting content generation, oldest first. */
export async function listIdeaBacklog(limit = 10): Promise<BlogIdeaRow[]> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('id,title,description,category,tags,funnel_stage,is_pillar,notes,locale')
    .eq('status', 'idea')
    .order('created_at', { ascending: true })
    .limit(limit);
  if (error || !data) return [];
  return data as BlogIdeaRow[];
}

/** All titles in the table (any status), used to dedupe new idea generation. */
export async function listBlogTitles(): Promise<string[]> {
  const { data } = await supabase.from('blog_posts').select('title');
  return ((data ?? []) as { title: string }[]).map((r) => r.title);
}

export interface NewBlogIdea {
  title: string;
  description: string | null;
  category: string | null;
  funnelStage: string | null;
  targetKeyword: string | null;
  isPillar: boolean;
}

/** Insert freshly generated SEO ideas into the backlog (status `idea`). */
export async function insertBlogIdeas(ideas: NewBlogIdea[]): Promise<number> {
  if (ideas.length === 0) return 0;
  const rows = ideas.map((idea) => ({
    status: 'idea',
    locale: 'fr',
    title: idea.title,
    description: idea.description,
    category: idea.category,
    funnel_stage: idea.funnelStage,
    is_pillar: idea.isPillar,
    notes: idea.targetKeyword ? `Mot-clé cible : ${idea.targetKeyword}` : null,
  }));
  const { data, error } = await supabase.from('blog_posts').insert(rows).select('id');
  if (error) {
    console.error('[blog] insertBlogIdeas failed:', error.message);
    return 0;
  }
  return ((data ?? []) as unknown[]).length;
}

/** Upcoming scheduled articles (queued/approved with a future slot). */
export async function listUpcomingScheduledArticles(): Promise<{ id: string; scheduled_for: string }[]> {
  const { data } = await supabase
    .from('blog_posts')
    .select('id,scheduled_for')
    .in('status', ['queued', 'approved'])
    .gte('scheduled_for', new Date().toISOString());
  return ((data ?? []) as { id: string; scheduled_for: string }[]);
}

/** Fill an idea row with generated content and move it into the review queue.
 * Retries once with a disambiguated slug on a unique-slug collision. */
export async function fillIdeaWithContent(
  id: string,
  input: {
    slug: string;
    description: string | null;
    content: string;
    scheduledFor: string;
    author: BlogAuthorSlug;
  },
): Promise<void> {
  const patch = {
    status: 'queued',
    slug: input.slug,
    description: input.description,
    content: input.content,
    scheduled_for: input.scheduledFor,
    content_updated_at: new Date().toISOString(),
    author: input.author,
  };

  let res = await supabase.from('blog_posts').update(patch).eq('id', id);
  if (res.error && /duplicate|unique|23505/i.test(res.error.message)) {
    patch.slug = `${input.slug}-${id.slice(0, 6)}`;
    res = await supabase.from('blog_posts').update(patch).eq('id', id);
  }
  if (res.error) throw new Error(`fillIdeaWithContent: ${res.error.message}`);
}

export interface BlogVersionRef {
  id: string;
  status: BlogStatus;
  slug: string | null;
  locale: BlogLocale;
}

/** Map of socialPostId -> its blog article, for the LinkedIn cockpit. */
export async function getBlogVersionsBySocialPostIds(
  ids: string[],
): Promise<Record<string, BlogVersionRef>> {
  if (ids.length === 0) return {};
  const { data } = await supabase
    .from('blog_posts')
    .select('id,status,slug,locale,social_post_id')
    .in('social_post_id', ids);
  const out: Record<string, BlogVersionRef> = {};
  for (const r of (data ?? []) as Record<string, unknown>[]) {
    const sid = r.social_post_id as string | null;
    if (sid) {
      out[sid] = {
        id: String(r.id),
        status: r.status as BlogStatus,
        slug: (r.slug as string | null) ?? null,
        locale: r.locale as BlogLocale,
      };
    }
  }
  return out;
}

