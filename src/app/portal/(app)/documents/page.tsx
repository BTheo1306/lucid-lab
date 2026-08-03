import type { Metadata } from 'next';
import { Download, FileText, PenLine } from 'lucide-react';
import { portalBasePath, requirePortalUser } from '@/lib/portal/auth';
import { listPortalDocuments } from '@/lib/portal/data';
import { listPortalUploads } from '@/lib/portal/uploads';
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

interface PageProps {
  searchParams: Promise<{ depot?: string; apercu?: string }>;
}

/** Statuts pour lesquels le client attend encore de pouvoir signer. */
function awaitsSignature(status: string): boolean {
  return ['sent_for_signature', 'viewed', 'in_progress'].includes(status);
}

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

export default async function PortalDocumentsPage({ searchParams }: PageProps) {
  const session = await requirePortalUser();
  const base = await portalBasePath();
  const [documents, uploads, params] = await Promise.all([
    listPortalDocuments(session),
    listPortalUploads(session),
    searchParams,
  ]);
  const d = portalStrings.documents;
  const b = portalStrings.billing;
  const depotError = params.depot && params.depot !== '1' ? d.uploadErrors[params.depot] : null;

  return (
    <div>
      <PortalPageHeader title={d.title} description={d.description} />

      {params.depot === '1' ? (
        <p className="mb-6 rounded-lg border border-emerald-200 bg-emerald-50 px-3.5 py-2.5 text-sm text-emerald-800">
          {d.uploadOk}
        </p>
      ) : null}
      {depotError ? (
        <p className="mb-6 rounded-lg border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-sm text-rose-800">
          {depotError}
        </p>
      ) : null}

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
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  {!doc.signingUrl && awaitsSignature(doc.status) ? (
                    <p className="max-w-[220px] text-xs leading-5 text-zinc-500">{d.signPending}</p>
                  ) : null}
                  {doc.signingUrl ? (
                    <a
                      href={doc.signingUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex h-9 items-center gap-2 rounded-lg bg-zinc-950 px-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
                    >
                      <PenLine className="size-4" />
                      {d.sign}
                    </a>
                  ) : null}
                  {doc.hasDownload ? (
                    <a
                      href={`${base}/documents/${doc.id}/telecharger`}
                      className="inline-flex h-9 items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                    >
                      <Download className="size-4" />
                      {d.download}
                    </a>
                  ) : null}
                </div>
              </div>
            </PortalCard>
          ))}
        </div>
      )}

      <div className="mt-8 grid gap-4">
        <PortalCard>
          <h2 className="text-sm font-semibold text-zinc-900">{d.uploadTitle}</h2>
          <p className="mt-1 text-xs leading-5 text-zinc-500">{d.uploadHint}</p>
          <form
            action={`${base}/documents/deposer`}
            method="post"
            encType="multipart/form-data"
            className="mt-4 grid gap-3"
          >
            <label className="grid gap-1.5 text-sm font-medium text-zinc-800">
              {d.uploadFile}
              <input
                type="file"
                name="fichier"
                required
                className="rounded-lg border border-zinc-300 bg-white px-3.5 py-2.5 text-sm file:mr-3 file:rounded file:border-0 file:bg-zinc-950 file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-white"
              />
            </label>
            <label className="grid gap-1.5 text-sm font-medium text-zinc-800">
              {d.uploadNote}
              <input
                type="text"
                name="note"
                maxLength={500}
                placeholder={d.uploadNotePlaceholder}
                className="h-11 w-full rounded-lg border border-zinc-300 bg-white px-3.5 text-sm outline-none transition focus:border-zinc-950 focus:ring-2 focus:ring-zinc-950/10"
              />
            </label>
            <button
              type="submit"
              className="h-11 rounded-lg bg-zinc-950 text-sm font-semibold text-white transition hover:bg-zinc-800 sm:justify-self-start sm:px-6"
            >
              {d.uploadSubmit}
            </button>
          </form>
        </PortalCard>

        {uploads.length > 0 ? (
          <PortalCard>
            <h2 className="text-sm font-semibold text-zinc-900">{d.uploadReceivedTitle}</h2>
            <ul className="mt-3 divide-y divide-zinc-100">
              {uploads.map((upload) => (
                <li key={upload.id} className="py-2.5 first:pt-0 last:pb-0">
                  <p className="text-sm font-medium text-zinc-900">{upload.fileName}</p>
                  <p className="mt-0.5 text-xs text-zinc-500">
                    {[formatPortalDate(upload.createdAt), upload.documentTitle, upload.note]
                      .filter(Boolean)
                      .join(' · ')}
                  </p>
                </li>
              ))}
            </ul>
          </PortalCard>
        ) : null}
      </div>
    </div>
  );
}
