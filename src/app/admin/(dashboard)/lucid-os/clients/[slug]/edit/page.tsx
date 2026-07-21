import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { getVaultClientProfile, type VaultClientProfile } from '@/lib/admin/client-vault-profiles';
import { getLucidClientBySlug, type LucidClientSummary } from '@/lib/admin/lucid-os';
import { LucidOsHeader, Section } from '../../../components';
import { ClientIntakeForm } from '../../ClientIntakeForm';
import { DeleteClientForm } from '../../DeleteClientForm';
import { adminBasePath } from '@/lib/admin/auth';

export const dynamic = 'force-dynamic';

type EditClientSearchParams = {
  client_error?: string | string[];
};

function firstSearchParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function ActionErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;

  return (
    <div className="border border-rose-400/25 bg-rose-500/10 px-4 py-3 text-sm leading-6 text-rose-100">
      {message}
    </div>
  );
}

function clientFromVaultProfile(profile: VaultClientProfile): LucidClientSummary {
  const now = new Date().toISOString();

  return {
    id: '',
    name: profile.name,
    slug: profile.slug,
    status: profile.status,
    lifecycleStage: profile.status === 'active' ? 'won' : 'lead',
    ownerLabel: null,
    clientHealthStatus: 'unknown',
    healthScore: null,
    healthSummary: profile.healthSummary,
    nextAction: profile.nextStep,
    nextActionDueAt: null,
    lastContactedAt: null,
    openedAt: null,
    industry: profile.industry,
    websiteUrl: profile.websiteUrl,
    legalName: profile.name,
    siren: null,
    siret: null,
    billingAddress: null,
    nafCode: null,
    nafLabel: null,
    companyStatus: null,
    employeeRange: null,
    legalLastFetchedAt: null,
    firstName: null,
    lastName: null,
    primaryContactName: profile.primaryContactName,
    primaryContactEmail: profile.primaryContactEmail,
    primaryContactPhone: profile.primaryContactPhone,
    notes: profile.healthSummary ?? profile.desiredOutcome,
    tools: profile.deliveryTracks,
    billingPlanName: null,
    billingPlanTier: null,
    intake: {
      stage: profile.intakeStage,
      meetingStatus: profile.meetingStatus,
      meetingBookedAt: null,
      meetingDoneAt: null,
      meetingNotes: profile.relationshipNotes.join('\n'),
      desiredOutcome: profile.desiredOutcome,
      budgetRange: profile.budgetRange,
      timeline: profile.timeline,
      nextStep: profile.nextStep,
      source: profile.source,
      rawContextPreview: profile.rawContext.slice(0, 1000),
      extractionMethod: null,
      extractedBy: null,
      extractionSkill: null,
    },
    updatedAt: now,
    createdAt: now,
  };
}

export default async function EditLucidClientPage({ params, searchParams }: { params: Promise<{ slug: string }>; searchParams?: Promise<EditClientSearchParams> }) {
  const { slug } = await params;
  const resolvedSlug = decodeURIComponent(slug);
  const client = await getLucidClientBySlug(resolvedSlug);
  const vaultProfile = client ? null : getVaultClientProfile(resolvedSlug);
  if (!client && !vaultProfile) notFound();
  const editableClient = client ?? clientFromVaultProfile(vaultProfile as VaultClientProfile);
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const clientError = firstSearchParam(resolvedSearchParams.client_error);
  const base = await adminBasePath();

  return (
    <div className="grid gap-6">
      <LucidOsHeader
        title={`Modifier ${editableClient.name}`}
        action={(
          <Link href={`${base}/lucid-os/clients/${editableClient.slug}`} className="inline-flex h-9 items-center gap-2 rounded border border-white/10 bg-white/[0.04] px-3 text-sm font-medium text-zinc-200 transition hover:bg-white/[0.07]">
            <ArrowLeft className="size-4" />
            Retour
          </Link>
        )}
      />
      <ActionErrorBanner message={clientError} />

      <Section title="Fiche complète">
        <ClientIntakeForm client={editableClient} submitLabel={client ? 'Mettre à jour le client' : 'Créer la fiche CRM éditable'} />
      </Section>

      {client ? <Section title="Zone danger">
        <div className="flex flex-col gap-3 border border-rose-400/20 bg-rose-500/[0.04] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-rose-100">Supprimer ce client</p>
            <p className="mt-1 text-sm text-rose-200/60">Supprime la fiche CRM et les enregistrements liés dans Supabase.</p>
          </div>
          <DeleteClientForm clientId={client.id} clientSlug={client.slug} clientName={client.name} />
        </div>
      </Section> : null}
    </div>
  );
}
