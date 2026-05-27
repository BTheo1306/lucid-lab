import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  Building2,
  CheckCircle2,
  Clock3,
  FolderKanban,
  Globe2,
  Inbox,
  MonitorCheck,
  ShieldCheck,
  Users,
} from 'lucide-react';
import {
  getLucidOsDashboardData,
  type LucidHealthStatus,
  type LucidIncidentStatus,
  type LucidProjectStatus,
} from '@/lib/admin/lucid-os';
import { EmptyState, formatAdminDateTime, LucidOsHeader, Section, StatCard, StatusBadge } from './components';

export const dynamic = 'force-dynamic';

function healthTone(status: LucidHealthStatus): 'neutral' | 'good' | 'warning' | 'danger' {
  switch (status) {
    case 'healthy': return 'good';
    case 'degraded': return 'warning';
    case 'down': return 'danger';
    default: return 'neutral';
  }
}

function incidentTone(status: LucidIncidentStatus): 'neutral' | 'good' | 'warning' | 'danger' {
  switch (status) {
    case 'resolved':
    case 'closed': return 'good';
    case 'open':
    case 'investigating':
    case 'identified': return 'danger';
    case 'monitoring': return 'warning';
    default: return 'neutral';
  }
}

function projectTone(status: LucidProjectStatus): 'neutral' | 'good' | 'warning' | 'danger' {
  switch (status) {
    case 'active': return 'good';
    case 'blocked': return 'danger';
    case 'completed': return 'neutral';
    default: return 'warning';
  }
}

function riskTone(riskLevel: string): 'neutral' | 'good' | 'warning' | 'danger' {
  switch (riskLevel) {
    case 'critical':
    case 'high': return 'danger';
    case 'medium': return 'warning';
    case 'low': return 'good';
    default: return 'neutral';
  }
}

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
    expansion_opportunity: 'opportunité d’expansion',
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
  const data = await getLucidOsDashboardData();

  return (
    <div className="grid gap-5">
      <LucidOsHeader
        eyebrow="Pilotage agence"
        title="Lucid OS"
        description="Une vue sobre pour suivre les comptes clients, la production et les actions qui demandent vraiment de l’attention."
        icon={Globe2}
      />

      {!data.schemaReady ? (
        <section className="rounded-md border border-amber-400/30 bg-amber-500/10 p-4 text-sm leading-6 text-amber-200">
          <div className="flex gap-2">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p>La migration Lucid OS n’a pas encore été appliquée au projet Supabase actif.</p>
          </div>
        </section>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Clients" value={data.stats.clientsTotal} hint={`${data.stats.clientsActive} comptes actifs`} icon={Users} />
        <StatCard label="Production" value={data.stats.projectsActive} hint={`${data.stats.websitesLive} sites en ligne`} icon={FolderKanban} />
        <StatCard label="Actions" value={data.stats.approvalsPending + data.stats.incidentsOpen} hint={`${data.stats.approvalsPending} validations, ${data.stats.incidentsOpen} incidents`} icon={Inbox} />
        <StatCard label="Agents" value={data.stats.agentsActive} hint={`${data.stats.knowledgeDocuments} documents de connaissance`} icon={Bot} />
      </div>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.35fr)_minmax(340px,0.65fr)]">
        <Section title="Focus clients" description="Comptes récents. Le détail de production vit dans chaque fiche client.">
          {data.recentClients.length === 0 ? (
            <EmptyState>Aucun client n’est encore enregistré dans Lucid OS.</EmptyState>
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

        <Section title="File d’actions" description="Seulement les validations et incidents qui demandent une décision.">
          <div className="grid gap-5">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-300">
                <ShieldCheck className="size-4 text-zinc-500" />
                Validations
              </div>
              {data.pendingApprovals.length === 0 ? (
                <EmptyState>Aucune validation en attente.</EmptyState>
              ) : (
                <div className="divide-y divide-white/10">
                  {data.pendingApprovals.slice(0, 4).map((approval) => (
                    <div key={approval.id} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-medium text-zinc-100">{approval.actionType}</p>
                        <StatusBadge tone={riskTone(approval.riskLevel)}>{labelFr(approval.riskLevel)}</StatusBadge>
                      </div>
                      <p className="mt-1 truncate text-xs text-zinc-500">{approval.agentName ?? 'Agent inconnu'} · {formatAdminDateTime(approval.createdAt)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-300">
                <MonitorCheck className="size-4 text-zinc-500" />
                Incidents
              </div>
              {data.openIncidents.length === 0 ? (
                <EmptyState>Aucun incident ouvert.</EmptyState>
              ) : (
                <div className="divide-y divide-white/10">
                  {data.openIncidents.slice(0, 4).map((incident) => (
                    <div key={incident.id} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-medium text-zinc-100">{incident.title}</p>
                        <StatusBadge tone={incidentTone(incident.status)}>{labelFr(incident.status)}</StatusBadge>
                      </div>
                      <p className="mt-1 truncate text-xs text-zinc-500">{incident.clientName ?? incident.websiteName ?? 'Lucid-Lab'} · {labelFr(incident.severity)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Section>
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <Section title="Santé production" description="Les projets et sites restent visibles ici, mais le contexte complet vit dans la fiche client.">
          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-300">
                <FolderKanban className="size-4 text-zinc-500" />
                Projets
              </div>
              {data.recentProjects.length === 0 ? (
                <EmptyState>Aucun projet enregistré.</EmptyState>
              ) : (
                <div className="divide-y divide-white/10">
                  {data.recentProjects.slice(0, 5).map((project) => (
                    <div key={project.id} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-medium text-zinc-100">{project.name}</p>
                        <StatusBadge tone={projectTone(project.status)}>{labelFr(project.status)}</StatusBadge>
                      </div>
                      <p className="mt-1 truncate text-xs text-zinc-500">{project.clientName ?? 'Aucun client'} · {project.projectType ?? 'projet'}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-300">
                <Globe2 className="size-4 text-zinc-500" />
                Sites web
              </div>
              {data.recentWebsites.length === 0 ? (
                <EmptyState>Aucun site web enregistré.</EmptyState>
              ) : (
                <div className="divide-y divide-white/10">
                  {data.recentWebsites.slice(0, 5).map((website) => (
                    <div key={website.id} className="py-3 first:pt-0 last:pb-0">
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-medium text-zinc-100">{website.name}</p>
                        <StatusBadge tone={healthTone(website.healthStatus)}>{labelFr(website.healthStatus)}</StatusBadge>
                      </div>
                      <p className="mt-1 truncate text-xs text-zinc-500">{website.clientName ?? 'Aucun client'} · {website.primaryDomain ?? website.productionUrl ?? 'Aucun domaine'}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Section>

        <Section title="Couche agents" description="Opérateurs actifs et audit récent, en second plan du travail client.">
          <div className="grid gap-5 lg:grid-cols-2">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-300">
                <Bot className="size-4 text-zinc-500" />
                Agents
              </div>
              {data.activeAgents.length === 0 ? (
                <EmptyState>Aucun agent actif.</EmptyState>
              ) : (
                <div className="divide-y divide-white/10">
                  {data.activeAgents.slice(0, 5).map((agent) => (
                    <Link key={agent.id} href="/admin/lucid-os/agents" className="grid py-3 first:pt-0 last:pb-0 hover:text-zinc-50">
                      <div className="flex items-center justify-between gap-3">
                        <p className="truncate text-sm font-medium text-zinc-100">{agent.name}</p>
                        <CheckCircle2 className="size-3.5 shrink-0 text-[#60a5fa]" />
                      </div>
                      <p className="mt-1 line-clamp-1 text-xs text-zinc-500">{agent.role}</p>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-zinc-300">
                <Clock3 className="size-4 text-zinc-500" />
                Audit récent
              </div>
              {data.recentAuditEvents.length === 0 ? (
                <EmptyState>Aucun événement d’audit.</EmptyState>
              ) : (
                <div className="divide-y divide-white/10">
                  {data.recentAuditEvents.slice(0, 5).map((event) => (
                    <div key={event.id} className="py-3 first:pt-0 last:pb-0">
                      <p className="truncate text-sm font-medium text-zinc-100">{event.summary}</p>
                      <p className="mt-1 truncate text-xs text-zinc-500">{event.actorType} · {event.eventType} · {formatAdminDateTime(event.createdAt)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Section>
      </div>

      <section className="rounded-md border border-white/10 bg-white/[0.03] p-3">
        <div className="grid gap-2 md:grid-cols-4">
          {[
            ['/admin/lucid-os/clients', 'Clients', 'Fiches clients et contexte de production.', Building2],
            ['/admin/lucid-os/delivery/projects', 'Projets', 'Inventaire production et statut.', FolderKanban],
            ['/admin/lead-engine', 'Croissance', 'Moteur de prospection et outbound.', ShieldCheck],
            ['/admin/lucid-os/inbox', 'Opérations', 'Validations, tâches agents et incidents à traiter.', Inbox],
          ].map(([href, title, description, Icon]) => (
            <Link key={String(href)} href={String(href)} className="rounded border border-white/10 bg-black/10 p-3 transition-colors hover:bg-white/[0.05]">
              <div className="flex items-center justify-between gap-2">
                <div className="flex min-w-0 items-center gap-2 font-medium text-zinc-100">
                  <Icon className="size-4 shrink-0 text-zinc-500" />
                  <span className="truncate">{String(title)}</span>
                </div>
                <ArrowRight className="size-3.5 shrink-0 text-zinc-600" />
              </div>
              <p className="mt-2 line-clamp-2 text-xs leading-5 text-zinc-500">{String(description)}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}