'use client'

import { useEffect, useRef } from 'react'

import type { Scene } from '@/lib/demo/atelier/types'

interface TimelineOptions {
  /** True while the player status is "playing". */
  active: boolean
  /** Fire every step at once (reduced motion). */
  reduced: boolean
  /** Divides every delay. */
  speed: number
  onStep: (count: number) => void
  onDone: () => void
}

/**
 * Fires the scripted steps of a scene with setTimeout, measured from the
 * scene entry. Pausing clears the timers and keeps the elapsed time so the
 * scene resumes where it stopped. Remount (new sceneKey) restarts from zero.
 */
export function useSceneTimeline(scene: Scene, sceneKey: number, options: TimelineOptions) {
  const { active, reduced, speed, onStep, onDone } = options
  const elapsedRef = useRef(0)
  const onStepRef = useRef(onStep)
  const onDoneRef = useRef(onDone)

  useEffect(() => {
    onStepRef.current = onStep
    onDoneRef.current = onDone
  })

  useEffect(() => {
    elapsedRef.current = 0
  }, [scene.id, sceneKey])

  useEffect(() => {
    if (!active) return
    const timers: number[] = []
    const startedAt = performance.now()
    const elapsed = elapsedRef.current

    if (reduced) {
      timers.push(window.setTimeout(() => onStepRef.current(scene.steps.length), 0))
    } else {
      scene.steps.forEach((step, i) => {
        const delay = Math.max(0, step.at / speed - elapsed)
        timers.push(window.setTimeout(() => onStepRef.current(i + 1), delay))
      })
    }
    timers.push(window.setTimeout(() => onDoneRef.current(), Math.max(0, scene.duration / speed - elapsed)))

    return () => {
      timers.forEach((t) => window.clearTimeout(t))
      elapsedRef.current = elapsed + (performance.now() - startedAt) * speed
    }
  }, [active, reduced, speed, scene, sceneKey])
}
