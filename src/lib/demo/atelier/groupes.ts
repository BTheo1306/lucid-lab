import type { Groupe } from './types'

export const GROUPES: Groupe[] = [
  {
    id: 'camping',
    name: 'Camping des Trois Chênes',
    contact: 'Mme Rolland',
    phone: '06 39 98 20 11',
    email: 'accueil@camping-trois-chenes.example',
    folderSince: 2021,
  },
  {
    id: 'garage',
    name: 'Garage Témoin',
    contact: 'M. Pereira',
    phone: '06 39 98 20 22',
    email: 'contact@garage-temoin.example',
    folderSince: 2019,
  },
  {
    id: 'boulangerie',
    name: 'Boulangerie Modèle',
    contact: 'Mme Aubert',
    phone: '06 39 98 20 33',
    email: 'bonjour@boulangerie-modele.example',
    folderSince: 2023,
  },
  {
    id: 'salon',
    name: "Salon Coiff'Démo",
    contact: 'Mme Nguyen',
    phone: '06 39 98 20 44',
    email: 'salon@coiff-demo.example',
    folderSince: 2022,
  },
  {
    id: 'cabinet',
    name: 'Cabinet Exemple',
    contact: 'Me Delorme',
    phone: '06 39 98 20 55',
    email: 'secretariat@cabinet-exemple.example',
    folderSince: 2020,
  },
  {
    id: 'batiment',
    name: 'Entreprise Bâtiment Démo',
    contact: 'M. Carvalho',
    phone: '06 39 98 20 66',
    email: 'chantiers@batiment-demo.example',
    folderSince: 2018,
  },
  {
    id: 'association',
    name: 'Association Forum des Métiers',
    contact: 'M. Lefèvre',
    phone: '06 39 98 20 77',
    email: 'forum@metiers-asso.example',
    isNew: true,
  },
  {
    id: 'garage-pont',
    name: 'Garage du Pont',
    contact: 'M. Bianchi',
    phone: '06 39 98 20 88',
    email: 'garage.du.pont@example.org',
    folderSince: 2016,
  },
]

export const LEGACY_FOLDER_COUNT = 312

export function groupeById(id: string): Groupe {
  const g = GROUPES.find((x) => x.id === id)
  if (!g) throw new Error(`Groupe inconnu : ${id}`)
  return g
}
