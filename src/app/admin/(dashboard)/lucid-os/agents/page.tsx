import { Bot, CheckCircle2, ShieldCheck, Wrench } from 'lucide-react';
import { listLucidAgents, listLucidApprovals, type LucidAgentStatus, type LucidApprovalStatus } from '@/lib/admin/lucid-os';
import { EmptyState, formatAdminDateTime, LucidOsHeader, LucidOsTabs, Section, StatusBadge } from '../components';

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

export default async function LucidOsAgentsPage() {
  const [agents, approvals] = await Promise.all([
    listLucidAgents(100),
    listLucidApprovals(50),
  ]);

  return (
    <div className="grid gap-6">
      <LucidOsHeader
        eyebrow="AI operations"
        title="Agents"
        description="Agent roles, tools, memory scope, approval policies, and recent approval requests."
        icon={Bot}
      />

      <LucidOsTabs active="agents" />

      <Section title="Agent registry" description="Reusable operators available to Lucid OS.">
        {agents.length === 0 ? (
          <EmptyState>No agents are registered yet.</EmptyState>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {agents.map((agent) => (
              <article key={agent.id} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-zinc-950">{agent.name}</p>
                      <StatusBadge tone={agentTone(agent.status)}>{agent.status}</StatusBadge>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-zinc-600">{agent.role}</p>
                  </div>
                  {agent.status === 'active' ? <CheckCircle2 className="size-5 shrink-0 text-emerald-600" /> : <Bot className="size-5 shrink-0 text-zinc-400" />}
                </div>

                <div className="mt-4 grid gap-2 text-sm text-zinc-600">
                  <div className="flex items-center justify-between gap-3 rounded-lg bg-zinc-50 px-3 py-2">
                    <span>Provider</span>
                    <span className="font-medium text-zinc-900">{agent.providerPreference ?? 'any'}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-lg bg-zinc-50 px-3 py-2">
                    <span>Memory</span>
                    <span className="font-medium text-zinc-900">{agent.memoryScope}</span>
                  </div>
                  <div className="flex items-center justify-between gap-3 rounded-lg bg-zinc-50 px-3 py-2">
                    <span>Approval</span>
                    <span className="max-w-[13rem] truncate font-medium text-zinc-900">{agent.approvalPolicy}</span>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center gap-2 text-xs font-medium uppercase text-zinc-500">
                    <Wrench className="size-3" />
                    Tools
                  </div>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {agent.tools.length === 0 ? (
                      <span className="text-sm text-zinc-400">No tools recorded</span>
                    ) : agent.tools.slice(0, 6).map((tool) => (
                      <span key={tool} className="rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-600">{tool}</span>
                    ))}
                    {agent.tools.length > 6 ? <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs text-zinc-600">+{agent.tools.length - 6}</span> : null}
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </Section>

      <Section title="Approvals" description="Human decisions for publishing, outreach, data changes, deployments, DNS, and other side effects.">
        {approvals.length === 0 ? (
          <EmptyState>No approval records yet.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead className="border-b border-zinc-200 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="pb-3 font-medium">Action</th>
                  <th className="pb-3 font-medium">Agent</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Risk</th>
                  <th className="pb-3 font-medium">Client</th>
                  <th className="pb-3 font-medium">Requested</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {approvals.map((approval) => (
                  <tr key={approval.id}>
                    <td className="py-3 pr-4 font-medium text-zinc-950">{approval.actionType}</td>
                    <td className="py-3 pr-4 text-zinc-600">{approval.agentName ?? '-'}</td>
                    <td className="py-3 pr-4"><StatusBadge tone={approvalTone(approval.status)}>{approval.status}</StatusBadge></td>
                    <td className="py-3 pr-4"><StatusBadge tone={riskTone(approval.riskLevel)}>{approval.riskLevel}</StatusBadge></td>
                    <td className="py-3 pr-4 text-zinc-600">{approval.clientName ?? approval.projectName ?? '-'}</td>
                    <td className="py-3 pr-4 text-zinc-600">{formatAdminDateTime(approval.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 text-sm leading-6 text-zinc-600 shadow-sm">
        <div className="flex gap-2">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-zinc-500" />
          <p>Publishing, outreach, CRM edits, deployments, DNS changes, production data mutation, and payments should create approval and audit records before execution.</p>
        </div>
      </section>
    </div>
  );
}
