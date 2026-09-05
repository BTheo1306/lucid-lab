import type { ReactNode } from 'react'
import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion'

/** Fades a scene in over its first frames and out over its last ones. */
export function SceneFrame({ length, fadeIn = 8, fadeOut = 12, children }: { length: number; fadeIn?: number; fadeOut?: number; children: ReactNode }) {
  const frame = useCurrentFrame()
  const opacity = interpolate(frame, [0, fadeIn, length - fadeOut, length], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  return <AbsoluteFill style={{ opacity }}>{children}</AbsoluteFill>
}
