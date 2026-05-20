import { ClipboardPaste, Save } from 'lucide-react';
import { recordClientIntakeAction } from './actions';
import type { LucidClientSummary } from '@/lib/admin/lucid-os';

function datetimeLocalValue(value: string | null): string | undefined {
  if (!value) return undefined;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString().slice(0, 16);
}

export function ClientIntakeForm({ client, submitLabel = 'Enregistrer la qualification' }: { client?: LucidClientSummary; submitLabel?: string }) {
  const firstNameFallback = client?.firstName ?? (client?.name ? client.name.split(' ')[0] : '');
  const lastNameFallback = client?.lastName ?? (client?.name && client.name.includes(' ') ? client.name.slice(client.name.indexOf(' ') + 1) : '');
  const inputClassName = 'h-10 rounded border border-white/10 bg-[#050506] px-3 text-sm font-normal text-zinc-100 outline-none transition placeholder:text-zinc-700 focus:border-blue-400/60 focus:ring-2 focus:ring-blue-500/15';
  const textareaClassName = 'rounded border border-white/10 bg-[#050506] px-3 py-2 text-sm font-normal leading-6 text-zinc-100 outline-none transition placeholder:text-zinc-700 focus:border-blue-400/60 focus:ring-2 focus:ring-blue-500/15';
  const labelClassName = 'grid gap-2 text-sm font-medium text-zinc-300';

  return (
    <form action={recordClientIntakeAction} className="grid gap-7">
      {client ? <input type="hidden" name="slug" value={client.slug} /> : null}
      <section className="grid gap-3">
        <h2 className="text-sm font-semibold tracking-[-0.01em] text-zinc-100">Compte</h2>
        <div className="grid gap-4 border-t border-white/[0.08] pt-4 lg:grid-cols-[1.3fr_0.8fr_0.8fr_0.8fr]">
          <label className={labelClassName}>Nom affiché<input name="name" defaultValue={client?.name ?? ''} className={inputClassName} placeholder="Entreprise ou personne" /></label>
          <label className={labelClassName}>Statut<select name="status" defaultValue={client?.status ?? 'lead'} className={inputClassName}><option value="lead">Prospect</option><option value="active">Actif</option><option value="paused">En pause</option><option value="offboarded">Terminé</option><option value="archived">Archivé</option></select></label>
          <label className={labelClassName}>Cycle<select name="lifecycle_stage" defaultValue={client?.lifecycleStage ?? ''} className={inputClassName}><option value="">Auto</option><option value="lead">Prospect</option><option value="qualified">Qualifié</option><option value="meeting_booked">Rdv planifié</option><option value="discovery_done">Découverte faite</option><option value="proposal_needed">Proposition à préparer</option><option value="proposal_sent">Proposition envoyée</option><option value="negotiation">Négociation</option><option value="won">Gagné</option><option value="lost">Perdu</option><option value="onboarding">Onboarding</option><option value="in_delivery">En production</option><option value="live_managed">En ligne / géré</option><option value="success_retention">Succès / rétention</option><option value="expansion_opportunity">Expansion</option><option value="archived">Archivé</option></select></label>
          <label className={labelClassName}>Responsable<input name="owner_label" defaultValue={client?.ownerLabel ?? ''} className={inputClassName} placeholder="Jules" /></label>
        </div>
      </section>

      <section className="grid gap-3">
        <h2 className="text-sm font-semibold tracking-[-0.01em] text-zinc-100">Contact et entreprise</h2>
        <div className="grid gap-4 border-t border-white/[0.08] pt-4 md:grid-cols-3">
          <label className={labelClassName}>Prénom<input name="first_name" defaultValue={firstNameFallback} className={inputClassName} placeholder="Marie" /></label>
          <label className={labelClassName}>Nom<input name="last_name" defaultValue={lastNameFallback} className={inputClassName} placeholder="Dupont" /></label>
          <label className={labelClassName}>Contact principal<input name="primary_contact_name" defaultValue={client?.primaryContactName ?? ''} className={inputClassName} placeholder="Marie Dupont" /></label>
          <label className={labelClassName}>Email<input name="primary_contact_email" defaultValue={client?.primaryContactEmail ?? ''} type="email" className={inputClassName} placeholder="marie@client.fr" /></label>
          <label className={labelClassName}>Téléphone<input name="primary_contact_phone" defaultValue={client?.primaryContactPhone ?? ''} className={inputClassName} placeholder="+33 6..." /></label>
          <label className={labelClassName}>Site<input name="website_url" defaultValue={client?.websiteUrl ?? ''} className={inputClassName} placeholder="client.fr" /></label>
          <label className={labelClassName}>Raison sociale<input name="legal_name" defaultValue={client?.legalName ?? client?.name ?? ''} className={inputClassName} placeholder="Client SAS" /></label>
          <label className={labelClassName}>SIREN<input name="siren" defaultValue={client?.siren ?? ''} className={inputClassName} placeholder="9 chiffres" /></label>
          <label className={labelClassName}>SIRET<input name="siret" defaultValue={client?.siret ?? ''} className={inputClassName} placeholder="14 chiffres" /></label>
          <label className={`${labelClassName} md:col-span-2`}>Adresse de facturation<input name="billing_address" defaultValue={client?.billingAddress ?? ''} className={inputClassName} placeholder="Adresse complète" /></label>
          <label className={labelClassName}>Secteur<input name="industry" defaultValue={client?.industry ?? ''} className={inputClassName} placeholder="Restauration, SaaS..." /></label>
        </div>
      </section>

      <section className="grid gap-3">
        <h2 className="text-sm font-semibold tracking-[-0.01em] text-zinc-100">Suivi</h2>
        <div className="grid gap-4 border-t border-white/[0.08] pt-4 md:grid-cols-4">
          <label className={labelClassName}>Santé<select name="client_health_status" defaultValue={client?.clientHealthStatus ?? 'unknown'} className={inputClassName}><option value="unknown">Inconnue</option><option value="healthy">Saine</option><option value="watch">À surveiller</option><option value="risk">Risque</option><option value="critical">Critique</option></select></label>
          <label className={labelClassName}>Score<input name="health_score" defaultValue={client?.healthScore ?? ''} type="number" min={0} max={100} className={inputClassName} placeholder="0-100" /></label>
          <label className={labelClassName}>Dernier contact<input name="last_contacted_at" defaultValue={datetimeLocalValue(client?.lastContactedAt ?? null)} type="datetime-local" className={inputClassName} /></label>
          <label className={labelClassName}>Échéance prochaine action<input name="next_action_due_at" defaultValue={datetimeLocalValue(client?.nextActionDueAt ?? null)} type="datetime-local" className={inputClassName} /></label>
          <label className={`${labelClassName} md:col-span-2`}>Prochaine action<input name="next_step" defaultValue={client?.nextAction ?? client?.intake.nextStep ?? ''} className={inputClassName} placeholder="Relancer, envoyer BDC, récupérer accès..." /></label>
          <label className={`${labelClassName} md:col-span-2`}>Résumé santé<input name="health_summary" defaultValue={client?.healthSummary ?? ''} className={inputClassName} placeholder="Signal important, risque, contexte client" /></label>
          <label className={`${labelClassName} md:col-span-4`}>Notes internes<textarea name="notes" defaultValue={client?.notes ?? ''} rows={3} className={textareaClassName} placeholder="Notes utiles sur la relation ou le compte" /></label>
        </div>
      </section>

      <section className="grid gap-3">
        <h2 className="text-sm font-semibold tracking-[-0.01em] text-zinc-100">Qualification</h2>
        <div className="grid gap-4 border-t border-white/[0.08] pt-4 md:grid-cols-3">
          <label className={labelClassName}>Étape<select name="intake_stage" defaultValue={client?.intake.stage ?? 'potential'} className={inputClassName}><option value="potential">Potentiel</option><option value="meeting_booked">Rdv planifié</option><option value="meeting_done">Rdv fait</option><option value="proposal_sent">Proposition envoyée</option><option value="won">Gagné</option><option value="lost">Perdu</option></select></label>
          <label className={labelClassName}>Rendez-vous<select name="meeting_status" defaultValue={client?.intake.meetingStatus ?? 'not_booked'} className={inputClassName}><option value="not_booked">Non planifié</option><option value="booked">Planifié</option><option value="done">Fait</option><option value="cancelled">Annulé</option></select></label>
          <label className={labelClassName}>Source<input name="source" defaultValue={client?.intake.source ?? ''} className={inputClassName} placeholder="LinkedIn, site, recommandation" /></label>
          <label className={labelClassName}>Planifié pour<input name="meeting_booked_at" defaultValue={datetimeLocalValue(client?.intake.meetingBookedAt ?? null)} type="datetime-local" className={inputClassName} /></label>
          <label className={labelClassName}>Fait le<input name="meeting_done_at" defaultValue={datetimeLocalValue(client?.intake.meetingDoneAt ?? null)} type="datetime-local" className={inputClassName} /></label>
          <label className={labelClassName}>Outils<input name="tools_input" defaultValue={client?.tools?.join(', ') ?? ''} className={inputClassName} placeholder="Notion, Stripe, HubSpot" /></label>
          <label className={labelClassName}>Budget<input name="budget_range" defaultValue={client?.intake.budgetRange ?? ''} className={inputClassName} placeholder="2k setup + 500/mo" /></label>
          <label className={labelClassName}>Calendrier<input name="timeline" defaultValue={client?.intake.timeline ?? ''} className={inputClassName} placeholder="ASAP, T2..." /></label>
          <label className={`${labelClassName} md:col-span-3`}>Objectif client<textarea name="desired_outcome" defaultValue={client?.intake.desiredOutcome ?? ''} rows={4} className={textareaClassName} placeholder="Besoin, objectif, résultat attendu" /></label>
          <label className={`${labelClassName} md:col-span-3`}>Notes de rendez-vous<textarea name="meeting_notes" defaultValue={client?.intake.meetingNotes ?? ''} rows={4} className={textareaClassName} placeholder="Objections, contexte, décisionnaires, contraintes" /></label>
        </div>
      </section>

      <section className="grid gap-3">
        <h2 className="text-sm font-semibold tracking-[-0.01em] text-zinc-100">Import IA</h2>
        <div className="grid gap-4 border-t border-white/[0.08] pt-4">
          <label className={labelClassName}>Notes à analyser<textarea name="raw_context" defaultValue={client?.intake.rawContextPreview ?? ''} rows={8} className={textareaClassName} placeholder="Colle un call, un email, une note LinkedIn ou du contexte brut. L’IA complète la fiche si elle trouve mieux." /></label>
          <label className="flex items-center gap-2 text-sm font-medium text-zinc-300">
            <input name="index_as_knowledge" type="checkbox" defaultChecked className="size-4 rounded border-white/10 bg-[#050506] text-blue-500" />
            <ClipboardPaste className="size-4 text-zinc-500" />
            Analyser et indexer pour les agents
          </label>
        </div>
      </section>

      <div className="flex justify-end border-t border-white/[0.08] pt-5">
        <button type="submit" className="inline-flex h-10 items-center gap-2 rounded bg-[#3b82f6] px-4 text-sm font-semibold text-white transition hover:bg-[#60a5fa]">
          <Save className="size-4" />
          {submitLabel}
        </button>
      </div>
    </form>
  );
}
