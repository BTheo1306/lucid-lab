import Link from 'next/link';
import { ArrowLeft, Building2 } from 'lucide-react';
import { adminBasePath, requireAdmin } from '@/lib/admin/auth';
import {
  TICKET_PRIORITY_META,
  TICKET_STATUS_META,
  TICKET_TYPE_LABELS,
  getTicketDetail,
  type TicketMessage,
} from '@/lib/admin/tickets';
import { cn } from '@/lib/utils';
import { EmptyState, StatusBadge, formatAdminDateTime } from '../../components';
import { replyTicketAction, setTicketPriorityAction } from '../actions';

export const dynamic = 'force-dynamic';

function messageAuthor(message: TicketMessage): string {
  if (message.sender === 'team') return 'Lucid-Lab';
  return message.contactName ?? message.authorLabel ?? 'Client';
}

function ThreadMessage({
  author,
  date,
  body,
  fromTeam,
}: {
  author: string;
  date: string;
  body: string;
  fromTeam: boolean;
}) {
  return (
    <div className={cn('rounded-xl border p-4', fromTeam ? 'border-zinc-300 bg-zinc-50' : 'border-zinc-200 bg-white')}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">{author}</p>
        <p className="text-xs text-zinc-400">{date}</p>
      </div>
      <p className="mt-2 text-sm leading-6 whitespace-pre-line text-zinc-700">{body}</p>
    </div>
  );
}

interface PageProps {
  params: Promise<{ requestId: string }>;
  searchParams?: Promise<{ traite?: string; priorite?: string; ticket_error?: string }>;
}

export default async function TicketDetailPage({ params, searchParams }: PageProps) {
  await requireAdmin();
  const base = await adminBasePath();
  const { requestId } = await params;
  const flash = searchParams ? await searchParams : {};

  const detail = await getTicketDetail(requestId);

  if (!detail) {
    return (
      <div className="grid gap-6">
        <Link href={`${base}/lucid-os/tickets`} className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-950">
          <ArrowLeft className="size-4" />
          Retour aux tickets
        </Link>
        <EmptyState>Ticket introuvable.</EmptyState>
      </div>
    );
  }

  const { ticket, messages } = detail;
  const isTicket = ticket.direction === 'client_to_agency';
  const statusMeta = TICKET_STATUS_META[ticket.status] ?? { label: ticket.status, tone: 'neutral' as const };
  const priorityMeta = TICKET_PRIORITY_META[ticket.priority] ?? TICKET_PRIORITY_META.normal;

  const errorMessage =
    flash.ticket_error === 'message_requis'
      ? 'Écrivez un message avant de répondre au client.'
      : flash.ticket_error
        ? "L'action a échoué. Réessayez."
        : null;
  const successMessage =
    flash.traite === '1' ? 'Réponse enregistrée, le client est prévenu par email.' : flash.priorite === '1' ? 'Priorité mise à jour.' : null;

  return (
    <div className="grid gap-6">
      <Link href={`${base}/lucid-os/tickets`} className="inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-950">
        <ArrowLeft className="size-4" />
        Retour aux tickets
      </Link>

      <header className="grid gap-2 border-b border-zinc-200 pb-4">
        <div className="flex flex-wrap items-center gap-2.5">
          <span className="text-sm font-semibold text-zinc-400">#{ticket.reference}</span>
          <h1 className="text-2xl font-semibold tracking-[-0.03em] text-zinc-950">{ticket.title}</h1>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone={statusMeta.tone}>{statusMeta.label}</StatusBadge>
          <StatusBadge tone={priorityMeta.tone}>Priorité {priorityMeta.label.toLowerCase()}</StatusBadge>
          <StatusBadge tone="neutral">{TICKET_TYPE_LABELS[ticket.requestType] ?? ticket.requestType}</StatusBadge>
          {!isTicket ? <StatusBadge tone="neutral">Demande agence vers client</StatusBadge> : null}
        </div>
        <p className="text-sm text-zinc-500">
          {ticket.clientSlug ? (
            <Link
              href={`${base}/lucid-os/clients/${ticket.clientSlug}`}
              className="inline-flex items-center gap-1.5 font-medium text-blue-700 hover:underline"
            >
              <Building2 className="size-3.5" />
              {ticket.clientName ?? ticket.clientSlug}
            </Link>
          ) : (
            <span>{ticket.clientName ?? 'Client inconnu'}</span>
          )}
          {ticket.createdByContactName ? ` · Créé par ${ticket.createdByContactName}` : ''}
          {' · '}
          {formatAdminDateTime(ticket.createdAt)}
        </p>
      </header>

      {errorMessage ? (
        <p className="rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-700">{errorMessage}</p>
      ) : null}
      {successMessage ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800">{successMessage}</p>
      ) : null}

      <div className="grid gap-3">
        {ticket.body ? (
          <ThreadMessage
            author={isTicket ? (ticket.createdByContactName ?? 'Client') : 'Lucid-Lab'}
            date={formatAdminDateTime(ticket.createdAt)}
            body={ticket.body}
            fromTeam={!isTicket}
          />
        ) : null}
        {messages.map((message) => (
          <ThreadMessage
            key={message.id}
            author={messageAuthor(message)}
            date={formatAdminDateTime(message.createdAt)}
            body={message.body}
            fromTeam={message.sender === 'team'}
          />
        ))}
        {!ticket.body && messages.length === 0 ? <EmptyState>Aucun message dans ce fil.</EmptyState> : null}
      </div>

      {isTicket ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_260px]">
          <form action={replyTicketAction} className="grid gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <input type="hidden" name="request_id" value={ticket.id} />
            <label className="grid gap-1.5 text-sm font-medium text-zinc-800">
              Répondre au client
              <textarea
                name="message"
                rows={4}
                maxLength={5000}
                placeholder="Votre réponse arrive dans le fil du ticket et par email au client."
                className="rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm leading-6 outline-none transition focus:border-zinc-950"
              />
            </label>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="submit"
                name="ticket_status"
                value="waiting"
                className="inline-flex h-9 items-center rounded border border-blue-200 bg-blue-50 px-3 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
              >
                Répondre
              </button>
              <button
                type="submit"
                name="ticket_status"
                value="in_progress"
                className="inline-flex h-9 items-center rounded border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50"
              >
                Prendre en charge
              </button>
              <button
                type="submit"
                name="ticket_status"
                value="done"
                className="inline-flex h-9 items-center rounded border border-emerald-200 bg-emerald-50 px-3 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
              >
                Résoudre
              </button>
              <button
                type="submit"
                name="ticket_status"
                value="declined"
                className="inline-flex h-9 items-center rounded border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-500 transition hover:bg-zinc-50"
              >
                Refuser
              </button>
            </div>
            <p className="text-xs text-zinc-500">
              Répondre remet le ticket en attente du client. Résoudre et Refuser le clôturent. Le client est prévenu par email à chaque fois.
            </p>
          </form>

          <form action={setTicketPriorityAction} className="grid h-fit gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <input type="hidden" name="request_id" value={ticket.id} />
            <label className="grid gap-1.5 text-sm font-medium text-zinc-800">
              Priorité
              <select
                name="priority"
                defaultValue={ticket.priority}
                className="h-9 rounded border border-zinc-300 bg-white px-2.5 text-sm outline-none transition focus:border-zinc-950"
              >
                <option value="low">Basse</option>
                <option value="normal">Normale</option>
                <option value="high">Haute</option>
                <option value="urgent">Urgente</option>
              </select>
            </label>
            <button
              type="submit"
              className="inline-flex h-9 items-center justify-center rounded bg-zinc-950 px-3 text-xs font-semibold text-white transition hover:bg-zinc-800"
            >
              Appliquer
            </button>
          </form>
        </div>
      ) : (
        <p className="text-sm text-zinc-500">
          Cette demande a été envoyée par Lucid-Lab au client. Elle se gère depuis la fiche client, panneau Échanges.
        </p>
      )}
    </div>
  );
}
