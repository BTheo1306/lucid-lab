import type { ExistingLead, Lead } from './types'

/** The 08:02 request that opens the day. */
export const LEAD: Lead = {
  id: 'lead-marchand',
  name: 'Julien Marchand',
  trade: 'films',
  windows: 6,
  surfaceM2: 18,
  address: '12 rue des Tilleuls, 37000 Tours',
  phone: '06 39 98 45 67',
  email: 'julien.marchand@example.org',
  attachment: 'fenetres-sud.jpg',
  source: 'site',
  receivedAt: '08:02',
  stage: 'rdv-demande',
}

/** Values typed into the site form, in the order they appear on screen. */
export const FORM_VALUES = {
  trade: 'Film solaire pour vitrages',
  windows: '6',
  surface: '18 m²',
  address: LEAD.address,
  attachment: LEAD.attachment,
  name: LEAD.name,
  phone: LEAD.phone,
  email: LEAD.email,
  message: 'Bureau plein sud, trop chaud dès 11 h. Photo jointe.',
} as const

export const TRADE_OPTIONS = [
  'Enseigne ou panneau',
  'Adhésifs et vitrophanie',
  'Bâche ou banderole',
  'Marquage véhicule',
  'Film solaire pour vitrages',
] as const

/** Leads already in the CRM before 08:02, most recent first. */
export const EXISTING_LEADS: ExistingLead[] = [
  {
    id: 'lead-1',
    name: 'Sandrine Petit',
    trade: 'enseigne',
    stage: 'devise',
    receivedAt: 'hier 16:40',
    summary: 'Enseigne lumineuse pour une boutique de centre-ville',
  },
  {
    id: 'lead-2',
    name: 'Karim Haddad',
    trade: 'vehicule',
    stage: 'nouveau',
    receivedAt: 'hier 11:05',
    summary: 'Marquage de deux utilitaires, logo fourni',
  },
  {
    id: 'lead-3',
    name: 'Élodie Fournier',
    trade: 'signaletique',
    stage: 'gagne',
    receivedAt: 'lundi 09:30',
    summary: 'Signalétique intérieure pour un cabinet médical',
  },
]

export const TRADE_LABEL: Record<Lead['trade'], string> = {
  films: 'Films',
  enseigne: 'Enseigne',
  vehicule: 'Véhicule',
  signaletique: 'Signalétique',
  impression: 'Impression',
}

export const LEAD_STAGE_LABEL: Record<ExistingLead['stage'], string> = {
  nouveau: 'Nouveau',
  'rdv-demande': 'RDV demandé',
  devise: 'Devisé',
  gagne: 'Gagné',
}
