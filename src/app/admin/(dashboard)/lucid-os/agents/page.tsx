import { Bot, CheckCircle2, ShieldCheck, Wrench } from 'lucide-react';
import { listLucidAgents, listLucidApprovals, type LucidAgentStatus, type LucidApprovalStatus } from '@/lib/admin/lucid-os';
import { listAgentToolDefinitions, type AgentToolApprovalRequirement, type AgentToolRiskLevel, type AgentToolStatus } from '@/lib/admin/agents/tool-registry';
import { EmptyState, formatAdminDateTime, LucidOsHeader, Section, StatusBadge } from '../components';

export const dynamic = 'force-dynamic';

function agentTone(status: LucidAgentStatus): 'neutral' | 'good' | 'warning' | 'danger' {
  switch (status) {
    case 'active': return 'good';
    case 'paused': return 'warning';
    case 'retired': return 'neutral';
    default: return 'warning';
  }
}

function approvalTone(status: LucidApprovalStatus): 'neutral' | 'good' | 'warning' | 'danger' {
  switch (status) {
    case 'approved': return 'good';
    case 'pending': return 'warning';
    case 'rejected': return 'danger';
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

function toolStatusTone(status: AgentToolStatus): 'neutral' | 'good' | 'warning' | 'danger' {
  return status === 'available' ? 'good' : 'neutral';
}

function approvalRequirementTone(requirement: AgentToolApprovalRequirement): 'neutral' | 'good' | 'warning' | 'danger' {
  switch (requirement) {
    case 'always': return 'warning';
    case 'conditional': return 'neutral';
    case 'never': return 'good';
  }
}

function toolRiskTone(riskLevel: AgentToolRiskLevel): 'neutral' | 'good' | 'warning' | 'danger' {
  return riskTone(riskLevel);
}

function labelFr(value: string): string {
  const labels: Record<string, string> = {
    active: 'actif',
    approved: 'validé',
    critical: 'critique',
    high: 'élevé',
    low: 'faible',
    medium: 'moyen',
    never: 'jamais',
    paused: 'en pause',
    pending: 'en attente',
    planned: 'prévu',
    rejected: 'refusé',
    retired: 'retiré',
    always: 'toujours',
    available: 'disponible',
    conditional: 'conditionnel',
  };

  return labels[value] ?? value.replace(/_/g, ' ');
}

export default async function LucidOsAgentsPage() {
  const [agents, approvals] = await Promise.all([
    listLucidAgents(100),
    listLucidApprovals(50),
  ]);
  const tools = listAgentToolDefinitions();

  return (
    <div className="grid gap-6">
      <LucidOsHeader
        eyebrow="Opérations IA"
        title="Agents"
        description="Rôles, outils, périmètres mémoire, règles de validation et demandes récentes."
        icon={Bot}
      />

      <Section title="Registre des agents" description="Opérateurs réutilisables disponibles dans Lucid OS.">
        {agents.length === 0 ? (
          <EmptyState>Aucun agent n’est encore enregistré.</EmptyState>
        ) : (
          <div className="divide-y divide-white/10">
            {agents.map((agent) => (
              <article key={agent.id} className="grid gap-4 py-5 first:pt-0 last:pb-0 xl:grid-cols-[minmax(260px,1fr)_minmax(260px,0.85fr)_minmax(220px,0.75fr)] xl:items-start">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-zinc-950">{agent.name}</p>
                      <StatusBadge tone={agentTone(agent.status)}>{labelFr(agent.status)}</StatusBadge>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-zinc-600">{agent.role}</p>
                  </div>
                  {agent.status === 'active' ? <CheckCircle2 className="size-5 shrink-0 text-emerald-600" /> : <Bot className="size-5 shrink-0 text-zinc-400" />}
                </div>

                <div className="grid gap-2 text-sm text-zinc-600">
                  <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-2">
                    <span>Fournisseur</span>
                    <span className="font-medium text-zinc-900">{agent.providerPreference ?? 'au choix'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-2">
                    <span>Mémoire</span>
                    <span className="font-medium text-zinc-900">{agent.memoryScope}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span>Validation</span>
                    <span className="max-w-[13rem] truncate font-medium text-zinc-900">{agent.approvalPolicy}</span>
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 text-xs font-medium uppercase text-zinc-500">
                    <Wrench className="size-3" />
                    Outils
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {agent.tools.length === 0 ? (
                      <span className="text-sm text-zinc-400">Aucun outil enregistré</span>
                    ) : agent.tools.slice(0, 6).map((tool) => (
                      <span key={tool} className="rounded bg-zinc-100 px-2 py-1 text-xs text-zinc-600">{tool}</span>
                    ))}
                    {agent.tools.length > 6 ? <span className="rounded bg-zinc-100 px-2 py-1 text-xs text-zinc-600">+{agent.tools.length - 6}</span> : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </Section>

      <Section title="Registre des outils" description="Contrats disponibles pour les agents: risque, validation, effet externe et stratégie d’idempotence.">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[960px] text-left text-sm">
            <thead className="border-b border-zinc-200 text-xs uppercase text-zinc-500">
              <tr>
                <th className="pb-3 font-medium">Outil</th>
                <th className="pb-3 font-medium">Groupe</th>
                <th className="pb-3 font-medium">Statut</th>
                <th className="pb-3 font-medium">Risque</th>
                <th className="pb-3 font-medium">Validation</th>
                <th className="pb-3 font-medium">Effet externe</th>
                <th className="pb-3 font-medium">Idempotence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {tools.map((tool) => (
                <tr key={tool.name}>
                  <td className="py-3 pr-4">
                    <p className="font-medium text-zinc-950">{tool.label}</p>
                    <p className="mt-1 max-w-[24rem] text-xs leading-5 text-zinc-500">{tool.name} · {tool.description}</p>
                  </td>
                  <td className="py-3 pr-4 text-zinc-600">{tool.group}</td>
                  <td className="py-3 pr-4"><StatusBadge tone={toolStatusTone(tool.status)}>{labelFr(tool.status)}</StatusBadge></td>
                  <td className="py-3 pr-4"><StatusBadge tone={toolRiskTone(tool.riskLevel)}>{labelFr(tool.riskLevel)}</StatusBadge></td>
                  <td className="py-3 pr-4"><StatusBadge tone={approvalRequirementTone(tool.approvalRequired)}>{labelFr(tool.approvalRequired)}</StatusBadge></td>
                  <td className="py-3 pr-4 text-zinc-600">{tool.externalSideEffect ? 'oui' : 'non'}</td>
                  <td className="py-3 pr-4 text-xs leading-5 text-zinc-500">{tool.idempotencyStrategy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Section>

      <Section title="Validations" description="Décisions humaines pour publication, prospection, changements de données, déploiements, DNS et autres effets externes.">
        {approvals.length === 0 ? (
          <EmptyState>Aucune validation enregistrée pour le moment.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b border-zinc-200 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="pb-3 font-medium">Action</th>
                  <th className="pb-3 font-medium">Agent</th>
                  <th className="pb-3 font-medium">Statut</th>
                  <th className="pb-3 font-medium">Risque</th>
                  <th className="pb-3 font-medium">Client</th>
                  <th className="pb-3 font-medium">Demandé le</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {approvals.map((approval) => (
                  <tr key={approval.id}>
                    <td className="py-3 pr-4 font-medium text-zinc-950">{approval.actionType}</td>
                    <td className="py-3 pr-4 text-zinc-600">{approval.agentName ?? '-'}</td>
                    <td className="py-3 pr-4"><StatusBadge tone={approvalTone(approval.status)}>{labelFr(approval.status)}</StatusBadge></td>
                    <td className="py-3 pr-4"><StatusBadge tone={riskTone(approval.riskLevel)}>{labelFr(approval.riskLevel)}</StatusBadge></td>
                    <td className="py-3 pr-4 text-zinc-600">{approval.clientName ?? approval.projectName ?? '-'}</td>
                    <td className="py-3 pr-4 text-zinc-600">{formatAdminDateTime(approval.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <section className="rounded-md border border-white/10 bg-white/[0.03] p-4 text-sm leading-6 text-zinc-600">
        <div className="flex gap-2">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-zinc-500" />
          <p>Les publications, campagnes de prospection, modifications CRM, déploiements, changements DNS, mutations de données de production et paiements doivent créer une validation et une trace d’audit avant exécution.</p>
        </div>
      </section>
    </div>
  );
}
