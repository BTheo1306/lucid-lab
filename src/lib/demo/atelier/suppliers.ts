import type { Supplier, SupplierLine } from './types'

export const SUPPLIERS: Supplier[] = [
  { id: 'plaques', name: 'Plaques du Centre', contactFirstName: 'Fabien', email: 'fabien@plaques-du-centre.example' },
  { id: 'signa', name: 'Signa Fournitures', contactFirstName: 'Nadia', email: 'commandes@signa-fournitures.example' },
  { id: 'baches', name: 'Bâches & Co', contactFirstName: 'Marc', email: 'marc@baches-and-co.example' },
]

export const SUPPLIER_LINES: SupplierLine[] = [
  { id: 'l1', supplierId: 'plaques', label: 'Plaque rigide 3 mm, 1000 x 1200 mm', qty: '2', forGroupeId: 'camping', status: 'a-commander' },
  { id: 'l2', supplierId: 'plaques', label: 'Plaque rigide 3 mm, 1000 x 2000 mm', qty: '1', forGroupeId: 'cabinet', status: 'a-commander' },
  { id: 'l3', supplierId: 'plaques', label: 'Plaque rigide 5 mm, 1000 x 2000 mm', qty: '1', forGroupeId: 'garage', probable: true, status: 'a-commander' },
  { id: 'l4', supplierId: 'signa', label: 'Adhésif blanc mat, rouleau 1370 mm', qty: '1', status: 'a-commander' },
  { id: 'l5', supplierId: 'signa', label: 'Laminat brillant, rouleau 1370 mm', qty: '1', forGroupeId: 'salon', probable: true, status: 'a-commander' },
  { id: 'l6', supplierId: 'baches', label: 'Bâche 510 g, rouleau 1600 mm', qty: '1', status: 'a-commander' },
  { id: 'l7', supplierId: 'signa', label: 'Œillets laiton 12 mm, boîte de 500', qty: '2', status: 'en-attente-livraison', expectedAt: '10/09' },
]

export const ORDERED_SUPPLIER_ID = 'plaques'
export const ORDER_EXPECTED_AT = '11/09'

export function supplierById(id: string): Supplier {
  const s = SUPPLIERS.find((x) => x.id === id)
  if (!s) throw new Error(`Fournisseur inconnu : ${id}`)
  return s
}
