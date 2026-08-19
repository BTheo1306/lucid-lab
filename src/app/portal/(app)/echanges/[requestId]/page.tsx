import type { Metadata } from 'next';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import { portalBasePath, requirePortalUser } from '@/lib/portal/auth';
import {
  getPortalRequest,
  listPortalRequestMessages,
  portalMessageAuthorLabel,
} from '@/lib/portal/requests';
import { portalStrings } from '@/lib/portal/strings';
import { cn } from '@/lib/utils';
import {
  PortalCard,
  PortalEmptyState,
  StatusPill,
  formatPortalDate,
  formatPortalDateTime,
  type PortalPillTone,
} from '../../../components';

export const metadata: Metadata = {
  title: 'Support',
};

function requestTone(status: string): PortalPillTone {
  switch (status) {
    case 'approved':
    case 'done':
      return 'good';
    case 'open':
      return 'info';
    case 'in_progress':
    case 'waiting':
    case 'changes_requested':
      return 'warning';
    case 'declined':
      return 'danger';
    default:
      return 'neutral';
  }
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
    <div
      className={cn(
        'rounded-2xl border p-4',
        fromTeam ? 'border-zinc-300 bg-zinc-50' : 'border-zinc-200 bg-white',
      )}
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">{author}</p>
        <p className="text-xs text-zinc-400">{date}</p>
      </div>
      <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-zinc-700">{body}</p>
    </div>
  );
}

interface PageProps {
  params: Promise<{ requestId: string }>;
  searchParams: Promise<{ cree?: string; repondu?: string; message?: string; resolu?: string }>;
}

export default async function PortalRequestDetailPage({ params, searchParams }: PageProps) {
  const session = await requirePortalUser();
  const base = await portalBasePath();
  const { requestId } = await params;
  const flash = await searchParams;
  const request = await getPortalRequest(session, requestId);
  const s = portalStrings.requests;

  if (!request) {
    return (
      <div>
        <PortalEmptyState message={s.notFound} />
        <a href={`${base}/echanges`} className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-zinc-700 hover:underline">
          <ArrowLeft className="size-4" />
          {s.back}
        </a>
      </div>
    );
  }

  const messages = await listPortalRequestMessages(session, requestId);

  const fromAgency = request.direction === 'agency_to_client';
  const isRespondable = ['open', 'in_progress', 'waiting'].includes(request.status);
  const canRespond = fromAgency && isRespondable;
  const isApproval = request.requestType === 'approval';

  const flashMessage =
    flash.cree === '1'
      ? s.created
      : flash.repondu === '1'
        ? s.responded
        : flash.message === '1'
          ? s.messageSent
          : flash.resolu === '1'
            ? s.resolvedByYou
            : null;

  return (
    <div>
      <a href={`${base}/echanges`} className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-950">
        <ArrowLeft className="size-4" />
        {s.back}
      </a>

      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2">
          <h1
            className="text-2xl font-bold tracking-tight"
            style={{ fontFamily: 'var(--font-syne), sans-serif' }}
          >
            {request.title}
          </h1>
          <StatusPill tone="neutral">#{request.reference}</StatusPill>
          <StatusPill tone={requestTone(request.status)}>
            {s.statusLabels[request.status] ?? request.status}
          </StatusPill>
          {request.priority === 'urgent' || request.priority === 'high' ? (
            <StatusPill tone={request.priority === 'urgent' ? 'danger' : 'warning'}>
              {s.priorityLabels[request.priority] ?? request.priority}
            </StatusPill>
          ) : null}
        </div>
        <p className="mt-1.5 text-sm text-zinc-500">
          {s.typeLabels[request.requestType] ?? request.requestType} · {s.sentOn}{' '}
          {formatPortalDate(request.createdAt)}
          {request.dueAt ? ` · ${portalStrings.tasks.due} ${formatPortalDate(request.dueAt)}` : ''}
        </p>
      </div>

      {flashMessage ? (
        <p className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800">
          {flashMessage}
        </p>
      ) : null}

      <div className="grid gap-3">
        {request.body ? (
          <ThreadMessage
            author={fromAgency ? portalStrings.brand : s.you}
            date={formatPortalDateTime(request.createdAt)}
            body={request.body}
            fromTeam={fromAgency}
          />
        ) : null}
        {messages.map((message) => (
          <ThreadMessage
            key={message.id}
            author={portalMessageAuthorLabel(message)}
            date={formatPortalDateTime(message.createdAt)}
            body={message.body}
            fromTeam={message.sender === 'team'}
          />
        ))}
      </div>

      {canRespond ? (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <PortalCard>
            <p className="text-sm font-semibold text-zinc-900">
              {isApproval ? s.approve : s.markDone}
            </p>
            <form action={`${base}/echanges/${request.id}/repondre`} method="post" className="mt-3 grid gap-3">
              <input type="hidden" name="action" value={isApproval ? 'approve' : 'done'} />
              <textarea
                name="note"
                rows={3}
                maxLength={5000}
                placeholder={s.noteOptional}
                className="rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm leading-6 outline-none transition focus:border-zinc-950"
              />
              <button
                type="submit"
                className="h-10 rounded-lg bg-emerald-600 text-sm font-semibold text-white transition hover:bg-emerald-700"
              >
                {isApproval ? s.approve : s.markDone}
              </button>
            </form>
          </PortalCard>

          <PortalCard>
            <p className="text-sm font-semibold text-zinc-900">
              {isApproval ? s.requestChanges : s.askQuestion}
            </p>
            <form action={`${base}/echanges/${request.id}/repondre`} method="post" className="mt-3 grid gap-3">
              <input type="hidden" name="action" value="changes" />
              <textarea
                name="note"
                rows={3}
                required
                maxLength={5000}
                placeholder={s.noteRequired}
                className="rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm leading-6 outline-none transition focus:border-zinc-950"
              />
              <button
                type="submit"
                className="h-10 rounded-lg border border-zinc-300 bg-white text-sm font-semibold text-zinc-800 transition hover:bg-zinc-50"
              >
                {isApproval ? s.requestChanges : s.askQuestion}
              </button>
            </form>
          </PortalCard>
        </div>
      ) : null}

      {isRespondable ? (
        <PortalCard className="mt-6">
          <p className="text-sm font-semibold text-zinc-900">{s.reply}</p>
          <form action={`${base}/echanges/${request.id}/repondre`} method="post" className="mt-3 grid gap-3">
            <input type="hidden" name="action" value="reply" />
            <textarea
              name="message"
              rows={3}
              required
              maxLength={5000}
              placeholder={s.replyPlaceholder}
              className="rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm leading-6 outline-none transition focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
            />
            <button
              type="submit"
              className="h-10 rounded-lg bg-zinc-950 text-sm font-semibold text-white transition hover:bg-zinc-800 sm:justify-self-start sm:px-6"
            >
              {s.reply}
            </button>
          </form>
        </PortalCard>
      ) : (
        <p className="mt-6 text-sm text-zinc-500">{s.closedNotice}</p>
      )}

      {!fromAgency && isRespondable ? (
        <form action={`${base}/echanges/${request.id}/repondre`} method="post" className="mt-4">
          <input type="hidden" name="action" value="resolve" />
          <button
            type="submit"
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-emerald-300 bg-emerald-50 px-4 text-sm font-semibold text-emerald-700 transition hover:bg-emerald-100"
          >
            <CheckCircle2 className="size-4" />
            {s.markResolved}
          </button>
          <p className="mt-1.5 text-xs text-zinc-500">{s.markResolvedHint}</p>
        </form>
      ) : null}
    </div>
  );
}
