'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin/auth';
import { setTaskClientVisibility } from '@/lib/admin/portal';
import { supabase } from '@/lib/bot/db/supabase';

const ORG_SLUG = 'lucid-lab';

/** Eye toggle on the task boards: publish or hide a task on the client portal. */
export async function setClientTaskVisibilityAction(taskId: string, visible: boolean): Promise<void> {
  await requireAdmin();
  await setTaskClientVisibility(taskId, visible);
  revalidatePath('/admin/lucid-os');
}

export async function updateAnyClientTaskStatus(taskId: string, status: string): Promise<void> {
  const { error } = await supabase
    .from('client_tasks')
    .update({ status })
    .eq('id', taskId);

  if (error) throw new Error(error.message);
  revalidatePath('/admin/lucid-os');
}

export async function createClientTaskAction(formData: FormData): Promise<void> {
  const title = (formData.get('title') as string | null)?.trim();
  const description = (formData.get('description') as string | null)?.trim() || null;
  const clientId = (formData.get('client_id') as string | null) || null;
  const ownerLabel = (formData.get('owner_label') as string | null)?.trim() || null;
  const priority = (formData.get('priority') as string | null) || 'normal';
  const dueAt = (formData.get('due_at') as string | null) || null;

  if (!title) throw new Error('Le titre est requis.');

  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', ORG_SLUG)
    .maybeSingle();

  if (!org) throw new Error('Organisation introuvable.');

  const { error } = await supabase.from('client_tasks').insert({
    organization_id: (org as { id: string }).id,
    client_id: clientId || null,
    title,
    description,
    owner_label: ownerLabel,
    priority,
    due_at: dueAt || null,
    status: 'todo',
  });

  if (error) throw new Error(error.message);
  revalidatePath('/admin/lucid-os');
}
