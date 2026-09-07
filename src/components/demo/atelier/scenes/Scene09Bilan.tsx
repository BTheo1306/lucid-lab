'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

import { TIME_SAVED_ROWS, formatHours, timeSavedTotals } from '@/lib/demo/atelier/timeSaved'

import { Reveal } from '../chrome/Reveal'
import { useScene } from '../player/SceneContext'
import { EASE, EMBER, EMBER_700, GRAY_200, GRAY_500, GRAY_600, INK, WHITE } from '../tokens'

const TOTALS = timeSavedTotals()
const TH = 'px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.08em]'

const REMAINS = [
  { title: 'Décider', text: 'Accepter, refuser, prioriser : chaque fiche du matin attend votre clic.' },
  { title: 'Valider', text: 'Chaque devis, chaque commande, chaque envoi part après votre relecture.' },
  { title: 'Parler aux clients', text: 'Le relevé, la pose, le conseil : le métier reste à la dirigeante.' },
]

export function Scene09Bilan() {
  const { fired } = useScene()
  const rows = fired('rows')

  return (
    <div className="mx-auto grid h-full max-w-[1200px] grid-cols-1 gap-8 overflow-auto lg:grid-cols-[1fr_340px]">
      <div>
        <div className="overflow-hidden rounded-[8px] border" style={{ borderColor: GRAY_200, background: WHITE }}>
          <table className="w-full border-collapse text-[13px]" style={{ color: INK }}>
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
                <motion.tr
                  key={r.task}
                  initial={false}
                  animate={rows ? { opacity: 1, x: 0 } : { opacity: 0, x: -6 }}
                  transition={{ duration: 0.25, ease: EASE, delay: rows ? i * 0.12 : 0 }}
                  className="border-t"
                  style={{ borderColor: GRAY_200 }}
                >
                  <td className="px-3 py-1.5 font-medium">{r.task}</td>
                  <td className="px-3 py-1.5" style={{ color: GRAY_600 }}>
                    {r.before}
                  </td>
                  <td className="px-3 py-1.5" style={{ color: GRAY_600 }}>
                    {r.frequency}
                  </td>
                  <td className="px-3 py-1.5" style={{ color: GRAY_600 }}>
                    {r.now}
                  </td>
                  <td className="px-3 py-1.5 text-right font-mono text-[12.5px] font-semibold tabular-nums" style={{ color: EMBER_700 }}>
                    {formatHours(r.gainMinPerWeek)}
                  </td>
                </motion.tr>
              ))}
              <motion.tr initial={false} animate={fired('totals') ? { opacity: 1 } : { opacity: 0 }} transition={{ duration: 0.3 }} className="border-t-2" style={{ borderColor: INK }}>
                <td className="px-3 py-2.5 text-[14px] font-bold" colSpan={4}>
                  Total estimé
                </td>
                <td className="whitespace-nowrap px-3 py-2.5 text-right font-mono text-[15px] font-bold tabular-nums" style={{ color: EMBER_700 }}>
                  ≈ {TOTALS.perWeekLabel} / sem.
                </td>
              </motion.tr>
            </tbody>
          </table>
        </div>
        <Reveal show={fired('totals')} className="mt-4 grid grid-cols-3 gap-3">
          {[
            { value: `≈ ${TOTALS.perWeekLabel}`, label: 'par semaine' },
            { value: `≈ ${TOTALS.perMonthHours} h`, label: 'par mois' },
            { value: '≈ un quart', label: 'de poste administratif' },
          ].map((t) => (
            <div key={t.label} className="rounded-[8px] border px-4 py-3" style={{ borderColor: GRAY_200, background: WHITE }}>
              <div className="text-[24px] font-bold leading-none tracking-[-0.01em]" style={{ color: EMBER_700 }}>
                {t.value}
              </div>
              <div className="mt-1 text-[12px]" style={{ color: GRAY_500 }}>
                {t.label}
              </div>
            </div>
          ))}
        </Reveal>
        <Reveal show={fired('totals')} delay={0.15}>
          <p className="mt-3 text-[12px] leading-relaxed" style={{ color: GRAY_500 }}>
            Méthode : base d&rsquo;environ six jours travaillés par semaine. Chiffres déclarés par la dirigeante de l&rsquo;atelier de référence, à partir de son propre inventaire, pas mesurés par Lucid-Lab. À recalculer chez vous pendant l&rsquo;audit flash.
          </p>
        </Reveal>
      </div>
      <div className="flex flex-col gap-5">
        <Reveal show={fired('remains')}>
          <h3 className="text-[12px] font-semibold uppercase tracking-[0.1em]" style={{ color: GRAY_500 }}>
            Ce qui reste à la dirigeante
          </h3>
          <ul className="mt-3 flex flex-col gap-3">
            {REMAINS.map((r) => (
              <li key={r.title} className="border-l-2 pl-3" style={{ borderColor: EMBER }}>
                <div className="text-[14px] font-bold" style={{ color: INK }}>
                  {r.title}
                </div>
                <div className="text-[13px] leading-snug" style={{ color: GRAY_600 }}>
                  {r.text}
                </div>
              </li>
            ))}
          </ul>
        </Reveal>
        <Reveal show={fired('cta')} className="rounded-[8px] p-5" style={{ background: INK, color: WHITE }}>
          <p className="text-[17px] font-bold leading-snug">Et chez vous ?</p>
          <p className="mt-2 text-[13px] leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
            Un audit flash de 30 minutes, sur votre boîte mail et vos devis à vous, dit ce que le même système donnerait dans votre atelier.
          </p>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-[22px] font-bold leading-none tracking-[-0.01em]" style={{ color: EMBER }}>
              2 jours
            </span>
            <span className="text-[12px]" style={{ color: 'rgba(255,255,255,0.7)' }}>
              d&rsquo;installation, à distance
            </span>
          </div>
          <Link href="/audit-flash" className="mt-4 inline-flex h-10 items-center gap-2 rounded-[6px] px-4 text-[13.5px] font-semibold" style={{ background: EMBER, color: WHITE }}>
            Voir ce que ça donnerait chez vous
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </Reveal>
      </div>
    </div>
  )
}
