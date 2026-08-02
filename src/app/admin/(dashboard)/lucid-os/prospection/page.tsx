import { CalendarClock, PhoneCall, MessageSquare, CalendarCheck } from 'lucide-react';
import { listProspectionTargets } from '@/lib/admin/prospection';
import { adminBasePath } from '@/lib/admin/auth';
import { LucidOsHeader, Section, StatCard } from '../components';
import { ProspectionBoard } from './ProspectionBoard';

export const dynamic = 'force-dynamic';

type ProspectionSearchParams = {
  secteur?: string | string[];
  statut?: string | string[];
  qui?: string | string[];
  rappels?: string | string[];
};

function firstParam(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

const SECTORS = [
  { value: 'experts-comptables', label: 'Experts-comptables' },
  { value: 'avocats', label: 'Avocats' },
  { value: 'banques-privees', label: 'Banques privées' },
];

const STATUSES = [
  { value: 'approved', label: 'À appeler' },
  { value: 'contacted', label: 'Contactés' },
  { value: 'replied', label: 'Ont répondu' },
  { value: 'meeting_booked', label: 'RDV pris' },
  { value: 'disqualified', label: 'Écartés' },
];

const OWNERS = ['Jules', 'Anthony', 'Théo'];

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

export default async function ProspectionPage({
  searchParams,
}: {
  searchParams?: Promise<ProspectionSearchParams>;
}) {
  const resolved = searchParams ? await searchParams : {};
  const sector = firstParam(resolved.secteur);
  const status = firstParam(resolved.statut);
  const owner = firstParam(resolved.qui);
  const callbackDue = firstParam(resolved.rappels) === '1';

  const [targets, allTargets] = await Promise.all([
    listProspectionTargets({ sector, status, owner, callbackDue }),
    listProspectionTargets(),
  ]);

  // adminBasePath est asynchrone : sans await, le lien devient
  // "[object Promise]/lucid-os/prospection" et chaque filtre mene a une page blanche.
  const base = `${await adminBasePath()}/lucid-os/prospection`;
  const buildHref = (patch: Partial<Record<'secteur' | 'statut' | 'qui' | 'rappels', string | null>>): string => {
    const params = new URLSearchParams();
    const next = {
      secteur: patch.secteur !== undefined ? patch.secteur : sector,
      statut: patch.statut !== undefined ? patch.statut : status,
      qui: patch.qui !== undefined ? patch.qui : owner,
      rappels: patch.rappels !== undefined ? patch.rappels : callbackDue ? '1' : null,
    };
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
    }
    const query = params.toString();
    return query ? `${base}?${query}` : base;
  };

  const toCall = allTargets.filter((target) => !target.lastTouch && target.status !== 'disqualified').length;
  const contacted = allTargets.filter((target) => target.status === 'contacted').length;
  const replied = allTargets.filter((target) => target.status === 'replied').length;
  const meetings = allTargets.filter((target) => target.status === 'meeting_booked').length;
  const dueCallbacks = allTargets.filter((target) => target.callbackDue).length;

  return (
    <div className="grid gap-6">
      <LucidOsHeader title="Prospection" />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Jamais appelés" value={toCall} hint="Cibles sans aucune action" icon={PhoneCall} />
        <StatCard label="Contactés" value={contacted} hint="Au moins une tentative" icon={MessageSquare} />
        <StatCard label="Ont répondu" value={replied} hint="Passés au CRM clients" icon={CalendarCheck} />
        <StatCard
          label="Rappels dus"
          value={dueCallbacks}
          hint={dueCallbacks > 0 ? 'Échéance atteinte, cliquer pour filtrer' : 'Aucun rappel à traiter'}
          icon={CalendarClock}
          href={dueCallbacks > 0 ? buildHref({ rappels: '1' }) : undefined}
        />
      </div>

      <Section title="Filtres">
        <div className="grid gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">Secteur</span>
            <FilterLink href={buildHref({ secteur: null })} active={!sector}>
              Tous
            </FilterLink>
            {SECTORS.map((item) => (
              <FilterLink key={item.value} href={buildHref({ secteur: item.value })} active={sector === item.value}>
                {item.label}
              </FilterLink>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">Statut</span>
            <FilterLink href={buildHref({ statut: null })} active={!status}>
              Tous
            </FilterLink>
            {STATUSES.map((item) => (
              <FilterLink key={item.value} href={buildHref({ statut: item.value })} active={status === item.value}>
                {item.label}
              </FilterLink>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-zinc-500">Qui appelle</span>
            <FilterLink href={buildHref({ qui: null })} active={!owner}>
              Tous
            </FilterLink>
            {OWNERS.map((item) => (
              <FilterLink key={item} href={buildHref({ qui: item })} active={owner === item}>
                {item}
              </FilterLink>
            ))}
            <FilterLink href={buildHref({ rappels: callbackDue ? null : '1' })} active={callbackDue}>
              À rappeler aujourd&apos;hui
            </FilterLink>
          </div>
        </div>
      </Section>

      <Section title={`Cibles (${targets.length})`}>
        <ProspectionBoard targets={targets} />
      </Section>

      <p className="text-xs leading-5 text-zinc-500">
        Une cible reste ici tant qu&apos;elle n&apos;a pas répondu. La fiche client n&apos;est créée dans le CRM
        qu&apos;au moment où l&apos;on note « a répondu » ou « RDV pris » ({meetings} rendez-vous pris à ce jour).
      </p>
    </div>
  );
}
