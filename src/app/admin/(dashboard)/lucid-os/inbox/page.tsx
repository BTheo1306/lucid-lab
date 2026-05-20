import Link from 'next/link';
import { AlertTriangle, ArrowRight, CalendarClock, CheckCircle2, Inbox, ListChecks, PlayCircle, ShieldCheck, Users } from 'lucide-react';
import {
  listLucidAgentRuns,
  listLucidAgentTasks,
  listLucidApprovals,
  listLucidClients,
  listLucidIncidents,
  type LucidAgentRunStatus,
  type LucidAgentTaskPriority,
  type LucidAgentTaskStatus,
  type LucidClientHealthStatus,
  type LucidIncidentStatus,
} from '@/lib/admin/lucid-os';
import { EmptyState, formatAdminDateTime, LucidOsHeader, Section, StatCard, StatusBadge } from '../components';
import { updateAgentTaskStatusAction } from './actions';

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

function taskStatusTone(status: LucidAgentTaskStatus): 'neutral' | 'good' | 'warning' | 'danger' {
  switch (status) {
    case 'done':
      return 'good';
    case 'blocked':
    case 'cancelled':
      return 'danger';
    case 'ready':
    case 'in_progress':
    case 'waiting_approval':
      return 'warning';
    default:
      return 'neutral';
  }
}

function runStatusTone(status: LucidAgentRunStatus): 'neutral' | 'good' | 'warning' | 'danger' {
  switch (status) {
    case 'completed':
      return 'good';
    case 'failed':
    case 'completed_with_errors':
    case 'cancelled':
      return 'danger';
    case 'queued':
    case 'running':
    case 'waiting_approval':
      return 'warning';
    default:
      return 'neutral';
  }
}

function priorityTone(priority: LucidAgentTaskPriority): 'neutral' | 'good' | 'warning' | 'danger' {
  switch (priority) {
    case 'urgent':
      return 'danger';
    case 'high':
      return 'warning';
    case 'low':
      return 'neutral';
    default:
      return 'good';
  }
}

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

function healthTone(status: LucidClientHealthStatus): 'neutral' | 'good' | 'warning' | 'danger' {
  switch (status) {
    case 'healthy':
      return 'good';
    case 'watch':
      return 'warning';
    case 'risk':
    case 'critical':
      return 'danger';
    default:
      return 'neutral';
  }
}

function labelFr(value: string): string {
  const labels: Record<string, string> = {
    backlog: 'backlog',
    blocked: 'bloqué',
    cancelled: 'annulé',
    closed: 'fermé',
    completed: 'terminé',
    completed_with_errors: 'terminé avec erreurs',
    critical: 'critique',
    crm_or_sales: 'CRM / ventes',
    done: 'fait',
    failed: 'échec',
    finance_document: 'finance / document',
    general_ops: 'opérations',
    healthy: 'sain',
    help: 'aide',
    high: 'élevé',
    incident_ops: 'incident',
    identified: 'identifié',
    in_progress: 'en cours',
    investigating: 'en investigation',
    low: 'faible',
    medium: 'moyen',
    meeting_ops: 'réunion',
    monitoring: 'surveillance',
    normal: 'normal',
    open: 'ouvert',
    queued: 'en file',
    ready: 'prêt',
    resolved: 'résolu',
    risk: 'risque',
    running: 'en cours',
    urgent: 'urgent',
    waiting_approval: 'attente validation',
    watch: 'à surveiller',
  };

  return labels[value] ?? value.replace(/_/g, ' ');
}

function contextString(context: Record<string, unknown>, key: string): string | null {
  const value = context[key];
  if (typeof value === 'number') return String(value);
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function taskReference(id: string): string {
  return id.slice(0, 8);
}

function TaskStatusButton({ taskId, status, label }: { taskId: string; status: LucidAgentTaskStatus; label: string }) {
  return (
    <form action={updateAgentTaskStatusAction}>
      <input type="hidden" name="task_id" value={taskId} />
      <input type="hidden" name="status" value={status} />
      <button className="inline-flex h-8 items-center justify-center rounded border border-white/10 px-2.5 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.06] hover:text-zinc-50">
        {label}
      </button>
    </form>
  );
}

export default async function LucidOsInboxPage() {
  const [pendingApprovals, incidents, clients, agentTasks, agentRuns] = await Promise.all([
    listLucidApprovals(20, 'pending'),
    listLucidIncidents(20),
    listLucidClients(50),
    listLucidAgentTasks(40),
    listLucidAgentRuns(20),
  ]);
  const openIncidents = incidents.filter((incident) => !['resolved', 'closed'].includes(incident.status));
  const openAgentTasks = agentTasks.filter((task) => !['done', 'cancelled'].includes(task.status));
  const recentTelegramRuns = agentRuns.filter((run) => run.triggerSource === 'telegram').slice(0, 8);
  const clientNextActions = clients
    .filter((client) => client.nextAction || client.nextActionDueAt || ['watch', 'risk', 'critical'].includes(client.clientHealthStatus))
    .slice(0, 8);

  return (
    <div className="grid gap-6">
      <LucidOsHeader title="Actions" icon={Inbox} />

      <div className="grid gap-3 md:grid-cols-4">
        <StatCard label="Tâches COO" value={openAgentTasks.length} hint="Captures Telegram à traiter" icon={ListChecks} />
        <StatCard label="Validations" value={pendingApprovals.length} hint="Décisions humaines en attente" icon={ShieldCheck} />
        <StatCard label="Incidents" value={openIncidents.length} hint="Événements opérationnels actifs" icon={AlertTriangle} />
        <StatCard label="Actions client" value={clientNextActions.length} hint="Relances et signaux de santé" icon={CalendarClock} />
      </div>

      <Section title="Tâches COO Telegram">
        {openAgentTasks.length === 0 ? (
          <EmptyState>Aucune tâche COO ouverte.</EmptyState>
        ) : (
          <div className="divide-y divide-white/10">
            {openAgentTasks.map((task) => {
              const intent = contextString(task.context, 'intent');
              const senderName = contextString(task.context, 'sender_name');
              const routedTo = contextString(task.context, 'routed_to') ?? task.assignedAgentName ?? task.agentName ?? 'COO Agent';

              return (
                <article key={task.id} className="grid gap-4 py-4 first:pt-0 last:pb-0 xl:grid-cols-[minmax(0,1fr)_minmax(260px,0.55fr)] xl:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="truncate font-medium text-zinc-50">{task.title}</p>
                      <StatusBadge tone={taskStatusTone(task.status)}>{labelFr(task.status)}</StatusBadge>
                      <StatusBadge tone={priorityTone(task.priority)}>{labelFr(task.priority)}</StatusBadge>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-400">{task.description ?? 'Aucun détail enregistré.'}</p>
                    <p className="mt-2 text-xs text-zinc-500">
                      #{taskReference(task.id)} · {intent ? labelFr(intent) : 'opération'} · {routedTo} · {senderName ?? 'Telegram'} · {formatAdminDateTime(task.createdAt)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 xl:justify-end">
                    {task.status !== 'in_progress' ? <TaskStatusButton taskId={task.id} status="in_progress" label="Prendre" /> : null}
                    {task.status !== 'waiting_approval' ? <TaskStatusButton taskId={task.id} status="waiting_approval" label="Validation" /> : null}
                    {task.status !== 'blocked' ? <TaskStatusButton taskId={task.id} status="blocked" label="Bloquer" /> : null}
                    <TaskStatusButton taskId={task.id} status="done" label="Fait" />
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </Section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Section title="Validations agent">
          {pendingApprovals.length === 0 ? (
            <EmptyState>Aucune validation en attente.</EmptyState>
          ) : (
            <div className="divide-y divide-white/10">
              {pendingApprovals.map((approval) => (
                <div key={approval.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-zinc-50">{approval.actionType}</p>
                        <StatusBadge tone={riskTone(approval.riskLevel)}>{labelFr(approval.riskLevel)}</StatusBadge>
                      </div>
                      <p className="mt-1 text-sm text-zinc-500">
                        {approval.agentName ?? 'Agent inconnu'} · {approval.clientName ?? approval.projectName ?? 'Lucid OS'} · {formatAdminDateTime(approval.createdAt)}
                      </p>
                    </div>
                    <Link href="/admin/lucid-os/agents" className="inline-flex items-center gap-1 text-sm font-medium text-zinc-400 hover:text-zinc-50">
                      Voir <ArrowRight className="size-4" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Runs Telegram récents">
          {recentTelegramRuns.length === 0 ? (
            <EmptyState>Aucun run Telegram récent.</EmptyState>
          ) : (
            <div className="divide-y divide-white/10">
              {recentTelegramRuns.map((run) => {
                const intent = contextString(run.input, 'intent');
                const routedTo = contextString(run.outputSummary, 'routed_to') ?? run.agentName ?? 'COO Agent';
                const senderName = contextString(run.input, 'sender_name') ?? contextString(run.input, 'sender_id');

                return (
                  <div key={run.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <PlayCircle className="size-4 shrink-0 text-zinc-500" />
                          <p className="truncate font-medium text-zinc-50">{intent ? labelFr(intent) : 'Commande Telegram'}</p>
                        </div>
                        <p className="mt-1 truncate text-sm text-zinc-500">{routedTo} · {senderName ?? 'Telegram'} · {formatAdminDateTime(run.createdAt)}</p>
                      </div>
                      <StatusBadge tone={runStatusTone(run.status)}>{labelFr(run.status)}</StatusBadge>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Section title="Incidents">
          {openIncidents.length === 0 ? (
            <EmptyState>Aucun incident ouvert.</EmptyState>
          ) : (
            <div className="divide-y divide-white/10">
              {openIncidents.map((incident) => (
                <div key={incident.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-zinc-50">{incident.title}</p>
                      <p className="mt-1 text-sm text-zinc-500">
                        {incident.clientName ?? incident.websiteName ?? 'Lucid-Lab'} · {labelFr(incident.severity)} · {formatAdminDateTime(incident.startedAt)}
                      </p>
                    </div>
                    <StatusBadge tone={incidentTone(incident.status)}>{labelFr(incident.status)}</StatusBadge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Prochaines actions client">
          {clientNextActions.length === 0 ? (
            <EmptyState>Aucune action client en attente.</EmptyState>
          ) : (
            <div className="divide-y divide-white/10">
              {clientNextActions.map((client) => (
                <Link key={client.id} href={`/admin/lucid-os/crm/clients/${client.slug}`} className="block py-4 transition-colors first:pt-0 last:pb-0 hover:bg-white/[0.03]">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Users className="size-4 text-zinc-500" />
                        <p className="font-medium text-zinc-50">{client.name}</p>
                      </div>
                      <p className="mt-2 text-sm text-zinc-400">{client.nextAction ?? client.healthSummary ?? 'Revoir le statut client'}</p>
                      <p className="mt-1 text-xs text-zinc-500">{client.nextActionDueAt ? formatAdminDateTime(client.nextActionDueAt) : labelFr(client.lifecycleStage)}</p>
                    </div>
                    <StatusBadge tone={healthTone(client.clientHealthStatus)}>{labelFr(client.clientHealthStatus)}</StatusBadge>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </Section>
      </div>

      <section className="rounded-md border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-zinc-500">
        <div className="flex gap-2">
          <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-blue-300" />
          <p>Telegram capture les demandes. Lucid OS garde la file de tâches, les validations, les runs et l’audit comme source de vérité avant toute exécution externe.</p>
        </div>
      </section>
    </div>
  );
}