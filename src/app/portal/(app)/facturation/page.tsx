import type { Metadata } from 'next';
import { Download } from 'lucide-react';
import { portalBasePath, requirePortalUser } from '@/lib/portal/auth';
import { listPortalBillingEvents, listPortalDocuments } from '@/lib/portal/data';
import { portalStrings } from '@/lib/portal/strings';
import {
  PortalCard,
  PortalEmptyState,
  PortalPageHeader,
  StatusPill,
  formatPortalAmount,
  formatPortalDate,
  type PortalPillTone,
} from '../../components';

export const metadata: Metadata = {
  title: 'Facturation',
};

function documentTone(status: string): PortalPillTone {
  switch (status) {
    case 'signed':
    case 'archived':
      return 'good';
    case 'sent_for_signature':
    case 'viewed':
    case 'in_progress':
      return 'info';
    case 'declined':
    case 'expired':
      return 'danger';
    default:
      return 'neutral';
  }
}

function billingTone(status: string): PortalPillTone {
  switch (status) {
    case 'paid':
      return 'good';
    case 'due':
      return 'warning';
    case 'overdue':
      return 'danger';
    case 'signed':
    case 'invoiced':
      return 'info';
    case 'cancelled':
      return 'neutral';
    default:
      return 'neutral';
  }
}

export default async function PortalBillingPage() {
  const session = await requirePortalUser();
  const base = await portalBasePath();
  const [documents, events] = await Promise.all([
    listPortalDocuments(session),
    listPortalBillingEvents(session),
  ]);

  const b = portalStrings.billing;
  const d = portalStrings.documents;
  const billingDocuments = documents.filter((doc) =>
    ['facture', 'bon_de_commande'].includes(doc.documentType),
  );

  return (
    <div>
      <PortalPageHeader title={b.title} description={b.description} />

      <section className="grid gap-4">
        <h2
          className="text-lg font-bold tracking-tight"
          style={{ fontFamily: 'var(--font-syne), sans-serif' }}
        >
          {b.documentsTitle}
        </h2>
        {billingDocuments.length === 0 ? (
          <PortalEmptyState message={b.empty} />
        ) : (
          <div className="grid gap-4">
            {billingDocuments.map((doc) => (
              <PortalCard key={doc.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-zinc-950">
                        {d.typeLabels[doc.documentType] ?? 'Document'}
                        {doc.documentNumber ? ` ${doc.documentNumber}` : ''}
                      </p>
                      <StatusPill tone={documentTone(doc.status)}>
                        {d.statusLabels[doc.status] ?? doc.status}
                      </StatusPill>
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">{doc.title}</p>
                    <p className="mt-2 text-xs text-zinc-500">
                      {[
                        doc.issuedAt ? `${b.issuedOn} ${formatPortalDate(doc.issuedAt)}` : null,
                        doc.signedAt ? `${b.signedOn} ${formatPortalDate(doc.signedAt)}` : null,
                        doc.dueAt ? `${b.dueOn} ${formatPortalDate(doc.dueAt)}` : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                  <div className="text-right">
                    {doc.amountTtcEur != null || doc.amountHtEur != null ? (
                      <p className="text-base font-semibold text-zinc-950">
                        {formatPortalAmount(doc.amountTtcEur ?? doc.amountHtEur)}
                        <span className="ml-1 text-xs font-normal text-zinc-500">
                          {doc.amountTtcEur != null ? 'TTC' : 'HT'}
                        </span>
                      </p>
                    ) : null}
                    {doc.monthlyAmountEur ? (
                      <p className="text-xs text-zinc-500">
                        {formatPortalAmount(doc.monthlyAmountEur)} {b.monthlyLabel}
                      </p>
                    ) : null}
                  </div>
                </div>
                {doc.hasDownload ? (
                  <a
                    href={`${base}/documents/${doc.id}/telecharger`}
                    className="mt-4 inline-flex h-9 items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                  >
                    <Download className="size-4" />
                    {d.download}
                  </a>
                ) : null}
              </PortalCard>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10 grid gap-4">
        <h2
          className="text-lg font-bold tracking-tight"
          style={{ fontFamily: 'var(--font-syne), sans-serif' }}
        >
          {b.historyTitle}
        </h2>
        {events.length === 0 ? (
          <PortalEmptyState message={b.historyEmpty} />
        ) : (
          <PortalCard>
            <div className="divide-y divide-zinc-100">
              {events.map((event) => (
                <div key={event.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5 first:pt-0 last:pb-0">
                  <div className="flex min-w-0 flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-zinc-950">
                      {b.eventLabels[event.eventType] ?? b.eventLabels.other}
                    </p>
                    <StatusPill tone={billingTone(event.billingStatus)}>
                      {b.statusLabels[event.billingStatus] ?? event.billingStatus}
                    </StatusPill>
                  </div>
                  <div className="text-right">
                    {event.amountTtcEur != null || event.amountHtEur != null ? (
                      <p className="text-sm font-semibold text-zinc-950">
                        {formatPortalAmount(event.amountTtcEur ?? event.amountHtEur)}
                      </p>
                    ) : null}
                    <p className="text-xs text-zinc-500">{formatPortalDate(event.occurredAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          </PortalCard>
        )}
      </section>
    </div>
  );
}
