import type { Invoice, InvoiceStatus } from './types'

export const INVOICES: Invoice[] = [
  { id: 'f1', groupeId: 'batiment', number: 'F-2026-052', amountEur: 1860, issuedAt: '05/09', dueAt: '05/10', status: 'emise' },
  { id: 'f2', groupeId: 'cabinet', number: 'F-2026-051', amountEur: 640, issuedAt: '02/09', dueAt: '02/10', status: 'en-attente' },
  { id: 'f3', groupeId: 'camping', number: 'F-2026-050', amountEur: 2280, issuedAt: '29/08', dueAt: '28/09', status: 'en-attente' },
  { id: 'f4', groupeId: 'boulangerie', number: 'F-2026-049', amountEur: 390, issuedAt: '27/08', dueAt: '26/09', status: 'encaissee' },
  { id: 'f5', groupeId: 'garage', number: 'F-2026-041', amountEur: 1240, issuedAt: '29/07', dueAt: '28/08', status: 'en-retard', daysLate: 12 },
  { id: 'f6', groupeId: 'batiment', number: 'F-2026-045', amountEur: 3120, issuedAt: '08/08', dueAt: '07/09', status: 'encaissee' },
  { id: 'f7', groupeId: 'salon', number: 'F-2026-036', amountEur: 480, issuedAt: '10/07', dueAt: '09/08', status: 'en-retard', daysLate: 31 },
  { id: 'f8', groupeId: 'cabinet', number: 'F-2026-044', amountEur: 720, issuedAt: '06/08', dueAt: '05/09', status: 'encaissee' },
]

export const INVOICE_STATUS_LABEL: Record<InvoiceStatus, string> = {
  emise: 'Émise',
  encaissee: 'Encaissée',
  'en-attente': 'En attente',
  'en-retard': 'En retard',
}

export function invoiceTotals(invoices: Invoice[] = INVOICES) {
  const sum = (f: (i: Invoice) => boolean) => invoices.filter(f).reduce((n, i) => n + i.amountEur, 0)
  return {
    emis: sum(() => true),
    encaisse: sum((i) => i.status === 'encaissee'),
    enAttente: sum((i) => i.status === 'en-attente' || i.status === 'emise'),
    enRetard: sum((i) => i.status === 'en-retard'),
  }
}

export function lateInvoices(invoices: Invoice[] = INVOICES): Invoice[] {
  return invoices.filter((i) => i.status === 'en-retard').sort((a, b) => (b.daysLate ?? 0) - (a.daysLate ?? 0))
}

export function formatEur(n: number): string {
  return `${n.toLocaleString('fr-FR')} €`
}
