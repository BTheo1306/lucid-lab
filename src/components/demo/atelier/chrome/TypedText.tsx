'use client'

import { useEffect, useState } from 'react'

import { useScene } from '../player/SceneContext'

interface TypedTextProps {
  text: string
  /** Typing starts when true. Nothing is shown before. */
  active: boolean
  /** Characters per second at speed 1. */
  cps?: number
  showCaret?: boolean
  className?: string
  /** Wait before the first character, once active. */
  delayMs?: number
}

/** Deterministic typewriter: the text is revealed at a fixed rate once active. */
export function TypedText({ text, active, cps = 38, showCaret = true, className, delayMs = 0 }: TypedTextProps) {
  const { reduced, speed } = useScene()
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!active) return
    if (reduced) {
      const t = window.setTimeout(() => setCount(text.length), 0)
      return () => window.clearTimeout(t)
    }
    let interval = 0
    const start = window.setTimeout(() => {
      interval = window.setInterval(() => {
        setCount((c) => {
          if (c >= text.length) {
            window.clearInterval(interval)
            return c
          }
          return c + 1
        })
      }, 1000 / (cps * speed))
    }, delayMs / speed)
    return () => {
      window.clearTimeout(start)
      window.clearInterval(interval)
    }
  }, [active, reduced, cps, speed, text, delayMs])

  const shown = active ? text.slice(0, count) : ''
  const done = count >= text.length
  return (
    <span className={className}>
      {shown}
      {active && showCaret && !done ? <span className="demo-caret" aria-hidden="true" /> : null}
    </span>
  )
}
