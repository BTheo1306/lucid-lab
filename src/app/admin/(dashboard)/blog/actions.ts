'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

import { isAdminAuthenticated } from '@/lib/admin/auth';
import { supabase } from '@/lib/bot/db/supabase';
import type { BlogLocale, BlogStatus } from '@/lib/admin/blog';
import { generateBlogContent, slugify } from '@/lib/admin/blog-content-generator';

const STATUSES: readonly BlogStatus[] = ['idea', 'draft', 'scheduled', 'published', 'archived'];
const LOCALES: readonly BlogLocale[] = ['fr', 'en'];
const CATEGORIES = ['automatisation', 'ia-pme', 'outils-internes', 'methode'];
const FUNNEL = ['TOFU', 'MOFU', 'BOFU'];

async function requireAdminAction(): Promise<void> {
  if (!(await isAdminAuthenticated())) redirect('/admin/login');
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
  redirect(`/admin/blog/${data.id}/edit`);
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
  redirect(`/admin/blog/${id}/edit?saved=1`);
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
  redirect('/admin/blog');
}

export async function publishNowAction(formData: FormData): Promise<void> {
  await requireAdminAction();
  const id = str(formData, 'id');
  if (!id) throw new Error('Missing id');

  const { data: existing, error: readErr } = await supabase
    .from('blog_posts')
    .select('locale,slug,published_at')
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
