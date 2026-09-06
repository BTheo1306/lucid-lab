import { ATELIER, PEOPLE } from './identity'
import { LEAD } from './lead'
import type { EmailMessage, Notification } from './types'

/** The automatic reply the prospect receives seconds after the form. */
export const AUTO_REPLY: EmailMessage = {
  id: 'auto-reply',
  from: { name: ATELIER.name, address: ATELIER.email },
  to: { name: LEAD.name, address: LEAD.email },
  subject: 'Votre projet de film solaire est lancé',
  preview: 'Merci pour votre demande. Voici comment on avance ensemble.',
  receivedAt: '08:02',
  blocks: [
    { kind: 'heading', text: 'Votre projet de film solaire est lancé' },
    {
      kind: 'paragraph',
      text: `Bonjour ${LEAD.name.split(' ')[0]}, merci pour votre demande concernant ${LEAD.windows} fenêtres, environ ${LEAD.surfaceM2} m², au ${LEAD.address}. Un relevé sur place est offert : on mesure vos vitrages, on regarde l'exposition et on vous conseille le film adapté.`,
    },
    {
      kind: 'paragraph',
      text: `${PEOPLE.claire.firstName} vous rappelle sous 24 h pour fixer le créneau du relevé.`,
    },
    { kind: 'button', text: `Appeler l'atelier : ${ATELIER.phone}` },
    {
      kind: 'benefits',
      items: [
        'Moins de chaleur en été',
        "Plus d'éblouissement sur les écrans",
        'UV filtrés, mobilier protégé',
        'Sans changer vos vitrages',
      ],
    },
    { kind: 'signature', text: `${PEOPLE.claire.firstName} ${PEOPLE.claire.lastName}, ${ATELIER.name}, ${ATELIER.city}` },
  ],
}

/** Push notification on the owner's phone, same second. */
export const OWNER_NOTIFICATION: Notification = {
  app: 'Atelier',
  title: `Nouveau lead film solaire : ${LEAD.name}`,
  lines: [
    `${LEAD.surfaceM2} m², ${LEAD.windows} fenêtres, ${LEAD.address}`,
    `Pièce jointe : ${LEAD.attachment}`,
    'Source : site, formulaire film solaire',
  ],
  link: 'Ouvrir la demande',
}

/** Rows of the prospect's webmail before the reply arrives. */
export const PROSPECT_INBOX_ROWS = [
  { from: 'Compagnie Énergie Démo', subject: 'Votre facture de septembre est disponible', time: 'hier' },
  { from: 'Mairie, service urbanisme', subject: 'Accusé de réception de votre dossier', time: 'lundi' },
  { from: 'Coopérative Exemple', subject: 'Assemblée générale : ordre du jour', time: 'dimanche' },
]

/** The draft the assistant writes for the supplier, in Claire's own style. */
export const SUPPLIER_DRAFT = {
  to: 'fabien@plaques-du-centre.example',
  subject: 'cde',
  greeting: 'Bonjour Fabien,',
  intro: "comme d'habitude je vous prends :",
  firmLines: ['plaque rigide 3 mm 1000*1200 *2u', 'plaque rigide 3 mm 1000*2000 *1u'],
  probableLines: [{ text: 'plaque rigide 5 mm 1000*2000 *1u', forGroupe: 'Garage Témoin' }],
  outro: 'Si possible les formats A3 dans les chutes, comme la dernière fois.',
  closing: 'Merci, bonne journée',
  signature: `${PEOPLE.claire.firstName}`,
} as const
