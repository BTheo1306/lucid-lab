import { AbsoluteFill, Easing, Img, interpolate, staticFile, useCurrentFrame } from 'remotion'

import { enter, exit } from '../motion'
import { EMBER, GRAY_200, WHITE } from '../tokens'
import { Cursor } from '../ui/Cursor'
import { Label } from '../ui/Label'
import { Words } from '../ui/Words'
import { SceneFrame } from './SceneFrame'

// The ring turns one slot per phrase, so screens 0 to 3 face the camera in this order.
const SCREENS = ['reponse', 'demandes', 'commande', 'journee', 'boite', 'facturation', 'compte-rendu', 'formulaire']
const RADIUS = 1150
const CARD_W = 820
const CARD_H = 512
const PERSPECTIVE = 1500
const TILT = 4 // degrees, camera slightly above the ring
// The ring centre sits behind the screen plane; the front card comes forward of it.
const RING_Z = -RADIUS + 320
const ORIGIN_Y = 1080 * 0.4
const RING_Y = 530

// Holds (a screen faces the camera) alternate with 30-frame turns.
const TURN_KEYS = [0, 44, 74, 104, 134, 164, 194, 224, 254, 270]
const TURN_VALUES = [0, 0, 1, 1, 2, 2, 3, 3, 4, 4.15]

const LINES = [
  { text: 'Les demandes reçoivent une réponse.', at: 14, until: 66 },
  { text: 'Le suivi se met à jour.', at: 78, until: 126 },
  { text: 'Les commandes sont rédigées.', at: 138, until: 186 },
  { text: 'On automatise vos opérations.', at: 198, until: 262, accent: [1] },
]

// Where the front card's centre lands on screen, for the cursor.
const FRONT_SCALE = PERSPECTIVE / (PERSPECTIVE - (RING_Z + RADIUS))
const FRONT_CY = ORIGIN_Y + (RING_Y + RADIUS * Math.sin((TILT * Math.PI) / 180) - ORIGIN_Y) * FRONT_SCALE

export function Automation({ length }: { length: number }) {
  const frame = useCurrentFrame()
  const p = enter(frame, 0, { damping: 40, stiffness: 50 })
  const turn = interpolate(frame, TURN_KEYS, TURN_VALUES, { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic) })
  const base = -(turn * 2 * Math.PI) / SCREENS.length
  // The click lands on the second screen while it holds (frames 74 to 104).
  const clickX = 960 + 150 * FRONT_SCALE
  const clickY = FRONT_CY + 40 * FRONT_SCALE
  const cursorP = interpolate(frame, [78, 96], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) })
  const pressed = frame >= 98 && frame <= 104
  const ripple = interpolate(frame, [98, 122], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const cursorOpacity = frame < 78 ? 0 : Math.min(1, cursorP * 3) * exit(frame, 126, 10)

  return (
    <SceneFrame length={length}>
      <AbsoluteFill style={{ perspective: PERSPECTIVE, perspectiveOrigin: `50% ${ORIGIN_Y}px` }}>
        {/* No opacity, filter or overflow on this element: any of them would flatten the 3D scene. */}
        <div style={{ position: 'absolute', left: 960, top: RING_Y, width: 0, height: 0, transformStyle: 'preserve-3d', transform: `translateZ(${RING_Z}px) rotateX(${-TILT}deg)` }}>
          {SCREENS.map((name, i) => {
            const a = base + (i * 2 * Math.PI) / SCREENS.length
            const x = Math.sin(a) * RADIUS
            const z = Math.cos(a) * RADIUS
            const facing = (z + RADIUS) / (2 * RADIUS) // 1 front, 0 back
            return (
              <div
                key={name}
                style={{
                  position: 'absolute',
                  left: -CARD_W / 2,
                  top: -CARD_H / 2,
                  width: CARD_W,
                  height: CARD_H,
                  transform: `translate3d(${x}px, 0px, ${z}px) rotateY(${(a * 180) / Math.PI}deg)`,
                  opacity: p * (0.18 + facing * 0.82),
                  borderRadius: 16,
                  overflow: 'hidden',
                  background: WHITE,
                  border: `1px solid ${GRAY_200}`,
                  boxShadow: facing > 0.7 ? '0 50px 110px rgba(10,10,10,0.18)' : '0 20px 40px rgba(10,10,10,0.05)',
                }}
              >
                <Img src={staticFile(`screens/${name}.png`)} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top left' }} />
              </div>
            )
          })}
        </div>
      </AbsoluteFill>
      <AbsoluteFill style={{ opacity: cursorOpacity }}>
        <Cursor x={interpolate(cursorP, [0, 1], [1560, clickX])} y={interpolate(cursorP, [0, 1], [1010, clickY])} pressed={pressed} size={52} />
        <div style={{ position: 'absolute', left: clickX + 8 - ripple * 60, top: clickY + 6 - ripple * 60, width: 24 + ripple * 120, height: 24 + ripple * 120, borderRadius: 999, border: `3px solid ${EMBER}`, opacity: ripple > 0 ? 1 - ripple : 0 }} />
      </AbsoluteFill>
      <AbsoluteFill style={{ alignItems: 'center', paddingTop: 96 }}>
        <Label text="Automatisation" start={6} color={EMBER} size={22} />
        {LINES.map((l) => (
          <div key={l.text} style={{ position: 'absolute', top: 150, left: 0, right: 0, display: 'flex', justifyContent: 'center', padding: '0 160px' }}>
            {frame >= l.at - 2 && frame <= l.until + 14 ? <Words text={l.text} start={l.at} end={l.until} size={84} align="center" accent={l.accent ?? []} /> : null}
          </div>
        ))}
      </AbsoluteFill>
    </SceneFrame>
  )
}
