import { Users, Send, Inbox, MessageSquare, CheckCircle2, AlertTriangle, Activity } from 'lucide-react';
import { getControlPanelData, type ControlMessage } from '@/lib/admin/lead-engine-control';
import { toggleOutreachAction, runPipelineAction } from './actions';
import { EmptyState, LucidOsHeader, Section, StatCard, StatusBadge, formatAdminDateTime } from '../lucid-os/components';

export const dynamic = 'force-dynamic';

function buttonClass(tone: 'primary' | 'good' | 'danger' | 'ghost'): string {
  const base = 'inline-flex h-9 items-center rounded px-3 text-sm font-semibold transition';
  if (tone === 'primary') return `${base} bg-[#3b82f6] text-white hover:bg-[#60a5fa]`;
  if (tone === 'good') return `${base} bg-emerald-500/15 text-emerald-300 ring-1 ring-emerald-400/20 hover:bg-emerald-500/25`;
  if (tone === 'danger') return `${base} bg-rose-500/15 text-rose-300 ring-1 ring-rose-400/20 hover:bg-rose-500/25`;
  return `${base} border border-white/10 text-zinc-300 hover:bg-white/[0.04]`;
}

function MessageList({ items }: { items: ControlMessage[] }) {
  return (
    <div>
      {items.map((m) => (
        <div key={m.id} className="border-t border-white/[0.08] py-4 first:border-t-0">
          <div className="flex items-center justify-between gap-3">
            <p className="min-w-0 truncate text-sm font-semibold text-zinc-50">
              {m.personName ?? 'Contact inconnu'}
              {m.company ? <span className="font-normal text-zinc-500"> · {m.company}</span> : null}
            </p>
            <StatusBadge tone="neutral">{m.stepKind ?? 'message'}</StatusBadge>
          </div>
          {m.personTitle ? <p className="mt-0.5 text-xs text-zinc-500">{m.personTitle}</p> : null}
          {m.body ? <p className="mt-2 whitespace-pre-line text-sm leading-6 text-zinc-400">{m.body}</p> : null}
          {m.linkedinUrl ? (
            <a href={m.linkedinUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-blue-300 hover:text-blue-200">
              Profil LinkedIn
            </a>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export default async function LeadEnginePage() {
  const { outreachEnabled, sender, funnel, humanTouch, queue } = await getControlPanelData();

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

      <Section title="Entonnoir">
        <div className="grid gap-x-6 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Sourcés" value={funnel.discovered} hint="Prospects trouvés" icon={Users} />
          <StatCard label="En file" value={funnel.queued} hint="Invitations à envoyer" icon={Send} />
          <StatCard label="À la main" value={funnel.handedToHuman} hint="Top leads (humain)" icon={Inbox} />
          <StatCard label="Contactés" value={funnel.contacted} hint="Invitations envoyées" icon={MessageSquare} />
          <StatCard label="Réponses" value={funnel.replied} hint="Ont répondu" icon={Activity} />
          <StatCard label="Convertis" value={funnel.converted} hint="Devenus clients" icon={CheckCircle2} />
        </div>
      </Section>

      <Section title="Compte émetteur">
        {sender ? (
          <div className="grid gap-x-6 sm:grid-cols-3">
            <StatCard label="Invitations / jour" value={`${sender.invitesSentToday} / ${sender.dailyInviteCap}`} hint={`${sender.label}, plafond quotidien`} icon={Send} />
            <StatCard label="Messages / jour" value={`${sender.messagesSentToday} / ${sender.dailyMessageCap}`} hint="Suivis envoyés" icon={MessageSquare} />
            <StatCard
              label="Runner"
              value={sender.sessionExpired ? 'Session expirée' : sender.lastSeenAt ? 'Actif' : 'Inactif'}
              hint={sender.lastSeenAt ? formatAdminDateTime(sender.lastSeenAt) : 'Démarrer le runner local'}
              icon={sender.sessionExpired ? AlertTriangle : CheckCircle2}
            />
          </div>
        ) : (
          <EmptyState>Aucun compte émetteur configuré.</EmptyState>
        )}
      </Section>

      <Section title="À contacter à la main" action={<span className="text-xs text-zinc-600">{humanTouch.length}</span>}>
        {humanTouch.length > 0 ? (
          <MessageList items={humanTouch} />
        ) : (
          <EmptyState>Aucun top lead en attente. Les fondateurs et décideurs à fort potentiel apparaîtront ici.</EmptyState>
        )}
      </Section>

      <Section title="File d'envoi LinkedIn" action={<span className="text-xs text-zinc-600">{queue.length}</span>}>
        {queue.length > 0 ? (
          <MessageList items={queue} />
        ) : (
          <EmptyState>File vide. Lance le pipeline pour générer des invitations.</EmptyState>
        )}
      </Section>

      <p className="text-xs leading-6 text-zinc-600">
        Le dry-run source et score sans appeler l&apos;IA ni rien écrire. Le lancement réel rédige les messages et remplit la file (petit lot). L&apos;envoi part du runner local sur la session d&apos;Anthony, avec des plafonds quotidiens.
      </p>
    </div>
  );
}
