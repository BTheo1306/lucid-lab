import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, BriefcaseBusiness, Building2, CheckSquare, Contact, Edit3, ExternalLink, FileCheck2, FileText, Globe2, Mail, MessageSquare, Phone, Plus, RefreshCw, Upload } from 'lucide-react';
import { listLucidClientDocumentsForClient } from '@/lib/admin/documents/workflow';
import type { LucidClientDocumentStatus, LucidClientDocumentSummary } from '@/lib/admin/documents/types';
import {
  getLucidClientBySlug,
  getLucidClientIntakeKnowledge,
  listLucidClientContactsForClient,
  listLucidClientImportsForClient,
  listLucidClientInteractionsForClient,
  listLucidClientOpportunitiesForClient,
  listLucidClientTasksForClient,
  listLucidProjectsForClient,
  listLucidWebsitesForClient,
  type LucidClientHealthStatus,
  type LucidClientTaskPriority,
  type LucidClientTaskStatus,
  type LucidContactInfluenceLevel,
  type LucidContactStatus,
  type LucidHealthStatus,
  type LucidInteractionSentiment,
  type LucidOpportunityStage,
  type LucidOpportunityStatus,
  type LucidProjectStatus,
  type LucidWebsiteStatus,
} from '@/lib/admin/lucid-os';
import { EmptyState, formatAdminDate, formatAdminDateTime, Section, StatusBadge } from '../../components';
import { createBonDeCommandeDraftAction, recordClientContactAction, recordClientImportAction, recordClientInteractionAction, recordClientOpportunityAction, recordClientTaskAction, refreshDocuSealDocumentStatusAction, sendBonDeCommandeForSignatureAction, syncClientObsidianAction, updateClientStatusAndLifecycleAction } from '../actions';
import { DeleteClientForm } from '../DeleteClientForm';
import { InlineSelectForm } from '../InlineSelectForm';

export const dynamic = 'force-dynamic';

function clientHealthTone(status: LucidClientHealthStatus): 'neutral' | 'good' | 'warning' | 'danger' {
  switch (status) {
    case 'healthy': return 'good';
    case 'watch': return 'warning';
    case 'risk':
    case 'critical': return 'danger';
    default: return 'neutral';
  }
}

function projectTone(status: LucidProjectStatus): 'neutral' | 'good' | 'warning' | 'danger' {
  switch (status) {
    case 'active': return 'good';
    case 'blocked': return 'danger';
    case 'completed': return 'neutral';
    default: return 'warning';
  }
}

function websiteTone(status: LucidWebsiteStatus): 'neutral' | 'good' | 'warning' | 'danger' {
  switch (status) {
    case 'live': return 'good';
    case 'paused': return 'warning';
    case 'archived': return 'neutral';
    default: return 'warning';
  }
}

function healthTone(status: LucidHealthStatus): 'neutral' | 'good' | 'warning' | 'danger' {
  switch (status) {
    case 'healthy': return 'good';
    case 'degraded': return 'warning';
    case 'down': return 'danger';
    default: return 'neutral';
  }
}

function contactTone(status: LucidContactStatus): 'neutral' | 'good' | 'warning' | 'danger' {
  switch (status) {
    case 'active': return 'good';
    case 'inactive': return 'warning';
    case 'left_company': return 'danger';
    default: return 'neutral';
  }
}

function influenceTone(level: LucidContactInfluenceLevel): 'neutral' | 'good' | 'warning' | 'danger' {
  switch (level) {
    case 'champion':
    case 'high': return 'good';
    case 'blocker': return 'danger';
    case 'medium': return 'warning';
    default: return 'neutral';
  }
}

function opportunityTone(status: LucidOpportunityStatus, stage: LucidOpportunityStage): 'neutral' | 'good' | 'warning' | 'danger' {
  if (status === 'won' || stage === 'won') return 'good';
  if (status === 'lost' || stage === 'lost') return 'danger';
  if (status === 'paused' || stage === 'paused') return 'warning';
  return 'neutral';
}

function taskTone(status: LucidClientTaskStatus): 'neutral' | 'good' | 'warning' | 'danger' {
  switch (status) {
    case 'done': return 'good';
    case 'waiting': return 'warning';
    case 'cancelled': return 'neutral';
    default: return 'warning';
  }
}

function priorityTone(priority: LucidClientTaskPriority): 'neutral' | 'good' | 'warning' | 'danger' {
  switch (priority) {
    case 'urgent': return 'danger';
    case 'high': return 'warning';
    case 'low': return 'neutral';
    default: return 'good';
  }
}

function sentimentTone(sentiment: LucidInteractionSentiment): 'neutral' | 'good' | 'warning' | 'danger' {
  switch (sentiment) {
    case 'positive': return 'good';
    case 'negative':
    case 'risk': return 'danger';
    default: return 'neutral';
  }
}

function documentTone(status: LucidClientDocumentStatus): 'neutral' | 'good' | 'warning' | 'danger' {
  switch (status) {
    case 'signed':
    case 'archived': return 'good';
    case 'needs_review':
    case 'ready_to_send':
    case 'sent_for_signature':
    case 'viewed':
    case 'in_progress': return 'warning';
    case 'declined':
    case 'expired':
    case 'failed': return 'danger';
    default: return 'neutral';
  }
}

function fallbackValue(value: string | null | undefined): string {
  return value && value.trim().length > 0 ? value : '-';
}

function formatMoney(value: number | null): string {
  if (value === null) return '-';
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
}

function statusLabel(value: string): string {
  return value.replace(/_/g, ' ');
}

function hasBlockingDocumentIssues(document: LucidClientDocumentSummary): boolean {
  return document.validationErrors.some((issue) => issue.severity === 'error');
}

function externalHref(value: string | null): string | null {
  if (!value) return null;
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function equalText(left: string | null | undefined, right: string | null | undefined): boolean {
  if (!left || !right) return false;
  return left.replace(/\s+/g, ' ').trim() === right.replace(/\s+/g, ' ').trim();
}

function checklistItems(value: string | null | undefined): string[] {
  if (!value || value.trim().length === 0) return [];
  const normalized = value.replace(/\r/g, '\n').trim();
  const lines = normalized
    .split('\n')
    .map((line) => line.replace(/^\s*(?:[-*]|\d+[.)]|\u2022)\s+/, '').trim())
    .filter(Boolean);

  if (lines.length > 1) return lines;

  const semicolonItems = normalized.split(';').map((item) => item.trim()).filter(Boolean);
  if (semicolonItems.length > 1) return semicolonItems;

  const commaItems = normalized.split(',').map((item) => item.trim()).filter(Boolean);
  if (commaItems.length > 1 && commaItems.every((item) => item.length <= 90)) return commaItems;

  return [normalized];
}

function InfoItem({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="border-b border-zinc-100 py-3 last:border-b-0">
      <dt className="text-xs font-medium uppercase text-zinc-500">{label}</dt>
      <dd className="mt-1 break-words text-sm font-medium text-zinc-950">{fallbackValue(value)}</dd>
    </div>
  );
}

function LongText({ title, value }: { title: string; value: string | null | undefined }) {
  const displayValue = fallbackValue(value);
  if (displayValue === '-') return null;

  return (
    <div className="grid gap-2">
      <h3 className="text-sm font-semibold text-zinc-950">{title}</h3>
      <p className="whitespace-pre-wrap rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-3 text-sm leading-6 text-zinc-700">{displayValue}</p>
    </div>
  );
}

function BulletChecklist({ title, value }: { title: string; value: string | null | undefined }) {
  const items = checklistItems(value);
  if (items.length === 0) return null;

  return (
    <div className="grid gap-2">
      <h3 className="text-sm font-semibold text-zinc-950">{title}</h3>
      <ul className="grid gap-2 rounded-lg border border-zinc-100 bg-zinc-50 px-3 py-3 text-sm leading-6 text-zinc-700">
        {items.map((item, i) => (
          <li key={i} className="grid grid-cols-[16px_minmax(0,1fr)] gap-2">
            <input type="checkbox" disabled className="mt-1 size-4 shrink-0 rounded border-zinc-300 bg-white" />
            <span className="break-words">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function HiddenClientFields({ client }: { client: { id: string; slug: string } }) {
  return (
    <>
      <input type="hidden" name="client_id" value={client.id} />
      <input type="hidden" name="client_slug" value={client.slug} />
    </>
  );
}

const inputClassName = 'h-10 rounded-lg border border-zinc-200 px-3 text-sm font-normal text-zinc-950 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100';
const textareaClassName = 'rounded-lg border border-zinc-200 px-3 py-2 text-sm font-normal leading-6 text-zinc-950 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100';

function textInput(label: string, name: string, placeholder?: string, type = 'text') {
  return (
    <label className="grid gap-2 text-sm font-medium text-zinc-700">
      {label}
      <input name={name} type={type} className={inputClassName} placeholder={placeholder} />
    </label>
  );
}

function textareaInput(label: string, name: string, placeholder?: string, rows = 3) {
  return (
    <label className="grid gap-2 text-sm font-medium text-zinc-700">
      {label}
      <textarea name={name} rows={rows} className={textareaClassName} placeholder={placeholder} />
    </label>
  );
}

function ActionButton({ icon: Icon = Plus, children }: { icon?: typeof Plus; children: string }) {
  return (
    <button type="submit" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-zinc-950 px-4 text-sm font-medium text-white transition hover:bg-zinc-800">
      <Icon className="size-4" />
      {children}
    </button>
  );
}

const clientProfileLinks: Array<{ id: string; label: string; icon: typeof Building2 }> = [
  { id: 'overview', label: 'Overview', icon: Building2 },
  { id: 'contacts', label: 'Contacts', icon: Contact },
  { id: 'opportunities', label: 'Deals', icon: BriefcaseBusiness },
  { id: 'documents', label: 'Documents', icon: FileText },
  { id: 'timeline', label: 'Timeline', icon: MessageSquare },
  { id: 'tasks', label: 'Tasks', icon: CheckSquare },
  { id: 'imports', label: 'Imports', icon: Upload },
  { id: 'delivery', label: 'Delivery', icon: Globe2 },
];

type ClientDetailSearchParams = {
  document_error?: string | string[];
};

function firstSearchParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export default async function LucidClientDetailPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams?: Promise<ClientDetailSearchParams> }) {
  const { slug } = await params;
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const documentError = firstSearchParam(resolvedSearchParams.document_error);
  const client = await getLucidClientBySlug(decodeURIComponent(slug));
  if (!client) notFound();

  const [contacts, opportunities, documents, interactions, tasks, imports, projects, websites, intakeKnowledge] = await Promise.all([
    listLucidClientContactsForClient(client.id, 50),
    listLucidClientOpportunitiesForClient(client.id, 50),
    listLucidClientDocumentsForClient(client.id, 25),
    listLucidClientInteractionsForClient(client.id, 50),
    listLucidClientTasksForClient(client.id, 50),
    listLucidClientImportsForClient(client.id, 25),
    listLucidProjectsForClient(client.id, 25),
    listLucidWebsitesForClient(client.id, 25),
    getLucidClientIntakeKnowledge(client.slug),
  ]);
  const websiteHref = externalHref(client.websiteUrl);
  const internalNotes = [client.intake.desiredOutcome, client.intake.meetingNotes, client.intake.rawContextPreview]
    .some((value) => equalText(client.notes, value))
    ? null
    : client.notes;
  const meetingSummary = equalText(client.intake.meetingNotes, client.intake.rawContextPreview)
    ? null
    : client.intake.meetingNotes;
  const indexedAgentMemory = [client.intake.desiredOutcome, client.intake.meetingNotes, client.intake.rawContextPreview]
    .some((value) => equalText(intakeKnowledge?.summary, value))
    ? null
    : intakeKnowledge?.summary;
  const extractionLabel = [client.intake.extractedBy, client.intake.extractionMethod]
    .filter(Boolean)
    .join(' / ');
  const openOpportunities = opportunities.filter((opportunity) => opportunity.status === 'open').length;
  const openTasks = tasks.filter((task) => task.status !== 'done' && task.status !== 'cancelled').length;
  const signedDocumentValue = documents
    .filter((document) => document.status === 'signed' || document.status === 'archived')
    .reduce((total, document) => total + (document.amountHtEur ?? 0), 0);
  const defaultPricingModel = opportunities[0]?.monthlyValueEur ? 'monthly' : 'one_shot';

  return (
    <div className="grid gap-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="flex size-14 items-center justify-center overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
            {client.websiteUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`https://icon.horse/icon/${client.websiteUrl.replace(/^https?:\/\//, '').replace(/\/.*$/, '')}`} alt={`${client.name} logo`} className="size-8 object-contain" />
            ) : (
              <Building2 className="size-6 text-zinc-400" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.12em] text-zinc-500">Client record</p>
            <h1 className="text-3xl font-semibold tracking-[-0.04em] text-zinc-950">{client.name}</h1>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Link href="/admin/lucid-os/clients" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50">
          <ArrowLeft className="size-4" />
          Back to clients
        </Link>
        <div className="flex flex-wrap gap-2">
          <form action={syncClientObsidianAction}>
            <HiddenClientFields client={client} />
            <button type="submit" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50">
              <FileText className="size-4" />
              Sync Obsidian
            </button>
          </form>
          <DeleteClientForm clientId={client.id} clientSlug={client.slug} clientName={client.name} />
          <Link href={`/admin/lucid-os/clients/${client.slug}/edit`} className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50">
            <Edit3 className="size-4" />
            Edit / re-run intake
          </Link>
        </div>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <div>
            <p className="text-xs font-medium uppercase text-zinc-500">Client status</p>
            <div className="mt-2 flex w-full max-w-[200px] items-center">
              <InlineSelectForm
                action={updateClientStatusAndLifecycleAction}
                name="status"
                defaultValue={client.status}
                clientArgs={{ id: client.id, slug: client.slug }}
                options={[
                  { value: 'lead', label: 'Lead' },
                  { value: 'active', label: 'Active' },
                  { value: 'paused', label: 'Paused' },
                  { value: 'offboarded', label: 'Offboarded' },
                  { value: 'archived', label: 'Archived' },
                ]}
              />
            </div>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-zinc-500">Lifecycle</p>
            <div className="mt-2 flex w-full max-w-[200px] items-center">
              <InlineSelectForm
                action={updateClientStatusAndLifecycleAction}
                name="lifecycle_stage"
                defaultValue={client.lifecycleStage}
                clientArgs={{ id: client.id, slug: client.slug }}
                options={[
                  { value: 'lead', label: 'Lead' },
                  { value: 'qualified', label: 'Qualified' },
                  { value: 'meeting_booked', label: 'Meeting booked' },
                  { value: 'discovery_done', label: 'Discovery done' },
                  { value: 'proposal_needed', label: 'Proposal needed' },
                  { value: 'proposal_sent', label: 'Proposal sent' },
                  { value: 'negotiation', label: 'Negotiation' },
                  { value: 'won', label: 'Won' },
                  { value: 'lost', label: 'Lost' },
                  { value: 'onboarding', label: 'Onboarding' },
                  { value: 'in_delivery', label: 'In delivery' },
                  { value: 'live_managed', label: 'Live managed' },
                  { value: 'success_retention', label: 'Success retention' },
                  { value: 'expansion_opportunity', label: 'Expansion opportunity' },
                  { value: 'archived', label: 'Archived' },
                ]}
              />
            </div>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-zinc-500">Health</p>
            <div className="mt-2 flex items-center gap-2"><StatusBadge tone={clientHealthTone(client.clientHealthStatus)}>{client.clientHealthStatus}</StatusBadge>{client.healthScore !== null ? <span className="text-sm font-medium text-zinc-950">{client.healthScore}/100</span> : null}</div>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-zinc-500">Next action</p>
            <p className="mt-2 line-clamp-2 text-sm font-medium text-zinc-950">{fallbackValue(client.nextAction)}</p>
            {client.nextActionDueAt ? <p className="mt-1 text-xs text-zinc-500">Due {formatAdminDate(client.nextActionDueAt)}</p> : null}
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium uppercase text-zinc-500">Contacts</p>
            <Contact className="size-4 text-zinc-400" />
          </div>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-zinc-950">{contacts.length}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium uppercase text-zinc-500">Open deals</p>
            <BriefcaseBusiness className="size-4 text-zinc-400" />
          </div>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-zinc-950">{openOpportunities}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium uppercase text-zinc-500">Open tasks</p>
            <CheckSquare className="size-4 text-zinc-400" />
          </div>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-zinc-950">{openTasks}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium uppercase text-zinc-500">Documents</p>
            <FileText className="size-4 text-zinc-400" />
          </div>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-zinc-950">{documents.length}</p>
          <p className="mt-1 text-xs text-zinc-500">Signed {formatMoney(signedDocumentValue)}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <p className="text-xs font-medium uppercase text-zinc-500">Interactions</p>
            <MessageSquare className="size-4 text-zinc-400" />
          </div>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-zinc-950">{interactions.length}</p>
        </div>
      </section>

      <nav className="overflow-x-auto rounded-xl border border-zinc-200 bg-white p-2 shadow-sm" aria-label="Client profile sections">
        <div className="flex min-w-max gap-1 text-sm">
          {clientProfileLinks.map(({ id, label, icon: Icon }) => (
            <a key={id} href={`#${id}`} className="inline-flex h-9 items-center gap-2 rounded-lg px-3 font-medium text-zinc-600 transition-colors hover:bg-zinc-100 hover:text-zinc-950">
              <Icon className="size-4" />
              {label}
            </a>
          ))}
        </div>
      </nav>

      <div id="overview" className="grid gap-6 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <Section title="Profile" description="Account identity and contact details.">
          <dl className="grid gap-x-6 md:grid-cols-2">
            <InfoItem label="First name" value={client.firstName ?? client.name.split(' ')[0]} />
            <InfoItem label="Last name" value={client.lastName ?? (client.name.includes(' ') ? client.name.slice(client.name.indexOf(' ') + 1) : null)} />
            <InfoItem label="Industry" value={client.industry} />
            <InfoItem label="Billing plan" value={client.billingPlanName ?? client.billingPlanTier} />
            <InfoItem label="Source" value={client.intake.source} />
            <InfoItem label="Legal name" value={client.legalName} />
            <InfoItem label="SIRET" value={client.siret} />
            <div className="border-b border-zinc-100 py-3 md:col-span-2">
              <dt className="text-xs font-medium uppercase text-zinc-500">Billing address</dt>
              <dd className="mt-1 whitespace-pre-line text-sm font-medium text-zinc-950">{client.billingAddress ?? '-'}</dd>
            </div>
            <div className="border-b border-zinc-100 py-3">
              <dt className="text-xs font-medium uppercase text-zinc-500">Email</dt>
              <dd className="mt-1 text-sm font-medium text-zinc-950">
                {client.primaryContactEmail ? (
                  <a href={`mailto:${client.primaryContactEmail}`} className="inline-flex items-center gap-2 underline-offset-4 hover:underline">
                    <Mail className="size-4 text-zinc-400" />
                    {client.primaryContactEmail}
                  </a>
                ) : '-'}
              </dd>
            </div>
            <div className="border-b border-zinc-100 py-3">
              <dt className="text-xs font-medium uppercase text-zinc-500">Phone</dt>
              <dd className="mt-1 text-sm font-medium text-zinc-950">
                {client.primaryContactPhone ? (
                  <span className="inline-flex items-center gap-2">
                    <Phone className="size-4 text-zinc-400" />
                    {client.primaryContactPhone}
                  </span>
                ) : '-'}
              </dd>
            </div>
            <div className="border-b border-zinc-100 py-3 md:col-span-2">
              <dt className="text-xs font-medium uppercase text-zinc-500">Website</dt>
              <dd className="mt-1 text-sm font-medium text-zinc-950">
                {websiteHref ? (
                  <a href={websiteHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 break-all underline-offset-4 hover:underline">
                    <Globe2 className="size-4 shrink-0 text-zinc-400" />
                    {client.websiteUrl}
                    <ExternalLink className="size-4 shrink-0 text-zinc-400" />
                  </a>
                ) : '-'}
              </dd>
            </div>
          </dl>
          {client.tools.length > 0 && (
            <div className="mt-4 border-t border-zinc-100 pt-4">
              <dt className="text-xs font-medium uppercase text-zinc-500">Tools &amp; stack</dt>
              <dd className="mt-2 flex flex-wrap gap-2">
                {client.tools.map((tool) => (
                  <span key={tool} className="inline-flex items-center rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-xs font-medium text-zinc-700">{tool}</span>
                ))}
              </dd>
            </div>
          )}
        </Section>

        <Section title="Commercial context" description="Budget, timeline, and next action.">
          <dl className="grid gap-x-6 md:grid-cols-2">
            <InfoItem label="Budget" value={client.intake.budgetRange} />
            <InfoItem label="Timeline" value={client.intake.timeline} />
            <InfoItem label="Extraction" value={extractionLabel} />
            <InfoItem label="Meeting booked" value={formatAdminDate(client.intake.meetingBookedAt)} />
            <InfoItem label="Meeting done" value={formatAdminDate(client.intake.meetingDoneAt)} />
            <InfoItem label="Created" value={formatAdminDateTime(client.createdAt)} />
          </dl>
          <div className="mt-4">
            <BulletChecklist title="Next steps" value={client.nextAction ?? client.intake.nextStep} />
          </div>
        </Section>
      </div>

      <Section title="Intake information" description="The main context Lucid OS captured for this client.">
        <div className="grid gap-5">
          <BulletChecklist title="What the client wants" value={client.intake.desiredOutcome} />
          <LongText title="Meeting summary" value={meetingSummary} />
          <LongText title="Source note" value={client.intake.rawContextPreview} />
          <LongText title="Indexed agent memory" value={indexedAgentMemory} />
          <LongText title="Internal notes" value={internalNotes} />
        </div>
      </Section>

      <Section title="Contacts" description="People connected to this account, including decision makers and champions.">
        <div id="contacts" className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          {contacts.length === 0 ? (
            <EmptyState>No contacts have been separated from this account yet.</EmptyState>
          ) : (
            <div className="divide-y divide-zinc-100">
              {contacts.map((contact) => (
                <article key={contact.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-zinc-950">{contact.fullName}</p>
                    {contact.isPrimary ? <StatusBadge tone="good">primary</StatusBadge> : null}
                    {contact.isDecisionMaker ? <StatusBadge tone="warning">decision maker</StatusBadge> : null}
                    <StatusBadge tone={contactTone(contact.status)}>{contact.status}</StatusBadge>
                    <StatusBadge tone={influenceTone(contact.influenceLevel)}>{contact.influenceLevel}</StatusBadge>
                  </div>
                  <p className="mt-1 text-sm text-zinc-500">{fallbackValue(contact.role)}</p>
                  <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-600">
                    {contact.email ? <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-1 underline-offset-4 hover:underline"><Mail className="size-4 text-zinc-400" />{contact.email}</a> : null}
                    {contact.phone ? <span className="inline-flex items-center gap-1"><Phone className="size-4 text-zinc-400" />{contact.phone}</span> : null}
                    {contact.linkedinUrl ? <a href={contact.linkedinUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline-offset-4 hover:underline"><ExternalLink className="size-4 text-zinc-400" />LinkedIn</a> : null}
                  </div>
                  {contact.notes ? <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-600">{contact.notes}</p> : null}
                </article>
              ))}
            </div>
          )}

          <form action={recordClientContactAction} className="grid gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
            <HiddenClientFields client={client} />
            <h3 className="text-sm font-semibold text-zinc-950">Add contact</h3>
            {textInput('Name', 'full_name', 'Marie Dupont')}
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
              {textInput('Role', 'role', 'CEO, marketing, finance')}
              {textInput('Email', 'email', 'marie@acme.fr', 'email')}
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
              {textInput('Phone', 'phone', '+33 6...')}
              {textInput('LinkedIn', 'linkedin_url', 'https://linkedin.com/in/...')}
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
              <label className="grid gap-2 text-sm font-medium text-zinc-700">
                Influence
                <select name="influence_level" defaultValue="unknown" className={inputClassName}>
                  <option value="unknown">Unknown</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="champion">Champion</option>
                  <option value="blocker">Blocker</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium text-zinc-700">
                Status
                <select name="contact_status" defaultValue="active" className={inputClassName}>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="left_company">Left company</option>
                  <option value="archived">Archived</option>
                </select>
              </label>
            </div>
            <div className="flex flex-wrap gap-4 text-sm font-medium text-zinc-700">
              <label className="inline-flex items-center gap-2"><input name="is_primary" type="checkbox" className="size-4 rounded border-zinc-300" />Primary</label>
              <label className="inline-flex items-center gap-2"><input name="is_decision_maker" type="checkbox" className="size-4 rounded border-zinc-300" />Decision maker</label>
            </div>
            {textareaInput('Notes', 'notes', 'Relationship context, preferences, objections...', 3)}
            <div className="flex justify-end"><ActionButton icon={Contact}>Add contact</ActionButton></div>
          </form>
        </div>
      </Section>

      <Section title="Opportunities" description="Deals, offers, forecast value, probability, and next sales action.">
        <div id="opportunities" className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          {opportunities.length === 0 ? (
            <EmptyState>No opportunities have been opened for this account yet.</EmptyState>
          ) : (
            <div className="divide-y divide-zinc-100">
              {opportunities.map((opportunity) => (
                <article key={opportunity.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-zinc-950">{opportunity.title}</p>
                    <StatusBadge tone={opportunityTone(opportunity.status, opportunity.stage)}>{opportunity.stage}</StatusBadge>
                    <StatusBadge tone={opportunityTone(opportunity.status, opportunity.stage)}>{opportunity.status}</StatusBadge>
                  </div>
                  <p className="mt-1 text-sm text-zinc-500">{opportunity.offerType} - {opportunity.probabilityPercent}% probability - {opportunity.primaryContactName ?? 'no contact linked'}</p>
                  <div className="mt-2 grid gap-2 text-sm text-zinc-600 md:grid-cols-3">
                    <span>Forecast: {opportunity.valueEstimateEur !== null ? `${opportunity.valueEstimateEur} EUR` : '-'}</span>
                    <span>Setup: {opportunity.setupValueEur !== null ? `${opportunity.setupValueEur} EUR` : '-'}</span>
                    <span>Monthly: {opportunity.monthlyValueEur !== null ? `${opportunity.monthlyValueEur} EUR` : '-'}</span>
                  </div>
                  {opportunity.nextStep ? <p className="mt-2 text-sm font-medium text-zinc-700">Next: {opportunity.nextStep}{opportunity.nextStepDueAt ? ` - ${formatAdminDate(opportunity.nextStepDueAt)}` : ''}</p> : null}
                  {opportunity.notes ? <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-600">{opportunity.notes}</p> : null}
                </article>
              ))}
            </div>
          )}

          <form action={recordClientOpportunityAction} className="grid gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
            <HiddenClientFields client={client} />
            <h3 className="text-sm font-semibold text-zinc-950">Add opportunity</h3>
            {textInput('Title', 'title', 'AI lead generation system')}
            <label className="grid gap-2 text-sm font-medium text-zinc-700">
              Primary contact
              <select name="primary_contact_id" defaultValue="" className={inputClassName}>
                <option value="">None</option>
                {contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.fullName}</option>)}
              </select>
            </label>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
              <label className="grid gap-2 text-sm font-medium text-zinc-700">
                Stage
                <select name="stage" defaultValue="discovery" className={inputClassName}>
                  <option value="new">New</option>
                  <option value="qualified">Qualified</option>
                  <option value="discovery">Discovery</option>
                  <option value="proposal_needed">Proposal needed</option>
                  <option value="proposal_sent">Proposal sent</option>
                  <option value="negotiation">Negotiation</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                  <option value="paused">Paused</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium text-zinc-700">
                Status
                <select name="opportunity_status" defaultValue="open" className={inputClassName}>
                  <option value="open">Open</option>
                  <option value="won">Won</option>
                  <option value="lost">Lost</option>
                  <option value="paused">Paused</option>
                  <option value="archived">Archived</option>
                </select>
              </label>
            </div>
            <label className="grid gap-2 text-sm font-medium text-zinc-700">
              Offer
              <select name="offer_type" defaultValue="custom" className={inputClassName}>
                <option value="managed_website">Managed website</option>
                <option value="website_database">Website + database</option>
                <option value="ai_automation">AI automation</option>
                <option value="ai_agent">AI agent</option>
                <option value="custom_app">Custom app</option>
                <option value="retainer">Retainer</option>
                <option value="audit">Audit</option>
                <option value="custom">Custom</option>
              </select>
            </label>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
              {textInput('Forecast EUR', 'value_estimate_eur', '5000', 'number')}
              {textInput('Probability %', 'probability_percent', '40', 'number')}
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
              {textInput('Setup EUR', 'setup_value_eur', '3000', 'number')}
              {textInput('Monthly EUR', 'monthly_value_eur', '500', 'number')}
            </div>
            {textInput('Expected close', 'expected_close_at', undefined, 'datetime-local')}
            {textInput('Source', 'source', 'LinkedIn, referral, website')}
            {textInput('Next step', 'next_step', 'Send proposal')}
            {textInput('Next step due', 'next_step_due_at', undefined, 'datetime-local')}
            {textareaInput('Notes', 'notes', 'Commercial context, objections, buying criteria...', 3)}
            <div className="flex justify-end"><ActionButton icon={BriefcaseBusiness}>Add opportunity</ActionButton></div>
          </form>
        </div>
      </Section>

      <Section title="Documents & billing" description="Bon de commande, DocuSeal status, archive readiness, and billing handoff.">
        <div id="documents" className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          {documentError ? (
            <div className="xl:col-span-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
              <p className="font-medium text-red-950">Document send failed</p>
              <p className="mt-1 break-words">{documentError}</p>
            </div>
          ) : null}
          {documents.length === 0 ? (
            <EmptyState>No commercial documents have been generated for this client yet.</EmptyState>
          ) : (
            <div className="divide-y divide-zinc-100">
              {documents.map((document) => {
                const canSend = document.documentType === 'bon_de_commande'
                  && !hasBlockingDocumentIssues(document)
                  && !['sent_for_signature', 'viewed', 'in_progress', 'signed', 'archived'].includes(document.status);
                const canRefreshDocuSeal = Boolean(document.docusealSubmissionId) && ['sent_for_signature', 'viewed', 'in_progress', 'signed'].includes(document.status);
                return (
                  <article key={document.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-zinc-950">{document.title}</p>
                      <StatusBadge tone={documentTone(document.status)}>{statusLabel(document.status)}</StatusBadge>
                      <StatusBadge tone="neutral">{statusLabel(document.documentType)}</StatusBadge>
                    </div>
                    <p className="mt-1 text-sm text-zinc-500">{document.documentNumber ?? 'No number'} - {formatAdminDateTime(document.createdAt)}</p>
                    <div className="mt-2 grid gap-2 text-sm text-zinc-600 md:grid-cols-3">
                      <span>HT: {formatMoney(document.amountHtEur)}</span>
                      <span>TVA: {formatMoney(document.vatAmountEur)}</span>
                      <span>TTC: {formatMoney(document.amountTtcEur)}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-600">
                      {document.sentAt ? <span>Sent {formatAdminDateTime(document.sentAt)}</span> : null}
                      {document.completedAt ? <span>Signed {formatAdminDateTime(document.completedAt)}</span> : null}
                      {document.docusealSubmissionUrl ? <a href={document.docusealSubmissionUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline-offset-4 hover:underline"><ExternalLink className="size-4 text-zinc-400" />DocuSeal</a> : null}
                      {document.docusealCombinedDocumentUrl ? <a href={document.docusealCombinedDocumentUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline-offset-4 hover:underline"><FileCheck2 className="size-4 text-zinc-400" />Signed BDC + contract PDF</a> : null}
                      {document.docusealAuditLogUrl ? <a href={document.docusealAuditLogUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline-offset-4 hover:underline"><ExternalLink className="size-4 text-zinc-400" />Audit log</a> : null}
                      {document.googleDriveFolderId ? <a href={`https://drive.google.com/drive/folders/${document.googleDriveFolderId}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline-offset-4 hover:underline"><ExternalLink className="size-4 text-zinc-400" />Drive folder</a> : null}
                    </div>
                    {document.validationErrors.length > 0 ? (
                      <ul className="mt-3 grid gap-1 rounded-lg border border-amber-100 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-800">
                        {document.validationErrors.map((issue) => (
                          <li key={`${document.id}-${issue.code}-${issue.field}`}>{issue.severity}: {issue.message}</li>
                        ))}
                      </ul>
                    ) : null}
                    {canSend ? (
                      <form action={sendBonDeCommandeForSignatureAction} className="mt-3 flex justify-end">
                        <HiddenClientFields client={client} />
                        <input type="hidden" name="document_id" value={document.id} />
                        <button type="submit" className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-zinc-950 px-3 text-sm font-medium text-white transition hover:bg-zinc-800">
                          <FileText className="size-4" />
                          Send BDC + contract
                        </button>
                      </form>
                    ) : null}
                    {canRefreshDocuSeal ? (
                      <form action={refreshDocuSealDocumentStatusAction} className="mt-3 flex justify-end">
                        <HiddenClientFields client={client} />
                        <input type="hidden" name="document_id" value={document.id} />
                        <button type="submit" className="inline-flex h-9 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-3 text-sm font-medium text-zinc-700 transition hover:border-zinc-300 hover:bg-zinc-50">
                          <RefreshCw className="size-4" />
                          Refresh DocuSeal
                        </button>
                      </form>
                    ) : null}
                  </article>
                );
              })}
            </div>
          )}

          <form action={createBonDeCommandeDraftAction} className="grid gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
            <HiddenClientFields client={client} />
            <h3 className="text-sm font-semibold text-zinc-950">Generate BDC + contract</h3>
            <label className="grid gap-2 text-sm font-medium text-zinc-700">
              Opportunity
              <select name="opportunity_id" defaultValue={opportunities[0]?.id ?? ''} className={inputClassName}>
                <option value="">Select a deal</option>
                {opportunities.map((opportunity) => <option key={opportunity.id} value={opportunity.id}>{opportunity.title}</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium text-zinc-700">
              Signer
              <select name="contact_id" defaultValue={contacts.find((contact) => contact.isPrimary)?.id ?? contacts[0]?.id ?? ''} className={inputClassName}>
                <option value="">Use client primary contact</option>
                {contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.fullName}{contact.email ? ` - ${contact.email}` : ''}</option>)}
              </select>
            </label>
            {textInput('Google Drive folder id', 'google_drive_folder_id', 'Optional: folder id for this client')}
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
              <label className="grid gap-2 text-sm font-medium text-zinc-700">
                Pricing model
                <select name="pricing_model" defaultValue={defaultPricingModel} className={inputClassName}>
                  <option value="one_shot">One-shot</option>
                  <option value="monthly">Mensuel 12 mois</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium text-zinc-700">
                Client legal name
                <input name="client_legal_name" defaultValue={client.legalName ?? client.name} className={inputClassName} placeholder="Raison sociale" />
              </label>
            </div>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
              <label className="grid gap-2 text-sm font-medium text-zinc-700">
                Client SIRET
                <input name="client_siret" defaultValue={client.siret ?? ''} className={inputClassName} placeholder="123 456 789 00010" />
              </label>
              <label className="grid gap-2 text-sm font-medium text-zinc-700">
                Client address
                <input name="client_billing_address" defaultValue={client.billingAddress ?? ''} className={inputClassName} placeholder="Adresse complète du client" />
              </label>
            </div>
            {textareaInput('Périmètre de la prestation', 'scope_perimeter', 'Ex: Agent IA de qualification des réservations, automatisation des avis Google...', 4)}
            {textareaInput('Description synthétique', 'synthetic_description', 'Décrivez le contexte, les objectifs et le fonctionnement prévu...', 5)}
            {textareaInput('Livrables attendus', 'deliverables', 'Ex: Agent opérationnel, formation équipe, documentation technique...', 4)}
            {textareaInput('Calendrier', 'calendar_timeline', 'Ex: Semaine 1 Audit du fichier, Drive, emails et flux documents.\nSemaines 2-3 Google Sheets, automatisations, relances et classement.\nSemaine 4 Meta Ads, WhatsApp Business et routine SEO.', 4)}
            {textareaInput('Prochaines étapes', 'next_steps', 'Ex: Confirmer les accès utiles.\nValider les échéances de relance.\nSigner le Bon de Commande et procéder au premier paiement.', 4)}
            {textareaInput('Internal notes', 'document_notes', 'Special payment terms, assumptions, or review notes...', 3)}
            <div className="flex justify-end"><ActionButton icon={FileText}>Create draft</ActionButton></div>
          </form>
        </div>
      </Section>

      <Section title="Timeline" description="Meetings, calls, emails, notes, imports, and other client interactions in chronological order.">
        <div id="timeline" className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          {interactions.length === 0 ? (
            <EmptyState>No timeline entries have been recorded yet.</EmptyState>
          ) : (
            <div className="divide-y divide-zinc-100">
              {interactions.map((interaction) => (
                <article key={interaction.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge tone="neutral">{interaction.interactionType}</StatusBadge>
                    <StatusBadge tone="neutral">{interaction.direction}</StatusBadge>
                    <StatusBadge tone={sentimentTone(interaction.sentiment)}>{interaction.sentiment}</StatusBadge>
                    <p className="text-sm text-zinc-500">{formatAdminDateTime(interaction.occurredAt)}</p>
                  </div>
                  <p className="mt-2 font-medium text-zinc-950">{interaction.summary}</p>
                  <p className="mt-1 text-sm text-zinc-500">{interaction.contactName ?? 'No contact'} - {interaction.opportunityTitle ?? 'No deal'} - {interaction.sourceSystem}</p>
                  {interaction.notes ? <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-zinc-600">{interaction.notes}</p> : null}
                  {interaction.nextStep ? <p className="mt-2 text-sm font-medium text-zinc-700">Next: {interaction.nextStep}{interaction.nextStepDueAt ? ` - ${formatAdminDate(interaction.nextStepDueAt)}` : ''}</p> : null}
                </article>
              ))}
            </div>
          )}

          <form action={recordClientInteractionAction} className="grid gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
            <HiddenClientFields client={client} />
            <h3 className="text-sm font-semibold text-zinc-950">Add interaction</h3>
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
              <label className="grid gap-2 text-sm font-medium text-zinc-700">
                Type
                <select name="interaction_type" defaultValue="note" className={inputClassName}>
                  <option value="note">Note</option>
                  <option value="meeting">Meeting</option>
                  <option value="call">Call</option>
                  <option value="email">Email</option>
                  <option value="chat">Chat</option>
                  <option value="form">Form</option>
                  <option value="support">Support</option>
                  <option value="delivery_update">Delivery update</option>
                  <option value="decision">Decision</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium text-zinc-700">
                Direction
                <select name="direction" defaultValue="internal" className={inputClassName}>
                  <option value="internal">Internal</option>
                  <option value="inbound">Inbound</option>
                  <option value="outbound">Outbound</option>
                </select>
              </label>
            </div>
            <label className="grid gap-2 text-sm font-medium text-zinc-700">
              Contact
              <select name="contact_id" defaultValue="" className={inputClassName}>
                <option value="">None</option>
                {contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.fullName}</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium text-zinc-700">
              Opportunity
              <select name="opportunity_id" defaultValue="" className={inputClassName}>
                <option value="">None</option>
                {opportunities.map((opportunity) => <option key={opportunity.id} value={opportunity.id}>{opportunity.title}</option>)}
              </select>
            </label>
            {textInput('Occurred at', 'occurred_at', undefined, 'datetime-local')}
            {textInput('Summary', 'summary', 'Discovery call: client needs lead gen')}
            {textareaInput('Notes', 'notes', 'Important context, decisions, objections, commitments...', 4)}
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
              <label className="grid gap-2 text-sm font-medium text-zinc-700">
                Sentiment
                <select name="sentiment" defaultValue="neutral" className={inputClassName}>
                  <option value="positive">Positive</option>
                  <option value="neutral">Neutral</option>
                  <option value="negative">Negative</option>
                  <option value="risk">Risk</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium text-zinc-700">
                Source
                <select name="source_system" defaultValue="admin" className={inputClassName}>
                  <option value="admin">Admin</option>
                  <option value="tidycal">TidyCal</option>
                  <option value="email">Email</option>
                  <option value="website">Website</option>
                  <option value="chat">Chat</option>
                  <option value="github">GitHub</option>
                  <option value="obsidian">Obsidian</option>
                  <option value="integration">Integration</option>
                  <option value="agent">Agent</option>
                </select>
              </label>
            </div>
            {textInput('Source URI', 'source_uri', 'tidycal://..., mail://..., https://...')}
            {textInput('Next step', 'next_step', 'Send recap email')}
            {textInput('Next step due', 'next_step_due_at', undefined, 'datetime-local')}
            <div className="flex justify-end"><ActionButton icon={MessageSquare}>Add interaction</ActionButton></div>
          </form>
        </div>
      </Section>

      <Section title="Tasks" description="Human follow-ups and delivery actions that keep the account moving.">
        <div id="tasks" className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          {tasks.length === 0 ? (
            <EmptyState>No tasks are open for this client yet.</EmptyState>
          ) : (
            <div className="divide-y divide-zinc-100">
              {tasks.map((task) => (
                <article key={task.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-zinc-950">{task.title}</p>
                    <StatusBadge tone={taskTone(task.status)}>{task.status}</StatusBadge>
                    <StatusBadge tone={priorityTone(task.priority)}>{task.priority}</StatusBadge>
                  </div>
                  <p className="mt-1 text-sm text-zinc-500">{task.ownerLabel ?? 'Unassigned'} - due {formatAdminDate(task.dueAt)} - {task.opportunityTitle ?? task.contactName ?? 'general'}</p>
                  {task.description ? <p className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-600">{task.description}</p> : null}
                </article>
              ))}
            </div>
          )}

          <form action={recordClientTaskAction} className="grid gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
            <HiddenClientFields client={client} />
            <h3 className="text-sm font-semibold text-zinc-950">Add task</h3>
            {textInput('Title', 'title', 'Follow up with proposal')}
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
              <label className="grid gap-2 text-sm font-medium text-zinc-700">
                Status
                <select name="task_status" defaultValue="todo" className={inputClassName}>
                  <option value="todo">Todo</option>
                  <option value="in_progress">In progress</option>
                  <option value="waiting">Waiting</option>
                  <option value="done">Done</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </label>
              <label className="grid gap-2 text-sm font-medium text-zinc-700">
                Priority
                <select name="priority" defaultValue="normal" className={inputClassName}>
                  <option value="low">Low</option>
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </label>
            </div>
            <label className="grid gap-2 text-sm font-medium text-zinc-700">
              Contact
              <select name="contact_id" defaultValue="" className={inputClassName}>
                <option value="">None</option>
                {contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.fullName}</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium text-zinc-700">
              Opportunity
              <select name="opportunity_id" defaultValue="" className={inputClassName}>
                <option value="">None</option>
                {opportunities.map((opportunity) => <option key={opportunity.id} value={opportunity.id}>{opportunity.title}</option>)}
              </select>
            </label>
            {textInput('Owner', 'owner_label', 'Jules, Anthony, Théo')}
            {textInput('Due at', 'due_at', undefined, 'datetime-local')}
            {textareaInput('Description', 'description', 'What needs to happen and any context needed...', 3)}
            <div className="flex justify-end"><ActionButton icon={CheckSquare}>Add task</ActionButton></div>
          </form>
        </div>
      </Section>

      <Section title="Imports" description="Source documents and pasted context stored once, then indexed for agents when useful.">
        <div id="imports" className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
          {imports.length === 0 ? (
            <EmptyState>No source documents have been imported for this client yet.</EmptyState>
          ) : (
            <div className="divide-y divide-zinc-100">
              {imports.map((sourceImport) => (
                <article key={sourceImport.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-zinc-950">{sourceImport.title}</p>
                    <StatusBadge tone={sourceImport.status === 'processed' ? 'good' : sourceImport.status === 'needs_review' ? 'warning' : 'neutral'}>{sourceImport.status}</StatusBadge>
                    {sourceImport.indexedAsKnowledge ? <StatusBadge tone="good">indexed</StatusBadge> : null}
                  </div>
                  <p className="mt-1 text-sm text-zinc-500">{sourceImport.sourceType} - {formatAdminDateTime(sourceImport.createdAt)}</p>
                  {sourceImport.extractedSummary ? <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-600">{sourceImport.extractedSummary}</p> : null}
                  <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-zinc-500">{sourceImport.rawContentPreview}</p>
                </article>
              ))}
            </div>
          )}

          <form action={recordClientImportAction} className="grid gap-3 rounded-lg border border-zinc-200 bg-zinc-50 p-4">
            <HiddenClientFields client={client} />
            <h3 className="text-sm font-semibold text-zinc-950">Import source</h3>
            {textInput('Title', 'title', 'Discovery call notes')}
            <label className="grid gap-2 text-sm font-medium text-zinc-700">
              Source type
              <select name="source_type" defaultValue="note" className={inputClassName}>
                <option value="note">Note</option>
                <option value="meeting_notes">Meeting notes</option>
                <option value="email">Email</option>
                <option value="doc">Document</option>
                <option value="linkedin">LinkedIn</option>
                <option value="website">Website</option>
                <option value="chat">Chat</option>
                <option value="github">GitHub</option>
                <option value="other">Other</option>
              </select>
            </label>
            {textInput('Source URI', 'source_uri', 'Optional link, file path, or external reference')}
            {textareaInput('Raw content', 'raw_content', 'Paste the original notes, email thread, or document text here.', 8)}
            <label className="flex items-center gap-2 text-sm font-medium text-zinc-700">
              <input name="index_as_knowledge" type="checkbox" defaultChecked className="size-4 rounded border-zinc-300" />
              <FileText className="size-4 text-zinc-500" />
              Index for agents
            </label>
            <div className="flex justify-end"><ActionButton icon={Upload}>Import source</ActionButton></div>
          </form>
        </div>
      </Section>

      <div id="delivery" className="grid gap-6 xl:grid-cols-2">
        <Section title="Projects" description="Client-scoped delivery work in Lucid OS.">
          {projects.length === 0 ? (
            <EmptyState>No projects are attached to this client yet.</EmptyState>
          ) : (
            <div className="divide-y divide-zinc-100">
              {projects.map((project) => (
                <article key={project.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-zinc-950">{project.name}</p>
                    <StatusBadge tone={projectTone(project.status)}>{project.status}</StatusBadge>
                  </div>
                  <p className="mt-1 text-sm text-zinc-500">{project.projectType} - {project.priority} - due {formatAdminDate(project.dueAt)}</p>
                  {project.summary ? <p className="mt-2 line-clamp-3 text-sm leading-6 text-zinc-600">{project.summary}</p> : null}
                </article>
              ))}
            </div>
          )}
        </Section>

        <Section title="Websites" description="Sites, domains, hosting, and health for this client.">
          {websites.length === 0 ? (
            <EmptyState>No websites are attached to this client yet.</EmptyState>
          ) : (
            <div className="divide-y divide-zinc-100">
              {websites.map((website) => (
                <article key={website.id} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-zinc-950">{website.name}</p>
                    <StatusBadge tone={websiteTone(website.status)}>{website.status}</StatusBadge>
                    <StatusBadge tone={healthTone(website.healthStatus)}>{website.healthStatus}</StatusBadge>
                  </div>
                  <p className="mt-1 text-sm text-zinc-500">{website.hostingProvider} - checked {formatAdminDate(website.lastCheckedAt)}</p>
                  <p className="mt-2 break-all text-sm text-zinc-600">{website.primaryDomain ?? website.productionUrl ?? 'No domain recorded'}</p>
                </article>
              ))}
            </div>
          )}
        </Section>
      </div>
    </div>
  );
}
