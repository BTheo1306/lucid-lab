'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Lock } from 'lucide-react'

import { GRAY_200, GRAY_500, INK, WHITE } from '../tokens'

interface ScaledStageProps {
  width: number
  height: number
  children: ReactNode
  className?: string
}

/**
 * Renders children at a fixed design size and scales them down to fit the
 * container. The wrapper takes the scaled size so the layout stays honest.
 */
export function ScaledStage({ width, height, children, className = '' }: ScaledStageProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new ResizeObserver((entries) => {
      const rect = entries[0]?.contentRect
      if (!rect) return
      const next = Math.min(1, rect.width / width, rect.height / height)
      setScale(Number.isFinite(next) && next > 0 ? next : 1)
    })
    observer.observe(el)
    return () => observer.disconnect()
  }, [width, height])

  return (
    <div ref={ref} className={`flex h-full w-full min-w-0 items-start justify-center overflow-hidden ${className}`}>
      <div style={{ width: width * scale, height: height * scale }}>
        <div style={{ width, height, transform: `scale(${scale})`, transformOrigin: 'top left' }}>{children}</div>
      </div>
    </div>
  )
}

interface BrowserFrameProps {
  url: string
  width?: number
  height?: number
  children: ReactNode
}

export function BrowserFrame({ url, width = 1280, height = 800, children }: BrowserFrameProps) {
  return (
    <div
      className="flex flex-col overflow-hidden rounded-[10px] border"
      style={{ width, height, borderColor: GRAY_200, background: WHITE, boxShadow: '0 1px 0 rgba(10,10,10,0.04)' }}
    >
      <div className="flex h-11 shrink-0 items-center gap-3 border-b px-4" style={{ borderColor: GRAY_200, background: '#FAFAF8' }}>
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#D4D4D4' }} />
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#D4D4D4' }} />
          <span className="h-2.5 w-2.5 rounded-full" style={{ background: '#D4D4D4' }} />
        </div>
        <div
          className="mx-auto flex h-7 w-[46%] items-center justify-center gap-1.5 rounded-[6px] border font-mono text-[12px]"
          style={{ borderColor: GRAY_200, background: WHITE, color: GRAY_500 }}
        >
          <Lock size={11} aria-hidden="true" />
          <span>{url}</span>
        </div>
      </div>
      <div className="relative min-h-0 flex-1 overflow-hidden">{children}</div>
    </div>
  )
}

interface PhoneFrameProps {
  time: string
  width?: number
  height?: number
  children: ReactNode
  dark?: boolean
}

export function PhoneFrame({ time, width = 390, height = 780, children, dark = false }: PhoneFrameProps) {
  return (
    <div
      className="relative flex flex-col overflow-hidden rounded-[40px] border-[8px]"
      style={{ width, height, borderColor: INK, background: dark ? INK : WHITE }}
    >
      <div className="absolute left-1/2 top-2 z-10 h-6 w-28 -translate-x-1/2 rounded-full" style={{ background: INK }} aria-hidden="true" />
      <div
        className="flex h-12 shrink-0 items-end justify-between px-7 pb-1 font-mono text-[12px] font-semibold"
        style={{ color: dark ? WHITE : INK }}
      >
        <span>{time}</span>
        <span aria-hidden="true" className="flex items-center gap-1">
          <span className="inline-block h-2.5 w-4 rounded-[2px] border" style={{ borderColor: dark ? WHITE : INK }} />
        </span>
      </div>
      <div className="relative min-h-0 flex-1 overflow-hidden">{children}</div>
    </div>
  )
}
