import Link from 'next/link';
import { CheckCircle2, Clock, Hourglass, Inbox } from 'lucide-react';
import { adminBasePath, requireAdmin } from '@/lib/admin/auth';
import {
  TICKET_GROUP_LABELS,
  TICKET_PRIORITY_META,
  TICKET_STATUS_META,
  TICKET_TYPE_LABELS,
  countTicketGroups,
  listTickets,
  type TicketStatusGroup,
} from '@/lib/admin/tickets';
import { EmptyState, LucidOsHeader, StatCard, StatusBadge, formatAdminDateTime } from '../components';

export const dynamic = 'force-dynamic';

const GROUPS: TicketStatusGroup[] = ['a_traiter', 'en_cours', 'attente', 'resolus'];

function firstParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

function isTicketGroup(value: string | null): value is TicketStatusGroup {
  return value !== null && (GROUPS as string[]).includes(value);
}

function FilterLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className={
        active
          ? 'inline-flex h-8 items-center rounded border border-blue-200 bg-blue-50 px-2.5 text-xs font-semibold text-blue-700'
          : 'inline-flex h-8 items-center rounded border border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-600 transition-colors hover:border-zinc-300 hover:bg-zinc-50'
      }
    >
      {children}
    </a>
  );
}

interface PageProps {
  searchParams?: Promise<{ groupe?: string | string[]; client?: string | string[] }>;
}

export default async function TicketsPage({ searchParams }: PageProps) {
  await requireAdmin();
  const base = await adminBasePath();

  const resolved = searchParams ? await searchParams : {};
  const rawGroup = firstParam(resolved.groupe);
  const group = isTicketGroup(rawGroup) ? rawGroup : null;
  const clientId = firstParam(resolved.client);

  const [tickets, counts] = await Promise.all([
    listTickets({ group, clientId }),
    countTicketGroups(),
  ]);

  const listPath = `${base}/lucid-os/tickets`;
  const groupHref = (value: TicketStatusGroup | null) => {
    const params = new URLSearchParams();
    if (value) params.set('groupe', value);
    if (clientId) params.set('client', clientId);
    const query = params.toString();
    return query ? `${listPath}?${query}` : listPath;
  };

  return (
    <div className="grid gap-6">
      <LucidOsHeader title="Tickets" />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label={TICKET_GROUP_LABELS.a_traiter}
          value={counts.a_traiter}
          hint="Nouveaux tickets et réponses clients"
          icon={Inbox}
          href={groupHref('a_traiter')}
        />
        <StatCard
          label={TICKET_GROUP_LABELS.en_cours}
          value={counts.en_cours}
          hint="Pris en charge par l'équipe"
          icon={Clock}
          href={groupHref('en_cours')}
        />
        <StatCard
          label={TICKET_GROUP_LABELS.attente}
          value={counts.attente}
          hint="Une réponse du client est attendue"
          icon={Hourglass}
          href={groupHref('attente')}
        />
        <StatCard
          label={TICKET_GROUP_LABELS.resolus}
          value={counts.resolus}
          hint="Résolus, refusés ou approuvés"
          icon={CheckCircle2}
          href={groupHref('resolus')}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">Statut</span>
        <FilterLink href={groupHref(null)} active={!group}>
          Tous
        </FilterLink>
        {GROUPS.map((value) => (
          <FilterLink key={value} href={groupHref(value)} active={group === value}>
            {TICKET_GROUP_LABELS[value]}
          </FilterLink>
        ))}
      </div>

      {tickets.length === 0 ? (
        <EmptyState>Aucun ticket dans cette vue. Les demandes créées par les clients depuis leur portail arrivent ici.</EmptyState>
      ) : (
        <div className="rounded-xl border border-zinc-200 bg-white shadow-sm">
          {tickets.map((ticket) => {
            const statusMeta = TICKET_STATUS_META[ticket.status] ?? { label: ticket.status, tone: 'neutral' as const };
            const priorityMeta = TICKET_PRIORITY_META[ticket.priority] ?? TICKET_PRIORITY_META.normal;
            return (
              <Link
                key={ticket.id}
                href={`${base}/lucid-os/tickets/${ticket.id}`}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-t border-zinc-200 px-4 py-3.5 transition-colors first:border-t-0 hover:bg-zinc-50"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold text-zinc-400">#{ticket.reference}</span>
                    <p className="truncate text-sm font-medium text-zinc-950">{ticket.title}</p>
                    {ticket.status === 'open' ? <StatusBadge tone="warning">À répondre</StatusBadge> : null}
                  </div>
                  <p className="mt-1 truncate text-xs text-zinc-500">
                    {ticket.clientName ?? 'Client inconnu'}
                    {ticket.createdByContactName ? ` · ${ticket.createdByContactName}` : ''}
                    {' · '}
                    {TICKET_TYPE_LABELS[ticket.requestType] ?? ticket.requestType}
                    {' · '}
                    {formatAdminDateTime(ticket.updatedAt)}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  {priorityMeta.rank <= 1 ? (
                    <StatusBadge tone={priorityMeta.tone}>{priorityMeta.label}</StatusBadge>
                  ) : null}
                  <StatusBadge tone={statusMeta.tone}>{statusMeta.label}</StatusBadge>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
