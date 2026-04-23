/**
 * Pushes non-sensitive / non-empty env vars from .env.local to Vercel production.
 * Run once: node scripts/push-env-to-vercel.mjs
 * Requires: vercel CLI logged in and project linked.
 */
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

// Variables to skip (empty, dev-only, or added manually later)
const SKIP = new Set([
  'NODE_ENV',
  'TIDYCAL_API_KEY',
  'TIDYCAL_BOOKING_TYPE_ID',
  'TURNSTILE_SECRET',
  'NEXT_PUBLIC_TURNSTILE_SITE_KEY',
  'SMTP_PASS',             // set manually once you have the App Password
]);

const raw = readFileSync('.env.local', 'utf8');
const lines = raw.split('\n').filter(l => l.trim() && !l.trim().startsWith('#'));

let ok = 0, skipped = 0, failed = 0;

for (const line of lines) {
  const eq = line.indexOf('=');
  if (eq === -1) continue;

  const key = line.slice(0, eq).trim();
  const val = line.slice(eq + 1).trim();

  if (!val || SKIP.has(key)) {
    console.log(`  skip  ${key}`);
    skipped++;
    continue;
  }

  try {
    // Pipe value via echo to avoid shell escaping issues with special chars
    execSync(`printf '%s' ${JSON.stringify(val)} | vercel env add ${key} production --force`, {
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    console.log(`  ok    ${key}`);
    ok++;
  } catch (e) {
    console.error(`  FAIL  ${key}:`, e.stderr?.toString().trim());
    failed++;
  }
}

console.log(`\nDone: ${ok} pushed, ${skipped} skipped, ${failed} failed.`);
