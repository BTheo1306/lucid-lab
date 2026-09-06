'use client'

import { AnimatePresence, motion } from 'framer-motion'

import { groupeName } from '@/lib/demo/atelier/postes'
import { atelierGroupsV2, kpisV2, poseListV2, todayListV2, waitingBatListV2 } from '@/lib/demo/atelier-v2/data'
import type { Poste } from '@/lib/demo/atelier/types'
import { STAGE_LABEL } from '@/lib/demo/atelier/postes'

import { CountUp } from '../../atelier/chrome/CountUp'
import { useScene } from '../../atelier/player/SceneContext'
import { EASE, EMBER, GRAY_200, GRAY_300, GRAY_500, GRAY_600, INK } from '../../atelier/tokens'
import { Region } from '../chrome/Camera'
import { AppFrame, Card, Label, Status, Tile } from '../chrome/ui'

const K = kpisV2()
const TODAY = todayListV2()
const GROUPS = atelierGroupsV2()
const POSE = poseListV2()
const WAITING = waitingBatListV2()

function UrgencyBar({ level }: { level: 0 | 1 | 2 | 3 }) {
  return (
    <span className="flex h-4 items-end gap-[3px]" aria-label={`urgence ${level} sur 3`} role="img">
      {[1, 2, 3].map((i) => (
        <span key={i} className="w-[4px] rounded-[1px]" style={{ height: 4 + i * 4, background: i <= level ? EMBER : GRAY_300 }} />
      ))}
    </span>
  )
}

function Row({ poste, show, index, muted = false }: { poste: Poste; show: boolean; index: number; muted?: boolean }) {
  return (
    <motion.li
      initial={false}
      animate={show ? { opacity: muted ? 0.55 : 1, x: 0 } : { opacity: 0, x: -8 }}
      transition={{ duration: 0.45, ease: EASE, delay: show ? index * 0.12 : 0 }}
      className="flex items-center gap-5 border-t py-3.5 text-[15px]"
      style={{ borderColor: GRAY_200, color: INK }}
    >
      <UrgencyBar level={poste.urgency} />
      <span className="w-[300px] truncate font-semibold">{poste.title}</span>
      <span className="w-[260px] truncate" style={{ color: GRAY_600 }}>
        {groupeName(poste)}
      </span>
      <span className="flex-1 truncate text-[14px]" style={{ color: GRAY_500 }}>
        {poste.urgencyReason ?? poste.material ?? ''}
      </span>
      <Status highlight={poste.stage === 'devis'}>{STAGE_LABEL[poste.stage]}</Status>
      <span className="w-16 text-right font-mono text-[13.5px] font-semibold" style={{ color: INK }}>
        {poste.tags.due}
      </span>
    </motion.li>
  )
}

function Journee() {
  const { fired } = useScene()
  return (
    <div className="flex h-full flex-col gap-6">
      <Region id="kpis" className="grid grid-cols-4 gap-5">
        <Tile label="À faire aujourd'hui" value={<CountUp to={K.today} active={fired('kpis')} durationMs={1400} />} accent />
        <Tile label="Chez les clients" value={<CountUp to={K.atClients} active={fired('kpis')} durationMs={1400} />} />
        <Tile label="Chez les fournisseurs" value={<CountUp to={K.atSuppliers} active={fired('kpis')} durationMs={1400} />} />
        <Tile label="À l'atelier" value={<CountUp to={K.atelier} active={fired('kpis')} durationMs={1400} />} />
      </Region>
      <Region id="list">
        <Card className="px-6 py-5">
          <div className="flex items-baseline justify-between">
            <h3 className="text-[18px] font-bold">Six choses maximum aujourd&rsquo;hui</h3>
            <span className="text-[13px]" style={{ color: GRAY_500 }}>
              Urgence calculée depuis l&rsquo;échéance, l&rsquo;étape et l&rsquo;état. Rien à saisir.
            </span>
          </div>
          <ul className="mt-3">
            {TODAY.map((p, i) => (
              <Row key={p.id} poste={p} show={fired('list')} index={i} />
            ))}
          </ul>
        </Card>
      </Region>
    </div>
  )
}

function Atelier() {
  const { fired } = useScene()
  const show = fired('groups')
  return (
    <div className="grid h-full grid-cols-[1.35fr_1fr] gap-6">
      <Region id="atelier-groups" className="flex flex-col gap-5">
        {GROUPS.map((g, gi) => (
          <motion.section key={g.machine} initial={false} animate={show ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }} transition={{ duration: 0.5, ease: EASE, delay: show ? gi * 0.2 : 0 }} className="rounded-[8px] border px-6 py-4" style={{ borderColor: GRAY_200 }}>
            <header className="flex items-baseline justify-between">
              <h3 className="text-[18px] font-bold">
                {g.label} <span style={{ color: EMBER }}>: {g.postes.length} à enchaîner</span>
              </h3>
              <Label>{g.postes[0]?.material}</Label>
            </header>
            <ul className="mt-1">
              {g.postes.map((p, i) => (
                <Row key={p.id} poste={p} show={show} index={gi * 3 + i} />
              ))}
            </ul>
          </motion.section>
        ))}
      </Region>
      <div className="flex flex-col gap-5">
        <motion.section initial={false} animate={show ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }} transition={{ duration: 0.5, ease: EASE, delay: show ? 0.6 : 0 }} className="rounded-[8px] border px-6 py-4" style={{ borderColor: GRAY_200 }}>
          <h3 className="text-[18px] font-bold">Pose : {POSE.length} (vendredi)</h3>
          <ul className="mt-1">
            {POSE.map((p, i) => (
              <Row key={p.id} poste={p} show={show} index={i} />
            ))}
          </ul>
        </motion.section>
        <Region id="bat">
          <motion.section initial={false} animate={fired('bat') ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }} transition={{ duration: 0.5, ease: EASE }} className="rounded-[8px] border px-6 py-4" style={{ borderColor: GRAY_200 }}>
            <h3 className="text-[18px] font-bold" style={{ color: GRAY_600 }}>
              En attente de BAT client ({WAITING.length})
            </h3>
            <p className="text-[13.5px]" style={{ color: GRAY_500 }}>
              Visibles, jamais lancés : la balle est chez le client.
            </p>
            <ul className="mt-1">
              {WAITING.map((p, i) => (
                <Row key={p.id} poste={p} show={fired('bat')} index={i} muted />
              ))}
            </ul>
          </motion.section>
        </Region>
      </div>
    </div>
  )
}

export function JourneeScreen() {
  const { fired } = useScene()
  const atelier = fired('atelier')
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div key={atelier ? 'atelier' : 'journee'} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.4 }} className="h-full">
        {atelier ? (
          <AppFrame active="Atelier" title="Atelier" meta="Postes lançables aujourd'hui, regroupés par machine et par matière">
            <Atelier />
          </AppFrame>
        ) : (
          <AppFrame active="Ma journée" title="Ma journée" meta="Ce qui compte aujourd'hui, calculé depuis les postes">
            <Journee />
          </AppFrame>
        )}
      </motion.div>
    </AnimatePresence>
  )
}
