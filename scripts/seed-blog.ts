/**
 * One-shot seed: import existing MDX blog posts from `content/posts/` into the
 * `blog_posts` table. Idempotent (upsert on slug+locale).
 *
 * Usage:
 *   npx tsx scripts/seed-blog.ts
 *
 * Required env:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { resolve, join } from 'node:path';
import matter from 'gray-matter';

import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

interface Frontmatter {
  title: string;
  description: string;
  publishedAt: string;
  updatedAt?: string;
  category: string;
  tags?: string[];
  funnelStage?: string;
  isPillar?: boolean;
  isCornerstone?: boolean;
  heroImage?: string;
  heroImageAlt?: string;
  ogImage?: string;
  locale?: 'fr' | 'en';
}

async function main(): Promise<void> {
  const { supabase } = await import('@/lib/bot/db/supabase');

  const dir = resolve(process.cwd(), 'content/posts');
  if (!existsSync(dir)) {
    console.error('No content/posts directory found.');
    process.exit(1);
  }

  const files = readdirSync(dir).filter(
    (f) => f.endsWith('.mdx') && !f.startsWith('_'),
  );

  if (files.length === 0) {
    console.log('No MDX files to seed.');
    return;
  }

  let ok = 0;
  let fail = 0;

  for (const file of files) {
    const slug = file.replace(/\.mdx$/, '');
    const raw = readFileSync(join(dir, file), 'utf8');
    const { data, content } = matter(raw);
    const fm = data as Frontmatter;

    if (!fm.title || !fm.description || !fm.publishedAt || !fm.category) {
      console.warn(`Skipping ${file}: missing required frontmatter.`);
      fail++;
      continue;
    }

    const locale = fm.locale ?? 'fr';

    const row = {
      slug,
      locale,
      status: 'published',
      title: fm.title,
      description: fm.description,
      content,
      category: fm.category,
      tags: fm.tags ?? [],
      funnel_stage: fm.funnelStage ?? null,
      is_pillar: fm.isPillar ?? false,
      is_cornerstone: fm.isCornerstone ?? false,
      hero_image: fm.heroImage ?? null,
      hero_image_alt: fm.heroImageAlt ?? null,
      og_image: fm.ogImage ?? null,
      published_at: new Date(fm.publishedAt).toISOString(),
      content_updated_at: fm.updatedAt
        ? new Date(fm.updatedAt).toISOString()
        : null,
    };

    const { error } = await supabase
      .from('blog_posts')
      .upsert(row, { ignoreDuplicates: true });

    if (error) {
      console.error(`Failed to seed ${file}:`, error.message);
      fail++;
    } else {
      console.log(`✓ ${locale}/${slug}`);
      ok++;
    }
  }

  console.log(`\nDone. ${ok} ok, ${fail} failed.`);
  if (fail > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
