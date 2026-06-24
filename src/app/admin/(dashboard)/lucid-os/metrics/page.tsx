import { Activity, BarChart3, FolderKanban, Users } from 'lucide-react';
import { getAgencyMetrics } from '@/lib/admin/metrics';
import { LucidOsHeader, Section, StatCard } from '../components';
import { ClientsByStatusChart, PipelineByStageChart, RevenueByMonthChart } from './MetricsCharts';

export const dynamic = 'force-dynamic';

function eur(value: number): string {
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value)} €`;
}

export default async function LucidOsMetricsPage() {
  const metrics = await getAgencyMetrics();
  const { kpis } = metrics;

  return (
    <div className="grid gap-6">
      <LucidOsHeader
        eyebrow="Pilotage agence"
        title="Métriques"
        description="Revenu récurrent, pipeline et encaissements, en direct depuis Lucid OS."
        icon={Activity}
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="MRR (HT)" value={eur(kpis.mrrEurHt)} hint="Récurrent mensuel signé" icon={BarChart3} href="/admin/lucid-os/metrics/mrr" />
        <StatCard label="Clients actifs" value={kpis.activeClients} hint="En cours de mission" icon={Users} />
        <StatCard label="Pipeline ouvert" value={eur(kpis.openPipelineEur)} hint="Opportunités en cours" icon={FolderKanban} href="/admin/lucid-os/metrics/pipeline" />
        <StatCard label="Encaissé" value={eur(kpis.revenueCollectedEur)} hint="Factures payées (Dougs)" icon={Activity} href="/admin/lucid-os/metrics/collected" />
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
