import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  Bot,
  CalendarClock,
  Clock3,
  Euro,
  Mail,
  MessageSquare,
  Users,
} from 'lucide-react';
import { getAdminDashboardData, type AdminLeadSummary, type AdminConversationSummary } from '@/lib/admin/dashboard';
import { updateLeadStatusAction, updateConversationStatusAction } from '../actions';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const leadStatusLabels: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  converted: 'Converted',
  lost: 'Lost',
};

const conversationStatusLabels: Record<string, string> = {
  active: 'Active',
  escalated: 'Escalated',
  closed: 'Closed',
};

function formatDateTime(value: string | null): string {
  if (!value) return 'Not set';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function formatDate(value: string): string {
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
  }).format(new Date(value));
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 2,
  }).format(value);
}

function contactLabel(contact: AdminLeadSummary['contact']): string {
  if (!contact) return 'Unknown contact';
  const name = [contact.firstName, contact.lastName].filter(Boolean).join(' ');
  return name || contact.email || contact.company || 'Anonymous visitor';
}

function statusClass(status: string): string {
  switch (status) {
    case 'converted':
      return 'bg-emerald-50 text-emerald-700 ring-emerald-200';
    case 'qualified':
      return 'bg-sky-50 text-sky-700 ring-sky-200';
    case 'contacted':
      return 'bg-amber-50 text-amber-700 ring-amber-200';
    case 'lost':
    case 'closed':
      return 'bg-zinc-100 text-zinc-600 ring-zinc-200';
    case 'escalated':
      return 'bg-rose-50 text-rose-700 ring-rose-200';
    default:
      return 'bg-white text-zinc-700 ring-zinc-200';
  }
}

function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  hint: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase text-zinc-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-zinc-950">{value}</p>
        </div>
        <div className="flex size-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600">
          <Icon className="size-4" />
        </div>
      </div>
      <p className="mt-3 text-sm text-zinc-500">{hint}</p>
    </div>
  );
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-200 px-4 py-4 sm:px-5">
        <h2 className="text-base font-semibold tracking-[-0.01em]">{title}</h2>
        <p className="mt-1 text-sm text-zinc-500">{description}</p>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

function LeadStatusForm({ lead }: { lead: AdminLeadSummary }) {
  return (
    <form action={updateLeadStatusAction} className="flex items-center gap-2">
      <input type="hidden" name="lead_id" value={lead.id} />
      <input type="hidden" name="contact_id" value={lead.contactId} />
      <select
        name="status"
        defaultValue={lead.status}
        aria-label="Lead status"
        className="h-8 rounded-lg border border-zinc-200 bg-white px-2 text-xs font-medium outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
      >
        {Object.entries(leadStatusLabels).map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
      <button type="submit" className="h-8 rounded-lg bg-zinc-950 px-2.5 text-xs font-semibold text-white hover:bg-zinc-800">
        Save
      </button>
    </form>
  );
}

function ConversationStatusForm({ conversation }: { conversation: AdminConversationSummary }) {
  return (
    <form action={updateConversationStatusAction} className="flex items-center gap-2">
      <input type="hidden" name="conversation_id" value={conversation.id} />
      <input type="hidden" name="contact_id" value={conversation.contactId} />
      <select
        name="status"
        defaultValue={conversation.status}
        aria-label="Conversation status"
        className="h-8 rounded-lg border border-zinc-200 bg-white px-2 text-xs font-medium outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
      >
        {Object.entries(conversationStatusLabels).map(([value, label]) => (
          <option key={value} value={value}>{label}</option>
        ))}
      </select>
      <button type="submit" className="h-8 rounded-lg bg-zinc-950 px-2.5 text-xs font-semibold text-white hover:bg-zinc-800">
        Save
      </button>
    </form>
  );
}

function EmptyState({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-zinc-200 px-4 py-10 text-center text-sm text-zinc-500">
      {children}
    </div>
  );
}

export default async function AdminDashboardPage() {
  const data = await getAdminDashboardData();
  const maxSpend = Math.max(...data.budgetHistory.map((day) => day.spentEur), 0.001);
  const MAX_BAR_PX = 90;

  return (
    <div className="grid gap-6">
      <div className="flex flex-col justify-between gap-4 rounded-xl border border-zinc-200 bg-white p-5 shadow-sm md:flex-row md:items-end">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.12em] text-zinc-500">Operations center</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-zinc-950 md:text-4xl">
            Leads and conversations from Lucid.
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-500">
            Track qualified prospects, active chats, escalations, bookings, AI spend and admin activity from the chat bot.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-600">
          <Clock3 className="size-4" />
          Fresh on every request
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Total leads" value={data.stats.leadsTotal} hint={`${data.stats.leadsNew} new, ${data.stats.leadsQualified} qualified`} icon={Users} />
        <StatCard label="Active chats" value={data.stats.activeConversations} hint={`${data.stats.escalatedConversations} escalated conversations`} icon={MessageSquare} />
        <StatCard label="Upcoming calls" value={data.stats.upcomingBookings} hint="Confirmed TidyCal bookings" icon={CalendarClock} />
        <StatCard label="AI today" value={formatCurrency(data.stats.todayAiSpendEur)} hint={`${data.stats.todayAiRequests} requests recorded`} icon={Euro} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {[
          ['New', data.stats.leadsNew, 'new'],
          ['Contacted', data.stats.leadsContacted, 'contacted'],
          ['Qualified', data.stats.leadsQualified, 'qualified'],
          ['Converted', data.stats.leadsConverted, 'converted'],
          ['Lost', data.stats.leadsLost, 'lost'],
        ].map(([label, value, status]) => (
          <div key={status} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <div className={cn('inline-flex rounded-full px-2 py-1 text-xs font-medium ring-1', statusClass(String(status)))}>{label}</div>
            <p className="mt-3 text-2xl font-semibold tracking-[-0.03em]">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.25fr)_minmax(360px,0.75fr)]">
        <Section title="Lead queue" description="Recent prospects captured by the bot.">
          {data.recentLeads.length === 0 ? (
            <EmptyState>No leads captured yet.</EmptyState>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="text-xs uppercase text-zinc-500">
                  <tr className="border-b border-zinc-200">
                    <th className="pb-3 font-medium">Contact</th>
                    <th className="pb-3 font-medium">Brief</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Captured</th>
                    <th className="pb-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {data.recentLeads.map((lead) => (
                    <tr key={lead.id} className="align-top">
                      <td className="py-4 pr-4">
                        <Link href={`/admin/contacts/${lead.contactId}`} className="font-medium text-zinc-950 hover:underline">
                          {contactLabel(lead.contact)}
                        </Link>
                        <div className="mt-1 flex flex-col gap-1 text-xs text-zinc-500">
                          {lead.contact?.email ? <span className="inline-flex items-center gap-1"><Mail className="size-3" />{lead.contact.email}</span> : null}
                          {lead.contact?.company ? <span>{lead.contact.company}</span> : null}
                        </div>
                      </td>
                      <td className="max-w-sm py-4 pr-4 text-zinc-600">
                        <p className="line-clamp-3">{lead.projectBrief || 'No project brief yet.'}</p>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {lead.urgency ? <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">{lead.urgency}</span> : null}
                          {lead.budgetRange ? <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">{lead.budgetRange}</span> : null}
                        </div>
                      </td>
                      <td className="py-4 pr-4">
                        <span className={cn('inline-flex rounded-full px-2 py-1 text-xs font-medium ring-1', statusClass(lead.status))}>
                          {leadStatusLabels[lead.status]}
                        </span>
                      </td>
                      <td className="py-4 pr-4 text-zinc-500">{formatDateTime(lead.createdAt)}</td>
                      <td className="py-4">
                        <LeadStatusForm lead={lead} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Section>

        <Section title="Upcoming calls" description="Confirmed discovery calls from TidyCal.">
          {data.upcomingBookings.length === 0 ? (
            <EmptyState>No upcoming bookings.</EmptyState>
          ) : (
            <div className="grid gap-3">
              {data.upcomingBookings.map((booking) => (
                <div key={booking.id} className="rounded-lg border border-zinc-200 p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium">{booking.name}</p>
                      <p className="mt-1 text-sm text-zinc-500">{booking.email}</p>
                    </div>
                    <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700 ring-1 ring-emerald-200">
                      {booking.status}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-sm text-zinc-600">
                    <CalendarClock className="size-4" />
                    {formatDateTime(booking.startsAt)} - {booking.timezone}
                  </div>
                  {booking.contactId ? (
                    <Link href={`/admin/contacts/${booking.contactId}`} className="mt-3 inline-flex items-center gap-1 text-sm font-medium text-zinc-950 hover:underline">
                      Open contact <ArrowRight className="size-3" />
                    </Link>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </Section>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Section title="Conversation queue" description="Latest bot conversations and escalations.">
          {data.recentConversations.length === 0 ? (
            <EmptyState>No conversations yet.</EmptyState>
          ) : (
            <div className="grid gap-3">
              {data.recentConversations.map((conversation) => (
                <div key={conversation.id} className="rounded-lg border border-zinc-200 p-3">
                  <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <Link href={`/admin/contacts/${conversation.contactId}`} className="font-medium text-zinc-950 hover:underline">
                          {contactLabel(conversation.contact)}
                        </Link>
                        <span className={cn('inline-flex rounded-full px-2 py-1 text-xs font-medium ring-1', statusClass(conversation.status))}>
                          {conversationStatusLabels[conversation.status]}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-zinc-500">Last message {formatDateTime(conversation.lastMessageAt)}</p>
                      {conversation.escalationReason ? (
                        <p className="mt-2 flex items-start gap-2 text-sm text-rose-700">
                          <AlertTriangle className="mt-0.5 size-4 shrink-0" />
                          {conversation.escalationReason}
                        </p>
                      ) : null}
                    </div>
                    <ConversationStatusForm conversation={conversation} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </Section>

        <Section title="Bot health" description="Spend, message volume and security events.">
          <div className="grid gap-5">
            <div>
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">Messages last 7 days</span>
                <span className="text-zinc-500">{data.stats.messagesLast7d}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span className="font-medium">New contacts last 24h</span>
                <span className="text-zinc-500">{data.stats.contactsLast24h}</span>
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between text-sm">
                <span className="font-medium">AI spend trend</span>
                <span className="text-zinc-500">14 days</span>
              </div>
              <div className="flex h-36 items-end gap-2 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
                {data.budgetHistory.length === 0 ? (
                  <div className="grid h-full w-full place-items-center text-sm text-zinc-500">No budget records yet.</div>
                ) : data.budgetHistory.map((day) => {
                  const barPx = Math.max((day.spentEur / maxSpend) * MAX_BAR_PX, day.spentEur > 0 ? 8 : 2);
                  return (
                    <div key={day.date} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                      <div
                        className="w-full rounded-t bg-zinc-950"
                        style={{ height: `${barPx}px` }}
                        title={`${formatDate(day.date)} - ${formatCurrency(day.spentEur)}`}
                      />
                      <span className="truncate text-[10px] text-zinc-500">{formatDate(day.date)}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                <Bot className="size-4" />
                Recent audit events
              </div>
              {data.auditEvents.length === 0 ? (
                <EmptyState>No audit events yet.</EmptyState>
              ) : (
                <div className="grid gap-2">
                  {data.auditEvents.map((event) => (
                    <div key={event.id} className="flex items-center justify-between gap-3 rounded-lg bg-zinc-50 px-3 py-2 text-sm">
                      <span className="font-medium text-zinc-700">{event.eventType}</span>
                      <span className="text-xs text-zinc-500">{formatDateTime(event.createdAt)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Section>
      </div>
    </div>
  );
}