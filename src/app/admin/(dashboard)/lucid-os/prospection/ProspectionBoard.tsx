'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Phone, Mail, Globe, ExternalLink } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CopyButton } from '../../lead-engine/CopyButton';
import { EmptyState, StatusBadge, formatAdminDate, formatAdminDateTime } from '../components';
import { recordTouchAction, setOwnerAction } from './actions';

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
};

/** Issues notables en un clic : celles qui n'ont besoin ni de date ni de commentaire. */
const QUICK_OUTCOMES = ['barrage', 'repondeur', 'injoignable', 'refus'] as const;

/** Issues qui demandent un contexte, donc passées par le formulaire replié. */
const FORM_OUTCOMES = ['a_rappeler', 'interesse', 'rdv_pris', 'email_envoye', 'relance', 'note'] as const;

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

export function ProspectionBoard({ targets }: { targets: BoardTarget[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [openForm, setOpenForm] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function submit(input: Parameters<typeof recordTouchAction>[0]): void {
    setError(null);
    startTransition(async () => {
      try {
        await recordTouchAction(input);
        setOpenForm(null);
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
        const isOpen = openForm === target.companyId;
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
                onClick={() => setOpenForm(isOpen ? null : target.companyId)}
                className={cn(quickButtonClass, isOpen && 'border-blue-300 bg-blue-50 text-blue-700')}
              >
                {isOpen ? 'Fermer' : 'Noter autre chose'}
              </button>
              {target.touches.length > 1 ? (
                <span className="text-xs text-zinc-400">{target.touches.length} actions</span>
              ) : null}
            </div>

            {isOpen ? (
              <TouchForm
                target={target}
                pending={pending}
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
          </article>
        );
      })}
    </div>
  );
}

function TouchForm({
  target,
  pending,
  onSubmit,
}: {
  target: BoardTarget;
  pending: boolean;
  onSubmit: (values: { outcome: string; notes: string | null; callbackAt: string | null }) => void;
}) {
  const [outcome, setOutcome] = useState<string>('a_rappeler');
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
          Cette issue crée la fiche de {target.name} dans le CRM clients.
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
