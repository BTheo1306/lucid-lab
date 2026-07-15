import { ArrowRight, CalendarDays, CheckSquare, FileSignature, MessageSquare } from 'lucide-react';
import { portalBasePath, requirePortalUser } from '@/lib/portal/auth';
import { getPortalHomeData } from '@/lib/portal/data';
import { portalStrings } from '@/lib/portal/strings';
import { PortalCard, StatusPill, formatPortalDate } from '../components';

function SectionLink({ href, label }: { href: string; label: string }) {
  return (
    <a href={href} className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-zinc-700 transition hover:text-zinc-950">
      {label}
      <ArrowRight className="size-4" />
    </a>
  );
}

export default async function PortalHomePage() {
  const session = await requirePortalUser();
  const base = await portalBasePath();
  const data = await getPortalHomeData(session);

  const s = portalStrings.home;
  const r = portalStrings.requests;
  const d = portalStrings.documents;
  const firstName = session.contactName.split(' ')[0] || session.contactName;

  const nothingOpen =
    data.openTaskCount === 0 &&
    data.pendingAgencyRequests.length === 0 &&
    data.documentsToSign.length === 0 &&
    data.dueBillingEvents.length === 0;

  return (
    <div>
      <h1
        className="text-2xl font-bold tracking-tight"
        style={{ fontFamily: 'var(--font-syne), sans-serif' }}
      >
        {s.greeting} {firstName}
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600">{s.intro}</p>

      {nothingOpen ? (
        <div className="mt-8">
          <PortalCard>
            <p className="text-sm text-zinc-600">{s.nothingOpen}</p>
          </PortalCard>
        </div>
      ) : null}

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        {data.pendingAgencyRequests.length > 0 ? (
          <PortalCard className="border-amber-200">
            <div className="flex items-center gap-2">
              <MessageSquare className="size-4 text-amber-600" />
              <h2 className="text-sm font-semibold text-zinc-900">{s.pendingRequests}</h2>
              <StatusPill tone="warning">{data.pendingAgencyRequests.length}</StatusPill>
            </div>
            <div className="mt-3 divide-y divide-zinc-100">
              {data.pendingAgencyRequests.slice(0, 3).map((request) => (
                <a
                  key={request.id}
                  href={`${base}/echanges/${request.id}`}
                  className="flex items-center justify-between gap-3 py-2.5 text-sm font-medium text-zinc-950 transition hover:text-zinc-600 first:pt-0 last:pb-0"
                >
                  <span className="min-w-0 truncate">{request.title}</span>
                  <ArrowRight className="size-4 shrink-0 text-zinc-400" />
                </a>
              ))}
            </div>
            <SectionLink href={`${base}/echanges`} label={s.seeAll} />
          </PortalCard>
        ) : null}

        {data.documentsToSign.length > 0 || data.dueBillingEvents.length > 0 ? (
          <PortalCard>
            <div className="flex items-center gap-2">
              <FileSignature className="size-4 text-zinc-600" />
              <h2 className="text-sm font-semibold text-zinc-900">{s.dueInvoices}</h2>
            </div>
            <div className="mt-3 grid gap-2 text-sm text-zinc-700">
              {data.documentsToSign.slice(0, 3).map((doc) => (
                <p key={doc.id}>
                  {d.typeLabels[doc.documentType] ?? 'Document'}
                  {doc.documentNumber ? ` ${doc.documentNumber}` : ''} : {d.statusLabels[doc.status] ?? doc.status}
                </p>
              ))}
              {data.dueBillingEvents.slice(0, 3).map((event) => (
                <p key={event.id}>
                  {portalStrings.billing.eventLabels[event.eventType] ?? 'Facturation'}
                  {event.dueAt ? ` : ${portalStrings.billing.dueOn.toLowerCase()} ${formatPortalDate(event.dueAt)}` : ''}
                </p>
              ))}
            </div>
            <SectionLink href={`${base}/facturation`} label={s.seeAll} />
          </PortalCard>
        ) : null}

        {data.openTaskCount > 0 ? (
          <PortalCard>
            <div className="flex items-center gap-2">
              <CheckSquare className="size-4 text-zinc-600" />
              <h2 className="text-sm font-semibold text-zinc-900">{s.openTasks}</h2>
              <StatusPill tone="info">{data.openTaskCount}</StatusPill>
            </div>
            <div className="mt-3 divide-y divide-zinc-100">
              {data.openTasks.map((task) => (
                <div key={task.id} className="flex items-center justify-between gap-3 py-2.5 first:pt-0 last:pb-0">
                  <p className="min-w-0 truncate text-sm font-medium text-zinc-950">{task.title}</p>
                  {task.dueAt ? (
                    <p className="shrink-0 text-xs text-zinc-500">{formatPortalDate(task.dueAt)}</p>
                  ) : null}
                </div>
              ))}
            </div>
            <SectionLink href={`${base}/projets`} label={s.seeAll} />
          </PortalCard>
        ) : null}

        {data.lastMeeting ? (
          <PortalCard>
            <div className="flex items-center gap-2">
              <CalendarDays className="size-4 text-zinc-600" />
              <h2 className="text-sm font-semibold text-zinc-900">{s.lastMeeting}</h2>
            </div>
            <p className="mt-3 text-sm font-medium text-zinc-950">
              {data.lastMeeting.title.replace(/^Réunion\s*:\s*/, '')}
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              {portalStrings.meetings.recordedOn} {formatPortalDate(data.lastMeeting.occurredAt)}
            </p>
            <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-zinc-600">
              {data.lastMeeting.clientSummary}
            </p>
            <SectionLink href={`${base}/reunions`} label={s.seeAll} />
          </PortalCard>
        ) : null}
      </div>
    </div>
  );
}
