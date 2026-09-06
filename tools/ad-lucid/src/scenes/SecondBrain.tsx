import { AbsoluteFill, Loop, OffthreadVideo, staticFile, useCurrentFrame } from 'remotion'

import { MONO } from '../fonts'
import { enter } from '../motion'
import { EMBER, GRAY_200, GRAY_600, INK, WHITE } from '../tokens'
import { Card3D } from '../ui/Card3D'
import { Label } from '../ui/Label'
import { Words } from '../ui/Words'
import { SceneFrame } from './SceneFrame'

const CHIPS = ['Offres', 'Process', 'Clients', 'Procédures']

export function SecondBrain({ length }: { length: number }) {
  const frame = useCurrentFrame()
  const p = enter(frame, 0, { damping: 30, stiffness: 70 })
  const size = 640
  return (
    <SceneFrame length={length}>
      <AbsoluteFill style={{ perspective: 2000 }}>
        <Card3D
          width={size}
          height={size}
          x={200}
          y={(1080 - size) / 2}
          rotateY={-16 + p * 4}
          rotateX={6 - p * 2}
          scale={0.6 + p * 0.4}
          opacity={p}
          radius={26}
          style={{ background: INK, border: `1px solid rgba(200,94,26,0.45)` }}
        >
          <Loop durationInFrames={151}>
            <OffthreadVideo src={staticFile('brain.mp4')} muted style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </Loop>
        </Card3D>
      </AbsoluteFill>
      <AbsoluteFill style={{ paddingLeft: 1000, paddingRight: 120, justifyContent: 'center' }}>
        <Label text="L'offre" start={8} color={EMBER} />
        <div style={{ height: 28 }} />
        <Words text="Le Second Brain." start={12} size={112} />
        <div style={{ height: 30 }} />
        <Words text="Claude, branché sur ce que votre entreprise sait déjà." start={48} size={48} weight={500} color={GRAY_600} lineHeight={1.28} letterSpacing="-0.01em" stagger={2} />
        <div style={{ height: 40, display: 'flex' }} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12 }}>
          {CHIPS.map((c, i) => {
            const q = enter(frame, 92 + i * 5)
            return (
              <span
                key={c}
                style={{
                  fontFamily: MONO,
                  fontSize: 20,
                  fontWeight: 600,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: INK,
                  background: WHITE,
                  border: `1px solid ${GRAY_200}`,
                  borderRadius: 8,
                  padding: '14px 22px',
                  opacity: q,
                  transform: `translateY(${(1 - q) * 14}px)`,
                }}
              >
                {c}
              </span>
            )
          })}
        </div>
      </AbsoluteFill>
    </SceneFrame>
  )
}
