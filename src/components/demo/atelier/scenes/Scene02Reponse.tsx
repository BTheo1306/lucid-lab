'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Bell, Check, Phone } from 'lucide-react'

import { ATELIER } from '@/lib/demo/atelier/identity'
import { AUTO_REPLY, OWNER_NOTIFICATION, PROSPECT_INBOX_ROWS } from '@/lib/demo/atelier/emails'
import { LEAD } from '@/lib/demo/atelier/lead'

import { BrowserFrame, PhoneFrame, ScaledStage } from '../chrome/DeviceFrame'
import { useScene } from '../player/SceneContext'
import { EASE, EMBER, GRAY_100, GRAY_200, GRAY_500, GRAY_600, INK, PAPER, WHITE } from '../tokens'

function EmailBody() {
  const { fired } = useScene()
  return (
    <div className="mx-auto max-w-[520px] overflow-hidden rounded-[8px] border" style={{ borderColor: GRAY_200, background: WHITE }}>
      <div className="flex items-center gap-2 px-6 py-4" style={{ background: INK, color: WHITE }}>
        <span className="flex h-7 w-7 items-center justify-center rounded-[6px] text-[11px] font-bold" style={{ background: WHITE, color: INK }}>
          AB
        </span>
        <span className="text-[13px] font-semibold tracking-[0.02em]">{ATELIER.name}</span>
      </div>
      <div className="px-6 py-5">
        {AUTO_REPLY.blocks.map((block, i) => {
          if (block.kind === 'heading')
            return (
              <h3 key={i} className="text-[22px] font-bold leading-tight" style={{ color: INK }}>
                {block.text}
              </h3>
            )
          if (block.kind === 'paragraph')
            return (
              <p key={i} className="mt-3 text-[13.5px] leading-relaxed" style={{ color: GRAY_600 }}>
                {block.text}
              </p>
            )
          if (block.kind === 'button')
            return (
              <div key={i} className="mt-4">
                <span className="inline-flex h-10 items-center gap-2 rounded-[6px] px-4 text-[13px] font-semibold" style={{ background: EMBER, color: WHITE }}>
                  <Phone size={14} aria-hidden="true" />
                  {block.text}
                </span>
              </div>
            )
          if (block.kind === 'benefits')
            return (
              <ul key={i} className="mt-5 grid grid-cols-2 gap-2">
                {block.items?.map((item, j) => (
                  <motion.li
                    key={item}
                    initial={false}
                    animate={fired('benefits') ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
                    transition={{ duration: 0.35, ease: EASE, delay: fired('benefits') ? j * 0.12 : 0 }}
                    className="flex items-start gap-2 rounded-[6px] px-3 py-2.5 text-[12.5px] leading-snug"
                    style={{ background: PAPER, color: INK }}
                  >
                    <Check size={14} aria-hidden="true" style={{ color: EMBER, marginTop: 2, flexShrink: 0 }} />
                    {item}
                  </motion.li>
                ))}
              </ul>
            )
          return (
            <p key={i} className="mt-5 text-[12px]" style={{ color: GRAY_500 }}>
              {block.text}
            </p>
          )
        })}
      </div>
    </div>
  )
}

export function Scene02Reponse() {
  const { fired } = useScene()
  const rowIn = fired('mail-row')
  const open = fired('mail-open')

  return (
    <div className="h-full">
      <ScaledStage width={1280} height={760}>
        <div className="flex items-start gap-10">
          <BrowserFrame url="webmail.example.org" width={860} height={720}>
            <div className="flex h-full">
              <div className="w-[290px] shrink-0 border-r" style={{ borderColor: GRAY_200, background: '#FAFAF8' }}>
                <div className="flex items-center justify-between px-4 py-3 text-[12px] font-semibold uppercase tracking-[0.08em]" style={{ color: GRAY_500 }}>
                  <span>Boîte de réception</span>
                  <span className="font-mono">{LEAD.email.split('@')[0]}</span>
                </div>
                <ul>
                  <AnimatePresence initial={false}>
                    {rowIn ? (
                      <motion.li
                        key="new"
                        initial={{ opacity: 0, y: -14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: EASE }}
                        className="border-b border-l-2 px-4 py-3"
                        style={{ borderColor: GRAY_200, borderLeftColor: EMBER, background: open ? WHITE : '#FAFAF8' }}
                      >
                        <div className="flex items-center justify-between text-[12.5px] font-bold" style={{ color: INK }}>
                          <span>{AUTO_REPLY.from.name}</span>
                          <span className="font-mono text-[11px] font-medium" style={{ color: EMBER }}>
                            08:02
                          </span>
                        </div>
                        <div className="mt-0.5 text-[12.5px] font-semibold" style={{ color: INK }}>
                          {AUTO_REPLY.subject}
                        </div>
                        <div className="mt-0.5 truncate text-[12px]" style={{ color: GRAY_500 }}>
                          {AUTO_REPLY.preview}
                        </div>
                      </motion.li>
                    ) : null}
                  </AnimatePresence>
                  {PROSPECT_INBOX_ROWS.map((row) => (
                    <li key={row.subject} className="border-b px-4 py-3" style={{ borderColor: GRAY_200 }}>
                      <div className="flex items-center justify-between text-[12.5px]" style={{ color: INK }}>
                        <span>{row.from}</span>
                        <span className="font-mono text-[11px]" style={{ color: GRAY_500 }}>
                          {row.time}
                        </span>
                      </div>
                      <div className="mt-0.5 truncate text-[12px]" style={{ color: GRAY_500 }}>
                        {row.subject}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="min-w-0 flex-1 overflow-hidden" style={{ background: GRAY_100 }}>
                <AnimatePresence mode="wait">
                  {open ? (
                    <motion.div key="open" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: EASE }} className="h-full overflow-hidden">
                      <div className="border-b px-6 py-3 text-[12px]" style={{ borderColor: GRAY_200, background: WHITE, color: GRAY_600 }}>
                        <div>
                          <span className="font-semibold" style={{ color: INK }}>
                            De :
                          </span>{' '}
                          {AUTO_REPLY.from.name} &lt;{AUTO_REPLY.from.address}&gt;
                        </div>
                        <div>
                          <span className="font-semibold" style={{ color: INK }}>
                            À :
                          </span>{' '}
                          {AUTO_REPLY.to.name} &lt;{AUTO_REPLY.to.address}&gt;
                        </div>
                      </div>
                      <div className="p-6">
                        <EmailBody />
                      </div>
                    </motion.div>
                  ) : (
                    <div key="empty" className="flex h-full items-center justify-center text-[13px]" style={{ color: GRAY_500 }}>
                      Sélectionnez un message
                    </div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </BrowserFrame>
          <PhoneFrame time="08:02" width={360} height={740} dark>
            <div className="flex h-full flex-col items-center px-4 pt-10" style={{ color: WHITE }}>
              <div className="text-[64px] font-semibold leading-none tracking-[-0.02em]">08:02</div>
              <div className="mt-2 text-[14px]" style={{ color: 'rgba(255,255,255,0.7)' }}>
                mercredi 9 septembre
              </div>
              <AnimatePresence>
                {fired('notif') ? (
                  <motion.div
                    initial={{ opacity: 0, y: -30, scale: 0.96 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.45, ease: EASE }}
                    className="mt-10 w-full rounded-[14px] p-3.5"
                    style={{ background: 'rgba(255,255,255,0.96)', color: INK }}
                  >
                    <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: GRAY_600 }}>
                      <span className="flex h-5 w-5 items-center justify-center rounded-[5px]" style={{ background: INK, color: WHITE }}>
                        <Bell size={11} aria-hidden="true" />
                      </span>
                      {OWNER_NOTIFICATION.app}
                      <span className="ml-auto font-mono font-medium normal-case tracking-normal">maintenant</span>
                    </div>
                    <div className="mt-2 text-[13.5px] font-bold leading-snug">{OWNER_NOTIFICATION.title}</div>
                    <motion.ul initial={false} animate={fired('notif-lines') ? { opacity: 1 } : { opacity: 0 }} transition={{ duration: 0.3 }} className="mt-1.5 space-y-0.5 text-[12.5px] leading-snug" style={{ color: GRAY_600 }}>
                      {OWNER_NOTIFICATION.lines.map((line) => (
                        <li key={line}>{line}</li>
                      ))}
                      <li className="pt-1 font-semibold" style={{ color: EMBER }}>
                        {OWNER_NOTIFICATION.link}
                      </li>
                    </motion.ul>
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </PhoneFrame>
        </div>
      </ScaledStage>
    </div>
  )
}
