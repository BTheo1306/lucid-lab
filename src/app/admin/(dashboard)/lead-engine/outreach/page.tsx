import { Mail, MessageSquare, Send } from 'lucide-react';
import { getLeadEngineOutreachPageData, type LeadEngineMessageStatus } from '@/lib/admin/lead-engine';
import { approveLeadEngineDraftAction, recordLeadEngineManualSendAction, runLeadEngineDryRunAction } from '../actions';
import { EmptyState, LeadEngineHeader, LeadEngineTabs, Section, StatusBadge } from '../components';

export const dynamic = 'force-dynamic';

const outreachViews: Array<{ status: LeadEngineMessageStatus; label: string }> = [
  { status: 'draft', label: 'Drafts' },
  { status: 'approved', label: 'Approved' },
  { status: 'scheduled', label: 'Scheduled' },
  { status: 'sent', label: 'Sent' },
  { status: 'replied', label: 'Replied' },
  { status: 'failed', label: 'Failed' },
  { status: 'unsubscribed', label: 'Suppressed' },
];

function statusTone(status: LeadEngineMessageStatus): 'neutral' | 'good' | 'warning' | 'danger' {
  switch (status) {
    case 'sent':
    case 'replied':
      return 'good';
    case 'approved':
    case 'scheduled':
      return 'warning';
    case 'failed':
    case 'bounced':
    case 'unsubscribed':
      return 'danger';
    default:
      return 'neutral';
  }
}

function formatDateTime(value: string): string {
  if (!value) return 'Unknown';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

export default async function LeadEngineOutreachPage() {
  const { messages, counts } = await getLeadEngineOutreachPageData();

  return (
    <div className="grid gap-6">
      <LeadEngineHeader
        eyebrow="Lead Engine"
        title="Outreach"
        description="Cold outreach uses a separate outbound provider wrapper, suppression checks, and manual approval before sending."
        icon={Send}
      />

      <LeadEngineTabs active="outreach" />

      <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div>
            <h2 className="text-base font-semibold tracking-[-0.01em] text-zinc-950">Safe outreach test</h2>
            <p className="mt-1 text-sm text-zinc-500">Generate drafts, approve them, then record manual LinkedIn sending only after human confirmation.</p>
          </div>
          <form action={runLeadEngineDryRunAction}>
            <button type="submit" className="inline-flex h-9 items-center gap-2 rounded-lg bg-zinc-950 px-3 text-sm font-medium text-white hover:bg-zinc-800">
              <Send className="size-4" />Generate drafts
            </button>
          </form>
        </div>
      </section>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-7">
        {outreachViews.map((view) => (
          <div key={view.status} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-medium uppercase text-zinc-500">{view.label}</p>
            <p className="mt-3 text-2xl font-semibold tracking-[-0.03em]">{counts[view.status]}</p>
          </div>
        ))}
      </div>

      <Section title="Message queue" description="Drafts, approvals, sends, replies, bounces, unsubscribes, and manual LinkedIn touches.">
        {messages.length === 0 ? (
          <EmptyState>No outreach drafts yet. Generate drafts from approved prospects before sending anything.</EmptyState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[960px] text-left text-sm">
              <thead className="border-b border-zinc-200 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="pb-3 font-medium">Company</th>
                  <th className="pb-3 font-medium">Person</th>
                  <th className="pb-3 font-medium">Status</th>
                  <th className="pb-3 font-medium">Channel</th>
                  <th className="pb-3 font-medium">Message</th>
                  <th className="pb-3 font-medium">Created</th>
                  <th className="pb-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {messages.map((message) => (
                  <tr key={message.id} className="align-top">
                    <td className="py-4 pr-4 font-medium text-zinc-950">{message.companyName}</td>
                    <td className="py-4 pr-4 text-zinc-600">
                      <div>{message.personName ?? 'No person'}</div>
                      {message.personTitle ? <div className="mt-1 text-xs text-zinc-400">{message.personTitle}</div> : null}
                      <div className="mt-2 flex flex-col gap-1 text-xs">
                        {message.personEmail ? <a href={`mailto:${message.personEmail}`} className="text-emerald-700 underline-offset-2 hover:underline">{message.personEmail}</a> : null}
                        {message.personPhone ? <span className="text-zinc-500">{message.personPhone}</span> : null}
                        {message.personLinkedinUrl ? <a href={message.personLinkedinUrl} target="_blank" rel="noreferrer" className="text-blue-700 underline-offset-2 hover:underline">Person LinkedIn</a> : null}
                      </div>
                    </td>
                    <td className="py-4 pr-4"><StatusBadge tone={statusTone(message.status)}>{message.status}</StatusBadge></td>
                    <td className="py-4 pr-4 text-zinc-600">{message.channel}</td>
                    <td className="max-w-lg py-4 pr-4 text-zinc-600">
                      <div className="font-medium text-zinc-800">{message.subject ?? 'No subject'}</div>
                      {message.bodyText ? <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-600">{message.bodyText}</p> : null}
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        {message.companyWebsite ? <a href={message.companyWebsite} target="_blank" rel="noreferrer" className="text-zinc-500 underline-offset-2 hover:underline">Website</a> : null}
                        {message.linkedinUrl ? <a href={message.linkedinUrl} target="_blank" rel="noreferrer" className="text-zinc-500 underline-offset-2 hover:underline">Company LinkedIn</a> : null}
                      </div>
                    </td>
                    <td className="py-4 pr-4 text-zinc-500">{formatDateTime(message.createdAt)}</td>
                    <td className="py-4 pr-4">
                      {message.status === 'draft' && message.source === 'sandbox' ? (
                        <form action={approveLeadEngineDraftAction}>
                          <input type="hidden" name="message_id" value={message.id} />
                          <button type="submit" className="rounded-lg bg-zinc-950 px-3 py-2 text-xs font-medium text-white hover:bg-zinc-800">Approve draft</button>
                        </form>
                      ) : null}
                      {message.status === 'approved' && message.source === 'sandbox' ? (
                        <form action={recordLeadEngineManualSendAction}>
                          <input type="hidden" name="message_id" value={message.id} />
                          <button type="submit" className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50">Record manual send</button>
                        </form>
                      ) : null}
                      {message.status === 'sent' ? <span className="text-xs text-zinc-500">Recorded</span> : null}
                      {message.source !== 'sandbox' ? <span className="text-xs text-zinc-400">Database row</span> : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
          <div className="flex items-start gap-2 text-sm leading-6 text-zinc-600">
            <Mail className="mt-0.5 size-4 shrink-0 text-zinc-500" />
            <p>Outbound sending will require an approved message, active campaign, valid email status, suppression check, and recent-contact duplicate check.</p>
          </div>
          <StatusBadge tone="warning"><MessageSquare className="mr-1 size-3" />Approval required</StatusBadge>
        </div>
      </div>
    </div>
  );
}