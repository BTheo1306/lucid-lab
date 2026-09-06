import type { CSSProperties, ReactNode } from 'react'

import { GRAY_200, WHITE } from '../tokens'

interface Card3DProps {
  width: number
  height: number
  x: number
  y: number
  rotateX?: number
  rotateY?: number
  rotateZ?: number
  scale?: number
  opacity?: number
  children?: ReactNode
  radius?: number
  shadow?: boolean
  style?: CSSProperties
}

/** A flat card placed in a 3D scene (the parent must set perspective). */
export function Card3D({ width, height, x, y, rotateX = 0, rotateY = 0, rotateZ = 0, scale = 1, opacity = 1, children, radius = 14, shadow = true, style }: Card3DProps) {
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top: y,
        width,
        height,
        borderRadius: radius,
        background: WHITE,
        border: `1px solid ${GRAY_200}`,
        overflow: 'hidden',
        opacity,
        transformStyle: 'preserve-3d',
        transform: `translateZ(0) rotateX(${rotateX}deg) rotateY(${rotateY}deg) rotateZ(${rotateZ}deg) scale(${scale})`,
        boxShadow: shadow ? '0 40px 90px rgba(10,10,10,0.14), 0 6px 18px rgba(10,10,10,0.06)' : 'none',
        ...style,
      }}
    >
      {children}
    </div>
  )
}
