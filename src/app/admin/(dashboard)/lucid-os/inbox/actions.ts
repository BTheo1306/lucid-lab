'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin/auth';
import { updateLucidAgentTaskStatus, type LucidAgentTaskStatus } from '@/lib/admin/lucid-os';

const taskStatuses = new Set<LucidAgentTaskStatus>([
  'backlog',
  'ready',
  'in_progress',
  'blocked',
  'waiting_approval',
  'done',
  'cancelled',
]);

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

export async function updateAgentTaskStatusAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const taskId = formString(formData, 'task_id');
  const status = formString(formData, 'status') as LucidAgentTaskStatus;

  if (!taskId) throw new Error('Agent task ID is missing.');
  if (!taskStatuses.has(status)) throw new Error('Unsupported agent task status.');

  await updateLucidAgentTaskStatus({ taskId, status, actorLabel: 'lucid_os_admin' });

  revalidatePath('/admin/lucid-os');
  revalidatePath('/admin/lucid-os/inbox');
  revalidatePath('/admin/lucid-os/agents');
}