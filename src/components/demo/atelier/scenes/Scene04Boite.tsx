'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Check, Eye, Forward, Paperclip, StickyNote, X } from 'lucide-react'

import { INBOX_CARDS, INBOX_STATS } from '@/lib/demo/atelier/inbox'
import { EXISTING_LEADS } from '@/lib/demo/atelier/lead'
import type { InboxCard } from '@/lib/demo/atelier/types'

import { AppButton, AppShell } from '../app/AppShell'
import { Chip, TagLine } from '../app/Chips'
import { BrowserFrame, ScaledStage } from '../chrome/DeviceFrame'
import { Toasts, type ToastItem } from '../chrome/Toasts'
import { TypedText } from '../chrome/TypedText'
import { useScene } from '../player/SceneContext'
import { EASE, GOOD, GOOD_TINT, GRAY_100, GRAY_200, GRAY_500, GRAY_600, INK, LAB_BLUE, WARN, WARN_TINT, WHITE } from '../tokens'

const ACCEPT_STEP: Record<string, string> = { 'card-camping': 'accept-1' }
const FORWARD_STEP: Record<string, string> = { 'card-garage': 'forward-3' }
const ANSWER_STEP: Record<string, string> = { 'card-association': 'answer-q2' }

const DISMISS_SECONDS = 5

function Countdown({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  useEffect(() => {
    const t = window.setTimeout(onDone, DISMISS_SECONDS * 1000)
    return () => window.clearTimeout(t)
  }, [onDone])
  return (
    <div className="flex items-center gap-3 rounded-[6px] border px-3 py-2 text-[12px]" style={{ borderColor: GRAY_200, background: GRAY_100, color: GRAY_600 }}>
      <span className="relative h-1.5 flex-1 overflow-hidden rounded-full" style={{ background: GRAY_200 }} aria-hidden="true">
        <motion.span initial={{ width: '100%' }} animate={{ width: '0%' }} transition={{ duration: DISMISS_SECONDS, ease: 'linear' }} className="absolute inset-y-0 left-0 rounded-full" style={{ background: INK }} />
      </span>
      <span>Sans suite dans {DISMISS_SECONDS} s</span>
      <button type="button" onClick={onCancel} className="font-semibold underline underline-offset-2" style={{ color: INK }}>
        Annuler
      </button>
    </div>
  )
}

function targetChip(card: InboxCard) {
  if (card.target === 'nouveau') return <Chip tone="ember">NOUVEAU</Chip>
  if (card.target === 'fournisseur') return <Chip tone="neutral">Fournisseur</Chip>
  return <Chip tone="ink">{card.target.name}</Chip>
}

interface CardViewProps {
  card: InboxCard
  index: number
  dismissing: boolean
  onDismissStart: () => void
  onDismissCancel: () => void
  onDismissDone: () => void
}

function CardView({ card, index, dismissing, onDismissStart, onDismissCancel, onDismissDone }: CardViewProps) {
  const { fired, fire } = useScene()
  const acceptStep = ACCEPT_STEP[card.id]
  const forwardStep = FORWARD_STEP[card.id]
  const answerStep = ANSWER_STEP[card.id]
  const accepted = acceptStep ? fired(acceptStep) : false
  const forwarded = forwardStep ? fired(forwardStep) : false
  const answered = answerStep ? fired(answerStep) : false
  const needsAnswer = Boolean(card.openQuestion) && !answered
  const visible = fired('cards')

  if (accepted) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, ease: EASE }}
        className="flex items-center gap-2.5 self-start rounded-[8px] border px-4 py-3 text-[13px] font-medium"
        style={{ borderColor: '#BBE5C8', background: GOOD_TINT, color: GOOD }}
      >
        <Check size={15} aria-hidden="true" />
        Poste créé sous {card.target !== 'nouveau' && card.target !== 'fournisseur' ? card.target.name : 'un nouveau client'}. Mail marqué lu.
      </motion.div>
    )
  }

  return (
    <motion.article
      layout
      initial={false}
      animate={visible ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
      transition={{ duration: 0.4, ease: EASE, delay: visible ? index * 0.1 : 0 }}
      className="flex min-h-0 flex-col gap-2 overflow-hidden rounded-[8px] border p-3"
      style={{ borderColor: GRAY_200, background: WHITE }}
      aria-label={`Fiche : ${card.subject}`}
    >
      {forwarded ? (
        <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2 rounded-[6px] px-2.5 py-1.5 text-[12px] font-medium" style={{ background: GOOD_TINT, color: GOOD }}>
          <Check size={13} aria-hidden="true" />
          Transmis à Léa avec {card.attachments} pièces jointes. Mail marqué lu.
        </motion.div>
      ) : null}
      <header className="flex items-start gap-2.5">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[11px] font-bold" style={{ background: GRAY_100, color: INK }}>
          {card.senderInitials}
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="truncate text-[13px] font-semibold" style={{ color: INK }}>
              {card.sender}
            </span>
            <span className="inline-flex items-center gap-1 font-mono text-[11px]" style={{ color: GRAY_500 }}>
              <Paperclip size={11} aria-hidden="true" />
              {card.attachments}
            </span>
          </div>
          <div className="truncate text-[12.5px]" style={{ color: GRAY_600 }}>
            {card.subject}
          </div>
        </div>
      </header>
      <p className="text-[12px] leading-snug" style={{ color: GRAY_600 }}>
        {card.summary}
      </p>
      <div className="rounded-[6px] px-2.5 py-2" style={{ background: GRAY_100 }}>
        <div className="mb-1 text-[10.5px] font-semibold uppercase tracking-[0.08em]" style={{ color: GRAY_500 }}>
          Poste proposé
        </div>
        <TagLine line={card.proposedLine} />
      </div>
      <div className="flex flex-wrap items-center gap-2 text-[12px]" style={{ color: GRAY_600 }}>
        <span>Vers</span>
        {targetChip(card)}
        {card.updatesPoste ? (
          <span className="font-medium" style={{ color: LAB_BLUE }}>
            Met à jour le poste existant : {card.updatesPoste.label}
          </span>
        ) : null}
      </div>
      {card.openQuestion ? (
        <div className="flex items-center gap-2 rounded-[6px] border px-2.5 py-2 text-[12.5px]" style={{ borderColor: '#F5D9A8', background: WARN_TINT }}>
          <span className="font-semibold" style={{ color: WARN }}>
            {card.openQuestion.label}
          </span>
          <button
            type="button"
            onClick={() => answerStep && fire(answerStep)}
            className="flex h-7 min-w-[140px] flex-1 items-center rounded-[4px] border px-2 text-left"
            style={{ borderColor: answered ? GRAY_200 : '#F5D9A8', background: WHITE, color: INK }}
            aria-label={answered ? 'Réponse saisie' : 'Répondre à la question'}
          >
            {answered ? <TypedText text={card.openQuestion.answer} active cps={22} /> : <span style={{ color: GRAY_500 }}>Votre réponse</span>}
          </button>
        </div>
      ) : null}
      {dismissing ? (
        <Countdown onDone={onDismissDone} onCancel={onDismissCancel} />
      ) : (
        <div className="mt-auto flex flex-wrap items-center gap-1.5">
          <AppButton primary small disabled={needsAnswer || card.target === 'fournisseur'} onClick={() => acceptStep && fire(acceptStep)}>
            <Check size={13} aria-hidden="true" />
            Accepter
          </AppButton>
          <AppButton small onClick={onDismissStart}>
            <X size={13} aria-hidden="true" />
            Sans suite
          </AppButton>
          <AppButton small>
            <StickyNote size={13} aria-hidden="true" />
            Note
          </AppButton>
          <AppButton small disabled={forwarded} onClick={() => forwardStep && fire(forwardStep)}>
            <Forward size={13} aria-hidden="true" />
            Envoyer à Léa
          </AppButton>
          <AppButton small>
            <Eye size={13} aria-hidden="true" />
            Voir le mail
          </AppButton>
        </div>
      )}
    </motion.article>
  )
}

export function Scene04Boite() {
  const { fired } = useScene()
  const [dismissing, setDismissing] = useState<string | null>(null)
  const [dismissed, setDismissed] = useState<string[]>([])

  const acceptedCount = Object.values(ACCEPT_STEP).filter((s) => fired(s)).length
  const forwardedCount = Object.values(FORWARD_STEP).filter((s) => fired(s)).length
  const readCount = acceptedCount + forwardedCount + dismissed.length
  const remaining = INBOX_CARDS.length - acceptedCount - dismissed.length

  const toasts: ToastItem[] = []
  if (fired('accept-1')) toasts.push({ id: 'accept-1', text: 'Poste créé sous Camping des Trois Chênes. Mail marqué lu.' })
  if (fired('forward-3')) toasts.push({ id: 'forward-3', text: 'Transmis à Léa avec 2 pièces jointes. Mail marqué lu.' })
  dismissed.forEach((id) => toasts.push({ id: `dismiss-${id}`, text: 'Sans suite. Votre note est archivée dans la fiche. Mail marqué lu.' }))

  return (
    <div className="h-full">
      <ScaledStage width={1280} height={800}>
        <BrowserFrame url="app.atelier-briere.example/boite">
          <AppShell
            active="boite"
            counters={{ boite: remaining, demandes: EXISTING_LEADS.length + 1 }}
            title="Boîte du matin"
            subtitle={`${INBOX_STATS.received} mails reçus cette nuit, ${INBOX_STATS.noise} écartés (publicité, notifications), ${INBOX_STATS.cards} fiches à décider`}
            headerRight={
              <AnimatePresence>
                {fired('read-badges') && readCount > 0 ? (
                  <motion.span initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.3, ease: EASE }}>
                    <Chip tone="good">
                      {readCount} {readCount > 1 ? 'mails marqués lus' : 'mail marqué lu'}
                    </Chip>
                  </motion.span>
                ) : null}
              </AnimatePresence>
            }
          >
            <div className="grid h-full grid-cols-2 grid-rows-2 gap-3">
              {INBOX_CARDS.filter((c) => !dismissed.includes(c.id)).map((card, index) => (
                <CardView
                  key={card.id}
                  card={card}
                  index={index}
                  dismissing={dismissing === card.id}
                  onDismissStart={() => setDismissing(card.id)}
                  onDismissCancel={() => setDismissing(null)}
                  onDismissDone={() => {
                    setDismissing(null)
                    setDismissed((d) => (d.includes(card.id) ? d : [...d, card.id]))
                  }}
                />
              ))}
            </div>
            <Toasts items={toasts} />
          </AppShell>
        </BrowserFrame>
      </ScaledStage>
    </div>
  )
}
