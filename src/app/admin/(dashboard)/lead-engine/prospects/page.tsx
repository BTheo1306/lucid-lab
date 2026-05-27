import { Building2, CheckCircle2, Mail, Search, UserCheck } from 'lucide-react';
import { getLeadEngineProspectsPageData, type LeadEnginePriority, type LeadEngineProspectStatus } from '@/lib/admin/lead-engine';
import { EmptyState, LeadEngineHeader, LeadEngineTabs, Section, StatusBadge } from '../components';

export const dynamic = 'force-dynamic';

function priorityTone(priority: LeadEnginePriority): 'neutral' | 'good' | 'warning' | 'danger' {
  switch (priority) {
    case 'high': return 'good';
    case 'medium': return 'warning';
    case 'skip': return 'danger';
    default: return 'neutral';
  }
}

function statusTone(status: LeadEngineProspectStatus): 'neutral' | 'good' | 'warning' | 'danger' {
  switch (status) {
    case 'validated':
    case 'approved':
    case 'converted':
      return 'good';
    case 'contacted':
    case 'replied':
    case 'meeting_booked':
      return 'warning';
    case 'disqualified':
    case 'do_not_contact':
      return 'danger';
    default:
      return 'neutral';
  }
}

function formatDateTime(value: string | null): string {
  if (!value) return 'Not touched';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export default async function LeadEngineProspectsPage() {
  const { prospects } = await getLeadEngineProspectsPageData();

  return (
    <div className="grid gap-6">
      <LeadEngineHeader
        eyebrow="Lead Engine"
        title="Prospects"
        description="Company-level outbound prospects stay separate from CRM leads until they are validated, approved, or converted."
        icon={Search}
      />

      <LeadEngineTabs active="prospects" />

      <Section title="Filters" description="Campaign, status, priority, score, niche, geography, decision-maker, email, review needs, and disqualification filters will live here.">
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-4">
          {[
            ['Campaign', 'All campaigns', Building2],
            ['Priority', 'All priorities', CheckCircle2],
            ['Decision-maker', 'Any status', UserCheck],
            ['Email', 'Any contact path', Mail],
          ].map(([label, value, Icon]) => (
            <div key={String(label)} className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
              <div className="flex items-center gap-2 text-xs font-medium uppercase text-zinc-500">
                <Icon className="size-3.5" />
                {String(label)}
              </div>
              <p className="mt-2 text-sm font-medium text-zinc-700">{String(value)}</p>
            </div>
          ))}
        </div>
      </Section>

      <section className="rounded-xl border border-zinc-200 bg-white shadow-sm">
        {prospects.length === 0 ? (
          <div className="p-4 sm:p-5">
            <EmptyState>No prospects found yet. Run a discovery job or import a list to start scoring companies.</EmptyState>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] text-left text-sm">
              <thead className="border-b border-zinc-200 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Company</th>
                  <th className="px-4 py-3 font-medium">Niche</th>
                  <th className="px-4 py-3 font-medium">Location</th>
                  <th className="px-4 py-3 font-medium">Size</th>
                  <th className="px-4 py-3 font-medium">Score</th>
                  <th className="px-4 py-3 font-medium">Top signals</th>
                  <th className="px-4 py-3 font-medium">Decision-maker</th>
                  <th className="px-4 py-3 font-medium">Contact path</th>
                  <th className="px-4 py-3 font-medium">Last touch</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {prospects.map((prospect) => (
                  <tr key={prospect.id} className="align-top">
                    <td className="px-4 py-4 font-medium text-zinc-950">
                      <div>{prospect.companyName}</div>
                      <div className="mt-1 flex flex-wrap gap-2 text-xs font-normal">
                        {prospect.websiteUrl ? <a href={prospect.websiteUrl} target="_blank" rel="noreferrer" className="text-zinc-500 underline-offset-2 hover:underline">Website</a> : null}
                        {prospect.linkedinUrl ? <a href={prospect.linkedinUrl} target="_blank" rel="noreferrer" className="text-zinc-500 underline-offset-2 hover:underline">LinkedIn search</a> : null}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-zinc-600">{prospect.niche ?? 'Unclassified'}</td>
                    <td className="px-4 py-4 text-zinc-600">{prospect.location ?? 'Unknown'}</td>
                    <td className="px-4 py-4 text-zinc-600">{prospect.employeeCount ?? 'Unknown'}</td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-zinc-950">{prospect.score ?? '-'}</span>
                        <StatusBadge tone={priorityTone(prospect.priority)}>{prospect.priority}</StatusBadge>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      {prospect.topSignals.length === 0 ? (
                        <span className="text-zinc-400">No signals</span>
                      ) : (
                        <div className="flex max-w-xs flex-wrap gap-1">
                          {prospect.topSignals.map((signal) => (
                            <span key={signal} className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">{signal}</span>
                          ))}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-4 text-zinc-600">
                      <div>{prospect.decisionMaker ?? 'Not found'}</div>
                      {prospect.decisionMakerEmail ? <div className="mt-1 text-xs text-zinc-500">{prospect.decisionMakerEmail}</div> : null}
                    </td>
                    <td className="px-4 py-4 text-zinc-600">
                      {prospect.decisionMakerEmail ? (
                        <a href={`mailto:${prospect.decisionMakerEmail}`} className="underline-offset-2 hover:underline">{prospect.decisionMakerEmail}</a>
                      ) : prospect.emailStatus ?? 'manual research'}
                    </td>
                    <td className="px-4 py-4 text-zinc-500">{formatDateTime(prospect.lastTouchAt)}</td>
                    <td className="px-4 py-4"><StatusBadge tone={statusTone(prospect.status)}>{prospect.status}</StatusBadge></td>
                    <td className="px-4 py-4 text-zinc-500">Review draft</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}