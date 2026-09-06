'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Mail, Paperclip, Phone } from 'lucide-react'

import { EXISTING_LEADS, LEAD, LEAD_STAGE_LABEL, TRADE_LABEL } from '@/lib/demo/atelier/lead'

import { useScene } from '../../atelier/player/SceneContext'
import { EASE, GRAY_200, GRAY_500, GRAY_600, INK } from '../../atelier/tokens'
import { Region } from '../chrome/Camera'
import { AppFrame, Card, Status, TH } from '../chrome/ui'

function Actions({ phone }: { phone: string }) {
  return (
    <span className="inline-flex items-center gap-2 whitespace-nowrap">
      <span className="inline-flex h-8 items-center gap-2 rounded-[6px] border px-2.5 font-mono text-[13px]" style={{ borderColor: GRAY_200, color: INK }}>
        <Phone size={13} aria-hidden="true" />
        {phone}
      </span>
      <span className="inline-flex h-8 w-8 items-center justify-center rounded-[6px] border" style={{ borderColor: GRAY_200, color: INK }}>
        <Mail size={13} aria-hidden="true" />
      </span>
    </span>
  )
}

export function CrmScreen() {
  const { fired } = useScene()
  const rowIn = fired('row')
  const badges = fired('badges')
  return (
    <AppFrame active="Demandes" title="Demandes" meta={`${EXISTING_LEADS.length + (rowIn ? 1 : 0)} demandes en cours, formulaires du site et appels`}>
      <Region id="table">
        <Card>
          <table className="w-full border-collapse text-[15px]" style={{ color: INK }}>
            <thead>
              <tr style={{ color: GRAY_500 }}>
                <th className={TH}>Reçu</th>
                <th className={TH}>Contact</th>
                <th className={TH}>Métier</th>
                <th className={TH}>Résumé</th>
                <th className={TH}>Étape</th>
                <th className={TH}>Actions</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {rowIn ? (
                  <motion.tr
                    key="new"
                    data-region="new-row"
                    initial={{ opacity: 0, y: -8, backgroundColor: 'rgba(200,94,26,0.08)' }}
                    animate={{ opacity: 1, y: 0, backgroundColor: 'rgba(200,94,26,0)' }}
                    transition={{ duration: 0.6, ease: EASE, backgroundColor: { duration: 2.4, delay: 0.6 } }}
                    className="border-t"
                    style={{ borderColor: GRAY_200 }}
                  >
                    <td className="px-4 py-4 font-mono text-[13px] font-semibold" style={{ color: INK }}>
                      08:02
                    </td>
                    <td className="px-4 py-4 font-semibold">{LEAD.name}</td>
                    <td className="px-4 py-4">
                      <Status>{TRADE_LABEL[LEAD.trade]}</Status>
                    </td>
                    <td className="px-4 py-4" style={{ color: GRAY_600 }}>
                      {LEAD.windows} fenêtres, {LEAD.surfaceM2} m², {LEAD.address}
                      <span className="ml-3 inline-flex items-center gap-1.5 whitespace-nowrap font-mono text-[12.5px]" style={{ color: INK }}>
                        <Paperclip size={13} aria-hidden="true" />
                        {LEAD.attachment}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <Region id="stage" className="inline-block">
                        <motion.span initial={false} animate={badges ? { opacity: 1 } : { opacity: 0 }} transition={{ duration: 0.5 }} className="inline-flex">
                          <Status highlight>{LEAD_STAGE_LABEL['rdv-demande']}</Status>
                        </motion.span>
                      </Region>
                    </td>
                    <td className="px-4 py-4">
                      <Actions phone={LEAD.phone} />
                    </td>
                  </motion.tr>
                ) : null}
              </AnimatePresence>
              {EXISTING_LEADS.map((lead) => (
                <tr key={lead.id} className="border-t" style={{ borderColor: GRAY_200 }}>
                  <td className="px-4 py-4 font-mono text-[13px]" style={{ color: GRAY_500 }}>
                    {lead.receivedAt}
                  </td>
                  <td className="px-4 py-4 font-medium">{lead.name}</td>
                  <td className="px-4 py-4">
                    <Status>{TRADE_LABEL[lead.trade]}</Status>
                  </td>
                  <td className="px-4 py-4" style={{ color: GRAY_600 }}>
                    {lead.summary}
                  </td>
                  <td className="px-4 py-4">
                    <Status>{LEAD_STAGE_LABEL[lead.stage]}</Status>
                  </td>
                  <td className="px-4 py-4">
                    <Actions phone="06 39 98 00 00" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="border-t px-4 py-3 text-[13px]" style={{ borderColor: GRAY_200, color: GRAY_500 }}>
            L&rsquo;étape est posée automatiquement selon le formulaire : rendez-vous demandé pour un film solaire (relevé sur place), nouveau pour le reste.
          </p>
        </Card>
      </Region>
    </AppFrame>
  )
}
