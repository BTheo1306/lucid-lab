import type { Ball, InvoiceStatus, Stage, Trade } from '@/lib/demo/atelier/types'
import { BALL_LABEL, STAGE_LABEL } from '@/lib/demo/atelier/postes'
import { TRADE_LABEL } from '@/lib/demo/atelier/lead'
import { INVOICE_STATUS_LABEL } from '@/lib/demo/atelier/invoices'

import { BAD, BAD_TINT, EMBER_700, EMBER_TINT, GOOD, GOOD_TINT, GRAY_100, GRAY_200, GRAY_600, GRAY_700, INK, WARN, WARN_TINT } from '../tokens'

type Tone = 'neutral' | 'ember' | 'good' | 'warn' | 'bad' | 'ink'

const TONE: Record<Tone, { bg: string; fg: string; border: string }> = {
  neutral: { bg: GRAY_100, fg: GRAY_700, border: GRAY_200 },
  ember: { bg: EMBER_TINT, fg: EMBER_700, border: 'rgba(200,94,26,0.25)' },
  good: { bg: GOOD_TINT, fg: GOOD, border: '#BBE5C8' },
  warn: { bg: WARN_TINT, fg: WARN, border: '#F5D9A8' },
  bad: { bg: BAD_TINT, fg: BAD, border: '#F3C2C2' },
  ink: { bg: INK, fg: '#FFFFFF', border: INK },
}

export function Chip({ tone = 'neutral', children, mono = false }: { tone?: Tone; children: React.ReactNode; mono?: boolean }) {
  const t = TONE[tone]
  return (
    <span
      className={`inline-flex h-[22px] items-center whitespace-nowrap rounded-[4px] border px-1.5 text-[11px] font-medium ${mono ? 'font-mono' : ''}`}
      style={{ background: t.bg, color: t.fg, borderColor: t.border }}
    >
      {children}
    </span>
  )
}

const STAGE_TONE: Record<Stage, Tone> = {
  demande: 'neutral',
  devis: 'ember',
  maquette: 'neutral',
  prod: 'ink',
  livraison: 'good',
  facture: 'neutral',
}

export function StageBadge({ stage }: { stage: Stage }) {
  return <Chip tone={STAGE_TONE[stage]}>{STAGE_LABEL[stage]}</Chip>
}

export function LeadStageBadge({ label, tone }: { label: string; tone: Tone }) {
  return <Chip tone={tone}>{label}</Chip>
}

export function TradeBadge({ trade }: { trade: Trade }) {
  return <Chip tone="neutral">{TRADE_LABEL[trade]}</Chip>
}

const BALL_TONE: Record<Ball, Tone> = { dirigeante: 'ink', apprentie: 'neutral', client: 'warn', fournisseur: 'neutral' }

export function BallBadge({ ball }: { ball: Ball }) {
  return <Chip tone={BALL_TONE[ball]}>{BALL_LABEL[ball]}</Chip>
}

const INVOICE_TONE: Record<InvoiceStatus, Tone> = { emise: 'neutral', encaissee: 'good', 'en-attente': 'warn', 'en-retard': 'bad' }

export function InvoiceStatusChip({ status }: { status: InvoiceStatus }) {
  return <Chip tone={INVOICE_TONE[status]}>{INVOICE_STATUS_LABEL[status]}</Chip>
}

export function UrgencyDot({ level }: { level: 0 | 1 | 2 | 3 }) {
  const color = level >= 3 ? BAD : level === 2 ? EMBER_700 : level === 1 ? WARN : GRAY_200
  const label = level >= 3 ? 'aujourd\'hui sans faute' : level === 2 ? 'cette semaine' : level === 1 ? 'à suivre' : 'rien de pressé'
  return <span className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: color }} role="img" aria-label={label} />
}

/** The one-line grammar with each marker coloured: "Titre #devis @claire ~12/09 %imp-bache". */
export function TagLine({ line, className = '' }: { line: string; className?: string }) {
  const parts = line.split(' ')
  return (
    <span className={`font-mono text-[12px] leading-relaxed ${className}`} style={{ color: INK }}>
      {parts.map((part, i) => {
        const key = `${part}-${i}`
        const sep = i < parts.length - 1 ? ' ' : ''
        if (part.startsWith('#')) return <span key={key}><span style={{ color: EMBER_700, fontWeight: 600 }}>{part}</span>{sep}</span>
        if (part.startsWith('@')) return <span key={key}><span style={{ color: GRAY_600, fontWeight: 600 }}>{part}</span>{sep}</span>
        if (part.startsWith('~')) return <span key={key}><span style={{ color: WARN, fontWeight: 600 }}>{part}</span>{sep}</span>
        if (part.startsWith('%')) return <span key={key}><span style={{ color: GOOD, fontWeight: 600 }}>{part}</span>{sep}</span>
        return <span key={key}>{part}{sep}</span>
      })}
    </span>
  )
}
