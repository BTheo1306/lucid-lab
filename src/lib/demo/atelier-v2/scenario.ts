import type { FilmScene } from './types'

/**
 * The film version: same day, slower, one camera move per key point.
 * `at` in ms after the scene entry, `shot` = data-region framed by the camera.
 * Sum of durations: 150 s.
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
    caption: "Voici une journée dans un atelier de signalétique, avec son nouveau système.",
    device: 'none',
    steps: [
      { id: 'title', at: 300 },
      { id: 'sub', at: 2200 },
      { id: 'disclaimer', at: 4200 },
    ],
    duration: 8000,
  },
  {
    id: 'formulaire',
    index: 1,
    clock: '08:02',
    eyebrow: '08:02 · Une demande arrive',
    title: 'Une demande arrive',
    headline: 'Chaque demande arrive déjà rangée.',
    caption:
      "Huit heures deux. Un prospect remplit le formulaire du site : le métier, la surface, l'adresse, une photo. Pas d'appel, pas de message à déchiffrer : tout arrive déjà rangé.",
    device: 'none',
    steps: [
      { id: 'open', at: 400, shot: 'full' },
      { id: 'pick-metier', at: 1800, shot: 'form-need', zoom: 1.6, anchor: 'left' },
      { id: 'type-details', at: 4200, shot: 'form-details', zoom: 1.5, anchor: 'left' },
      { id: 'attach-photo', at: 7800, shot: 'form-photo', zoom: 1.7, anchor: 'left' },
      { id: 'type-contact', at: 9600, shot: 'form-contact', zoom: 1.5, anchor: 'left' },
      { id: 'submit', at: 12600, shot: 'form-submit', zoom: 1.8, anchor: 'left' },
      { id: 'success', at: 13600, shot: 'full' },
    ],
    duration: 16000,
  },
  {
    id: 'reponse',
    index: 2,
    clock: '08:02',
    eyebrow: '08:02 · La réponse',
    title: 'La réponse part',
    headline: 'La réponse part dans la seconde.',
    caption:
      "Dans la seconde, il reçoit une réponse aux couleurs de l'atelier : le relevé est offert, on le rappelle sous vingt-quatre heures. Et la dirigeante reçoit le résumé sur son téléphone.",
    device: 'none',
    steps: [
      { id: 'mail', at: 400, shot: 'mail', zoom: 1.15 },
      { id: 'mail-cta', at: 3600, shot: 'mail-cta', zoom: 2.0 },
      { id: 'benefits', at: 6600, shot: 'mail-benefits', zoom: 1.6 },
      { id: 'notif', at: 9600, shot: 'notif', zoom: 1.9 },
      { id: 'wide', at: 13000, shot: 'full' },
    ],
    duration: 15000,
  },
  {
    id: 'crm',
    index: 3,
    clock: '08:02',
    eyebrow: '08:02 · Le suivi',
    title: 'Le suivi est à jour',
    headline: 'Le suivi se remplit tout seul.',
    caption:
      'Pendant ce temps, la demande est déjà dans le suivi, à l\'étape rendez-vous demandé, avec la photo et le numéro à composer.',
    device: 'none',
    steps: [
      { id: 'table', at: 400, shot: 'full' },
      { id: 'row', at: 2000, shot: 'new-row', zoom: 1.6, anchor: 'left' },
      { id: 'badges', at: 5000, shot: 'stage', zoom: 2.0 },
      { id: 'wide', at: 9000, shot: 'full' },
    ],
    duration: 12000,
  },
  {
    id: 'boite',
    index: 4,
    clock: '08:15',
    eyebrow: '08:15 · La boîte du matin',
    title: 'La boîte du matin',
    headline: 'Le matin commence par des décisions, pas par du tri.',
    caption:
      "Ensuite, la boîte du matin : les mails de la nuit ont été lus et résumés. Chaque fiche propose un poste, un client, une échéance. On accepte, on classe. Rien ne s'écrit sans un clic.",
    device: 'none',
    steps: [
      { id: 'cards', at: 400, shot: 'full' },
      { id: 'zoom-card-1', at: 3000, shot: 'card-1' },
      { id: 'line', at: 6000, shot: 'card-1-line', zoom: 2.2 },
      { id: 'accept-1', at: 9600, shot: 'card-1' },
      { id: 'wide', at: 11000, shot: 'full' },
      { id: 'zoom-card-2', at: 13000, shot: 'card-2-question', zoom: 2.2 },
      { id: 'answer-q2', at: 14500, shot: 'card-2-question', zoom: 2.2 },
      { id: 'end', at: 18000, shot: 'full' },
    ],
    duration: 20000,
  },
  {
    id: 'journee',
    index: 5,
    clock: '08:30',
    eyebrow: "08:30 · Ma journée, puis l'atelier",
    title: "Ma journée, puis l'atelier",
    headline: 'Six choses aujourd\'hui. Pas soixante.',
    caption:
      "Ma journée ne garde que six choses, classées par urgence réelle : échéance, étape, état. Puis l'atelier regroupe les postes par machine et par matière, pour enchaîner les découpes sans recharger la table.",
    device: 'none',
    steps: [
      { id: 'kpis', at: 400, shot: 'kpis', zoom: 1.2 },
      { id: 'list', at: 3500, shot: 'list', zoom: 1.15 },
      { id: 'atelier', at: 8500, shot: 'full' },
      { id: 'groups', at: 9500, shot: 'atelier-groups', zoom: 1.35, anchor: 'left' },
      { id: 'bat', at: 14000, shot: 'bat', zoom: 1.8 },
      { id: 'wide', at: 16500, shot: 'full' },
    ],
    duration: 18000,
  },
  {
    id: 'compte-rendu',
    index: 6,
    clock: '11:40',
    eyebrow: '11:40 · Un client appelle',
    title: 'Un client appelle',
    headline: 'Un appel. Un compte rendu. Au bon endroit.',
    caption:
      "Onze heures quarante, un client appelle. On dicte. Le dossier est retrouvé parmi des centaines, le compte rendu est rangé à la date du jour, dans la fiche, avec tout l'historique.",
    device: 'none',
    steps: [
      { id: 'type', at: 400, shot: 'form-cr', zoom: 1.25 },
      { id: 'client', at: 2000, shot: 'client-field', zoom: 2.0 },
      { id: 'pick-client', at: 4000, shot: 'client-field', zoom: 2.0 },
      { id: 'dictate', at: 5000, shot: 'transcript', zoom: 1.8 },
      { id: 'transcript', at: 5500, shot: 'transcript', zoom: 1.8 },
      { id: 'save', at: 12000, shot: 'drawer', zoom: 1.3 },
      { id: 'drawer', at: 12500, shot: 'drawer', zoom: 1.3 },
      { id: 'history', at: 14000, shot: 'history', zoom: 1.9 },
      { id: 'wide', at: 16200, shot: 'full' },
    ],
    duration: 17000,
  },
  {
    id: 'commande',
    index: 7,
    clock: '14:00',
    eyebrow: '14:00 · La commande fournisseur',
    title: 'La commande fournisseur',
    headline: 'La commande s\'écrit dans votre style.',
    caption:
      'Quatorze heures, la commande fournisseur. La liste de courses est groupée par fournisseur, le mail est rédigé dans le style de la dirigeante, en brouillon. Elle relit, elle envoie.',
    device: 'none',
    steps: [
      { id: 'list', at: 400, shot: 'list-achats', zoom: 1.4 },
      { id: 'click', at: 3000, shot: 'list-achats', zoom: 1.4 },
      { id: 'draft', at: 3500, shot: 'draft', zoom: 1.25 },
      { id: 'probable', at: 9500, shot: 'draft-probable', zoom: 2.2 },
      { id: 'result', at: 12000, shot: 'result', zoom: 2.0 },
      { id: 'wide', at: 14000, shot: 'full' },
    ],
    duration: 15000,
  },
  {
    id: 'facturation',
    index: 8,
    clock: '17:30',
    eyebrow: '17:30 · La facturation',
    title: 'La facturation',
    headline: 'La facturation prévient avant que ça coince.',
    caption:
      "En fin d'après-midi : encaissé, en attente, en retard. La facturation vit dans le même écran, et les retards ont un nom.",
    device: 'none',
    steps: [
      { id: 'rows', at: 400, shot: 'full' },
      { id: 'tiles', at: 2000, shot: 'tiles', zoom: 1.3 },
      { id: 'banner', at: 5000, shot: 'banner', zoom: 1.6, anchor: 'left' },
      { id: 'devis', at: 8000, shot: 'devis', zoom: 1.8 },
      { id: 'wide', at: 10500, shot: 'full' },
    ],
    duration: 12000,
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
      "Neuf heures quinze par semaine, selon le décompte de la dirigeante. Une journée rendue à l'atelier, chaque semaine. Trente minutes d'audit suffisent pour dire ce que ça donnerait chez vous.",
    device: 'none',
    steps: [
      { id: 'rows', at: 400, shot: 'table-time', zoom: 1.3 },
      { id: 'totals', at: 7000, shot: 'total', zoom: 1.5 },
      { id: 'cta', at: 11000, shot: 'cta', zoom: 1.8 },
    ],
    duration: 17000,
  },
]

export const FILM_SCENE_COUNT = FILM_SCENES.length

export function filmSceneAt(index: number): FilmScene {
  return FILM_SCENES[Math.min(Math.max(index, 0), FILM_SCENES.length - 1)]
}

export const FILM_TOTAL_MS = FILM_SCENES.reduce((n, s) => n + s.duration, 0)
