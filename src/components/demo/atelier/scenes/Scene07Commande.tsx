'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Check, Mail, PackageCheck } from 'lucide-react'

import { SUPPLIER_DRAFT } from '@/lib/demo/atelier/emails'
import { groupeById } from '@/lib/demo/atelier/groupes'
import { ORDERED_SUPPLIER_ID, ORDER_EXPECTED_AT, SUPPLIERS, SUPPLIER_LINES, supplierById } from '@/lib/demo/atelier/suppliers'
import type { SupplierLine } from '@/lib/demo/atelier/types'

import { AppButton, AppShell, Panel } from '../app/AppShell'
import { Chip } from '../app/Chips'
import { BrowserFrame, ScaledStage } from '../chrome/DeviceFrame'
import { TypedText } from '../chrome/TypedText'
import { useScene } from '../player/SceneContext'
import { EASE, GOOD, GOOD_TINT, GRAY_100, GRAY_200, GRAY_500, GRAY_600, INK, LAB_BLUE, WHITE } from '../tokens'

function Line({ line, moved }: { line: SupplierLine; moved: boolean }) {
  const forName = line.forGroupeId ? groupeById(line.forGroupeId).name : null
  return (
    <li className="flex items-start gap-2.5 border-t py-1.5 text-[12.5px]" style={{ borderColor: GRAY_200, color: line.probable ? LAB_BLUE : INK, opacity: moved ? 0.45 : 1 }}>
      <span className="mt-[3px] inline-block h-3.5 w-3.5 shrink-0 rounded-[3px] border" style={{ borderColor: line.probable ? LAB_BLUE : GRAY_500, background: moved ? INK : WHITE }} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium">{line.label}</span>
          <span className="font-mono text-[12px]" style={{ color: line.probable ? LAB_BLUE : GRAY_600 }}>
            × {line.qty}
          </span>
          {line.probable ? <Chip tone="neutral">probable, à confirmer</Chip> : null}
        </div>
        {forName ? (
          <div className="text-[11.5px]" style={{ color: line.probable ? LAB_BLUE : GRAY_500 }}>
            pour {forName}
          </div>
        ) : null}
      </div>
    </li>
  )
}

export function Scene07Commande() {
  const { fired, fire } = useScene()
  const clicked = fired('click')
  const moved = fired('move')
  const toOrder = SUPPLIER_LINES.filter((l) => l.status === 'a-commander')
  const waiting = SUPPLIER_LINES.filter((l) => l.status === 'en-attente-livraison')
  const movedLines = toOrder.filter((l) => l.supplierId === ORDERED_SUPPLIER_ID && !l.probable)
  const ordered = supplierById(ORDERED_SUPPLIER_ID)

  const draftFirst = [SUPPLIER_DRAFT.greeting, '', SUPPLIER_DRAFT.intro, ...SUPPLIER_DRAFT.firmLines].join('\n')
  const draftProbable = SUPPLIER_DRAFT.probableLines.map((l) => `${l.text}   (pour ${l.forGroupe})`).join('\n')
  const draftLast = ['', SUPPLIER_DRAFT.outro, SUPPLIER_DRAFT.closing, SUPPLIER_DRAFT.signature].join('\n')

  return (
    <div className="h-full">
      <ScaledStage width={1280} height={800}>
        <BrowserFrame url="app.atelier-briere.example/commandes">
          <AppShell active="commandes" counters={{ commandes: toOrder.length, journee: 6 }} title="Commandes fournisseurs" subtitle="Liste d'achats groupée par fournisseur, suivi des livraisons">
            <div className="grid h-full grid-cols-[1fr_1fr] gap-4">
              <div className="flex min-h-0 flex-col gap-4">
                <Panel title="À commander">
                  {SUPPLIERS.map((s, si) => {
                    const lines = toOrder.filter((l) => l.supplierId === s.id && !(moved && !l.probable && s.id === ORDERED_SUPPLIER_ID))
                    if (lines.length === 0) return null
                    const isTarget = s.id === ORDERED_SUPPLIER_ID
                    return (
                      <motion.section key={s.id} initial={false} animate={fired('list') ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }} transition={{ duration: 0.35, ease: EASE, delay: fired('list') ? si * 0.12 : 0 }} className="mb-2">
                        <header className="flex items-center justify-between pb-1">
                          <div>
                            <span className="text-[13.5px] font-bold" style={{ color: INK }}>
                              {s.name}
                            </span>
                            <span className="ml-2 font-mono text-[11.5px]" style={{ color: GRAY_500 }}>
                              {s.contactFirstName}, {s.email}
                            </span>
                          </div>
                          {isTarget ? (
                            <AppButton small primary={!clicked} disabled={clicked} onClick={() => fire('click')}>
                              <Mail size={13} aria-hidden="true" />
                              {clicked ? 'Brouillon préparé' : 'Préparer la commande'}
                            </AppButton>
                          ) : (
                            <AppButton small>
                              <Mail size={13} aria-hidden="true" />
                              Préparer
                            </AppButton>
                          )}
                        </header>
                        <ul>
                          {lines.map((l) => (
                            <Line key={l.id} line={l} moved={false} />
                          ))}
                        </ul>
                      </motion.section>
                    )
                  })}
                </Panel>
                <Panel title="En attente de livraison" className="min-h-0 flex-1 overflow-hidden">
                  <AnimatePresence initial={false}>
                    {moved ? (
                      <motion.section key="moved" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }} className="mb-2">
                        <header className="flex items-center gap-2 pb-1 text-[13px] font-semibold" style={{ color: INK }}>
                          <PackageCheck size={15} aria-hidden="true" style={{ color: GOOD }} />
                          {ordered.name}, commande du 09/09, prévu le {ORDER_EXPECTED_AT}
                        </header>
                        <ul>
                          {movedLines.map((l) => (
                            <Line key={l.id} line={{ ...l, probable: false }} moved />
                          ))}
                        </ul>
                      </motion.section>
                    ) : null}
                  </AnimatePresence>
                  {waiting.map((l) => (
                    <section key={l.id}>
                      <header className="pb-1 text-[13px] font-semibold" style={{ color: INK }}>
                        {supplierById(l.supplierId).name}, prévu le {l.expectedAt}
                      </header>
                      <ul>
                        <Line line={l} moved />
                      </ul>
                    </section>
                  ))}
                </Panel>
              </div>
              <div className="min-h-0">
                <AnimatePresence mode="wait">
                  {fired('draft') ? (
                    <motion.div key="draft" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }} className="flex h-full flex-col rounded-[8px] border" style={{ borderColor: GRAY_200, background: WHITE }}>
                      <div className="border-b px-4 py-3 text-[12.5px]" style={{ borderColor: GRAY_200, color: GRAY_600 }}>
                        <div className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: GRAY_500 }}>
                          Brouillon de commande, dans votre style
                        </div>
                        <div className="mt-1">
                          <span className="font-semibold" style={{ color: INK }}>
                            À :
                          </span>{' '}
                          {SUPPLIER_DRAFT.to}
                        </div>
                        <div>
                          <span className="font-semibold" style={{ color: INK }}>
                            Objet :
                          </span>{' '}
                          {SUPPLIER_DRAFT.subject}
                        </div>
                      </div>
                      <div className="flex-1 whitespace-pre-line px-4 py-3 font-mono text-[13px] leading-[1.6]" style={{ color: INK }}>
                        <TypedText text={draftFirst} active={fired('draft')} cps={48} showCaret={!fired('probable')} />
                        {fired('probable') ? (
                          <>
                            {'\n'}
                            <span style={{ color: LAB_BLUE }}>
                              <TypedText text={draftProbable} active cps={48} className="font-semibold" showCaret={false} />
                            </span>
                            <TypedText text={draftLast} active cps={48} delayMs={1000} />
                          </>
                        ) : null}
                      </div>
                      <div className="border-t px-4 py-2.5 text-[12px]" style={{ borderColor: GRAY_200, background: GRAY_100, color: GRAY_600 }}>
                        <span className="font-semibold" style={{ color: LAB_BLUE }}>
                          En bleu
                        </span>{' '}
                        : ligne probable, à confirmer. Le nom du client entre parenthèses est pour vous : à retirer avant l&rsquo;envoi, le fournisseur n&rsquo;a pas à le connaître.
                      </div>
                      <AnimatePresence>
                        {fired('result') ? (
                          <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, ease: EASE }} className="flex items-center gap-2 border-t px-4 py-3 text-[13px] font-medium" style={{ borderColor: '#BBE5C8', background: GOOD_TINT, color: GOOD }}>
                            <Check size={15} aria-hidden="true" />
                            Brouillon créé dans votre messagerie. Jamais envoyé sans vous.
                          </motion.div>
                        ) : null}
                      </AnimatePresence>
                    </motion.div>
                  ) : (
                    <div key="empty" className="flex h-full items-center justify-center rounded-[8px] border border-dashed text-[13px]" style={{ borderColor: GRAY_200, color: GRAY_500 }}>
                      Le brouillon apparaît ici
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </AppShell>
        </BrowserFrame>
      </ScaledStage>
    </div>
  )
}
