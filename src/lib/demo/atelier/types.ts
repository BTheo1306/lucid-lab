// Types of the scripted demo "Une journée à l'atelier". Pure data, no React.
// Everything here describes a FICTIONAL workshop: names, numbers and emails
// are invented (domain .example, phone numbers in the ARCEP fiction range).

export type SceneId =
  | 'intro'
  | 'formulaire'
  | 'reponse'
  | 'crm'
  | 'boite'
  | 'journee'
  | 'compte-rendu'
  | 'commande'
  | 'facturation'
  | 'bilan'

export type Mode = 'presenter' | 'autoplay' | 'record'

export type Stage = 'demande' | 'devis' | 'maquette' | 'prod' | 'livraison' | 'facture'
export type Ball = 'dirigeante' | 'apprentie' | 'client' | 'fournisseur'
export type Trade = 'films' | 'enseigne' | 'vehicule' | 'signaletique' | 'impression'
export type Machine =
  | 'decoupe-blanc'
  | 'decoupe-couleur'
  | 'impression-bache'
  | 'impression-adhesif'
  | 'contre-collage'
  | 'faconnage'
  | 'pose'
export type Person = 'claire' | 'lea'
export type DeviceKind = 'none' | 'phone' | 'browser' | 'split'

export interface SceneStep {
  id: string
  /** Milliseconds after the scene entry. */
  at: number
}

export interface Scene {
  id: SceneId
  index: number
  /** Clock shown in the caption bar, null for the intro and the bilan. */
  clock: string | null
  title: string
  caption: string
  device: DeviceKind
  steps: SceneStep[]
  /** Autoplay duration in ms, always above the last step. */
  duration: number
}

export interface Groupe {
  id: string
  name: string
  contact: string
  phone: string
  email: string
  /** Year the paper folder was opened, shown in the autocomplete. */
  folderSince?: number
  isNew?: boolean
}

export interface PosteTags {
  stage: Stage
  owner: Person
  /** JJ/MM */
  due: string
  machine?: Machine
}

export interface Poste {
  id: string
  groupeId: string
  title: string
  stage: Stage
  ball: Ball
  assignee: Person
  tags: PosteTags
  machine?: Machine
  material?: string
  /** 0 = rien de pressé, 3 = aujourd'hui sans faute. Always computed, never typed. */
  urgency: 0 | 1 | 2 | 3
  urgencyReason?: string
  waitingBat?: boolean
}

export interface Lead {
  id: string
  name: string
  trade: Trade
  windows: number
  surfaceM2: number
  address: string
  phone: string
  email: string
  attachment: string
  source: 'site'
  receivedAt: string
  stage: 'rdv-demande'
}

export interface ExistingLead {
  id: string
  name: string
  trade: Trade
  stage: 'nouveau' | 'rdv-demande' | 'devise' | 'gagne'
  receivedAt: string
  summary: string
}

export interface EmailBlock {
  kind: 'heading' | 'paragraph' | 'button' | 'benefits' | 'signature'
  text?: string
  items?: string[]
}

export interface EmailMessage {
  id: string
  from: { name: string; address: string }
  to: { name: string; address: string }
  subject: string
  preview: string
  blocks: EmailBlock[]
  attachments?: string[]
  receivedAt: string
}

export interface Notification {
  app: string
  title: string
  lines: string[]
  link: string
}

export interface InboxCard {
  id: string
  sender: string
  senderInitials: string
  subject: string
  summary: string
  proposedLine: string
  tags: PosteTags
  target: Groupe | 'nouveau' | 'fournisseur'
  /** Blocks "Accepter" until answered. */
  openQuestion?: { label: string; answer: string }
  /** The card updates an existing poste instead of creating one. */
  updatesPoste?: { posteId: string; label: string }
  attachments: number
}

export type CallType = 'appel-recu' | 'appel-passe' | 'rdv' | 'visite-atelier' | 'visite-chantier'

export interface CallReport {
  type: CallType
  groupeId: string
  date: string
  transcript: string
  extractActions: boolean
}

export interface ClientFile {
  groupeId: string
  history: { date: string; text: string; isNew?: boolean }[]
  procedures: string[]
  pastPostes: string[]
}

export interface Supplier {
  id: string
  name: string
  contactFirstName: string
  email: string
}

export interface SupplierLine {
  id: string
  supplierId: string
  label: string
  qty: string
  forGroupeId?: string
  probable?: boolean
  status: 'a-commander' | 'en-attente-livraison'
  expectedAt?: string
}

export type InvoiceStatus = 'emise' | 'encaissee' | 'en-attente' | 'en-retard'

export interface Invoice {
  id: string
  groupeId: string
  number: string
  amountEur: number
  issuedAt: string
  dueAt: string
  status: InvoiceStatus
  daysLate?: number
}

export interface TimeSavedRow {
  task: string
  before: string
  frequency: string
  now: string
  /** Minutes gained per week. */
  gainMinPerWeek: number
}
