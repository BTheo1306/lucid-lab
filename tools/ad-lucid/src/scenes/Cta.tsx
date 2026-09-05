import { AbsoluteFill, useCurrentFrame } from 'remotion'

import { MONO } from '../fonts'
import { enter } from '../motion'
import { EMBER, GRAY_500, INK } from '../tokens'
import { Wordmark } from '../ui/Wordmark'
import { Words } from '../ui/Words'
import { SceneFrame } from './SceneFrame'

export function Cta({ length }: { length: number }) {
  const frame = useCurrentFrame()
  const mark = enter(frame, 6, { damping: 30, stiffness: 60 })
  const rule = enter(frame, 22)
  const url = enter(frame, 78)
  const foot = enter(frame, 100)
  return (
    <SceneFrame length={length} fadeOut={1}>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ opacity: mark, transform: `translateY(${(1 - mark) * 20}px) scale(${0.96 + mark * 0.04})` }}>
          <Wordmark size={54} />
        </div>
        <div style={{ height: 3, width: 90 * rule, background: EMBER, marginTop: 30, marginBottom: 46 }} />
        <Words text="Audit flash offert." start={36} size={124} align="center" accent={[2]} />
        <div style={{ marginTop: 40, fontFamily: MONO, fontSize: 34, fontWeight: 600, letterSpacing: '0.14em', color: INK, opacity: url, transform: `translateY(${(1 - url) * 12}px)` }}>lucid-lab.fr</div>
        <div style={{ marginTop: 26, fontFamily: MONO, fontSize: 18, fontWeight: 600, letterSpacing: '0.16em', textTransform: 'uppercase', color: GRAY_500, opacity: foot }}>Agence IA · Second Brain · Automatisation</div>
      </AbsoluteFill>
    </SceneFrame>
  )
}
