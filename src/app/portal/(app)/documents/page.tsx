import type { Metadata } from 'next';
import { Download, FileText } from 'lucide-react';
import { portalBasePath, requirePortalUser } from '@/lib/portal/auth';
import { listPortalDocuments } from '@/lib/portal/data';
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
  title: 'Documents',
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

export default async function PortalDocumentsPage() {
  const session = await requirePortalUser();
  const base = await portalBasePath();
  const documents = await listPortalDocuments(session);
  const d = portalStrings.documents;
  const b = portalStrings.billing;

  return (
    <div>
      <PortalPageHeader title={d.title} description={d.description} />

      {documents.length === 0 ? (
        <PortalEmptyState message={d.empty} />
      ) : (
        <div className="grid gap-4">
          {documents.map((doc) => (
            <PortalCard key={doc.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="mt-0.5 rounded-lg border border-zinc-200 bg-zinc-50 p-2">
                    <FileText className="size-4 text-zinc-600" />
                  </span>
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
                    <p className="mt-1 text-xs text-zinc-500">
                      {[
                        doc.issuedAt ? `${b.issuedOn} ${formatPortalDate(doc.issuedAt)}` : null,
                        doc.signedAt ? `${b.signedOn} ${formatPortalDate(doc.signedAt)}` : null,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                </div>
                {doc.hasDownload ? (
                  <a
                    href={`${base}/documents/${doc.id}/telecharger`}
                    className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                  >
                    <Download className="size-4" />
                    {d.download}
                  </a>
                ) : null}
              </div>
            </PortalCard>
          ))}
        </div>
      )}
    </div>
  );
}
