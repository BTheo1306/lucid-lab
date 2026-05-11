import 'server-only';

import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type {
  LucidClientContactSummary,
  LucidClientImportSummary,
  LucidClientInteractionSummary,
  LucidClientOpportunitySummary,
  LucidClientSummary,
  LucidClientTaskSummary,
} from './lucid-os';

const DEFAULT_VAULT_PATH = '/Users/julesgouron/Documents/Vault /Vault';
const GENERATED_START = '<!-- BEGIN:LUCID_OS_SYNC -->';
const GENERATED_END = '<!-- END:LUCID_OS_SYNC -->';
const LUCID_OS_SOURCE = 'wiki/sources/2026-05-04--lucid-os-implementation';

export type LucidObsidianSyncReason = 'intake' | 'contact' | 'opportunity' | 'interaction' | 'task' | 'import' | 'delete';

export type LucidClientObsidianSyncInput = {
  client: LucidClientSummary;
  contacts?: LucidClientContactSummary[];
  opportunities?: LucidClientOpportunitySummary[];
  interactions?: LucidClientInteractionSummary[];
  tasks?: LucidClientTaskSummary[];
  imports?: LucidClientImportSummary[];
  reason: LucidObsidianSyncReason;
};

export type LucidClientObsidianDeletionInput = {
  clientName: string;
  clientSlug: string;
  deletedAt: string;
};

function vaultPath(): string {
  return process.env.LUCID_OS_OBSIDIAN_VAULT_PATH || DEFAULT_VAULT_PATH;
}

async function vaultExists(root: string): Promise<boolean> {
  try {
    await access(path.join(root, 'CLAUDE.md'));
    await access(path.join(root, 'index.md'));
    return true;
  } catch {
    return false;
  }
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function checklistItems(value: string | null | undefined): string[] {
  if (!value) return [];
  const normalized = value.replace(/\r/g, '\n').trim();
  if (!normalized) return [];

  const lines = normalized
    .split('\n')
    .map((line) => line.replace(/^\s*(?:[-*]|\d+[.)]|\u2022)\s+/, '').trim())
    .filter(Boolean);

  if (lines.length > 1) return lines;

  const semicolonItems = normalized.split(';').map((item) => item.trim()).filter(Boolean);
  if (semicolonItems.length > 1) return semicolonItems;

  const commaItems = normalized.split(',').map((item) => item.trim()).filter(Boolean);
  if (commaItems.length > 1 && commaItems.every((item) => item.length <= 90)) return commaItems;

  return [normalized];
}

function markdownList(items: string[]): string {
  return items.length > 0 ? items.map((item) => `- ${item}`).join('\n') : '- none recorded';
}

function markdownChecklist(value: string | null | undefined): string {
  const items = checklistItems(value);
  return items.length > 0 ? items.map((item) => `- [ ] ${item}`).join('\n') : '- [ ] none recorded';
}

function optionalLine(label: string, value: string | null | undefined): string {
  return `- ${label}: ${value && value.trim() ? value.trim() : 'none recorded'}`;
}

function generatedClientBlock(input: LucidClientObsidianSyncInput): string {
  const { client } = input;
  const latestInteractions = input.interactions?.slice(0, 5) ?? [];
  const openTasks = input.tasks?.filter((task) => task.status !== 'done' && task.status !== 'cancelled').slice(0, 8) ?? [];
  const openOpportunities = input.opportunities?.filter((opportunity) => opportunity.status === 'open').slice(0, 5) ?? [];

  return [
    GENERATED_START,
    `> [!note] Synced from Lucid OS on ${new Date().toISOString()}. Edit structured client fields in Lucid OS; manual notes can live outside this generated block.`,
    '',
    '## Lucid OS Snapshot',
    optionalLine('Status', client.status),
    optionalLine('Lifecycle', client.lifecycleStage),
    optionalLine('Health', client.clientHealthStatus),
    optionalLine('Industry', client.industry),
    optionalLine('Website', client.websiteUrl),
    optionalLine('Source', client.intake.source),
    optionalLine('Primary email', client.primaryContactEmail),
    optionalLine('Primary phone', client.primaryContactPhone),
    optionalLine('Budget', client.intake.budgetRange),
    optionalLine('Timeline', client.intake.timeline),
    '',
    '## Tools & Stack',
    markdownList(client.tools),
    '',
    '## What The Client Wants',
    markdownChecklist(client.intake.desiredOutcome),
    '',
    '## Next Steps',
    markdownChecklist(client.nextAction ?? client.intake.nextStep),
    '',
    '## Contacts',
    markdownList((input.contacts ?? []).map((contact) => [contact.fullName, contact.role].filter(Boolean).join(' - '))),
    '',
    '## Open Opportunities',
    markdownList(openOpportunities.map((opportunity) => `${opportunity.title} (${opportunity.stage}, ${opportunity.probabilityPercent}%)`)),
    '',
    '## Open Tasks',
    openTasks.length > 0 ? openTasks.map((task) => `- [ ] ${task.title}${task.dueAt ? ` (due ${task.dueAt.slice(0, 10)})` : ''}`).join('\n') : '- [ ] none recorded',
    '',
    '## Latest Interactions',
    markdownList(latestInteractions.map((interaction) => `${interaction.occurredAt.slice(0, 10)} - ${interaction.summary}`)),
    '',
    '## Imports',
    markdownList((input.imports ?? []).slice(0, 6).map((importRecord) => `${importRecord.title} (${importRecord.sourceType})`)),
    '',
    '## Source',
    `- Lucid OS admin record: admin://lucid-os/clients/${client.slug}`,
    `- Implementation source: [[${LUCID_OS_SOURCE}]]`,
    GENERATED_END,
  ].join('\n');
}

function initialClientPage(client: LucidClientSummary, generatedBlock: string): string {
  const date = today();
  return `---
title: "${client.name.replace(/"/g, '\\"')}"
type: entity
slug: ${client.slug}
created: ${date}
updated: ${date}
status: draft
tags: [business, client]
sources: [sources/2026-05-04--lucid-os-implementation]
related: [concepts/lucid-os, entities/lucid-lab]
aliases: []
confidence: med
---

**${client.name}** is a Lucid-Lab client or prospect tracked in [[wiki/concepts/lucid-os]].

${generatedBlock}

## See also
- [[wiki/concepts/lucid-os]]
- [[wiki/entities/lucid-lab]]

## Sources
- [[${LUCID_OS_SOURCE}]]
`;
}

function replaceGeneratedBlock(existing: string, generatedBlock: string): string {
  const generatedPattern = new RegExp(`${GENERATED_START}[\\s\\S]*?${GENERATED_END}`);
  const withUpdatedFrontmatter = existing.replace(/^updated:\s*.*$/m, `updated: ${today()}`);
  if (generatedPattern.test(withUpdatedFrontmatter)) {
    return withUpdatedFrontmatter.replace(generatedPattern, generatedBlock);
  }
  return `${withUpdatedFrontmatter.trim()}\n\n${generatedBlock}\n`;
}

async function upsertEntityIndex(root: string, client: LucidClientSummary): Promise<void> {
  const indexPath = path.join(root, 'index.md');
  const index = await readFile(indexPath, 'utf8');
  const entry = `- [[wiki/entities/${client.slug}]] - ${client.name}; Lucid OS client record synced from the CRM. #business`;
  const existingPattern = new RegExp(`^- \\[\\[wiki/entities/${client.slug}\\]\\].*$`, 'm');
  let nextIndex = existingPattern.test(index) ? index.replace(existingPattern, entry) : index;

  if (nextIndex === index) {
    nextIndex = /### Entities\n/.test(index)
      ? index.replace(/(### Entities\n)/, `$1${entry}\n`)
      : `${index.trimEnd()}\n\n### Entities\n${entry}\n`;
  }

  nextIndex = nextIndex.replace(/^\*\*Last update:\*\* .*$/m, `**Last update:** ${today()}`);
  await writeFile(indexPath, nextIndex, 'utf8');
}

async function appendLog(root: string, title: string, pages: string, notes: string): Promise<void> {
  const logPath = path.join(root, 'log.md');
  const entry = `\n## [${today()}] synth | ${title}\n- pages: ${pages}\n- raw: none\n- notes: ${notes}\n`;
  await writeFile(logPath, entry, { encoding: 'utf8', flag: 'a' });
}

export async function syncLucidClientToObsidian(input: LucidClientObsidianSyncInput): Promise<boolean> {
  const root = vaultPath();
  if (!(await vaultExists(root))) return false;

  const entitiesDir = path.join(root, 'wiki/entities');
  await mkdir(entitiesDir, { recursive: true });
  const pagePath = path.join(entitiesDir, `${input.client.slug}.md`);
  const generatedBlock = generatedClientBlock(input);

  let existing = '';
  try {
    existing = await readFile(pagePath, 'utf8');
  } catch {
    existing = '';
  }

  const content = existing ? replaceGeneratedBlock(existing, generatedBlock) : initialClientPage(input.client, generatedBlock);
  await writeFile(pagePath, content, 'utf8');
  await upsertEntityIndex(root, input.client);
  await appendLog(root, `Lucid OS client sync: ${input.client.name}`, `wiki/entities/${input.client.slug}.md, index.md`, `Synced ${input.reason} data from Lucid OS.`);
  return true;
}

export async function markLucidClientDeletedInObsidian(input: LucidClientObsidianDeletionInput): Promise<boolean> {
  const root = vaultPath();
  if (!(await vaultExists(root))) return false;

  const pagePath = path.join(root, 'wiki/entities', `${input.clientSlug}.md`);
  let existing = '';
  try {
    existing = await readFile(pagePath, 'utf8');
  } catch {
    return false;
  }

  const deletionBlock = [
    GENERATED_START,
    `> [!warning] Deleted from Lucid OS on ${input.deletedAt}. This page is retained as historical business context unless explicitly removed from the vault.`,
    '',
    '## Lucid OS Snapshot',
    '- Status: deleted from Lucid OS',
    `- Source: admin://lucid-os/clients/${input.clientSlug}`,
    GENERATED_END,
  ].join('\n');

  const content = replaceGeneratedBlock(existing.replace(/^status:\s*.*$/m, 'status: archived'), deletionBlock);
  await writeFile(pagePath, content, 'utf8');
  await appendLog(root, `Lucid OS client deleted: ${input.clientName}`, `wiki/entities/${input.clientSlug}.md`, 'Marked the generated Lucid OS block as deleted without removing the wiki page.');
  return true;
}
