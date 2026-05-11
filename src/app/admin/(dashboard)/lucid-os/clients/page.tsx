import Link from 'next/link';
import { ArrowRight, Building2, CalendarCheck2, Globe2, Mail, Phone, Plus, Target, Users } from 'lucide-react';
import {
  listLucidClients,
  type LucidClientIntakeStage,
  type LucidClientMeetingStatus,
  type LucidClientStatus,
} from '@/lib/admin/lucid-os';
import { EmptyState, formatAdminDate, LucidOsHeader, LucidOsTabs, Section, StatCard, StatusBadge } from '../components';

export const dynamic = 'force-dynamic';

function clientTone(status: LucidClientStatus): 'neutral' | 'good' | 'warning' | 'danger' {
  switch (status) {
    case 'active': return 'good';
    case 'paused': return 'warning';
    case 'offboarded':
    case 'archived': return 'neutral';
    default: return 'warning';
  }
}

function intakeTone(stage: LucidClientIntakeStage): 'neutral' | 'good' | 'warning' | 'danger' {
  switch (stage) {
    case 'won': return 'good';
    case 'lost': return 'danger';
    case 'meeting_booked':
    case 'meeting_done':
    case 'proposal_sent': return 'warning';
    default: return 'neutral';
  }
}

function meetingTone(status: LucidClientMeetingStatus): 'neutral' | 'good' | 'warning' | 'danger' {
  switch (status) {
    case 'done': return 'good';
    case 'booked': return 'warning';
    case 'cancelled': return 'danger';
    default: return 'neutral';
  }
}

function fallbackValue(value: string | null | undefined): string {
  return value && value.trim().length > 0 ? value : '-';
}

export default async function LucidOsClientsPage() {
  const clients = await listLucidClients(100);
  const activeClients = clients.filter((client) => client.status === 'active').length;
  const leadClients = clients.filter((client) => client.status === 'lead').length;
  const meetingsInMotion = clients.filter((client) => client.intake.meetingStatus === 'booked' || client.intake.meetingStatus === 'done').length;

  return (
    <div className="grid gap-6">
      <LucidOsHeader
        eyebrow="Client workspace"
        title="Clients"
        description="Open client records, review all captured intake information, and add new prospects from one place."
        icon={Building2}
      />

      <LucidOsTabs active="clients" />

      <section className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-base font-semibold tracking-[-0.01em] text-zinc-950">Client records</h2>
          <p className="mt-1 text-sm text-zinc-500">Select a client to see contact details, meeting notes, commercial context, raw imported notes, projects, and websites.</p>
        </div>
        <Link href="/admin/lucid-os/clients/new" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 text-sm font-medium text-white transition hover:bg-zinc-800">
          <Plus className="size-4" />
          Add client
        </Link>
      </section>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Records" value={clients.length} hint="Total clients and prospects" icon={Users} />
        <StatCard label="Leads" value={leadClients} hint="Prospects to qualify" icon={Target} />
        <StatCard label="Active" value={activeClients} hint="Current accounts" icon={Building2} />
        <StatCard label="Meetings" value={meetingsInMotion} hint="Booked or completed" icon={CalendarCheck2} />
      </div>

      <Section title="Client list" description="A scannable index. Open a record for the complete client view.">
        {clients.length === 0 ? (
          <div className="grid gap-4">
            <EmptyState>No clients are registered in Lucid OS yet.</EmptyState>
            <div className="flex justify-center">
              <Link href="/admin/lucid-os/clients/new" className="inline-flex h-10 items-center gap-2 rounded-lg bg-zinc-950 px-4 text-sm font-medium text-white transition hover:bg-zinc-800">
                <Plus className="size-4" />
                Add first client
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {clients.map((client) => {
              const clientHref = `/admin/lucid-os/clients/${client.slug}`;
              const intakeSummary = client.intake.desiredOutcome ?? client.intake.meetingNotes ?? client.notes ?? client.intake.rawContextPreview;
              const commercialContext = [client.intake.budgetRange, client.intake.timeline, client.intake.source].filter(Boolean).join(' - ');

              return (
                <article key={client.id} className="grid gap-4 py-5 first:pt-0 last:pb-0 xl:grid-cols-[minmax(220px,0.9fr)_minmax(260px,1.1fr)_minmax(220px,0.8fr)_auto] xl:items-start">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link href={clientHref} className="font-semibold text-zinc-950 underline-offset-4 hover:underline">
                        {client.name}
                      </Link>
                      <StatusBadge tone={clientTone(client.status)}>{client.status}</StatusBadge>
                    </div>
                    <div className="mt-2 grid gap-1 text-sm text-zinc-500">
                      <span className="truncate">{fallbackValue(client.industry ?? client.billingPlanName)}</span>
                      <span className="inline-flex min-w-0 items-center gap-1 truncate">
                        <Globe2 className="size-4 shrink-0 text-zinc-400" />
                        <span className="truncate">{fallbackValue(client.websiteUrl)}</span>
                      </span>
                    </div>
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap gap-2">
                      <StatusBadge tone={intakeTone(client.intake.stage)}>{client.intake.stage}</StatusBadge>
                      <StatusBadge tone={meetingTone(client.intake.meetingStatus)}>{client.intake.meetingStatus}</StatusBadge>
                    </div>
                    <p className="mt-3 line-clamp-2 text-sm leading-6 text-zinc-600">{fallbackValue(intakeSummary)}</p>
                    {client.intake.nextStep ? <p className="mt-2 text-sm font-medium text-zinc-700">Next: {client.intake.nextStep}</p> : null}
                  </div>

                  <div className="grid gap-2 text-sm text-zinc-600">
                    <span className="inline-flex min-w-0 items-center gap-2 truncate">
                      <Mail className="size-4 shrink-0 text-zinc-400" />
                      <span className="truncate">{fallbackValue(client.primaryContactEmail ?? client.primaryContactName)}</span>
                    </span>
                    <span className="inline-flex min-w-0 items-center gap-2 truncate">
                      <Phone className="size-4 shrink-0 text-zinc-400" />
                      <span className="truncate">{fallbackValue(client.primaryContactPhone)}</span>
                    </span>
                    <span className="text-zinc-500">{commercialContext || `Updated ${formatAdminDate(client.updatedAt)}`}</span>
                  </div>

                  <Link href={clientHref} className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-zinc-200 px-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 xl:justify-self-end">
                    View record
                    <ArrowRight className="size-4" />
                  </Link>
                </article>
              );
            })}
          </div>
        )}
      </Section>
    </div>
  );
}
