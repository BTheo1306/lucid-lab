'use server';

import { revalidatePath } from 'next/cache';
import { setOutreachEnabled } from '@/lib/admin/lead-engine-control';
import { runLeadPipeline } from '@/lib/admin/lead-engine-pipeline';

export async function toggleOutreachAction(formData: FormData): Promise<void> {
  await setOutreachEnabled(formData.get('enabled') === 'true');
  revalidatePath('/admin/lead-engine/engine');
}

export async function runPipelineAction(formData: FormData): Promise<void> {
  const dryRun = formData.get('dryRun') === 'true';
  await runLeadPipeline({ limitPerCampaign: dryRun ? 5 : 3, dryRun });
  revalidatePath('/admin/lead-engine/engine');
  revalidatePath('/admin/lead-engine');
}
