'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import {
  clearAdminSessionCookie,
  isAdminAuthenticated,
  isValidAdminKey,
  setAdminSessionCookie,
} from '@/lib/admin/auth';
import { config } from '@/lib/bot/config';
import { logSecurityEvent } from '@/lib/bot/db/queries/security-audit';
import { updateConversation, type Conversation } from '@/lib/bot/db/queries/conversations';
import { updateLead, type Lead } from '@/lib/bot/db/queries/leads';

const leadStatuses = new Set<Lead['status']>(['new', 'contacted', 'qualified', 'converted', 'lost']);
const conversationStatuses = new Set<Conversation['status']>(['active', 'escalated', 'closed']);

async function requireAdminAction(): Promise<void> {
  if (!(await isAdminAuthenticated())) {
    redirect('/admin/login');
  }
}


function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

export async function loginAdmin(formData: FormData): Promise<void> {
  const adminKey = formString(formData, 'admin_key');

  if (!config.adminApiKey) {
    redirect('/admin/login?error=missing');
  }

  if (!isValidAdminKey(adminKey)) {
    await logSecurityEvent({
      event_type: 'admin_unauthorized',
      details: { route: 'admin/login' },
    });
    redirect('/admin/login?error=invalid');
  }

  await setAdminSessionCookie();
  await logSecurityEvent({
    event_type: 'admin_access',
    details: { route: 'admin/login' },
  });

  redirect('/admin/lucid-os');
}

export async function logoutAdmin(): Promise<void> {
  await clearAdminSessionCookie();
  redirect('/admin/login');
}

export async function updateLeadStatusAction(formData: FormData): Promise<void> {
  await requireAdminAction();

  const leadId = formString(formData, 'lead_id');
  const contactId = formString(formData, 'contact_id');
  const status = formString(formData, 'status') as Lead['status'];

  if (!leadId || !contactId || !leadStatuses.has(status)) {
    throw new Error('Invalid lead status update');
  }

  await updateLead(leadId, { status });
  await logSecurityEvent({
    contact_id: contactId,
    event_type: 'admin_access',
    details: { route: 'admin/lead-status', lead_id: leadId, status },
  });

  revalidatePath('/admin');
  revalidatePath(`/admin/contacts/${contactId}`);
}

export async function updateLeadNotesAction(formData: FormData): Promise<void> {
  await requireAdminAction();

  const leadId = formString(formData, 'lead_id');
  const contactId = formString(formData, 'contact_id');
  const notes = formString(formData, 'notes');

  if (!leadId || !contactId) {
    throw new Error('Invalid lead notes update');
  }

  await updateLead(leadId, { notes: notes || null });
  await logSecurityEvent({
    contact_id: contactId,
    event_type: 'admin_access',
    details: { route: 'admin/lead-notes', lead_id: leadId },
  });

  revalidatePath('/admin');
  revalidatePath(`/admin/contacts/${contactId}`);
}

export async function updateConversationStatusAction(formData: FormData): Promise<void> {
  await requireAdminAction();

  const conversationId = formString(formData, 'conversation_id');
  const contactId = formString(formData, 'contact_id');
  const status = formString(formData, 'status') as Conversation['status'];

  if (!conversationId || !contactId || !conversationStatuses.has(status)) {
    throw new Error('Invalid conversation status update');
  }

  await updateConversation(conversationId, {
    status,
    closed_at: status === 'closed' ? new Date().toISOString() : null,
    escalated_at: status === 'escalated' ? new Date().toISOString() : null,
  });
  await logSecurityEvent({
    contact_id: contactId,
    event_type: 'admin_access',
    details: { route: 'admin/conversation-status', conversation_id: conversationId, status },
  });

  revalidatePath('/admin');
  revalidatePath(`/admin/contacts/${contactId}`);
}