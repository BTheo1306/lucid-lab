'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown, Paperclip } from 'lucide-react'

import { ATELIER } from '@/lib/demo/atelier/identity'
import { FORM_VALUES, TRADE_OPTIONS } from '@/lib/demo/atelier/lead'

import { PhoneFrame, ScaledStage } from '../chrome/DeviceFrame'
import { TypedText } from '../chrome/TypedText'
import { useScene } from '../player/SceneContext'
import { EASE, EMBER, GOOD, GOOD_TINT, GRAY_100, GRAY_200, GRAY_500, GRAY_600, INK, WHITE } from '../tokens'

function Field({ label, children, focused = false }: { label: string; children: React.ReactNode; focused?: boolean }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.06em]" style={{ color: GRAY_500 }}>
        {label}
      </span>
      <div
        role="textbox"
        aria-readonly="true"
        className="flex h-9 items-center rounded-[6px] border px-2.5 text-[13px]"
        style={{ borderColor: focused ? INK : GRAY_200, background: WHITE, color: INK, boxShadow: focused ? `0 0 0 2px ${GRAY_200}` : 'none' }}
      >
        {children}
      </div>
    </label>
  )
}

export function Scene01Formulaire() {
  const { fired } = useScene()
  const submitted = fired('submit')
  const success = fired('success')

  return (
    <div className="h-full">
      <ScaledStage width={390} height={780}>
        <PhoneFrame time="08:02">
          <div className="flex h-full flex-col" style={{ background: WHITE }}>
            <div className="border-b px-5 pb-3 pt-2" style={{ borderColor: GRAY_200 }}>
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-[5px] text-[10px] font-bold text-white" style={{ background: INK }}>
                  AB
                </span>
                <span className="text-[13px] font-semibold" style={{ color: INK }}>
                  {ATELIER.name}
                </span>
              </div>
              <p className="mt-1 text-[11px]" style={{ color: GRAY_500 }}>
                {ATELIER.tagline}
              </p>
            </div>
            <AnimatePresence mode="wait" initial={false}>
              {success ? (
                <motion.div
                  key="success"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: EASE }}
                  className="flex flex-1 flex-col items-center justify-center px-6 text-center"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-full" style={{ background: GOOD_TINT, color: GOOD }}>
                    <Check size={26} aria-hidden="true" />
                  </span>
                  <h3 className="mt-5 text-[20px] font-bold leading-tight" style={{ color: INK }}>
                    Merci Julien, on vous rappelle sous 24 h.
                  </h3>
                  <p className="mt-3 text-[13px] leading-relaxed" style={{ color: GRAY_600 }}>
                    Un email de confirmation vient de partir avec le détail de votre demande et le numéro de l&rsquo;atelier.
                  </p>
                </motion.div>
              ) : (
                <motion.div key="form" exit={{ opacity: 0 }} transition={{ duration: 0.2 }} className="flex flex-1 flex-col gap-2.5 px-5 pt-3">
                  <h3 className="text-[16px] font-bold" style={{ color: INK }}>
                    Demande de devis
                  </h3>
                  <div className="relative">
                    <Field label="Votre besoin" focused={fired('focus-metier') && !fired('pick-metier')}>
                      <span className="flex-1" style={{ color: fired('pick-metier') ? INK : GRAY_500 }}>
                        {fired('pick-metier') ? FORM_VALUES.trade : 'Choisir'}
                      </span>
                      <ChevronDown size={14} aria-hidden="true" style={{ color: GRAY_500 }} />
                    </Field>
                    <AnimatePresence>
                      {fired('focus-metier') && !fired('pick-metier') ? (
                        <motion.ul
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="absolute left-0 right-0 top-full z-10 mt-1 overflow-hidden rounded-[6px] border py-1 text-[13px]"
                          style={{ borderColor: GRAY_200, background: WHITE, boxShadow: '0 8px 24px rgba(10,10,10,0.08)' }}
                        >
                          {TRADE_OPTIONS.map((opt) => (
                            <li key={opt} className="px-2.5 py-1.5" style={{ background: opt === FORM_VALUES.trade ? GRAY_100 : WHITE, color: INK }}>
                              {opt}
                            </li>
                          ))}
                        </motion.ul>
                      ) : null}
                    </AnimatePresence>
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <Field label="Fenêtres" focused={fired('type-fenetres') && !fired('type-surface')}>
                      <TypedText text={FORM_VALUES.windows} active={fired('type-fenetres')} cps={12} />
                    </Field>
                    <Field label="Surface" focused={fired('type-surface') && !fired('type-adresse')}>
                      <TypedText text={FORM_VALUES.surface} active={fired('type-surface')} cps={14} />
                    </Field>
                  </div>
                  <Field label="Adresse du chantier" focused={fired('type-adresse') && !fired('attach-photo')}>
                    <TypedText text={FORM_VALUES.address} active={fired('type-adresse')} cps={30} />
                  </Field>
                  <div>
                    <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.06em]" style={{ color: GRAY_500 }}>
                      Photo (facultatif)
                    </span>
                    <div className="flex h-9 items-center gap-2 rounded-[6px] border border-dashed px-2.5 text-[12.5px]" style={{ borderColor: fired('attach-photo') ? GOOD : GRAY_200, color: GRAY_600 }}>
                      <Paperclip size={13} aria-hidden="true" />
                      {fired('attach-photo') ? (
                        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: INK }}>
                          {FORM_VALUES.attachment} <span style={{ color: GRAY_500 }}>2,1 Mo</span>
                        </motion.span>
                      ) : (
                        <span>Joindre une photo</span>
                      )}
                    </div>
                  </div>
                  <Field label="Nom" focused={fired('type-contact') && !submitted}>
                    <TypedText text={FORM_VALUES.name} active={fired('type-contact')} cps={28} showCaret={false} />
                  </Field>
                  <div className="grid grid-cols-2 gap-2.5">
                    <Field label="Téléphone">
                      <TypedText text={FORM_VALUES.phone} active={fired('type-contact')} cps={26} delayMs={450} showCaret={false} />
                    </Field>
                    <Field label="Email">
                      <TypedText text={FORM_VALUES.email} active={fired('type-contact')} cps={40} delayMs={700} showCaret={false} className="truncate" />
                    </Field>
                  </div>
                  <div className="mt-auto pb-5 pt-1">
                    <button
                      type="button"
                      className="flex h-11 w-full items-center justify-center gap-2 rounded-[6px] text-[14px] font-semibold"
                      style={{ background: submitted ? EMBER : INK, color: WHITE, transform: submitted ? 'scale(0.98)' : 'none' }}
                    >
                      {submitted ? (
                        <>
                          <span className="demo-pulse inline-block h-2 w-2 rounded-full" style={{ background: WHITE }} aria-hidden="true" />
                          Envoi en cours
                        </>
                      ) : (
                        'Envoyer ma demande'
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </PhoneFrame>
      </ScaledStage>
    </div>
  )
}
