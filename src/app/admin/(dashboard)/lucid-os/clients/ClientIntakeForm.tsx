import { ClipboardPaste, Save } from 'lucide-react';
import { recordClientIntakeAction } from './actions';
import type { LucidClientSummary } from '@/lib/admin/lucid-os';

function datetimeLocalValue(value: string | null): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString().slice(0, 16);
}

export function ClientIntakeForm({ client, submitLabel = 'Save client intake' }: { client?: LucidClientSummary; submitLabel?: string }) {
  const firstNameFallback = client?.firstName ?? (client?.name ? client.name.split(' ')[0] : '');
  const lastNameFallback = client?.lastName ?? (client?.name && client.name.includes(' ') ? client.name.slice(client.name.indexOf(' ') + 1) : '');

  return (
    <form action={recordClientIntakeAction} className="grid gap-5">
      {client ? <input type="hidden" name="slug" value={client.slug} /> : null}
      <div className="grid gap-4 lg:grid-cols-[1fr_1fr_0.8fr_0.8fr]">
        <label className="grid gap-2 text-sm font-medium text-zinc-700">
          First name
          <input
            name="first_name"
            defaultValue={firstNameFallback}
            className="h-10 rounded-lg border border-zinc-200 px-3 text-sm font-normal text-zinc-950 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
            placeholder="Marie or Acme SAS"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-zinc-700">
          Last name
          <input
            name="last_name"
            defaultValue={lastNameFallback}
            className="h-10 rounded-lg border border-zinc-200 px-3 text-sm font-normal text-zinc-950 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
            placeholder="Dupont"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium text-zinc-700">
          Client status
          <select name="status" defaultValue={client?.status ?? 'lead'} className="h-10 rounded-lg border border-zinc-200 px-3 text-sm font-normal text-zinc-950 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100">
            <option value="lead">Lead</option>
            <option value="active">Active</option>
            <option value="paused">Paused</option>
            <option value="offboarded">Offboarded</option>
            <option value="archived">Archived</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium text-zinc-700">
          Intake stage
          <select name="intake_stage" defaultValue={client?.intake.stage ?? 'potential'} className="h-10 rounded-lg border border-zinc-200 px-3 text-sm font-normal text-zinc-950 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100">
            <option value="potential">Potential</option>
            <option value="meeting_booked">Meeting booked</option>
            <option value="meeting_done">Meeting done</option>
            <option value="proposal_sent">Proposal sent</option>
            <option value="won">Won</option>
            <option value="lost">Lost</option>
          </select>
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="grid gap-2 text-sm font-medium text-zinc-700">
          Email
          <input name="primary_contact_email" defaultValue={client?.primaryContactEmail ?? ''} type="email" className="h-10 rounded-lg border border-zinc-200 px-3 text-sm font-normal text-zinc-950 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100" placeholder="marie@acme.fr" />
        </label>
        <label className="grid gap-2 text-sm font-medium text-zinc-700">
          Phone
          <input name="primary_contact_phone" defaultValue={client?.primaryContactPhone ?? ''} className="h-10 rounded-lg border border-zinc-200 px-3 text-sm font-normal text-zinc-950 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100" placeholder="+33 6..." />
        </label>
        <label className="grid gap-2 text-sm font-medium text-zinc-700">
          Source
          <input name="source" defaultValue={client?.intake.source ?? ''} className="h-10 rounded-lg border border-zinc-200 px-3 text-sm font-normal text-zinc-950 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100" placeholder="LinkedIn, referral, website" />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-zinc-700">
          Website
          <input name="website_url" defaultValue={client?.websiteUrl ?? ''} className="h-10 rounded-lg border border-zinc-200 px-3 text-sm font-normal text-zinc-950 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100" placeholder="acme.fr" />
        </label>
        <label className="grid gap-2 text-sm font-medium text-zinc-700">
          Industry
          <input name="industry" defaultValue={client?.industry ?? ''} className="h-10 rounded-lg border border-zinc-200 px-3 text-sm font-normal text-zinc-950 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100" placeholder="Real estate, B2B services..." />
        </label>
      </div>

      <label className="grid gap-2 text-sm font-medium text-zinc-700">
        Tools they use
        <input
          name="tools_input"
          defaultValue={client?.tools?.join(', ') ?? ''}
          className="h-10 rounded-lg border border-zinc-200 px-3 text-sm font-normal text-zinc-950 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
          placeholder="Notion, Calendly, HubSpot, Stripe, Shopify..."
        />
        <span className="text-xs text-zinc-500">Comma-separated. Used to identify integration opportunities.</span>
      </label>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="grid gap-2 text-sm font-medium text-zinc-700">
          Meeting status
          <select name="meeting_status" defaultValue={client?.intake.meetingStatus ?? 'not_booked'} className="h-10 rounded-lg border border-zinc-200 px-3 text-sm font-normal text-zinc-950 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100">
            <option value="not_booked">Not booked</option>
            <option value="booked">Booked</option>
            <option value="done">Done</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium text-zinc-700">
          Booked for
          <input name="meeting_booked_at" defaultValue={datetimeLocalValue(client?.intake.meetingBookedAt ?? null)} type="datetime-local" className="h-10 rounded-lg border border-zinc-200 px-3 text-sm font-normal text-zinc-950 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100" />
        </label>
        <label className="grid gap-2 text-sm font-medium text-zinc-700">
          Done on
          <input name="meeting_done_at" defaultValue={datetimeLocalValue(client?.intake.meetingDoneAt ?? null)} type="datetime-local" className="h-10 rounded-lg border border-zinc-200 px-3 text-sm font-normal text-zinc-950 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100" />
        </label>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-zinc-700">
          What the client wants
          <textarea name="desired_outcome" defaultValue={client?.intake.desiredOutcome ?? ''} rows={4} className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-normal leading-6 text-zinc-950 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100" placeholder="Lead gen system, AI support agent, dashboard, website rebuild..." />
        </label>
        <label className="grid gap-2 text-sm font-medium text-zinc-700">
          Meeting notes
          <textarea name="meeting_notes" defaultValue={client?.intake.meetingNotes ?? ''} rows={4} className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-normal leading-6 text-zinc-950 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100" placeholder="Pain points, objections, existing tools, decision makers..." />
        </label>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <label className="grid gap-2 text-sm font-medium text-zinc-700">
          Budget
          <input name="budget_range" defaultValue={client?.intake.budgetRange ?? ''} className="h-10 rounded-lg border border-zinc-200 px-3 text-sm font-normal text-zinc-950 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100" placeholder="2k setup + 500/mo" />
        </label>
        <label className="grid gap-2 text-sm font-medium text-zinc-700">
          Timeline
          <input name="timeline" defaultValue={client?.intake.timeline ?? ''} className="h-10 rounded-lg border border-zinc-200 px-3 text-sm font-normal text-zinc-950 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100" placeholder="ASAP, Q2, after proposal" />
        </label>
        <label className="grid gap-2 text-sm font-medium text-zinc-700">
          Next step
          <input name="next_step" defaultValue={client?.nextAction ?? client?.intake.nextStep ?? ''} className="h-10 rounded-lg border border-zinc-200 px-3 text-sm font-normal text-zinc-950 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100" placeholder="Send offer, book audit, wait for docs" />
        </label>
      </div>

      <label className="grid gap-2 text-sm font-medium text-zinc-700">
        Import notes doc
        <textarea name="raw_context" rows={7} className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-normal leading-6 text-zinc-950 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100" placeholder="Paste call notes, LinkedIn context, email thread, website notes, or anything you already have about this person/company." />
      </label>

      <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
        <input name="index_as_knowledge" type="checkbox" defaultChecked className="size-4 rounded border-zinc-300 text-zinc-950" />
        <ClipboardPaste className="size-4 text-zinc-500" />
        Analyze and index pasted notes for agents
      </label>

      <div className="flex justify-end">
        <button type="submit" className="inline-flex h-10 items-center gap-2 rounded-lg bg-zinc-950 px-4 text-sm font-medium text-white transition hover:bg-zinc-800">
          <Save className="size-4" />
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
