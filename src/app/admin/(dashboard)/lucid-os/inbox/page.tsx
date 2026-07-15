import Link from 'next/link';
import { AlertTriangle, ArrowRight, CalendarClock, CheckCircle2, Inbox, ListChecks, MessageSquare, PlayCircle, ShieldCheck, Users } from 'lucide-react';
import { listOpenClientRequests } from '@/lib/admin/portal';
import {
  listLucidAgentRuns,
  listLucidAgentTasks,
  listLucidApprovals,
  listLucidAutomationRuns,
  listLucidClients,
  listLucidIncidents,
  type LucidAgentRunStatus,
  type LucidAgentTaskPriority,
  type LucidAgentTaskStatus,
  type LucidAutomationRunStatus,
  type LucidClientHealthStatus,
  type LucidIncidentStatus,
} from '@/lib/admin/lucid-os';
import { EmptyState, formatAdminDateTime, LucidOsHeader, Section, StatCard, StatusBadge } from '../components';
import { decideAgentApprovalAction, executeAgentTaskAction, processQueuedAgentWorkflowsAction, updateAgentTaskStatusAction } from './actions';

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

function automationRunStatusTone(status: LucidAutomationRunStatus): 'neutral' | 'good' | 'warning' | 'danger' {
  switch (status) {
    case 'completed':
      return 'good';
    case 'failed':
    case 'completed_with_errors':
    case 'cancelled':
      return 'danger';
    case 'queued':
    case 'running':
    case 'paused':
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
    paused: 'en pause',
    pending: 'en attente',
    approved: 'validé',
    queued: 'en file',
    ready: 'prêt',
    rejected: 'refusé',
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

function contextStringArray(context: Record<string, unknown>, key: string): string[] {
  const value = context[key];
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string' && item.trim().length > 0) : [];
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

function ExecuteTaskButton({ taskId, approvalId }: { taskId: string; approvalId: string | null }) {
  return (
    <form action={executeAgentTaskAction}>
      <input type="hidden" name="task_id" value={taskId} />
      {approvalId ? <input type="hidden" name="approval_id" value={approvalId} /> : null}
      <button className="inline-flex h-8 items-center justify-center rounded border border-emerald-500/30 px-2.5 text-xs font-medium text-emerald-200 transition hover:bg-emerald-500/10">
        Execute
      </button>
    </form>
  );
}

function TaskActionButtons({ taskId, approvalId }: { taskId: string; approvalId: string | null }) {
  return (
    <div className="flex flex-wrap gap-2 xl:justify-end">
      <ExecuteTaskButton taskId={taskId} approvalId={approvalId} />
      <TaskStatusButton taskId={taskId} status="blocked" label="Bloqué" />
      <TaskStatusButton taskId={taskId} status="done" label="Fait" />
    </div>
  );
}

function TaskCard({ task, approvalId }: { task: Awaited<ReturnType<typeof listLucidAgentTasks>>[number]; approvalId: string | null }) {
  const intent = contextString(task.context, 'intent');
  const senderName = contextString(task.context, 'sender_name');
  const routedTo = contextString(task.context, 'routed_to') ?? task.assignedAgentName ?? task.agentName ?? 'COO Agent';
  const approvalSummary = contextString(task.context, 'approval_summary');
  const proposedTools = contextStringArray(task.context, 'proposed_tools');

  return (
    <article className="grid gap-4 py-4 first:pt-0 last:pb-0 xl:grid-cols-[minmax(0,1fr)_minmax(260px,0.45fr)] xl:items-start">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="font-medium text-zinc-50">{task.title}</p>
          <StatusBadge tone={taskStatusTone(task.status)}>{labelFr(task.status)}</StatusBadge>
          <StatusBadge tone={priorityTone(task.priority)}>{labelFr(task.priority)}</StatusBadge>
        </div>
        <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-300">{task.description ?? 'Aucun détail enregistré.'}</p>
        {approvalSummary ? <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-400">{approvalSummary}</p> : null}
        {proposedTools.length ? <p className="mt-2 text-xs text-zinc-500">Outils: {proposedTools.join(', ')}</p> : null}
        <p className="mt-2 text-xs text-zinc-500">
          #{taskReference(task.id)} · {intent ? labelFr(intent) : 'opération'} · {routedTo} · {senderName ?? 'Telegram'} · {formatAdminDateTime(task.createdAt)}
        </p>
      </div>

      {task.status === 'done' ? null : <TaskActionButtons taskId={task.id} approvalId={approvalId} />}
    </article>
  );
}

function ApprovalDecisionButton({ approvalId, decision, label }: { approvalId: string; decision: 'approve' | 'reject'; label: string }) {
  const tone = decision === 'approve'
    ? 'border-emerald-500/30 text-emerald-200 hover:bg-emerald-500/10'
    : 'border-red-500/30 text-red-200 hover:bg-red-500/10';

  return (
    <form action={decideAgentApprovalAction}>
      <input type="hidden" name="approval_id" value={approvalId} />
      <input type="hidden" name="decision" value={decision} />
      <button className={`inline-flex h-8 items-center justify-center rounded border px-2.5 text-xs font-medium transition ${tone}`}>
        {label}
      </button>
    </form>
  );
}

function ProcessQueueButton() {
  return (
    <form action={processQueuedAgentWorkflowsAction}>
      <button className="inline-flex h-8 items-center justify-center rounded border border-white/10 px-2.5 text-xs font-medium text-zinc-300 transition hover:bg-white/[0.06] hover:text-zinc-50">
        Traiter la file
      </button>
    </form>
  );
}

export default async function LucidOsInboxPage() {
  const [pendingApprovals, incidents, clients, agentTasks, agentRuns, automationRuns, openClientRequests] = await Promise.all([
    listLucidApprovals(20, 'pending'),
    listLucidIncidents(20),
    listLucidClients(50),
    listLucidAgentTasks(40),
    listLucidAgentRuns(20),
    listLucidAutomationRuns(20),
    listOpenClientRequests(20).catch(() => []),
  ]);
  const openIncidents = incidents.filter((incident) => !['resolved', 'closed'].includes(incident.status));
  const pendingApprovalByTaskId = new Map(pendingApprovals.filter((approval) => approval.taskId).map((approval) => [approval.taskId as string, approval.id]));
  const pendingValidationTasks = agentTasks.filter((task) => task.status === 'waiting_approval');
  const executableTasks = agentTasks.filter((task) => !['waiting_approval', 'done', 'cancelled', 'blocked'].includes(task.status));
  const executedTasks = agentTasks.filter((task) => task.status === 'done').slice(0, 12);
  const hiddenBlockedTasks = agentTasks.filter((task) => task.status === 'blocked');
  const recentTelegramRuns = agentRuns.filter((run) => run.triggerSource === 'telegram').slice(0, 8);
  const recentAutomationRuns = automationRuns.slice(0, 8);
  const clientNextActions = clients
    .filter((client) => client.nextAction || client.nextActionDueAt || ['watch', 'risk', 'critical'].includes(client.clientHealthStatus))
    .slice(0, 8);

  return (
    <div className="grid gap-6">
      <LucidOsHeader title="Actions" icon={Inbox} />

      <div className="grid gap-3 md:grid-cols-4">
        <StatCard label="À valider" value={pendingValidationTasks.length} hint="Tâches prêtes pour validation" icon={ShieldCheck} />
        <StatCard label="À exécuter" value={executableTasks.length} hint="Tâches COO actives" icon={ListChecks} />
        <StatCard label="Incidents" value={openIncidents.length} hint="Événements opérationnels actifs" icon={AlertTriangle} />
        <StatCard label="Actions client" value={clientNextActions.length} hint="Relances et signaux de santé" icon={CalendarClock} />
      </div>

      <Section title="Demandes clients (portail)">
        {openClientRequests.length === 0 ? (
          <EmptyState>Aucune demande client en attente.</EmptyState>
        ) : (
          <div className="divide-y divide-zinc-100">
            {openClientRequests.map((request) => (
              <div key={request.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <MessageSquare className="size-4 shrink-0 text-blue-600" />
                    {request.clientSlug ? (
                      <Link href={`/admin/lucid-os/clients/${request.clientSlug}`} className="text-sm font-semibold text-blue-700 hover:underline">
                        {request.clientName}
                      </Link>
                    ) : (
                      <span className="text-sm font-semibold text-zinc-700">{request.clientName ?? 'Client'}</span>
                    )}
                    <p className="text-sm font-medium text-zinc-950">{request.title}</p>
                    <StatusBadge tone="warning">{request.status === 'open' ? 'Ouverte' : request.status === 'in_progress' ? 'En cours' : 'En attente'}</StatusBadge>
                  </div>
                  <p className="mt-1 text-xs text-zinc-500">
                    {request.createdByContactName ? `De ${request.createdByContactName} · ` : ''}
                    {formatAdminDateTime(request.createdAt)}
                  </p>
                </div>
                {request.clientSlug ? (
                  <Link
                    href={`/admin/lucid-os/clients/${request.clientSlug}`}
                    className="inline-flex h-8 items-center gap-1.5 rounded border border-blue-200 bg-blue-50 px-2.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                  >
                    Traiter
                    <ArrowRight className="size-3.5" />
                  </Link>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section title="Tâches en attente de validation">
        {pendingValidationTasks.length === 0 ? (
          <EmptyState>Aucune tâche en attente de validation.</EmptyState>
        ) : (
          <div className="divide-y divide-white/10">
            {pendingValidationTasks.map((task) => <TaskCard key={task.id} task={task} approvalId={pendingApprovalByTaskId.get(task.id) ?? null} />)}
          </div>
        )}
      </Section>

      <Section title="Tâches à exécuter">
        {executableTasks.length === 0 ? (
          <EmptyState>Aucune tâche active à exécuter.</EmptyState>
        ) : (
          <div className="divide-y divide-white/10">
            {executableTasks.map((task) => <TaskCard key={task.id} task={task} approvalId={pendingApprovalByTaskId.get(task.id) ?? null} />)}
          </div>
        )}
      </Section>

      <Section title="Tâches exécutées">
        {executedTasks.length === 0 ? (
          <EmptyState>Aucune tâche exécutée récemment.</EmptyState>
        ) : (
          <div className="divide-y divide-white/10">
            {executedTasks.map((task) => <TaskCard key={task.id} task={task} approvalId={null} />)}
          </div>
        )}
        {hiddenBlockedTasks.length ? <p className="mt-3 text-xs text-zinc-600">{hiddenBlockedTasks.length} tâche(s) bloquée(s) masquée(s).</p> : null}
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
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-400">
                        {contextString(approval.requestPayload, 'proposed_summary') ?? contextString(approval.requestPayload, 'requested_text') ?? 'Validation agent en attente.'}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:justify-end">
                      <ApprovalDecisionButton approvalId={approval.id} decision="approve" label="Execute" />
                      <ApprovalDecisionButton approvalId={approval.id} decision="reject" label="Refuser" />
                      <Link href="/admin/lucid-os/agents" className="inline-flex h-8 items-center gap-1 rounded border border-white/10 px-2.5 text-xs font-medium text-zinc-400 hover:bg-white/[0.06] hover:text-zinc-50">
                        Voir <ArrowRight className="size-4" />
                      </Link>
                    </div>
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

      <Section title="Exécutions durables" action={<ProcessQueueButton />}>
        {recentAutomationRuns.length === 0 ? (
          <EmptyState>Aucune exécution durable enregistrée.</EmptyState>
        ) : (
          <div className="divide-y divide-white/10">
            {recentAutomationRuns.map((run) => {
              const actionType = contextString(run.input, 'action_type') ?? run.workflowKey;
              const stage = contextString(run.summary, 'stage') ?? run.runType;
              const pausedTools = Array.isArray(run.summary.paused_tools)
                ? run.summary.paused_tools.filter((tool): tool is string => typeof tool === 'string')
                : [];

              return (
                <div key={run.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <PlayCircle className="size-4 text-zinc-500" />
                        <p className="truncate font-medium text-zinc-50">{actionType}</p>
                        <StatusBadge tone={automationRunStatusTone(run.status)}>{labelFr(run.status)}</StatusBadge>
                      </div>
                      <p className="mt-1 text-sm text-zinc-500">
                        {run.agentName ?? 'Agent'} · {run.clientName ?? run.projectName ?? 'Lucid OS'} · {formatAdminDateTime(run.createdAt)}
                      </p>
                      <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-400">
                        {labelFr(stage)}{pausedTools.length ? ` · en attente: ${pausedTools.join(', ')}` : ''}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Section>

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
                <Link key={client.id} href={`/admin/lucid-os/clients/${client.slug}`} className="block py-4 transition-colors first:pt-0 last:pb-0 hover:bg-white/[0.03]">
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