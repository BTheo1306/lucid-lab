import type { Metadata } from 'next';
import { ArrowLeft } from 'lucide-react';
import { portalBasePath, requirePortalUser } from '@/lib/portal/auth';
import { getPortalRequest } from '@/lib/portal/requests';
import { portalStrings } from '@/lib/portal/strings';
import {
  PortalCard,
  PortalEmptyState,
  PortalPageHeader,
  StatusPill,
  formatPortalDate,
  type PortalPillTone,
} from '../../../components';

export const metadata: Metadata = {
  title: 'Échanges',
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

interface PageProps {
  params: Promise<{ requestId: string }>;
  searchParams: Promise<{ repondu?: string }>;
}

export default async function PortalRequestDetailPage({ params, searchParams }: PageProps) {
  const session = await requirePortalUser();
  const base = await portalBasePath();
  const { requestId } = await params;
  const { repondu } = await searchParams;
  const request = await getPortalRequest(session, requestId);
  const s = portalStrings.requests;

  if (!request) {
    return (
      <div>
        <PortalPageHeader title={s.title} />
        <PortalEmptyState message={s.notFound} />
        <a href={`${base}/echanges`} className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-zinc-700 hover:underline">
          <ArrowLeft className="size-4" />
          {s.back}
        </a>
      </div>
    );
  }

  const fromAgency = request.direction === 'agency_to_client';
  const canRespond = fromAgency && ['open', 'in_progress', 'waiting'].includes(request.status);
  const isApproval = request.requestType === 'approval';

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
          <StatusPill tone={requestTone(request.status)}>
            {s.statusLabels[request.status] ?? request.status}
          </StatusPill>
        </div>
        <p className="mt-1.5 text-sm text-zinc-500">
          {s.typeLabels[request.requestType] ?? request.requestType} · {s.sentOn}{' '}
          {formatPortalDate(request.createdAt)}
          {request.dueAt ? ` · ${portalStrings.tasks.due} ${formatPortalDate(request.dueAt)}` : ''}
        </p>
      </div>

      {repondu === '1' ? (
        <p className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800">
          {s.responded}
        </p>
      ) : null}

      {request.body ? (
        <PortalCard className="mb-6">
          <p className="text-sm leading-relaxed whitespace-pre-line text-zinc-700">{request.body}</p>
        </PortalCard>
      ) : null}

      {request.responseNote ? (
        <PortalCard className="mb-6 border-zinc-300 bg-zinc-50">
          <p className="text-xs font-semibold uppercase tracking-[0.12em] text-zinc-500">
            {fromAgency ? s.yourResponse : s.ourResponse}
          </p>
          <p className="mt-2 text-sm leading-relaxed whitespace-pre-line text-zinc-700">
            {request.responseNote}
          </p>
        </PortalCard>
      ) : null}

      {canRespond ? (
        <div className="grid gap-4 sm:grid-cols-2">
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
    </div>
  );
}
