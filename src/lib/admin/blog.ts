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
  social_post_id: string | null;
}

/** Approved posts whose slot has passed and which actually have content to publish. */
export async function listPublishableBlogPosts(): Promise<PublishableBlogPost[]> {
  const { data, error } = await supabase
    .from('blog_posts')
    .select('id,locale,slug,social_post_id')
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
// Blog <-> LinkedIn link (the "raccord")
// =============================================================================

export interface SocialPostForBlog {
  id: string;
  hook: string | null;
  body: string;
  pillar: string | null;
  scheduledFor: string | null;
}

/**
 * LinkedIn posts that deserve a long-form companion but have no blog version yet.
 * Scoped to posts in the publishing pipeline (not rejected/skipped). Capped per call
 * to bound generation cost in the cron.
 */
export async function getSocialPostsMissingBlogVersion(limit = 5): Promise<SocialPostForBlog[]> {
  const { data: socials, error } = await supabase
    .from('social_posts')
    .select('id,hook,body,pillar,scheduled_for')
    .in('status', ['draft', 'queued', 'approved', 'posted']);
  if (error || !socials) return [];

  const { data: existing } = await supabase
    .from('blog_posts')
    .select('social_post_id')
    .not('social_post_id', 'is', null);
  const have = new Set((existing ?? []).map((r) => (r as { social_post_id: string }).social_post_id));

  return (socials as Record<string, unknown>[])
    .filter((s) => !have.has(String(s.id)))
    .slice(0, limit)
    .map((s) => ({
      id: String(s.id),
      hook: typeof s.hook === 'string' ? s.hook : null,
      body: typeof s.body === 'string' ? s.body : '',
      pillar: typeof s.pillar === 'string' ? s.pillar : null,
      scheduledFor: typeof s.scheduled_for === 'string' ? s.scheduled_for : null,
    }));
}

export interface CreateBlogVersionInput {
  socialPostId: string;
  title: string;
  slug: string;
  description: string | null;
  content: string | null;
  category: string | null;
  locale: BlogLocale;
  status: BlogStatus;
  scheduledFor: string | null;
  author: BlogAuthorSlug;
}

/** Insert a blog article generated from a LinkedIn post. Retries once with a
 * disambiguated slug on a unique-slug collision. Returns the new row id. */
export async function createBlogVersion(input: CreateBlogVersionInput): Promise<string | null> {
  const row = {
    status: input.status,
    locale: input.locale,
    title: input.title,
    slug: input.slug,
    description: input.description,
    content: input.content,
    category: input.category,
    social_post_id: input.socialPostId,
    scheduled_for: input.scheduledFor,
    content_updated_at: input.content ? new Date().toISOString() : null,
    author: input.author,
  };

  let res = await supabase.from('blog_posts').insert(row).select('id').single();
  if (res.error && /duplicate|unique|23505/i.test(res.error.message)) {
    row.slug = `${input.slug}-${input.socialPostId.slice(0, 6)}`;
    res = await supabase.from('blog_posts').insert(row).select('id').single();
  }
  if (res.error || !res.data) {
    console.error('[blog] createBlogVersion failed:', res.error?.message);
    return null;
  }
  return (res.data as { id: string }).id;
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

/**
 * Of the given LinkedIn posts, which ones are blocked from posting because their
 * linked blog article is not published yet (so the link_in_comment URL is not live).
 */
export async function socialPostsBlockedByUnpublishedBlog(socialIds: string[]): Promise<Set<string>> {
  if (socialIds.length === 0) return new Set();
  const { data } = await supabase
    .from('blog_posts')
    .select('social_post_id,status')
    .in('social_post_id', socialIds)
    .neq('status', 'published');
  const blocked = new Set<string>();
  for (const r of (data ?? []) as Record<string, unknown>[]) {
    const sid = r.social_post_id as string | null;
    if (sid) blocked.add(sid);
  }
  return blocked;
}
