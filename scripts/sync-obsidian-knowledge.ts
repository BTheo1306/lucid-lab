import { createHash } from 'node:crypto';
import { readdir, readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import matter from 'gray-matter';

import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

const DEFAULT_VAULT_PATH = '/Users/julesgouron/Documents/Vault /Vault';
const DEFAULT_ORGANIZATION_SLUG = 'lucid-lab';
const SCRIPT_NAME = 'scripts/sync-obsidian-knowledge.ts';
const CHUNK_MAX_CHARS = 2400;
const DOCUMENT_MAX_CHARS = 24000;

type ScopeTag = 'business' | 'shared';
type SupabaseAdminClient = SupabaseClient;

interface ObsidianPage {
  title: string;
  slug: string;
  relativePath: string;
  sourceUri: string;
  content: string;
  summary: string;
  checksum: string;
  freshnessAt: string;
  tags: string[];
  scopeTags: ScopeTag[];
  frontmatter: Record<string, unknown>;
  chunks: Array<{ heading: string | null; content: string; tokenCount: number; metadata: Record<string, unknown> }>;
}

interface SyncStats {
  scanned: number;
  eligible: number;
  synced: number;
  chunks: number;
  skippedPersonal: number;
  skippedOutOfScope: number;
  skippedSecretLike: number;
  failed: number;
}

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const verbose = args.includes('--verbose');
const limit = numberArg('--limit');

function numberArg(name: string): number | null {
  const value = args.find((arg) => arg.startsWith(`${name}=`))?.split('=')[1];
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
}

function stringArg(name: string, fallback: string): string {
  return args.find((arg) => arg.startsWith(`${name}=`))?.split('=').slice(1).join('=') || fallback;
}

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-');
}

function slugify(value: string): string {
  return normalizeText(value).replace(/^-+|-+$/g, '').slice(0, 120) || 'untitled';
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function normalizeList(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).replace(/^#/, '').trim()).filter(Boolean);
  }
  if (typeof value === 'string') {
    return value
      .replace(/^\[/, '')
      .replace(/\]$/, '')
      .split(/[\s,]+/)
      .map((item) => item.replace(/^#/, '').trim())
      .filter(Boolean);
  }
  return [];
}

function estimateTokens(value: string): number {
  return Math.max(1, Math.ceil(value.length / 4));
}

function stripWikiSyntax(value: string): string {
  return value
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2 ($1)')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/<!--([\s\S]*?)-->/g, '')
    .replace(/\r\n/g, '\n')
    .replace(/\n{4,}/g, '\n\n\n')
    .trim();
}

function firstUsefulParagraph(content: string, fallback: string): string {
  const paragraph = content
    .split(/\n{2,}/)
    .map((part) => part.replace(/^#+\s+/, '').trim())
    .find((part) => part.length > 80 && !part.startsWith('|'));

  return (paragraph ?? fallback).replace(/\s+/g, ' ').trim().slice(0, 700);
}

function checksum(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function containsSecretLikeValue(value: string): boolean {
  return [
    /-----BEGIN (?:RSA |OPENSSH |EC |DSA )?PRIVATE KEY-----/,
    /\bsk-[A-Za-z0-9_-]{24,}\b/,
    /\bghp_[A-Za-z0-9_]{24,}\b/,
    /\bgithub_pat_[A-Za-z0-9_]{40,}\b/,
    /\bxox[baprs]-[A-Za-z0-9-]{20,}\b/,
    /\bAKIA[0-9A-Z]{16}\b/,
    /\bAIza[0-9A-Za-z_-]{30,}\b/,
    /\beyJ[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\.[A-Za-z0-9_-]{20,}\b/,
  ].some((pattern) => pattern.test(value));
}

async function listMarkdownFiles(root: string): Promise<string[]> {
  const entries = await readdir(root, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const fullPath = path.join(root, entry.name);
    if (entry.isDirectory()) return listMarkdownFiles(fullPath);
    return entry.isFile() && entry.name.endsWith('.md') ? [fullPath] : [];
  }));
  return files.flat();
}

async function loadIndexScopeMap(vaultRoot: string): Promise<Map<string, ScopeTag[]>> {
  const index = await readFile(path.join(vaultRoot, 'index.md'), 'utf8');
  const scopeMap = new Map<string, ScopeTag[]>();

  for (const line of index.split('\n')) {
    if (line.includes('#personal')) continue;
    const scopes: ScopeTag[] = [];
    if (line.includes('#business')) scopes.push('business');
    if (line.includes('#shared')) scopes.push('shared');
    if (scopes.length === 0) continue;

    const matches = line.matchAll(/\[\[(wiki\/[^\]|#]+)(?:[|#][^\]]*)?\]\]/g);
    for (const match of matches) {
      const relativePath = `${match[1].replace(/\.md$/, '')}.md`;
      scopeMap.set(relativePath, Array.from(new Set(scopes)));
    }
  }

  return scopeMap;
}

function allowedScopes(): Set<ScopeTag> {
  const rawScopes = stringArg('--scopes', process.env.OBSIDIAN_SYNC_SCOPES || 'business,shared');
  return new Set(rawScopes.split(',').map((item) => item.trim()).filter((item): item is ScopeTag => item === 'business' || item === 'shared'));
}

function isPersonalOnly(relativePath: string, title: string, slug: string, tags: string[]): boolean {
  const identity = `${relativePath} ${title} ${slug} ${tags.join(' ')}`.toLowerCase();
  if (tags.includes('personal')) return true;
  if (tags.includes('business')) return false;
  return identity.includes('jules-personal-os') || identity.includes(' personal');
}

function chunkContent(title: string, content: string): ObsidianPage['chunks'] {
  const lines = content.split('\n');
  const sections: Array<{ heading: string | null; content: string }> = [];
  let currentHeading: string | null = title;
  let currentLines: string[] = [];

  for (const line of lines) {
    const heading = line.match(/^(#{1,3})\s+(.+)$/)?.[2]?.trim();
    if (heading && currentLines.join('\n').trim()) {
      sections.push({ heading: currentHeading, content: currentLines.join('\n').trim() });
      currentLines = [];
    }
    if (heading) currentHeading = heading;
    currentLines.push(line);
  }

  if (currentLines.join('\n').trim()) {
    sections.push({ heading: currentHeading, content: currentLines.join('\n').trim() });
  }

  return sections.flatMap((section) => {
    const chunks: ObsidianPage['chunks'] = [];
    let remaining = section.content;
    let part = 1;

    while (remaining.length > CHUNK_MAX_CHARS) {
      const splitAt = Math.max(
        remaining.lastIndexOf('\n\n', CHUNK_MAX_CHARS),
        remaining.lastIndexOf('\n', CHUNK_MAX_CHARS),
        remaining.lastIndexOf('. ', CHUNK_MAX_CHARS),
      );
      const cut = splitAt > CHUNK_MAX_CHARS * 0.45 ? splitAt : CHUNK_MAX_CHARS;
      const content = remaining.slice(0, cut).trim();
      if (content) {
        chunks.push({
          heading: section.heading ? `${section.heading} (${part})` : null,
          content,
          tokenCount: estimateTokens(content),
          metadata: { chunk_strategy: 'heading_and_size', part },
        });
      }
      remaining = remaining.slice(cut).trim();
      part += 1;
    }

    if (remaining.trim()) {
      chunks.push({
        heading: part > 1 && section.heading ? `${section.heading} (${part})` : section.heading,
        content: remaining.trim(),
        tokenCount: estimateTokens(remaining),
        metadata: { chunk_strategy: 'heading_and_size', part },
      });
    }

    return chunks;
  }).slice(0, 40);
}

async function readObsidianPage(filePath: string, vaultRoot: string, indexScopeMap: Map<string, ScopeTag[]>, scopes: Set<ScopeTag>): Promise<{ page: ObsidianPage | null; reason: keyof Pick<SyncStats, 'skippedPersonal' | 'skippedOutOfScope' | 'skippedSecretLike'> | null }> {
  const relativePath = path.relative(vaultRoot, filePath).split(path.sep).join('/');
  const raw = await readFile(filePath, 'utf8');
  const parsed = matter(raw);
  const frontmatter = asRecord(parsed.data);
  const tags = normalizeList(frontmatter.tags).map((tag) => tag.toLowerCase());
  const indexScopes = indexScopeMap.get(relativePath) ?? [];
  const scopeTags = Array.from(new Set([...tags.filter((tag): tag is ScopeTag => tag === 'business' || tag === 'shared'), ...indexScopes]))
    .filter((tag) => scopes.has(tag));
  const title = asString(frontmatter.title) ?? path.basename(filePath, '.md');
  const frontmatterSlug = asString(frontmatter.slug) ?? path.basename(filePath, '.md');

  if (isPersonalOnly(relativePath, title, frontmatterSlug, tags)) return { page: null, reason: 'skippedPersonal' };
  if (scopeTags.length === 0) return { page: null, reason: 'skippedOutOfScope' };
  if (containsSecretLikeValue(raw)) return { page: null, reason: 'skippedSecretLike' };

  const content = stripWikiSyntax(parsed.content);
  const fileStat = await stat(filePath);
  const sourceUri = `obsidian://${relativePath}`;
  const slug = `obsidian-${slugify(relativePath.replace(/\.md$/, ''))}`;
  const pageChecksum = checksum(`${JSON.stringify(frontmatter)}\n${content}`);
  const summary = asString(frontmatter.summary) ?? asString(frontmatter.description) ?? firstUsefulParagraph(content, title);

  return {
    reason: null,
    page: {
      title,
      slug,
      relativePath,
      sourceUri,
      content: content.slice(0, DOCUMENT_MAX_CHARS),
      summary,
      checksum: pageChecksum,
      freshnessAt: fileStat.mtime.toISOString(),
      tags,
      scopeTags,
      frontmatter,
      chunks: chunkContent(title, content),
    },
  };
}

async function ensureOrganization(supabaseUrl: string, serviceRoleKey: string): Promise<{ client: SupabaseAdminClient; organizationId: string }> {
  const client: SupabaseAdminClient = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: existing, error: selectError } = await client
    .from('organizations')
    .select('id')
    .eq('slug', DEFAULT_ORGANIZATION_SLUG)
    .maybeSingle();

  if (selectError) throw new Error(`Could not read Lucid OS organization: ${selectError.message}`);
  if (existing?.id) return { client, organizationId: String(existing.id) };

  const { data, error } = await client
    .from('organizations')
    .upsert({
      name: 'Lucid-Lab',
      slug: DEFAULT_ORGANIZATION_SLUG,
      status: 'active',
      owner_label: 'Lucid-Lab internal OS',
      primary_language: 'fr',
      timezone: 'Europe/Paris',
      settings: { initialized_by: SCRIPT_NAME },
    }, { onConflict: 'slug' })
    .select('id')
    .single();

  if (error) throw new Error(`Could not create Lucid OS organization: ${error.message}`);
  return { client, organizationId: String(data.id) };
}

async function upsertPage(client: SupabaseAdminClient, organizationId: string, page: ObsidianPage): Promise<string> {
  const syncedAt = new Date().toISOString();
  const { data, error } = await client
    .from('knowledge_documents')
    .upsert({
      organization_id: organizationId,
      source_system: 'obsidian',
      source_uri: page.sourceUri,
      title: page.title,
      slug: page.slug,
      status: 'active',
      visibility: 'internal',
      freshness_at: page.freshnessAt,
      checksum: page.checksum,
      summary: page.summary,
      content: page.content,
      metadata: {
        captured_by: SCRIPT_NAME,
        source_path: page.relativePath,
        obsidian_slug: asString(page.frontmatter.slug),
        obsidian_type: asString(page.frontmatter.type),
        obsidian_status: asString(page.frontmatter.status),
        tags: page.tags,
        scope_tags: page.scopeTags,
        sources: normalizeList(page.frontmatter.sources),
        related: normalizeList(page.frontmatter.related),
        aliases: normalizeList(page.frontmatter.aliases),
        synced_at: syncedAt,
        chunking: { version: 1, max_chars: CHUNK_MAX_CHARS },
      },
    }, { onConflict: 'organization_id,slug' })
    .select('id')
    .single();

  if (error) throw new Error(`knowledge_documents upsert failed for ${page.relativePath}: ${error.message}`);
  const documentId = String(data.id);

  const { error: deleteError } = await client.from('knowledge_chunks').delete().eq('document_id', documentId);
  if (deleteError) throw new Error(`knowledge_chunks cleanup failed for ${page.relativePath}: ${deleteError.message}`);

  if (page.chunks.length > 0) {
    const { error: insertError } = await client.from('knowledge_chunks').insert(page.chunks.map((chunk, index) => ({
      organization_id: organizationId,
      document_id: documentId,
      chunk_index: index,
      heading: chunk.heading,
      content: chunk.content,
      token_count: chunk.tokenCount,
      metadata: {
        ...chunk.metadata,
        source_path: page.relativePath,
        scope_tags: page.scopeTags,
      },
    })));

    if (insertError) throw new Error(`knowledge_chunks insert failed for ${page.relativePath}: ${insertError.message}`);
  }

  return documentId;
}

async function recordAuditEvent(client: SupabaseAdminClient, organizationId: string, stats: SyncStats): Promise<void> {
  const { error } = await client.from('audit_events').insert({
    organization_id: organizationId,
    actor_type: 'agent',
    event_type: 'obsidian_knowledge_synced',
    target_table: 'knowledge_documents',
    risk_level: 'low',
    summary: `Synced ${stats.synced} Obsidian wiki pages into Lucid OS runtime knowledge.`,
    details: {
      script: SCRIPT_NAME,
      scopes: Array.from(allowedScopes()),
      scanned: stats.scanned,
      eligible: stats.eligible,
      synced: stats.synced,
      chunks: stats.chunks,
      skipped_personal: stats.skippedPersonal,
      skipped_out_of_scope: stats.skippedOutOfScope,
      skipped_secret_like: stats.skippedSecretLike,
      failed: stats.failed,
      dry_run: dryRun,
    },
  });

  if (error) throw new Error(`audit_events insert failed: ${error.message}`);
}

async function main(): Promise<void> {
  const vaultRoot = stringArg('--vault', process.env.LUCID_OS_OBSIDIAN_VAULT_PATH || DEFAULT_VAULT_PATH);
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required.');

  await readFile(path.join(vaultRoot, 'CLAUDE.md'), 'utf8');
  const indexScopeMap = await loadIndexScopeMap(vaultRoot);
  const scopes = allowedScopes();
  const wikiRoot = path.join(vaultRoot, 'wiki');
  const files = (await listMarkdownFiles(wikiRoot)).sort();
  const stats: SyncStats = { scanned: 0, eligible: 0, synced: 0, chunks: 0, skippedPersonal: 0, skippedOutOfScope: 0, skippedSecretLike: 0, failed: 0 };
  const pages: ObsidianPage[] = [];

  for (const filePath of files) {
    stats.scanned += 1;
    const { page, reason } = await readObsidianPage(filePath, vaultRoot, indexScopeMap, scopes);
    if (!page) {
      if (reason) stats[reason] += 1;
      continue;
    }
    stats.eligible += 1;
    pages.push(page);
    if (limit && pages.length >= limit) break;
  }

  if (dryRun) {
    const chunkCount = pages.reduce((total, page) => total + page.chunks.length, 0);
    console.log(`Dry run: ${pages.length} eligible Obsidian pages, ${chunkCount} chunks.`);
    console.log(`Skipped: ${stats.skippedPersonal} personal, ${stats.skippedOutOfScope} out of scope, ${stats.skippedSecretLike} secret-like.`);
    if (verbose) pages.forEach((page) => console.log(`- ${page.relativePath} (${page.scopeTags.join(', ')}) -> ${page.chunks.length} chunks`));
    return;
  }

  const { client, organizationId } = await ensureOrganization(supabaseUrl, serviceRoleKey);

  for (const page of pages) {
    try {
      await upsertPage(client, organizationId, page);
      stats.synced += 1;
      stats.chunks += page.chunks.length;
      if (verbose) console.log(`Synced ${page.relativePath} (${page.chunks.length} chunks)`);
    } catch (error) {
      stats.failed += 1;
      console.error(`Failed ${page.relativePath}: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
  }

  await recordAuditEvent(client, organizationId, stats);
  console.log(`Synced ${stats.synced}/${stats.eligible} Obsidian pages into Lucid OS knowledge with ${stats.chunks} chunks.`);
  console.log(`Skipped: ${stats.skippedPersonal} personal, ${stats.skippedOutOfScope} out of scope, ${stats.skippedSecretLike} secret-like. Failed: ${stats.failed}.`);
  if (stats.failed > 0) process.exit(1);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});