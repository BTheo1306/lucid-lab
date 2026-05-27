'use client'

import { useId, useState } from 'react'
import { ArrowRight, CalendarCheck, Loader2 } from 'lucide-react'

import { CustomCalendarWidget, type BookingSlotSelection } from '@/components/ui/calendar-booking'
import type { Locale } from '@/lib/i18n/client'

export const TIDYCAL_AUDIT_FLASH_URL = 'https://tidycal.com/lucid-lab/audit-flash-30-minutes'

type SubmitState = 'idle' | 'submitting' | 'success' | 'error'
type BookingState = 'idle' | 'booking' | 'booked' | 'error'

type BookingContext = {
  sessionId: string
  leadId: string | null
  name: string
  email: string
}

const copy = {
  fr: {
    full: {
      firstName: 'Prénom',
      lastName: 'Nom',
      email: 'Email pro',
      company: 'Société',
      registration: 'Numéro SIRET / N° de société',
      address: 'Adresse du siège',
      role: 'Rôle / fonction',
      need: 'Description courte du besoin',
      needPlaceholder: '3-5 lignes : workflow, outil, donnée, équipe concernée, blocage actuel...',
      teamSize: "Taille de l'équipe",
      sector: 'Secteur',
      consent: "J'accepte que Lucid-Lab me recontacte à propos de cet Audit Flash.",
      submit: 'Envoyer et choisir un créneau',
      success: 'Contexte reçu. Choisissez maintenant votre créneau.',
      error: "Le formulaire n'a pas pu être envoyé. Tu peux réserver le créneau et nous écrire à info@lucid-lab.fr.",
      bookingTitle: 'Contexte reçu. Choisissez votre créneau.',
      bookingSubtitle: 'Vos informations sont déjà liées à la réservation. Sélectionnez un horaire, vérifiez le récapitulatif, puis confirmez le rendez-vous.',
      bookingSummaryTitle: 'Récapitulatif du rendez-vous',
      bookingSummaryDate: 'Date',
      bookingSummaryTime: 'Heure',
      bookingSummaryContact: 'Contact',
      bookingSummaryType: 'Format',
      bookingSummaryTypeValue: 'Audit Flash · 30 min',
      bookingConfirm: 'Confirmer le rendez-vous',
      bookingChangeSlot: 'Choisir un autre créneau',
      bookingLoading: 'Réservation du créneau en cours...',
      bookingSuccess: "Créneau confirmé. Vous recevrez l'e-mail TidyCal dans quelques instants.",
      bookingError: "La confirmation n'a pas abouti. Réessaie ou choisis un autre créneau.",
    },
    lex: {
      email: 'Email pro',
      need: 'Ton cas',
      submit: 'Envoyer à Lex',
      success: 'Cas reçu. On revient avec une lecture sous 24h.',
      error: "L'envoi n'a pas abouti. Réserve directement un Audit Flash.",
      company: 'Société',
    },
    openCalendar: 'Ouvrir TidyCal',
    optional: 'Optionnel',
  },
  en: {
    full: {
      firstName: 'First name',
      lastName: 'Last name',
      email: 'Work email',
      company: 'Company',
      registration: 'Company registration number',
      address: 'Registered office address',
      role: 'Role / function',
      need: 'Short description of the need',
      needPlaceholder: '3-5 lines: workflow, tool, data, team involved, current blocker...',
      teamSize: 'Team size',
      sector: 'Sector',
      consent: 'I agree that Lucid-Lab may contact me about this Audit Flash.',
      submit: 'Send and choose a slot',
      success: 'Context received. Now choose your slot.',
      error: 'The form could not be sent. You can book the slot and email us at info@lucid-lab.fr.',
      bookingTitle: 'Context received. Choose your slot.',
      bookingSubtitle: 'Your details are already attached to the booking. Select a time, review the summary, then confirm the meeting.',
      bookingSummaryTitle: 'Meeting summary',
      bookingSummaryDate: 'Date',
      bookingSummaryTime: 'Time',
      bookingSummaryContact: 'Contact',
      bookingSummaryType: 'Format',
      bookingSummaryTypeValue: 'Audit Flash · 30 min',
      bookingConfirm: 'Confirm meeting',
      bookingChangeSlot: 'Choose another slot',
      bookingLoading: 'Booking this slot...',
      bookingSuccess: 'Slot confirmed. You will receive the TidyCal email in a few moments.',
      bookingError: 'Confirmation failed. Try again or choose another slot.',
    },
    lex: {
      email: 'Work email',
      need: 'Your case',
      submit: 'Send to Lex',
      success: 'Case received. We will come back with a read within 24h.',
      error: 'Submission failed. Book an Audit Flash directly.',
      company: 'Company',
    },
    openCalendar: 'Open TidyCal',
    optional: 'Optional',
  },
} as const

function fieldClass() {
  return 'min-h-[36px] w-full rounded-[6px] border border-[#d8d3c9] bg-white px-2.5 text-[13px] text-[#111111] outline-none transition placeholder:text-[#a39a8d] focus:border-[#1f6f93] focus:ring-1.5 focus:ring-[#1f6f93]/15'
}

function normalizeBookingDate(value: string) {
  return value.replace(/\.(\d{3})\d*(Z|[+-]\d{2}:?\d{2})$/, '.$1$2')
}

function formatSelectedSlot(slot: BookingSlotSelection, lang: Locale) {
  const localeTag = lang === 'en' ? 'en-US' : 'fr-FR'
  const date = new Date(normalizeBookingDate(slot.startsAt))

  if (Number.isNaN(date.getTime())) {
    return {
      date: slot.date,
      time: slot.time,
    }
  }

  return {
    date: new Intl.DateTimeFormat(localeTag, {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date),
    time: new Intl.DateTimeFormat(localeTag, {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date),
  }
}

function Label({
  htmlFor,
  children,
  optional,
}: {
  htmlFor: string
  children: React.ReactNode
  optional?: string
}) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-[12px] font-semibold text-[#2f2b26]">
      {children}
      {optional ? <span className="ml-1.5 font-normal text-[#8a8276]">{optional}</span> : null}
    </label>
  )
}

export function AuditFlashForm({
  lang,
  mode = 'full',
  placeholder,
}: {
  lang: Locale
  mode?: 'full' | 'lex'
  placeholder?: string
}) {
  const t = copy[lang]
  const id = useId()
  const [state, setState] = useState<SubmitState>('idle')
  const [bookingState, setBookingState] = useState<BookingState>('idle')
  const [bookingContext, setBookingContext] = useState<BookingContext | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<BookingSlotSelection | null>(null)
  const [calendarResetKey, setCalendarResetKey] = useState(0)
  const isFull = mode === 'full'

  function selectSlot(slot: BookingSlotSelection) {
    setSelectedSlot(slot)
    setBookingState('idle')
  }

  async function confirmBooking() {
    if (!bookingContext || !selectedSlot) return

    setBookingState('booking')

    try {
      const res = await fetch('/api/bot/booking/create', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          session_id: bookingContext.sessionId,
          lead_id: bookingContext.leadId,
          name: bookingContext.name,
          email: bookingContext.email,
          starts_at: selectedSlot.startsAt,
          timezone: selectedSlot.timezone,
        }),
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      setSelectedSlot(null)
      setCalendarResetKey((key) => key + 1)
      setBookingState('booked')
    } catch (error) {
      console.error('[audit-flash] booking failed:', error)
      setBookingState('error')
    }
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)

    if (String(data.get('website') ?? '').trim()) return

    setState('submitting')
    const payload = Object.fromEntries(data.entries())

    try {
      const res = await fetch('/api/audit-flash', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          ...payload,
          language: lang,
          source: isFull ? 'audit_flash_form' : 'lex_teaser',
        }),
      })

      const result = await res.json() as { lead_id?: string; session_id?: string }

      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      if (isFull && !result.session_id) throw new Error('Missing booking session')

      setState('success')
      form.reset()

      if (isFull) {
        const firstName = String(payload.first_name ?? '').trim()
        const lastName = String(payload.last_name ?? '').trim()
        const email = String(payload.email ?? '').trim().toLowerCase()
        const company = String(payload.company ?? '').trim()
        const name = [firstName, lastName].filter(Boolean).join(' ') || company || email

        setBookingContext({
          sessionId: result.session_id!,
          leadId: result.lead_id ?? null,
          name,
          email,
        })
        setBookingState('idle')
        setSelectedSlot(null)
        setCalendarResetKey((key) => key + 1)
      }
    } catch (error) {
      console.error('[audit-flash] submit failed:', error)
      setState('error')
    }
  }

  if (!isFull) {
    return (
      <form onSubmit={submit} className="space-y-4">
        <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
        <div>
          <Label htmlFor={`${id}-lex-need`}>{t.lex.need}</Label>
          <textarea
            id={`${id}-lex-need`}
            name="need"
            required
            minLength={20}
            rows={6}
            placeholder={placeholder}
            className={`${fieldClass()} min-h-[150px] resize-y py-3 leading-[1.55]`}
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <Label htmlFor={`${id}-lex-email`}>{t.lex.email}</Label>
            <input id={`${id}-lex-email`} name="email" required type="email" className={fieldClass()} />
          </div>
          <div>
            <Label htmlFor={`${id}-lex-company`} optional={t.optional}>{t.lex.company}</Label>
            <input id={`${id}-lex-company`} name="company" className={fieldClass()} />
          </div>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="submit"
            disabled={state === 'submitting'}
            className="inline-flex min-h-[44px] items-center justify-center rounded-[8px] bg-[#111111] px-5 text-[14px] font-semibold text-white transition hover:bg-[#2a2926] disabled:cursor-wait disabled:opacity-65"
          >
            {state === 'submitting' ? <Loader2 className="mr-2 size-4 animate-spin" aria-hidden /> : null}
            {t.lex.submit}
          </button>
          <a href={TIDYCAL_AUDIT_FLASH_URL} className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#1f6f93]">
            {t.openCalendar}
            <ArrowRight className="size-4" aria-hidden />
          </a>
        </div>
        {state === 'success' ? <p className="text-[13px] font-medium text-[#1f6f93]">{t.lex.success}</p> : null}
        {state === 'error' ? <p className="text-[13px] font-medium text-[#9f3a1d]">{t.lex.error}</p> : null}
      </form>
    )
  }

  if (bookingContext) {
    const formattedSlot = selectedSlot ? formatSelectedSlot(selectedSlot, lang) : null

    return (
      <div className="space-y-4">
        <div>
          <h3 className="text-[17px] font-extrabold tracking-tight text-[#111111]">{t.full.bookingTitle}</h3>
          <p className="mt-2 text-[12.5px] leading-relaxed text-[#5f5a52]">{t.full.bookingSubtitle}</p>
        </div>

        <CustomCalendarWidget
          key={calendarResetKey}
          lang={lang}
          onSlotSelect={selectSlot}
          disabled={bookingState === 'booking' || bookingState === 'booked'}
          selectedSlotLabel={selectedSlot?.label}
        />

        {formattedSlot ? (
          <div className="rounded-[8px] border border-[#d8d3c9] bg-white px-3.5 py-3 shadow-sm">
            <div className="flex flex-col gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-[#8a8276]">{t.full.bookingSummaryTitle}</p>
                <dl className="mt-2 grid gap-2 text-[12.5px] sm:grid-cols-2">
                  <div>
                    <dt className="text-[11px] font-semibold text-[#8a8276]">{t.full.bookingSummaryDate}</dt>
                    <dd className="mt-0.5 font-semibold capitalize text-[#111111]">{formattedSlot.date}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold text-[#8a8276]">{t.full.bookingSummaryTime}</dt>
                    <dd className="mt-0.5 font-semibold text-[#111111]">{formattedSlot.time}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold text-[#8a8276]">{t.full.bookingSummaryType}</dt>
                    <dd className="mt-0.5 font-semibold text-[#111111]">{t.full.bookingSummaryTypeValue}</dd>
                  </div>
                  <div>
                    <dt className="text-[11px] font-semibold text-[#8a8276]">{t.full.bookingSummaryContact}</dt>
                    <dd className="mt-0.5 break-normal font-semibold text-[#111111]">{bookingContext.email}</dd>
                  </div>
                </dl>
              </div>

              {bookingState !== 'booked' ? (
                <div className="flex flex-col gap-2 border-t border-[#e8e3d8] pt-3 sm:flex-row sm:items-center sm:justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedSlot(null)}
                    disabled={bookingState === 'booking'}
                    className="text-left text-[11.5px] font-semibold text-[#5f5a52] underline-offset-4 transition hover:text-[#111111] hover:underline disabled:cursor-wait disabled:opacity-60 sm:text-right"
                  >
                    {t.full.bookingChangeSlot}
                  </button>
                  <button
                    type="button"
                    onClick={confirmBooking}
                    disabled={bookingState === 'booking'}
                    className="inline-flex min-h-[40px] items-center justify-center rounded-[6px] bg-[#111111] px-4 text-[12.5px] font-semibold text-white transition hover:bg-[#2a2926] disabled:cursor-wait disabled:opacity-65 sm:order-last"
                  >
                    {bookingState === 'booking' ? <Loader2 className="mr-2 size-3.5 animate-spin" aria-hidden /> : <CalendarCheck className="mr-2 size-3.5" aria-hidden />}
                    {t.full.bookingConfirm}
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}

        {bookingState === 'booking' ? (
          <p className="text-[12px] font-medium text-[#1f6f93]">{t.full.bookingLoading}</p>
        ) : null}
        {bookingState === 'booked' ? (
          <p className="rounded-[6px] bg-[#1f6f93]/10 px-3 py-2 text-[12px] font-medium text-[#1f6f93]">{t.full.bookingSuccess}</p>
        ) : null}
        {bookingState === 'error' ? (
          <div className="space-y-2 rounded-[6px] bg-[#9f3a1d]/10 px-3 py-2">
            <p className="text-[12px] font-medium text-[#9f3a1d]">{t.full.bookingError}</p>
            <a href={TIDYCAL_AUDIT_FLASH_URL} className="inline-flex items-center gap-2 text-[12px] font-semibold text-[#111111]">
              {t.openCalendar}
              <ArrowRight className="size-3.5" aria-hidden />
            </a>
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <form onSubmit={submit} className="space-y-3">
      <input type="text" name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden="true" />
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor={`${id}-first`}>{t.full.firstName}</Label>
          <input id={`${id}-first`} name="first_name" required className={fieldClass()} />
        </div>
        <div>
          <Label htmlFor={`${id}-last`}>{t.full.lastName}</Label>
          <input id={`${id}-last`} name="last_name" required className={fieldClass()} />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor={`${id}-email`}>{t.full.email}</Label>
          <input id={`${id}-email`} name="email" required type="email" className={fieldClass()} />
        </div>
        <div>
          <Label htmlFor={`${id}-role`}>{t.full.role}</Label>
          <input id={`${id}-role`} name="role" required className={fieldClass()} />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor={`${id}-company`}>{t.full.company}</Label>
          <input id={`${id}-company`} name="company" required className={fieldClass()} />
        </div>
        <div>
          <Label htmlFor={`${id}-registration`}>{t.full.registration}</Label>
          <input id={`${id}-registration`} name="company_registration" required className={fieldClass()} />
        </div>
      </div>
      <div>
        <Label htmlFor={`${id}-address`}>{t.full.address}</Label>
        <input id={`${id}-address`} name="headquarters_address" required className={fieldClass()} />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <Label htmlFor={`${id}-team`} optional={t.optional}>{t.full.teamSize}</Label>
          <input id={`${id}-team`} name="team_size" className={fieldClass()} />
        </div>
        <div>
          <Label htmlFor={`${id}-sector`} optional={t.optional}>{t.full.sector}</Label>
          <input id={`${id}-sector`} name="sector" className={fieldClass()} />
        </div>
      </div>
      <div>
        <Label htmlFor={`${id}-need`}>{t.full.need}</Label>
        <textarea
          id={`${id}-need`}
          name="need"
          required
          minLength={20}
          rows={3}
          placeholder={t.full.needPlaceholder}
          className={`${fieldClass()} min-h-[72px] resize-y py-2 leading-[1.45]`}
        />
      </div>
      <label className="flex items-start gap-2.5 text-[12px] leading-[1.4] text-[#5f5a52] select-none">
        <input name="marketing_consent" type="checkbox" value="true" required className="mt-0.5 size-3.5 rounded border-[#d8d3c9]" />
        <span>{t.full.consent}</span>
      </label>
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={state === 'submitting'}
          className="inline-flex min-h-[38px] items-center justify-center rounded-[6px] bg-[#111111] px-5 text-[13px] font-semibold text-white transition hover:bg-[#2a2926] disabled:cursor-wait disabled:opacity-65"
        >
          {state === 'submitting' ? <Loader2 className="mr-2 size-3.5 animate-spin" aria-hidden /> : null}
          {t.full.submit}
        </button>
        <a href={TIDYCAL_AUDIT_FLASH_URL} className="inline-flex min-h-[38px] items-center justify-center rounded-[6px] border border-[#d8d3c9] px-4 text-[13px] font-semibold text-[#111111] hover:bg-stone-50 transition">
          {t.openCalendar}
        </a>
      </div>
      {state === 'success' ? <p className="text-[12px] font-medium text-[#1f6f93]">{t.full.success}</p> : null}
      {state === 'error' ? <p className="text-[12px] font-medium text-[#9f3a1d]">{t.full.error}</p> : null}
    </form>
  )
}
