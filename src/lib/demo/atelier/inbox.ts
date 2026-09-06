import { groupeById } from './groupes'
import type { InboxCard } from './types'

/** The night's emails, already turned into decision cards at 08:15. */
export const INBOX_CARDS: InboxCard[] = [
  {
    id: 'card-camping',
    sender: 'Camping des Trois Chênes',
    senderInitials: 'CC',
    subject: 'Banderole pour le tournoi du 20 septembre',
    summary:
      'Mme Rolland veut une banderole 3 x 1 m avec le visuel du tournoi, œillets tous les 50 cm, livrée avant le 18.',
    proposedLine: 'Banderole tournoi 3 x 1 m #devis @claire ~12/09 %imp-bache',
    tags: { stage: 'devis', owner: 'claire', due: '12/09', machine: 'impression-bache' },
    target: groupeById('camping'),
    attachments: 1,
  },
  {
    id: 'card-association',
    sender: 'Association Forum des Métiers',
    senderInitials: 'FM',
    subject: 'Kakémono et flyers pour le forum',
    summary:
      'Première demande. Un kakémono 85 x 200 avec le programme et des flyers A5 pour les visiteurs, forum le 26 septembre.',
    proposedLine: 'Kakémono 85 x 200 + flyers A5 #devis @claire ~15/09 %imp',
    tags: { stage: 'devis', owner: 'claire', due: '15/09' },
    target: 'nouveau',
    openQuestion: { label: 'Quantité de flyers ?', answer: '500 exemplaires' },
    attachments: 2,
  },
  {
    id: 'card-garage',
    sender: 'Garage Témoin',
    senderInitials: 'GT',
    subject: 'BAT enseigne : validé',
    summary:
      'M. Pereira valide le BAT de l\'enseigne façade et joint deux photos de la façade pour caler la hauteur de pose.',
    proposedLine: 'Enseigne façade 4 x 0,6 m #prod @lea ~11/09 %dec-blanc',
    tags: { stage: 'prod', owner: 'lea', due: '11/09', machine: 'decoupe-blanc' },
    target: groupeById('garage'),
    updatesPoste: { posteId: 'p-garage-enseigne', label: 'Enseigne façade (Garage Témoin)' },
    attachments: 2,
  },
  {
    id: 'card-fournisseur',
    sender: 'Plaques du Centre',
    senderInitials: 'PC',
    subject: 'Accusé de réception de commande n° 4471',
    summary:
      'Confirmation de la commande de plaques du 2 septembre, livraison annoncée le jeudi 10. Rien à faire.',
    proposedLine: 'Livraison plaques #livraison @claire ~10/09',
    tags: { stage: 'livraison', owner: 'claire', due: '10/09' },
    target: 'fournisseur',
    attachments: 1,
  },
]

export const INBOX_STATS = { received: 11, noise: 7, cards: INBOX_CARDS.length }
