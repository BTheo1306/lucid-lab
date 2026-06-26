import { Power, Users, Send, MessageSquare, Inbox, CheckCircle2, AlertTriangle } from 'lucide-react';
import { getControlPanelData, type ControlMessage } from '@/lib/admin/lead-engine-control';
import { toggleOutreachAction, runPipelineAction } from './actions';
import { EmptyState, LeadEngineHeader, LeadEngineTabs, Section, StatCard, StatusBadge } from '../components';

export const dynamic = 'force-dynamic';

function btnClass(tone: 'primary' | 'good' | 'danger' | 'neutral'): string {
  const base = 'inline-flex h-9 items-center rounded-lg px-3 text-sm font-medium transition-colors';
  if (tone === 'primary') return `${base} bg-zinc-950 text-white hover:bg-zinc-800`;
  if (tone === 'good') return `${base} bg-emerald-600 text-white hover:bg-emerald-500`;
  if (tone === 'danger') return `${base} bg-rose-600 text-white hover:bg-rose-500`;
  return `${base} border border-zinc-200 text-zinc-700 hover:bg-zinc-100`;
}

function MessageList({ items }: { items: ControlMessage[] }) {
  return (
    <ul className="space-y-3">
      {items.map((m) => (
        <li key={m.id} className="rounded-lg border border-zinc-200 p-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium text-zinc-900">
              {m.personName ?? 'Contact inconnu'}
              {m.company ? ` · ${m.company}` : ''}
            </p>
            <StatusBadge tone="neutral">{m.stepKind ?? 'message'}</StatusBadge>
          </div>
          {m.personTitle ? <p className="text-xs text-zinc-500">{m.personTitle}</p> : null}
          {m.body ? <p className="mt-2 whitespace-pre-line text-sm text-zinc-600">{m.body}</p> : null}
          {m.linkedinUrl ? (
            <a href={m.linkedinUrl} target="_blank" rel="noreferrer" className="mt-1 inline-block text-xs text-blue-600 hover:underline">
              Profil LinkedIn
            </a>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export default async function LeadEngineControlPage() {
  const { outreachEnabled, sender, funnel, humanTouch, queue } = await getControlPanelData();

  return (
    <div className="space-y-6">
      <LeadEngineHeader
        eyebrow="Lead Engine"
        title="Moteur et contrôles"
        description="Kill switch, lancement du pipeline, état du compte émetteur et entonnoir en temps réel."
        icon={Power}
      />
      <LeadEngineTabs active="engine" />

      <Section title="Contrôles d'envoi" description="Mettre en pause tout l'envoi, ou déclencher le pipeline manuellement.">
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge tone={outreachEnabled ? 'good' : 'danger'}>
            {outreachEnabled ? 'Envoi actif' : 'Envoi en pause'}
          </StatusBadge>
          <form action={toggleOutreachAction}>
            <input type="hidden" name="enabled" value={outreachEnabled ? 'false' : 'true'} />
            <button className={btnClass(outreachEnabled ? 'danger' : 'good')} type="submit">
              {outreachEnabled ? 'Mettre en pause (kill switch)' : "Réactiver l'envoi"}
            </button>
          </form>
          <form action={runPipelineAction}>
            <input type="hidden" name="dryRun" value="true" />
            <button className={btnClass('neutral')} type="submit">Test (dry-run)</button>
          </form>
          <form action={runPipelineAction}>
            <input type="hidden" name="dryRun" value="false" />
            <button className={btnClass('primary')} type="submit">Lancer le pipeline</button>
          </form>
        </div>
        <p className="mt-3 text-sm text-zinc-500">
          Le dry-run source et score sans appeler l&apos;IA ni rien écrire. Le lancement réel rédige les messages et remplit la file (petit lot par exécution).
        </p>
      </Section>

      <Section title="Compte émetteur" description="Le compte LinkedIn d'Anthony et ses plafonds du jour.">
        {sender ? (
          <div className="grid gap-4 sm:grid-cols-3">
            <StatCard label="Invitations aujourd'hui" value={`${sender.invitesSentToday} / ${sender.dailyInviteCap}`} hint="Plafond quotidien" icon={Send} />
            <StatCard label="Messages aujourd'hui" value={`${sender.messagesSentToday} / ${sender.dailyMessageCap}`} hint="Suivis envoyés" icon={MessageSquare} />
            <StatCard
              label="Runner"
              value={sender.lastSeenAt ? 'Actif' : 'Jamais vu'}
              hint={sender.sessionExpired ? 'Session LinkedIn expirée' : sender.lastSeenAt ? 'Dernier ping reçu' : 'Démarrer le runner local'}
              icon={sender.sessionExpired ? AlertTriangle : CheckCircle2}
            />
          </div>
        ) : (
          <EmptyState>Aucun compte émetteur. Appliquez la migration pour créer le compte Anthony.</EmptyState>
        )}
      </Section>

      <Section title="Entonnoir" description="De la découverte jusqu'à la conversion en client.">
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-6">
          <StatCard label="Sourcés" value={funnel.discovered} hint="Prospects trouvés" icon={Users} />
          <StatCard label="En file" value={funnel.queued} hint="Invitations à envoyer" icon={Send} />
          <StatCard label="À la main" value={funnel.handedToHuman} hint="Top leads (humain)" icon={Inbox} />
          <StatCard label="Contactés" value={funnel.contacted} hint="Invitations envoyées" icon={MessageSquare} />
          <StatCard label="Réponses" value={funnel.replied} hint="Ont répondu" icon={MessageSquare} />
          <StatCard label="Convertis" value={funnel.converted} hint="Devenus clients" icon={CheckCircle2} />
        </div>
      </Section>

      <Section title="À contacter à la main (top leads)" description="Fondateurs et décideurs: à toi de jouer, Anthony.">
        {humanTouch.length > 0 ? <MessageList items={humanTouch} /> : <EmptyState>Rien pour le moment.</EmptyState>}
      </Section>

      <Section title="File d'envoi LinkedIn" description="Invitations en attente que le runner enverra.">
        {queue.length > 0 ? <MessageList items={queue} /> : <EmptyState>File vide.</EmptyState>}
      </Section>
    </div>
  );
}
