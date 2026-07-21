'use server';

import { revalidatePath } from 'next/cache';

import { adminRedirect, isAdminAuthenticated } from '@/lib/admin/auth';
import { supabase } from '@/lib/bot/db/supabase';
import type { BlogLocale, BlogStatus } from '@/lib/admin/blog';
import { blogPublicUrl, setBlogPostStatus } from '@/lib/admin/blog';
import { setLinkInComment } from '@/lib/admin/social';
import { generateBlogContent, slugify } from '@/lib/admin/blog-content-generator';
import type { BlogAuthorSlug } from '@/lib/blog/authors';
import { pickAuthor } from '@/lib/blog/authors';

const STATUSES: readonly BlogStatus[] = [
  'idea',
  'draft',
  'queued',
  'approved',
  'scheduled',
  'published',
  'archived',
  'rejected',
];
const BLOG_PATH = '/admin/blog';
const BLOG_VIEWS = new Set(['a-valider', 'publies', 'brouillons']);

function blogReturnTo(fd: FormData): string {
  const vue = str(fd, 'vue');
  return BLOG_VIEWS.has(vue) ? `${BLOG_PATH}?vue=${vue}` : BLOG_PATH;
}

function requireId(fd: FormData): string {
  const id = str(fd, 'id');
  if (!id) throw new Error('Missing id');
  return id;
}
const LOCALES: readonly BlogLocale[] = ['fr', 'en'];
const CATEGORIES = ['automatisation', 'ia-pme', 'outils-internes', 'methode'];
const FUNNEL = ['TOFU', 'MOFU', 'BOFU'];
const AUTHORS: readonly BlogAuthorSlug[] = ['theo', 'anthony', 'jules'];

async function requireAdminAction(): Promise<void> {
  if (!(await isAdminAuthenticated())) return adminRedirect('/admin/login');
}

function str(fd: FormData, key: string): string {
  const v = fd.get(key);
  return typeof v === 'string' ? v.trim() : '';
}

function strOrNull(fd: FormData, key: string): string | null {
  const s = str(fd, key);
  return s.length > 0 ? s : null;
}

function bool(fd: FormData, key: string): boolean {
  return fd.get(key) === 'on' || fd.get(key) === 'true';
}

function tagsFromCsv(csv: string): string[] {
  return csv
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);
}

function isoOrNull(value: string): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

interface PostInput {
  status: BlogStatus;
  locale: BlogLocale;
  title: string;
  slug: string | null;
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
  author: BlogAuthorSlug | null;
}

function readPostInput(fd: FormData): PostInput {
  const status = (str(fd, 'status') || 'idea') as BlogStatus;
  if (!STATUSES.includes(status)) throw new Error('Invalid status');

  const locale = (str(fd, 'locale') || 'fr') as BlogLocale;
  if (!LOCALES.includes(locale)) throw new Error('Invalid locale');

  const title = str(fd, 'title');
  if (!title) throw new Error('Title is required');

  const category = strOrNull(fd, 'category');
  if (category && !CATEGORIES.includes(category)) throw new Error('Invalid category');

  const funnel = strOrNull(fd, 'funnel_stage');
  if (funnel && !FUNNEL.includes(funnel)) throw new Error('Invalid funnel stage');

  const author = strOrNull(fd, 'author');
  if (author && !AUTHORS.includes(author as BlogAuthorSlug)) throw new Error('Invalid author');

  return {
    status,
    locale,
    title,
    slug: strOrNull(fd, 'slug'),
    description: strOrNull(fd, 'description'),
    content: strOrNull(fd, 'content'),
    category,
    tags: tagsFromCsv(str(fd, 'tags')),
    funnel_stage: funnel,
    is_pillar: bool(fd, 'is_pillar'),
    is_cornerstone: bool(fd, 'is_cornerstone'),
    hero_image: strOrNull(fd, 'hero_image'),
    hero_image_alt: strOrNull(fd, 'hero_image_alt'),
    og_image: strOrNull(fd, 'og_image'),
    notes: strOrNull(fd, 'notes'),
    scheduled_for: isoOrNull(str(fd, 'scheduled_for')),
    published_at: isoOrNull(str(fd, 'published_at')),
    content_updated_at: isoOrNull(str(fd, 'content_updated_at')),
    author: author as BlogAuthorSlug | null,
  };
}

function revalidatePublicBlog(locale: BlogLocale, slug: string | null) {
  if (locale === 'fr') {
    revalidatePath('/blog');
    if (slug) revalidatePath(`/blog/${slug}`);
  } else {
    revalidatePath('/en/blog');
    if (slug) revalidatePath(`/en/blog/${slug}`);
  }
}

export async function createPostAction(formData: FormData): Promise<void> {
  await requireAdminAction();
  const input = readPostInput(formData);

  // Auto-slug if missing and not staying as 'idea'
  if (input.status !== 'idea' && !input.slug) {
    input.slug = slugify(input.title);
  }

  // If publishing now and no published_at provided, set it.
  if (input.status === 'published' && !input.published_at) {
    input.published_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('blog_posts')
    .insert(input)
    .select('id')
    .single();

  if (error) throw new Error(`createPost: ${error.message}`);

  revalidatePath('/admin/blog');
  revalidatePublicBlog(input.locale, input.slug);
  return adminRedirect(`/admin/blog/${data.id}/edit`);
}

export async function updatePostAction(formData: FormData): Promise<void> {
  await requireAdminAction();
  const id = str(formData, 'id');
  if (!id) throw new Error('Missing id');

  const input = readPostInput(formData);

  // Auto-generate content via AI when:
  //   - status is/was 'idea'
  //   - OR content is empty and we have at least a title
  // The action then flips status to 'draft' so the post leaves the idea bucket.
  const needsGeneration = !input.content || input.content.trim().length < 200;
  if (needsGeneration) {
    try {
      const generated = await generateBlogContent({
        title: input.title,
        description: input.description,
        category: input.category,
        tags: input.tags,
        funnelStage: input.funnel_stage,
        locale: input.locale,
        notes: input.notes,
        isPillar: input.is_pillar,
        author: input.author ?? pickAuthor({ category: input.category, tags: input.tags, title: input.title }),
      });
      input.content = generated.content;
      if (!input.description) input.description = generated.description;
      input.content_updated_at = new Date().toISOString();
      // Move from 'idea' to 'draft' once we have AI-generated content
      if (input.status === 'idea') input.status = 'draft';
    } catch (err) {
      // Surface the error so the user sees it instead of silently failing
      throw new Error(`AI generation failed: ${(err as Error).message}`);
    }
  }

  // Auto-generate slug from title when leaving idea stage without one
  if (input.status !== 'idea' && !input.slug) {
    input.slug = slugify(input.title);
  }

  if (input.status === 'published' && !input.published_at) {
    input.published_at = new Date().toISOString();
  }

  const { error } = await supabase.from('blog_posts').update(input).eq('id', id);
  if (error) throw new Error(`updatePost: ${error.message}`);

  revalidatePath('/admin/blog');
  revalidatePath(`/admin/blog/${id}/edit`);
  revalidatePublicBlog(input.locale, input.slug);
  return adminRedirect(`/admin/blog/${id}/edit?saved=1`);
}

export async function deletePostAction(formData: FormData): Promise<void> {
  await requireAdminAction();
  const id = str(formData, 'id');
  if (!id) throw new Error('Missing id');

  const { data: existing } = await supabase
    .from('blog_posts')
    .select('locale,slug')
    .eq('id', id)
    .maybeSingle();

  const { error } = await supabase.from('blog_posts').delete().eq('id', id);
  if (error) throw new Error(`deletePost: ${error.message}`);

  revalidatePath('/admin/blog');
  if (existing) revalidatePublicBlog(existing.locale as BlogLocale, existing.slug as string | null);
  return adminRedirect('/admin/blog');
}

export async function publishNowAction(formData: FormData): Promise<void> {
  await requireAdminAction();
  const id = str(formData, 'id');
  if (!id) throw new Error('Missing id');

  const { data: existing, error: readErr } = await supabase
    .from('blog_posts')
    .select('locale,slug,published_at,social_post_id')
    .eq('id', id)
    .maybeSingle();
  if (readErr) throw new Error(`publishNow: ${readErr.message}`);

  const { error } = await supabase
    .from('blog_posts')
    .update({
      status: 'published',
      published_at: existing?.published_at ?? new Date().toISOString(),
      scheduled_for: null,
    })
    .eq('id', id);
  if (error) throw new Error(`publishNow: ${error.message}`);

  // Point the linked LinkedIn post at the article (the "raccord"), best effort.
  const socialPostId = (existing as { social_post_id?: string | null } | null)?.social_post_id ?? null;
  const slug = existing?.slug as string | null;
  if (socialPostId && slug) {
    try {
      await setLinkInComment(socialPostId, blogPublicUrl((existing?.locale as BlogLocale) ?? 'fr', slug));
    } catch (err) {
      console.error('[publishNow] setLinkInComment failed:', (err as Error).message);
    }
  }

  revalidatePath('/admin/blog');
  if (existing) revalidatePublicBlog(existing.locale as BlogLocale, existing.slug as string | null);
}

export async function archivePostAction(formData: FormData): Promise<void> {
  await requireAdminAction();
  const id = str(formData, 'id');
  if (!id) throw new Error('Missing id');

  const { data: existing } = await supabase
    .from('blog_posts')
    .select('locale,slug')
    .eq('id', id)
    .maybeSingle();

  const { error } = await supabase
    .from('blog_posts')
    .update({ status: 'archived' })
    .eq('id', id);
  if (error) throw new Error(`archive: ${error.message}`);

  revalidatePath('/admin/blog');
  if (existing) revalidatePublicBlog(existing.locale as BlogLocale, existing.slug as string | null);
}

// =============================================================================
// LinkedIn-style validation actions (cockpit) — mirror lucid-os/social/actions
// =============================================================================

export async function approveBlogPostAction(formData: FormData): Promise<void> {
  await requireAdminAction();
  await setBlogPostStatus(requireId(formData), 'approved', null);
  revalidatePath(BLOG_PATH);
  return adminRedirect(blogReturnTo(formData));
}

export async function rejectBlogPostAction(formData: FormData): Promise<void> {
  await requireAdminAction();
  await setBlogPostStatus(requireId(formData), 'rejected', strOrNull(formData, 'review_note'));
  revalidatePath(BLOG_PATH);
  return adminRedirect(blogReturnTo(formData));
}

export async function queueBlogPostAction(formData: FormData): Promise<void> {
  await requireAdminAction();
  const id = requireId(formData);

  // A queued post must carry a scheduled_for (schedule constraint). Default a
  // few days out when missing so "silence = approval" has a review window.
  const { data } = await supabase
    .from('blog_posts')
    .select('scheduled_for')
    .eq('id', id)
    .maybeSingle();
  const existing = (data as { scheduled_for: string | null } | null)?.scheduled_for ?? null;

  const update: Record<string, unknown> = { status: 'queued', review_note: null };
  if (!existing) update.scheduled_for = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

  const { error } = await supabase.from('blog_posts').update(update).eq('id', id);
  if (error) throw new Error(`queueBlogPost: ${error.message}`);

  revalidatePath(BLOG_PATH);
  return adminRedirect(blogReturnTo(formData));
}
