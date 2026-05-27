import Link from 'next/link';
import { Plus } from 'lucide-react';
import { getVaultClientProfiles, getVaultClientProfile, type VaultClientProfile } from '@/lib/admin/client-vault-profiles';
import {
  listLucidClients,
  type LucidClientIntakeStage,
  type LucidClientMeetingStatus,
  type LucidClientStatus,
  type LucidClientSummary,
} from '@/lib/admin/lucid-os';
import { EmptyState, LucidOsHeader, StatusBadge } from '../components';

export const dynamic = 'force-dynamic';

type ClientRecordListItem =
  | { source: 'lucid_os'; client: LucidClientSummary; vaultProfile: VaultClientProfile | null }
  | { source: 'vault'; profile: VaultClientProfile };

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

function statusFr(status: LucidClientStatus): string {
  const labels: Record<LucidClientStatus, string> = {
    lead: 'prospect',
    active: 'actif',
    paused: 'en pause',
    offboarded: 'terminé',
    archived: 'archivé',
  };
  return labels[status];
}

function intakeFr(stage: LucidClientIntakeStage): string {
  const labels: Record<LucidClientIntakeStage, string> = {
    potential: 'potentiel',
    meeting_booked: 'rdv planifié',
    meeting_done: 'rdv fait',
    proposal_sent: 'proposition envoyée',
    won: 'gagné',
    lost: 'perdu',
  };
  return labels[stage];
}

function meetingFr(status: LucidClientMeetingStatus): string {
  const labels: Record<LucidClientMeetingStatus, string> = {
    not_booked: 'pas de rdv',
    booked: 'rdv planifié',
    done: 'rdv fait',
    cancelled: 'annulé',
  };
  return labels[status];
}

function recordName(record: ClientRecordListItem): string {
  return record.source === 'vault' ? record.profile.name : record.client.name;
}

function recordSlug(record: ClientRecordListItem): string {
  return record.source === 'vault' ? record.profile.slug : record.client.slug;
}

function recordStatus(record: ClientRecordListItem): LucidClientStatus {
  return record.source === 'vault' ? record.profile.status : record.client.status;
}

function recordIntakeStage(record: ClientRecordListItem): LucidClientIntakeStage {
  return record.source === 'vault' ? record.profile.intakeStage : record.client.intake.stage;
}

function recordMeetingStatus(record: ClientRecordListItem): LucidClientMeetingStatus {
  return record.source === 'vault' ? record.profile.meetingStatus : record.client.intake.meetingStatus;
}

function recordIsAcquired(record: ClientRecordListItem): boolean {
  return recordStatus(record) === 'active';
}

function normalizeListSearch(value: string): string {
  return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

function recordMatchesQuery(record: ClientRecordListItem, query: string): boolean {
  if (!query) return true;
  const haystack = record.source === 'vault'
    ? [record.profile.name, record.profile.industry, record.profile.primaryContactName, record.profile.primaryContactEmail, record.profile.websiteUrl, record.profile.status]
    : [record.client.name, record.client.industry, record.client.primaryContactName, record.client.primaryContactEmail, record.client.websiteUrl, record.client.status, record.client.lifecycleStage, record.client.siret, record.client.siren];

  return normalizeListSearch(haystack.filter(Boolean).join(' ')).includes(query);
}

function prospectLabel(record: ClientRecordListItem): string {
  const status = recordStatus(record);
  if (status !== 'lead') return statusFr(status);

  const stage = recordIntakeStage(record);
  const meeting = recordMeetingStatus(record);
  if (stage === 'potential' && meeting !== 'not_booked') return meetingFr(meeting);
  return intakeFr(stage);
}

function prospectTone(record: ClientRecordListItem): 'neutral' | 'good' | 'warning' | 'danger' {
  const status = recordStatus(record);
  if (status === 'paused') return 'warning';
  if (status === 'offboarded' || status === 'archived') return 'neutral';
  return intakeTone(recordIntakeStage(record));
}

function RecordRow({ record, acquired }: { record: ClientRecordListItem; acquired: boolean }) {
  const href = `/admin/lucid-os/clients/${recordSlug(record)}`;
  const label = acquired ? 'actif' : prospectLabel(record);
  const tone = acquired ? 'good' : prospectTone(record);

  return (
    <Link
      href={href}
      className="group grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-t border-white/[0.08] px-1 py-4 transition-colors first:border-t-0 hover:bg-white/[0.03] sm:px-3"
    >
      <span className="truncate text-base font-semibold tracking-[-0.01em] text-zinc-50 group-hover:text-white">
        {recordName(record)}
      </span>
      <StatusBadge tone={tone}>{label}</StatusBadge>
    </Link>
  );
}

function RecordListSection({
  id,
  title,
  records,
  acquired,
  emptyLabel,
}: {
  id?: string;
  title: string;
  records: ClientRecordListItem[];
  acquired: boolean;
  emptyLabel: string;
}) {
  return (
    <section id={id} className="grid gap-3">
      <div className="flex items-baseline justify-between gap-4">
        <h2 className="text-sm font-semibold tracking-[-0.01em] text-zinc-100">{title}</h2>
        <span className="text-xs text-zinc-600">{records.length}</span>
      </div>
      <div className="border-t border-white/[0.08] pt-1">
        {records.length === 0 ? (
          <EmptyState>{emptyLabel}</EmptyState>
        ) : (
          records.map((record) => <RecordRow key={`${record.source}-${recordSlug(record)}`} record={record} acquired={acquired} />)
        )}
      </div>
    </section>
  );
}

export default async function LucidOsClientsPage({ searchParams }: { searchParams?: Promise<{ q?: string | string[] }> }) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const searchQuery = Array.isArray(resolvedSearchParams.q) ? resolvedSearchParams.q[0] ?? '' : resolvedSearchParams.q ?? '';
  const normalizedQuery = normalizeListSearch(searchQuery.trim());
  const clients = await listLucidClients(100);
  const vaultProfiles = getVaultClientProfiles();
  const clientSlugs = new Set(clients.map((client) => client.slug));
  const records: ClientRecordListItem[] = [
    ...clients.map((client) => ({ source: 'lucid_os' as const, client, vaultProfile: getVaultClientProfile(client.slug) })),
    ...vaultProfiles
      .filter((profile) => !clientSlugs.has(profile.slug))
      .map((profile) => ({ source: 'vault' as const, profile })),
  ];
  const filteredRecords = records.filter((record) => recordMatchesQuery(record, normalizedQuery));
  const clientRecords = filteredRecords.filter(recordIsAcquired);
  const prospectRecords = filteredRecords.filter((record) => !recordIsAcquired(record));

  return (
    <div className="grid gap-7">
      <LucidOsHeader
        title="Fiches clients"
        action={(
          <Link href="/admin/lucid-os/clients/new" className="inline-flex h-9 items-center justify-center gap-2 rounded bg-[#3b82f6] px-3 text-sm font-semibold text-white transition hover:bg-[#60a5fa]">
            <Plus className="size-4" />
            Ajouter un client
          </Link>
        )}
      />

      <RecordListSection title="Clients" records={clientRecords} acquired emptyLabel="Aucun client actif." />
      <RecordListSection id="prospects" title="Prospects" records={prospectRecords} acquired={false} emptyLabel="Aucun prospect." />
    </div>
  );
}
