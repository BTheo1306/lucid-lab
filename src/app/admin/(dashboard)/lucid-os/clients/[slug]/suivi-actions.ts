'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin/auth';
import { planifierSuiviSetupClaude } from '@/lib/admin/suivi-setup-claude';

/**
 * Pose les deux calls de suivi prévus par le process d'installation Claude
 * (docs/process-setup-claude.md) : un à une semaine, un à un mois.
 */
export async function planifierSuiviSetupClaudeAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const clientId = String(formData.get('client_id') ?? '');
  const slug = String(formData.get('client_slug') ?? '');
  const livreLe = String(formData.get('livre_le') ?? '').trim() || null;
  const ownerLabel = String(formData.get('owner_label') ?? '').trim() || null;

  if (!clientId) throw new Error('Client manquant.');

  await planifierSuiviSetupClaude({ clientId, livreLe, ownerLabel });

  revalidatePath(`/admin/lucid-os/clients/${encodeURIComponent(slug)}`);
}
