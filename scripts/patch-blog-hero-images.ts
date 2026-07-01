/**
 * One-shot patch: assign hero_image to all published blog posts based on category.
 * Only updates rows where hero_image IS NULL (safe to re-run).
 *
 * Usage:
 *   npx tsx scripts/patch-blog-hero-images.ts
 *
 * Required env:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY  (loaded from .env.local)
 */

import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

const IMAGE_MAP: Record<string, { image: string; alt: { fr: string; en: string } }> = {
  'methode': {
    image: '/blog/hero-methode.png',
    alt: {
      fr: 'Méthode Lucid-Lab — livraison de systèmes IA en production',
      en: 'Lucid-Lab method — delivering AI systems to production',
    },
  },
  'outils-internes': {
    image: '/blog/hero-outils-internes.png',
    alt: {
      fr: 'Construction d\'outils internes sur mesure',
      en: 'Building custom internal tools',
    },
  },
  'ia-pme': {
    image: '/blog/hero-ia-pme.png',
    alt: {
      fr: 'IA appliquée aux PME — cas d\'usage concrets',
      en: 'AI applied to SMEs — practical use cases',
    },
  },
  'automatisation': {
    image: '/blog/guide-automatisation.png',
    alt: {
      fr: 'Diagramme de workflow pour automatiser les processus en entreprise',
      en: 'Business process automation workflow diagram',
    },
  },
};

const COST_SLUG_PATTERNS = ['cout', 'cost'];

async function main(): Promise<void> {
  const { supabase } = await import('@/lib/bot/db/supabase');

  const { data: posts, error: fetchErr } = await supabase
    .from('blog_posts')
    .select('id, slug, locale, category, hero_image')
    .eq('status', 'published')
    .is('hero_image', null);

  if (fetchErr) {
    console.error('Failed to fetch posts:', fetchErr.message);
    process.exit(1);
  }

  if (!posts || posts.length === 0) {
    console.log('All posts already have a hero_image. Nothing to do.');
    return;
  }

  console.log(`Found ${posts.length} post(s) without hero_image.`);

  let ok = 0;
  let fail = 0;

  for (const post of posts) {
    const cat = post.category as string;
    const locale = (post.locale ?? 'fr') as 'fr' | 'en';
    const slug = post.slug as string;

    let mapping = IMAGE_MAP[cat];
    if (!mapping) {
      console.warn(`  ⚠ Unknown category "${cat}" for ${locale}/${slug} — skipped`);
      continue;
    }

    let image = mapping.image;
    let altText = mapping.alt[locale];

    // Cost article override (slug contains "cout" or "cost")
    if (cat === 'automatisation' && COST_SLUG_PATTERNS.some((p) => slug.includes(p))) {
      image = '/blog/cout-automatisation-2026.png';
      altText =
        locale === 'fr'
          ? 'Fourchettes de coût pour automatiser un processus métier en PME'
          : 'Business process automation cost breakdown for SMEs';
    }

    const { error } = await supabase
      .from('blog_posts')
      .update({ hero_image: image, hero_image_alt: altText })
      .eq('id', post.id);

    if (error) {
      console.error(`  ✗ ${locale}/${slug}:`, error.message);
      fail++;
    } else {
      console.log(`  ✓ ${locale}/${slug} → ${image}`);
      ok++;
    }
  }

  console.log(`\nDone. ${ok} updated, ${fail} failed.`);
  if (fail > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
