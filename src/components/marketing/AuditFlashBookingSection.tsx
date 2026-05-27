'use client'

import { AuditFlashForm } from '@/components/marketing/AuditFlashForm'
import { getDictionary, type Locale } from '@/lib/i18n/client'

export function AuditFlashBookingSection({ lang = 'fr' }: { lang?: Locale } = {}) {
  const t = getDictionary(lang).booking

  return (
    <section id="booking" className="w-full border-b border-[#e5e5e5] bg-[#FAFAF7]">
      <div className="mx-auto grid max-w-[1264px] gap-10 border-x border-[#e5e5e5] px-6 py-12 md:px-[48px] md:py-[88px] lg:grid-cols-[0.92fr_1.08fr] lg:gap-16">
        <div className="flex max-w-[520px] flex-col justify-center gap-6">
          <p className="text-sm font-medium text-zinc-400">{t.label}</p>

          <div className="space-y-4">
            <h2 className="text-[28px] font-semibold leading-[1.08] tracking-tight text-zinc-900 md:text-[40px]">
              {t.headlineLine1}
              <br />
              {t.headlineLine2}
            </h2>
            <p className="text-[16px] leading-[1.65] text-zinc-500">{t.subtitle}</p>
          </div>

          <ul className="flex flex-col gap-2.5">
            {t.checklist.map((item) => (
              <li key={item} className="flex items-center gap-2.5 text-[13.5px] text-zinc-600">
                <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-zinc-900 text-[9px] font-bold text-white">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-[10px] border border-[#d8d3c9] bg-white p-4 shadow-sm lg:p-6">
          <AuditFlashForm lang={lang} mode="full" />
        </div>
      </div>
    </section>
  )
}