/**
 * Guard against unauthenticated admin Server Actions.
 *
 * Every `'use server'` module under src/app/admin must reference an admin gate
 * (`requireAdmin` or `requireAdminAction`). Server Actions are POST-reachable
 * regardless of page path and are NOT protected by the dashboard layout, so a
 * module with no gate at all is an unauthenticated mutation endpoint (the exact
 * class of bug this catches: lead-engine/actions.ts and task-actions.ts, fixed
 * 2026-07-15).
 *
 * File-level heuristic on purpose: the real failure mode is a whole module with
 * zero auth. Run it on demand or wire into CI:
 *   npx tsx scripts/check-admin-action-auth.ts
 */
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const ADMIN_ROOT = 'src/app/admin';
const GATE_PATTERN = /\brequireAdmin(Action)?\b/;

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (full.endsWith('.ts') || full.endsWith('.tsx')) out.push(full);
  }
  return out;
}

const violations: string[] = [];
for (const file of walk(ADMIN_ROOT)) {
  const src = readFileSync(file, 'utf8');
  const isServerActionModule = /^\s*['"]use server['"]/m.test(src);
  if (!isServerActionModule) continue;
  if (!GATE_PATTERN.test(src)) violations.push(file);
}

if (violations.length > 0) {
  console.error('Unauthenticated admin Server Action module(s) — every action must call requireAdmin():');
  for (const file of violations) console.error(`  - ${file}`);
  process.exit(1);
}

console.log(`OK: all 'use server' modules under ${ADMIN_ROOT} reference an admin gate.`);
