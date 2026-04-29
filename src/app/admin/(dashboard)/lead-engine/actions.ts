'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/auth';
import {
  approveLeadEngineSandboxDraft,
  commitCustomCampaignSelection,
  discardCustomCampaign,
  recordLeadEngineSandboxManualSend,
  resetLeadEngineSandbox,
  runLeadEngineSandboxDiscovery,
  saveCustomCampaignDraft,
} from '@/lib/admin/lead-engine-sandbox';
import { generateCustomCampaignCandidates } from '@/lib/admin/lead-engine-generator';

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function revalidateLeadEngine(): void {
  revalidatePath('/admin/lead-engine');
  revalidatePath('/admin/lead-engine/prospects');
  revalidatePath('/admin/lead-engine/campaigns');
  revalidatePath('/admin/lead-engine/runs');
  revalidatePath('/admin/lead-engine/outreach');
}

export async function runLeadEngineDryRunAction(): Promise<void> {
  await requireAdmin();
  await runLeadEngineSandboxDiscovery();
  revalidateLeadEngine();
  redirect('/admin/lead-engine/outreach');
}

export async function resetLeadEngineSandboxAction(): Promise<void> {
  await requireAdmin();
  await resetLeadEngineSandbox();
  revalidateLeadEngine();
  redirect('/admin/lead-engine');
}

export async function approveLeadEngineDraftAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const messageId = formString(formData, 'message_id');
  if (!messageId) throw new Error('Missing Lead Engine message id');
  await approveLeadEngineSandboxDraft(messageId);
  revalidateLeadEngine();
  redirect('/admin/lead-engine/outreach');
}

export async function recordLeadEngineManualSendAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const messageId = formString(formData, 'message_id');
  if (!messageId) throw new Error('Missing Lead Engine message id');
  await recordLeadEngineSandboxManualSend(messageId);
  revalidateLeadEngine();
  redirect('/admin/lead-engine/outreach');
}

export type CreateCustomCampaignState = {
  status: 'idle' | 'error';
  error?: string;
};

export async function createCustomCampaignAction(
  _prev: CreateCustomCampaignState,
  formData: FormData,
): Promise<CreateCustomCampaignState> {
  await requireAdmin();
  const name = formString(formData, 'name');
  const prompt = formString(formData, 'prompt');
  const languageRaw = formString(formData, 'language');
  const countRaw = formString(formData, 'count');
  const language = languageRaw === 'en' ? 'en' : 'fr';
  const count = Math.max(1, Math.min(10, Number.parseInt(countRaw, 10) || 5));

  if (name.length < 3) return { status: 'error', error: 'Campaign name must be at least 3 characters.' };
  if (prompt.length < 20) return { status: 'error', error: 'Describe the target with more detail (at least 20 characters).' };

  let candidates;
  try {
    candidates = await generateCustomCampaignCandidates({ campaignName: name, prompt, language, count });
  } catch (error) {
    const raw = error instanceof Error ? error.message : 'Failed to generate candidates.';
    // Surface a friendly upgrade message when the Apollo API key lacks search access.
    if (raw.includes('API_INACCESSIBLE') || raw.includes('is not accessible with this api_key')) {
      return {
        status: 'error',
        error:
          'Your Apollo plan does not include API search access. Upgrade to at least the Basic plan at https://app.apollo.io/ then regenerate.',
      };
    }
    return { status: 'error', error: raw };
  }

  const campaign = await saveCustomCampaignDraft({ name, prompt, language, candidates });
  revalidateLeadEngine();
  redirect(`/admin/lead-engine/campaigns/${campaign.id}/review`);
}

export async function saveCustomCampaignSelectionAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const campaignId = formString(formData, 'campaign_id');
  if (!campaignId) throw new Error('Missing campaign id');
  const selectedCandidateIds = formData.getAll('candidate_id').map((value) => String(value)).filter(Boolean);
  if (selectedCandidateIds.length === 0) throw new Error('Select at least one prospect to save.');
  await commitCustomCampaignSelection({ campaignId, selectedCandidateIds });
  revalidateLeadEngine();
  redirect('/admin/lead-engine/outreach');
}

export async function discardCustomCampaignAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const campaignId = formString(formData, 'campaign_id');
  if (!campaignId) throw new Error('Missing campaign id');
  await discardCustomCampaign(campaignId);
  revalidateLeadEngine();
  redirect('/admin/lead-engine/campaigns');
}