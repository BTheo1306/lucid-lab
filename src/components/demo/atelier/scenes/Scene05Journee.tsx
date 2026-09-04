'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Square } from 'lucide-react'

import { PEOPLE } from '@/lib/demo/atelier/identity'
import { atelierGroups, groupeName, kpis, leaMaquettes, poseList, todayList, waitingBatList } from '@/lib/demo/atelier/postes'
import type { Poste } from '@/lib/demo/atelier/types'

import { AppShell, Panel, StatTile } from '../app/AppShell'
import { BallBadge, StageBadge, UrgencyDot } from '../app/Chips'
import { CountUp } from '../chrome/CountUp'
import { BrowserFrame, ScaledStage } from '../chrome/DeviceFrame'
import { useScene } from '../player/SceneContext'
import { EASE, GRAY_100, GRAY_200, GRAY_500, GRAY_600, INK, WARN } from '../tokens'

const K = kpis()
const TODAY = todayList()
const GROUPS = atelierGroups()
const POSE = poseList()
const WAITING = waitingBatList()
const LEA = leaMaquettes()

function Row({ poste, show, index, muted = false }: { poste: Poste; show: boolean; index: number; muted?: boolean }) {
  return (
    <motion.li
      initial={false}
      animate={show ? { opacity: muted ? 0.5 : 1, x: 0 } : { opacity: 0, x: -6 }}
      transition={{ duration: 0.3, ease: EASE, delay: show ? index * 0.08 : 0 }}
      className="flex items-center gap-3 border-t py-2 text-[13px]"
      style={{ borderColor: GRAY_200, color: INK }}
    >
      <UrgencyDot level={poste.urgency} />
      <span className="w-[230px] truncate font-medium">{poste.title}</span>
      <span className="w-[200px] truncate" style={{ color: GRAY_600 }}>
        {groupeName(poste)}
      </span>
      <span className="flex-1 truncate text-[12px]" style={{ color: GRAY_500 }}>
        {poste.urgencyReason ?? (poste.material ?? '')}
      </span>
      <StageBadge stage={poste.stage} />
      <span className="w-14 text-right font-mono text-[12px]" style={{ color: WARN }}>
        {poste.tags.due}
      </span>
    </motion.li>
  )
}

function Journee() {
  const { fired } = useScene()
  return (
    <div className="flex h-full flex-col gap-4">
      <div className="grid grid-cols-4 gap-3">
        <StatTile label="À faire aujourd'hui" value={<CountUp to={K.today} active={fired('kpis')} />} accent />
        <StatTile label="Chez les clients" value={<CountUp to={K.atClients} active={fired('kpis')} />} />
        <StatTile label="Chez l'apprentie" value={<CountUp to={K.atApprentice} active={fired('kpis')} />} />
        <StatTile label="Atelier" value={<CountUp to={K.atelier} active={fired('kpis')} />} />
      </div>
      <Panel title="Six choses maximum aujourd'hui" right={<span className="text-[11.5px]" style={{ color: GRAY_500 }}>Urgence calculée depuis l&rsquo;échéance, l&rsquo;étape et l&rsquo;état. Rien à saisir.</span>}>
        <ul>
          {TODAY.map((p, i) => (
            <Row key={p.id} poste={p} show={fired('list')} index={i} />
          ))}
        </ul>
      </Panel>
    </div>
  )
}

function Atelier() {
  const { fired } = useScene()
  const show = fired('groups')
  return (
    <div className="grid h-full grid-cols-[1fr_1fr] gap-4">
      <div className="flex flex-col gap-4">
        {GROUPS.map((g, gi) => (
          <motion.section
            key={g.machine}
            initial={false}
            animate={show ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
            transition={{ duration: 0.35, ease: EASE, delay: show ? gi * 0.15 : 0 }}
            className="rounded-[8px] border px-4 py-3"
            style={{ borderColor: GRAY_200 }}
          >
            <header className="flex items-baseline justify-between">
              <h3 className="text-[14px] font-bold" style={{ color: INK }}>
                {g.label} : {g.postes.length} à enchaîner
              </h3>
              <span className="font-mono text-[11px]" style={{ color: GRAY_500 }}>
                {g.postes[0]?.material}
              </span>
            </header>
            <ul className="mt-1">
              {g.postes.map((p, i) => (
                <Row key={p.id} poste={p} show={show} index={gi * 3 + i} />
              ))}
            </ul>
          </motion.section>
        ))}
      </div>
      <div className="flex flex-col gap-4">
        <motion.section initial={false} animate={show ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }} transition={{ duration: 0.35, ease: EASE, delay: show ? 0.45 : 0 }} className="rounded-[8px] border px-4 py-3" style={{ borderColor: GRAY_200 }}>
          <h3 className="text-[14px] font-bold" style={{ color: INK }}>
            Pose : {POSE.length} (vendredi)
          </h3>
          <ul className="mt-1">
            {POSE.map((p, i) => (
              <Row key={p.id} poste={p} show={show} index={i} />
            ))}
          </ul>
        </motion.section>
        <motion.section initial={false} animate={fired('bat') ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }} transition={{ duration: 0.35, ease: EASE }} className="rounded-[8px] border px-4 py-3" style={{ borderColor: GRAY_200, background: GRAY_100 }}>
          <h3 className="text-[14px] font-bold" style={{ color: GRAY_600 }}>
            En attente de BAT client ({WAITING.length})
          </h3>
          <p className="text-[12px]" style={{ color: GRAY_500 }}>
            Visibles, jamais lancés : la balle est chez le client.
          </p>
          <ul className="mt-1">
            {WAITING.map((p, i) => (
              <Row key={p.id} poste={p} show={fired('bat')} index={i} muted />
            ))}
          </ul>
        </motion.section>
      </div>
    </div>
  )
}

function Lea() {
  const { fired } = useScene()
  return (
    <Panel title={`Maquettes de ${PEOPLE.lea.firstName}`} right={<span className="text-[11.5px]" style={{ color: GRAY_500 }}>Un seul écran, imposé par le compte, pas par la bonne volonté.</span>}>
      <ul>
        {LEA.map((p, i) => (
          <motion.li
            key={p.id}
            initial={false}
            animate={fired('lea-view') ? { opacity: 1, x: 0 } : { opacity: 0, x: -6 }}
            transition={{ duration: 0.3, ease: EASE, delay: fired('lea-view') ? i * 0.1 : 0 }}
            className="flex items-center gap-3 border-t py-3 text-[13px]"
            style={{ borderColor: GRAY_200, color: INK }}
          >
            <Square size={16} aria-hidden="true" style={{ color: GRAY_500 }} />
            <span className="w-[260px] font-medium">{p.title}</span>
            <span className="w-[220px]" style={{ color: GRAY_600 }}>
              {groupeName(p)}
            </span>
            <span className="flex-1 text-[12px]" style={{ color: GRAY_500 }}>
              {p.urgencyReason}
            </span>
            <BallBadge ball={p.ball} />
            <span className="w-14 text-right font-mono text-[12px]" style={{ color: WARN }}>
              {p.tags.due}
            </span>
          </motion.li>
        ))}
      </ul>
    </Panel>
  )
}

export function Scene05Journee() {
  const { fired } = useScene()
  const phase: 'journee' | 'atelier' | 'lea' = fired('switch-lea') ? 'lea' : fired('atelier') ? 'atelier' : 'journee'

  return (
    <div className="h-full">
      <ScaledStage width={1280} height={800}>
        <BrowserFrame url={phase === 'lea' ? 'app.atelier-briere.example/maquettes' : phase === 'atelier' ? 'app.atelier-briere.example/atelier' : 'app.atelier-briere.example'}>
          <AnimatePresence mode="wait" initial={false}>
            <motion.div key={phase} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="h-full">
              {phase === 'lea' ? (
                <AppShell active="maquettes" user="lea" counters={{ maquettes: LEA.length }} title="Maquettes" subtitle="Ce que voit l'apprentie : ses maquettes et fichiers de découpe, rien d'autre">
                  <Lea />
                </AppShell>
              ) : phase === 'atelier' ? (
                <AppShell active="atelier" counters={{ atelier: K.atelier, journee: K.today }} title="Atelier" subtitle="Postes lançables aujourd'hui, regroupés par machine et par matière">
                  <Atelier />
                </AppShell>
              ) : (
                <AppShell active="journee" counters={{ journee: K.today, atelier: K.atelier }} title="Ma journée" subtitle="Ce qui compte aujourd'hui, calculé depuis les postes">
                  <Journee />
                </AppShell>
              )}
            </motion.div>
          </AnimatePresence>
        </BrowserFrame>
      </ScaledStage>
    </div>
  )
}
