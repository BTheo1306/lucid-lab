import type { TimeSavedRow } from './types'

/**
 * Declared by the owner of the reference workshop (her own inventory), not
 * measured by Lucid-Lab. Shown as an estimate to recompute with the prospect.
 */
export const TIME_SAVED_ROWS: TimeSavedRow[] = [
  { task: 'Tri de la boîte mail (matin)', before: '~15 min', frequency: 'tous les jours', now: 'lit le résumé', gainMinPerWeek: 70 },
  { task: 'Mise à jour de la liste de tâches (soir)', before: '~12 min', frequency: 'tous les jours', now: 'automatique', gainMinPerWeek: 70 },
  { task: "Création d'un devis", before: '~25 min', frequency: '~6 par semaine', now: '~5 min', gainMinPerWeek: 120 },
  { task: 'Bon à tirer et validation client', before: '~25 min', frequency: '~4 par semaine', now: '~6 min', gainMinPerWeek: 75 },
  { task: 'Retrouver une info (prix, historique client)', before: '~5 min', frequency: 'plusieurs par jour', now: '~30 s', gainMinPerWeek: 60 },
  { task: 'Rangement des fichiers clients', before: '~10 min', frequency: 'tous les jours', now: 'automatique', gainMinPerWeek: 50 },
  { task: 'Faire le point de la journée', before: '~8 min', frequency: 'tous les jours', now: 'un seul écran', gainMinPerWeek: 30 },
  { task: 'Tri des tickets de frais', before: '~30 min', frequency: 'chaque semaine', now: '~5 min', gainMinPerWeek: 25 },
  { task: 'Factures fournisseurs et contrôle des paiements', before: '~30 min', frequency: 'chaque semaine', now: '~5 min', gainMinPerWeek: 25 },
  { task: 'Indemnités kilométriques', before: '~3 min', frequency: 'par trajet', now: 'dictée au téléphone', gainMinPerWeek: 15 },
  { task: 'Alerte « maquette prête »', before: 'surveillance', frequency: 'en continu', now: 'automatique', gainMinPerWeek: 10 },
  { task: 'Factures en ligne vers la compta', before: '~10 min', frequency: 'chaque mois', now: 'automatique', gainMinPerWeek: 5 },
]

export function formatHours(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h} h ${m.toString().padStart(2, '0')}`
}

export function timeSavedTotals(rows: TimeSavedRow[] = TIME_SAVED_ROWS) {
  const perWeek = rows.reduce((n, r) => n + r.gainMinPerWeek, 0)
  const perMonth = Math.round((perWeek * 52) / 12)
  return {
    perWeekMin: perWeek,
    perWeekLabel: formatHours(perWeek),
    perMonthHours: Math.round(perMonth / 60),
    /** 35 h per week is the reference full-time position in France. */
    shareOfPosition: perWeek / (35 * 60),
  }
}
