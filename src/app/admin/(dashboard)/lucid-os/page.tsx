import {
  AlertTriangle,
  BarChart3,
  CheckSquare,
  FolderKanban,
  Globe2,
  Users,
} from 'lucide-react';
import { getLucidOsDashboardData } from '@/lib/admin/lucid-os';
import { getAllClientTasksForDashboard } from '@/lib/admin/client-tasks';
import { getAgencyMetrics } from '@/lib/admin/metrics';
import { LucidOsHeader, Section, StatCard } from './components';
import { AllClientsTaskBoard } from './AllClientsTaskBoard';
import { NewTaskButton } from './NewTaskButton';

export const dynamic = 'force-dynamic';

function eur(value: number): string {
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value)} €`;
}

export default async function LucidOsPage() {
  const [data, taskData, metrics] = await Promise.all([
    getLucidOsDashboardData(),
    getAllClientTasksForDashboard(),
    getAgencyMetrics(),
  ]);

  const { tasks, clients } = taskData;
  const todoCount = tasks.filter((t) => t.status === 'todo').length;

  return (
    <div className="grid gap-5">
      <LucidOsHeader
        eyebrow="Pilotage agence"
        title="Lucid OS"
        icon={Globe2}
      />

      {!data.schemaReady ? (
        <section className="rounded-md border border-amber-400/30 bg-amber-500/10 p-4 text-sm leading-6 text-amber-200">
          <div className="flex gap-2">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p>La migration Lucid OS n'a pas encore été appliquée au projet Supabase actif.</p>
          </div>
        </section>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Clients actifs"
          value={data.stats.clientsActive}
          hint={`${data.stats.clientsTotal} au total`}
          icon={Users}
        />
        <StatCard
          label="Production"
          value={data.stats.projectsActive}
          hint={`${data.stats.websitesLive} sites en ligne`}
          icon={FolderKanban}
        />
        <StatCard
          label="À faire"
          value={todoCount}
          hint="tâches en attente"
          icon={CheckSquare}
        />
        <StatCard
          label="MRR"
          value={eur(metrics.kpis.mrrEurHt)}
          hint="revenu récurrent mensuel HT"
          icon={BarChart3}
          href="/admin/lucid-os/metrics"
        />
      </div>

      <Section
        title="Actions clients"
        action={<NewTaskButton clients={clients} />}
      >
        <AllClientsTaskBoard initialTasks={tasks} />
      </Section>
    </div>
  );
}
