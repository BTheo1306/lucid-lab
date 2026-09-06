import type { Scene, SceneStep } from '@/lib/demo/atelier/types'

/** A step of the film version: may move the camera to a named region of the screen. */
export interface FilmStep extends SceneStep {
  /** data-region id inside the screen to frame, or 'full' to pull back. */
  shot?: string
  /** Target scale (1 = whole screen). Without it the region is fitted, between 1 and 2.4. */
  zoom?: number
  /** Where to centre inside a wide region. */
  anchor?: 'left' | 'center' | 'right'
}

/** A scene of the film version: a statement above the screen, the narration below. */
export interface FilmScene extends Scene {
  /** Mono eyebrow above the headline, e.g. "08:02 · Une demande arrive". */
  eyebrow: string | null
  headline: string
  sub?: string
  steps: FilmStep[]
}
