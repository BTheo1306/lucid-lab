// Fictional identity of the demo workshop. Domain .example is reserved for
// documentation, the 06 39 98 xx xx range is reserved by ARCEP for fiction.

export const ATELIER = {
  name: 'Atelier Brière Signalétique',
  shortName: 'Atelier Brière',
  city: 'Tours',
  address: '4 rue des Ateliers, 37000 Tours',
  domain: 'atelier-briere.example',
  email: 'contact@atelier-briere.example',
  phone: '06 39 98 12 34',
  tagline: 'Enseignes, adhésifs, bâches et films pour vitrages',
} as const

export const PEOPLE = {
  claire: { id: 'claire', firstName: 'Claire', lastName: 'Brière', role: 'Dirigeante', initials: 'CB' },
  lea: { id: 'lea', firstName: 'Léa', lastName: 'Morel', role: 'Apprentie', initials: 'LM' },
} as const

/** Wednesday 9 September 2026 in the story, written the French way. */
export const TODAY = { long: 'mercredi 9 septembre', short: '09/09', year: 2026 } as const

export const DISCLAIMER =
  "Reconstitution d'un système livré à un atelier de signalétique d'Indre-et-Loire. Entreprise et données fictives."
