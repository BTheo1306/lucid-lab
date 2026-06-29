import { Users, Send, Inbox, MessageSquare, CheckCircle2, AlertTriangle, Activity, Search, ExternalLink } from 'lucide-react';
import type { ComponentType } from 'react';
import { cn } from '@/lib/utils';
import { getControlPanelData, type ControlMessage, type LeadRunSummary } from '@/lib/admin/lead-engine-control';
import { toggleOutreachAction, runPipelineAction } from './actions';
import { CopyButton } from './CopyButton';
import { EmptyState, LucidOsHeader, Section, StatusBadge, formatAdminDateTime } from '../lucid-os/components';

export const dynamic = 'force-dynamic';

function buttonClass(tone: 'primary' | 'good' | 'danger' | 'ghost'): string {
  const base = 'inline-flex h-9 items-center rounded-lg px-3 text-sm font-semibold transition-colors';
  if (tone === 'primary') return `${base} bg-zinc-950 text-white hover:bg-zinc-800`;
  if (tone === 'good') return `${base} bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200 hover:bg-emerald-100`;
  if (tone === 'danger') return `${base} bg-rose-50 text-rose-700 ring-1 ring-rose-200 hover:bg-rose-100`;
  return `${base} border border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-50`;
}

function StatTile({
  label,
  value,
  hint,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string | number;
  hint: string;
  icon: ComponentType<{ className?: string }>;
  accent?: string;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">{label}</p>
        <Icon className={cn('size-4 shrink-0', accent ?? 'text-zinc-400')} />
      </div>
      <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-zinc-950">{value}</p>
      <p className="mt-1 text-xs text-zinc-500">{hint}</p>
    </div>
  );
}

/** LinkedIn headlines often carry emojis and stray replacement chars; tidy for display. */
function cleanTitle(title: string): string {
  return title.replace(/�/g, '').replace(/\s{2,}/g, ' ').trim();
}

/**
 * A direct way to reach the person. Use the resolved LinkedIn profile when we
 * have it; otherwise fall back to a LinkedIn people-search prefilled with their
 * name + company so a one click lands on their profile (gov-sourced founders
 * carry no profile URL).
 */
function linkedinContactUrl(m: ControlMessage): string {
  if (m.linkedinUrl) return m.linkedinUrl;
  const query = [m.personName, m.company].filter(Boolean).join(' ');
  return `https://www.linkedin.com/search/results/people/?keywords=${encodeURIComponent(query)}`;
}

/** At-a-glance tag for which offer/profile a lead belongs to. */
function motionBadge(motion: string | null): { label: string; tone: 'good' | 'warning' } | null {
  if (motion === 'founder_smb') return { label: 'Claude + Obsidian', tone: 'good' };
  if (motion === 'enterprise') return { label: 'Grand groupe', tone: 'warning' };
  return null;
}

/** Priority drives the card's left accent + a small label so quality is scannable. */
function priorityMeta(priority: string | null): { label: string; border: string } {
  if (priority === 'high') return { label: 'Priorité élevée', border: 'border-l-emerald-500' };
  if (priority === 'medium') return { label: 'Priorité moyenne', border: 'border-l-amber-400' };
  if (priority === 'low') return { label: 'Priorité faible', border: 'border-l-zinc-300' };
  return { label: '', border: 'border-l-zinc-200' };
}

function lastRunLine(run: LeadRunSummary): string {
  const when = formatAdminDateTime(run.finishedAt ?? run.startedAt);
  if (run.status === 'running') {
    return `Dernier lancement : en cours depuis ${when}. Le pipeline prend 1 à 2 minutes, la page se mettra à jour ensuite.`;
  }
  if (run.status === 'failed') return `Dernier lancement : échec (${when}). Réessaie ou préviens-moi.`;
  return `Dernier lancement : ${when} · ${run.queued} en file, ${run.humanTouch} à la main, ${run.skipped} écartés.`;
}

function MessageList({ items }: { items: ControlMessage[] }) {
  return (
    <div className="grid gap-3">
      {items.map((m) => {
        const badge = motionBadge(m.motion);
        const prio = priorityMeta(m.priority);
        return (
          <article key={m.id} className={`rounded-xl border border-zinc-200 border-l-4 ${prio.border} bg-white p-4 shadow-sm`}>
            <div className="flex items-center justify-between gap-3">
              <p className="min-w-0 truncate text-sm font-semibold text-zinc-950">
                {m.personName ?? 'Contact inconnu'}
                {m.company ? <span className="font-normal text-zinc-500"> · {m.company}</span> : null}
              </p>
              {badge ? <StatusBadge tone={badge.tone}>{badge.label}</StatusBadge> : null}
            </div>
            {m.personTitle ? <p className="mt-0.5 line-clamp-1 text-xs text-zinc-500">{cleanTitle(m.personTitle)}</p> : null}
            {m.body ? <p className="mt-2 whitespace-pre-line text-sm leading-6 text-zinc-700">{m.body}</p> : null}
            <div className="mt-3 flex flex-wrap items-center gap-4 border-t border-zinc-100 pt-3">
              {m.priority ? (
                <span className="text-xs text-zinc-400">
                  {prio.label}{m.score != null ? ` · ${m.score}/20` : ''}
                </span>
              ) : null}
              <a
                href={linkedinContactUrl(m)}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-xs font-medium text-sky-700 hover:text-sky-800"
              >
                {m.linkedinUrl ? <ExternalLink className="size-3.5" /> : <Search className="size-3.5" />}
                {m.linkedinUrl ? 'Ouvrir le profil LinkedIn' : 'Trouver sur LinkedIn'}
              </a>
              {m.body ? <CopyButton text={m.body} /> : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}

export default async function LeadEnginePage() {
  const { outreachEnabled, sender, funnel, humanTouch, queue, lastRun } = await getControlPanelData();

  return (
    <div className="space-y-8">
      <LucidOsHeader
        title="Moteur de leads"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <StatusBadge tone={outreachEnabled ? 'good' : 'danger'}>{outreachEnabled ? 'Envoi actif' : 'En pause'}</StatusBadge>
            <form action={toggleOutreachAction}>
              <input type="hidden" name="enabled" value={outreachEnabled ? 'false' : 'true'} />
              <button type="submit" className={buttonClass(outreachEnabled ? 'danger' : 'good')}>
                {outreachEnabled ? 'Mettre en pause' : 'Réactiver'}
              </button>
            </form>
            <form action={runPipelineAction}>
              <input type="hidden" name="dryRun" value="true" />
              <button type="submit" className={buttonClass('ghost')}>Test (dry-run)</button>
            </form>
            <form action={runPipelineAction}>
              <input type="hidden" name="dryRun" value="false" />
              <button type="submit" className={buttonClass('primary')}>Lancer le pipeline</button>
            </form>
          </div>
        }
      />

      {lastRun ? <p className="-mt-4 text-xs text-zinc-500">{lastRunLine(lastRun)}</p> : null}

      <Section title="Entonnoir">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatTile label="Sourcés" value={funnel.discovered} hint="Prospects trouvés" icon={Users} />
          <StatTile label="En file" value={funnel.queued} hint="Invitations à envoyer" icon={Send} />
          <StatTile label="À la main" value={funnel.handedToHuman} hint="Top leads (humain)" icon={Inbox} />
          <StatTile label="Contactés" value={funnel.contacted} hint="Invitations envoyées" icon={MessageSquare} />
          <StatTile label="Réponses" value={funnel.replied} hint="Ont répondu" icon={Activity} />
          <StatTile label="Convertis" value={funnel.converted} hint="Devenus clients" icon={CheckCircle2} />
        </div>
      </Section>

      <Section title="Compte émetteur">
        {sender ? (
          <div className="grid gap-3 sm:grid-cols-3">
            <StatTile label="Invitations / jour" value={`${sender.invitesSentToday} / ${sender.dailyInviteCap}`} hint={`${sender.label}, plafond quotidien`} icon={Send} />
            <StatTile label="Messages / jour" value={`${sender.messagesSentToday} / ${sender.dailyMessageCap}`} hint="Suivis envoyés" icon={MessageSquare} />
            <StatTile
              label="Runner"
              value={sender.sessionExpired ? 'Session expirée' : sender.lastSeenAt ? 'Actif' : 'Inactif'}
              hint={sender.lastSeenAt ? formatAdminDateTime(sender.lastSeenAt) : 'Démarrer le runner local'}
              icon={sender.sessionExpired ? AlertTriangle : CheckCircle2}
              accent={sender.sessionExpired ? 'text-rose-500' : sender.lastSeenAt ? 'text-emerald-500' : 'text-zinc-400'}
            />
          </div>
        ) : (
          <EmptyState>Aucun compte émetteur configuré.</EmptyState>
        )}
      </Section>

      <Section title="À contacter à la main" action={<StatusBadge tone="neutral">{humanTouch.length}</StatusBadge>}>
        {humanTouch.length > 0 ? (
          <MessageList items={humanTouch} />
        ) : (
          <EmptyState>Aucun top lead en attente. Les fondateurs et décideurs à fort potentiel apparaîtront ici.</EmptyState>
        )}
      </Section>

      <Section title="File d'envoi LinkedIn" action={<StatusBadge tone="neutral">{queue.length}</StatusBadge>}>
        {queue.length > 0 ? (
          <MessageList items={queue} />
        ) : (
          <EmptyState>File vide. Lance le pipeline pour générer des invitations.</EmptyState>
        )}
      </Section>

      <p className="text-xs leading-6 text-zinc-500">
        Le dry-run source et score sans appeler l&apos;IA ni rien écrire. Le lancement réel rédige les messages et remplit la file (petit lot) : il prend 1 à 2 minutes, patiente jusqu&apos;au rafraîchissement de la page. L&apos;envoi part du runner local sur la session d&apos;Anthony, avec des plafonds quotidiens.
      </p>
    </div>
  );
}
