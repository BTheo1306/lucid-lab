import Link from 'next/link';
import { AlertTriangle, ArrowRight, CheckCircle2, Clock3, Mail, MessageSquare, PlayCircle, Search, Users } from 'lucide-react';
import { getLeadEngineOverviewData, type LeadEnginePriority, type LeadEngineRunStatus } from '@/lib/admin/lead-engine';
import { resetLeadEngineSandboxAction, runLeadEngineDryRunAction } from './actions';
import { EmptyState, LeadEngineHeader, LeadEngineTabs, Section, StatCard, StatusBadge } from './components';

export const dynamic = 'force-dynamic';

function priorityTone(priority: LeadEnginePriority): 'neutral' | 'good' | 'warning' | 'danger' {
  switch (priority) {
    case 'high': return 'good';
    case 'medium': return 'warning';
    case 'skip': return 'danger';
    default: return 'neutral';
  }
}

function runTone(status: LeadEngineRunStatus): 'neutral' | 'good' | 'warning' | 'danger' {
  switch (status) {
    case 'completed': return 'good';
    case 'failed':
    case 'cancelled': return 'danger';
    case 'queued':
    case 'running':
    case 'paused':
    case 'completed_with_errors': return 'warning';
    default: return 'neutral';
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

export default async function AdminLeadEnginePage() {
  const data = await getLeadEngineOverviewData();

  return (
    <div className="grid gap-6">
      <LeadEngineHeader
        eyebrow="Outbound growth"
        title="Lead Engine"
        description="Find, validate, score, draft, approve, and convert outbound prospects without mixing cold outreach into the existing CRM until a prospect is qualified."
        icon={Search}
      />

      <LeadEngineTabs active="overview" />

      <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <h2 className="text-base font-semibold tracking-[-0.01em] text-zinc-950">Local campaign dry-run</h2>
            <p className="mt-1 max-w-3xl text-sm leading-6 text-zinc-500">Run a safe local test that discovers ICP-fit companies, scores them, and prepares LinkedIn manual outreach drafts. Nothing is sent automatically.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <form action={runLeadEngineDryRunAction}>
              <button type="submit" className="inline-flex h-9 items-center gap-2 rounded-lg bg-zinc-950 px-3 text-sm font-medium text-white hover:bg-zinc-800">
                <PlayCircle className="size-4" />Run dry-run
              </button>
            </form>
            <form action={resetLeadEngineSandboxAction}>
              <button type="submit" className="inline-flex h-9 items-center rounded-lg border border-zinc-200 px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
                Reset sandbox
              </button>
            </form>
          </div>
        </div>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Prospects discovered" value={data.stats.totalProspectsDiscovered} hint="Companies found through imports, websites, search, directories, and public signals" icon={Search} />
        <StatCard label="Validated prospects" value={data.stats.validatedProspects} hint={`${data.stats.outreachReadyProspects} outreach-ready prospects`} icon={CheckCircle2} />
        <StatCard label="Drafts pending" value={data.stats.draftsPendingApproval} hint="Manual approval required before sending" icon={Mail} />
        <StatCard label="Active runs" value={data.stats.activeRuns} hint={data.workerHealth.label} icon={PlayCircle} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ['Contacted', data.stats.contactedProspects],
          ['Replies', data.stats.replies],
          ['Meetings booked', data.stats.meetingsBooked],
          ['Converted to CRM', data.stats.convertedToCrm],
          ['Disqualified', data.stats.disqualifiedProspects],
        ].map(([label, value]) => (
          <div key={label} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase text-zinc-500">{label}</p>
            <p className="mt-3 text-2xl font-semibold tracking-[-0.03em]">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(360px,0.8fr)]">
        <Section title="Recent high-score prospects" description="Validated companies and people sorted by priority.">
          {data.recentHighScoreProspects.length === 0 ? (
            <EmptyState>No lead engine data yet. Create a campaign to start discovering and validating outbound prospects.</EmptyState>
          ) : (
            <div className="grid gap-3">
              {data.recentHighScoreProspects.map((prospect) => (
                <div key={prospect.id} className="rounded-lg border border-zinc-200 p-4">
                  <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-medium text-zinc-950">{prospect.companyName}</p>
                        <StatusBadge tone={priorityTone(prospect.priority)}>{prospect.priority}</StatusBadge>
                      </div>
                      <p className="mt-1 text-sm text-zinc-500">{prospect.niche ?? 'Unclassified'} · {prospect.location ?? 'Unknown location'}</p>
                      <p className="mt-2 text-sm text-zinc-600">{prospect.decisionMaker ?? 'No decision-maker found yet'}</p>
                    </div>
                    <div className="text-right text-sm">
                      <p className="font-semibold text-zinc-950">{prospect.score ?? '-'} / 20</p>
                      <p className="mt-1 text-zinc-500">{prospect.status}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Worker health" description="Discovery and enrichment jobs run outside the Next.js request lifecycle.">
          <div className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-medium text-zinc-950">
                <Clock3 className="size-4 text-zinc-500" />
                Lead Engine Worker
              </div>
              <StatusBadge tone="warning">{data.workerHealth.label}</StatusBadge>
            </div>
            <p className="text-sm leading-6 text-zinc-500">{data.workerHealth.message}</p>
          </div>
        </Section>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Section title="Drafts pending approval" description="Generated outreach stays in draft until an admin approves it.">
          {data.pendingDrafts.length === 0 ? (
            <EmptyState>No outreach drafts yet. Generate drafts from approved prospects before sending anything.</EmptyState>
          ) : (
            <div className="grid gap-3">
              {data.pendingDrafts.map((message) => (
                <div key={message.id} className="rounded-lg border border-zinc-200 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-zinc-950">{message.companyName}</p>
                      <p className="mt-1 line-clamp-2 text-sm text-zinc-500">{message.subject ?? 'No subject yet'}</p>
                    </div>
                    <StatusBadge>{message.status}</StatusBadge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Latest worker runs" description="Dry runs and production jobs will appear here.">
          {data.latestRuns.length === 0 ? (
            <EmptyState>No worker runs yet. Dry runs will appear here before production enrichment or outreach jobs.</EmptyState>
          ) : (
            <div className="grid gap-3">
              {data.latestRuns.map((run) => (
                <div key={run.id} className="rounded-lg border border-zinc-200 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-zinc-950">{run.runType}</p>
                      <p className="mt-1 text-sm text-zinc-500">{run.processedCount} processed · {formatDateTime(run.startedAt)}</p>
                    </div>
                    <StatusBadge tone={runTone(run.status)}>{run.status}</StatusBadge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Errors needing attention" description="Blocked, expired, or failed runs that need review.">
          {data.errorsNeedingAttention.length === 0 ? (
            <EmptyState>No lead engine errors to review.</EmptyState>
          ) : (
            <div className="grid gap-3">
              {data.errorsNeedingAttention.map((run) => (
                <div key={run.id} className="rounded-lg border border-rose-200 bg-rose-50 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="font-medium text-rose-950">{run.runType}</p>
                      <p className="mt-1 text-sm text-rose-700">{run.errorMessage ?? `${run.errorCount} errors · ${run.blockedCount} blocked`}</p>
                    </div>
                    <StatusBadge tone="danger">{run.status}</StatusBadge>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      <Section title="Top campaign performance" description="Campaign-level performance will fill in as prospects, drafts, replies, and bookings accrue.">
        {data.campaignPerformance.length === 0 ? (
          <EmptyState>No campaign performance yet.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-sm">
              <thead className="border-b border-zinc-200 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="pb-3 font-medium">Campaign</th>
                  <th className="pb-3 font-medium">Validated</th>
                  <th className="pb-3 font-medium">Drafts</th>
                  <th className="pb-3 font-medium">Replies</th>
                  <th className="pb-3 font-medium">Meetings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {data.campaignPerformance.map((campaign) => (
                  <tr key={campaign.campaignName}>
                    <td className="py-3 pr-4 font-medium text-zinc-950">{campaign.campaignName}</td>
                    <td className="py-3 pr-4 text-zinc-600">{campaign.validatedProspects}</td>
                    <td className="py-3 pr-4 text-zinc-600">{campaign.draftsCreated}</td>
                    <td className="py-3 pr-4 text-zinc-600">{campaign.replies}</td>
                    <td className="py-3 pr-4 text-zinc-600">{campaign.meetingsBooked}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="grid gap-3 md:grid-cols-4">
          {[
            ['/admin/lead-engine/prospects', 'Prospects', 'Review companies, scores, signals, and decision-makers.', Users],
            ['/admin/lead-engine/campaigns', 'Campaigns', 'Prepare ICP, scoring, and outreach configuration.', Search],
            ['/admin/lead-engine/runs', 'Runs', 'Monitor discovery, enrichment, scoring, and worker checkpoints.', PlayCircle],
            ['/admin/lead-engine/outreach', 'Outreach', 'Approve drafts and track message status.', MessageSquare],
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

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-800 shadow-sm">
        <div className="flex gap-2">
          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
          <p>LinkedIn enrichment is intentionally optional. The reliable first engine validates companies through websites, public search, directories, review signals, manual imports, and search-discovered LinkedIn URLs.</p>
        </div>
      </div>
    </div>
  );
}