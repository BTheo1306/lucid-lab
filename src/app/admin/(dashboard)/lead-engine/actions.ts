'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin/auth';
import { setOutreachEnabled } from '@/lib/admin/lead-engine-control';
import { runLeadPipeline } from '@/lib/admin/lead-engine-pipeline';
import { getSenderAccountByLabel, markHumanTouchSent, revertHumanTouchSend } from '@/lib/admin/lead-engine-store';

export async function toggleOutreachAction(formData: FormData): Promise<void> {
  await requireAdmin();
  await setOutreachEnabled(formData.get('enabled') === 'true');
  revalidatePath('/admin/lead-engine');
}

export async function runPipelineAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const dryRun = formData.get('dryRun') === 'true';
  await runLeadPipeline({ limitPerCampaign: dryRun ? 5 : 3, dryRun });
  revalidatePath('/admin/lead-engine');
}

/** Anthony confirming a hand-sent (or skipped) human-touch lead, via the same path the auto-runner uses. */
export async function markHumanTouchOutcomeAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const messageId = String(formData.get('messageId') ?? '');
  if (!messageId) throw new Error('messageId manquant.');
  const outcome = formData.get('outcome') === 'skipped' ? 'skipped' : 'sent';

  const sender = await getSenderAccountByLabel('Anthony', 'linkedin');
  if (!sender) throw new Error('Compte émetteur "Anthony" introuvable.');

  await markHumanTouchSent({ messageId, senderAccountId: sender.id, outcome });
  revalidatePath('/admin/lead-engine');
}

/** Undoes a mistaken "Marquer comme envoyé" click. Human-touch only — see revertHumanTouchSend. */
export async function undoHumanTouchOutcomeAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const messageId = String(formData.get('messageId') ?? '');
  if (!messageId) throw new Error('messageId manquant.');

  await revertHumanTouchSend(messageId);
  revalidatePath('/admin/lead-engine');
}
