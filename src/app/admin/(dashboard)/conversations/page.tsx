import Link from 'next/link';
import { AlertTriangle, MessageSquare } from 'lucide-react';
import { adminBasePath } from '@/lib/admin/auth';
import { getAdminConversationsPageData, type AdminConversationSummary } from '@/lib/admin/dashboard';
import { updateConversationStatusAction } from '../../actions';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

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

function contactLabel(contact: AdminConversationSummary['contact']): string {
  if (!contact) return 'Unknown contact';
  const name = [contact.firstName, contact.lastName].filter(Boolean).join(' ');
  return name || contact.email || contact.company || 'Anonymous visitor';
}

function statusClass(status: string): string {
  switch (status) {
    case 'closed':
      return 'bg-zinc-100 text-zinc-600 ring-zinc-200';
    case 'escalated':
      return 'bg-rose-50 text-rose-700 ring-rose-200';
    default:
      return 'bg-white text-zinc-700 ring-zinc-200';
  }
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

export default async function AdminConversationsPage() {
  const { conversations } = await getAdminConversationsPageData();
  const base = await adminBasePath();

  return (
    <div className="grid gap-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-zinc-950 text-white">
            <MessageSquare className="size-5" />
          </div>
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.12em] text-zinc-500">Chat operations</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-zinc-950">Conversations</h1>
            <p className="mt-2 text-sm text-zinc-500">The latest 100 bot conversations, sorted by last message.</p>
          </div>
        </div>
      </div>

      <section className="grid gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        {conversations.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-zinc-500">No conversations yet.</div>
        ) : conversations.map((conversation) => (
          <div key={conversation.id} className="rounded-lg border border-zinc-200 p-4">
            <div className="flex flex-col justify-between gap-3 md:flex-row md:items-start">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Link href={`${base}/contacts/${conversation.contactId}`} className="font-medium text-zinc-950 hover:underline">
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
      </section>
    </div>
  );
}
