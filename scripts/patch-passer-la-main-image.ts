/**
 * One-shot patch: update hero_image for "Passer la main" article.
 * Usage: npx tsx scripts/patch-passer-la-main-image.ts
 */
import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

async function main(): Promise<void> {
  const { supabase } = await import('@/lib/bot/db/supabase');

  const { data, error } = await supabase
    .from('blog_posts')
    .update({
      hero_image: '/blog/hero-ia-pme.png',
      hero_image_alt: 'Transfert d\'un système IA vers les équipes métier',
    })
    .ilike('slug', '%passer-la-main%')
    .select('slug, locale, hero_image');

  if (error) {
    console.error('Failed:', error.message);
    process.exit(1);
  }

  console.log('Updated:', data);
}

main().catch((err) => { console.error(err); process.exit(1); });
