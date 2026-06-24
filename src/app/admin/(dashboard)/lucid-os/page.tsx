import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  FolderKanban,
  Globe2,
  Inbox,
  Users,
} from 'lucide-react';
import { getLucidOsDashboardData } from '@/lib/admin/lucid-os';
import { getAllClientTasksForDashboard } from '@/lib/admin/client-tasks';
import { EmptyState, LucidOsHeader, Section, StatCard, StatusBadge } from './components';
import { AllClientsTaskBoard } from './AllClientsTaskBoard';

export const dynamic = 'force-dynamic';

function labelFr(value: string): string {
  const labels: Record<string, string> = {
    active: 'actif',
    blocked: 'bloqué',
    closed: 'fermé',
    completed: 'terminé',
    critical: 'critique',
    degraded: 'dégradé',
    discovery_done: 'découverte faite',
    down: 'hors ligne',
    expansion_opportunity: "opportunité d'expansion",
    healthy: 'sain',
    high: 'élevé',
    identified: 'identifié',
    in_delivery: 'en production',
    investigating: 'en investigation',
    lead: 'prospect',
    live_managed: 'en ligne / géré',
    lost: 'perdu',
    low: 'faible',
    medium: 'moyen',
    meeting_booked: 'rdv planifié',
    monitoring: 'surveillance',
    open: 'ouvert',
    resolved: 'résolu',
    proposal_needed: 'proposition à préparer',
    proposal_sent: 'proposition envoyée',
    qualified: 'qualifié',
    success_retention: 'succès / rétention',
    won: 'gagné',
  };

  return labels[value] ?? value.replace(/_/g, ' ');
}

export default async function LucidOsPage() {
  const [data, tasks] = await Promise.all([
    getLucidOsDashboardData(),
    getAllClientTasksForDashboard(),
  ]);

  return (
    <div className="grid gap-5">
      <LucidOsHeader
        eyebrow="Pilotage agence"
        title="Lucid OS"
        description="Une vue sobre pour suivre les comptes clients, la production et les actions qui demandent vraiment de l'attention."
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
        <StatCard label="Clients" value={data.stats.clientsTotal} hint={`${data.stats.clientsActive} comptes actifs`} icon={Users} />
        <StatCard label="Production" value={data.stats.projectsActive} hint={`${data.stats.websitesLive} sites en ligne`} icon={FolderKanban} />
        <StatCard label="Actions" value={data.stats.approvalsPending + data.stats.incidentsOpen} hint={`${data.stats.approvalsPending} validations, ${data.stats.incidentsOpen} incidents`} icon={Inbox} />
        <StatCard label="Agents" value={data.stats.agentsActive} hint={`${data.stats.knowledgeDocuments} documents de connaissance`} icon={Bot} />
      </div>

      <Section title="Actions clients" description="Toutes les tâches en cours pour chaque client. Déplacer une carte met à jour son statut.">
        <AllClientsTaskBoard initialTasks={tasks} />
      </Section>

      <Section title="Focus clients" description="Comptes récents. Le détail de production vit dans chaque fiche client.">
        {data.recentClients.length === 0 ? (
          <EmptyState>Aucun client n'est encore enregistré dans Lucid OS.</EmptyState>
        ) : (
          <div className="divide-y divide-white/10">
            {data.recentClients.map((client) => (
              <div key={client.id} className="grid gap-3 py-4 first:pt-0 last:pb-0 md:grid-cols-[minmax(220px,1fr)_minmax(160px,0.6fr)_minmax(220px,1fr)_auto] md:items-center">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Link href={`/admin/lucid-os/clients/${client.slug}`} className="truncate font-medium text-zinc-50 underline-offset-4 hover:underline">
                      {client.name}
                    </Link>
                    <StatusBadge tone={client.status === 'active' ? 'good' : 'neutral'}>{labelFr(client.status)}</StatusBadge>
                  </div>
                  <p className="mt-1 truncate text-sm text-zinc-500">{client.industry ?? client.billingPlanName ?? 'Aucun segment enregistré'}</p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-600">Cycle de vie</p>
                  <p className="mt-1 text-sm text-zinc-300">{labelFr(client.lifecycleStage)}</p>
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-600">Prochaine action</p>
                  <p className="mt-1 truncate text-sm text-zinc-300">{client.nextAction ?? client.intake.nextStep ?? 'Aucune prochaine action enregistrée'}</p>
                </div>
                <Link href={`/admin/lucid-os/clients/${client.slug}`} className="inline-flex h-8 items-center justify-center gap-2 rounded border border-white/10 px-2.5 text-sm font-medium text-zinc-300 transition hover:bg-white/[0.06] hover:text-zinc-50 md:justify-self-end">
                  Ouvrir <ArrowRight className="size-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
