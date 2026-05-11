import Link from 'next/link';
import { AlertTriangle, ArrowRight, Bot, Brain, Building2, CheckCircle2, Clock3, Globe2, ShieldCheck, Users } from 'lucide-react';
import { getLucidOsDashboardData, type LucidHealthStatus, type LucidIncidentStatus } from '@/lib/admin/lucid-os';
import { EmptyState, formatAdminDateTime, LucidOsHeader, LucidOsTabs, Section, StatCard, StatusBadge } from './components';

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

function riskTone(riskLevel: string): 'neutral' | 'good' | 'warning' | 'danger' {
  switch (riskLevel) {
    case 'critical':
    case 'high': return 'danger';
    case 'medium': return 'warning';
    case 'low': return 'good';
    default: return 'neutral';
  }
}

export default async function LucidOsPage() {
  const data = await getLucidOsDashboardData();

  return (
    <div className="grid gap-6">
      <LucidOsHeader
        eyebrow="Agency control plane"
        title="Lucid OS"
        description="Clients, projects, websites, agents, approvals, incidents, and operational knowledge in one internal system."
        icon={Globe2}
      />

      <LucidOsTabs active="overview" />

      {!data.schemaReady ? (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800 shadow-sm">
          <div className="flex gap-2">
            <AlertTriangle className="mt-0.5 size-4 shrink-0" />
            <p>The Lucid OS migration has not been applied to the active Supabase project yet.</p>
          </div>
        </section>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Clients" value={data.stats.clientsTotal} hint={`${data.stats.clientsActive} active accounts`} icon={Users} />
        <StatCard label="Active projects" value={data.stats.projectsActive} hint={`${data.stats.websitesLive} live websites tracked`} icon={Building2} />
        <StatCard label="Agents" value={data.stats.agentsActive} hint={`${data.stats.approvalsPending} approvals pending`} icon={Bot} />
        <StatCard label="Knowledge" value={data.stats.knowledgeDocuments} hint={`${data.stats.incidentsOpen} open incidents`} icon={Brain} />
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
        <Section title="Client pipeline" description="Recent accounts and delivery work tracked in the OS.">
          {data.recentClients.length === 0 ? (
            <EmptyState>No clients are registered in Lucid OS yet.</EmptyState>
          ) : (
            <div className="grid gap-3">
              {data.recentClients.map((client) => (
                <div key={client.id} className="rounded-lg border border-zinc-200 p-4">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-zinc-950">{client.name}</p>
                        <StatusBadge tone={client.status === 'active' ? 'good' : 'neutral'}>{client.status}</StatusBadge>
                      </div>
                      <p className="mt-1 text-sm text-zinc-500">{client.industry ?? client.billingPlanName ?? 'No segment recorded'}</p>
                    </div>
                    <Link href={`/admin/lucid-os/clients/${client.slug}`} className="inline-flex items-center gap-1 text-sm font-medium text-zinc-600 hover:text-zinc-950">
                      Open <ArrowRight className="size-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Agent approvals" description="Side-effecting AI work waits for a human decision.">
          {data.pendingApprovals.length === 0 ? (
            <EmptyState>No approvals are pending.</EmptyState>
          ) : (
            <div className="grid gap-3">
              {data.pendingApprovals.map((approval) => (
                <div key={approval.id} className="rounded-lg border border-zinc-200 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-zinc-950">{approval.actionType}</p>
                      <p className="mt-1 text-sm text-zinc-500">{approval.agentName ?? 'Unknown agent'} · {formatAdminDateTime(approval.createdAt)}</p>
                    </div>
                    <StatusBadge tone={riskTone(approval.riskLevel)}>{approval.riskLevel}</StatusBadge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Section title="Websites" description="Delivery inventory and health snapshots.">
          {data.recentWebsites.length === 0 ? (
            <EmptyState>No websites are registered yet.</EmptyState>
          ) : (
            <div className="grid gap-3">
              {data.recentWebsites.map((website) => (
                <div key={website.id} className="rounded-lg border border-zinc-200 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-zinc-950">{website.name}</p>
                      <p className="mt-1 text-sm text-zinc-500">{website.primaryDomain ?? website.productionUrl ?? 'No domain'}</p>
                    </div>
                    <StatusBadge tone={healthTone(website.healthStatus)}>{website.healthStatus}</StatusBadge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Agents" description="Reusable operators connected to shared state.">
          {data.activeAgents.length === 0 ? (
            <EmptyState>No active agents are registered yet.</EmptyState>
          ) : (
            <div className="grid gap-3">
              {data.activeAgents.map((agent) => (
                <Link key={agent.id} href="/admin/lucid-os/agents" className="block rounded-lg border border-zinc-200 p-3 transition-colors hover:bg-zinc-50">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-zinc-950">{agent.name}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{agent.role}</p>
                    </div>
                    <CheckCircle2 className="size-4 shrink-0 text-emerald-600" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Section>

        <Section title="Incidents" description="Operational issues and follow-up work.">
          {data.openIncidents.length === 0 ? (
            <EmptyState>No open incidents.</EmptyState>
          ) : (
            <div className="grid gap-3">
              {data.openIncidents.map((incident) => (
                <div key={incident.id} className="rounded-lg border border-zinc-200 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-zinc-950">{incident.title}</p>
                      <p className="mt-1 text-sm text-zinc-500">{incident.clientName ?? incident.websiteName ?? 'Lucid-Lab'} · {incident.severity}</p>
                    </div>
                    <StatusBadge tone={incidentTone(incident.status)}>{incident.status}</StatusBadge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Section title="Knowledge memory" description="Human-readable sources linked to runtime retrieval records.">
          {data.recentKnowledge.length === 0 ? (
            <EmptyState>No knowledge documents are indexed yet.</EmptyState>
          ) : (
            <div className="grid gap-3">
              {data.recentKnowledge.map((document) => (
                <Link key={document.id} href="/admin/lucid-os/knowledge" className="block rounded-lg border border-zinc-200 p-3 transition-colors hover:bg-zinc-50">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-zinc-950">{document.title}</p>
                      <p className="mt-1 text-sm text-zinc-500">{document.sourceSystem} · {document.visibility}</p>
                    </div>
                    <ArrowRight className="size-4 text-zinc-400" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Section>

        <Section title="Audit trail" description="Admin, system, agent, and automation events.">
          {data.recentAuditEvents.length === 0 ? (
            <EmptyState>No Lucid OS audit events yet.</EmptyState>
          ) : (
            <div className="grid gap-3">
              {data.recentAuditEvents.map((event) => (
                <div key={event.id} className="rounded-lg border border-zinc-200 p-3">
                  <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                    <div className="min-w-0">
                      <p className="truncate font-medium text-zinc-950">{event.summary}</p>
                      <p className="mt-1 text-sm text-zinc-500">{event.actorType} · {event.eventType}</p>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-zinc-500">
                      <Clock3 className="size-4" />
                      {formatAdminDateTime(event.createdAt)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-4">
          {[
            ['/admin/lucid-os/clients', 'Clients', 'Accounts, delivery tier, and contact context.', Building2],
            ['/admin/lucid-os/agents', 'Agents', 'Agent roles, tools, memory scope, and approval rules.', Bot],
            ['/admin/lucid-os/knowledge', 'Knowledge', 'Obsidian-linked documents and Supabase retrieval records.', Brain],
            ['/admin/lead-engine', 'Lead Engine', 'Outbound discovery, scoring, drafts, and approvals.', ShieldCheck],
          ].map(([href, title, description, Icon]) => (
            <Link key={String(href)} href={String(href)} className="rounded-lg border border-zinc-200 p-4 transition-colors hover:bg-zinc-50">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-medium text-zinc-950">
                  <Icon className="size-4 text-zinc-500" />
                  {String(title)}
                </div>
                <ArrowRight className="size-4 text-zinc-400" />
              </div>
              <p className="mt-2 text-sm leading-6 text-zinc-500">{String(description)}</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
