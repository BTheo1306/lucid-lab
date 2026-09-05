'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Check, Mic, Square, SquareCheck } from 'lucide-react'

import { AUTOCOMPLETE_QUERY, CALL_REPORT, CALL_TYPES, CLIENT_FILE } from '@/lib/demo/atelier/callReport'
import { GROUPES, LEGACY_FOLDER_COUNT, groupeById } from '@/lib/demo/atelier/groupes'
import { STAGE_LABEL } from '@/lib/demo/atelier/postes'
import { POSTES_V2 } from '@/lib/demo/atelier-v2/data'

import { TypedText } from '../../atelier/chrome/TypedText'
import { useScene } from '../../atelier/player/SceneContext'
import { EASE, EMBER, EMBER_TINT, GRAY_200, GRAY_300, GRAY_500, GRAY_600, INK, PAPER, WHITE } from '../../atelier/tokens'
import { Region } from '../chrome/Camera'
import { AppFrame, Button, Card, Label, Status } from '../chrome/ui'

const CLIENT = groupeById(CALL_REPORT.groupeId)
const OPTIONS = GROUPES.filter((g) => g.name.toLowerCase().startsWith(AUTOCOMPLETE_QUERY))
const CLIENT_POSTES = POSTES_V2.filter((p) => p.groupeId === CALL_REPORT.groupeId)
const RECENT = [
  { date: '08/09, 16:10', client: 'Entreprise Bâtiment Démo', type: 'Visite chantier', text: 'Bâche 4 x 2 m à poser côté rue, œillets renforcés.' },
  { date: '08/09, 09:35', client: 'Boulangerie Modèle', type: 'Appel reçu', text: 'Veut avancer la banderole promo au 12/09.' },
  { date: '07/09, 14:20', client: 'Cabinet Exemple', type: 'RDV', text: 'Plaque laiton : attend la validation des associés.' },
]

function Waveform({ active }: { active: boolean }) {
  return (
    <span className="flex h-7 items-center gap-[3px]" aria-hidden="true">
      {Array.from({ length: 14 }).map((_, i) => (
        <span key={i} className={active ? 'demo-wave-bar' : ''} style={{ width: 3, height: 6 + ((i * 7) % 16), borderRadius: 2, background: active ? EMBER : GRAY_300, animationDelay: `${(i % 5) * 0.11}s`, transform: active ? undefined : 'scaleY(0.4)' }} />
      ))}
    </span>
  )
}

export function CompteRenduScreen() {
  const { fired } = useScene()
  const dictating = fired('dictate') && !fired('save')
  const saved = fired('save')

  return (
    <AppFrame active="Comptes rendus" title="Appel, compte rendu, rendez-vous" meta="Dicté ou tapé, rangé à la date du jour dans la fiche du client">
      <div className="grid h-full grid-cols-[640px_1fr] gap-6">
        <Region id="form-cr">
          <Card className="flex h-full flex-col gap-5 p-6">
            <div className="flex flex-wrap gap-2">
              {CALL_TYPES.map((t) => {
                const selected = fired('type') && t.id === CALL_REPORT.type
                return (
                  <span key={t.id} className="inline-flex h-9 items-center rounded-[6px] border px-3.5 text-[13.5px] font-medium" style={{ background: selected ? INK : WHITE, color: selected ? WHITE : INK, borderColor: selected ? INK : GRAY_200 }}>
                    {t.label}
                  </span>
                )
              })}
            </div>
            <Region id="client-field" className="relative">
              <Label>Client</Label>
              <div className="mt-1.5 flex h-12 items-center gap-3 rounded-[6px] border px-3.5 text-[15px]" style={{ borderColor: fired('client') && !fired('pick-client') ? INK : GRAY_200, color: INK }}>
                {fired('pick-client') ? (
                  <>
                    <span className="font-semibold">{CLIENT.name}</span>
                    <Status>dossier depuis {CLIENT.folderSince}</Status>
                  </>
                ) : (
                  <TypedText text={AUTOCOMPLETE_QUERY} active={fired('client')} cps={5} showCaret={false} />
                )}
              </div>
              <AnimatePresence>
                {fired('client') && !fired('pick-client') ? (
                  <motion.ul initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.3 }} className="absolute left-0 right-0 top-full z-10 mt-1.5 overflow-hidden rounded-[6px] border text-[15px]" style={{ borderColor: GRAY_200, background: WHITE, boxShadow: '0 12px 32px rgba(10,10,10,0.08)' }}>
                    {OPTIONS.map((g, i) => (
                      <li key={g.id} className="flex items-center justify-between px-4 py-2.5" style={{ background: i === 0 ? PAPER : WHITE, color: INK }}>
                        <span className="font-medium">{g.name}</span>
                        <span className="font-mono text-[12.5px]" style={{ color: GRAY_500 }}>
                          dossier depuis {g.folderSince}
                        </span>
                      </li>
                    ))}
                    <li className="border-t px-4 py-2 font-mono text-[12px]" style={{ borderColor: GRAY_200, color: GRAY_500 }}>
                      {`${LEGACY_FOLDER_COUNT} dossiers indexés sur le serveur de l’atelier`}
                    </li>
                  </motion.ul>
                ) : null}
              </AnimatePresence>
            </Region>
            <div className="grid grid-cols-[1fr_auto] gap-4">
              <div>
                <Label>Date</Label>
                <div className="mt-1.5 flex h-12 items-center rounded-[6px] border px-3.5 font-mono text-[14px]" style={{ borderColor: GRAY_200, color: INK }}>
                  {CALL_REPORT.date}
                </div>
              </div>
              <div>
                <Label>Dictée</Label>
                <div className="mt-1.5 flex h-12 items-center gap-3 rounded-[6px] border px-4" style={{ borderColor: dictating ? EMBER : GRAY_200, background: dictating ? EMBER_TINT : WHITE, color: INK }}>
                  <Mic size={16} aria-hidden="true" style={{ color: dictating ? EMBER : GRAY_600 }} />
                  <Waveform active={dictating} />
                </div>
              </div>
            </div>
            <Region id="transcript" className="flex-1">
              <Label>Compte rendu</Label>
              <div role="textbox" aria-readonly="true" className="mt-1.5 min-h-[150px] rounded-[6px] border px-4 py-3 text-[15.5px] leading-[1.6]" style={{ borderColor: GRAY_200, color: INK }}>
                <TypedText text={CALL_REPORT.transcript} active={fired('transcript')} cps={40} showCaret={false} />
              </div>
            </Region>
            <div className="flex items-center gap-2.5 text-[14px]" style={{ color: INK }}>
              {fired('save') ? <SquareCheck size={18} aria-hidden="true" style={{ color: EMBER }} /> : <Square size={18} aria-hidden="true" style={{ color: GRAY_500 }} />}
              En tirer les actions dans la liste des postes
            </div>
            <div className="flex items-center gap-4">
              <Button primary disabled={saved}>Enregistrer dans la fiche</Button>
              <AnimatePresence>
                {saved ? (
                  <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="inline-flex items-center gap-2 text-[14px] font-medium" style={{ color: INK }}>
                    <Check size={15} aria-hidden="true" />
                    Rangé dans {CLIENT.name}, {CALL_REPORT.date}
                  </motion.span>
                ) : null}
              </AnimatePresence>
            </div>
          </Card>
        </Region>
        <div className="relative min-h-0 overflow-hidden">
          <Card className="h-full p-6">
            <h3 className="text-[18px] font-bold">Derniers comptes rendus</h3>
            <ul className="mt-2">
              {RECENT.map((r) => (
                <li key={r.date} className="border-t py-3 text-[15px]" style={{ borderColor: GRAY_200, color: INK }}>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-[12.5px]" style={{ color: GRAY_500 }}>
                      {r.date}
                    </span>
                    <span className="font-semibold">{r.client}</span>
                    <Status>{r.type}</Status>
                  </div>
                  <div className="mt-1 text-[14px]" style={{ color: GRAY_600 }}>
                    {r.text}
                  </div>
                </li>
              ))}
            </ul>
          </Card>
          <AnimatePresence>
            {fired('drawer') ? (
              <motion.aside initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ duration: 0.7, ease: EASE }} className="absolute inset-y-0 right-0 w-[560px] overflow-hidden rounded-[8px] border" style={{ borderColor: GRAY_200, background: WHITE, boxShadow: '-16px 0 40px rgba(10,10,10,0.08)' }} aria-label={`Fiche client ${CLIENT.name}`}>
                <Region id="drawer" className="h-full">
                  <div className="border-b px-7 py-5" style={{ borderColor: GRAY_200 }}>
                    <Label>Fiche client</Label>
                    <h3 className="mt-1 text-[24px] font-bold tracking-[-0.01em]">{CLIENT.name}</h3>
                    <div className="mt-1 font-mono text-[13px]" style={{ color: GRAY_600 }}>
                      {CLIENT.contact}, {CLIENT.phone}, dossier depuis {CLIENT.folderSince}
                    </div>
                  </div>
                  <div className="flex flex-col gap-6 px-7 py-5 text-[14px]" style={{ color: INK }}>
                    <Region id="history">
                      <Label>Historique</Label>
                      <ul className="mt-2 space-y-2">
                        {CLIENT_FILE.history.map((h) => (
                          <li key={h.date} className="flex gap-4 rounded-[6px] px-3 py-2" style={{ background: h.isNew ? EMBER_TINT : 'transparent' }}>
                            <span className="w-[92px] shrink-0 font-mono text-[12.5px] font-semibold" style={{ color: h.isNew ? EMBER : GRAY_500 }}>
                              {h.date}
                            </span>
                            <span style={{ color: h.isNew ? INK : GRAY_600 }}>{h.text}</span>
                          </li>
                        ))}
                      </ul>
                    </Region>
                    <section>
                      <Label>Postes en cours</Label>
                      <ul className="mt-2 space-y-1.5">
                        {CLIENT_POSTES.map((p) => (
                          <li key={p.id} className="flex items-center gap-3">
                            <Status highlight={p.stage === 'prod'}>{STAGE_LABEL[p.stage]}</Status>
                            <span>{p.title}</span>
                            <span className="ml-auto font-mono text-[12.5px]" style={{ color: GRAY_600 }}>
                              {p.tags.due}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </section>
                    <section>
                      <Label>Procédures</Label>
                      <ul className="mt-2 list-disc space-y-1 pl-5" style={{ color: GRAY_600 }}>
                        {CLIENT_FILE.procedures.map((p) => (
                          <li key={p}>{p}</li>
                        ))}
                      </ul>
                    </section>
                  </div>
                </Region>
              </motion.aside>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </AppFrame>
  )
}
