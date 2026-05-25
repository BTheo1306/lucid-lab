'use client'

import { useId, useState } from 'react'
import { ArrowRight, Loader2 } from 'lucide-react'

import type { Locale } from '@/lib/i18n/client'

export const TIDYCAL_AUDIT_FLASH_URL = 'https://tidycal.com/lucid-lab/audit-flash-30-minutes'

type SubmitState = 'idle' | 'submitting' | 'success' | 'error'

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
      success: 'Contexte reçu. Redirection vers TidyCal...',
      error: "Le formulaire n'a pas pu être envoyé. Tu peux réserver le créneau et nous écrire à info@lucid-lab.fr.",
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
      success: 'Context received. Redirecting to TidyCal...',
      error: 'The form could not be sent. You can book the slot and email us at info@lucid-lab.fr.',
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
  const isFull = mode === 'full'

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

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      setState('success')
      form.reset()

      if (isFull) {
        window.setTimeout(() => {
          window.location.href = TIDYCAL_AUDIT_FLASH_URL
        }, 900)
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
