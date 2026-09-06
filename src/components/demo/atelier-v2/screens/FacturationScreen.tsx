'use client'

import { motion } from 'framer-motion'

import { groupeById } from '@/lib/demo/atelier/groupes'
import { INVOICES, INVOICE_STATUS_LABEL, formatEur, invoiceTotals, lateInvoices } from '@/lib/demo/atelier/invoices'
import { groupeName } from '@/lib/demo/atelier/postes'
import { devisToWriteV2 } from '@/lib/demo/atelier-v2/data'

import { CountUp } from '../../atelier/chrome/CountUp'
import { useScene } from '../../atelier/player/SceneContext'
import { EASE, EMBER, EMBER_700, GRAY_200, GRAY_500, GRAY_600, INK, PAPER } from '../../atelier/tokens'
import { Region } from '../chrome/Camera'
import { AppFrame, Card, Label, Status, TH, Tile } from '../chrome/ui'

const TOTALS = invoiceTotals()
const LATE = lateInvoices()
const DEVIS = devisToWriteV2()

export function FacturationScreen() {
  const { fired } = useScene()
  return (
    <AppFrame active="Factures" title="Factures" meta="Lu dans le logiciel de facturation, affiché à côté des postes">
      <div className="flex h-full flex-col gap-5">
        <Region id="banner">
          <motion.div initial={false} animate={fired('banner') ? { opacity: 1, y: 0 } : { opacity: 0, y: -6 }} transition={{ duration: 0.5, ease: EASE }} className="flex items-center gap-4 rounded-[8px] border-l-[3px] px-5 py-4 text-[15px]" style={{ borderColor: EMBER, background: PAPER, color: INK }} role="status">
            <span className="font-bold" style={{ color: EMBER_700 }}>
              {LATE.length} factures en retard
            </span>
            <span style={{ color: GRAY_600 }}>{LATE.map((i, idx) => `${groupeById(i.groupeId).name} (${i.daysLate} jours, ${formatEur(i.amountEur)})${idx < LATE.length - 1 ? ', ' : '.'}`).join('')}</span>
            <span className="ml-auto font-medium">Relances prêtes à relire.</span>
          </motion.div>
        </Region>
        <Region id="tiles" className="grid grid-cols-4 gap-5">
          <Tile label="Émis ce trimestre" value={<CountUp to={TOTALS.emis} active={fired('tiles')} durationMs={1400} format={formatEur} />} />
          <Tile label="Encaissé" value={<CountUp to={TOTALS.encaisse} active={fired('tiles')} durationMs={1400} format={formatEur} />} />
          <Tile label="En attente" value={<CountUp to={TOTALS.enAttente} active={fired('tiles')} durationMs={1400} format={formatEur} />} />
          <Tile label="En retard" value={<CountUp to={TOTALS.enRetard} active={fired('tiles')} durationMs={1400} format={formatEur} />} accent />
        </Region>
        <div className="grid min-h-0 flex-1 grid-cols-[1fr_400px] gap-5">
          <Card>
            <table className="w-full border-collapse text-[15px]" style={{ color: INK }}>
              <thead>
                <tr style={{ color: GRAY_500 }}>
                  <th className={TH}>Numéro</th>
                  <th className={TH}>Client</th>
                  <th className={TH}>Émise</th>
                  <th className={TH}>Échéance</th>
                  <th className={`${TH} text-right`}>Montant</th>
                  <th className={TH}>Statut</th>
                </tr>
              </thead>
              <tbody>
                {INVOICES.map((inv, i) => (
                  <motion.tr key={inv.id} initial={false} animate={fired('rows') ? { opacity: 1 } : { opacity: 0 }} transition={{ duration: 0.35, delay: fired('rows') ? i * 0.1 : 0 }} className="border-t" style={{ borderColor: GRAY_200, background: inv.status === 'en-retard' && fired('banner') ? PAPER : 'transparent' }}>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-[13px]" style={{ color: GRAY_600 }}>
                      {inv.number}
                    </td>
                    <td className="px-4 py-3 font-medium">{groupeById(inv.groupeId).name}</td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-[13px]" style={{ color: GRAY_600 }}>
                      {inv.issuedAt}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 font-mono text-[13px]" style={{ color: inv.status === 'en-retard' ? EMBER_700 : GRAY_600 }}>
                      {inv.dueAt}
                      {inv.daysLate ? ` (+${inv.daysLate} j)` : ''}
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-[14px] tabular-nums">{formatEur(inv.amountEur)}</td>
                    <td className="px-4 py-3">
                      <Status highlight={inv.status === 'en-retard'}>{INVOICE_STATUS_LABEL[inv.status]}</Status>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </Card>
          <Region id="devis">
            <motion.div initial={false} animate={fired('devis') ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }} transition={{ duration: 0.5, ease: EASE }} className="h-full">
              <Card className="h-full p-6">
                <div className="flex items-baseline justify-between">
                  <h3 className="text-[18px] font-bold">Devis à rédiger ({DEVIS.length})</h3>
                  <Label tone="ember">déduits des postes</Label>
                </div>
                <ul className="mt-2">
                  {DEVIS.map((p) => (
                    <li key={p.id} className="border-t py-3 text-[15px]" style={{ borderColor: GRAY_200, color: INK }}>
                      <div className="font-semibold">{p.title}</div>
                      <div className="flex items-center justify-between text-[13.5px]" style={{ color: GRAY_600 }}>
                        <span>{groupeName(p)}</span>
                        <span className="font-mono">avant le {p.tags.due}</span>
                      </div>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-[13px] leading-relaxed" style={{ color: GRAY_500 }}>
                  Chaque poste balisé <span className="font-mono font-semibold" style={{ color: INK }}>#devis</span> remonte ici tout seul. Le devis se prépare en quelques minutes à partir de la fiche client.
                </p>
              </Card>
            </motion.div>
          </Region>
        </div>
      </div>
    </AppFrame>
  )
}
