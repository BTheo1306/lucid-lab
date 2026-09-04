import type { CallReport, CallType, ClientFile } from './types'

export const CALL_TYPES: { id: CallType; label: string }[] = [
  { id: 'appel-recu', label: 'Appel reçu' },
  { id: 'appel-passe', label: 'Appel passé' },
  { id: 'rdv', label: 'RDV' },
  { id: 'visite-atelier', label: 'Visite atelier' },
  { id: 'visite-chantier', label: 'Visite chantier' },
]

export const CALL_REPORT: CallReport = {
  type: 'appel-recu',
  groupeId: 'garage',
  date: '09/09, 11:40',
  transcript:
    "M. Pereira confirme la pose de l'enseigne vendredi matin, la nacelle est réservée. Il veut la même police que sur le camion. Il demande un devis pour le marquage du deuxième utilitaire, même visuel, livraison fin du mois.",
  extractActions: true,
}

export const AUTOCOMPLETE_QUERY = 'gar'

export const CLIENT_FILE: ClientFile = {
  groupeId: 'garage',
  history: [
    { date: '09/09, 11:40', text: 'Appel reçu : pose vendredi confirmée, même police que le camion, devis à faire pour le 2e utilitaire.', isNew: true },
    { date: '28/08', text: "BAT de l'enseigne façade envoyé, validé le 09/09 par mail." },
    { date: '19/08', text: "Devis enseigne façade accepté, acompte reçu." },
    { date: '12/03', text: 'Marquage du camion atelier livré, client satisfait, veut le même visuel partout.' },
    { date: '2019', text: 'Premier dossier : panneau parking et lettrage porte.' },
  ],
  procedures: [
    'Bon de commande signé avant toute production.',
    'Facturation à 30 jours, relance au 35e jour.',
    "Accès à l'atelier par l'arrière, demander Sandra.",
  ],
  pastPostes: ['Marquage camion atelier (mars 2026)', 'Panneau parking (2021)', 'Lettrage porte (2019)'],
}
