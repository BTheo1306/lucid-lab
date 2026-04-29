import "server-only";

import { cache } from "react";
import readingTime from "reading-time";

import { supabase } from "@/lib/bot/db/supabase";
import type { FunnelStage, Post, PostCategory, PostFrontmatter, PostLocale } from "./types";

interface BlogPostRow {
  id: string;
  slug: string | null;
  locale: string;
  status: string;
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
  published_at: string | null;
  content_updated_at: string | null;
}

function rowToPost(row: BlogPostRow): Post | null {
  if (!row.slug || !row.description || !row.content || !row.category || !row.published_at) {
    return null;
  }
  const frontmatter: PostFrontmatter = {
    title: row.title,
    description: row.description,
    publishedAt: row.published_at,
    updatedAt: row.content_updated_at ?? undefined,
    category: row.category as PostCategory,
    tags: row.tags ?? [],
    funnelStage: (row.funnel_stage ?? undefined) as FunnelStage | undefined,
    isPillar: row.is_pillar,
    isCornerstone: row.is_cornerstone,
    heroImage: row.hero_image ?? undefined,
    heroImageAlt: row.hero_image_alt ?? undefined,
    ogImage: row.og_image ?? undefined,
    locale: row.locale as PostLocale,
  };
  return {
    slug: row.slug,
    frontmatter,
    content: row.content,
    readingTimeMinutes: Math.max(1, Math.round(readingTime(row.content).minutes)),
  };
}

const PUBLIC_FIELDS =
  "id,slug,locale,status,title,description,content,category,tags,funnel_stage,is_pillar,is_cornerstone,hero_image,hero_image_alt,og_image,published_at,content_updated_at";

/**
 * Returns every published post sorted newest → oldest.
 * Only `status = 'published'` AND `published_at <= now()` are returned.
 */
export const getAllPosts = cache(async (locale?: PostLocale): Promise<Post[]> => {
  const nowIso = new Date().toISOString();
  let query = supabase
    .from("blog_posts")
    .select(PUBLIC_FIELDS)
    .eq("status", "published")
    .lte("published_at", nowIso)
    .order("published_at", { ascending: false });

  if (locale) {
    query = query.eq("locale", locale);
  }

  const { data, error } = await query;
  if (error) {
    console.error("[blog] getAllPosts failed:", error.message);
    return [];
  }

  return (data ?? [])
    .map((row) => rowToPost(row as BlogPostRow))
    .filter((p): p is Post => p !== null);
});

export async function getPostBySlug(
  slug: string,
  locale?: PostLocale,
): Promise<Post | null> {
  const posts = await getAllPosts(locale);
  return posts.find((p) => p.slug === slug) ?? null;
}

export async function getPostsByCategory(
  category: PostCategory,
  locale?: PostLocale,
): Promise<Post[]> {
  const posts = await getAllPosts(locale);
  return posts.filter((p) => p.frontmatter.category === category);
}

export async function getPillarPost(
  category: PostCategory,
  locale?: PostLocale,
): Promise<Post | null> {
  const posts = await getPostsByCategory(category, locale);
  return posts.find((p) => p.frontmatter.isPillar) ?? null;
}

export async function getRelatedPosts(post: Post, limit = 3): Promise<Post[]> {
  const locale: PostLocale = post.frontmatter.locale ?? "fr";
  const all = (await getAllPosts(locale)).filter((p) => p.slug !== post.slug);
  const sameCategory = all.filter(
    (p) => p.frontmatter.category === post.frontmatter.category,
  );
  const others = all.filter(
    (p) => p.frontmatter.category !== post.frontmatter.category,
  );
  return [...sameCategory, ...others].slice(0, limit);
}
