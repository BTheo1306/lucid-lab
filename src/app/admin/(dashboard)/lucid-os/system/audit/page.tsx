import { History } from 'lucide-react';
import { listLucidAuditEvents } from '@/lib/admin/lucid-os';
import { EmptyState, formatAdminDateTime, LucidOsHeader, Section, StatusBadge } from '../../components';

export const dynamic = 'force-dynamic';

function riskTone(riskLevel: string): 'neutral' | 'good' | 'warning' | 'danger' {
  switch (riskLevel) {
    case 'critical':
    case 'high':
      return 'danger';
    case 'medium':
      return 'warning';
    case 'low':
      return 'good';
    default:
      return 'neutral';
  }
}

function labelFr(value: string): string {
  const labels: Record<string, string> = {
    critical: 'critique',
    high: 'élevé',
    low: 'faible',
    medium: 'moyen',
  };

  return labels[value] ?? value.replace(/_/g, ' ');
}

export default async function LucidOsAuditPage() {
  const events = await listLucidAuditEvents(100);

  return (
    <div className="grid gap-6">
      <LucidOsHeader
        eyebrow="Système"
        title="Journal d’audit"
        description="Événements admin, système, agent, automatisation et intégration enregistrés par Lucid OS."
        icon={History}
      />

      <Section title="Événements récents" description="Traçabilité des changements opérationnels et des effets externes des agents.">
        {events.length === 0 ? (
          <EmptyState>Aucun événement d’audit Lucid OS pour le moment.</EmptyState>
        ) : (
          <div className="divide-y divide-white/10">
            {events.map((event) => (
              <div key={event.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-zinc-950">{event.summary}</p>
                      <StatusBadge tone={riskTone(event.riskLevel)}>{labelFr(event.riskLevel)}</StatusBadge>
                    </div>
                    <p className="mt-1 text-sm text-zinc-500">{event.actorType} · {event.eventType}</p>
                    {event.targetTable ? <p className="mt-1 text-xs text-zinc-400">{event.targetTable}{event.targetId ? `:${event.targetId}` : ''}</p> : null}
                  </div>
                  <p className="text-sm text-zinc-500 md:text-right">{formatAdminDateTime(event.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}