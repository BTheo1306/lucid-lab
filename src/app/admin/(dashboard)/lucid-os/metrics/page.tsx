import { Activity, BarChart3, FolderKanban, Users } from 'lucide-react';
import { getAgencyMetrics, type CollectedRow, type MrrRow, type PipelineRow } from '@/lib/admin/metrics';
import { EmptyState, LucidOsHeader, Section, StatCard, formatAdminDate } from '../components';
import { ClientsByStatusChart, PipelineByStageChart, RevenueByMonthChart } from './MetricsCharts';

export const dynamic = 'force-dynamic';

function eur(value: number): string {
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value)} €`;
}

function DetailRow({ label, sub, value }: { label: string; sub?: string | null; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4 py-2 border-b border-white/[0.05] last:border-0">
      <div className="min-w-0">
        <p className="truncate text-sm text-zinc-200">{label}</p>
        {sub ? <p className="text-[11px] text-zinc-500">{sub}</p> : null}
      </div>
      <span className="shrink-0 text-sm font-semibold tabular-nums text-zinc-100">{value}</span>
    </div>
  );
}

function MrrDetail({ rows }: { rows: MrrRow[] }) {
  if (rows.length === 0) return <EmptyState>Aucune opportunité gagnée</EmptyState>;
  return (
    <div>
      {rows.map((r, i) => (
        <DetailRow
          key={i}
          label={r.clientName}
          sub={r.closedAt ? `Signé le ${formatAdminDate(r.closedAt)}` : null}
          value={`${eur(r.monthlyValueEur)} / mois`}
        />
      ))}
    </div>
  );
}

function CollectedDetail({ rows }: { rows: CollectedRow[] }) {
  if (rows.length === 0) return <EmptyState>Aucun encaissement enregistré</EmptyState>;
  return (
    <div>
      {rows.map((r, i) => (
        <DetailRow
          key={i}
          label={r.clientName}
          sub={r.occurredAt ? formatAdminDate(r.occurredAt) : null}
          value={eur(r.amountTtcEur)}
        />
      ))}
    </div>
  );
}

function PipelineDetail({ rows }: { rows: PipelineRow[] }) {
  if (rows.length === 0) return <EmptyState>Aucune opportunité ouverte</EmptyState>;
  return (
    <div>
      {rows.map((r, i) => (
        <DetailRow
          key={i}
          label={r.clientName}
          sub={r.stageLabel}
          value={eur(r.valueEstimateEur)}
        />
      ))}
    </div>
  );
}

export default async function LucidOsMetricsPage() {
  const metrics = await getAgencyMetrics();
  const { kpis, mrrDetail, collectedDetail, pipelineDetail } = metrics;

  return (
    <div className="grid gap-6">
      <LucidOsHeader
        eyebrow="Pilotage agence"
        title="Métriques"
        description="Revenu récurrent, pipeline et encaissements, en direct depuis Lucid OS."
        icon={Activity}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="MRR (HT)" value={eur(kpis.mrrEurHt)} hint="Récurrent mensuel signé" icon={BarChart3} />
        <StatCard label="Clients actifs" value={kpis.activeClients} hint="En cours de mission" icon={Users} />
        <StatCard label="Pipeline ouvert" value={eur(kpis.openPipelineEur)} hint="Opportunités en cours" icon={FolderKanban} />
        <StatCard label="Encaissé" value={eur(kpis.revenueCollectedEur)} hint="Factures payées (Dougs)" icon={Activity} />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Section title={`MRR — ${eur(kpis.mrrEurHt)} / mois`}>
          <MrrDetail rows={mrrDetail} />
        </Section>
        <Section title={`Encaissé — ${eur(kpis.revenueCollectedEur)}`}>
          <CollectedDetail rows={collectedDetail} />
        </Section>
        <Section title={`Pipeline ouvert — ${eur(kpis.openPipelineEur)}`}>
          <PipelineDetail rows={pipelineDetail} />
        </Section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(300px,0.6fr)]">
        <Section title="Revenu par mois">
          <RevenueByMonthChart data={metrics.revenueByMonth} />
        </Section>
        <Section title="Clients par statut">
          <ClientsByStatusChart data={metrics.clientsByStatus} />
        </Section>
      </div>

      <Section title="Pipeline par étape">
        <PipelineByStageChart data={metrics.pipelineByStage} />
      </Section>
    </div>
  );
}
