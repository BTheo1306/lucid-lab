'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useAnimate } from 'framer-motion'

import { GRAY_200, WHITE } from '../../atelier/tokens'

export const DESIGN_W = 1440
export const DESIGN_H = 900
const MAX_ZOOM = 2.4
const PAD = 0.1

export interface Shot {
  /** data-region id to frame, or 'full' to pull back. */
  region: string
  zoom?: number
  anchor?: 'left' | 'center' | 'right'
}

interface CameraProps {
  shot: Shot
  reduced: boolean
  children: ReactNode
}

export const FULL_SHOT: Shot = { region: 'full' }

/**
 * Renders the screen at a fixed design size, fits it to the available space, and
 * moves a virtual camera towards the region named by `shot` (slow zoom and pan).
 * Regions are measured in the DOM, so screens only need `data-region` attributes.
 */
export function Camera({ shot, reduced, children }: CameraProps) {
  const outerRef = useRef<HTMLDivElement>(null)
  const [fit, setFit] = useState(1)
  const [scope, animate] = useAnimate()

  useEffect(() => {
    const el = outerRef.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect
      if (!rect) return
      const next = Math.min(1, rect.width / DESIGN_W, rect.height / DESIGN_H)
      setFit(Number.isFinite(next) && next > 0 ? next : 1)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const layer = scope.current as HTMLElement | null
    if (!layer) return
    let target = { x: 0, y: 0, scale: 1 }
    if (shot.region !== 'full') {
      const region = layer.querySelector<HTMLElement>(`[data-region="${shot.region}"]`)
      if (region) {
        const layerRect = layer.getBoundingClientRect()
        const rect = region.getBoundingClientRect()
        const k = layerRect.width / DESIGN_W
        const rx = (rect.left - layerRect.left) / k
        const ry = (rect.top - layerRect.top) / k
        const rw = rect.width / k
        const rh = rect.height / k
        const fitted = Math.min(DESIGN_W / (rw * (1 + 2 * PAD)), DESIGN_H / (rh * (1 + 2 * PAD)))
        const scale = Math.min(MAX_ZOOM, Math.max(1, shot.zoom ?? fitted))
        const focus = shot.anchor === 'left' ? 0.3 : shot.anchor === 'right' ? 0.7 : 0.5
        const cx = rx + rw * focus
        const cy = ry + rh / 2
        const x = Math.min(0, Math.max(DESIGN_W - DESIGN_W * scale, DESIGN_W / 2 - scale * cx))
        const y = Math.min(0, Math.max(DESIGN_H - DESIGN_H * scale, DESIGN_H / 2 - scale * cy))
        target = { x, y, scale }
      }
    }
    animate(layer, target, { duration: reduced ? 0 : 1.5, ease: [0.22, 1, 0.36, 1] })
  }, [shot.region, shot.zoom, shot.anchor, reduced, animate, scope])

  return (
    <div ref={outerRef} className="flex h-full w-full min-w-0 items-center justify-center overflow-hidden">
      <div
        className="relative overflow-hidden rounded-[8px] border"
        style={{ width: DESIGN_W * fit, height: DESIGN_H * fit, borderColor: GRAY_200, background: WHITE }}
      >
        <div style={{ width: DESIGN_W, height: DESIGN_H, transform: `scale(${fit})`, transformOrigin: '0 0' }}>
          <div ref={scope} style={{ width: DESIGN_W, height: DESIGN_H, transformOrigin: '0 0', willChange: 'transform' }}>
            {children}
          </div>
        </div>
      </div>
    </div>
  )
}

/** Marks a zone of the screen the camera can frame. */
export function Region({ id, children, className, style }: { id: string; children: ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div data-region={id} className={className} style={style}>
      {children}
    </div>
  )
}
