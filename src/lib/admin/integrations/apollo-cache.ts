import 'server-only';

import { createHash } from 'node:crypto';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type { ApolloPerson, ApolloSearchFilters } from './apollo-client';

/**
 * File-based cache for Apollo searches keyed by SHA-256 of the canonicalized
 * filter object. Saves credits when re-running the same ICP within the TTL.
 *
 * Cache lives under `.lead-engine-sandbox/apollo-cache.json` (gitignored
 * alongside the rest of the sandbox).
 */

const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days
const cacheDir = path.join(process.cwd(), '.lead-engine-sandbox');
const cacheFile = path.join(cacheDir, 'apollo-cache.json');

interface CacheEntry {
  filters: ApolloSearchFilters;
  results: ApolloPerson[];
  cachedAt: string;
}

type CacheShape = Record<string, CacheEntry>;

function canonicalize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalize);
  if (value && typeof value === 'object') {
    const sortedKeys = Object.keys(value as Record<string, unknown>).sort();
    return sortedKeys.reduce<Record<string, unknown>>((acc, key) => {
      acc[key] = canonicalize((value as Record<string, unknown>)[key]);
      return acc;
    }, {});
  }
  return value;
}

export function hashFilters(filters: ApolloSearchFilters): string {
  const canonical = JSON.stringify(canonicalize(filters));
  return createHash('sha256').update(canonical).digest('hex');
}

async function readCache(): Promise<CacheShape> {
  try {
    const raw = await readFile(cacheFile, 'utf8');
    return JSON.parse(raw) as CacheShape;
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && (error as { code: string }).code === 'ENOENT') return {};
    return {};
  }
}

async function writeCache(cache: CacheShape): Promise<void> {
  await mkdir(cacheDir, { recursive: true });
  await writeFile(cacheFile, `${JSON.stringify(cache, null, 2)}\n`, 'utf8');
}

export async function getCachedApolloSearch(filters: ApolloSearchFilters): Promise<ApolloPerson[] | null> {
  const cache = await readCache();
  const entry = cache[hashFilters(filters)];
  if (!entry) return null;
  const age = Date.now() - new Date(entry.cachedAt).getTime();
  if (!Number.isFinite(age) || age > CACHE_TTL_MS) return null;
  return entry.results;
}

export async function setCachedApolloSearch(filters: ApolloSearchFilters, results: ApolloPerson[]): Promise<void> {
  const cache = await readCache();
  cache[hashFilters(filters)] = { filters, results, cachedAt: new Date().toISOString() };
  await writeCache(cache);
}
