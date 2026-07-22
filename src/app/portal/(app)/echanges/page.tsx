import type { Metadata } from 'next';
import { ArrowRight, MessageSquarePlus } from 'lucide-react';
import { portalBasePath, requirePortalUser } from '@/lib/portal/auth';
import { listPortalRequests, type PortalRequest } from '@/lib/portal/requests';
import { portalStrings } from '@/lib/portal/strings';
import {
  PortalCard,
  PortalEmptyState,
  PortalPageHeader,
  StatusPill,
  formatPortalDate,
  type PortalPillTone,
} from '../../components';

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
      return 'warning';
    case 'changes_requested':
      return 'warning';
    case 'declined':
      return 'danger';
    default:
      return 'neutral';
  }
}

function RequestRow({ request, base }: { request: PortalRequest; base: string }) {
  const s = portalStrings.requests;
  const needsAction =
    request.direction === 'agency_to_client' && ['open', 'in_progress', 'waiting'].includes(request.status);

  return (
    <a
      href={`${base}/echanges/${request.id}`}
      className="flex items-center justify-between gap-4 py-3.5 transition hover:bg-zinc-50/70 first:pt-0 last:pb-0"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-medium text-zinc-950">{request.title}</p>
          <StatusPill tone={requestTone(request.status)}>
            {s.statusLabels[request.status] ?? request.status}
          </StatusPill>
          {needsAction ? <StatusPill tone="warning">{s.actionNeeded}</StatusPill> : null}
        </div>
        <p className="mt-1 text-xs text-zinc-500">
          {s.typeLabels[request.requestType] ?? request.requestType} · {s.sentOn}{' '}
          {formatPortalDate(request.createdAt)}
        </p>
      </div>
      <ArrowRight className="size-4 shrink-0 text-zinc-400" />
    </a>
  );
}

interface PageProps {
  searchParams: Promise<{ cree?: string }>;
}

export default async function PortalRequestsPage({ searchParams }: PageProps) {
  const session = await requirePortalUser();
  const base = await portalBasePath();
  const requests = await listPortalRequests(session);
  const params = await searchParams;
  const s = portalStrings.requests;

  const fromUs = requests.filter((request) => request.direction === 'agency_to_client');
  const fromYou = requests.filter((request) => request.direction === 'client_to_agency');

  return (
    <div>
      <PortalPageHeader title={s.title} description={s.description} />

      {params.cree === '1' ? (
        <p className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800">
          {s.created}
        </p>
      ) : null}

      <PortalCard className="mb-8">
        <details className="group">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-zinc-900 [&::-webkit-details-marker]:hidden">
            <MessageSquarePlus className="size-4 text-zinc-500" />
            {s.newRequest}
          </summary>
          <form action={`${base}/echanges/creer`} method="post" className="mt-4 grid gap-3">
            <label className="grid gap-1.5 text-sm font-medium text-zinc-800">
              {s.typeField}
              <select
                name="request_type"
                className="h-11 rounded-lg border border-zinc-300 bg-white px-3 text-sm outline-none transition focus:border-zinc-950"
              >
                <option value="question">{s.typeLabels.question}</option>
                <option value="change_request">{s.typeLabels.change_request}</option>
              </select>
            </label>
            <label className="grid gap-1.5 text-sm font-medium text-zinc-800">
              {s.titleField}
              <input
                type="text"
                name="title"
                required
                maxLength={200}
                className="h-11 rounded-lg border border-zinc-300 bg-white px-3.5 text-sm outline-none transition focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
              />
            </label>
            <label className="grid gap-1.5 text-sm font-medium text-zinc-800">
              {s.bodyField}
              <textarea
                name="body"
                rows={4}
                maxLength={5000}
                className="rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm leading-6 outline-none transition focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
              />
            </label>
            <button
              type="submit"
              className="h-11 rounded-lg bg-zinc-950 text-sm font-semibold text-white transition hover:bg-zinc-800 sm:justify-self-start sm:px-6"
            >
              {s.submit}
            </button>
          </form>
        </details>
      </PortalCard>

      {requests.length === 0 ? (
        <PortalEmptyState message={s.empty} />
      ) : (
        <div className="grid gap-8">
          {fromUs.length > 0 ? (
            <section className="grid gap-3">
              <h2
                className="text-lg font-bold tracking-tight"
                style={{ fontFamily: 'var(--font-syne), sans-serif' }}
              >
                {s.fromUs}
              </h2>
              <PortalCard>
                <div className="divide-y divide-zinc-100">
                  {fromUs.map((request) => (
                    <RequestRow key={request.id} request={request} base={base} />
                  ))}
                </div>
              </PortalCard>
            </section>
          ) : null}

          {fromYou.length > 0 ? (
            <section className="grid gap-3">
              <h2
                className="text-lg font-bold tracking-tight"
                style={{ fontFamily: 'var(--font-syne), sans-serif' }}
              >
                {s.fromYou}
              </h2>
              <PortalCard>
                <div className="divide-y divide-zinc-100">
                  {fromYou.map((request) => (
                    <RequestRow key={request.id} request={request} base={base} />
                  ))}
                </div>
              </PortalCard>
            </section>
          ) : null}
        </div>
      )}
    </div>
  );
}
