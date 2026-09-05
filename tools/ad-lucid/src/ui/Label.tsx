import { useCurrentFrame } from 'remotion'

import { MONO } from '../fonts'
import { enter, exit } from '../motion'
import { GRAY_500 } from '../tokens'

/** Mono uppercase eyebrow, brand kit style. */
export function Label({ text, start, end, color = GRAY_500, size = 20 }: { text: string; start: number; end?: number; color?: string; size?: number }) {
  const frame = useCurrentFrame()
  const p = enter(frame, start)
  const leave = end === undefined ? 1 : exit(frame, end)
  return (
    <div style={{ fontFamily: MONO, fontSize: size, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color, opacity: p * leave, transform: `translateY(${(1 - p) * 12}px)` }}>
      {text}
    </div>
  )
}
