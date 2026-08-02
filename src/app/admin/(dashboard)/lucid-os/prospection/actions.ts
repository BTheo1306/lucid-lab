'use server';

import { revalidatePath } from 'next/cache';
import { requireAdmin } from '@/lib/admin/auth';
import {
  isProspectionOutcome,
  recordProspectionTouch,
  setProspectionOwner,
  type ProspectionOutcome,
} from '@/lib/admin/prospection';

const OWNERS = new Set(['Jules', 'Anthony', 'Théo']);

/**
 * Enregistre l'issue d'un appel ou d'un email.
 * Renvoie l'identifiant du client créé quand l'issue vaut promotion au CRM,
 * pour que le board puisse pointer vers la fiche.
 */
export async function recordTouchAction(input: {
  companyId: string;
  personId: string | null;
  outcome: string;
  notes?: string | null;
  ownerLabel?: string | null;
  callbackAt?: string | null;
}): Promise<{ clientId: string | null }> {
  await requireAdmin();

  if (!isProspectionOutcome(input.outcome)) throw new Error("Issue d'appel inconnue.");
  const owner = input.ownerLabel && OWNERS.has(input.ownerLabel) ? input.ownerLabel : null;

  const result = await recordProspectionTouch({
    companyId: input.companyId,
    personId: input.personId,
    outcome: input.outcome as ProspectionOutcome,
    notes: input.notes?.trim() || null,
    ownerLabel: owner,
    callbackAt: input.callbackAt || null,
  });

  revalidatePath('/admin/lucid-os/prospection');
  if (result.clientId) revalidatePath('/admin/lucid-os/clients');
  return result;
}

export async function setOwnerAction(companyId: string, ownerLabel: string): Promise<void> {
  await requireAdmin();
  const owner = OWNERS.has(ownerLabel) ? ownerLabel : null;
  await setProspectionOwner(companyId, owner);
  revalidatePath('/admin/lucid-os/prospection');
}
