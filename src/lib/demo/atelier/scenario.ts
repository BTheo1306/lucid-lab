import type { Scene } from './types'

/**
 * The ten scenes of the day. `at` is in ms after the scene entry; `duration`
 * is the autoplay time on the scene. Tuned against the recorded video so the
 * whole run stays between 88 and 92 s.
 */
export const SCENES: Scene[] = [
  {
    id: 'intro',
    index: 0,
    clock: null,
    title: "Une journée à l'atelier, avec l'assistant",
    caption: '',
    device: 'none',
    steps: [
      { id: 'title', at: 200 },
      { id: 'disclaimer', at: 900 },
      { id: 'cta', at: 1500 },
    ],
    duration: 4000,
  },
  {
    id: 'formulaire',
    index: 1,
    clock: '08:02',
    title: 'Une demande arrive sur le site',
    caption:
      "Un prospect remplit le formulaire de votre site depuis son téléphone : métier, surface, adresse, photo. Vous n'avez rien à ressaisir.",
    device: 'phone',
    steps: [
      { id: 'focus-metier', at: 400 },
      { id: 'pick-metier', at: 1200 },
      { id: 'type-fenetres', at: 2000 },
      { id: 'type-surface', at: 2900 },
      { id: 'type-adresse', at: 3800 },
      { id: 'attach-photo', at: 5400 },
      { id: 'type-contact', at: 6000 },
      { id: 'submit', at: 7600 },
      { id: 'success', at: 8400 },
    ],
    duration: 10000,
  },
  {
    id: 'reponse',
    index: 2,
    clock: '08:02',
    title: 'La réponse part toute seule',
    caption:
      'La réponse part dans la seconde, à votre nom, avec le relevé gratuit et le rappel sous 24 h. Vous recevez le résumé structuré sur votre téléphone.',
    device: 'split',
    steps: [
      { id: 'mail-row', at: 300 },
      { id: 'mail-open', at: 1500 },
      { id: 'benefits', at: 3000 },
      { id: 'notif', at: 4800 },
      { id: 'notif-lines', at: 5600 },
    ],
    duration: 9000,
  },
  {
    id: 'crm',
    index: 3,
    clock: '08:02',
    title: 'Le suivi est déjà à jour',
    caption:
      "La demande est déjà dans le suivi, à l'étape RDV demandé, avec la photo et le numéro à appeler en un clic.",
    device: 'browser',
    steps: [
      { id: 'row', at: 600 },
      { id: 'badges', at: 1800 },
      { id: 'counter', at: 2600 },
    ],
    duration: 7000,
  },
  {
    id: 'boite',
    index: 4,
    clock: '08:15',
    title: 'La boîte du matin',
    caption:
      'Les mails de la nuit sont devenus des fiches à décider. Vous acceptez, vous transmettez, vous classez. Chaque fiche traitée marque le mail comme lu.',
    device: 'browser',
    steps: [
      { id: 'cards', at: 300 },
      { id: 'answer-q2', at: 2300 },
      { id: 'accept-1', at: 4300 },
      { id: 'forward-3', at: 7300 },
      { id: 'read-badges', at: 10300 },
    ],
    duration: 13000,
  },
  {
    id: 'journee',
    index: 5,
    clock: '08:30',
    title: "Ma journée, puis l'atelier",
    caption:
      "Ma journée calcule l'urgence à votre place, six choses maximum. L'atelier regroupe les postes par machine et par matière. Léa ne voit que ses maquettes.",
    device: 'browser',
    steps: [
      { id: 'kpis', at: 300 },
      { id: 'list', at: 2000 },
      { id: 'atelier', at: 4300 },
      { id: 'groups', at: 4600 },
      { id: 'bat', at: 6000 },
      { id: 'switch-lea', at: 8600 },
      { id: 'lea-view', at: 8900 },
    ],
    duration: 11500,
  },
  {
    id: 'compte-rendu',
    index: 6,
    clock: '11:40',
    title: 'Un client appelle',
    caption:
      "Vous dictez, l'assistant retrouve le dossier parmi des centaines et range le compte rendu à la date du jour. Une case suffit pour qu'il en tire les actions.",
    device: 'browser',
    steps: [
      { id: 'type', at: 300 },
      { id: 'client', at: 1300 },
      { id: 'pick-client', at: 2800 },
      { id: 'dictate', at: 3300 },
      { id: 'transcript', at: 3600 },
      { id: 'checkbox', at: 7300 },
      { id: 'save', at: 8000 },
      { id: 'drawer', at: 8600 },
      { id: 'counter', at: 9800 },
    ],
    duration: 11000,
  },
  {
    id: 'commande',
    index: 7,
    clock: '14:00',
    title: 'La commande fournisseur',
    caption:
      'La liste de courses est groupée par fournisseur, avec le client concerné. Le mail de commande est rédigé dans votre style, en brouillon, jamais envoyé sans vous.',
    device: 'browser',
    steps: [
      { id: 'list', at: 300 },
      { id: 'click', at: 2300 },
      { id: 'draft', at: 2800 },
      { id: 'probable', at: 5800 },
      { id: 'result', at: 6800 },
      { id: 'move', at: 7600 },
    ],
    duration: 9000,
  },
  {
    id: 'facturation',
    index: 8,
    clock: '17:30',
    title: 'La facturation, dans le même écran',
    caption:
      'Émis, encaissé, en attente, en retard : la facturation vit dans le même écran. Les retards sont nommés, les devis à rédiger sont déduits des postes.',
    device: 'browser',
    steps: [
      { id: 'rows', at: 300 },
      { id: 'tiles', at: 2300 },
      { id: 'banner', at: 3300 },
      { id: 'devis', at: 5000 },
    ],
    duration: 6000,
  },
  {
    id: 'bilan',
    index: 9,
    clock: null,
    title: 'Le temps rendu à la dirigeante',
    caption:
      "Ce que la dirigeante de l'atelier de référence déclare gagner : environ 9 h 15 par semaine. À valider chez vous.",
    device: 'none',
    steps: [
      { id: 'rows', at: 300 },
      { id: 'totals', at: 4300 },
      { id: 'remains', at: 5800 },
      { id: 'cta', at: 6800 },
    ],
    duration: 10000,
  },
]

export const SCENE_COUNT = SCENES.length

export function sceneAt(index: number): Scene {
  return SCENES[Math.min(Math.max(index, 0), SCENES.length - 1)]
}

/** Total autoplay time without transitions, in ms. */
export const TOTAL_AUTOPLAY_MS = SCENES.reduce((n, s) => n + s.duration, 0)
