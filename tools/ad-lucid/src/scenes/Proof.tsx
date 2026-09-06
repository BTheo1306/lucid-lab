import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'

import { MONO, SANS } from '../fonts'
import { enter } from '../motion'
import { EMBER_700, GRAY_200, GRAY_600, WHITE } from '../tokens'
import { Words } from '../ui/Words'
import { SceneFrame } from './SceneFrame'

const TILES = [
  { value: (t: number) => `${Math.round(60 - t * 59)} s`, final: '< 1 min', label: 'pour répondre à chaque demande entrante', at: 34 },
  { value: (t: number) => `${Math.round(t * 14)} jours`, final: '14 jours', label: 'pour installer votre Second Brain', at: 50 },
  { value: (t: number) => `${Math.round(t * 100)} %`, final: '100 %', label: 'votre propriété : la base vit dans vos outils', at: 66 },
]

export function Proof({ length }: { length: number }) {
  const frame = useCurrentFrame()
  return (
    <SceneFrame length={length}>
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 150 }}>
        <Words text="Simple. Rapide. Chez vous." start={8} size={110} align="center" accent={[2, 3]} />
      </AbsoluteFill>
      <AbsoluteFill style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 36, paddingTop: 170 }}>
        {TILES.map((tile) => {
          const p = enter(frame, tile.at, { damping: 26, stiffness: 70 })
          const count = interpolate(frame, [tile.at, tile.at + 40], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: (t) => 1 - Math.pow(1 - t, 2) })
          const done = frame >= tile.at + 40
          return (
            <div key={tile.label} style={{ width: 520, height: 300, borderRadius: 18, background: WHITE, border: `1px solid ${GRAY_200}`, padding: '40px 44px', opacity: p, transform: `translateY(${(1 - p) * 40}px)`, boxShadow: '0 30px 70px rgba(10,10,10,0.08)' }}>
              <div style={{ fontFamily: SANS, fontSize: 100, fontWeight: 700, letterSpacing: '-0.03em', lineHeight: 1, color: EMBER_700, fontVariantNumeric: 'tabular-nums' }}>{done ? tile.final : tile.value(count)}</div>
              <div style={{ marginTop: 24, fontFamily: MONO, fontSize: 20, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: GRAY_600, lineHeight: 1.4 }}>{tile.label}</div>
            </div>
          )
        })}
      </AbsoluteFill>
    </SceneFrame>
  )
}
