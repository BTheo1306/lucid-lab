'use client'

import { DISCLAIMER } from '@/lib/demo/atelier/identity'
import type { Scene } from '@/lib/demo/atelier/types'

import { EMBER, GRAY_300, GRAY_500, INK } from '../tokens'
import { LucidWordmark } from './Wordmark'

interface ProgressRailProps {
  scenes: Scene[]
  current: number
  interactive: boolean
  onSelect: (index: number) => void
}

function stopLabel(scene: Scene): string {
  if (scene.id === 'intro') return 'Début'
  if (scene.id === 'bilan') return 'Bilan'
  return scene.clock ?? ''
}

export function ProgressRail({ scenes, current, interactive, onSelect }: ProgressRailProps) {
  return (
    <div className="mx-auto w-full max-w-[1264px] px-6 pb-4 pt-3 md:px-10">
      <nav aria-label="Étapes de la journée" className="relative">
        <div className="absolute left-0 right-0 top-[7px] h-px" style={{ background: GRAY_300 }} aria-hidden="true" />
        <div
          className="absolute left-0 top-[7px] h-px transition-[width] duration-500"
          style={{ background: INK, width: `${(current / Math.max(1, scenes.length - 1)) * 100}%` }}
          aria-hidden="true"
        />
        <ol className="relative flex items-start justify-between">
          {scenes.map((scene) => {
            const isCurrent = scene.index === current
            const isPast = scene.index < current
            return (
              <li key={scene.id} className="flex flex-col items-center gap-1.5">
                <button
                  type="button"
                  aria-current={isCurrent ? 'step' : undefined}
                  aria-label={`${stopLabel(scene)} : ${scene.title}`}
                  disabled={!interactive}
                  onClick={() => onSelect(scene.index)}
                  className="flex h-[15px] w-[15px] items-center justify-center rounded-full disabled:cursor-default"
                >
                  <span
                    className="block rounded-full transition-all duration-300"
                    style={{
                      width: isCurrent ? 11 : 7,
                      height: isCurrent ? 11 : 7,
                      background: isCurrent ? EMBER : isPast ? INK : GRAY_300,
                    }}
                  />
                </button>
                <span
                  className="hidden font-mono text-[10px] tracking-[0.08em] md:block"
                  style={{ color: isCurrent ? INK : GRAY_500, fontWeight: isCurrent ? 600 : 400 }}
                >
                  {stopLabel(scene)}
                </span>
              </li>
            )
          })}
        </ol>
      </nav>
      <div className="mt-3 flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
        <p className="text-[11px] leading-snug" style={{ color: GRAY_500 }}>
          {DISCLAIMER}
        </p>
        <LucidWordmark className="shrink-0 opacity-70" />
      </div>
    </div>
  )
}
