// Data view of the film version: the same fictional workshop, without the apprentice
// (not every workshop has one). Everything else comes from the v1 dataset.
import { INBOX_CARDS } from '@/lib/demo/atelier/inbox'
import { POSTES, MACHINE_LABEL, atelierGroups as atelierGroupsV1, poseList as poseListV1, waitingBatList as waitingBatListV1, devisToWrite as devisToWriteV1 } from '@/lib/demo/atelier/postes'
import { SUPPLIER_LINES } from '@/lib/demo/atelier/suppliers'
import type { InboxCard, Poste } from '@/lib/demo/atelier/types'

export const POSTES_V2: Poste[] = POSTES.map((p) =>
  p.assignee === 'lea' || p.ball === 'apprentie'
    ? { ...p, assignee: 'claire', ball: p.ball === 'apprentie' ? 'dirigeante' : p.ball, tags: { ...p.tags, owner: 'claire' } }
    : p,
)

export const INBOX_CARDS_V2: InboxCard[] = INBOX_CARDS.map((c) => ({
  ...c,
  proposedLine: c.proposedLine.replace('@lea', '@claire'),
  tags: { ...c.tags, owner: 'claire' },
}))

export function todayListV2(): Poste[] {
  return [...POSTES_V2]
    .filter((p) => !p.waitingBat && p.ball === 'dirigeante')
    .sort((a, b) => b.urgency - a.urgency || a.tags.due.localeCompare(b.tags.due))
    .slice(0, 6)
}

export function kpisV2() {
  return {
    today: todayListV2().length,
    atClients: POSTES_V2.filter((p) => p.ball === 'client').length,
    atSuppliers: SUPPLIER_LINES.filter((l) => l.status === 'en-attente-livraison').length,
    atelier: atelierGroupsV2().reduce((n, g) => n + g.postes.length, 0),
  }
}

export function atelierGroupsV2() {
  return atelierGroupsV1(POSTES_V2)
}

export function poseListV2(): Poste[] {
  return poseListV1(POSTES_V2)
}

export function waitingBatListV2(): Poste[] {
  return waitingBatListV1(POSTES_V2)
}

export function devisToWriteV2(): Poste[] {
  return devisToWriteV1(POSTES_V2)
}

export { MACHINE_LABEL }
