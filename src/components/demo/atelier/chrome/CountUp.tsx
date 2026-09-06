'use client'

import { useEffect, useState } from 'react'

import { useScene } from '../player/SceneContext'

interface CountUpProps {
  to: number
  active: boolean
  durationMs?: number
  className?: string
  format?: (n: number) => string
}

/** Counts from 0 to `to` once active. Jumps straight to the value under reduced motion. */
export function CountUp({ to, active, durationMs = 900, className, format }: CountUpProps) {
  const { reduced, speed } = useScene()
  const [value, setValue] = useState(0)

  useEffect(() => {
    if (!active) return
    if (reduced) {
      const t = window.setTimeout(() => setValue(to), 0)
      return () => window.clearTimeout(t)
    }
    let frame = 0
    const start = performance.now()
    const total = durationMs / speed
    const tick = (now: number) => {
      const p = Math.min(1, (now - start) / total)
      const eased = 1 - Math.pow(1 - p, 3)
      setValue(Math.round(to * eased))
      if (p < 1) frame = window.requestAnimationFrame(tick)
    }
    frame = window.requestAnimationFrame(tick)
    return () => window.cancelAnimationFrame(frame)
  }, [active, reduced, speed, to, durationMs])

  const shown = active ? value : 0
  return <span className={className}>{format ? format(shown) : shown}</span>
}
