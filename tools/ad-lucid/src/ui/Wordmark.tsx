import { WORDMARK } from '../fonts'
import { INK } from '../tokens'

export function Wordmark({ size = 34, color = INK }: { size?: number; color?: string }) {
  return (
    <span style={{ fontFamily: WORDMARK, fontWeight: 700, fontSize: size, letterSpacing: '0.18em', textTransform: 'uppercase', color }}>
      Lucid-Lab
    </span>
  )
}
