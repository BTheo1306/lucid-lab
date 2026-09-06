import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'

import { MONO } from '../fonts'
import { enter } from '../motion'
import { GRAY_200, GRAY_500, PAPER } from '../tokens'
import { Card3D } from '../ui/Card3D'
import { Words } from '../ui/Words'
import { SceneFrame } from './SceneFrame'

interface Doc {
  label: string
  x: number
  y: number
  fromX: number
  fromY: number
  rot: number
  lines: number[]
  delay: number
}

// Six documents, each arriving from a different edge, then drifting slowly.
const DOCS: Doc[] = [
  { label: 'Devis 2026-041', x: 150, y: 130, fromX: -700, fromY: 80, rot: -9, lines: [0.9, 0.6, 0.75], delay: 0 },
  { label: 'Mail · BAT validé', x: 1370, y: 100, fromX: 2300, fromY: 40, rot: 7, lines: [0.7, 0.85, 0.5], delay: 4 },
  { label: 'Compte rendu · appel', x: 1400, y: 660, fromX: 2400, fromY: 900, rot: -6, lines: [0.8, 0.55], delay: 8 },
  { label: 'Procédure · pose', x: 170, y: 680, fromX: -800, fromY: 1000, rot: 11, lines: [0.65, 0.9, 0.7], delay: 12 },
  { label: 'Fiche client', x: 760, y: 40, fromX: 900, fromY: -600, rot: -4, lines: [0.85, 0.5, 0.6], delay: 16 },
  { label: 'Facture F-2026-052', x: 780, y: 740, fromX: 960, fromY: 1500, rot: 5, lines: [0.6, 0.8], delay: 20 },
]

export function Scattered({ length }: { length: number }) {
  const frame = useCurrentFrame()
  const converge = interpolate(frame, [length - 30, length - 6], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: (t) => t * t })
  return (
    <SceneFrame length={length} fadeOut={6}>
      <AbsoluteFill style={{ perspective: 1800 }}>
        {DOCS.map((d) => {
          const p = enter(frame, d.delay, { damping: 24, stiffness: 60 })
          const driftX = Math.sin((frame + d.delay * 7) / 38) * 14
          const driftY = Math.cos((frame + d.delay * 5) / 31) * 12
          const x = interpolate(p, [0, 1], [d.fromX, d.x]) + driftX
          const y = interpolate(p, [0, 1], [d.fromY, d.y]) + driftY
          const cx = 960 - 200
          const cy = 540 - 130
          const fx = x + (cx - x) * converge
          const fy = y + (cy - y) * converge
          return (
            <Card3D
              key={d.label}
              width={400}
              height={260}
              x={fx}
              y={fy}
              rotateZ={d.rot * (1 - converge)}
              rotateY={d.rot * 1.5 * (1 - converge)}
              rotateX={-6 * (1 - converge)}
              scale={(0.85 + p * 0.15) * (1 - converge * 0.55)}
              opacity={p * (1 - converge * 0.9)}
              style={{ background: PAPER }}
            >
              <div style={{ padding: '26px 30px', fontFamily: MONO, fontSize: 17, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: GRAY_500 }}>{d.label}</div>
              <div style={{ padding: '0 30px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                {d.lines.map((w, i) => (
                  <div key={i} style={{ height: 14, width: `${w * 100}%`, borderRadius: 6, background: GRAY_200 }} />
                ))}
              </div>
            </Card3D>
          )
        })}
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ opacity: 1 - converge }}>
          <Words text="Mais tout est éparpillé." start={24} size={104} align="center" />
        </div>
      </AbsoluteFill>
    </SceneFrame>
  )
}
