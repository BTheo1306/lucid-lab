'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/auth';
import {
  answerClientRequest,
  createAgencyRequest,
  sendPortalInviteForContact,
  setContactPortalAccess,
  setInteractionClientVisibility,
  updateInteractionClientSummary,
} from '@/lib/admin/portal';

function clientPath(slug: string): string {
  return `/admin/lucid-os/clients/${encodeURIComponent(slug)}`;
}

export async function setContactPortalAccessAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const contactId = String(formData.get('contact_id') ?? '');
  const slug = String(formData.get('client_slug') ?? '');
  const enabled = String(formData.get('enabled') ?? '') === 'true';

  let errorMessage: string | null = null;
  try {
    await setContactPortalAccess(contactId, enabled);
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
  }

  if (errorMessage) {
    redirect(`${clientPath(slug)}?client_error=${encodeURIComponent(errorMessage)}`);
  }
  revalidatePath(clientPath(slug));
}

export async function sendPortalInviteAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const contactId = String(formData.get('contact_id') ?? '');
  const slug = String(formData.get('client_slug') ?? '');

  let errorMessage: string | null = null;
  try {
    await sendPortalInviteForContact(contactId);
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
  }

  if (errorMessage) {
    redirect(`${clientPath(slug)}?client_error=${encodeURIComponent(errorMessage)}`);
  }
  revalidatePath(clientPath(slug));
}

export async function createAgencyRequestAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const clientId = String(formData.get('client_id') ?? '');
  const slug = String(formData.get('client_slug') ?? '');
  const rawType = String(formData.get('request_type') ?? 'question');
  const requestType = (['approval', 'asset_request', 'info_request', 'question'].includes(rawType)
    ? rawType
    : 'question') as 'approval' | 'asset_request' | 'info_request' | 'question';

  let errorMessage: string | null = null;
  try {
    await createAgencyRequest({
      clientId,
      requestType,
      title: String(formData.get('title') ?? ''),
      body: String(formData.get('body') ?? '') || null,
      dueAt: String(formData.get('due_at') ?? '') || null,
    });
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
  }

  if (errorMessage) {
    redirect(`${clientPath(slug)}?client_error=${encodeURIComponent(errorMessage)}`);
  }
  revalidatePath(clientPath(slug));
}

export async function answerClientRequestAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const requestId = String(formData.get('request_id') ?? '');
  const slug = String(formData.get('client_slug') ?? '');
  const rawStatus = String(formData.get('request_status') ?? 'done');
  const status = (['in_progress', 'done', 'declined'].includes(rawStatus) ? rawStatus : 'done') as
    | 'in_progress'
    | 'done'
    | 'declined';

  let errorMessage: string | null = null;
  try {
    await answerClientRequest({
      requestId,
      status,
      responseNote: String(formData.get('response_note') ?? '') || null,
    });
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
  }

  if (errorMessage) {
    redirect(`${clientPath(slug)}?client_error=${encodeURIComponent(errorMessage)}`);
  }
  revalidatePath(clientPath(slug));
  revalidatePath('/admin/lucid-os/inbox');
}

export async function setInteractionVisibilityAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const interactionId = String(formData.get('interaction_id') ?? '');
  const slug = String(formData.get('client_slug') ?? '');
  const visible = String(formData.get('visible') ?? '') === 'true';

  let errorMessage: string | null = null;
  try {
    await setInteractionClientVisibility(interactionId, visible);
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
  }

  if (errorMessage) {
    redirect(`${clientPath(slug)}?client_error=${encodeURIComponent(errorMessage)}`);
  }
  revalidatePath(clientPath(slug));
}

export async function updateInteractionClientSummaryAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const interactionId = String(formData.get('interaction_id') ?? '');
  const slug = String(formData.get('client_slug') ?? '');
  const clientSummary = String(formData.get('client_summary') ?? '');

  let errorMessage: string | null = null;
  try {
    await updateInteractionClientSummary(interactionId, clientSummary);
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
  }

  if (errorMessage) {
    redirect(`${clientPath(slug)}?client_error=${encodeURIComponent(errorMessage)}`);
  }
  revalidatePath(clientPath(slug));
}
