import { Clock3, PlayCircle } from 'lucide-react';
import { getLeadEngineRunsPageData, type LeadEngineRunStatus } from '@/lib/admin/lead-engine';
import { EmptyState, LeadEngineHeader, LeadEngineTabs, Section, StatusBadge } from '../components';

export const dynamic = 'force-dynamic';

function statusTone(status: LeadEngineRunStatus): 'neutral' | 'good' | 'warning' | 'danger' {
  switch (status) {
    case 'completed': return 'good';
    case 'queued':
    case 'running':
    case 'paused':
    case 'completed_with_errors':
      return 'warning';
    case 'failed':
    case 'cancelled':
      return 'danger';
    default:
      return 'neutral';
  }
}

function formatDateTime(value: string | null): string {
  if (!value) return 'Not started';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatDuration(value: number | null): string {
  if (value === null) return '-';
  const seconds = Math.round(value / 1000);
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
}

export default async function LeadEngineRunsPage() {
  const { runs } = await getLeadEngineRunsPageData();

  return (
    <div className="grid gap-6">
      <LeadEngineHeader
        eyebrow="Lead Engine"
        title="Runs"
        description="Worker executions, dry runs, checkpoints, partial errors, blocked states, and session-expired states will be monitored here."
        icon={PlayCircle}
      />

      <LeadEngineTabs active="runs" />

      <Section title="Worker run monitor" description="Discovery, enrichment, scoring, draft generation, outreach, and CRM conversion runs.">
        {runs.length === 0 ? (
          <EmptyState>No worker runs yet. Dry runs will appear here before production enrichment or outreach jobs.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-left text-sm">
              <thead className="border-b border-zinc-200 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="pb-3 font-medium">Run type</th>
                  <th className="pb-3 font-medium">Campaign</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Processed</th>
                  <th className="pb-3 font-medium">Success</th>
                  <th className="pb-3 font-medium">Not found</th>
                  <th className="pb-3 font-medium">Blocked</th>
                  <th className="pb-3 font-medium">Errors</th>
                  <th className="pb-3 font-medium">Duration</th>
                  <th className="pb-3 font-medium">Started</th>
                  <th className="pb-3 font-medium">Error message</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {runs.map((run) => (
                  <tr key={run.id} className="align-top">
                    <td className="py-4 pr-4 font-medium text-zinc-950">{run.runType}</td>
                    <td className="py-4 pr-4 text-zinc-600">{run.campaignName ?? 'No campaign'}</td>
                    <td className="py-4 pr-4"><StatusBadge tone={statusTone(run.status)}>{run.status}</StatusBadge></td>
                    <td className="py-4 pr-4 text-zinc-600">{run.processedCount}</td>
                    <td className="py-4 pr-4 text-zinc-600">{run.successCount}</td>
                    <td className="py-4 pr-4 text-zinc-600">{run.notFoundCount}</td>
                    <td className="py-4 pr-4 text-zinc-600">{run.blockedCount}</td>
                    <td className="py-4 pr-4 text-zinc-600">{run.errorCount}</td>
                    <td className="py-4 pr-4 text-zinc-600">{formatDuration(run.durationMs)}</td>
                    <td className="py-4 pr-4 text-zinc-500">{formatDateTime(run.startedAt)}</td>
                    <td className="max-w-xs py-4 pr-4 text-zinc-600">{run.errorMessage ?? '-'}</td>
                    <td className="py-4 pr-4 text-zinc-400">Phase 4</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm leading-6 text-zinc-600 shadow-sm">
        <div className="flex gap-2">
          <Clock3 className="mt-0.5 size-4 shrink-0 text-zinc-500" />
          <p>Long-running discovery and Playwright jobs belong in the isolated worker, not inside Next.js API routes on Vercel.</p>
        </div>
      </div>
    </div>
  );
}