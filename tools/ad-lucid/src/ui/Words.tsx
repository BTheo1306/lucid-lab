import { useCurrentFrame } from 'remotion'

import { SANS } from '../fonts'
import { enter, exit } from '../motion'
import { INK } from '../tokens'

interface WordsProps {
  text: string
  /** Frame at which the first word appears. */
  start: number
  /** Frame at which the whole line leaves (optional). */
  end?: number
  size?: number
  weight?: number
  color?: string
  /** Words to paint in the accent colour (0-based indexes). */
  accent?: number[]
  accentColor?: string
  stagger?: number
  align?: 'left' | 'center'
  maxWidth?: number
  lineHeight?: number
  letterSpacing?: string
}

/** Kinetic headline: each word rises and sharpens in turn, then the line fades out. */
export function Words({ text, start, end, size = 96, weight = 700, color = INK, accent = [], accentColor, stagger = 4, align = 'left', maxWidth, lineHeight = 1.05, letterSpacing = '-0.025em' }: WordsProps) {
  const frame = useCurrentFrame()
  const words = text.split(' ')
  const leave = end === undefined ? 1 : exit(frame, end)
  return (
    <div
      style={{
        fontFamily: SANS,
        fontSize: size,
        fontWeight: weight,
        color,
        lineHeight,
        letterSpacing,
        textAlign: align,
        maxWidth,
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: align === 'center' ? 'center' : 'flex-start',
        columnGap: size * 0.26,
        rowGap: 0,
        opacity: leave,
        transform: `translateY(${(1 - leave) * -18}px)`,
      }}
    >
      {words.map((w, i) => {
        const p = enter(frame, start + i * stagger)
        return (
          <span
            key={`${w}-${i}`}
            style={{
              display: 'inline-block',
              opacity: p,
              transform: `translateY(${(1 - p) * 34}px)`,
              filter: `blur(${(1 - p) * 10}px)`,
              color: accent.includes(i) ? (accentColor ?? '#C85E1A') : undefined,
            }}
          >
            {w}
          </span>
        )
      })}
    </div>
  )
}
