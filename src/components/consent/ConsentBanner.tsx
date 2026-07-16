'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

// Consentement cookies conforme CNIL : aucun contact avec Google tant que
// l'utilisateur n'a pas accepté. Google Analytics n'est chargé qu'après opt-in
// explicite (pas de dépôt de cookie _ga avant consentement). Le choix est
// mémorisé 6 mois dans un cookie first-party.

const CONSENT_COOKIE = 'll-consent'
const GA_ID = 'G-CPQT0JQE7N'
const MAX_AGE_SECONDS = 60 * 60 * 24 * 182 // ~6 mois

type Choice = 'granted' | 'denied'
type Lang = 'fr' | 'en'

function readChoice(): Choice | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/(?:^|;\s*)ll-consent=(granted|denied)/)
  return match ? (match[1] as Choice) : null
}

function persistChoice(choice: Choice) {
  document.cookie = `${CONSENT_COOKIE}=${choice}; path=/; max-age=${MAX_AGE_SECONDS}; SameSite=Lax`
}

// Charge Google Analytics une seule fois, après consentement.
function loadAnalytics() {
  const w = window as unknown as {
    __llGaLoaded?: boolean
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
  if (w.__llGaLoaded) return
  w.__llGaLoaded = true

  w.dataLayer = w.dataLayer || []
  // Forme canonique du snippet Google : on pousse l'objet `arguments` lui-même,
  // pas un tableau. gtag.js le lit positionnellement et les deux ne sont pas
  // garantis équivalents, notamment pour les commandes `consent`. Le rest param
  // ne sert qu'à typer la signature d'appel.
  function gtag(..._args: unknown[]) {
    // eslint-disable-next-line prefer-rest-params
    w.dataLayer!.push(arguments)
  }
  w.gtag = gtag

  // Consent Mode v2 : tout refusé par défaut, on autorise uniquement la mesure.
  gtag('consent', 'default', {
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
    analytics_storage: 'denied',
  })
  gtag('js', new Date())
  gtag('consent', 'update', { analytics_storage: 'granted' })
  gtag('config', GA_ID, { anonymize_ip: true })

  const script = document.createElement('script')
  script.async = true
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
  document.head.appendChild(script)
}

const COPY: Record<Lang, {
  message: string
  privacyLabel: string
  privacyHref: string
  accept: string
  refuse: string
  aria: string
}> = {
  fr: {
    message:
      'On utilise un cookie de mesure d’audience (Google Analytics) pour comprendre ce qui est utile sur ce site. Rien n’est déposé sans votre accord.',
    privacyLabel: 'Politique de confidentialité',
    privacyHref: '/confidentialite',
    accept: 'Accepter',
    refuse: 'Refuser',
    aria: 'Consentement aux cookies',
  },
  en: {
    message:
      'We use one analytics cookie (Google Analytics) to understand what is useful on this site. Nothing is stored without your consent.',
    privacyLabel: 'Privacy policy',
    privacyHref: '/en/privacy',
    accept: 'Accept',
    refuse: 'Decline',
    aria: 'Cookie consent',
  },
}

export function ConsentBanner({ lang = 'fr' }: { lang?: Lang }) {
  const [visible, setVisible] = useState(false)
  const copy = COPY[lang]

  useEffect(() => {
    const choice = readChoice()
    if (choice === 'granted') {
      loadAnalytics()
    } else if (choice === null) {
      setVisible(true)
    }
    // 'denied' : on n'affiche rien et on ne charge rien.
  }, [])

  function accept() {
    persistChoice('granted')
    setVisible(false)
    loadAnalytics()
  }

  function refuse() {
    persistChoice('denied')
    setVisible(false)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label={copy.aria}
      className="fixed inset-x-0 bottom-0 z-[60] flex justify-center px-4 pb-4 sm:px-6 sm:pb-6"
    >
      <div className="flex w-full max-w-[820px] flex-col gap-4 rounded-[14px] border border-[#E5E5E5] bg-[#FAFAF7] p-5 shadow-[0_12px_40px_-12px_rgba(10,10,10,0.25)] sm:flex-row sm:items-center sm:gap-6 sm:p-6">
      <p className="text-[13px] leading-[1.55] text-[#525252] sm:text-[14px]">
        {copy.message}{' '}
        <Link
          href={copy.privacyHref}
          className="underline decoration-[#C85E1A]/40 underline-offset-2 transition-colors hover:text-[#0A0A0A] hover:decoration-[#C85E1A]"
        >
          {copy.privacyLabel}
        </Link>
      </p>
      <div className="flex shrink-0 gap-3">
        <button
          type="button"
          onClick={refuse}
          className="rounded-full border border-[#E5E5E5] bg-white px-5 py-2 text-[13px] font-medium text-[#525252] transition-colors hover:border-[#0A0A0A] hover:text-[#0A0A0A]"
        >
          {copy.refuse}
        </button>
        <button
          type="button"
          onClick={accept}
          className="rounded-full bg-[#C85E1A] px-5 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[#a94d15]"
        >
          {copy.accept}
        </button>
      </div>
      </div>
    </div>
  )
}
