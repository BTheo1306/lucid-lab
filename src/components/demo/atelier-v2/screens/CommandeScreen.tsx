'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Check, Mail } from 'lucide-react'

import { SUPPLIER_DRAFT } from '@/lib/demo/atelier/emails'
import { groupeById } from '@/lib/demo/atelier/groupes'
import { ORDERED_SUPPLIER_ID, SUPPLIERS, SUPPLIER_LINES, supplierById } from '@/lib/demo/atelier/suppliers'
import type { SupplierLine } from '@/lib/demo/atelier/types'

import { TypedText } from '../../atelier/chrome/TypedText'
import { useScene } from '../../atelier/player/SceneContext'
import { EASE, EMBER_700, GRAY_200, GRAY_500, GRAY_600, INK, PAPER, WHITE } from '../../atelier/tokens'
import { Region } from '../chrome/Camera'
import { AppFrame, Button, Card, Label, Status } from '../chrome/ui'

function Line({ line }: { line: SupplierLine }) {
  const forName = line.forGroupeId ? groupeById(line.forGroupeId).name : null
  return (
    <li className="flex items-start gap-3 border-t py-2.5 text-[15px]" style={{ borderColor: GRAY_200, color: INK }}>
      <span className="mt-[5px] inline-block h-3.5 w-3.5 shrink-0 rounded-[3px] border" style={{ borderColor: line.probable ? EMBER_700 : GRAY_500 }} aria-hidden="true" />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-3">
          <span className="font-medium" style={{ color: line.probable ? EMBER_700 : INK }}>
            {line.label}
          </span>
          <span className="font-mono text-[13px]" style={{ color: GRAY_600 }}>
            × {line.qty}
          </span>
          {line.probable ? <Status highlight>à confirmer</Status> : null}
        </div>
        {forName ? (
          <div className="text-[13px]" style={{ color: GRAY_500 }}>
            pour {forName}
          </div>
        ) : null}
      </div>
    </li>
  )
}

export function CommandeScreen() {
  const { fired } = useScene()
  const clicked = fired('click')
  const toOrder = SUPPLIER_LINES.filter((l) => l.status === 'a-commander')
  const waiting = SUPPLIER_LINES.filter((l) => l.status === 'en-attente-livraison')
  const draftFirst = [SUPPLIER_DRAFT.greeting, '', SUPPLIER_DRAFT.intro, ...SUPPLIER_DRAFT.firmLines].join('\n')
  const draftProbable = SUPPLIER_DRAFT.probableLines.map((l) => `${l.text}   (pour ${l.forGroupe})`).join('\n')
  const draftLast = ['', SUPPLIER_DRAFT.outro, SUPPLIER_DRAFT.closing, SUPPLIER_DRAFT.signature].join('\n')

  return (
    <AppFrame active="Commandes" title="Commandes fournisseurs" meta="Liste d'achats groupée par fournisseur, suivi des livraisons">
      <div className="grid h-full grid-cols-[1fr_1fr] gap-6">
        <div className="flex min-h-0 flex-col gap-5">
          <Region id="list-achats">
            <Card className="p-6">
              <h3 className="text-[18px] font-bold">À commander</h3>
              {SUPPLIERS.map((s, si) => {
                const lines = toOrder.filter((l) => l.supplierId === s.id)
                const isTarget = s.id === ORDERED_SUPPLIER_ID
                return (
                  <motion.section key={s.id} initial={false} animate={fired('list') ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }} transition={{ duration: 0.5, ease: EASE, delay: fired('list') ? si * 0.18 : 0 }} className="mt-4">
                    <header className="flex items-center justify-between pb-1.5">
                      <div className="flex items-baseline gap-3">
                        <span className="text-[15.5px] font-bold">{s.name}</span>
                        <span className="font-mono text-[12.5px]" style={{ color: GRAY_500 }}>
                          {s.contactFirstName}, {s.email}
                        </span>
                      </div>
                      {isTarget ? (
                        <Button primary={!clicked} pressed={false} disabled={clicked}>
                          <Mail size={14} aria-hidden="true" />
                          {clicked ? 'Brouillon préparé' : 'Préparer la commande'}
                        </Button>
                      ) : (
                        <Button>
                          <Mail size={14} aria-hidden="true" />
                          Préparer
                        </Button>
                      )}
                    </header>
                    <ul>
                      {lines.map((l) => (
                        <Line key={l.id} line={l} />
                      ))}
                    </ul>
                  </motion.section>
                )
              })}
            </Card>
          </Region>
          <Card className="min-h-0 flex-1 overflow-hidden p-6">
            <h3 className="text-[18px] font-bold">En attente de livraison</h3>
            {waiting.map((l) => (
              <section key={l.id} className="mt-3">
                <div className="text-[14px] font-semibold">
                  {supplierById(l.supplierId).name}, prévu le {l.expectedAt}
                </div>
                <ul>
                  <Line line={l} />
                </ul>
              </section>
            ))}
          </Card>
        </div>
        <Region id="draft" className="min-h-0">
          <AnimatePresence mode="wait">
            {fired('draft') ? (
              <motion.div key="draft" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }} className="flex h-full flex-col rounded-[8px] border" style={{ borderColor: GRAY_200, background: WHITE }}>
                <div className="border-b px-6 py-4 text-[14px]" style={{ borderColor: GRAY_200, color: GRAY_600 }}>
                  <Label>Brouillon de commande, dans le style de la dirigeante</Label>
                  <div className="mt-2">
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
                <div className="flex-1 whitespace-pre-line px-6 py-5 font-mono text-[15px] leading-[1.7]" style={{ color: INK }}>
                  <TypedText text={draftFirst} active={fired('draft')} cps={44} showCaret={false} />
                  {fired('probable') ? (
                    <>
                      {'\n'}
                      <Region id="draft-probable" className="inline-block">
                        <span style={{ color: EMBER_700 }} className="font-semibold">
                          <TypedText text={draftProbable} active cps={44} showCaret={false} />
                        </span>
                      </Region>
                      <TypedText text={draftLast} active cps={44} delayMs={1200} showCaret={false} />
                    </>
                  ) : null}
                </div>
                <div className="border-t px-6 py-3 text-[13px]" style={{ borderColor: GRAY_200, background: PAPER, color: GRAY_600 }}>
                  <span className="font-semibold" style={{ color: EMBER_700 }}>
                    En couleur
                  </span>{' '}
                  : ligne probable, à confirmer. Le nom du client entre parenthèses est pour la dirigeante, à retirer avant l&rsquo;envoi.
                </div>
                <Region id="result">
                  <AnimatePresence>
                    {fired('result') ? (
                      <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }} className="flex items-center gap-3 border-t px-6 py-4 text-[15px] font-medium" style={{ borderColor: GRAY_200, color: INK }}>
                        <span className="flex h-6 w-6 items-center justify-center rounded-full" style={{ background: INK, color: WHITE }}>
                          <Check size={13} aria-hidden="true" />
                        </span>
                        Brouillon créé dans la messagerie de l&rsquo;atelier. Jamais envoyé sans relecture.
                      </motion.div>
                    ) : null}
                  </AnimatePresence>
                </Region>
              </motion.div>
            ) : (
              <div key="empty" className="flex h-full items-center justify-center rounded-[8px] border border-dashed text-[14px]" style={{ borderColor: GRAY_200, color: GRAY_500 }}>
                Le brouillon apparaît ici
              </div>
            )}
          </AnimatePresence>
        </Region>
      </div>
    </AppFrame>
  )
}
