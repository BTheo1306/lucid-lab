'use client'

import { AnimatePresence, motion } from 'framer-motion'
import { Check, ChevronDown, Paperclip } from 'lucide-react'

import { ATELIER } from '@/lib/demo/atelier/identity'
import { FORM_VALUES } from '@/lib/demo/atelier/lead'

import { TypedText } from '../../atelier/chrome/TypedText'
import { useScene } from '../../atelier/player/SceneContext'
import { EASE, EMBER, GRAY_200, GRAY_500, GRAY_600, INK, PAPER, WHITE } from '../../atelier/tokens'
import { Region } from '../chrome/Camera'
import { Button, Field, Label } from '../chrome/ui'

const REASSURANCE = [
  { title: 'Relevé offert sur place', text: "On mesure vos vitrages et on regarde l'exposition avant de chiffrer." },
  { title: 'Réponse sous 24 h', text: 'Un rappel dans la journée pour fixer le créneau du relevé.' },
  { title: 'Atelier à Tours', text: 'Fabrication et pose par la même équipe, du devis à la livraison.' },
]

export function FormulaireScreen() {
  const { fired } = useScene()
  const submitted = fired('submit')
  const success = fired('success')

  return (
    <div className="flex h-full w-full flex-col" style={{ background: WHITE, color: INK }}>
      <header className="flex h-16 shrink-0 items-center justify-between border-b px-12" style={{ borderColor: GRAY_200 }}>
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-[6px] text-[12px] font-bold" style={{ background: INK, color: WHITE }}>
            AB
          </span>
          <div className="leading-tight">
            <div className="text-[15px] font-semibold">{ATELIER.name}</div>
            <div className="text-[12px]" style={{ color: GRAY_500 }}>
              {ATELIER.tagline}
            </div>
          </div>
        </div>
        <nav className="flex gap-7 text-[14px]" style={{ color: GRAY_600 }} aria-label="Menu du site">
          <span>Enseignes</span>
          <span>Adhésifs</span>
          <span>Bâches</span>
          <span>Films pour vitrages</span>
          <span className="font-semibold" style={{ color: INK }}>
            Demande de devis
          </span>
        </nav>
      </header>
      <div className="grid flex-1 grid-cols-[1fr_420px] gap-14 px-12 py-10">
        <div>
          <Label tone="ember">Demande de devis</Label>
          <h2 className="mt-2 text-[30px] font-bold tracking-[-0.01em]">Dites-nous ce qu&rsquo;il vous faut.</h2>
          <AnimatePresence mode="wait" initial={false}>
            {success ? (
              <motion.div key="ok" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, ease: EASE }} className="mt-8 flex items-start gap-5 rounded-[8px] border p-8" style={{ borderColor: GRAY_200, background: PAPER }}>
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full" style={{ background: INK, color: WHITE }}>
                  <Check size={22} aria-hidden="true" />
                </span>
                <div>
                  <div className="text-[22px] font-bold">Merci Julien, on vous rappelle sous 24 h.</div>
                  <p className="mt-2 max-w-[52ch] text-[15px] leading-relaxed" style={{ color: GRAY_600 }}>
                    Un email de confirmation vient de partir avec le détail de votre demande et le numéro direct de l&rsquo;atelier.
                  </p>
                </div>
              </motion.div>
            ) : (
              <motion.div key="form" exit={{ opacity: 0 }} transition={{ duration: 0.25 }} className="mt-8 grid grid-cols-2 gap-x-6 gap-y-5">
                <Region id="form-need" className="col-span-2">
                  <Field label="Votre besoin" focused={fired('pick-metier') && !fired('type-details')} wide>
                    <span className="flex-1" style={{ color: fired('pick-metier') ? INK : GRAY_500 }}>
                      {fired('pick-metier') ? FORM_VALUES.trade : 'Choisir'}
                    </span>
                    <ChevronDown size={16} aria-hidden="true" style={{ color: GRAY_500 }} />
                  </Field>
                </Region>
                <Region id="form-details" className="col-span-2 grid grid-cols-2 gap-x-6 gap-y-5">
                  <Field label="Nombre de fenêtres" focused={fired('type-details') && !fired('attach-photo')}>
                    <TypedText text={FORM_VALUES.windows} active={fired('type-details')} cps={6} showCaret={false} />
                  </Field>
                  <Field label="Surface approximative">
                    <TypedText text={FORM_VALUES.surface} active={fired('type-details')} cps={10} delayMs={600} showCaret={false} />
                  </Field>
                  <Field label="Adresse du chantier" wide>
                    <TypedText text={FORM_VALUES.address} active={fired('type-details')} cps={26} delayMs={1200} showCaret={false} />
                  </Field>
                </Region>
                <Region id="form-photo" className="col-span-2">
                  <Label>Photo (facultatif)</Label>
                  <div className="mt-1.5 flex h-12 items-center gap-2.5 rounded-[6px] border border-dashed px-3.5 text-[15px]" style={{ borderColor: fired('attach-photo') ? INK : GRAY_200, color: GRAY_600 }}>
                    <Paperclip size={16} aria-hidden="true" />
                    {fired('attach-photo') ? (
                      <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ color: INK }}>
                        {FORM_VALUES.attachment} <span style={{ color: GRAY_500 }}>2,1 Mo</span>
                      </motion.span>
                    ) : (
                      <span>Joindre une photo</span>
                    )}
                  </div>
                </Region>
                <Region id="form-contact" className="col-span-2 grid grid-cols-2 gap-x-6 gap-y-5">
                  <Field label="Nom" focused={fired('type-contact') && !submitted}>
                    <TypedText text={FORM_VALUES.name} active={fired('type-contact')} cps={24} showCaret={false} />
                  </Field>
                  <Field label="Téléphone">
                    <TypedText text={FORM_VALUES.phone} active={fired('type-contact')} cps={20} delayMs={500} showCaret={false} />
                  </Field>
                  <Field label="Email" wide>
                    <TypedText text={FORM_VALUES.email} active={fired('type-contact')} cps={34} delayMs={900} showCaret={false} />
                  </Field>
                </Region>
                <Region id="form-submit" className="col-span-2 flex items-center gap-4 pt-1">
                  <Button primary pressed={submitted}>
                    {submitted ? 'Envoi en cours' : 'Envoyer ma demande'}
                  </Button>
                  <span className="text-[13px]" style={{ color: GRAY_500 }}>
                    Réponse dans la journée. Aucun démarchage.
                  </span>
                </Region>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <aside className="flex flex-col gap-6 border-l pl-12" style={{ borderColor: GRAY_200 }}>
          {REASSURANCE.map((r, i) => (
            <div key={r.title}>
              <div className="flex items-center gap-3">
                <span className="font-mono text-[12px] font-semibold" style={{ color: EMBER }}>
                  0{i + 1}
                </span>
                <span className="text-[16px] font-semibold">{r.title}</span>
              </div>
              <p className="mt-1.5 text-[14px] leading-relaxed" style={{ color: GRAY_600 }}>
                {r.text}
              </p>
            </div>
          ))}
          <div className="mt-auto rounded-[8px] p-5" style={{ background: PAPER }}>
            <Label>Ou par téléphone</Label>
            <div className="mt-1 font-mono text-[18px] font-semibold">{ATELIER.phone}</div>
          </div>
        </aside>
      </div>
    </div>
  )
}
