'use client'

import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

import { ATELIER, TODAY } from '@/lib/demo/atelier/identity'

import { EASE, EMBER, EMBER_700, GRAY_100, GRAY_200, GRAY_500, GRAY_600, INK, PAPER, WHITE } from '../../atelier/tokens'

/** Mono uppercase label, the brand kit's "label" style. */
export function Label({ children, tone = 'muted', className = '' }: { children: ReactNode; tone?: 'muted' | 'ember' | 'ink'; className?: string }) {
  const color = tone === 'ember' ? EMBER_700 : tone === 'ink' ? INK : GRAY_500
  return (
    <span className={`font-mono text-[11.5px] font-semibold uppercase tracking-[0.14em] ${className}`} style={{ color }}>
      {children}
    </span>
  )
}

/** Fade and lift on `show`, with an optional stagger. */
export function Rise({ show, delay = 0, children, className = '', style }: { show: boolean; delay?: number; children: ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <motion.div
      initial={false}
      animate={show ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
      transition={{ duration: 0.6, ease: EASE, delay: show ? delay : 0 }}
      className={className}
      style={{ ...style, pointerEvents: show ? undefined : 'none' }}
      aria-hidden={!show}
    >
      {children}
    </motion.div>
  )
}

const SECTIONS = ['Demandes', 'Boîte du matin', 'Ma journée', 'Atelier', 'Comptes rendus', 'Commandes', 'Factures'] as const
export type SectionName = (typeof SECTIONS)[number]

/**
 * The workshop's application, film version: a slim top bar with the sections as
 * tabs, the whole width for the content. No sidebar, no user switcher.
 */
export function AppFrame({ active, title, meta, children }: { active: SectionName; title: string; meta?: string; children: ReactNode }) {
  return (
    <div className="flex h-full w-full flex-col" style={{ background: WHITE, color: INK }}>
      <div className="flex h-14 shrink-0 items-center gap-8 border-b px-10" style={{ borderColor: GRAY_200 }}>
        <div className="flex items-center gap-2.5">
          <span className="flex h-7 w-7 items-center justify-center rounded-[5px] text-[11px] font-bold" style={{ background: INK, color: WHITE }}>
            AB
          </span>
          <span className="text-[14px] font-semibold">{ATELIER.shortName}</span>
        </div>
        <nav aria-label="Sections" className="flex h-full items-stretch gap-6">
          {SECTIONS.map((s) => {
            const isActive = s === active
            return (
              <span key={s} className="relative flex items-center text-[13.5px]" style={{ color: isActive ? INK : GRAY_500, fontWeight: isActive ? 600 : 500 }}>
                {s}
                {isActive ? <span className="absolute inset-x-0 -bottom-px h-[2px]" style={{ background: EMBER }} aria-hidden="true" /> : null}
              </span>
            )
          })}
        </nav>
        <span className="ml-auto font-mono text-[12px]" style={{ color: GRAY_500 }}>
          {TODAY.long}
        </span>
      </div>
      <div className="flex shrink-0 items-baseline gap-4 px-10 pb-4 pt-6">
        <h1 className="text-[24px] font-bold tracking-[-0.01em]">{title}</h1>
        {meta ? (
          <span className="text-[13.5px]" style={{ color: GRAY_600 }}>
            {meta}
          </span>
        ) : null}
      </div>
      <div className="relative min-h-0 flex-1 px-10 pb-8">{children}</div>
    </div>
  )
}

export function Card({ children, className = '', style, muted = false }: { children: ReactNode; className?: string; style?: React.CSSProperties; muted?: boolean }) {
  return (
    <div className={`rounded-[8px] border ${className}`} style={{ borderColor: GRAY_200, background: muted ? PAPER : WHITE, ...style }}>
      {children}
    </div>
  )
}

export function Tile({ label, value, accent = false }: { label: string; value: ReactNode; accent?: boolean }) {
  return (
    <Card className="px-5 py-4">
      <Label>{label}</Label>
      <div className="mt-2 text-[34px] font-bold leading-none tabular-nums tracking-[-0.02em]" style={{ color: accent ? EMBER_700 : INK }}>
        {value}
      </div>
    </Card>
  )
}

/** Neutral status text with a small dot, ember when highlighted. */
export function Status({ children, highlight = false }: { children: ReactNode; highlight?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap font-mono text-[11.5px] font-semibold uppercase tracking-[0.1em]" style={{ color: highlight ? EMBER_700 : GRAY_600 }}>
      <span className="inline-block h-1.5 w-1.5 rounded-full" style={{ background: highlight ? EMBER : GRAY_500 }} aria-hidden="true" />
      {children}
    </span>
  )
}

export function Button({ children, primary = false, pressed = false, disabled = false }: { children: ReactNode; primary?: boolean; pressed?: boolean; disabled?: boolean }) {
  return (
    <span
      className="inline-flex h-10 items-center gap-2 rounded-[6px] border px-4 text-[14px] font-semibold"
      style={{
        background: primary ? (pressed ? EMBER : INK) : WHITE,
        color: primary ? WHITE : INK,
        borderColor: primary ? (pressed ? EMBER : INK) : GRAY_200,
        opacity: disabled ? 0.45 : 1,
        transform: pressed ? 'scale(0.98)' : undefined,
      }}
    >
      {children}
    </span>
  )
}

/** Fake read-only input. */
export function Field({ label, children, focused = false, wide = false }: { label: string; children: ReactNode; focused?: boolean; wide?: boolean }) {
  return (
    <div className={wide ? 'col-span-2' : ''}>
      <Label>{label}</Label>
      <div
        role="textbox"
        aria-readonly="true"
        className="mt-1.5 flex h-12 items-center rounded-[6px] border px-3.5 text-[15px]"
        style={{ borderColor: focused ? INK : GRAY_200, background: WHITE, color: INK, boxShadow: focused ? `0 0 0 3px ${GRAY_100}` : 'none' }}
      >
        {children}
      </div>
    </div>
  )
}

/** The one-line grammar of a poste, ember on the stage marker only. */
export function PosteLine({ line, className = '' }: { line: string; className?: string }) {
  return (
    <span className={`font-mono text-[14px] ${className}`} style={{ color: INK }}>
      {line.split(' ').map((part, i, arr) => {
        const sep = i < arr.length - 1 ? ' ' : ''
        const marked = part.startsWith('#')
        const dim = /^[@~%]/.test(part)
        return (
          <span key={`${part}-${i}`} style={{ color: marked ? EMBER_700 : dim ? GRAY_600 : INK, fontWeight: marked || dim ? 600 : 400 }}>
            {part}
            {sep}
          </span>
        )
      })}
    </span>
  )
}

export const TH = 'px-4 py-3 text-left font-mono text-[11.5px] font-semibold uppercase tracking-[0.12em]'
