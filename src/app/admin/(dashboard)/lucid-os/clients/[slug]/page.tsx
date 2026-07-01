import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  BriefcaseBusiness,
  CheckSquare,
  Contact,
  DatabaseZap,
  Edit3,
  ExternalLink,
  FileCheck2,
  FileText,
  FolderOpen,
  Globe2,
  Mail,
  MessageSquare,
  Phone,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { getVaultClientProfile, profileStatusLabel, type VaultClientDocument, type VaultClientProfile } from '@/lib/admin/client-vault-profiles';
import { supabaseServiceRoleConfigurationError } from '@/lib/bot/db/supabase';
import { listLucidClientDocumentsForClient } from '@/lib/admin/documents/workflow';
import type { LucidClientDocumentStatus, LucidClientDocumentSummary } from '@/lib/admin/documents/types';
import {
  getLucidClientBySlug,
  markLucidClientOpened,
  listLucidClientContactsForClient,
  listLucidDatabasesForClient,
  listLucidDeploymentsForClient,
  listLucidClientImportsForClient,
  listLucidClientInteractionsForClient,
  listLucidIntegrationsForClient,
  listLucidClientOpportunitiesForClient,
  listLucidClientTasksForClient,
  listLucidProjectsForClient,
  listLucidWebsitesForClient,
  type LucidClientHealthStatus,
  type LucidClientImportSummary,
  type LucidClientSummary,
  type LucidClientTaskSummary,
  type LucidDatabaseSummary,
  type LucidDeploymentSummary,
  type LucidIntegrationSummary,
  type LucidInteractionSentiment,
  type LucidProjectStatus,
  type LucidProjectSummary,
  type LucidWebsiteStatus,
  type LucidWebsiteSummary,
} from '@/lib/admin/lucid-os';
import { EmptyState, formatAdminDateTime, StatusBadge } from '../../components';
import { ClientTaskBoard } from './TaskBoard';
import {
  createBonDeCommandeDraftAction,
  fetchClientCompanyInfoAction,
  recordClientContactAction,
  recordClientOpportunityAction,
  recordClientSmartNoteAction,
  recordClientTaskAction,
  refreshDocuSealDocumentStatusAction,
  sendBonDeCommandeForSignatureAction,
  updateClientCompanyInfoAction,
  updateClientStatusAndLifecycleAction,
} from '../actions';
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
  const labels: Record<string, string> = {
    active: 'actif',
    ai_agent: 'agent IA',
    ai_automation: 'automatisation IA',
    archived: 'archivé',
    audit: 'audit',
    blocked: 'bloqué',
    call: 'appel',
    cancelled: 'annulé',
    chat: 'chat',
    champion: 'allié',
    contract: 'contrat',
    critical: 'critique',
    custom: 'sur mesure',
    custom_app: 'application sur mesure',
    degraded: 'dégradé',
    decision: 'décision',
    declined: 'refusé',
    discovery: 'découverte',
    discovery_done: 'découverte faite',
    delivery_update: 'point production',
    done: 'fait',
    draft: 'brouillon',
    email: 'email',
    expired: 'expiré',
    expansion_opportunity: 'opportunité d’expansion',
    failed: 'échec',
    form: 'formulaire',
    healthy: 'sain',
    high: 'élevé',
    in_delivery: 'en production',
    in_progress: 'en cours',
    inactive: 'inactif',
    lead: 'prospect',
    left_company: 'a quitté l’entreprise',
    live: 'en ligne',
    live_managed: 'en ligne / géré',
    lost: 'perdu',
    low: 'faible',
    managed_website: 'site web géré',
    medium: 'moyen',
    meeting: 'rendez-vous',
    meeting_booked: 'rdv planifié',
    meeting_notes: 'notes de rendez-vous',
    monitoring: 'monitoring',
    monthly: 'mensuel',
    needs_review: 'à relire',
    negative: 'négatif',
    neutral: 'neutre',
    new: 'nouveau',
    note: 'note',
    normal: 'normal',
    offboarded: 'terminé',
    one_shot: 'one-shot',
    open: 'ouvert',
    other: 'autre',
    paused: 'en pause',
    positive: 'positif',
    processed: 'traité',
    proposal: 'proposition',
    proposal_needed: 'proposition à préparer',
    proposal_sent: 'proposition envoyée',
    qualified: 'qualifié',
    ready_to_send: 'prêt à envoyer',
    retainer: 'récurrent',
    risk: 'risque',
    sent: 'envoyé',
    sent_for_signature: 'envoyé en signature',
    signed: 'signé',
    signed_pdf: 'PDF signé',
    source: 'source',
    stale: 'à mettre à jour',
    success_retention: 'succès / rétention',
    support: 'support',
    test_artifact: 'artefact de test',
    todo: 'à faire',
    unknown: 'inconnu',
    urgent: 'urgent',
    viewed: 'vu',
    waiting: 'en attente',
    website_database: 'site web + base de données',
    won: 'gagné',
  };

  return labels[value] ?? value.replace(/_/g, ' ');
}

function hasBlockingDocumentIssues(document: LucidClientDocumentSummary): boolean {
  return document.validationErrors.some((issue) => issue.severity === 'error');
}

function externalHref(value: string | null): string | null {
  if (!value) return null;
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function HiddenClientFields({ client }: { client: { id: string; slug: string } }) {
  return (
    <>
      <input type="hidden" name="client_id" value={client.id} />
      <input type="hidden" name="client_slug" value={client.slug} />
    </>
  );
}

const inputClassName = 'h-9 rounded border border-zinc-200 px-3 text-sm font-normal text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100';
const textareaClassName = 'rounded border border-zinc-200 px-3 py-2 text-sm font-normal leading-6 text-zinc-950 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100';

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
    <button type="submit" className="inline-flex h-9 items-center justify-center gap-2 rounded bg-zinc-950 px-3 text-sm font-semibold text-white transition hover:bg-zinc-800">
      <Icon className="size-4" />
      {children}
    </button>
  );
}

function RecordPanel({ title, children }: { title: string; description?: string; children: React.ReactNode }) {
  return (
    <section className="grid gap-3">
      <h2 className="text-sm font-semibold tracking-[-0.01em] text-zinc-900">{title}</h2>
      <div className="border-t border-zinc-200 pt-3">{children}</div>
    </section>
  );
}

function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="grid gap-1 border-t border-zinc-200 py-3 first:border-t-0 first:pt-0 last:pb-0 md:grid-cols-[160px_minmax(0,1fr)] md:gap-4">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-600">{label}</dt>
      <dd className="min-w-0 break-words text-sm leading-6 text-zinc-700">{value}</dd>
    </div>
  );
}

function LineList({ items, empty = 'Rien d’enregistré pour le moment.' }: { items: string[]; empty?: string }) {
  if (items.length === 0) return <p className="text-sm text-zinc-600">{empty}</p>;

  return (
    <div className="divide-y divide-zinc-100">
      {items.map((item) => (
        <p key={item} className="py-3 text-sm leading-6 text-zinc-700 first:pt-0 last:pb-0">{item}</p>
      ))}
    </div>
  );
}

function VaultDocumentList({ documents }: { documents: VaultClientDocument[] }) {
  if (documents.length === 0) return <EmptyState>Aucune référence documentaire n’est enregistrée pour ce client.</EmptyState>;

  return (
    <div className="divide-y divide-zinc-100">
      {documents.map((document) => (
        <article key={`${document.title}-${document.location}`} className="py-4 first:pt-0 last:pb-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-zinc-950">{document.title}</p>
            <StatusBadge tone={document.status === 'signed' ? 'good' : document.status === 'needs_review' || document.status === 'test_artifact' ? 'warning' : 'neutral'}>{statusLabel(document.status)}</StatusBadge>
            <StatusBadge tone="neutral">{statusLabel(document.kind)}</StatusBadge>
          </div>
          <p className="mt-2 text-sm text-zinc-500">{document.location}</p>
          {document.note ? <p className="mt-2 text-sm leading-6 text-zinc-600">{document.note}</p> : null}
          {document.url ? (
            <a href={document.url} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-2 text-sm text-zinc-700 underline-offset-4 hover:underline">
              Ouvrir le document <ExternalLink className="size-4" />
            </a>
          ) : null}
        </article>
      ))}
    </div>
  );
}

function SourceRefs({ profile }: { profile: VaultClientProfile }) {
  return (
    <div className="divide-y divide-zinc-100">
      {profile.sourceRefs.map((source) => (
        <div key={source.vaultPath} className="py-3 first:pt-0 last:pb-0">
          <p className="text-sm font-medium text-zinc-700">{source.label}</p>
          <p className="mt-1 break-all text-xs text-zinc-600">{source.vaultPath}</p>
        </div>
      ))}
    </div>
  );
}

function FoldoutForm({ title, icon: Icon, children }: { title: string; icon: typeof Plus; children: React.ReactNode }) {
  return (
    <details className="group border-t border-zinc-200 py-4 first:border-t-0 first:pt-0 last:pb-0">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-zinc-900 [&::-webkit-details-marker]:hidden">
        <span className="inline-flex items-center gap-2"><Icon className="size-4 text-zinc-500" />{title}</span>
        <Plus className="size-4 text-zinc-600 transition group-open:rotate-45" />
      </summary>
      <div className="mt-4">{children}</div>
    </details>
  );
}

function ActionErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <div className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm leading-6 text-rose-700">
      {message}
    </div>
  );
}

function VaultEditPanel({ profile, supabaseWriteError }: { profile: VaultClientProfile; supabaseWriteError: string | null }) {
  return (
    <RecordPanel title="Actions">
      <div className="grid gap-3">
        <Link href={`/admin/lucid-os/clients/${profile.slug}/edit`} className="inline-flex h-9 items-center justify-center gap-2 rounded bg-zinc-950 px-3 text-sm font-semibold text-white transition hover:bg-zinc-800">
          <Edit3 className="size-4" />
          Modifier / rendre éditable
        </Link>
        {supabaseWriteError ? <ActionErrorBanner message={supabaseWriteError} /> : null}
      </div>
    </RecordPanel>
  );
}

function VaultCompanyContactPanel({ profile }: { profile: VaultClientProfile }) {
  return (
    <RecordPanel title="Contact et entreprise">
      <div className="grid gap-6 xl:grid-cols-2">
        <dl>
          <FieldRow label="Raison sociale" value={profile.name} />
          <FieldRow label="SIREN" value="-" />
          <FieldRow label="SIRET" value="-" />
          <FieldRow label="Adresse" value="-" />
          <FieldRow label="Activité" value={fallbackValue(profile.industry)} />
          <FieldRow label="Site" value={profile.websiteUrl ? <a href={externalHref(profile.websiteUrl) ?? profile.websiteUrl} target="_blank" rel="noreferrer" className="underline-offset-4 hover:text-zinc-900 hover:underline">{profile.websiteUrl}</a> : '-'} />
        </dl>
        <dl>
          <FieldRow label="Contact" value={fallbackValue(profile.primaryContactName)} />
          <FieldRow label="Rôle" value="-" />
          <FieldRow label="Email" value={profile.primaryContactEmail ? <a href={`mailto:${profile.primaryContactEmail}`} className="underline-offset-4 hover:text-zinc-900 hover:underline">{profile.primaryContactEmail}</a> : '-'} />
          <FieldRow label="Téléphone" value={fallbackValue(profile.primaryContactPhone)} />
          <FieldRow label="Statut" value={statusLabel(profile.status)} />
          <FieldRow label="Source" value="source interne" />
        </dl>
      </div>
    </RecordPanel>
  );
}

function VaultNotesPanel({ profile }: { profile: VaultClientProfile }) {
  return (
    <RecordPanel title="Notes">
      <div className="grid gap-6 xl:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-zinc-950">Notes de relation</h3>
          <div className="mt-3"><LineList items={profile.relationshipNotes} /></div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-zinc-950">Points d’attention</h3>
          <div className="mt-3"><LineList items={profile.warnings} empty="Aucun point d’attention enregistré." /></div>
        </div>
      </div>
    </RecordPanel>
  );
}

function VaultTaskColumn({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-h-[180px] border border-zinc-200 bg-zinc-50 p-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
      </div>
      {children}
    </div>
  );
}

function VaultTasksPanel({ profile }: { profile: VaultClientProfile }) {
  return (
    <RecordPanel title="Tâches">
      <div className="grid gap-3 lg:grid-cols-3">
        <VaultTaskColumn title="À faire">
          {profile.nextStep ? (
            <article className="border border-zinc-200 bg-white p-3">
              <p className="text-sm font-semibold text-zinc-900">{profile.nextStep}</p>
            </article>
          ) : <p className="text-sm text-zinc-600">-</p>}
        </VaultTaskColumn>
        <VaultTaskColumn title="En cours"><p className="text-sm text-zinc-600">-</p></VaultTaskColumn>
        <VaultTaskColumn title="Fini"><p className="text-sm text-zinc-600">-</p></VaultTaskColumn>
      </div>
    </RecordPanel>
  );
}

function VaultBillingSummaryPanel() {
  return (
    <RecordPanel title="Montant facturé">
      <div className="grid gap-4 md:grid-cols-4">
        <div className="border-t border-zinc-200 py-4 md:col-span-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-600">Total TTC signé</p>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-zinc-950">-</p>
        </div>
        <div className="border-t border-zinc-200 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-600">Mensuel signé</p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-zinc-950">-</p>
        </div>
        <div className="border-t border-zinc-200 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-600">Pipeline</p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-zinc-950">-</p>
        </div>
      </div>
    </RecordPanel>
  );
}

function VaultDeliverablesPanel({ profile }: { profile: VaultClientProfile }) {
  return (
    <RecordPanel title="Livrables et accès">
      <div className="grid gap-6">
        {profile.websiteUrl ? (
          <div>
            <h3 className="text-sm font-semibold text-zinc-950">Sites</h3>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2"><AccessLink label="Production" href={profile.websiteUrl} /></div>
          </div>
        ) : null}
        <div>
          <h3 className="text-sm font-semibold text-zinc-950">Livrables</h3>
          <div className="mt-3"><LineList items={profile.deliveryTracks} empty="Aucun livrable renseigné." /></div>
        </div>
      </div>
    </RecordPanel>
  );
}

function VaultOnlyClientPage({ profile, clientError }: { profile: VaultClientProfile; clientError: string | null }) {
  const supabaseWriteError = supabaseServiceRoleConfigurationError();

  return (
    <div className="grid gap-7">
      <ClientHero
        name={profile.name}
        subtitle={profileStatusLabel(profile)}
        industry={profile.industry}
        websiteUrl={profile.websiteUrl}
        email={profile.primaryContactEmail}
        phone={profile.primaryContactPhone}
        backHref="/admin/lucid-os/clients"
        actions={(
          <Link href={`/admin/lucid-os/clients/${profile.slug}/edit`} className="inline-flex h-9 items-center justify-center gap-2 rounded bg-zinc-950 px-3 text-sm font-semibold text-white transition hover:bg-zinc-800">
            <Edit3 className="size-4" />
            Modifier
          </Link>
        )}
      >
        <StatusBadge tone={profile.status === 'active' ? 'good' : profile.status === 'lead' ? 'warning' : 'neutral'}>{statusLabel(profile.status)}</StatusBadge>
        <StatusBadge tone="neutral">source interne</StatusBadge>
      </ClientHero>
      <ActionErrorBanner message={clientError} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-start">
        <main className="grid gap-6">
          <VaultCompanyContactPanel profile={profile} />
          <VaultNotesPanel profile={profile} />
          <VaultTasksPanel profile={profile} />
          <VaultBillingSummaryPanel />
          <VaultDeliverablesPanel profile={profile} />
          <RecordPanel title="Documents">
            <VaultDocumentList documents={profile.documents} />
          </RecordPanel>
        </main>

        <aside className="grid gap-4 xl:sticky xl:top-5">
          <VaultEditPanel profile={profile} supabaseWriteError={supabaseWriteError} />
          <RecordPanel title="Sources internes">
            <SourceRefs profile={profile} />
          </RecordPanel>
        </aside>
      </div>
    </div>
  );
}

function ClientHero({
  name,
  subtitle,
  industry,
  websiteUrl,
  email,
  phone,
  backHref,
  actions,
  children,
}: {
  name: string;
  subtitle: string;
  industry: string | null;
  websiteUrl: string | null;
  email: string | null;
  phone: string | null;
  backHref: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}) {
  const websiteHref = externalHref(websiteUrl);

  return (
    <section className="border-b border-zinc-200 pb-5">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <Link href={backHref} className="mb-5 inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition hover:text-zinc-900">
            <ArrowLeft className="size-4" />
            Retour aux fiches clients
          </Link>
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-zinc-950 md:text-5xl">{name}</h1>
          <div className="mt-4 flex flex-wrap gap-2">{children}</div>
          <p className="mt-4 max-w-3xl text-sm leading-6 text-zinc-500">{subtitle}{industry ? ` / ${industry}` : ''}</p>
        </div>

        <div className="grid gap-3 text-sm text-zinc-600 lg:min-w-[300px]">
          {actions ? <div className="flex justify-start lg:justify-end">{actions}</div> : null}
          {email ? <a href={`mailto:${email}`} className="inline-flex min-w-0 items-center gap-2 truncate hover:text-zinc-900"><Mail className="size-4 text-zinc-400" /><span className="truncate">{email}</span></a> : null}
          {phone ? <span className="inline-flex min-w-0 items-center gap-2 truncate"><Phone className="size-4 text-zinc-400" /><span className="truncate">{phone}</span></span> : null}
          {websiteHref ? <a href={websiteHref} target="_blank" rel="noreferrer" className="inline-flex min-w-0 items-center gap-2 truncate hover:text-zinc-900"><Globe2 className="size-4 text-zinc-400" /><span className="truncate">{websiteUrl}</span><ExternalLink className="size-3.5 text-zinc-400" /></a> : null}
        </div>
      </div>
    </section>
  );
}

function AddContactForm({ client }: { client: LucidClientSummary }) {
  return (
    <form action={recordClientContactAction} className="grid gap-3">
      <HiddenClientFields client={client} />
      {textInput('Nom', 'full_name', 'Marie Dupont')}
      {textInput('Rôle', 'role', 'Direction, marketing, finance')}
      {textInput('Email', 'email', 'marie@client.fr', 'email')}
      {textInput('Téléphone', 'phone', '+33 6...')}
      {textInput('LinkedIn', 'linkedin_url', 'https://linkedin.com/in/...')}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
        <label className="grid gap-2 text-sm font-medium text-zinc-700">
          Influence
          <select name="influence_level" defaultValue="unknown" className={inputClassName}>
            <option value="unknown">Inconnue</option>
            <option value="low">Faible</option>
            <option value="medium">Moyenne</option>
            <option value="high">Élevée</option>
            <option value="champion">Champion</option>
            <option value="blocker">Bloquant</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium text-zinc-700">
          Statut
          <select name="contact_status" defaultValue="active" className={inputClassName}>
            <option value="active">Actif</option>
            <option value="inactive">Inactif</option>
            <option value="left_company">A quitté l’entreprise</option>
            <option value="archived">Archivé</option>
          </select>
        </label>
      </div>
      <div className="flex flex-wrap gap-4 text-sm font-medium text-zinc-700">
        <label className="inline-flex items-center gap-2"><input name="is_primary" type="checkbox" className="size-4 rounded border-zinc-300" />Contact principal</label>
        <label className="inline-flex items-center gap-2"><input name="is_decision_maker" type="checkbox" className="size-4 rounded border-zinc-300" />Décisionnaire</label>
      </div>
      {textareaInput('Notes', 'notes', 'Contexte relationnel, préférences, objections...', 3)}
      <div className="flex justify-end"><ActionButton icon={Contact}>Ajouter le contact</ActionButton></div>
    </form>
  );
}

function AddOpportunityForm({ client, contacts }: { client: LucidClientSummary; contacts: Array<{ id: string; fullName: string }> }) {
  return (
    <form action={recordClientOpportunityAction} className="grid gap-3">
      <HiddenClientFields client={client} />
      {textInput('Titre', 'title', 'Système de génération de leads IA')}
      <label className="grid gap-2 text-sm font-medium text-zinc-700">
        Contact principal
        <select name="primary_contact_id" defaultValue="" className={inputClassName}>
          <option value="">Aucun</option>
          {contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.fullName}</option>)}
        </select>
      </label>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
        <label className="grid gap-2 text-sm font-medium text-zinc-700">
          Étape
          <select name="stage" defaultValue="discovery" className={inputClassName}>
            <option value="new">Nouveau</option>
            <option value="qualified">Qualifié</option>
            <option value="discovery">Découverte</option>
            <option value="proposal_needed">Proposition à préparer</option>
            <option value="proposal_sent">Proposition envoyée</option>
            <option value="negotiation">Négociation</option>
            <option value="won">Gagné</option>
            <option value="lost">Perdu</option>
            <option value="paused">En pause</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium text-zinc-700">
          Statut
          <select name="opportunity_status" defaultValue="open" className={inputClassName}>
            <option value="open">Ouvert</option>
            <option value="won">Gagné</option>
            <option value="lost">Perdu</option>
            <option value="paused">En pause</option>
            <option value="archived">Archivé</option>
          </select>
        </label>
      </div>
      <label className="grid gap-2 text-sm font-medium text-zinc-700">
        Offre
        <select name="offer_type" defaultValue="custom" className={inputClassName}>
          <option value="managed_website">Site web géré</option>
          <option value="website_database">Site web + base de données</option>
          <option value="ai_automation">Automatisation IA</option>
          <option value="ai_agent">Agent IA</option>
          <option value="custom_app">Application sur mesure</option>
          <option value="retainer">Récurrent</option>
          <option value="audit">Audit</option>
          <option value="custom">Sur mesure</option>
        </select>
      </label>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
        {textInput('Prévision EUR', 'value_estimate_eur', '5000', 'number')}
        {textInput('Probabilité %', 'probability_percent', '40', 'number')}
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
        {textInput('Setup EUR', 'setup_value_eur', '3000', 'number')}
        {textInput('Mensuel EUR', 'monthly_value_eur', '500', 'number')}
      </div>
      {textInput('Clôture prévue', 'expected_close_at', undefined, 'datetime-local')}
      {textInput('Prochaine étape', 'next_step', 'Envoyer la proposition')}
      {textInput('Échéance prochaine étape', 'next_step_due_at', undefined, 'datetime-local')}
      {textareaInput('Notes', 'notes', 'Contexte commercial, objections, critères d’achat...', 3)}
      <div className="flex justify-end"><ActionButton icon={BriefcaseBusiness}>Ajouter l’opportunité</ActionButton></div>
    </form>
  );
}

function AddTaskForm({ client, contacts, opportunities }: { client: LucidClientSummary; contacts: Array<{ id: string; fullName: string }>; opportunities: Array<{ id: string; title: string }> }) {
  return (
    <form action={recordClientTaskAction} className="grid gap-3">
      <HiddenClientFields client={client} />
      {textInput('Titre', 'title', 'Relancer avec la proposition')}
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-1">
        <label className="grid gap-2 text-sm font-medium text-zinc-700">
          Statut
          <select name="task_status" defaultValue="todo" className={inputClassName}>
            <option value="todo">À faire</option>
            <option value="in_progress">En cours</option>
            <option value="waiting">En attente</option>
            <option value="done">Fait</option>
            <option value="cancelled">Annulé</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium text-zinc-700">
          Priorité
          <select name="priority" defaultValue="normal" className={inputClassName}>
            <option value="low">Basse</option>
            <option value="normal">Normal</option>
            <option value="high">Haute</option>
            <option value="urgent">Urgent</option>
          </select>
        </label>
      </div>
      <label className="grid gap-2 text-sm font-medium text-zinc-700">
        Contact
        <select name="contact_id" defaultValue="" className={inputClassName}>
          <option value="">Aucun</option>
          {contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.fullName}</option>)}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-medium text-zinc-700">
        Opportunité
        <select name="opportunity_id" defaultValue="" className={inputClassName}>
          <option value="">Aucune</option>
          {opportunities.map((opportunity) => <option key={opportunity.id} value={opportunity.id}>{opportunity.title}</option>)}
        </select>
      </label>
      {textInput('Responsable', 'owner_label', 'Jules, Anthony, Theo')}
      {textInput('Échéance', 'due_at', undefined, 'datetime-local')}
      {textareaInput('Description', 'description', 'Ce qui doit être fait et le contexte utile...', 3)}
      <div className="flex justify-end"><ActionButton icon={CheckSquare}>Ajouter la tâche</ActionButton></div>
    </form>
  );
}

function CreateDocumentForm({ client, contacts, opportunities, defaultPricingModel }: { client: LucidClientSummary; contacts: Array<{ id: string; fullName: string; email: string | null; isPrimary: boolean }>; opportunities: Array<{ id: string; title: string }>; defaultPricingModel: string }) {
  return (
    <form action={createBonDeCommandeDraftAction} className="grid gap-3">
      <HiddenClientFields client={client} />
      <label className="grid gap-2 text-sm font-medium text-zinc-700">
        Opportunité
        <select name="opportunity_id" defaultValue={opportunities[0]?.id ?? ''} className={inputClassName}>
          <option value="">Sélectionner une opportunité</option>
          {opportunities.map((opportunity) => <option key={opportunity.id} value={opportunity.id}>{opportunity.title}</option>)}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-medium text-zinc-700">
        Signataire
        <select name="contact_id" defaultValue={contacts.find((contact) => contact.isPrimary)?.id ?? contacts[0]?.id ?? ''} className={inputClassName}>
          <option value="">Utiliser le contact principal</option>
          {contacts.map((contact) => <option key={contact.id} value={contact.id}>{contact.fullName}{contact.email ? ` - ${contact.email}` : ''}</option>)}
        </select>
      </label>
      <label className="grid gap-2 text-sm font-medium text-zinc-700">
        Modèle de prix
        <select name="pricing_model" defaultValue={defaultPricingModel} className={inputClassName}>
          <option value="one_shot">One-shot</option>
          <option value="monthly">Mensuel 12 mois</option>
        </select>
      </label>
      {textInput('ID du dossier Google Drive', 'google_drive_folder_id', 'ID de dossier optionnel')}
      <label className="grid gap-2 text-sm font-medium text-zinc-700">
        Raison sociale du client
        <input name="client_legal_name" defaultValue={client.legalName ?? client.name} className={inputClassName} placeholder="Raison sociale" />
      </label>
      <label className="grid gap-2 text-sm font-medium text-zinc-700">
        SIRET du client
        <input name="client_siret" defaultValue={client.siret ?? ''} className={inputClassName} placeholder="123 456 789 00010" />
      </label>
      <label className="grid gap-2 text-sm font-medium text-zinc-700">
        Adresse du client
        <input name="client_billing_address" defaultValue={client.billingAddress ?? ''} className={inputClassName} placeholder="Adresse complete du client" />
      </label>
      {textareaInput('Périmètre de la prestation', 'scope_perimeter', 'Périmètre, systèmes, automatisations, intégrations...', 4)}
      {textareaInput('Description synthétique', 'synthetic_description', 'Contexte, objectifs et fonctionnement prévu...', 4)}
      {textareaInput('Livrables attendus', 'deliverables', 'Livrables, formation, documentation...', 3)}
      {textareaInput('Calendrier', 'calendar_timeline', 'Semaine 1 : ...\nSemaine 2 : ...', 3)}
      {textareaInput('Prochaines étapes', 'next_steps', 'Accès, validation, signature, premier paiement...', 3)}
      <div className="flex justify-end"><ActionButton icon={FileText}>Créer le brouillon</ActionButton></div>
    </form>
  );
}

function CompanyContactPanel({ client, contacts }: { client: LucidClientSummary; contacts: Array<{ fullName: string; role: string | null; email: string | null; phone: string | null; isPrimary: boolean }> }) {
  const primaryContact = contacts.find((contact) => contact.isPrimary) ?? contacts[0] ?? null;
  const contactName = primaryContact?.fullName ?? client.primaryContactName;
  const contactEmail = primaryContact?.email ?? client.primaryContactEmail;
  const contactPhone = primaryContact?.phone ?? client.primaryContactPhone;
  const registrationNumber = client.siret ?? client.siren ?? '';

  return (
    <RecordPanel title="Contact et entreprise">
      <div id="company" className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,0.9fr)]">
        <dl>
          <FieldRow label="Raison sociale" value={fallbackValue(client.legalName ?? client.name)} />
          <FieldRow label="SIREN" value={fallbackValue(client.siren)} />
          <FieldRow label="SIRET" value={fallbackValue(client.siret)} />
          <FieldRow label="Adresse" value={fallbackValue(client.billingAddress)} />
          <FieldRow label="Activité" value={fallbackValue(client.nafLabel ?? client.industry)} />
          <FieldRow label="Site" value={client.websiteUrl ? <a href={externalHref(client.websiteUrl) ?? client.websiteUrl} target="_blank" rel="noreferrer" className="underline-offset-4 hover:text-zinc-900 hover:underline">{client.websiteUrl}</a> : '-'} />
        </dl>
        <dl>
          <FieldRow label="Contact" value={fallbackValue(contactName)} />
          <FieldRow label="Rôle" value={fallbackValue(primaryContact?.role)} />
          <FieldRow label="Email" value={contactEmail ? <a href={`mailto:${contactEmail}`} className="underline-offset-4 hover:text-zinc-900 hover:underline">{contactEmail}</a> : '-'} />
          <FieldRow label="Téléphone" value={fallbackValue(contactPhone)} />
          <FieldRow label="Statut entreprise" value={fallbackValue(client.companyStatus)} />
          <FieldRow label="Dernière récup." value={formatAdminDateTime(client.legalLastFetchedAt)} />
        </dl>
      </div>

      <div className="mt-5 grid gap-4 border-t border-zinc-200 pt-5 xl:grid-cols-[minmax(260px,0.8fr)_minmax(0,1.2fr)]">
        <form action={fetchClientCompanyInfoAction} className="grid content-start gap-3">
          <HiddenClientFields client={client} />
          <label className="grid gap-2 text-sm font-medium text-zinc-700">
            SIREN ou SIRET
            <input name="registration_number" defaultValue={registrationNumber} className={inputClassName} placeholder="9 ou 14 chiffres" />
          </label>
          <ActionButton icon={DatabaseZap}>Récupérer l’entreprise</ActionButton>
        </form>

        <details className="group border border-zinc-200 bg-zinc-50 p-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-zinc-900 [&::-webkit-details-marker]:hidden">
            Modifier les informations
            <Plus className="size-4 text-zinc-600 transition group-open:rotate-45" />
          </summary>
          <form action={updateClientCompanyInfoAction} className="mt-4 grid gap-3 md:grid-cols-2">
            <HiddenClientFields client={client} />
            <label className="grid gap-2 text-sm font-medium text-zinc-700">Raison sociale<input name="legal_name" defaultValue={client.legalName ?? ''} className={inputClassName} /></label>
            <label className="grid gap-2 text-sm font-medium text-zinc-700">SIREN/SIRET<input name="registration_number" defaultValue={registrationNumber} className={inputClassName} /></label>
            <label className="grid gap-2 text-sm font-medium text-zinc-700 md:col-span-2">Adresse<input name="billing_address" defaultValue={client.billingAddress ?? ''} className={inputClassName} /></label>
            <label className="grid gap-2 text-sm font-medium text-zinc-700">Activité<input name="industry" defaultValue={client.industry ?? ''} className={inputClassName} /></label>
            <label className="grid gap-2 text-sm font-medium text-zinc-700">Site<input name="website_url" defaultValue={client.websiteUrl ?? ''} className={inputClassName} /></label>
            <label className="grid gap-2 text-sm font-medium text-zinc-700">Contact principal<input name="primary_contact_name" defaultValue={client.primaryContactName ?? primaryContact?.fullName ?? ''} className={inputClassName} /></label>
            <label className="grid gap-2 text-sm font-medium text-zinc-700">Email<input name="primary_contact_email" defaultValue={client.primaryContactEmail ?? primaryContact?.email ?? ''} className={inputClassName} /></label>
            <label className="grid gap-2 text-sm font-medium text-zinc-700">Téléphone<input name="primary_contact_phone" defaultValue={client.primaryContactPhone ?? primaryContact?.phone ?? ''} className={inputClassName} /></label>
            <div className="flex items-end justify-end md:col-span-2"><ActionButton icon={Edit3}>Enregistrer</ActionButton></div>
          </form>
        </details>
      </div>
    </RecordPanel>
  );
}

function SmartNotesPanel({ client, imports, interactions }: { client: LucidClientSummary; imports: LucidClientImportSummary[]; interactions: Array<{ id: string; interactionType: string; summary: string; notes: string | null; occurredAt: string; sentiment: LucidInteractionSentiment }> }) {
  return (
    <RecordPanel title="Notes">
      <details className="group border border-zinc-200 bg-zinc-50 p-4">
        <summary className="flex cursor-pointer list-none items-center justify-between gap-3 text-sm font-semibold text-zinc-900 [&::-webkit-details-marker]:hidden">
          Ajouter une note IA
          <Plus className="size-4 text-zinc-600 transition group-open:rotate-45" />
        </summary>
        <form action={recordClientSmartNoteAction} className="mt-4 grid gap-3">
          <HiddenClientFields client={client} />
          <div className="grid gap-3 md:grid-cols-[220px_1fr]">
            <label className="grid gap-2 text-sm font-medium text-zinc-700">Titre<input name="title" defaultValue="Note de call" className={inputClassName} /></label>
            <label className="grid gap-2 text-sm font-medium text-zinc-700">Lien source<input name="source_uri" className={inputClassName} placeholder="TidyCal, Meet, email, fichier..." /></label>
          </div>
          <input type="hidden" name="source_type" value="meeting_notes" />
          <label className="grid gap-2 text-sm font-medium text-zinc-700">
            Note brute
            <textarea name="raw_content" rows={7} required className={textareaClassName} placeholder="Colle les notes de call. L’agent extrait le résumé, le contact et la prochaine tâche quand il les trouve." />
          </label>
          <div className="flex justify-end"><ActionButton icon={MessageSquare}>Analyser et ajouter</ActionButton></div>
        </form>
      </details>

      <div id="notes" className="mt-5 grid gap-6 xl:grid-cols-2">
        <div>
          <h3 className="text-sm font-semibold text-zinc-950">Sources</h3>
          <div className="mt-3"><ImportList imports={imports} /></div>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-zinc-950">Historique</h3>
          {interactions.length === 0 ? <p className="mt-3 text-sm text-zinc-600">Aucune note pour le moment.</p> : (
            <div className="mt-3 divide-y divide-zinc-100">
              {interactions.slice(0, 6).map((interaction) => (
                <article key={interaction.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge tone="neutral">{statusLabel(interaction.interactionType)}</StatusBadge>
                    <StatusBadge tone={sentimentTone(interaction.sentiment)}>{statusLabel(interaction.sentiment)}</StatusBadge>
                    <p className="text-sm text-zinc-600">{formatAdminDateTime(interaction.occurredAt)}</p>
                  </div>
                  <p className="mt-2 text-sm font-medium text-zinc-900">{interaction.summary}</p>
                  {interaction.notes ? <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-500">{interaction.notes}</p> : null}
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </RecordPanel>
  );
}

function TasksPanel({ client, contacts, opportunities, tasks }: { client: LucidClientSummary; contacts: Array<{ id: string; fullName: string }>; opportunities: Array<{ id: string; title: string }>; tasks: LucidClientTaskSummary[] }) {
  return (
    <RecordPanel title="Tâches">
      <div id="tasks" className="grid gap-4">
        <div className="border border-zinc-200 bg-zinc-50 p-4">
          <h3 className="mb-4 text-sm font-semibold text-zinc-950">Créer une tâche</h3>
          <AddTaskForm client={client} contacts={contacts} opportunities={opportunities} />
        </div>
        <ClientTaskBoard clientId={client.id} clientSlug={client.slug} tasks={tasks} />
      </div>
    </RecordPanel>
  );
}

function BillingSummaryPanel({ documents, opportunities }: { documents: LucidClientDocumentSummary[]; opportunities: Array<{ status: string; stage: string; valueEstimateEur: number | null; setupValueEur: number | null; monthlyValueEur: number | null }> }) {
  const signedDocuments = documents.filter((document) => document.status === 'signed' || document.status === 'archived');
  const billedHt = signedDocuments.reduce((total, document) => total + (document.amountHtEur ?? 0), 0);
  const billedTtc = signedDocuments.reduce((total, document) => total + (document.amountTtcEur ?? document.amountHtEur ?? 0), 0);
  const billedMonthly = signedDocuments.reduce((total, document) => total + (document.monthlyAmountEur ?? 0), 0);
  const pipeline = opportunities
    .filter((opportunity) => opportunity.status === 'open' || opportunity.stage === 'won')
    .reduce((total, opportunity) => total + (opportunity.valueEstimateEur ?? opportunity.setupValueEur ?? 0), 0);

  return (
    <RecordPanel title="Montant facturé">
      <div className="grid gap-4 md:grid-cols-4">
        <div className="border-t border-zinc-200 py-4 md:col-span-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-600">Total TTC signé</p>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-zinc-950">{formatMoney(billedTtc)}</p>
          <p className="mt-1 text-sm text-zinc-600">HT {formatMoney(billedHt)}</p>
        </div>
        <div className="border-t border-zinc-200 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-600">Mensuel signé</p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-zinc-950">{formatMoney(billedMonthly)}</p>
        </div>
        <div className="border-t border-zinc-200 py-4">
          <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-600">Pipeline</p>
          <p className="mt-2 text-2xl font-semibold tracking-[-0.03em] text-zinc-950">{formatMoney(pipeline)}</p>
        </div>
      </div>
    </RecordPanel>
  );
}

function AccessLink({ label, href }: { label: string; href: string | null }) {
  if (!href) return null;
  const resolvedHref = externalHref(href);
  if (!resolvedHref) return null;

  return (
    <a href={resolvedHref} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-sm text-zinc-700 underline-offset-4 hover:text-zinc-950 hover:underline">
      <ExternalLink className="size-3.5 text-zinc-400" />
      {label}
    </a>
  );
}

function DeliverablesPanel({
  projects,
  websites,
  databases,
  deployments,
  integrations,
}: {
  projects: LucidProjectSummary[];
  websites: LucidWebsiteSummary[];
  databases: LucidDatabaseSummary[];
  deployments: LucidDeploymentSummary[];
  integrations: LucidIntegrationSummary[];
}) {
  const hasDeliveryData = projects.length > 0 || websites.length > 0 || databases.length > 0 || deployments.length > 0 || integrations.length > 0;

  return (
    <RecordPanel title="Livrables et accès">
      {!hasDeliveryData ? <EmptyState>Aucun livrable ou accès n’est encore renseigné.</EmptyState> : (
        <div className="grid gap-6">
          {projects.length > 0 ? (
            <div>
              <h3 className="text-sm font-semibold text-zinc-950">Projets</h3>
              <div className="mt-3 divide-y divide-zinc-100">
                {projects.map((project) => (
                  <article key={project.id} className="grid gap-2 py-3 first:pt-0 last:pb-0 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
                    <div><p className="font-medium text-zinc-900">{project.name}</p>{project.summary ? <p className="mt-1 text-sm text-zinc-500">{project.summary}</p> : null}</div>
                    <StatusBadge tone={projectTone(project.status)}>{statusLabel(project.status)}</StatusBadge>
                  </article>
                ))}
              </div>
            </div>
          ) : null}

          {websites.length > 0 ? (
            <div>
              <h3 className="text-sm font-semibold text-zinc-950">Sites</h3>
              <div className="mt-3 divide-y divide-zinc-100">
                {websites.map((website) => (
                  <article key={website.id} className="grid gap-2 py-3 first:pt-0 last:pb-0 md:grid-cols-[minmax(0,1fr)_auto] md:items-start">
                    <div>
                      <p className="font-medium text-zinc-900">{website.name}</p>
                      <p className="mt-1 text-sm text-zinc-600">{website.hostingProvider}{website.primaryDomain ? ` / ${website.primaryDomain}` : ''}</p>
                      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
                        <AccessLink label="Production" href={website.productionUrl ?? website.primaryDomain} />
                        <AccessLink label="Preview" href={website.previewUrl} />
                        <AccessLink label="Repo" href={website.repositoryUrl} />
                      </div>
                    </div>
                    <StatusBadge tone={websiteTone(website.status)}>{statusLabel(website.status)}</StatusBadge>
                  </article>
                ))}
              </div>
            </div>
          ) : null}

          {databases.length > 0 || deployments.length > 0 || integrations.length > 0 ? (
            <div className="grid gap-6 xl:grid-cols-3">
              <div>
                <h3 className="text-sm font-semibold text-zinc-950">Bases</h3>
                <div className="mt-3 divide-y divide-zinc-100">
                  {databases.length === 0 ? <p className="text-sm text-zinc-600">-</p> : databases.map((database) => (
                    <div key={database.id} className="py-3 first:pt-0 last:pb-0">
                      <p className="font-medium text-zinc-900">{database.name}</p>
                      <p className="mt-1 text-sm text-zinc-600">{database.provider} / {statusLabel(database.status)}</p>
                      {database.externalRef ? <p className="mt-1 break-all text-sm text-zinc-400">{database.externalRef}</p> : null}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-950">Déploiements</h3>
                <div className="mt-3 divide-y divide-zinc-100">
                  {deployments.length === 0 ? <p className="text-sm text-zinc-600">-</p> : deployments.map((deployment) => (
                    <div key={deployment.id} className="py-3 first:pt-0 last:pb-0">
                      <p className="font-medium text-zinc-900">{deployment.provider} / {deployment.environment}</p>
                      <p className="mt-1 text-sm text-zinc-600">{statusLabel(deployment.status)}{deployment.branch ? ` / ${deployment.branch}` : ''}</p>
                      <div className="mt-2"><AccessLink label="Ouvrir" href={deployment.deploymentUrl} /></div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-zinc-950">Intégrations</h3>
                <div className="mt-3 divide-y divide-zinc-100">
                  {integrations.length === 0 ? <p className="text-sm text-zinc-600">-</p> : integrations.map((integration) => (
                    <div key={integration.id} className="py-3 first:pt-0 last:pb-0">
                      <p className="font-medium text-zinc-900">{integration.name}</p>
                      <p className="mt-1 text-sm text-zinc-600">{integration.provider} / {statusLabel(integration.status)}</p>
                      <div className="mt-2"><AccessLink label="Accès" href={integration.docsUrl} /></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </RecordPanel>
  );
}

function DocumentsPanel({ client, documents, vaultProfile }: { client: LucidClientSummary; documents: LucidClientDocumentSummary[]; vaultProfile: VaultClientProfile | null }) {
  return (
    <RecordPanel title="Documents" description="Documents commerciaux, statut DocuSeal, fichiers Drive et références de proposition.">
      <div className="grid gap-6">
        {documents.length === 0 ? (
          <EmptyState>Aucun document Lucid OS généré pour le moment.</EmptyState>
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
                  <p className="mt-1 text-sm text-zinc-600">{document.documentNumber ?? 'Sans numéro'} / {formatAdminDateTime(document.createdAt)}</p>
                  <div className="mt-3 grid gap-2 text-sm text-zinc-600 md:grid-cols-3">
                    <span>HT: {formatMoney(document.amountHtEur)}</span>
                    <span>TVA: {formatMoney(document.vatAmountEur)}</span>
                    <span>TTC: {formatMoney(document.amountTtcEur)}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-sm text-zinc-600">
                    {document.docusealSubmissionUrl ? <a href={document.docusealSubmissionUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline-offset-4 hover:text-zinc-900 hover:underline"><ExternalLink className="size-4 text-zinc-400" />DocuSeal</a> : null}
                    {document.docusealCombinedDocumentUrl ? <a href={document.docusealCombinedDocumentUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline-offset-4 hover:text-zinc-900 hover:underline"><FileCheck2 className="size-4 text-zinc-400" />PDF signé</a> : null}
                    {document.docusealAuditLogUrl ? <a href={document.docusealAuditLogUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline-offset-4 hover:text-zinc-900 hover:underline"><ExternalLink className="size-4 text-zinc-400" />Journal d’audit</a> : null}
                    {document.googleDriveFolderId ? <a href={`https://drive.google.com/drive/folders/${document.googleDriveFolderId}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 underline-offset-4 hover:text-zinc-900 hover:underline"><FolderOpen className="size-4 text-zinc-400" />Dossier Drive</a> : null}
                  </div>
                  {document.validationErrors.length > 0 ? (
                    <div className="mt-3 border border-amber-200 bg-amber-50 px-3 py-2 text-sm leading-6 text-amber-700">
                      {document.validationErrors.map((issue) => <p key={`${document.id}-${issue.code}-${issue.field}`}>{issue.severity}: {issue.message}</p>)}
                    </div>
                  ) : null}
                  <div className="mt-3 flex flex-wrap justify-end gap-2">
                    {canSend ? (
                      <form action={sendBonDeCommandeForSignatureAction}>
                        <HiddenClientFields client={client} />
                        <input type="hidden" name="document_id" value={document.id} />
                        <ActionButton icon={FileText}>Envoyer le BDC</ActionButton>
                      </form>
                    ) : null}
                    {canRefreshDocuSeal ? (
                      <form action={refreshDocuSealDocumentStatusAction}>
                        <HiddenClientFields client={client} />
                        <input type="hidden" name="document_id" value={document.id} />
                        <button type="submit" className="inline-flex h-9 items-center justify-center gap-2 rounded border border-zinc-200 bg-zinc-50 px-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100">
                          <RefreshCw className="size-4" /> Actualiser
                        </button>
                      </form>
                    ) : null}
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {vaultProfile ? (
          <div className="border-t border-zinc-200 pt-5">
            <h3 className="text-sm font-semibold text-zinc-950">Références internes</h3>
            <div className="mt-4"><VaultDocumentList documents={vaultProfile.documents} /></div>
          </div>
        ) : null}
      </div>
    </RecordPanel>
  );
}

function ImportList({ imports }: { imports: LucidClientImportSummary[] }) {
  if (imports.length === 0) return <EmptyState>Aucune source n’a encore été importée.</EmptyState>;

  return (
    <div className="divide-y divide-zinc-100">
      {imports.map((sourceImport) => (
        <article key={sourceImport.id} className="py-4 first:pt-0 last:pb-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-zinc-950">{sourceImport.title}</p>
            <StatusBadge tone={sourceImport.status === 'processed' ? 'good' : sourceImport.status === 'needs_review' ? 'warning' : 'neutral'}>{statusLabel(sourceImport.status)}</StatusBadge>
            {sourceImport.indexedAsKnowledge ? <StatusBadge tone="good">indexé</StatusBadge> : null}
          </div>
          <p className="mt-1 text-sm text-zinc-600">{sourceImport.sourceType} / {formatAdminDateTime(sourceImport.createdAt)}</p>
          {sourceImport.extractedSummary ? <p className="mt-2 line-clamp-2 text-sm leading-6 text-zinc-400">{sourceImport.extractedSummary}</p> : null}
          <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-zinc-600">{sourceImport.rawContentPreview}</p>
        </article>
      ))}
    </div>
  );
}

type ClientDetailSearchParams = {
  document_error?: string | string[];
  client_error?: string | string[];
};

function firstSearchParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

export default async function LucidClientDetailPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams?: Promise<ClientDetailSearchParams> }) {
  const { slug } = await params;
  const resolvedSlug = decodeURIComponent(slug);
  const vaultProfile = getVaultClientProfile(resolvedSlug);
  const client = await getLucidClientBySlug(resolvedSlug);

  if (!client) {
    if (!vaultProfile) notFound();
    const resolvedSearchParams = searchParams ? await searchParams : {};
    return <VaultOnlyClientPage profile={vaultProfile} clientError={firstSearchParam(resolvedSearchParams.client_error)} />;
  }

  // Opening a prospect clears its "New" badge (first view only).
  if (!client.openedAt) {
    await markLucidClientOpened(client.id);
  }

  const resolvedSearchParams = searchParams ? await searchParams : {};
  const documentError = firstSearchParam(resolvedSearchParams.document_error);
  const clientError = firstSearchParam(resolvedSearchParams.client_error);
  const [contacts, opportunities, documents, interactions, tasks, imports, projects, websites, databases, deployments, integrations] = await Promise.all([
    listLucidClientContactsForClient(client.id, 50),
    listLucidClientOpportunitiesForClient(client.id, 50),
    listLucidClientDocumentsForClient(client.id, 25),
    listLucidClientInteractionsForClient(client.id, 50),
    listLucidClientTasksForClient(client.id, 50),
    listLucidClientImportsForClient(client.id, 25),
    listLucidProjectsForClient(client.id, 25),
    listLucidWebsitesForClient(client.id, 25),
    listLucidDatabasesForClient(client.id, 25),
    listLucidDeploymentsForClient(client.id, 25),
    listLucidIntegrationsForClient(client.id, 25),
  ]);
  const defaultPricingModel = opportunities[0]?.monthlyValueEur ? 'monthly' : 'one_shot';

  return (
    <div className="grid gap-7">
      <ClientHero
        name={client.name}
        subtitle={client.healthSummary ?? vaultProfile?.healthSummary ?? 'Fiche client'}
        industry={client.industry ?? vaultProfile?.industry ?? null}
        websiteUrl={client.websiteUrl ?? vaultProfile?.websiteUrl ?? null}
        email={client.primaryContactEmail ?? vaultProfile?.primaryContactEmail ?? null}
        phone={client.primaryContactPhone ?? vaultProfile?.primaryContactPhone ?? null}
        backHref="/admin/lucid-os/clients"
        actions={(
          <Link href={`/admin/lucid-os/clients/${client.slug}/edit`} className="inline-flex h-9 items-center justify-center gap-2 rounded bg-zinc-950 px-3 text-sm font-semibold text-white transition hover:bg-zinc-800">
            <Edit3 className="size-4" />
            Modifier
          </Link>
        )}
      >
        <StatusBadge tone={client.status === 'active' ? 'good' : client.status === 'lead' ? 'warning' : 'neutral'}>{statusLabel(client.status)}</StatusBadge>
        <StatusBadge tone={clientHealthTone(client.clientHealthStatus)}>{statusLabel(client.clientHealthStatus)}</StatusBadge>
        {vaultProfile ? <StatusBadge tone="neutral">note interne</StatusBadge> : null}
      </ClientHero>
      <ActionErrorBanner message={clientError} />

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_380px] xl:items-start">
        <main className="grid gap-6">
          <CompanyContactPanel client={client} contacts={contacts} />
          <SmartNotesPanel client={client} imports={imports} interactions={interactions} />
          <TasksPanel client={client} contacts={contacts} opportunities={opportunities} tasks={tasks} />
          <BillingSummaryPanel documents={documents} opportunities={opportunities} />
          <DeliverablesPanel projects={projects} websites={websites} databases={databases} deployments={deployments} integrations={integrations} />
          <DocumentsPanel client={client} documents={documents} vaultProfile={vaultProfile} />
        </main>

        <aside className="grid gap-4 xl:sticky xl:top-5">
          <RecordPanel title="Modifier le compte">
            <div className="grid gap-4">
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-600">Statut</p>
                <InlineSelectForm
                  action={updateClientStatusAndLifecycleAction}
                  name="status"
                  defaultValue={client.status}
                  clientArgs={{ id: client.id, slug: client.slug }}
                  options={[
                    { value: 'lead', label: 'Prospect' },
                    { value: 'active', label: 'Actif' },
                    { value: 'paused', label: 'En pause' },
                    { value: 'offboarded', label: 'Terminé' },
                    { value: 'archived', label: 'Archivé' },
                  ]}
                />
              </div>
              <div>
                <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-zinc-600">Cycle de vie</p>
                <InlineSelectForm
                  action={updateClientStatusAndLifecycleAction}
                  name="lifecycle_stage"
                  defaultValue={client.lifecycleStage}
                  clientArgs={{ id: client.id, slug: client.slug }}
                  options={[
                    { value: 'lead', label: 'Prospect' },
                    { value: 'qualified', label: 'Qualifié' },
                    { value: 'meeting_booked', label: 'Rdv planifié' },
                    { value: 'discovery_done', label: 'Découverte faite' },
                    { value: 'proposal_needed', label: 'Proposition à préparer' },
                    { value: 'proposal_sent', label: 'Proposition envoyée' },
                    { value: 'negotiation', label: 'Négociation' },
                    { value: 'won', label: 'Gagné' },
                    { value: 'lost', label: 'Perdu' },
                    { value: 'onboarding', label: 'Onboarding' },
                    { value: 'in_delivery', label: 'En production' },
                    { value: 'live_managed', label: 'En ligne / géré' },
                    { value: 'success_retention', label: 'Succès / rétention' },
                    { value: 'expansion_opportunity', label: 'Opportunité d’expansion' },
                    { value: 'archived', label: 'Archivé' },
                  ]}
                />
              </div>
              <div className="grid gap-2 border-t border-zinc-200 pt-4">
                <Link href={`/admin/lucid-os/clients/${client.slug}/edit`} className="inline-flex h-9 items-center justify-center gap-2 rounded border border-zinc-200 bg-zinc-50 px-3 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100">
                  <Edit3 className="size-4" />
                  Modifier toute la fiche
                </Link>
                <DeleteClientForm clientId={client.id} clientSlug={client.slug} clientName={client.name} />
              </div>
            </div>
          </RecordPanel>

          {documentError ? (
            <div className="border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              <p className="font-medium text-rose-700">Échec d’envoi du document</p>
              <p className="mt-1 break-words">{documentError}</p>
            </div>
          ) : null}

          <RecordPanel title="Saisie rapide">
            <FoldoutForm title="Ajouter un contact" icon={Contact}><AddContactForm client={client} /></FoldoutForm>
            <FoldoutForm title="Ajouter une opportunité" icon={BriefcaseBusiness}><AddOpportunityForm client={client} contacts={contacts} /></FoldoutForm>
            <FoldoutForm title="Générer un BDC" icon={FileText}><CreateDocumentForm client={client} contacts={contacts} opportunities={opportunities} defaultPricingModel={defaultPricingModel} /></FoldoutForm>
          </RecordPanel>

          {vaultProfile ? (
            <RecordPanel title="Sources internes">
              <SourceRefs profile={vaultProfile} />
            </RecordPanel>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
