import type { Metadata } from 'next';
import { ExternalLink, Globe2 } from 'lucide-react';
import { requirePortalUser } from '@/lib/portal/auth';
import { listPortalDomains, listPortalWebsites } from '@/lib/portal/data';
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
  title: 'Site web',
};

function websiteTone(status: string): PortalPillTone {
  switch (status) {
    case 'live':
      return 'good';
    case 'paused':
      return 'warning';
    case 'building':
    case 'designing':
      return 'info';
    default:
      return 'neutral';
  }
}

function healthTone(health: string): PortalPillTone {
  switch (health) {
    case 'healthy':
      return 'good';
    case 'degraded':
      return 'warning';
    case 'down':
      return 'danger';
    default:
      return 'neutral';
  }
}

export default async function PortalWebsitePage() {
  const session = await requirePortalUser();
  const [websites, domains] = await Promise.all([
    listPortalWebsites(session),
    listPortalDomains(session),
  ]);
  const s = portalStrings.website;

  return (
    <div>
      <PortalPageHeader title={s.title} description={s.description} />

      {websites.length === 0 ? (
        <PortalEmptyState message={s.empty} />
      ) : (
        <div className="grid gap-4">
          {websites.map((website) => (
            <PortalCard key={website.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <span className="mt-0.5 rounded-lg border border-zinc-200 bg-zinc-50 p-2">
                    <Globe2 className="size-4 text-zinc-600" />
                  </span>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-zinc-950">{website.name}</p>
                      <StatusPill tone={websiteTone(website.status)}>
                        {s.statusLabels[website.status] ?? website.status}
                      </StatusPill>
                      {website.status === 'live' ? (
                        <StatusPill tone={healthTone(website.healthStatus)}>
                          {s.healthLabels[website.healthStatus] ?? website.healthStatus}
                        </StatusPill>
                      ) : null}
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">
                      {website.primaryDomain ?? ''}
                      {website.lastCheckedAt
                        ? ` · ${s.lastChecked} ${formatPortalDate(website.lastCheckedAt)}`
                        : ''}
                    </p>
                  </div>
                </div>
                {website.productionUrl ? (
                  <a
                    href={website.productionUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50"
                  >
                    {s.visit}
                    <ExternalLink className="size-4" />
                  </a>
                ) : null}
              </div>
            </PortalCard>
          ))}

          {domains.length > 0 ? (
            <PortalCard>
              <h2 className="mb-3 text-sm font-semibold text-zinc-900">{s.domainsTitle}</h2>
              <div className="divide-y divide-zinc-100">
                {domains.map((domain) => (
                  <div key={domain.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                    <p className="text-sm font-medium text-zinc-950">{domain.hostname}</p>
                    <p className="text-xs text-zinc-500">
                      {s.sslLabel} {domain.sslStatus}
                      {domain.expiresAt ? ` · ${s.expiresOn} ${formatPortalDate(domain.expiresAt)}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            </PortalCard>
          ) : null}
        </div>
      )}
    </div>
  );
}
