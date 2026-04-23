/**
 * Seed the Lucid-Lab knowledge base from knowledge-base/seed.yaml.
 *
 * Usage (from the host Next.js project where this bot-package is integrated):
 *   pnpm tsx scripts/seed-kb.ts
 *
 * Required env:
 *   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { load } from 'js-yaml';

// Load .env.local the same way Next.js does, before anything reads process.env.
import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

interface SeedEntry {
  category: string;
  topic: string;
  content: string;
  language: 'fr' | 'en';
}

interface SeedFile {
  entries: SeedEntry[];
}

async function main(): Promise<void> {
  // Dynamic import so env vars are loaded before config.ts runs.
  const { upsertKnowledgeEntry } = await import('@/lib/bot/db/queries/knowledge-base');

  const seedPath = resolve(process.cwd(), 'knowledge-base/seed.yaml');
  const raw = readFileSync(seedPath, 'utf-8');
  const parsed = load(raw) as SeedFile;

  if (!parsed?.entries?.length) {
    console.error('No entries found in', seedPath);
    process.exit(1);
  }

  console.log(`Seeding ${parsed.entries.length} knowledge base entries…`);

  let ok = 0;
  let fail = 0;

  for (const entry of parsed.entries) {
    try {
      await upsertKnowledgeEntry({
        category: entry.category,
        topic: entry.topic,
        content: entry.content.trim(),
        language: entry.language,
        active: true,
      });
      ok++;
      process.stdout.write('.');
    } catch (err) {
      fail++;
      console.error(`\n  ✗ ${entry.category}/${entry.topic} (${entry.language}):`, (err as Error).message);
    }
  }

  console.log(`\nDone. ${ok} ok, ${fail} failed.`);
  if (fail > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
