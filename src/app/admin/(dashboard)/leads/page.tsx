import Link from 'next/link';
import { Mail, Users } from 'lucide-react';
import { getAdminLeadsPageData, type AdminLeadSummary } from '@/lib/admin/dashboard';
import { updateLeadStatusAction } from '../../actions';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const leadStatusLabels: Record<string, string> = {
  new: 'New',
  contacted: 'Contacted',
  qualified: 'Qualified',
  converted: 'Converted',
  lost: 'Lost',
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
      return 'bg-zinc-100 text-zinc-600 ring-zinc-200';
    default:
      return 'bg-white text-zinc-700 ring-zinc-200';
  }
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

export default async function AdminLeadsPage() {
  const { leads } = await getAdminLeadsPageData();

  return (
    <div className="grid gap-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex items-start gap-3">
          <div className="flex size-10 items-center justify-center rounded-lg bg-zinc-950 text-white">
            <Users className="size-5" />
          </div>
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.12em] text-zinc-500">Lead pipeline</p>
            <h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-zinc-950">Leads</h1>
            <p className="mt-2 text-sm text-zinc-500">The latest 100 prospects captured by Lucid.</p>
          </div>
        </div>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white shadow-sm">
        {leads.length === 0 ? (
          <div className="px-4 py-12 text-center text-sm text-zinc-500">No leads captured yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="border-b border-zinc-200 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Contact</th>
                  <th className="px-4 py-3 font-medium">Brief</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Captured</th>
                  <th className="px-4 py-3 font-medium">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {leads.map((lead) => (
                  <tr key={lead.id} className="align-top">
                    <td className="px-4 py-4">
                      <Link href={`/admin/contacts/${lead.contactId}`} className="font-medium text-zinc-950 hover:underline">
                        {contactLabel(lead.contact)}
                      </Link>
                      <div className="mt-1 grid gap-1 text-xs text-zinc-500">
                        {lead.contact?.email ? <span className="inline-flex items-center gap-1"><Mail className="size-3" />{lead.contact.email}</span> : null}
                        {lead.contact?.company ? <span>{lead.contact.company}</span> : null}
                      </div>
                    </td>
                    <td className="max-w-md px-4 py-4 text-zinc-600">
                      <p className="line-clamp-3">{lead.projectBrief || 'No project brief yet.'}</p>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {lead.urgency ? <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">{lead.urgency}</span> : null}
                        {lead.budgetRange ? <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600">{lead.budgetRange}</span> : null}
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={cn('inline-flex rounded-full px-2 py-1 text-xs font-medium ring-1', statusClass(lead.status))}>
                        {leadStatusLabels[lead.status]}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-zinc-500">{formatDateTime(lead.createdAt)}</td>
                    <td className="px-4 py-4"><LeadStatusForm lead={lead} /></td>
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
