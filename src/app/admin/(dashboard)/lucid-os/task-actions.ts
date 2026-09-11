'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin/auth';
import { recordLucidAuditEvent } from '@/lib/admin/lucid-os';
import { setTaskClientVisibility } from '@/lib/admin/portal';
import { supabase } from '@/lib/bot/db/supabase';

const ORG_SLUG = 'lucid-lab';

const TASK_STATUSES = new Set(['todo', 'in_progress', 'waiting', 'done', 'cancelled']);

/** Eye toggle on the task boards: publish or hide a task on the client portal. */
export async function setClientTaskVisibilityAction(taskId: string, visible: boolean): Promise<void> {
  await requireAdmin();
  await setTaskClientVisibility(taskId, visible);
  revalidatePath('/admin/lucid-os');
}

export async function updateAnyClientTaskStatus(taskId: string, status: string): Promise<void> {
  await requireAdmin();
  if (!TASK_STATUSES.has(status)) throw new Error('Task status is invalid.');

  const { error } = await supabase
    .from('client_tasks')
    .update({
      status,
      // Sans cette date, impossible de savoir depuis quand une tâche est finie
      // ni de purger les plus anciennes.
      completed_at: status === 'done' ? new Date().toISOString() : null,
    })
    .eq('id', taskId);

  if (error) throw new Error(error.message);
  revalidatePath('/admin/lucid-os');
}

/** Corbeille d'une carte du tableau. Suppression définitive. */
export async function deleteClientTaskAction(taskId: string): Promise<void> {
  await requireAdmin();

  const { data, error } = await supabase
    .from('client_tasks')
    .delete()
    .eq('id', taskId)
    .select('id,title,client_id')
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) throw new Error('Tâche introuvable.');

  await recordLucidAuditEvent({
    clientId: data.client_id ? String(data.client_id) : undefined,
    actorType: 'admin',
    eventType: 'client_task_deleted',
    targetTable: 'client_tasks',
    targetId: String(data.id),
    summary: `Tâche supprimée : ${String(data.title)}`,
  });

  revalidatePath('/admin/lucid-os');
}

/**
 * Vide la colonne « Fini » d'un coup. Sans clientId, vide tout le tableau de
 * bord ; avec, seulement la fiche du client. Retourne le nombre supprimé.
 */
export async function clearDoneClientTasksAction(clientId?: string): Promise<number> {
  await requireAdmin();

  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', ORG_SLUG)
    .maybeSingle();

  if (!org) throw new Error('Organisation introuvable.');

  let query = supabase
    .from('client_tasks')
    .delete()
    .eq('organization_id', (org as { id: string }).id)
    .eq('status', 'done');

  if (clientId) query = query.eq('client_id', clientId);

  const { data, error } = await query.select('id');

  if (error) throw new Error(error.message);
  const deleted = (data ?? []).length;

  await recordLucidAuditEvent({
    clientId: clientId ?? undefined,
    actorType: 'admin',
    eventType: 'client_tasks_done_cleared',
    targetTable: 'client_tasks',
    summary: `Colonne Fini vidée : ${deleted} tâche(s) supprimée(s)`,
    details: { deleted, scope: clientId ? 'client' : 'dashboard' },
  });

  revalidatePath('/admin/lucid-os');
  return deleted;
}

export async function createClientTaskAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const title = (formData.get('title') as string | null)?.trim();
  const description = (formData.get('description') as string | null)?.trim() || null;
  const clientId = (formData.get('client_id') as string | null) || null;
  const ownerLabel = (formData.get('owner_label') as string | null)?.trim() || null;
  const priority = (formData.get('priority') as string | null) || 'normal';
  const dueAt = (formData.get('due_at') as string | null) || null;
  const clientVisible = formData.get('client_visible') === '1';

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
    client_visible: clientVisible,
  });

  if (error) throw new Error(error.message);
  revalidatePath('/admin/lucid-os');
}
