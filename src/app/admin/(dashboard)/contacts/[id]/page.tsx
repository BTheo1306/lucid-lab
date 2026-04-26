import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, Bot, CalendarClock, Check, Mail, MessageSquare, User } from 'lucide-react';
import { getAdminContactDetail, type AdminConversationSummary, type AdminLeadSummary } from '@/lib/admin/dashboard';
import { updateConversationStatusAction, updateLeadNotesAction, updateLeadStatusAction } from '../../../actions';
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
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}

function contactName(contact: { firstName: string | null; lastName: string | null; email: string | null; company: string | null }): string {
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

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-200 px-4 py-4 sm:px-5">
        <h2 className="text-base font-semibold tracking-[-0.01em]">{title}</h2>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

function LeadCard({ lead }: { lead: AdminLeadSummary }) {
  return (
    <div className="rounded-lg border border-zinc-200 p-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <span className={cn('inline-flex rounded-full px-2 py-1 text-xs font-medium ring-1', statusClass(lead.status))}>
            {leadStatusLabels[lead.status]}
          </span>
          <p className="mt-3 text-sm leading-6 text-zinc-700">{lead.projectBrief || 'No project brief captured.'}</p>
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-zinc-500">
            <span className="rounded-full bg-zinc-100 px-2 py-1">Created {formatDateTime(lead.createdAt)}</span>
            {lead.urgency ? <span className="rounded-full bg-zinc-100 px-2 py-1">{lead.urgency}</span> : null}
            {lead.budgetRange ? <span className="rounded-full bg-zinc-100 px-2 py-1">{lead.budgetRange}</span> : null}
            {lead.marketingConsent ? <span className="rounded-full bg-emerald-50 px-2 py-1 text-emerald-700">Marketing consent</span> : null}
          </div>
        </div>
        <form action={updateLeadStatusAction} className="flex shrink-0 items-center gap-2">
          <input type="hidden" name="lead_id" value={lead.id} />
          <input type="hidden" name="contact_id" value={lead.contactId} />
          <select
            name="status"
            defaultValue={lead.status}
            aria-label="Lead status"
            className="h-9 rounded-lg border border-zinc-200 bg-white px-2 text-sm font-medium outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
          >
            {Object.entries(leadStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <button type="submit" className="inline-flex h-9 items-center gap-1 rounded-lg bg-zinc-950 px-3 text-sm font-semibold text-white hover:bg-zinc-800">
            <Check className="size-4" /> Save
          </button>
        </form>
      </div>

      <form action={updateLeadNotesAction} className="mt-4 grid gap-2">
        <input type="hidden" name="lead_id" value={lead.id} />
        <input type="hidden" name="contact_id" value={lead.contactId} />
        <label htmlFor={`notes-${lead.id}`} className="text-sm font-medium text-zinc-700">Internal notes</label>
        <textarea
          id={`notes-${lead.id}`}
          name="notes"
          defaultValue={lead.notes ?? ''}
          rows={4}
          className="w-full rounded-lg border border-zinc-200 bg-white p-3 text-sm outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
          placeholder="Add qualification notes, next step, objections, or follow-up context."
        />
        <button type="submit" className="justify-self-start rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50">
          Save notes
        </button>
      </form>
    </div>
  );
}

function ConversationCard({ conversation }: { conversation: AdminConversationSummary }) {
  return (
    <div className="rounded-lg border border-zinc-200 p-4">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <MessageSquare className="size-4 text-zinc-500" />
            <span className={cn('inline-flex rounded-full px-2 py-1 text-xs font-medium ring-1', statusClass(conversation.status))}>
              {conversationStatusLabels[conversation.status]}
            </span>
          </div>
          <p className="mt-2 text-sm text-zinc-500">Started {formatDateTime(conversation.startedAt)} - Last message {formatDateTime(conversation.lastMessageAt)}</p>
          {conversation.escalationReason ? <p className="mt-2 text-sm text-rose-700">{conversation.escalationReason}</p> : null}
        </div>
        <form action={updateConversationStatusAction} className="flex shrink-0 items-center gap-2">
          <input type="hidden" name="conversation_id" value={conversation.id} />
          <input type="hidden" name="contact_id" value={conversation.contactId} />
          <select
            name="status"
            defaultValue={conversation.status}
            aria-label="Conversation status"
            className="h-9 rounded-lg border border-zinc-200 bg-white px-2 text-sm font-medium outline-none focus:border-zinc-400 focus:ring-4 focus:ring-zinc-100"
          >
            {Object.entries(conversationStatusLabels).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          <button type="submit" className="inline-flex h-9 items-center gap-1 rounded-lg bg-zinc-950 px-3 text-sm font-semibold text-white hover:bg-zinc-800">
            <Check className="size-4" /> Save
          </button>
        </form>
      </div>

      <div className="mt-5 grid gap-3">
        {(conversation.messages ?? []).length === 0 ? (
          <div className="rounded-lg border border-dashed border-zinc-200 px-4 py-8 text-center text-sm text-zinc-500">No messages in this conversation.</div>
        ) : conversation.messages?.map((message) => {
          const outbound = message.direction === 'outbound_bot';
          return (
            <div key={message.id} className={cn('flex', outbound ? 'justify-start' : 'justify-end')}>
              <div className={cn('max-w-[760px] rounded-xl px-4 py-3 text-sm leading-6', outbound ? 'bg-zinc-100 text-zinc-800' : 'bg-zinc-950 text-white')}>
                <div className="mb-1 flex items-center gap-2 text-xs opacity-70">
                  {outbound ? <Bot className="size-3" /> : <User className="size-3" />}
                  {outbound ? 'Lucid' : 'Visitor'} - {formatDateTime(message.createdAt)}
                  {message.tokens ? ` - ${message.tokens} tokens` : ''}
                </div>
                <p className="whitespace-pre-wrap break-words">{message.text}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default async function AdminContactPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const detail = await getAdminContactDetail(id);

  if (!detail) notFound();

  const { contact } = detail;

  return (
    <div className="grid gap-6">
      <Link href="/admin" className="inline-flex w-fit items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-950">
        <ArrowLeft className="size-4" /> Back to dashboard
      </Link>

      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.12em] text-zinc-500">Contact</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-zinc-950 md:text-4xl">{contactName(contact)}</h1>
            <div className="mt-3 flex flex-wrap gap-2 text-sm text-zinc-500">
              {contact.email ? <span className="inline-flex items-center gap-1 rounded-full bg-zinc-100 px-3 py-1"><Mail className="size-3" />{contact.email}</span> : null}
              {contact.company ? <span className="rounded-full bg-zinc-100 px-3 py-1">{contact.company}</span> : null}
              <span className="rounded-full bg-zinc-100 px-3 py-1">{contact.source}</span>
              <span className="rounded-full bg-zinc-100 px-3 py-1">{contact.language}</span>
            </div>
          </div>
          <div className="rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-600">
            Created {formatDateTime(contact.createdAt)}
          </div>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div className="grid content-start gap-6">
          <Panel title="Lead records">
            {detail.leads.length === 0 ? (
              <div className="rounded-lg border border-dashed border-zinc-200 px-4 py-8 text-center text-sm text-zinc-500">No lead record for this contact.</div>
            ) : (
              <div className="grid gap-4">
                {detail.leads.map((lead) => <LeadCard key={lead.id} lead={lead} />)}
              </div>
            )}
          </Panel>

          <Panel title="Bookings">
            {detail.bookings.length === 0 ? (
              <div className="rounded-lg border border-dashed border-zinc-200 px-4 py-8 text-center text-sm text-zinc-500">No bookings for this contact.</div>
            ) : (
              <div className="grid gap-3">
                {detail.bookings.map((booking) => (
                  <div key={booking.id} className="rounded-lg border border-zinc-200 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{booking.name}</p>
                        <p className="mt-1 text-sm text-zinc-500">{booking.email}</p>
                      </div>
                      <span className={cn('inline-flex rounded-full px-2 py-1 text-xs font-medium ring-1', statusClass(booking.status))}>{booking.status}</span>
                    </div>
                    <div className="mt-3 flex items-center gap-2 text-sm text-zinc-600">
                      <CalendarClock className="size-4" />
                      {formatDateTime(booking.startsAt)} - {booking.timezone}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Panel>
        </div>

        <Panel title="Conversation transcripts">
          {detail.conversations.length === 0 ? (
            <div className="rounded-lg border border-dashed border-zinc-200 px-4 py-10 text-center text-sm text-zinc-500">No conversations for this contact.</div>
          ) : (
            <div className="grid gap-5">
              {detail.conversations.map((conversation) => <ConversationCard key={conversation.id} conversation={conversation} />)}
            </div>
          )}
        </Panel>
      </div>
    </div>
  );
}