import 'server-only';

import { supabase } from '@/lib/bot/db/supabase';

export type BlogStatus = 'idea' | 'draft' | 'scheduled' | 'published' | 'archived';
export type BlogLocale = 'fr' | 'en';

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
  created_at: string;
  updated_at: string;
}

export const ADMIN_FIELDS =
  'id,status,slug,locale,title,description,content,category,tags,funnel_stage,is_pillar,is_cornerstone,hero_image,hero_image_alt,og_image,notes,scheduled_for,published_at,content_updated_at,created_at,updated_at';

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
