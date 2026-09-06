'use client'

import { motion } from 'framer-motion'
import { Bell, Check, Phone } from 'lucide-react'

import { ATELIER } from '@/lib/demo/atelier/identity'
import { AUTO_REPLY, OWNER_NOTIFICATION } from '@/lib/demo/atelier/emails'

import { useScene } from '../../atelier/player/SceneContext'
import { EASE, EMBER, GRAY_200, GRAY_500, GRAY_600, INK, PAPER, WHITE } from '../../atelier/tokens'
import { Region } from '../chrome/Camera'
import { Label, Rise } from '../chrome/ui'

export function ReponseScreen() {
  const { fired } = useScene()
  const blocks = AUTO_REPLY.blocks

  return (
    <div className="grid h-full w-full grid-cols-[1fr_400px] gap-12 px-14 py-10" style={{ background: PAPER, color: INK }}>
      <Rise show={fired('mail')} className="flex flex-col">
        <div className="mb-3 flex items-center justify-between">
          <Label>Email reçu par le prospect</Label>
          <span className="font-mono text-[12px]" style={{ color: GRAY_500 }}>
            08:02, quelques secondes après l&rsquo;envoi
          </span>
        </div>
        <Region id="mail" className="flex-1 overflow-hidden rounded-[8px] border" style={{ borderColor: GRAY_200, background: WHITE }}>
          <div className="border-b px-8 py-4 text-[13px]" style={{ borderColor: GRAY_200, color: GRAY_600 }}>
            <div>
              <span className="font-semibold" style={{ color: INK }}>
                De :
              </span>{' '}
              {AUTO_REPLY.from.name} &lt;{AUTO_REPLY.from.address}&gt;
            </div>
            <div>
              <span className="font-semibold" style={{ color: INK }}>
                Objet :
              </span>{' '}
              {AUTO_REPLY.subject}
            </div>
          </div>
          <div className="px-8 py-7">
            <div className="flex items-center gap-2.5">
              <span className="flex h-7 w-7 items-center justify-center rounded-[5px] text-[11px] font-bold" style={{ background: INK, color: WHITE }}>
                AB
              </span>
              <span className="text-[13px] font-semibold tracking-[0.02em]">{ATELIER.name}</span>
            </div>
            {blocks.map((b, i) => {
              if (b.kind === 'heading')
                return (
                  <h3 key={i} className="mt-6 text-[26px] font-bold leading-tight tracking-[-0.01em]">
                    {b.text}
                  </h3>
                )
              if (b.kind === 'paragraph')
                return (
                  <p key={i} className="mt-4 max-w-[64ch] text-[15px] leading-[1.65]" style={{ color: GRAY_600 }}>
                    {b.text}
                  </p>
                )
              if (b.kind === 'button')
                return (
                  <Region key={i} id="mail-cta" className="mt-6 inline-block">
                    <Rise show={fired('mail-cta')}>
                      <span className="inline-flex h-11 items-center gap-2.5 rounded-[6px] px-5 text-[14px] font-semibold" style={{ background: EMBER, color: WHITE }}>
                        <Phone size={15} aria-hidden="true" />
                        {b.text}
                      </span>
                    </Rise>
                  </Region>
                )
              if (b.kind === 'benefits')
                return (
                  <Region key={i} id="mail-benefits" className="mt-7">
                    <ul className="grid grid-cols-2 gap-3">
                      {b.items?.map((item, j) => (
                        <motion.li
                          key={item}
                          initial={false}
                          animate={fired('benefits') ? { opacity: 1, y: 0 } : { opacity: 0, y: 8 }}
                          transition={{ duration: 0.5, ease: EASE, delay: fired('benefits') ? j * 0.18 : 0 }}
                          className="flex items-start gap-3 rounded-[6px] border px-4 py-3 text-[14px] leading-snug"
                          style={{ borderColor: GRAY_200, background: PAPER }}
                        >
                          <Check size={15} aria-hidden="true" style={{ color: EMBER, marginTop: 2, flexShrink: 0 }} />
                          {item}
                        </motion.li>
                      ))}
                    </ul>
                  </Region>
                )
              return (
                <p key={i} className="mt-7 text-[13px]" style={{ color: GRAY_500 }}>
                  {b.text}
                </p>
              )
            })}
          </div>
        </Region>
      </Rise>
      <div className="flex flex-col">
        <div className="mb-3">
          <Label>Téléphone de la dirigeante</Label>
        </div>
        <Region id="notif">
          <Rise show={fired('notif')}>
            <div className="rounded-[8px] border p-6" style={{ borderColor: GRAY_200, background: WHITE }}>
              <div className="flex items-center gap-2.5">
                <span className="flex h-6 w-6 items-center justify-center rounded-[5px]" style={{ background: INK, color: WHITE }}>
                  <Bell size={12} aria-hidden="true" />
                </span>
                <Label tone="ink">{OWNER_NOTIFICATION.app}</Label>
                <span className="ml-auto font-mono text-[12px]" style={{ color: GRAY_500 }}>
                  maintenant
                </span>
              </div>
              <div className="mt-4 text-[18px] font-bold leading-snug">{OWNER_NOTIFICATION.title}</div>
              <ul className="mt-3 space-y-1.5 text-[14px] leading-snug" style={{ color: GRAY_600 }}>
                {OWNER_NOTIFICATION.lines.map((l) => (
                  <li key={l}>{l}</li>
                ))}
              </ul>
              <div className="mt-5 text-[14px] font-semibold" style={{ color: EMBER }}>
                {OWNER_NOTIFICATION.link}
              </div>
            </div>
          </Rise>
        </Region>
        <Rise show={fired('notif')} delay={0.3} className="mt-6">
          <p className="text-[14px] leading-relaxed" style={{ color: GRAY_600 }}>
            Le même contenu, structuré, pour décider en un regard : quoi, où, combien, avec la photo. Rien à ressaisir, rien à chercher dans la boîte mail.
          </p>
        </Rise>
      </div>
    </div>
  )
}
