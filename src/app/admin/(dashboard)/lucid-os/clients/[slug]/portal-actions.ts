'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/auth';
import { sendPortalInviteForContact, setContactPortalAccess } from '@/lib/admin/portal';

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
