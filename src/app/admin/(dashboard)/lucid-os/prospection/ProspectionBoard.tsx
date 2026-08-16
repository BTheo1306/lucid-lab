'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, Mail, Globe, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CopyButton } from '../../lead-engine/CopyButton';
import { EmptyState, StatusBadge, formatAdminDate, formatAdminDateTime } from '../components';
import { recordTouchAction, setOwnerAction, updateContactAction } from './actions';

/**
 * Board de prospection : une carte par cible, les issues d'appel en un clic.
 *
 * Classes claires uniquement (admin-dark.css les retourne en sombre).
 * Bleu = accent interactif, emerald réservé au statut « bon ».
 */

type BoardTouch = {
  id: string;
  channel: string;
  outcome: string;
  notes: string | null;
  ownerLabel: string | null;
  occurredAt: string;
  callbackAt: string | null;
};

export type BoardTarget = {
  companyId: string;
  name: string;
  city: string | null;
  sector: string | null;
  employeeCount: number | null;
  websiteUrl: string | null;
  ownerLabel: string | null;
  status: string;
  personId: string | null;
  contactName: string | null;
  contactTitle: string | null;
  contactPhone: string | null;
  contactEmail: string | null;
  contactLinkedin: string | null;
  hook: string | null;
  touches: BoardTouch[];
  lastTouch: BoardTouch | null;
  callbackAt: string | null;
  callbackDue: boolean;
};

const OUTCOME_LABELS: Record<string, string> = {
  barrage: 'Barrage',
  repondeur: 'Répondeur',
  injoignable: 'Injoignable',
  refus: 'Refus',
  a_rappeler: 'À rappeler',
  interesse: 'A répondu',
  rdv_pris: 'RDV pris',
  email_envoye: 'Email envoyé',
  relance: 'Relancé',
  note: 'Note',
  mauvais_numero: 'Mauvais numéro',
  pas_le_bon_interlocuteur: 'Pas le bon interlocuteur',
};

/**
 * Issues qui font entrer la cible dans le CRM clients. Elles sont en tête de la
 * barre d'actions : c'est le seul résultat d'appel qui compte vraiment, il n'a
 * rien à faire au fond d'un menu. Elles ouvrent le formulaire plutôt que de
 * partir en un clic, parce qu'elles créent une fiche client.
 */
const PROMOTING_OUTCOMES = ['interesse', 'rdv_pris'] as const;

/** Issues notables en un clic : celles qui n'ont besoin ni de date ni de commentaire. */
const QUICK_OUTCOMES = ['barrage', 'repondeur', 'injoignable', 'refus'] as const;

/** Issues qui demandent un contexte, donc passées par le formulaire replié. */
const FORM_OUTCOMES = [
  'a_rappeler',
  'interesse',
  'rdv_pris',
  'email_envoye',
  'relance',
  'mauvais_numero',
  'pas_le_bon_interlocuteur',
  'note',
] as const;

const STATUS_LABELS: Record<string, { label: string; tone: 'neutral' | 'good' | 'warning' | 'danger' }> = {
  discovered: { label: 'À appeler', tone: 'neutral' },
  enriched: { label: 'À appeler', tone: 'neutral' },
  validated: { label: 'À appeler', tone: 'neutral' },
  approved: { label: 'À appeler', tone: 'neutral' },
  contacted: { label: 'Contacté', tone: 'warning' },
  replied: { label: 'A répondu', tone: 'good' },
  meeting_booked: { label: 'RDV pris', tone: 'good' },
  converted: { label: 'Client', tone: 'good' },
  disqualified: { label: 'Écarté', tone: 'danger' },
  do_not_contact: { label: 'Ne pas contacter', tone: 'danger' },
};

const OWNERS = ['Jules', 'Anthony', 'Théo'];

const quickButtonClass =
  'inline-flex h-8 items-center rounded border border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-700 transition-colors hover:border-zinc-300 hover:bg-zinc-50 disabled:opacity-50';

const promoteButtonClass =
  'inline-flex h-8 items-center rounded border border-blue-200 bg-blue-50 px-2.5 text-xs font-semibold text-blue-700 transition-colors hover:border-blue-300 hover:bg-blue-100 disabled:opacity-50';

/** Formulaire ouvert sur une carte : soit une issue d'appel, soit la fiche contact. */
type OpenPanel =
  | { companyId: string; kind: 'touch'; outcome: string }
  | { companyId: string; kind: 'contact' };

export function ProspectionBoard({ targets }: { targets: BoardTarget[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [panel, setPanel] = useState<OpenPanel | null>(null);
  const [error, setError] = useState<string | null>(null);

  function submit(input: Parameters<typeof recordTouchAction>[0]): void {
    setError(null);
    startTransition(async () => {
      try {
        await recordTouchAction(input);
        setPanel(null);
        router.refresh();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "L'enregistrement a échoué.");
      }
    });
  }

  function saveContact(input: Parameters<typeof updateContactAction>[0]): void {
    setError(null);
    startTransition(async () => {
      try {
        await updateContactAction(input);
        setPanel(null);
        router.refresh();
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "L'enregistrement a échoué.");
      }
    });
  }

  if (targets.length === 0) {
    return <EmptyState>Aucune cible ne correspond à ce filtre.</EmptyState>;
  }

  return (
    <div className="grid gap-3">
      {error ? (
        <p className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</p>
      ) : null}

      {targets.map((target) => {
        const status = STATUS_LABELS[target.status] ?? { label: target.status, tone: 'neutral' as const };
        const openTouch = panel?.companyId === target.companyId && panel.kind === 'touch' ? panel : null;
        const contactOpen = panel?.companyId === target.companyId && panel.kind === 'contact';
        const callbackLate = target.callbackDue;

        return (
          <article
            key={target.companyId}
            className={cn(
              'rounded-xl border border-zinc-200 bg-white p-4 shadow-sm',
              callbackLate && 'border-blue-300',
            )}
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <h3 className="text-sm font-semibold text-zinc-950">{target.name}</h3>
                <p className="mt-0.5 text-xs text-zinc-500">
                  {[target.city, target.employeeCount ? `${target.employeeCount} salariés` : null, target.sector]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
                <select
                  aria-label="Propriétaire"
                  defaultValue={target.ownerLabel ?? ''}
                  disabled={pending}
                  onChange={(event) => {
                    const value = event.target.value;
                    startTransition(async () => {
                      await setOwnerAction(target.companyId, value);
                      router.refresh();
                    });
                  }}
                  className="h-8 rounded border border-zinc-200 bg-white px-2 text-xs text-zinc-700"
                >
                  <option value="">Personne</option>
                  {OWNERS.map((owner) => (
                    <option key={owner} value={owner}>
                      {owner}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mt-3 grid gap-1 text-sm">
              <p className="text-zinc-900">
                {target.contactName ?? <span className="text-zinc-400">Contact non trouvé</span>}
                {target.contactTitle ? <span className="text-zinc-500"> · {target.contactTitle}</span> : null}
              </p>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                {target.contactPhone ? (
                  <span className="flex items-center gap-1.5">
                    <Phone className="size-3.5 text-zinc-400" />
                    <a href={`tel:${target.contactPhone.replace(/\s+/g, '')}`} className="font-medium text-blue-700">
                      {target.contactPhone}
                    </a>
                    <CopyButton text={target.contactPhone} label="Copier" />
                  </span>
                ) : (
                  <span className="text-zinc-400">Téléphone non trouvé</span>
                )}
                {target.contactEmail ? (
                  <a href={`mailto:${target.contactEmail}`} className="flex items-center gap-1.5 text-blue-700">
                    <Mail className="size-3.5 text-zinc-400" />
                    {target.contactEmail}
                  </a>
                ) : null}
                {target.websiteUrl ? (
                  <a
                    href={target.websiteUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-blue-700"
                  >
                    <Globe className="size-3.5 text-zinc-400" />
                    Site
                  </a>
                ) : null}
                {target.contactLinkedin ? (
                  <a
                    href={target.contactLinkedin}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-blue-700"
                  >
                    <ExternalLink className="size-3.5 text-zinc-400" />
                    LinkedIn
                  </a>
                ) : null}
              </div>
            </div>

            {target.hook ? (
              <p className="mt-3 rounded border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs leading-5 text-zinc-700">
                {target.hook}
              </p>
            ) : null}

            {target.callbackAt ? (
              <p className={cn('mt-3 text-xs', callbackLate ? 'font-semibold text-blue-700' : 'text-zinc-500')}>
                Rappel prévu le {formatAdminDate(target.callbackAt)}
              </p>
            ) : null}

            {target.lastTouch ? (
              <p className="mt-3 text-xs text-zinc-500">
                Dernière action : {OUTCOME_LABELS[target.lastTouch.outcome] ?? target.lastTouch.outcome} le{' '}
                {formatAdminDateTime(target.lastTouch.occurredAt)}
                {target.lastTouch.ownerLabel ? ` par ${target.lastTouch.ownerLabel}` : ''}
                {target.lastTouch.notes ? ` · ${target.lastTouch.notes}` : ''}
              </p>
            ) : null}

            <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-zinc-100 pt-3">
              {PROMOTING_OUTCOMES.map((outcome) => (
                <button
                  key={outcome}
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    setPanel(
                      openTouch?.outcome === outcome
                        ? null
                        : { companyId: target.companyId, kind: 'touch', outcome },
                    )
                  }
                  className={cn(promoteButtonClass, openTouch?.outcome === outcome && 'border-blue-400 bg-blue-100')}
                >
                  {OUTCOME_LABELS[outcome]}
                </button>
              ))}
              {QUICK_OUTCOMES.map((outcome) => (
                <button
                  key={outcome}
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    submit({
                      companyId: target.companyId,
                      personId: target.personId,
                      outcome,
                      ownerLabel: target.ownerLabel,
                    })
                  }
                  className={quickButtonClass}
                >
                  {OUTCOME_LABELS[outcome]}
                </button>
              ))}
              <button
                type="button"
                onClick={() =>
                  setPanel(
                    openTouch && !PROMOTING_OUTCOMES.includes(openTouch.outcome as (typeof PROMOTING_OUTCOMES)[number])
                      ? null
                      : { companyId: target.companyId, kind: 'touch', outcome: 'a_rappeler' },
                  )
                }
                className={quickButtonClass}
              >
                Noter autre chose
              </button>
              <button
                type="button"
                onClick={() => setPanel(contactOpen ? null : { companyId: target.companyId, kind: 'contact' })}
                className={cn(quickButtonClass, contactOpen && 'border-blue-300 bg-blue-50 text-blue-700')}
              >
                {contactOpen ? 'Fermer' : 'Modifier la fiche'}
              </button>
              {target.touches.length > 1 ? (
                <span className="text-xs text-zinc-400">{target.touches.length} actions</span>
              ) : null}
            </div>

            {openTouch ? (
              <TouchForm
                // Remonter l'issue en clé remet le formulaire à zéro quand on
                // passe d'un bouton à l'autre sans le refermer.
                key={openTouch.outcome}
                target={target}
                pending={pending}
                initialOutcome={openTouch.outcome}
                onSubmit={(values) =>
                  submit({
                    companyId: target.companyId,
                    personId: target.personId,
                    outcome: values.outcome,
                    notes: values.notes,
                    callbackAt: values.callbackAt,
                    ownerLabel: target.ownerLabel,
                  })
                }
              />
            ) : null}

            {contactOpen ? (
              <ContactForm
                target={target}
                pending={pending}
                onSubmit={(values) => saveContact({ companyId: target.companyId, ...values })}
              />
            ) : null}
          </article>
        );
      })}
    </div>
  );
}

function TouchForm({
  target,
  pending,
  initialOutcome,
  onSubmit,
}: {
  target: BoardTarget;
  pending: boolean;
  initialOutcome: string;
  onSubmit: (values: { outcome: string; notes: string | null; callbackAt: string | null }) => void;
}) {
  const [outcome, setOutcome] = useState<string>(initialOutcome);
  const [notes, setNotes] = useState('');
  const [callbackAt, setCallbackAt] = useState('');

  const needsCallback = outcome === 'a_rappeler';
  const promotes = outcome === 'interesse' || outcome === 'rdv_pris';

  return (
    <div className="mt-3 grid gap-3 rounded border border-zinc-200 bg-zinc-50 p-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1 text-xs font-medium text-zinc-600">
          Issue
          <select
            value={outcome}
            onChange={(event) => setOutcome(event.target.value)}
            className="h-9 rounded border border-zinc-300 bg-white px-2 text-sm text-zinc-900"
          >
            {FORM_OUTCOMES.map((value) => (
              <option key={value} value={value}>
                {OUTCOME_LABELS[value]}
              </option>
            ))}
          </select>
        </label>
        {needsCallback ? (
          <label className="grid gap-1 text-xs font-medium text-zinc-600">
            Rappeler le
            <input
              type="date"
              value={callbackAt}
              onChange={(event) => setCallbackAt(event.target.value)}
              className="h-9 rounded border border-zinc-300 bg-white px-2 text-sm text-zinc-900"
            />
          </label>
        ) : null}
      </div>

      <label className="grid gap-1 text-xs font-medium text-zinc-600">
        Ce qui s&apos;est dit
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          rows={2}
          placeholder="Utile pour le prochain appel : qui décide, quand rappeler, ce qui les intéresse."
          className="rounded border border-zinc-300 bg-white px-2 py-1.5 text-sm text-zinc-900"
        />
      </label>

      {promotes ? (
        <p className="text-xs text-blue-700">
          Cette issue fait entrer {target.name} dans les prospects du CRM clients, avec une tâche de suivi.
        </p>
      ) : null}
      {outcome === 'mauvais_numero' || outcome === 'pas_le_bon_interlocuteur' ? (
        <p className="text-xs text-zinc-500">
          La cible reste dans « À appeler ». Corrigez la fiche avec « Modifier la fiche » avant de rappeler.
        </p>
      ) : null}

      <div>
        <button
          type="button"
          disabled={pending || (needsCallback && !callbackAt)}
          onClick={() =>
            onSubmit({
              outcome,
              notes: notes.trim() || null,
              callbackAt: needsCallback ? callbackAt : null,
            })
          }
          className="inline-flex h-9 items-center rounded bg-zinc-950 px-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
        >
          Enregistrer
        </button>
      </div>
    </div>
  );
}

type ContactValues = {
  contactName: string;
  contactTitle: string;
  contactPhone: string;
  contactEmail: string;
  contactLinkedin: string;
  websiteUrl: string;
};

const CONTACT_FIELDS: Array<{ key: keyof ContactValues; label: string; type?: string; placeholder?: string }> = [
  { key: 'contactName', label: 'Contact à joindre', placeholder: 'Prénom Nom' },
  { key: 'contactTitle', label: 'Fonction', placeholder: 'Gérant, expert-comptable associé…' },
  { key: 'contactPhone', label: 'Téléphone', type: 'tel', placeholder: '02 47 00 00 00' },
  { key: 'contactEmail', label: 'Email', type: 'email', placeholder: 'contact@cabinet.fr' },
  { key: 'contactLinkedin', label: 'LinkedIn', type: 'url', placeholder: 'https://www.linkedin.com/in/…' },
  { key: 'websiteUrl', label: 'Site', type: 'url', placeholder: 'https://www.cabinet.fr' },
];

/**
 * Correction de fiche. Les champs sont préremplis avec l'existant et renvoyés
 * en bloc : on complète un téléphone manquant sans perdre le reste.
 */
function ContactForm({
  target,
  pending,
  onSubmit,
}: {
  target: BoardTarget;
  pending: boolean;
  onSubmit: (values: ContactValues) => void;
}) {
  const [values, setValues] = useState<ContactValues>({
    contactName: target.contactName ?? '',
    contactTitle: target.contactTitle ?? '',
    contactPhone: target.contactPhone ?? '',
    contactEmail: target.contactEmail ?? '',
    contactLinkedin: target.contactLinkedin ?? '',
    websiteUrl: target.websiteUrl ?? '',
  });

  return (
    <div className="mt-3 grid gap-3 rounded border border-zinc-200 bg-zinc-50 p-3">
      <p className="text-xs text-zinc-500">
        Ce qui est déjà rempli est repris ci-dessous. Videz un champ pour l&apos;effacer.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {CONTACT_FIELDS.map((field) => (
          <label key={field.key} className="grid gap-1 text-xs font-medium text-zinc-600">
            {field.label}
            <input
              type={field.type ?? 'text'}
              value={values[field.key]}
              placeholder={field.placeholder}
              onChange={(event) => setValues((current) => ({ ...current, [field.key]: event.target.value }))}
              className="h-9 rounded border border-zinc-300 bg-white px-2 text-sm text-zinc-900"
            />
          </label>
        ))}
      </div>
      <div>
        <button
          type="button"
          disabled={pending}
          onClick={() => onSubmit(values)}
          className="inline-flex h-9 items-center rounded bg-zinc-950 px-3 text-sm font-semibold text-white transition-colors hover:bg-zinc-800 disabled:opacity-50"
        >
          Enregistrer la fiche
        </button>
      </div>
    </div>
  );
}
