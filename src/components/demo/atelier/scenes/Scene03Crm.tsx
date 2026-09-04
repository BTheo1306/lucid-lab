'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Mail, Paperclip, Phone } from 'lucide-react'

import { EXISTING_LEADS, LEAD, LEAD_STAGE_LABEL } from '@/lib/demo/atelier/lead'
import { INBOX_CARDS } from '@/lib/demo/atelier/inbox'

import { AppShell, Panel } from '../app/AppShell'
import { Chip, LeadStageBadge, TradeBadge } from '../app/Chips'
import { BrowserFrame, ScaledStage } from '../chrome/DeviceFrame'
import { useScene } from '../player/SceneContext'
import { EASE, EMBER, GRAY_200, GRAY_500, GRAY_600, INK } from '../tokens'

const TH = 'px-3 py-2 text-left text-[11px] font-semibold uppercase tracking-[0.08em]'

function ActionIcons({ phone, email }: { phone: string; email: string }) {
  return (
    <div className="flex items-center gap-1.5 whitespace-nowrap">
      <span className="inline-flex h-7 items-center gap-1.5 whitespace-nowrap rounded-[6px] border px-2 font-mono text-[11.5px]" style={{ borderColor: GRAY_200, color: INK }} title={`Appeler ${phone}`}>
        <Phone size={12} aria-hidden="true" />
        {phone}
      </span>
      <span className="inline-flex h-7 w-7 items-center justify-center rounded-[6px] border" style={{ borderColor: GRAY_200, color: INK }} title={`Écrire à ${email}`}>
        <Mail size={12} aria-hidden="true" />
      </span>
    </div>
  )
}

export function Scene03Crm() {
  const { fired } = useScene()
  const rowIn = fired('row')
  const badges = fired('badges')
  const demandes = fired('counter') ? EXISTING_LEADS.length + 1 : EXISTING_LEADS.length

  return (
    <div className="h-full">
      <ScaledStage width={1280} height={800}>
        <BrowserFrame url="app.atelier-briere.example/demandes">
          <AppShell active="demandes" counters={{ demandes, boite: INBOX_CARDS.length }} title="Demandes" subtitle="Formulaires du site et appels entrants, avec leur étape">
            <Panel title="Demandes entrantes">
              <table className="w-full border-collapse text-[13px]" style={{ color: INK }}>
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
                        initial={{ opacity: 0, y: -10, backgroundColor: 'rgba(200,94,26,0.10)' }}
                        animate={{ opacity: 1, y: 0, backgroundColor: 'rgba(200,94,26,0)' }}
                        transition={{ duration: 0.5, ease: EASE, backgroundColor: { duration: 1.6, delay: 0.4 } }}
                        className="border-t"
                        style={{ borderColor: GRAY_200, boxShadow: `inset 3px 0 0 ${EMBER}` }}
                      >
                        <td className="px-3 py-3 font-mono text-[12px]" style={{ color: EMBER }}>
                          08:02
                        </td>
                        <td className="px-3 py-3 font-semibold">{LEAD.name}</td>
                        <td className="px-3 py-3">
                          <motion.span initial={false} animate={badges ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }} transition={{ duration: 0.3, ease: EASE }} className="inline-flex">
                            <TradeBadge trade={LEAD.trade} />
                          </motion.span>
                        </td>
                        <td className="px-3 py-3" style={{ color: GRAY_600 }}>
                          <span className="inline-flex items-center gap-2">
                            {LEAD.windows} fenêtres, {LEAD.surfaceM2} m², {LEAD.address}
                            <motion.span initial={false} animate={badges ? { opacity: 1 } : { opacity: 0 }} transition={{ duration: 0.3, delay: 0.1 }} className="inline-flex items-center gap-1 whitespace-nowrap font-mono text-[11px]" style={{ color: INK }}>
                              <Paperclip size={12} aria-hidden="true" />
                              {LEAD.attachment}
                            </motion.span>
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          <motion.span initial={false} animate={badges ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }} transition={{ duration: 0.3, ease: EASE, delay: 0.05 }} className="inline-flex">
                            <LeadStageBadge label={LEAD_STAGE_LABEL['rdv-demande']} tone="ember" />
                          </motion.span>
                        </td>
                        <td className="px-3 py-3">
                          <ActionIcons phone={LEAD.phone} email={LEAD.email} />
                        </td>
                      </motion.tr>
                    ) : null}
                  </AnimatePresence>
                  {EXISTING_LEADS.map((lead) => (
                    <tr key={lead.id} className="border-t" style={{ borderColor: GRAY_200 }}>
                      <td className="px-3 py-3 font-mono text-[12px]" style={{ color: GRAY_500 }}>
                        {lead.receivedAt}
                      </td>
                      <td className="px-3 py-3 font-medium">{lead.name}</td>
                      <td className="px-3 py-3">
                        <TradeBadge trade={lead.trade} />
                      </td>
                      <td className="px-3 py-3" style={{ color: GRAY_600 }}>
                        {lead.summary}
                      </td>
                      <td className="px-3 py-3">
                        <LeadStageBadge label={LEAD_STAGE_LABEL[lead.stage]} tone={lead.stage === 'gagne' ? 'good' : lead.stage === 'devise' ? 'ink' : 'neutral'} />
                      </td>
                      <td className="px-3 py-3">
                        <ActionIcons phone="06 39 98 00 00" email="contact@example.org" />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-4 text-[12px]" style={{ color: GRAY_500 }}>
                L&rsquo;étape est posée automatiquement selon le formulaire : <Chip tone="ember">RDV demandé</Chip> pour un film solaire (relevé sur place),{' '}
                <Chip tone="neutral">Nouveau</Chip> pour le reste.
              </p>
            </Panel>
          </AppShell>
        </BrowserFrame>
      </ScaledStage>
    </div>
  )
}
