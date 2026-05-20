import { AlertTriangle, MonitorCheck } from 'lucide-react';
import { listLucidIncidents, type LucidIncidentStatus } from '@/lib/admin/lucid-os';
import { EmptyState, formatAdminDateTime, LucidOsHeader, Section, StatusBadge } from '../../components';

export const dynamic = 'force-dynamic';

function incidentTone(status: LucidIncidentStatus): 'neutral' | 'good' | 'warning' | 'danger' {
  switch (status) {
    case 'open':
    case 'investigating':
    case 'identified':
      return 'danger';
    case 'monitoring':
      return 'warning';
    case 'resolved':
    case 'closed':
      return 'good';
    default:
      return 'neutral';
  }
}

function labelFr(value: string): string {
  const labels: Record<string, string> = {
    closed: 'fermé',
    critical: 'critique',
    high: 'élevé',
    identified: 'identifié',
    investigating: 'en investigation',
    low: 'faible',
    medium: 'moyen',
    monitoring: 'surveillance',
    open: 'ouvert',
    resolved: 'résolu',
  };

  return labels[value] ?? value.replace(/_/g, ' ');
}

export default async function LucidOsMonitoringPage() {
  const incidents = await listLucidIncidents(100);

  return (
    <div className="grid gap-6">
      <LucidOsHeader
        eyebrow="Opérations"
        title="Monitoring"
        description="Incidents et signaux de santé opérationnelle pour l’infrastructure client et agence."
        icon={MonitorCheck}
      />

      <Section title="Incidents" description="Événements opérationnels actuels et récents.">
        {incidents.length === 0 ? (
          <EmptyState>Aucun incident n’est enregistré.</EmptyState>
        ) : (
          <div className="divide-y divide-white/10">
            {incidents.map((incident) => (
              <div key={incident.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <AlertTriangle className="size-4 text-zinc-500" />
                      <p className="font-medium text-zinc-950">{incident.title}</p>
                      <StatusBadge tone={incidentTone(incident.status)}>{labelFr(incident.status)}</StatusBadge>
                    </div>
                    <p className="mt-1 text-sm text-zinc-500">{incident.clientName ?? incident.websiteName ?? 'Lucid-Lab'} · {labelFr(incident.severity)}</p>
                    {incident.summary ? <p className="mt-2 text-sm leading-6 text-zinc-600">{incident.summary}</p> : null}
                  </div>
                  <div className="text-sm text-zinc-500 md:text-right">
                    <p>Démarré {formatAdminDateTime(incident.startedAt)}</p>
                    <p className="mt-1">{incident.resolvedAt ? `Résolu ${formatAdminDateTime(incident.resolvedAt)}` : 'Non résolu'}</p>
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