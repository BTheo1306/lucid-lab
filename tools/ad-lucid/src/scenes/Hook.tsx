import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'

import { Label } from '../ui/Label'
import { Words } from '../ui/Words'
import { SceneFrame } from './SceneFrame'

export function Hook({ length }: { length: number }) {
  const frame = useCurrentFrame()
  // A slow push-in keeps the still typography alive.
  const push = interpolate(frame, [0, length], [1, 1.05], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return (
    <SceneFrame length={length}>
      <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center', transform: `scale(${push})` }}>
        <Label text="Lucid-Lab · Agence IA" start={4} end={length - 14} size={22} />
        <div style={{ height: 44 }} />
        <Words text="Votre entreprise" start={10} end={length - 14} size={150} align="center" />
        <Words text="sait déjà tout." start={32} end={length - 14} size={150} align="center" accent={[2]} />
      </AbsoluteFill>
    </SceneFrame>
  )
}
