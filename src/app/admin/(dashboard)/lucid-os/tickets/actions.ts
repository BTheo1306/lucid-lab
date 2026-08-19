'use server';

import { revalidatePath } from 'next/cache';
import { adminRedirect, requireAdmin } from '@/lib/admin/auth';
import { replyToTicket, setTicketPriority, type TicketReplyStatus } from '@/lib/admin/tickets';

const REPLY_STATUSES = new Set<string>(['waiting', 'in_progress', 'done', 'declined']);
const PRIORITIES = new Set(['low', 'normal', 'high', 'urgent']);

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function revalidateTickets(requestId: string): void {
  revalidatePath('/admin/lucid-os/tickets');
  revalidatePath(`/admin/lucid-os/tickets/${requestId}`);
  revalidatePath('/admin/lucid-os/inbox');
}

/** Message et/ou changement de statut d'un ticket, avec email au client. */
export async function replyTicketAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const requestId = formString(formData, 'request_id');
  const status = formString(formData, 'ticket_status');
  const message = formString(formData, 'message');

  if (!requestId) return adminRedirect('/admin/lucid-os/tickets');
  if (!REPLY_STATUSES.has(status)) {
    return adminRedirect(`/admin/lucid-os/tickets/${requestId}`);
  }
  // Repondre sans message n'aurait pas de sens : le client recevrait un email
  // "a recu une reponse" sans reponse.
  if (status === 'waiting' && !message) {
    return adminRedirect(`/admin/lucid-os/tickets/${requestId}?ticket_error=message_requis`);
  }

  let failed = false;
  try {
    await replyToTicket({ requestId, status: status as TicketReplyStatus, body: message || null });
  } catch (error) {
    console.error('[tickets] replyTicketAction failed:', error instanceof Error ? error.message : error);
    failed = true;
  }
  if (failed) return adminRedirect(`/admin/lucid-os/tickets/${requestId}?ticket_error=echec`);

  revalidateTickets(requestId);
  return adminRedirect(`/admin/lucid-os/tickets/${requestId}?traite=1`);
}

export async function setTicketPriorityAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const requestId = formString(formData, 'request_id');
  const priority = formString(formData, 'priority');

  if (!requestId) return adminRedirect('/admin/lucid-os/tickets');
  if (!PRIORITIES.has(priority)) {
    return adminRedirect(`/admin/lucid-os/tickets/${requestId}`);
  }

  let failed = false;
  try {
    await setTicketPriority(requestId, priority);
  } catch (error) {
    console.error('[tickets] setTicketPriorityAction failed:', error instanceof Error ? error.message : error);
    failed = true;
  }
  if (failed) return adminRedirect(`/admin/lucid-os/tickets/${requestId}?ticket_error=echec`);

  revalidateTickets(requestId);
  return adminRedirect(`/admin/lucid-os/tickets/${requestId}?priorite=1`);
}
