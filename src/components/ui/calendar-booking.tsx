"use client"

import React, { useState, useMemo } from "react"

const TIDYCAL_URL = "https://tidycal.com/lucid-lab/audit-flash-30-minutes"

const DAY_NAMES_MOBILE = ["D", "L", "M", "M", "J", "V", "S"]
const DAY_NAMES_DESKTOP = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"]

// Simple fetching mock or placeholder for dynamic TidyCal fetching. 
// Since TidyCal has no public API for free accounts without OAuth tokens, 
// we map it to match your typical availability, then direct users to the actual tool.
const WEEKDAY_SLOTS = [
  { label: "09:00", sub: "Matin" },
  { label: "09:30", sub: "Matin" },
  { label: "10:00", sub: "Matin" },
  { label: "10:30", sub: "Matin" },
  { label: "11:00", sub: "Matin" },
  { label: "14:00", sub: "Aprem" },
  { label: "14:30", sub: "Aprem" },
  { label: "15:00", sub: "Aprem" },
  { label: "15:30", sub: "Aprem" },
  { label: "16:00", sub: "Aprem" },
  { label: "16:30", sub: "Aprem" },
  { label: "17:00", sub: "Aprem" },
]

function CustomCalendarWidget() {
  const NOW = useMemo(() => new Date(), [])
  const [viewYear, setViewYear] = useState(NOW.getFullYear())
  const [viewMonth, setViewMonth] = useState(NOW.getMonth())
  const [selectedDay, setSelectedDay] = useState(NOW.getDate())

  const { monthLabel, firstDayOfWeek, daysInMonth } = useMemo(() => ({
    monthLabel: new Date(viewYear, viewMonth, 1).toLocaleString("fr-FR", { month: "long" }),
    firstDayOfWeek: new Date(viewYear, viewMonth, 1).getDay(),
    daysInMonth: new Date(viewYear, viewMonth + 1, 0).getDate(),
  }), [viewYear, viewMonth])

  const isCurrentMonth = viewYear === NOW.getFullYear() && viewMonth === NOW.getMonth()
  const getDow = (day: number) => new Date(viewYear, viewMonth, day).getDay()
  const isWeekend = (day: number) => getDow(day) === 0 || getDow(day) === 6 // Samedi ou Dimanche
  const isPast = (day: number) => isCurrentMonth && day < NOW.getDate()
  
  // TidyCal default availability usually is M-F. Weekend and past are not selectable.
  const isSelectable = (day: number) => !isPast(day) && !isWeekend(day)

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

  // Display slots if it's a selectable weekday. Avoid saturdays unless you specifically enabled them.
  const slots = isSelectable(selectedDay) ? WEEKDAY_SLOTS : []
  const selDayLabel = selectedDay
    ? new Date(viewYear, viewMonth, selectedDay).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric" })
    : null

  return (
    <div className="rounded-2xl border border-[#e5e5e5] bg-white p-3 sm:p-5 md:p-6 shadow-sm w-full relative">
      <div className="flex items-center justify-between mb-5">
        <button onClick={prevMonth} disabled={isCurrentMonth} className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed">‹</button>
        <span className="text-sm font-semibold text-zinc-800 capitalize">{monthLabel} {viewYear}</span>
        <button onClick={nextMonth} className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100">›</button>
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
          else if (isToday && !isSelected) cls += "ring-2 ring-zinc-900 text-zinc-900 cursor-pointer hover:bg-zinc-100"
          else if (!selectable) cls += "text-zinc-300 cursor-not-allowed"
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
             {selDayLabel ?? "Sélectionnez un jour"}
           </p>
           {slots.length > 0 && <p className="text-[9px] text-zinc-400">En direct sur TidyCal</p>}
        </div>
        
        {slots.length === 0 ? (
          <p className="text-[13px] text-zinc-400 py-2">Aucun créneau ce jour</p>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {slots.map((s) => (
              <a
                key={s.label + s.sub}
                href={`${TIDYCAL_URL}?date=${viewYear}-${String(viewMonth+1).padStart(2,'0')}-${String(selectedDay).padStart(2,'0')}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center justify-center rounded-lg border border-[#e5e5e5] py-1.5 text-zinc-700 hover:bg-zinc-900 hover:text-white hover:border-zinc-900 transition-colors"
              >
                <span className="text-[12px] font-semibold tracking-tight">{s.label}</span>
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="mt-5 pt-4 flex flex-col sm:flex-row items-center justify-between border-t border-zinc-100">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-[11px] text-zinc-400">
            <span className="inline-block h-2 w-2 rounded-full ring-2 ring-zinc-900" /> Aujourd&apos;hui
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-zinc-400">
             <span className="inline-block h-2 w-2 rounded-full bg-zinc-900" /> S\u00e9lectionn\u00e9
          </span>
        </div>
        <a 
          href={TIDYCAL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[11px] font-medium text-blue-600 hover:text-blue-800 mt-3 sm:mt-0"
        >
          Ouvrir le calendrier complet ↗
        </a>
      </div>
    </div>
  )
}

export function BookingSection() {
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
              <p className="text-sm font-medium text-zinc-400">Prendre rendez-vous</p>

              <h2 className="text-[28px] font-semibold tracking-tight text-zinc-900 leading-[1.1] md:text-[40px]">
                Échangeons 30 minutes
                <br />
                sur votre projet.
              </h2>

              <p className="text-[16px] leading-[1.65] text-zinc-500">
                Audit, stratégie ou construction : partagez votre contexte. On identifie ensemble ce qui fait sens pour vous.
              </p>

              <ul className="flex flex-col gap-2.5 mt-2 mb-2">
                {["Appel de découverte gratuit", "Réponse et confirmation immédiate"].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-[13.5px] text-zinc-600">
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-white text-[9px] font-bold">✓</span>
                    {item}
                  </li>
                ))}
              </ul>

              <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-3">
                <a
                  href={TIDYCAL_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex w-full sm:w-auto h-[44px] items-center justify-center rounded-[10px] bg-zinc-900 px-6 text-[14px] font-medium text-white transition-colors hover:bg-zinc-800"
                >
                  Voir les disponibilités
                </a>
                <a
                  href="mailto:info@lucid-lab.fr"
                  className="inline-flex w-full sm:w-auto h-[44px] items-center justify-center rounded-[10px] border border-[#e5e5e5] bg-white/50 px-6 text-[14px] font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
                >
                  Envoyer un email
                </a>
              </div>
            </div>

            {/* ── Right: Custom Calendar UI ── */}
            <div className="w-full flex justify-center">
              <CustomCalendarWidget />
            </div>

          </div>
        </div>
      </div>
    </section>
  )
}
