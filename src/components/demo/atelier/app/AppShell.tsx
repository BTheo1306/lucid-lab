'use client'

import type { ReactNode } from 'react'
import { Inbox, Mail, PenLine, PhoneIncoming, Receipt, Scissors, Search, Sun, Truck } from 'lucide-react'

import { ATELIER, PEOPLE, TODAY } from '@/lib/demo/atelier/identity'
import type { Person } from '@/lib/demo/atelier/types'

import { EMBER, GRAY_100, GRAY_200, GRAY_500, GRAY_600, INK, WHITE } from '../tokens'

export type NavId = 'demandes' | 'journee' | 'boite' | 'atelier' | 'comptes-rendus' | 'commandes' | 'factures' | 'maquettes'

const NAV: { id: NavId; label: string; icon: typeof Inbox }[] = [
  { id: 'journee', label: 'Ma journée', icon: Sun },
  { id: 'boite', label: 'Boîte du matin', icon: Mail },
  { id: 'demandes', label: 'Demandes', icon: Inbox },
  { id: 'atelier', label: 'Atelier', icon: Scissors },
  { id: 'comptes-rendus', label: 'Comptes rendus', icon: PhoneIncoming },
  { id: 'commandes', label: 'Commandes', icon: Truck },
  { id: 'factures', label: 'Factures', icon: Receipt },
  { id: 'maquettes', label: 'Maquettes', icon: PenLine },
]

interface AppShellProps {
  active: NavId
  user?: Person
  /** Counter pills next to a nav entry. */
  counters?: Partial<Record<NavId, number>>
  /** Small line under the nav, e.g. "1 compte rendu à traiter". */
  notice?: string
  title: string
  subtitle?: string
  headerRight?: ReactNode
  children: ReactNode
}

export function AppShell({ active, user = 'claire', counters = {}, notice, title, subtitle, headerRight, children }: AppShellProps) {
  const person = PEOPLE[user]
  const items = user === 'lea' ? NAV.filter((n) => n.id === 'maquettes') : NAV.filter((n) => n.id !== 'maquettes')

  return (
    <div className="flex h-full w-full" style={{ background: WHITE, color: INK }}>
      <aside className="flex w-[220px] shrink-0 flex-col border-r" style={{ borderColor: GRAY_200, background: '#FAFAF8' }}>
        <div className="flex h-14 items-center gap-2.5 px-4">
          <span className="flex h-7 w-7 items-center justify-center rounded-[6px] text-[12px] font-bold text-white" style={{ background: INK }}>
            AB
          </span>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-[13px] font-semibold">{ATELIER.shortName}</div>
            <div className="truncate text-[11px]" style={{ color: GRAY_500 }}>
              Signalétique
            </div>
          </div>
        </div>
        <nav aria-label="Navigation de l'application" className="mt-1 flex flex-col gap-0.5 px-2">
          {items.map((item) => {
            const Icon = item.icon
            const isActive = item.id === active
            const count = counters[item.id]
            return (
              <div
                key={item.id}
                aria-current={isActive ? 'page' : undefined}
                className="flex h-9 items-center gap-2.5 rounded-[6px] px-2.5 text-[13px]"
                style={{ background: isActive ? WHITE : 'transparent', fontWeight: isActive ? 600 : 500, color: isActive ? INK : GRAY_600, boxShadow: isActive ? `inset 0 0 0 1px ${GRAY_200}` : 'none' }}
              >
                <Icon size={15} aria-hidden="true" style={{ color: isActive ? EMBER : GRAY_500 }} />
                <span className="flex-1">{item.label}</span>
                {typeof count === 'number' ? (
                  <span
                    className="flex h-5 min-w-5 items-center justify-center rounded-full px-1.5 font-mono text-[11px] font-semibold"
                    style={{ background: isActive ? INK : GRAY_100, color: isActive ? WHITE : GRAY_600 }}
                  >
                    {count}
                  </span>
                ) : null}
              </div>
            )
          })}
        </nav>
        {notice ? (
          <div className="mx-3 mt-3 rounded-[6px] border px-2.5 py-2 text-[11.5px] leading-snug" style={{ borderColor: GRAY_200, background: WHITE, color: GRAY_600 }}>
            {notice}
          </div>
        ) : null}
        <div className="mt-auto flex items-center gap-2.5 border-t px-4 py-3" style={{ borderColor: GRAY_200 }}>
          <span className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold" style={{ background: GRAY_100, color: INK }}>
            {person.initials}
          </span>
          <div className="min-w-0 leading-tight">
            <div className="truncate text-[12.5px] font-medium">
              {person.firstName} {person.lastName}
            </div>
            <div className="truncate text-[11px]" style={{ color: GRAY_500 }}>
              {person.role}
            </div>
          </div>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center gap-4 border-b px-6" style={{ borderColor: GRAY_200 }}>
          <div className="min-w-0">
            <h1 className="truncate text-[15px] font-semibold leading-tight">{title}</h1>
            {subtitle ? (
              <div className="truncate text-[11.5px]" style={{ color: GRAY_500 }}>
                {subtitle}
              </div>
            ) : null}
          </div>
          <div className="ml-auto flex items-center gap-3">
            {headerRight}
            <div className="flex h-8 w-56 items-center gap-2 rounded-[6px] border px-2.5 text-[12px]" style={{ borderColor: GRAY_200, color: GRAY_500 }}>
              <Search size={13} aria-hidden="true" />
              <span>Rechercher un client, un poste</span>
            </div>
            <span className="font-mono text-[11.5px]" style={{ color: GRAY_500 }}>
              {TODAY.long}
            </span>
          </div>
        </header>
        <main className="relative min-h-0 flex-1 overflow-hidden p-6">{children}</main>
      </div>
    </div>
  )
}

export function Panel({ title, children, className = '', right }: { title?: string; children: ReactNode; className?: string; right?: ReactNode }) {
  return (
    <section className={`rounded-[8px] border ${className}`} style={{ borderColor: GRAY_200, background: WHITE }}>
      {title ? (
        <header className="flex items-center justify-between border-b px-4 py-2.5" style={{ borderColor: GRAY_200 }}>
          <h2 className="text-[12px] font-semibold uppercase tracking-[0.08em]" style={{ color: GRAY_600 }}>
            {title}
          </h2>
          {right}
        </header>
      ) : null}
      <div className="p-4">{children}</div>
    </section>
  )
}

export function StatTile({ label, value, accent = false }: { label: string; value: ReactNode; accent?: boolean }) {
  return (
    <div className="rounded-[8px] border px-4 py-3" style={{ borderColor: GRAY_200, background: WHITE }}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.08em]" style={{ color: GRAY_500 }}>
        {label}
      </div>
      <div className="mt-1 text-[26px] font-bold leading-none tabular-nums" style={{ color: accent ? EMBER : INK }}>
        {value}
      </div>
    </div>
  )
}

export function AppButton({ children, primary = false, disabled = false, onClick, small = false }: { children: ReactNode; primary?: boolean; disabled?: boolean; onClick?: () => void; small?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-[6px] border font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-45 ${small ? 'h-7 px-2 text-[12px]' : 'h-8 px-3 text-[12.5px]'}`}
      style={{ background: primary ? INK : WHITE, color: primary ? WHITE : INK, borderColor: primary ? INK : GRAY_200 }}
    >
      {children}
    </button>
  )
}
