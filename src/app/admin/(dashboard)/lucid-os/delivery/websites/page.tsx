import { Globe2 } from 'lucide-react';
import { listLucidWebsites, type LucidHealthStatus, type LucidWebsiteStatus } from '@/lib/admin/lucid-os';
import { EmptyState, formatAdminDateTime, LucidOsHeader, Section, StatusBadge } from '../../components';

export const dynamic = 'force-dynamic';

function healthTone(status: LucidHealthStatus): 'neutral' | 'good' | 'warning' | 'danger' {
  switch (status) {
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

function websiteTone(status: LucidWebsiteStatus): 'neutral' | 'good' | 'warning' | 'danger' {
  switch (status) {
    case 'live':
      return 'good';
    case 'building':
    case 'designing':
      return 'warning';
    case 'paused':
      return 'danger';
    default:
      return 'neutral';
  }
}

function labelFr(value: string): string {
  const labels: Record<string, string> = {
    archived: 'archivé',
    building: 'construction',
    degraded: 'dégradé',
    designing: 'design',
    down: 'hors ligne',
    healthy: 'sain',
    live: 'en ligne',
    paused: 'en pause',
  };

  return labels[value] ?? value.replace(/_/g, ' ');
}

export default async function LucidOsWebsitesPage() {
  const websites = await listLucidWebsites(100);

  return (
    <div className="grid gap-6">
      <LucidOsHeader
        eyebrow="Production"
        title="Sites web"
        description="Inventaire des sites, hébergement, domaines et état de santé."
        icon={Globe2}
      />

      <Section title="Inventaire sites web" description="Sites suivis pour les clients et projets internes.">
        {websites.length === 0 ? (
          <EmptyState>Aucun site web n’est encore enregistré.</EmptyState>
        ) : (
          <div className="divide-y divide-white/10">
            {websites.map((website) => (
              <div key={website.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-zinc-950">{website.name}</p>
                      <StatusBadge tone={websiteTone(website.status)}>{labelFr(website.status)}</StatusBadge>
                      <StatusBadge tone={healthTone(website.healthStatus)}>{labelFr(website.healthStatus)}</StatusBadge>
                    </div>
                    <p className="mt-1 text-sm text-zinc-500">{website.clientName ?? 'Lucid-Lab'} · {website.projectName ?? 'Aucun projet'} · {website.hostingProvider}</p>
                    <p className="mt-2 text-sm text-zinc-600">{website.primaryDomain ?? website.productionUrl ?? 'Aucun domaine enregistré'}</p>
                  </div>
                  <div className="text-sm text-zinc-500 md:text-right">
                    <p>{website.lastCheckedAt ? `Vérifié ${formatAdminDateTime(website.lastCheckedAt)}` : 'Pas encore vérifié'}</p>
                    <p className="mt-1">Mis à jour {formatAdminDateTime(website.updatedAt)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}