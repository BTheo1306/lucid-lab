'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { isAdminAuthenticated } from '@/lib/admin/auth';
import { upsertLucidKnowledgeDocument, type UpsertKnowledgeDocumentInput } from '@/lib/admin/lucid-os';

const sourceSystems = new Set<UpsertKnowledgeDocumentInput['sourceSystem']>([
  'admin',
  'github',
  'integration',
  'obsidian',
  'supabase',
  'web',
]);

async function requireAdminAction(): Promise<void> {
  if (!(await isAdminAuthenticated())) {
    redirect('/admin/login');
  }
}

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export async function recordKnowledgeDocumentAction(formData: FormData): Promise<void> {
  await requireAdminAction();

  const title = formString(formData, 'title');
  const slug = formString(formData, 'slug') || slugify(title);
  const sourceSystemRaw = formString(formData, 'source_system') as UpsertKnowledgeDocumentInput['sourceSystem'];
  const sourceSystem = sourceSystems.has(sourceSystemRaw) ? sourceSystemRaw : 'admin';
  const sourceUri = formString(formData, 'source_uri');
  const summary = formString(formData, 'summary');
  const content = formString(formData, 'content');
  const chunkContent = content || summary;

  if (!title || !slug || !summary) {
    throw new Error('Title, slug, and summary are required to record a knowledge document');
  }

  await upsertLucidKnowledgeDocument({
    title,
    slug,
    sourceSystem,
    sourceUri: sourceUri || null,
    summary,
    content: content || summary,
    status: 'active',
    visibility: 'internal',
    metadata: {
      captured_by: 'admin_lucid_os_knowledge_form',
    },
    chunks: chunkContent ? [{ heading: title, content: chunkContent }] : [],
    auditActorType: 'admin',
  });

  revalidatePath('/admin/lucid-os');
  revalidatePath('/admin/lucid-os/knowledge');
}
