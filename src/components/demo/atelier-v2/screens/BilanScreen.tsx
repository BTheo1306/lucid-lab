'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

import { TIME_SAVED_ROWS, formatHours, timeSavedTotals } from '@/lib/demo/atelier/timeSaved'

import { useScene } from '../../atelier/player/SceneContext'
import { EASE, EMBER, EMBER_700, GRAY_200, GRAY_500, GRAY_600, INK, PAPER, WHITE } from '../../atelier/tokens'
import { Region } from '../chrome/Camera'
import { Label, Rise, TH } from '../chrome/ui'

const TOTALS = timeSavedTotals()

export function BilanScreen() {
  const { fired } = useScene()
  const rows = fired('rows')
  return (
    <div className="grid h-full w-full grid-cols-[1fr_420px] gap-12 px-14 py-10" style={{ background: PAPER, color: INK }}>
      <div className="flex flex-col gap-5">
        <Region id="table-time" className="overflow-hidden rounded-[8px] border" style={{ borderColor: GRAY_200, background: WHITE }}>
          <table className="w-full border-collapse text-[15px]">
            <thead>
              <tr style={{ color: GRAY_500 }}>
                <th className={TH}>Tâche</th>
                <th className={TH}>Avant, à la main</th>
                <th className={TH}>Fréquence</th>
                <th className={TH}>Maintenant</th>
                <th className={`${TH} text-right`}>Gain par semaine</th>
              </tr>
            </thead>
            <tbody>
              {TIME_SAVED_ROWS.map((r, i) => (
                <motion.tr key={r.task} initial={false} animate={rows ? { opacity: 1, x: 0 } : { opacity: 0, x: -8 }} transition={{ duration: 0.35, ease: EASE, delay: rows ? i * 0.35 : 0 }} className="border-t" style={{ borderColor: GRAY_200 }}>
                  <td className="px-4 py-2 font-medium">{r.task}</td>
                  <td className="px-4 py-2" style={{ color: GRAY_600 }}>
                    {r.before}
                  </td>
                  <td className="px-4 py-2" style={{ color: GRAY_600 }}>
                    {r.frequency}
                  </td>
                  <td className="px-4 py-2" style={{ color: GRAY_600 }}>
                    {r.now}
                  </td>
                  <td className="whitespace-nowrap px-4 py-2 text-right font-mono text-[14px] font-semibold tabular-nums" style={{ color: EMBER_700 }}>
                    {formatHours(r.gainMinPerWeek)}
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </Region>
        <Region id="total">
          <Rise show={fired('totals')} className="grid grid-cols-3 gap-5">
            {[
              { value: `≈ ${TOTALS.perWeekLabel}`, label: 'par semaine' },
              { value: `≈ ${TOTALS.perMonthHours} h`, label: 'par mois' },
              { value: '≈ un quart', label: 'de poste administratif' },
            ].map((t) => (
              <div key={t.label} className="rounded-[8px] border px-6 py-5" style={{ borderColor: GRAY_200, background: WHITE }}>
                <div className="text-[36px] font-bold leading-none tracking-[-0.02em]" style={{ color: EMBER_700 }}>
                  {t.value}
                </div>
                <div className="mt-2">
                  <Label>{t.label}</Label>
                </div>
              </div>
            ))}
          </Rise>
          <Rise show={fired('totals')} delay={0.2}>
            <p className="mt-4 max-w-[90ch] text-[13px] leading-relaxed" style={{ color: GRAY_500 }}>
              Méthode : base d&rsquo;environ six jours travaillés par semaine. Chiffres déclarés par la dirigeante de l&rsquo;atelier de référence, à partir de son propre inventaire, pas mesurés par Lucid-Lab. À recalculer chez vous pendant l&rsquo;audit flash.
            </p>
          </Rise>
        </Region>
      </div>
      <div className="flex flex-col justify-end">
        <Rise show={fired('cta')}>
          <Region id="cta" className="rounded-[8px] p-8" style={{ background: INK, color: WHITE }}>
            <div className="h-px w-12" style={{ background: EMBER }} aria-hidden="true" />
            <p className="mt-6 text-[34px] font-bold leading-[1.1] tracking-[-0.02em]">Reprenez vos journées.</p>
            <p className="mt-4 text-[15.5px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.72)' }}>
              Un audit flash de trente minutes, sur votre boîte mail et vos devis à vous, dit ce que le même système donnerait dans votre atelier.
            </p>
            <div className="mt-6 flex items-baseline gap-3">
              <span className="text-[34px] font-bold leading-none tracking-[-0.02em]" style={{ color: EMBER }}>
                2 jours
              </span>
              <span className="font-mono text-[11.5px] uppercase tracking-[0.14em]" style={{ color: 'rgba(255,255,255,0.6)' }}>
                d&rsquo;installation, à distance
              </span>
            </div>
            <Link href="/audit-flash" className="mt-7 inline-flex h-12 items-center gap-2.5 rounded-[6px] px-5 text-[15px] font-semibold" style={{ background: EMBER, color: WHITE }}>
              Réserver un audit flash
              <ArrowRight size={16} aria-hidden="true" />
            </Link>
            <p className="mt-6 font-mono text-[11.5px] uppercase tracking-[0.14em]" style={{ color: 'rgba(255,255,255,0.5)' }}>
              Lucid-Lab · lucid-lab.fr
            </p>
          </Region>
        </Rise>
      </div>
    </div>
  )
}
