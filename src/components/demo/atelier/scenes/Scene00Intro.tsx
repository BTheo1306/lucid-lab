'use client'

import { DISCLAIMER } from '@/lib/demo/atelier/identity'

import { Kbd } from '../chrome/Kbd'
import { Reveal } from '../chrome/Reveal'
import { useScene } from '../player/SceneContext'
import { EMBER, GRAY_500, GRAY_600, INK, WHITE } from '../tokens'
import type { SceneProps } from './types'

export function Scene00Intro({ onStart }: SceneProps) {
  const { fired, mode } = useScene()
  return (
    <div className="flex h-full flex-col items-center justify-center px-4 text-center">
      <Reveal show={fired('title')}>
        <p className="mb-5 font-mono text-[12px] font-semibold uppercase tracking-[0.16em]" style={{ color: GRAY_500 }}>
          Démonstration
        </p>
        <h1 className="mx-auto max-w-[18ch] text-[36px] font-bold leading-[1.05] tracking-[-0.02em] md:text-[56px]" style={{ color: INK }}>
          Une journée à l&rsquo;atelier, <span style={{ color: EMBER }}>avec l&rsquo;assistant.</span>
        </h1>
      </Reveal>
      <Reveal show={fired('disclaimer')} delay={0.05}>
        <p className="mx-auto mt-7 max-w-[62ch] text-[15px] leading-[1.6] md:text-[17px]" style={{ color: GRAY_600 }}>
          {DISCLAIMER}
        </p>
        <p className="mx-auto mt-3 max-w-[62ch] text-[14px] leading-[1.6] md:text-[15px]" style={{ color: GRAY_600 }}>
          L&rsquo;assistant lit, prépare, propose. La dirigeante décide et valide. Rien ne part sans elle.
        </p>
      </Reveal>
      <Reveal show={fired('cta')} delay={0.05} className="mt-10 flex flex-col items-center gap-6">
        {mode === 'presenter' ? (
          <button
            type="button"
            onClick={onStart}
            className="h-12 rounded-[6px] px-7 text-[15px] font-semibold transition-opacity hover:opacity-90"
            style={{ background: INK, color: WHITE }}
          >
            Lancer la démo
          </button>
        ) : (
          <span className="font-mono text-[12px] font-semibold uppercase tracking-[0.16em]" style={{ color: GRAY_500 }}>
            Lecture automatique
          </span>
        )}
        {mode !== 'record' ? (
          <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-2 text-[12px]" style={{ color: GRAY_600 }}>
            <Kbd>→</Kbd>
            <span>ou</span>
            <Kbd>Espace</Kbd>
            <span>pour avancer,</span>
            <Kbd>←</Kbd>
            <span>pour revenir,</span>
            <Kbd>R</Kbd>
            <span>rejouer,</span>
            <Kbd>F</Kbd>
            <span>plein écran</span>
          </div>
        ) : null}
      </Reveal>
    </div>
  )
}
