'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Check, Mic, Save, SquareCheck, Square } from 'lucide-react'

import { AUTOCOMPLETE_QUERY, CALL_REPORT, CALL_TYPES, CLIENT_FILE } from '@/lib/demo/atelier/callReport'
import { GROUPES, LEGACY_FOLDER_COUNT, groupeById } from '@/lib/demo/atelier/groupes'
import { POSTES } from '@/lib/demo/atelier/postes'

import { AppButton, AppShell, Panel } from '../app/AppShell'
import { Chip, StageBadge } from '../app/Chips'
import { BrowserFrame, ScaledStage } from '../chrome/DeviceFrame'
import { TypedText } from '../chrome/TypedText'
import { useScene } from '../player/SceneContext'
import { EASE, EMBER, EMBER_TINT, GOOD, GOOD_TINT, GRAY_100, GRAY_200, GRAY_500, GRAY_600, INK, WARN, WHITE } from '../tokens'

const CLIENT = groupeById(CALL_REPORT.groupeId)
const OPTIONS = GROUPES.filter((g) => g.name.toLowerCase().startsWith(AUTOCOMPLETE_QUERY))
const CLIENT_POSTES = POSTES.filter((p) => p.groupeId === CALL_REPORT.groupeId)

const RECENT = [
  { date: '08/09, 16:10', client: 'Entreprise Bâtiment Démo', type: 'Visite chantier', text: 'Bâche 4 x 2 m à poser côté rue, œillets renforcés.' },
  { date: '08/09, 09:35', client: 'Boulangerie Modèle', type: 'Appel reçu', text: 'Veut avancer la banderole promo au 12/09.' },
  { date: '07/09, 14:20', client: 'Cabinet Exemple', type: 'RDV', text: 'Plaque laiton : attend la validation des associés.' },
]

function Waveform({ active }: { active: boolean }) {
  return (
    <span className="flex h-6 items-center gap-[3px]" aria-hidden="true">
      {Array.from({ length: 12 }).map((_, i) => (
        <span
          key={i}
          className={active ? 'demo-wave-bar' : ''}
          style={{ width: 3, height: 6 + ((i * 7) % 14), borderRadius: 2, background: active ? EMBER : GRAY_200, animationDelay: `${(i % 4) * 0.12}s`, transform: active ? undefined : 'scaleY(0.4)' }}
        />
      ))}
    </span>
  )
}

export function Scene06CompteRendu() {
  const { fired, fire } = useScene()
  const dictating = fired('dictate') && !fired('save')
  const saved = fired('save')

  return (
    <div className="h-full">
      <ScaledStage width={1280} height={800}>
        <BrowserFrame url="app.atelier-briere.example/comptes-rendus">
          <AppShell
            active="comptes-rendus"
            counters={{ journee: 6, boite: 3 }}
            notice={fired('counter') ? '1 compte rendu à traiter. Dites « traite les comptes rendus » et l\'assistant en tire les postes.' : undefined}
            title="Appel, compte rendu, RDV"
            subtitle="Dicté ou tapé, rangé à la date du jour dans la fiche du client"
          >
            <div className="grid h-full grid-cols-[560px_1fr] gap-4">
              <Panel title="Nouveau compte rendu">
                <div className="flex flex-wrap gap-1.5">
                  {CALL_TYPES.map((t) => {
                    const selected = fired('type') && t.id === CALL_REPORT.type
                    return (
                      <button
                        key={t.id}
                        type="button"
                        onClick={() => fire('type')}
                        className="h-8 rounded-[6px] border px-3 text-[12.5px] font-medium"
                        style={{ background: selected ? INK : WHITE, color: selected ? WHITE : INK, borderColor: selected ? INK : GRAY_200 }}
                        aria-pressed={selected}
                      >
                        {t.label}
                      </button>
                    )
                  })}
                </div>
                <div className="relative mt-4">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.06em]" style={{ color: GRAY_500 }}>
                    Client
                  </span>
                  <button
                    type="button"
                    onClick={() => fire('client')}
                    className="flex h-9 w-full items-center gap-2 rounded-[6px] border px-2.5 text-left text-[13px]"
                    style={{ borderColor: fired('client') && !fired('pick-client') ? INK : GRAY_200, color: INK, background: WHITE }}
                    aria-label="Rechercher un client"
                  >
                    {fired('pick-client') ? (
                      <>
                        <span className="font-medium">{CLIENT.name}</span>
                        <Chip tone="neutral">dossier depuis {CLIENT.folderSince}</Chip>
                      </>
                    ) : (
                      <TypedText text={AUTOCOMPLETE_QUERY} active={fired('client')} cps={8} />
                    )}
                  </button>
                  <AnimatePresence>
                    {fired('client') && !fired('pick-client') ? (
                      <motion.ul initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-[6px] border text-[13px]" style={{ borderColor: GRAY_200, background: WHITE, boxShadow: '0 8px 24px rgba(10,10,10,0.08)' }}>
                        {OPTIONS.map((g, i) => (
                          <li key={g.id}>
                            <button type="button" onClick={() => fire('pick-client')} className="flex w-full items-center justify-between px-3 py-2 text-left" style={{ background: i === 0 ? GRAY_100 : WHITE, color: INK }}>
                              <span className="font-medium">{g.name}</span>
                              <span className="font-mono text-[11px]" style={{ color: GRAY_500 }}>
                                dossier depuis {g.folderSince}
                              </span>
                            </button>
                          </li>
                        ))}
                        <li className="border-t px-3 py-1.5 font-mono text-[11px]" style={{ borderColor: GRAY_200, color: GRAY_500 }}>
                          {LEGACY_FOLDER_COUNT} dossiers indexés sur le serveur de l&rsquo;atelier
                        </li>
                      </motion.ul>
                    ) : null}
                  </AnimatePresence>
                </div>
                <div className="mt-3 grid grid-cols-[1fr_auto] gap-3">
                  <div>
                    <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.06em]" style={{ color: GRAY_500 }}>
                      Date
                    </span>
                    <div className="flex h-9 items-center rounded-[6px] border px-2.5 font-mono text-[12.5px]" style={{ borderColor: GRAY_200, color: INK }}>
                      {CALL_REPORT.date}
                    </div>
                  </div>
                  <div>
                    <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.06em]" style={{ color: GRAY_500 }}>
                      Dictée
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        fire('dictate')
                        fire('transcript')
                      }}
                      className="flex h-9 items-center gap-2.5 rounded-[6px] border px-3"
                      style={{ borderColor: dictating ? EMBER : GRAY_200, background: dictating ? EMBER_TINT : WHITE, color: INK }}
                      aria-pressed={dictating}
                      aria-label="Dicter le compte rendu"
                    >
                      <Mic size={15} aria-hidden="true" style={{ color: dictating ? EMBER : GRAY_600 }} />
                      <Waveform active={dictating} />
                    </button>
                  </div>
                </div>
                <div className="mt-3">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.06em]" style={{ color: GRAY_500 }}>
                    Compte rendu
                  </span>
                  <div role="textbox" aria-readonly="true" className="min-h-[112px] rounded-[6px] border px-3 py-2.5 text-[13px] leading-relaxed" style={{ borderColor: GRAY_200, color: INK }}>
                    <TypedText text={CALL_REPORT.transcript} active={fired('transcript')} cps={62} />
                  </div>
                </div>
                <button type="button" onClick={() => fire('checkbox')} className="mt-3 flex items-center gap-2 text-[13px]" style={{ color: INK }} aria-pressed={fired('checkbox')}>
                  {fired('checkbox') ? <SquareCheck size={18} aria-hidden="true" style={{ color: EMBER }} /> : <Square size={18} aria-hidden="true" style={{ color: GRAY_500 }} />}
                  L&rsquo;assistant en tire les actions
                </button>
                <div className="mt-4 flex items-center gap-3">
                  <AppButton
                    primary
                    disabled={saved}
                    onClick={() => {
                      fire('save')
                      fire('drawer')
                      fire('counter')
                    }}
                  >
                    <Save size={14} aria-hidden="true" />
                    Enregistrer dans la fiche
                  </AppButton>
                  <AnimatePresence>
                    {saved ? (
                      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="inline-flex items-center gap-1.5 text-[12.5px] font-medium" style={{ color: GOOD }}>
                        <Check size={14} aria-hidden="true" />
                        Rangé dans {CLIENT.name}, {CALL_REPORT.date}
                      </motion.span>
                    ) : null}
                  </AnimatePresence>
                </div>
              </Panel>
              <div className="relative overflow-hidden">
                <Panel title="Derniers comptes rendus" className="h-full">
                  <ul>
                    {RECENT.map((r) => (
                      <li key={r.date} className="border-t py-2.5 text-[13px]" style={{ borderColor: GRAY_200, color: INK }}>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[11.5px]" style={{ color: GRAY_500 }}>
                            {r.date}
                          </span>
                          <span className="font-medium">{r.client}</span>
                          <Chip tone="neutral">{r.type}</Chip>
                        </div>
                        <div className="mt-0.5 text-[12.5px]" style={{ color: GRAY_600 }}>
                          {r.text}
                        </div>
                      </li>
                    ))}
                  </ul>
                </Panel>
                <AnimatePresence>
                  {fired('drawer') ? (
                    <motion.aside
                      initial={{ x: '100%' }}
                      animate={{ x: 0 }}
                      exit={{ x: '100%' }}
                      transition={{ duration: 0.45, ease: EASE }}
                      className="absolute inset-y-0 right-0 w-[440px] overflow-hidden border-l"
                      style={{ borderColor: GRAY_200, background: WHITE, boxShadow: '-12px 0 32px rgba(10,10,10,0.08)' }}
                      aria-label={`Fiche client ${CLIENT.name}`}
                    >
                      <div className="border-b px-5 py-4" style={{ borderColor: GRAY_200 }}>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: GRAY_500 }}>
                          Fiche client
                        </div>
                        <h3 className="text-[18px] font-bold" style={{ color: INK }}>
                          {CLIENT.name}
                        </h3>
                        <div className="mt-0.5 font-mono text-[12px]" style={{ color: GRAY_600 }}>
                          {CLIENT.contact}, {CLIENT.phone}, dossier depuis {CLIENT.folderSince}
                        </div>
                      </div>
                      <div className="flex flex-col gap-4 px-5 py-4 text-[12.5px]" style={{ color: INK }}>
                        <section>
                          <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: GRAY_500 }}>
                            Historique
                          </h4>
                          <ul className="space-y-1.5">
                            {CLIENT_FILE.history.map((h) => (
                              <li key={h.date} className="flex gap-2.5 rounded-[6px] px-2 py-1.5" style={{ background: h.isNew ? EMBER_TINT : 'transparent' }}>
                                <span className="w-[74px] shrink-0 font-mono text-[11.5px]" style={{ color: h.isNew ? EMBER : GRAY_500 }}>
                                  {h.date}
                                </span>
                                <span style={{ color: GRAY_600 }}>{h.text}</span>
                              </li>
                            ))}
                          </ul>
                        </section>
                        <section>
                          <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: GRAY_500 }}>
                            Postes en cours
                          </h4>
                          <ul className="space-y-1">
                            {CLIENT_POSTES.map((p) => (
                              <li key={p.id} className="flex items-center gap-2">
                                <StageBadge stage={p.stage} />
                                <span>{p.title}</span>
                                <span className="ml-auto font-mono text-[11.5px]" style={{ color: WARN }}>
                                  {p.tags.due}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </section>
                        <section>
                          <h4 className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: GRAY_500 }}>
                            Procédures
                          </h4>
                          <ul className="list-disc space-y-0.5 pl-4" style={{ color: GRAY_600 }}>
                            {CLIENT_FILE.procedures.map((p) => (
                              <li key={p}>{p}</li>
                            ))}
                          </ul>
                        </section>
                        <section className="rounded-[6px] px-3 py-2" style={{ background: GOOD_TINT, color: GOOD }}>
                          Compte rendu enregistré. Tout ce que vous savez du client est au même endroit, lisible par l&rsquo;assistant.
                        </section>
                      </div>
                    </motion.aside>
                  ) : null}
                </AnimatePresence>
              </div>
            </div>
          </AppShell>
        </BrowserFrame>
      </ScaledStage>
    </div>
  )
}
