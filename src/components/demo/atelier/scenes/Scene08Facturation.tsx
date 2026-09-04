'use client'

import { motion } from 'framer-motion'
import { TriangleAlert } from 'lucide-react'

import { groupeById } from '@/lib/demo/atelier/groupes'
import { INVOICES, formatEur, invoiceTotals, lateInvoices } from '@/lib/demo/atelier/invoices'
import { devisToWrite, groupeName } from '@/lib/demo/atelier/postes'

import { AppShell, Panel, StatTile } from '../app/AppShell'
import { Chip, InvoiceStatusChip } from '../app/Chips'
import { CountUp } from '../chrome/CountUp'
import { BrowserFrame, ScaledStage } from '../chrome/DeviceFrame'
import { useScene } from '../player/SceneContext'
import { BAD, BAD_TINT, EASE, GRAY_200, GRAY_500, GRAY_600, INK, WARN } from '../tokens'

const TOTALS = invoiceTotals()
const LATE = lateInvoices()
const DEVIS = devisToWrite()
const TH = 'px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.08em]'

export function Scene08Facturation() {
  const { fired } = useScene()
  return (
    <div className="h-full">
      <ScaledStage width={1280} height={800}>
        <BrowserFrame url="app.atelier-briere.example/factures">
          <AppShell active="factures" counters={{ factures: LATE.length, journee: 6 }} title="Factures" subtitle="Lu dans votre logiciel de facturation, affiché à côté des postes">
            <div className="flex h-full flex-col gap-4">
              <motion.div
                initial={false}
                animate={fired('banner') ? { opacity: 1, y: 0 } : { opacity: 0, y: -6 }}
                transition={{ duration: 0.35, ease: EASE }}
                className="flex items-center gap-3 rounded-[8px] border px-4 py-3 text-[13px]"
                style={{ borderColor: '#F3C2C2', background: BAD_TINT, color: BAD }}
                role="status"
              >
                <TriangleAlert size={16} aria-hidden="true" />
                <span className="font-semibold">
                  {LATE.length} factures en retard :
                </span>
                <span>
                  {LATE.map((i, idx) => `${groupeById(i.groupeId).name} (${i.daysLate} jours, ${formatEur(i.amountEur)})${idx < LATE.length - 1 ? ', ' : '.'}`).join('')}
                </span>
                <span className="ml-auto font-medium">Relances prêtes à relire.</span>
              </motion.div>
              <div className="grid grid-cols-4 gap-3">
                <StatTile label="Émis ce trimestre" value={<CountUp to={TOTALS.emis} active={fired('tiles')} format={formatEur} />} />
                <StatTile label="Encaissé" value={<CountUp to={TOTALS.encaisse} active={fired('tiles')} format={formatEur} />} />
                <StatTile label="En attente" value={<CountUp to={TOTALS.enAttente} active={fired('tiles')} format={formatEur} />} />
                <StatTile label="En retard" value={<CountUp to={TOTALS.enRetard} active={fired('tiles')} format={formatEur} />} accent />
              </div>
              <div className="grid min-h-0 flex-1 grid-cols-[1fr_360px] gap-4">
                <Panel title="Factures">
                  <table className="w-full border-collapse text-[13px]" style={{ color: INK }}>
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
                        <motion.tr
                          key={inv.id}
                          initial={false}
                          animate={fired('rows') ? { opacity: 1 } : { opacity: 0 }}
                          transition={{ duration: 0.25, delay: fired('rows') ? i * 0.07 : 0 }}
                          className="border-t"
                          style={{ borderColor: GRAY_200, background: inv.status === 'en-retard' && fired('banner') ? BAD_TINT : 'transparent' }}
                        >
                          <td className="whitespace-nowrap px-3 py-2 font-mono text-[12px]" style={{ color: GRAY_600 }}>
                            {inv.number}
                          </td>
                          <td className="px-3 py-2 font-medium">{groupeById(inv.groupeId).name}</td>
                          <td className="px-3 py-2 font-mono text-[12px]" style={{ color: GRAY_600 }}>
                            {inv.issuedAt}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 font-mono text-[12px]" style={{ color: inv.status === 'en-retard' ? BAD : GRAY_600 }}>
                            {inv.dueAt}
                            {inv.daysLate ? ` (+${inv.daysLate} j)` : ''}
                          </td>
                          <td className="px-3 py-2 text-right font-mono text-[12.5px] tabular-nums">{formatEur(inv.amountEur)}</td>
                          <td className="px-3 py-2">
                            <InvoiceStatusChip status={inv.status} />
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </Panel>
                <motion.div initial={false} animate={fired('devis') ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }} transition={{ duration: 0.35, ease: EASE }}>
                  <Panel title={`Devis à rédiger (${DEVIS.length})`} right={<Chip tone="ember">déduits des postes</Chip>}>
                    <ul>
                      {DEVIS.map((p) => (
                        <li key={p.id} className="border-t py-2.5 text-[13px]" style={{ borderColor: GRAY_200, color: INK }}>
                          <div className="font-medium">{p.title}</div>
                          <div className="flex items-center justify-between text-[12px]" style={{ color: GRAY_600 }}>
                            <span>{groupeName(p)}</span>
                            <span className="font-mono" style={{ color: WARN }}>
                              avant le {p.tags.due}
                            </span>
                          </div>
                        </li>
                      ))}
                    </ul>
                    <p className="mt-3 text-[12px]" style={{ color: GRAY_500 }}>
                      Chaque poste balisé <span className="font-mono font-semibold" style={{ color: INK }}>#devis</span> remonte ici tout seul. Le devis se prépare en quelques minutes à partir de la fiche client.
                    </p>
                  </Panel>
                </motion.div>
              </div>
            </div>
          </AppShell>
        </BrowserFrame>
      </ScaledStage>
    </div>
  )
}
