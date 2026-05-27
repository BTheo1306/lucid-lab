"use client"

import React, { useEffect, useMemo, useState } from "react"
import { getDictionary, type Locale } from "@/lib/i18n/client"

export const TIDYCAL_URL = "https://tidycal.com/lucid-lab/audit-flash-30-minutes"

export type BookingSlotSelection = {
  startsAt: string
  timezone: string
  date: string
  time: string
  label: string
}

type TidyCalApiSlot = {
  starts_at: string
  ends_at?: string
  available_bookings?: number
}

type SlotsState = 'loading' | 'ready' | 'error'

function getBrowserTimezone() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Paris'
}

function normalizeIsoForDate(value: string) {
  return value.replace(/\.(\d{3})\d*(Z|[+-]\d{2}:?\d{2})$/, '.$1$2')
}

function parseSlotDate(value: string) {
  const date = new Date(normalizeIsoForDate(value))
  if (Number.isNaN(date.getTime())) throw new Error(`Invalid slot date: ${value}`)
  return date
}

function formatDateKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function dateKeyForDay(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function formatTime(date: Date, localeTag: string) {
  return new Intl.DateTimeFormat(localeTag, {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(date)
}

function toTidyCalQueryParam(date: Date) {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z')
}

function buildSlotSelection(slot: TidyCalApiSlot, localeTag: string): BookingSlotSelection {
  const startsAt = parseSlotDate(slot.starts_at)
  const date = formatDateKey(startsAt)
  const time = formatTime(startsAt, localeTag)

  return {
    startsAt: slot.starts_at,
    timezone: getBrowserTimezone(),
    date,
    time,
    label: `${date} ${time}`,
  }
}

export function CustomCalendarWidget({
  lang = 'fr',
  onSlotSelect,
  disabled = false,
  selectedSlotLabel,
}: {
  lang?: Locale
  onSlotSelect?: (slot: BookingSlotSelection) => void
  disabled?: boolean
  selectedSlotLabel?: string | null
}) {
  const t = getDictionary(lang).booking
  const localeTag = lang === 'en' ? 'en-US' : 'fr-FR'
  const NOW = useMemo(() => new Date(), [])
  const DAY_NAMES_MOBILE = t.daysShort
  const DAY_NAMES_DESKTOP = t.daysLong
  const liveOn = lang === 'en' ? 'Live on TidyCal' : 'En direct sur TidyCal'
  const loadingSlots = lang === 'en' ? 'Loading availability...' : 'Chargement des disponibilités...'
  const slotsError = lang === 'en' ? 'Availability is temporarily unavailable' : 'Disponibilités temporairement indisponibles'
  const [viewYear, setViewYear] = useState(NOW.getFullYear())
  const [viewMonth, setViewMonth] = useState(NOW.getMonth())
  const [selectedDay, setSelectedDay] = useState(NOW.getDate())
  const [apiSlots, setApiSlots] = useState<TidyCalApiSlot[]>([])
  const [slotsState, setSlotsState] = useState<SlotsState>('loading')

  useEffect(() => {
    const controller = new AbortController()
    const firstVisibleDay = new Date(viewYear, viewMonth, 1, 0, 0, 0, 0)
    const now = new Date()
    const startsAt = firstVisibleDay > now ? firstVisibleDay : now
    const endsAt = new Date(viewYear, viewMonth + 1, 1, 0, 0, 0, 0)

    async function loadSlots() {
      setSlotsState('loading')
      setApiSlots([])

      try {
        const params = new URLSearchParams({
          starts_at: toTidyCalQueryParam(startsAt),
          ends_at: toTidyCalQueryParam(endsAt),
        })
        const res = await fetch(`/api/bot/booking/slots?${params.toString()}`, {
          signal: controller.signal,
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)

        const data = (await res.json()) as { slots?: TidyCalApiSlot[] }
        setApiSlots(Array.isArray(data.slots) ? data.slots : [])
        setSlotsState('ready')
      } catch (error) {
        if ((error as Error).name === 'AbortError') return
        console.error('[booking-calendar] slot lookup failed:', error)
        setApiSlots([])
        setSlotsState('error')
      }
    }

    void loadSlots()

    return () => controller.abort()
  }, [viewMonth, viewYear])

  const { monthLabel, firstDayOfWeek, daysInMonth } = useMemo(() => ({
    monthLabel: new Date(viewYear, viewMonth, 1).toLocaleString(localeTag, { month: "long" }),
    firstDayOfWeek: new Date(viewYear, viewMonth, 1).getDay(),
    daysInMonth: new Date(viewYear, viewMonth + 1, 0).getDate(),
  }), [viewYear, viewMonth, localeTag])

  const isCurrentMonth = viewYear === NOW.getFullYear() && viewMonth === NOW.getMonth()
  const isPast = (day: number) => isCurrentMonth && day < NOW.getDate()

  const slotsByDate = useMemo(() => {
    const groups = new Map<string, BookingSlotSelection[]>()

    for (const apiSlot of apiSlots) {
      if (!apiSlot.starts_at || apiSlot.available_bookings === 0) continue

      try {
        const slot = buildSlotSelection(apiSlot, localeTag)
        const existing = groups.get(slot.date) ?? []
        existing.push(slot)
        groups.set(slot.date, existing)
      } catch {
        continue
      }
    }

    for (const group of groups.values()) {
      group.sort((a, b) => a.startsAt.localeCompare(b.startsAt))
    }

    return groups
  }, [apiSlots, localeTag])

  const availableDayKeys = useMemo(() => Array.from(slotsByDate.keys()).sort(), [slotsByDate])
  const selectedDateKey = dateKeyForDay(viewYear, viewMonth, selectedDay)

  useEffect(() => {
    if (slotsState !== 'ready' || availableDayKeys.includes(selectedDateKey)) return

    const firstAvailableDay = availableDayKeys.find((key) => {
      const [year, month] = key.split('-').map(Number)
      return year === viewYear && month === viewMonth + 1
    })

    if (firstAvailableDay) {
      setSelectedDay(Number(firstAvailableDay.slice(-2)))
    }
  }, [availableDayKeys, selectedDateKey, slotsState, viewMonth, viewYear])

  const isSelectable = (day: number) => !isPast(day) && slotsByDate.has(dateKeyForDay(viewYear, viewMonth, day))

  const prevMonth = () => {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1) }
    else setViewMonth(m => m - 1)
    setSelectedDay(1)
  }
  const nextMonth = () => {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1) }
    else setViewMonth(m => m + 1)
    setSelectedDay(1)
  }

  const slots = slotsByDate.get(selectedDateKey) ?? []
  const selDayLabel = selectedDay
    ? new Date(viewYear, viewMonth, selectedDay).toLocaleDateString(localeTag, { weekday: "long", day: "numeric" })
    : null

  return (
    <div className="rounded-2xl border border-[#e5e5e5] bg-white p-3 sm:p-5 md:p-6 shadow-sm w-full relative">
      <div className="flex items-center justify-between mb-5">
        <button type="button" onClick={prevMonth} disabled={isCurrentMonth || disabled} className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed">‹</button>
        <span className="text-sm font-semibold text-zinc-800 capitalize">{monthLabel} {viewYear}</span>
        <button type="button" onClick={nextMonth} disabled={disabled} className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed">›</button>
      </div>

      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {DAY_NAMES_MOBILE.map((d, i) => (
          <div key={i} className="text-center py-1">
            <span className="sm:hidden text-[9px] font-semibold uppercase text-zinc-400">{d}</span>
            <span className="hidden sm:inline text-[10px] font-semibold uppercase tracking-wide text-zinc-400">{DAY_NAMES_DESKTOP[i]}</span>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {Array(firstDayOfWeek).fill(null).map((_, i) => <div key={`empty-${i}`} />)}
        {Array(daysInMonth).fill(null).map((_, i) => {
          const day = i + 1
          const isToday = isCurrentMonth && day === NOW.getDate()
          const isSelected = day === selectedDay
          const selectable = isSelectable(day)

          let cls = "flex h-7 w-full mx-auto items-center justify-center rounded-md text-[11px] sm:text-xs font-medium transition-colors "
          if (isSelected && selectable) cls += "bg-zinc-900 text-white"
          else if (!selectable) cls += isToday ? "ring-2 ring-zinc-200 text-zinc-300 cursor-not-allowed" : "text-zinc-300 cursor-not-allowed"
          else if (isToday && !isSelected) cls += "ring-2 ring-zinc-900 text-zinc-900 cursor-pointer hover:bg-zinc-100"
          else cls += "text-zinc-700 hover:bg-zinc-100 cursor-pointer"

          return (
            <div key={day} className={cls} onClick={() => selectable && setSelectedDay(day)}>
              {day}
            </div>
          )
        })}
      </div>

      <div className="mt-5 border-t border-[#e5e5e5] pt-5">
        <div className="flex justify-between items-center mb-3">
           <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-800 capitalize">
             {selDayLabel ?? t.selectDay}
           </p>
           {slotsState === 'loading' ? <p className="text-[9px] text-zinc-400">{loadingSlots}</p> : null}
           {slotsState === 'ready' && slots.length > 0 ? <p className="text-[9px] text-zinc-400">{liveOn}</p> : null}
        </div>
        
        {slots.length === 0 ? (
          <p className="text-[13px] text-zinc-400 py-2">
            {slotsState === 'loading' ? loadingSlots : slotsState === 'error' ? slotsError : t.noSlots}
          </p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {slots.map((slot) => {
              const isSelectedSlot = selectedSlotLabel === slot.label
              const slotClassName = `flex flex-col items-center justify-center rounded-lg border py-1.5 text-zinc-700 transition-colors ${isSelectedSlot ? 'border-zinc-900 bg-zinc-900 text-white' : 'border-[#e5e5e5] hover:bg-zinc-900 hover:text-white hover:border-zinc-900'}`

              if (onSlotSelect) {
                return (
                  <button
                    key={slot.startsAt}
                    type="button"
                    disabled={disabled}
                    onClick={() => onSlotSelect(slot)}
                    className={`${slotClassName} disabled:cursor-wait disabled:opacity-60`}
                  >
                    <span className="text-[12px] font-semibold tracking-tight">{slot.time}</span>
                  </button>
                )
              }

              return (
                <a
                  key={slot.startsAt}
                  href={`${TIDYCAL_URL}?date=${slot.date}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={slotClassName}
                >
                  <span className="text-[12px] font-semibold tracking-tight">{slot.time}</span>
                </a>
              )
            })}
          </div>
        )}
      </div>

      <div className="mt-5 pt-4 flex flex-col sm:flex-row items-center justify-between border-t border-zinc-100">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-[11px] text-zinc-400">
            <span className="inline-block h-2 w-2 rounded-full ring-2 ring-zinc-900" /> {t.today}
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-zinc-400">
             <span className="inline-block h-2 w-2 rounded-full bg-zinc-900" /> {t.selected}
          </span>
        </div>
        <a 
          href={TIDYCAL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] font-medium text-blue-600 hover:text-blue-800 mt-3 sm:mt-0"
        >
          {t.openCalendar}
        </a>
      </div>
    </div>
  )
}

export function BookingSection({ lang = 'fr' }: { lang?: Locale } = {}) {
  const t = getDictionary(lang).booking
  return (
    <section id="booking" className="w-full border-b border-[#e5e5e5]">
      <div
        className="mx-auto max-w-[1264px] border-x border-[#e5e5e5]"
        style={{ position: 'relative', overflow: 'hidden' }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background: 'radial-gradient(84.42% 84.32% at 51.63% 100%, #FFB451 0%, #EFC680 24.76%, #B4D8FF 47.6%, #D2E8FF 75%, #FAFDFF 100%)',
          }}
        />
        <div className="relative px-6 py-12 md:px-[48px] md:py-[100px]">
          <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-[1fr_1fr] lg:gap-20">

            {/* ── Left: copy ── */}
            <div className="flex flex-col gap-6">
              <p className="text-sm font-medium text-zinc-400">{t.label}</p>

              <h2 className="text-[28px] font-semibold tracking-tight text-zinc-900 leading-[1.1] md:text-[40px]">
                {t.headlineLine1}
                <br />
                {t.headlineLine2}
              </h2>

              <p className="text-[16px] leading-[1.65] text-zinc-500">
                {t.subtitle}
              </p>

              <ul className="flex flex-col gap-2.5 mt-2 mb-2">
                {t.checklist.map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-[13.5px] text-zinc-600">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white text-[9px] font-bold">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

            {/* ── Right: Custom Calendar UI ── */}
            <div className="w-full flex justify-center">
              <CustomCalendarWidget lang={lang} />
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}
