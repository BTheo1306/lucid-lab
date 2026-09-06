import { interpolate, spring } from 'remotion'

import { FPS } from './tokens'

/** 0 to 1, springs in from `start` frame. Calm, no overshoot. */
export function enter(frame: number, start: number, options: { damping?: number; stiffness?: number; mass?: number } = {}): number {
  return spring({ frame: frame - start, fps: FPS, config: { damping: options.damping ?? 200, stiffness: options.stiffness ?? 90, mass: options.mass ?? 1 } })
}

/** 1 to 0 over `length` frames starting at `start`. */
export function exit(frame: number, start: number, length = 12): number {
  return interpolate(frame, [start, start + length], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
}

/** Ease-out value between two frames. */
export function ease(frame: number, from: number, to: number, a: number, b: number): number {
  return interpolate(frame, [from, to], [a, b], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: (t) => 1 - Math.pow(1 - t, 3) })
}

export function clamp01(v: number): number {
  return Math.min(1, Math.max(0, v))
}
