import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'

import { MONO, SANS } from '../fonts'
import { enter } from '../motion'
import { EMBER, EMBER_700, GRAY_100, GRAY_200, GRAY_500, GRAY_600, INK, PAPER, WHITE } from '../tokens'
import { Card3D } from '../ui/Card3D'
import { Words } from '../ui/Words'
import { SceneFrame } from './SceneFrame'

const QUESTION = 'Quel est notre délai de pose habituel pour une enseigne ?'
const ANSWER = 'Cinq jours ouvrés après validation du BAT, nacelle réservée la veille. Pour un chantier hors agglomération, comptez une journée de plus.'

export function Question({ length }: { length: number }) {
  const frame = useCurrentFrame()
  const p = enter(frame, 0, { damping: 30, stiffness: 70 })
  const typed = Math.round(interpolate(frame, [12, 58], [0, QUESTION.length], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }))
  const thinking = frame > 60 && frame < 76
  const a = enter(frame, 76, { damping: 26, stiffness: 80 })
  const s = enter(frame, 100)
  return (
    <SceneFrame length={length}>
      <AbsoluteFill style={{ perspective: 2200 }}>
        <Card3D width={1080} height={530} x={110} y={275} rotateY={10 - p * 3} rotateX={4 - p} scale={0.92 + p * 0.08} opacity={p} radius={18}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '22px 30px', borderBottom: `1px solid ${GRAY_200}`, fontFamily: MONO, fontSize: 17, fontWeight: 600, letterSpacing: '0.14em', textTransform: 'uppercase', color: GRAY_500 }}>
            <span style={{ width: 10, height: 10, borderRadius: 5, background: EMBER }} />
            Second Brain · Atelier
          </div>
          <div style={{ padding: '34px 30px', display: 'flex', flexDirection: 'column', gap: 22, fontFamily: SANS }}>
            <div style={{ alignSelf: 'flex-end', maxWidth: 680, background: INK, color: WHITE, borderRadius: 14, padding: '18px 22px', fontSize: 31, lineHeight: 1.35, minHeight: 70, opacity: typed > 0 ? 1 : 0 }}>
              {QUESTION.slice(0, typed)}
              {typed < QUESTION.length ? <span style={{ display: 'inline-block', width: 3, height: 30, background: WHITE, marginLeft: 3, verticalAlign: -4 }} /> : null}
            </div>
            {thinking ? (
              <div style={{ alignSelf: 'flex-start', display: 'flex', gap: 8, padding: '14px 18px', borderRadius: 14, background: GRAY_100 }}>
                {[0, 1, 2].map((i) => (
                  <span key={i} style={{ width: 9, height: 9, borderRadius: 5, background: GRAY_500, opacity: 0.35 + 0.65 * Math.abs(Math.sin((frame + i * 4) / 3)) }} />
                ))}
              </div>
            ) : null}
            <div style={{ alignSelf: 'flex-start', maxWidth: 880, opacity: a, transform: `translateY(${(1 - a) * 18}px)` }}>
              <div style={{ background: PAPER, borderRadius: 14, padding: '22px 26px', fontSize: 31, lineHeight: 1.4, color: INK }}>{ANSWER}</div>
              <div style={{ marginTop: 12, display: 'inline-flex', alignItems: 'center', gap: 10, fontFamily: MONO, fontSize: 17, fontWeight: 600, letterSpacing: '0.1em', textTransform: 'uppercase', color: EMBER_700, opacity: s, transform: `translateY(${(1 - s) * 10}px)` }}>
                <span style={{ width: 8, height: 8, borderRadius: 4, background: EMBER }} />
                Source : procédure Pose enseignes, mise à jour en mai
              </div>
            </div>
          </div>
        </Card3D>
      </AbsoluteFill>
      <AbsoluteFill style={{ paddingLeft: 1260, paddingRight: 100, justifyContent: 'center' }}>
        <Words text="Une question." start={16} size={88} />
        <div style={{ height: 22 }} />
        <Words text="La bonne réponse, avec sa source." start={82} size={64} color={GRAY_600} weight={600} accent={[5]} lineHeight={1.12} />
      </AbsoluteFill>
    </SceneFrame>
  )
}
