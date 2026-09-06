import { groupeById } from './groupes'
import type { Machine, Person, Poste } from './types'

export const POSTES: Poste[] = [
  {
    id: 'p-camping-banderole',
    groupeId: 'camping',
    title: 'Banderole tournoi 3 x 1 m',
    stage: 'devis',
    ball: 'dirigeante',
    assignee: 'claire',
    tags: { stage: 'devis', owner: 'claire', due: '12/09', machine: 'impression-bache' },
    machine: 'impression-bache',
    material: 'bâche 510 g',
    urgency: 3,
    urgencyReason: 'échéance 12/09, client relancé 2 fois',
  },
  {
    id: 'p-garage-enseigne',
    groupeId: 'garage',
    title: 'Enseigne façade 4 x 0,6 m',
    stage: 'prod',
    ball: 'apprentie',
    assignee: 'lea',
    tags: { stage: 'prod', owner: 'lea', due: '11/09', machine: 'decoupe-blanc' },
    machine: 'decoupe-blanc',
    material: 'adhésif blanc mat',
    urgency: 2,
    urgencyReason: 'pose vendredi',
  },
  {
    id: 'p-boulangerie-vitro',
    groupeId: 'boulangerie',
    title: 'Vitrophanie horaires',
    stage: 'maquette',
    ball: 'client',
    assignee: 'claire',
    tags: { stage: 'maquette', owner: 'claire', due: '16/09', machine: 'decoupe-blanc' },
    machine: 'decoupe-blanc',
    material: 'dépoli',
    urgency: 1,
    waitingBat: true,
  },
  {
    id: 'p-salon-adhesifs',
    groupeId: 'salon',
    title: 'Adhésifs vitrine 2 faces',
    stage: 'prod',
    ball: 'dirigeante',
    assignee: 'claire',
    tags: { stage: 'prod', owner: 'claire', due: '10/09', machine: 'decoupe-blanc' },
    machine: 'decoupe-blanc',
    material: 'adhésif blanc mat',
    urgency: 2,
    urgencyReason: 'échéance demain',
  },
  {
    id: 'p-cabinet-lettrage',
    groupeId: 'cabinet',
    title: "Lettrage porte d'entrée",
    stage: 'prod',
    ball: 'dirigeante',
    assignee: 'claire',
    tags: { stage: 'prod', owner: 'claire', due: '11/09', machine: 'decoupe-blanc' },
    machine: 'decoupe-blanc',
    material: 'adhésif blanc mat',
    urgency: 2,
    urgencyReason: 'échéance 11/09',
  },
  {
    id: 'p-garage-utilitaire',
    groupeId: 'garage',
    title: 'Marquage utilitaire',
    stage: 'prod',
    ball: 'dirigeante',
    assignee: 'claire',
    tags: { stage: 'prod', owner: 'claire', due: '15/09', machine: 'decoupe-blanc' },
    machine: 'decoupe-blanc',
    material: 'adhésif blanc mat',
    urgency: 1,
  },
  {
    id: 'p-batiment-bache',
    groupeId: 'batiment',
    title: 'Bâche chantier 4 x 2 m',
    stage: 'prod',
    ball: 'dirigeante',
    assignee: 'claire',
    tags: { stage: 'prod', owner: 'claire', due: '09/09', machine: 'impression-bache' },
    machine: 'impression-bache',
    material: 'bâche 510 g',
    urgency: 3,
    urgencyReason: 'livraison aujourd\'hui',
  },
  {
    id: 'p-boulangerie-promo',
    groupeId: 'boulangerie',
    title: 'Banderole promo rentrée',
    stage: 'prod',
    ball: 'dirigeante',
    assignee: 'claire',
    tags: { stage: 'prod', owner: 'claire', due: '12/09', machine: 'impression-bache' },
    machine: 'impression-bache',
    material: 'bâche 440 g',
    urgency: 2,
    urgencyReason: 'échéance 12/09',
  },
  {
    id: 'p-camping-panneau',
    groupeId: 'camping',
    title: 'Panneau accueil 120 x 80',
    stage: 'prod',
    ball: 'dirigeante',
    assignee: 'claire',
    tags: { stage: 'prod', owner: 'claire', due: '12/09', machine: 'contre-collage' },
    machine: 'contre-collage',
    material: 'plaque rigide 3 mm',
    urgency: 2,
    urgencyReason: 'plaques livrées demain',
  },
  {
    id: 'p-garage-pose',
    groupeId: 'garage',
    title: 'Pose enseigne façade',
    stage: 'livraison',
    ball: 'dirigeante',
    assignee: 'claire',
    tags: { stage: 'livraison', owner: 'claire', due: '11/09', machine: 'pose' },
    machine: 'pose',
    urgency: 2,
    urgencyReason: 'vendredi matin, nacelle réservée',
  },
  {
    id: 'p-association-kakemono',
    groupeId: 'association',
    title: 'Kakémono 85 x 200 + flyers',
    stage: 'devis',
    ball: 'client',
    assignee: 'claire',
    tags: { stage: 'devis', owner: 'claire', due: '15/09' },
    urgency: 1,
  },
  {
    id: 'p-cabinet-plaque',
    groupeId: 'cabinet',
    title: 'Plaque professionnelle laiton',
    stage: 'devis',
    ball: 'client',
    assignee: 'claire',
    tags: { stage: 'devis', owner: 'claire', due: '20/09' },
    urgency: 0,
  },
  {
    id: 'p-salon-maquette',
    groupeId: 'salon',
    title: 'Maquette logo vitrine',
    stage: 'maquette',
    ball: 'apprentie',
    assignee: 'lea',
    tags: { stage: 'maquette', owner: 'lea', due: '10/09' },
    urgency: 2,
    urgencyReason: 'découpe prévue demain',
  },
  {
    id: 'p-boulangerie-maquette',
    groupeId: 'boulangerie',
    title: 'Maquette banderole promo',
    stage: 'maquette',
    ball: 'apprentie',
    assignee: 'lea',
    tags: { stage: 'maquette', owner: 'lea', due: '11/09' },
    urgency: 2,
    urgencyReason: 'impression jeudi',
  },
  {
    id: 'p-batiment-panneau',
    groupeId: 'batiment',
    title: 'Panneau de chantier permis',
    stage: 'maquette',
    ball: 'client',
    assignee: 'claire',
    tags: { stage: 'maquette', owner: 'claire', due: '18/09', machine: 'impression-adhesif' },
    machine: 'impression-adhesif',
    material: 'adhésif + plaque 5 mm',
    urgency: 1,
    waitingBat: true,
  },
]

export const MACHINE_LABEL: Record<Machine, string> = {
  'decoupe-blanc': 'Découpe blanc',
  'decoupe-couleur': 'Découpe couleur',
  'impression-bache': 'Impression bâche',
  'impression-adhesif': 'Impression adhésif',
  'contre-collage': 'Contre-collé',
  faconnage: 'Façonnage',
  pose: 'Pose',
}

export const STAGE_LABEL = {
  demande: 'Demande',
  devis: 'Devis',
  maquette: 'Maquette',
  prod: 'Prod',
  livraison: 'Livraison',
  facture: 'Facture',
} as const

export const BALL_LABEL = {
  dirigeante: 'Chez vous',
  apprentie: 'Chez Léa',
  client: 'Chez le client',
  fournisseur: 'Chez le fournisseur',
} as const

export const OWNER_HANDLE: Record<Person, string> = { claire: '@claire', lea: '@lea' }

/** Renders the one-line grammar: "Titre #étape @qui ~JJ/MM %type". */
export function tagLine(p: Poste): string {
  const parts = [p.title, `#${p.tags.stage}`, OWNER_HANDLE[p.tags.owner], `~${p.tags.due}`]
  if (p.tags.machine) parts.push(`%${machineTag(p.tags.machine)}`)
  return parts.join(' ')
}

export function machineTag(m: Machine): string {
  switch (m) {
    case 'decoupe-blanc':
      return 'dec-blanc'
    case 'decoupe-couleur':
      return 'dec-couleur'
    case 'impression-bache':
      return 'imp-bache'
    case 'impression-adhesif':
      return 'imp-adhesif'
    case 'contre-collage':
      return 'cc'
    case 'faconnage':
      return 'facon'
    case 'pose':
      return 'pose'
  }
}

export function groupeName(p: Poste): string {
  return groupeById(p.groupeId).name
}

/** "6 choses max aujourd'hui": urgency first, then deadline, capped at six. */
export function todayList(postes: Poste[] = POSTES): Poste[] {
  return [...postes]
    .filter((p) => !p.waitingBat && p.ball === 'dirigeante')
    .sort((a, b) => b.urgency - a.urgency || a.tags.due.localeCompare(b.tags.due))
    .slice(0, 6)
}

export function kpis(postes: Poste[] = POSTES) {
  return {
    today: todayList(postes).length,
    atClients: postes.filter((p) => p.ball === 'client').length,
    atApprentice: postes.filter((p) => p.ball === 'apprentie').length,
    atelier: atelierGroups(postes).reduce((n, g) => n + g.postes.length, 0),
  }
}

/** Workshop view: launchable production grouped by machine, then material. */
export function atelierGroups(postes: Poste[] = POSTES) {
  const launchable = postes.filter(
    (p) => p.machine && p.machine !== 'pose' && p.stage === 'prod' && !p.waitingBat && p.ball === 'dirigeante',
  )
  const order: Machine[] = ['decoupe-blanc', 'decoupe-couleur', 'impression-bache', 'impression-adhesif', 'contre-collage', 'faconnage']
  return order
    .map((machine) => ({ machine, label: MACHINE_LABEL[machine], postes: launchable.filter((p) => p.machine === machine) }))
    .filter((g) => g.postes.length > 0)
}

export function poseList(postes: Poste[] = POSTES): Poste[] {
  return postes.filter((p) => p.machine === 'pose' && !p.waitingBat)
}

export function waitingBatList(postes: Poste[] = POSTES): Poste[] {
  return postes.filter((p) => p.waitingBat)
}

/** What the apprentice sees: her mockups and cutting files only. */
export function leaMaquettes(postes: Poste[] = POSTES): Poste[] {
  return postes.filter((p) => p.assignee === 'lea')
}

export function devisToWrite(postes: Poste[] = POSTES): Poste[] {
  return postes.filter((p) => p.stage === 'devis')
}
