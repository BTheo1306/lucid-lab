'use client'

import { motion } from 'framer-motion'
import { Check, Eye, Paperclip, StickyNote, X } from 'lucide-react'

import { INBOX_STATS } from '@/lib/demo/atelier/inbox'
import { INBOX_CARDS_V2 } from '@/lib/demo/atelier-v2/data'
import type { InboxCard } from '@/lib/demo/atelier/types'

import { TypedText } from '../../atelier/chrome/TypedText'
import { useScene } from '../../atelier/player/SceneContext'
import { EASE, EMBER_700, GRAY_100, GRAY_200, GRAY_500, GRAY_600, INK, PAPER, WHITE } from '../../atelier/tokens'
import { Region } from '../chrome/Camera'
import { AppFrame, Button, Label, PosteLine, Status } from '../chrome/ui'

function target(card: InboxCard) {
  if (card.target === 'nouveau') return <Status highlight>Nouveau client</Status>
  if (card.target === 'fournisseur') return <Status>Fournisseur</Status>
  return <Status>{card.target.name}</Status>
}

function CardView({ card, index }: { card: InboxCard; index: number }) {
  const { fired } = useScene()
  const isFirst = index === 0
  const isSecond = index === 1
  const accepted = isFirst && fired('accept-1')
  const answered = isSecond && fired('answer-q2')
  const show = fired('cards')

  if (accepted) {
    return (
      <Region id="card-1" className="self-start">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5, ease: EASE }} className="flex items-center gap-3 rounded-[8px] border px-5 py-4 text-[15px] font-medium" style={{ borderColor: GRAY_200, background: PAPER, color: INK }}>
          <span className="flex h-6 w-6 items-center justify-center rounded-full" style={{ background: INK, color: WHITE }}>
            <Check size={13} aria-hidden="true" />
          </span>
          Poste créé sous Camping des Trois Chênes. Mail marqué lu.
        </motion.div>
      </Region>
    )
  }

  return (
    <Region id={`card-${index + 1}`}>
      <motion.article
        initial={false}
        animate={show ? { opacity: 1, y: 0 } : { opacity: 0, y: 12 }}
        transition={{ duration: 0.6, ease: EASE, delay: show ? index * 0.15 : 0 }}
        className="flex h-full flex-col gap-4 rounded-[8px] border p-5"
        style={{ borderColor: GRAY_200, background: WHITE }}
        aria-label={`Fiche : ${card.subject}`}
      >
        <header className="flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-[12px] font-bold" style={{ background: GRAY_100, color: INK }}>
            {card.senderInitials}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3">
              <span className="truncate text-[15.5px] font-semibold" style={{ color: INK }}>
                {card.sender}
              </span>
              <span className="inline-flex items-center gap-1 font-mono text-[12px]" style={{ color: GRAY_500 }}>
                <Paperclip size={12} aria-hidden="true" />
                {card.attachments}
              </span>
            </div>
            <div className="truncate text-[13.5px]" style={{ color: GRAY_600 }}>
              {card.subject}
            </div>
          </div>
        </header>
        <p className="text-[14px] leading-snug" style={{ color: GRAY_600 }}>
          {card.summary}
        </p>
        <Region id={isFirst ? 'card-1-line' : `card-${index + 1}-line`} className="rounded-[6px] px-4 py-3" style={{ background: PAPER }}>
          <Label>Poste proposé</Label>
          <div className="mt-1.5">
            <PosteLine line={card.proposedLine} />
          </div>
        </Region>
        <div className="flex flex-wrap items-center gap-3 text-[13px]" style={{ color: GRAY_600 }}>
          <span>Vers</span>
          {target(card)}
          {card.updatesPoste ? <span style={{ color: EMBER_700 }}>Met à jour le poste existant : {card.updatesPoste.label}</span> : null}
        </div>
        {card.openQuestion ? (
          <Region id="card-2-question" className="flex items-center gap-3 rounded-[6px] border px-4 py-3 text-[14px]" style={{ borderColor: GRAY_200, background: PAPER }}>
            <span className="font-semibold" style={{ color: EMBER_700 }}>
              {card.openQuestion.label}
            </span>
            <span className="flex h-9 min-w-[200px] flex-1 items-center rounded-[4px] border px-3" style={{ borderColor: GRAY_200, background: WHITE, color: INK }}>
              {answered ? <TypedText text={card.openQuestion.answer} active cps={14} showCaret={false} /> : <span style={{ color: GRAY_500 }}>Votre réponse</span>}
            </span>
          </Region>
        ) : null}
        <div className="mt-auto flex flex-wrap items-center gap-2 pt-1">
          <Button primary disabled={(Boolean(card.openQuestion) && !answered) || card.target === 'fournisseur'}>
            <Check size={14} aria-hidden="true" />
            Accepter
          </Button>
          <Button>
            <X size={14} aria-hidden="true" />
            Sans suite
          </Button>
          <Button>
            <StickyNote size={14} aria-hidden="true" />
            Note
          </Button>
          <Button>
            <Eye size={14} aria-hidden="true" />
            Voir le mail
          </Button>
        </div>
      </motion.article>
    </Region>
  )
}

export function BoiteScreen() {
  const { fired } = useScene()
  const remaining = INBOX_CARDS_V2.length - (fired('accept-1') ? 1 : 0)
  return (
    <AppFrame active="Boîte du matin" title="Boîte du matin" meta={`${INBOX_STATS.received} mails reçus cette nuit, ${INBOX_STATS.noise} écartés, ${remaining} fiches à décider`}>
      <div className="grid h-full grid-cols-2 grid-rows-2 gap-5">
        {INBOX_CARDS_V2.map((card, i) => (
          <CardView key={card.id} card={card} index={i} />
        ))}
      </div>
    </AppFrame>
  )
}
