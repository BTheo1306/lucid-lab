'use client'

import { DISCLAIMER } from '@/lib/demo/atelier/identity'
import { filmSceneAt } from '@/lib/demo/atelier-v2/scenario'

import { Kbd } from '../../atelier/chrome/Kbd'
import { LucidWordmark } from '../../atelier/chrome/Wordmark'
import { useScene } from '../../atelier/player/SceneContext'
import { EMBER, GRAY_500, GRAY_600, INK, WHITE } from '../../atelier/tokens'
import { Label, Rise } from '../chrome/ui'
import type { ScreenProps } from './types'

const SCENE = filmSceneAt(0)

export function IntroScreen({ onStart }: ScreenProps) {
  const { fired, mode } = useScene()
  return (
    <div className="mx-auto flex h-full max-w-[1120px] flex-col justify-center px-2 py-10">
      <Rise show={fired('title')}>
        <LucidWordmark />
        <div className="mt-10 h-px w-16" style={{ background: EMBER }} aria-hidden="true" />
        <h1 className="mt-8 max-w-[14ch] text-[56px] font-bold leading-[1.02] tracking-[-0.025em] md:text-[84px]" style={{ color: INK }}>
          {SCENE.headline}
        </h1>
      </Rise>
      <Rise show={fired('sub')} delay={0.1}>
        <p className="mt-8 max-w-[52ch] text-[20px] leading-[1.5] md:text-[24px]" style={{ color: GRAY_600 }}>
          {SCENE.sub}
        </p>
      </Rise>
      <Rise show={fired('disclaimer')} delay={0.1} className="mt-12 flex flex-col gap-6">
        <p className="max-w-[80ch] font-mono text-[12px] uppercase leading-relaxed tracking-[0.12em]" style={{ color: GRAY_500 }}>
          {DISCLAIMER}
        </p>
        {mode === 'presenter' ? (
          <div className="flex items-center gap-5">
            <button type="button" onClick={onStart} className="h-12 rounded-[6px] px-7 text-[15px] font-semibold" style={{ background: INK, color: WHITE }}>
              Lancer le film
            </button>
            <span className="flex items-center gap-2 text-[12.5px]" style={{ color: GRAY_600 }}>
              <Kbd>→</Kbd> avancer <Kbd>←</Kbd> revenir <Kbd>R</Kbd> rejouer <Kbd>F</Kbd> plein écran
            </span>
          </div>
        ) : mode === 'autoplay' ? (
          <Label>Lecture automatique</Label>
        ) : null}
      </Rise>
    </div>
  )
}
