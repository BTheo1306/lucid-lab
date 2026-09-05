import type { FilmScene } from './types'

/**
 * The film version: same day, slower, one camera move per key point.
 * `at` in ms after the scene entry, `shot` = data-region framed by the camera.
 * Sum of durations: 191 s.
 */
export const FILM_SCENES: FilmScene[] = [
  {
    id: 'intro',
    index: 0,
    clock: null,
    eyebrow: null,
    title: "Une journée à l'atelier",
    headline: "Une journée à l'atelier.",
    sub: "Ce qu'un atelier de signalétique a mis en place pour reprendre ses journées.",
    caption: "Voici une journée dans un atelier de signalétique, depuis la mise en place de son nouveau système.",
    device: 'none',
    steps: [
      { id: 'title', at: 300 },
      { id: 'sub', at: 2200 },
      { id: 'disclaimer', at: 4200 },
    ],
    duration: 11000,
  },
  {
    id: 'formulaire',
    index: 1,
    clock: '08:02',
    eyebrow: '08:02 · Une demande arrive',
    title: 'Une demande arrive',
    headline: 'Chaque demande arrive déjà rangée.',
    caption:
      "Il est huit heures. Depuis son téléphone, un futur client remplit la demande de devis sur le site de l'atelier : ce qu'il cherche, la surface, l'adresse du chantier, et une photo de ses fenêtres. Personne n'aura à ressaisir ces informations.",
    device: 'none',
    steps: [
      { id: 'open', at: 400, shot: 'full' },
      { id: 'pick-metier', at: 1800 },
      { id: 'type-details', at: 3600 },
      { id: 'attach-photo', at: 8000 },
      { id: 'type-contact', at: 9800 },
      { id: 'submit', at: 13600, shot: 'form-submit', zoom: 1.6, anchor: 'left' },
      { id: 'success', at: 15000, shot: 'full' },
    ],
    duration: 19000,
  },
  {
    id: 'reponse',
    index: 2,
    clock: '08:02',
    eyebrow: '08:02 · La réponse',
    title: 'La réponse part',
    headline: 'La réponse part dans la seconde.',
    caption:
      "Quelques secondes plus tard, il reçoit une réponse aux couleurs de l'atelier : le relevé sur place est offert, on le rappellera dans la journée. La dirigeante, elle, reçoit sur son téléphone un résumé clair de la demande, avec la photo.",
    device: 'none',
    steps: [
      { id: 'mail', at: 400, shot: 'full' },
      { id: 'mail-cta', at: 4000 },
      { id: 'benefits', at: 7000 },
      { id: 'notif', at: 11000, shot: 'notif', zoom: 1.7 },
      { id: 'wide', at: 17500, shot: 'full' },
    ],
    duration: 21000,
  },
  {
    id: 'crm',
    index: 3,
    clock: '08:02',
    eyebrow: '08:02 · Le suivi',
    title: 'Le suivi est à jour',
    headline: 'Le suivi se remplit tout seul.',
    caption:
      "Pendant ce temps, la demande est déjà dans le suivi de l'atelier, à l'étape rendez-vous demandé, avec la photo et le numéro du prospect. Il n'y a rien à créer à la main.",
    device: 'none',
    steps: [
      { id: 'table', at: 400, shot: 'full' },
      { id: 'row', at: 2500 },
      { id: 'badges', at: 6000, shot: 'stage', zoom: 1.9 },
      { id: 'wide', at: 12000, shot: 'full' },
    ],
    duration: 16000,
  },
  {
    id: 'boite',
    index: 4,
    clock: '08:15',
    eyebrow: '08:15 · La boîte du matin',
    title: 'La boîte du matin',
    headline: 'Le matin commence par des décisions, pas par du tri.',
    caption:
      "Un peu plus tard, la dirigeante ouvre sa boîte du matin. Les mails de la nuit ont été lus et résumés : pour chacun, le système propose un poste, le client concerné et une échéance. Elle accepte, elle classe, ou elle pose une question. Rien ne s'écrit sans son accord.",
    device: 'none',
    steps: [
      { id: 'cards', at: 400, shot: 'full' },
      { id: 'zoom-card-1', at: 4500, shot: 'card-1' },
      { id: 'accept-1', at: 10500, shot: 'card-1' },
      { id: 'wide', at: 12500, shot: 'full' },
      { id: 'zoom-card-2', at: 15500, shot: 'card-2-question', zoom: 2.0 },
      { id: 'answer-q2', at: 17000, shot: 'card-2-question', zoom: 2.0 },
      { id: 'end', at: 21500, shot: 'full' },
    ],
    duration: 24000,
  },
  {
    id: 'journee',
    index: 5,
    clock: '08:30',
    eyebrow: "08:30 · Ma journée, puis l'atelier",
    title: "Ma journée, puis l'atelier",
    headline: 'Six choses aujourd\'hui. Pas soixante.',
    caption:
      "Sa journée ne retient que six choses, classées selon l'urgence réelle, calculée d'après les échéances et l'avancement de chaque poste. La vue atelier, elle, regroupe les travaux par machine et par matière, pour enchaîner découpes et impressions sans recharger la table.",
    device: 'none',
    steps: [
      { id: 'kpis', at: 400, shot: 'full' },
      { id: 'list', at: 3500 },
      { id: 'atelier', at: 10500, shot: 'full' },
      { id: 'groups', at: 11500 },
      { id: 'bat', at: 16000 },
    ],
    duration: 21000,
  },
  {
    id: 'compte-rendu',
    index: 6,
    clock: '11:40',
    eyebrow: '11:40 · Un client appelle',
    title: 'Un client appelle',
    headline: 'Un appel. Un compte rendu. Au bon endroit.',
    caption:
      "En fin de matinée, un client appelle. La dirigeante dicte son compte rendu, le système retrouve le bon dossier parmi plusieurs centaines et range la note à la date du jour, dans la fiche du client, avec tout son historique.",
    device: 'none',
    steps: [
      { id: 'type', at: 400, shot: 'full' },
      { id: 'client', at: 2000 },
      { id: 'pick-client', at: 4000 },
      { id: 'dictate', at: 5000, shot: 'transcript', zoom: 1.6 },
      { id: 'transcript', at: 5500, shot: 'transcript', zoom: 1.6 },
      { id: 'save', at: 12500, shot: 'drawer', zoom: 1.3 },
      { id: 'drawer', at: 13000, shot: 'drawer', zoom: 1.3 },
      { id: 'history', at: 14500 },
      { id: 'wide', at: 18000, shot: 'full' },
    ],
    duration: 20000,
  },
  {
    id: 'commande',
    index: 7,
    clock: '14:00',
    eyebrow: '14:00 · La commande fournisseur',
    title: 'La commande fournisseur',
    headline: 'La commande s\'écrit dans votre style.',
    caption:
      "L'après-midi, il faut commander des plaques. La liste de courses est groupée par fournisseur, et le mail de commande est rédigé dans le style habituel de la dirigeante, prêt à relire. Les lignes incertaines sont en couleur, à confirmer. Elle relit, puis elle envoie.",
    device: 'none',
    steps: [
      { id: 'list', at: 400, shot: 'full' },
      { id: 'click', at: 4000 },
      { id: 'draft', at: 4500, shot: 'draft', zoom: 1.3 },
      { id: 'probable', at: 11000 },
      { id: 'result', at: 15000 },
      { id: 'wide', at: 19000, shot: 'full' },
    ],
    duration: 22000,
  },
  {
    id: 'facturation',
    index: 8,
    clock: '17:30',
    eyebrow: '17:30 · La facturation',
    title: 'La facturation',
    headline: 'La facturation prévient avant que ça coince.',
    caption:
      "En fin de journée, la facturation se lit dans le même écran que le reste : encaissé, en attente, en retard. Les retards ont un nom, et les devis à rédiger remontent tout seuls depuis les postes.",
    device: 'none',
    steps: [
      { id: 'rows', at: 400, shot: 'full' },
      { id: 'tiles', at: 2500 },
      { id: 'banner', at: 6000, shot: 'banner', zoom: 1.5, anchor: 'left' },
      { id: 'devis', at: 10500, shot: 'full' },
    ],
    duration: 19000,
  },
  {
    id: 'bilan',
    index: 9,
    clock: null,
    eyebrow: 'Bilan',
    title: 'Le temps rendu à la dirigeante',
    headline: "Une journée par semaine, rendue à l'atelier.",
    sub: "Estimation déclarée par la dirigeante de l'atelier de référence. À mesurer chez vous.",
    caption:
      "Au total, la dirigeante de l'atelier de référence estime gagner environ neuf heures par semaine : une journée rendue à son métier. Une demi-heure d'audit suffit pour mesurer ce que cela donnerait chez vous.",
    device: 'none',
    steps: [
      { id: 'rows', at: 400, shot: 'full' },
      { id: 'totals', at: 7000, shot: 'total', zoom: 1.4 },
      { id: 'cta', at: 11000, shot: 'cta', zoom: 1.6 },
    ],
    duration: 18000,
  },
]

export const FILM_SCENE_COUNT = FILM_SCENES.length

export function filmSceneAt(index: number): FilmScene {
  return FILM_SCENES[Math.min(Math.max(index, 0), FILM_SCENES.length - 1)]
}

export const FILM_TOTAL_MS = FILM_SCENES.reduce((n, s) => n + s.duration, 0)
