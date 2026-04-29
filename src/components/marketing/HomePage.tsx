'use client'

import { motion } from "framer-motion"
import { ChevronDown } from "lucide-react"
import { Header } from "@/components/ui/header"
import { HeroSection, LogosSection } from "@/components/ui/hero-section"
import { BookingSection } from "@/components/ui/calendar-booking"
import React, { lazy, Suspense } from "react"
import { getDictionary, type Locale } from "@/lib/i18n/client"

const FeaturesBento = lazy(() => import("@/components/ui/features-bento").then(m => ({ default: m.FeaturesBento })))

// Visual properties for each pillar (locale-agnostic).
const pillarVisuals = [
  { labelColor: "text-amber-400", accentColor: "#f59e0b", dotColor: "bg-amber-400" },
  { labelColor: "text-violet-400", accentColor: "#a78bfa", dotColor: "bg-violet-400" },
  { labelColor: "text-emerald-400", accentColor: "#34d399", dotColor: "bg-emerald-400" },
] as const

const teamAvatars = [
  { avatar: '/team/anthony.png', objectPos: 'center top' },
  { avatar: '/team/theo.png', objectPos: 'center top' },
  { avatar: '/team/jules.png', objectPos: 'center 35%' },
] as const

function PillarCards({ lang }: { lang: Locale }) {
  const t = getDictionary(lang).pillars
  const homePrefix = lang === 'en' ? '/en' : ''
  const bookingHash = `${homePrefix}/#booking`
  const casesHash = `${homePrefix}/#cas-clients`

  const pillars = t.items.map((p, i) => ({ ...p, ...pillarVisuals[i] }))

  const [flippedIndex, setFlippedIndex] = React.useState<number | null>(null)
  const flipRefs = React.useRef<(HTMLDivElement | null)[]>([null, null, null])

  const handleTiltMove = (e: React.MouseEvent<HTMLDivElement>, i: number) => {
    const el = flipRefs.current[i]
    if (!el || flippedIndex === i) return
    const { left, top, width, height } = el.getBoundingClientRect()
    const x = ((e.clientX - left - width / 2) / width) * 8
    const y = -((e.clientY - top - height / 2) / height) * 8
    el.style.transition = 'transform 0.1s ease-out'
    el.style.transform = `rotateY(${x}deg) rotateX(${y}deg)`
  }

  const handleTiltLeave = (i: number) => {
    const el = flipRefs.current[i]
    if (!el || flippedIndex === i) return
    el.style.transition = 'transform 0.5s ease-out'
    el.style.transform = 'rotateY(0deg) rotateX(0deg)'
  }

  const handleFlip = (i: number) => {
    const el = flipRefs.current[i]
    if (!el) return
    const isFlipped = flippedIndex === i
    el.style.transition = 'transform 0.65s cubic-bezier(0.23,1,0.32,1)'
    el.style.transform = isFlipped ? 'rotateY(0deg)' : 'rotateY(180deg)'
    setFlippedIndex(isFlipped ? null : i)
  }

  // Each pillar card's back CTA: index 0 → booking, 1 → case studies, 2 → booking.
  const backCtaHrefs = [bookingHash, casesHash, bookingHash]

  return (
    <section id="processus" className="relative max-sm:px-2">
      <div
        className="relative mx-auto max-w-[1264px] border-x border-[#e5e5e5] px-[48px] py-[100px] max-sm:px-6 max-sm:py-16 overflow-hidden"
        style={{
          background:
            'radial-gradient(84.42% 84.32% at 51.63% 100%, #FFB451 0%, #EFC680 24.76%, #B4D8FF 47.6%, #D2E8FF 75%, #FAFDFF 100%)',
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="mb-16 grid gap-8 md:grid-cols-[1fr_1fr] md:items-center"
        >
          <h2 className="text-[24px] font-semibold leading-[1.15] tracking-[-0.02em] text-[#000] sm:text-[32px] md:text-[40px]">
            {t.intro.line1}
            <br />
            {t.intro.line2}
            <br />
            {t.intro.line3}
          </h2>
          <p className="text-[16px] leading-[1.6] text-[#666] md:max-w-md md:pb-1 whitespace-pre-line">
            {t.intro.paragraph}
          </p>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-3">
          {pillars.map((p, i) => (
            <motion.div
              key={p.num}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              style={{ perspective: '1000px' }}
              className="h-[460px]"
            >
              <div
                ref={(el) => { flipRefs.current[i] = el }}
                onClick={() => handleFlip(i)}
                onMouseMove={(e) => handleTiltMove(e, i)}
                onMouseLeave={() => handleTiltLeave(i)}
                className="relative h-full w-full cursor-pointer"
                style={{ transformStyle: 'preserve-3d' }}
              >
                <div
                  className="absolute inset-0 flex flex-col overflow-hidden rounded-2xl bg-[#0f0f0f] border border-white/[0.06] p-7"
                  style={{ backfaceVisibility: 'hidden' }}
                >
                  <div
                    className="absolute top-0 inset-x-0 h-px"
                    style={{ background: `linear-gradient(to right, transparent 10%, ${p.accentColor}99 50%, transparent 90%)` }}
                  />
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[11px] text-white/15">{p.num}</span>
                    <span className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${p.labelColor}`}>{p.label}</span>
                  </div>
                  <h3 className="mt-8 whitespace-pre-line text-[1.4rem] font-bold leading-[1.2] tracking-[-0.02em] text-white">
                    {p.title}
                  </h3>
                  <p className="mt-3 text-[13px] leading-relaxed text-white/40">
                    {p.description}
                  </p>
                  <div className="mt-7 space-y-3">
                    {p.features.map((feat) => (
                      <div key={feat} className="flex items-center gap-2.5">
                        <span className={`h-1 w-1 rounded-full shrink-0 ${p.dotColor}`} />
                        <span className="text-[13px] text-white/55">{feat}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-auto pt-8 text-[10px] text-white/20 tracking-wide">
                    {t.clickHint}
                  </div>
                </div>

                <div
                  className="absolute inset-0 flex flex-col overflow-hidden rounded-2xl bg-[#0f0f0f] border border-white/[0.06] p-7"
                  style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
                >
                  <div
                    className="absolute top-0 inset-x-0 h-px"
                    style={{ background: `linear-gradient(to right, transparent 10%, ${p.accentColor}99 50%, transparent 90%)` }}
                  />
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] font-semibold uppercase tracking-[0.14em] ${p.labelColor}`}>{p.label}</span>
                    <span className="text-[10px] text-white/25">{t.backHint}</span>
                  </div>
                  <h3 className="mt-5 text-[1.25rem] font-bold leading-[1.2] tracking-[-0.02em] text-white">
                    {p.backTitle}
                  </h3>
                  <ul className="mt-5 flex-1 space-y-3.5">
                    {p.backItems.map((item) => (
                      <li key={item} className="flex items-start gap-2.5">
                        <span className={`mt-[6px] h-1 w-1 rounded-full shrink-0 ${p.dotColor}`} />
                        <span className="text-[13px] leading-snug text-white/55">{item}</span>
                      </li>
                    ))}
                  </ul>
                  <a
                    href={backCtaHrefs[i]}
                    onClick={(e) => e.stopPropagation()}
                    className="mt-6 block w-full rounded-[10px] border border-white/[0.08] bg-white/[0.04] py-3 text-center text-[13px] font-medium text-white/65 transition-colors hover:bg-white/[0.08] hover:text-white"
                  >
                    {p.backCta}
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function HowItWorks({ lang }: { lang: Locale }) {
  const t = getDictionary(lang).howItWorks
  const bookingHref = lang === 'en' ? '/en/#booking' : '/#booking'

  return (
    <section id="solutions" className="max-sm:px-2">
      <div className="mx-auto max-w-[1264px] border-x border-[#e5e5e5] px-[48px] py-[100px] max-sm:px-6 max-sm:py-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mb-16"
        >
          <h2 className="text-[32px] font-semibold leading-[1.15] tracking-[-0.02em] text-[#000] sm:text-[40px]">
            {t.headlineLine1}
            <br />
            <span className="text-[#999]">{t.headlineLine2}</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 divide-y md:divide-y-0 md:divide-x divide-[#e5e5e5] md:grid-cols-4">
          {t.steps.map((step, i) => (
            <motion.div
              key={step.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="py-6 md:py-0 md:px-6 first:md:pl-0 last:md:pr-0"
            >
              <span className="text-[28px] font-semibold text-[#ddd]">{step.num}</span>
              <h3 className="mt-3 text-[16px] font-bold text-[#000]">{step.title}</h3>
              <p className="mt-2 text-[14px] leading-[1.6] text-[#666]">{step.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="mt-14 flex flex-wrap items-center gap-4"
        >
          <a
            href={bookingHref}
            className="flex h-[42px] items-center rounded-[10px] bg-black px-6 text-[14px] font-medium text-white transition-colors hover:bg-[#222]"
          >
            {t.cta}
          </a>
        </motion.div>
      </div>
    </section>
  )
}

function FAQ({ lang }: { lang: Locale }) {
  const t = getDictionary(lang).faq
  const [openIndex, setOpenIndex] = React.useState<number | null>(null)

  return (
    <section id="faq" className="relative border-t border-b border-[#e5e5e5]">
      <div className="relative mx-auto max-w-[1264px] overflow-hidden">
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-white" />
        <div className="relative px-[48px] py-[100px] max-sm:px-6 max-sm:py-16">
          <div className="grid grid-cols-1 gap-16 md:grid-cols-[1fr_1.1fr] md:gap-20 items-center">
            <div className="overflow-hidden rounded-2xl border border-[#e5e5e5] self-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/workflow.png"
                alt="Lucid-Lab Workflow"
                loading="lazy"
                decoding="async"
                className="h-[400px] w-full object-cover"
              />
            </div>
            <div className="flex flex-col">
              <div className="mb-10">
                <p className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#999]">
                  {t.label}
                </p>
                <h2 className="mt-2 text-[36px] font-semibold leading-[1.1] tracking-[-0.02em] text-[#000]">
                  {t.headline}
                </h2>
                <p className="mt-3 text-[14px] leading-[1.7] text-[#999] max-w-sm">
                  {t.subtitle}
                </p>
              </div>

              <div className="divide-y divide-[#e5e5e5]">
                {t.items.map((faq, i) => {
                  const isOpen = openIndex === i
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0 }}
                      whileInView={{ opacity: 1 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                    >
                      <button
                        onClick={() => setOpenIndex(isOpen ? null : i)}
                        className="flex w-full items-center justify-between py-5 text-left"
                      >
                        <span className="pr-4 text-[15px] font-semibold text-[#000]">{faq.q}</span>
                        <ChevronDown
                          className={`size-4 shrink-0 text-[#999] transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`}
                        />
                      </button>
                      <div className={`overflow-hidden transition-all duration-300 ${isOpen ? "max-h-60 pb-5" : "max-h-0"}`}>
                        <p className="text-[14px] leading-[1.7] text-[#666]">{faq.a}</p>
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function FinalCTA({ lang }: { lang: Locale }) {
  const t = getDictionary(lang).team
  const bookingHref = lang === 'en' ? '/en/#booking' : '/#booking'

  const members = t.members.map((m, i) => ({ ...m, ...teamAvatars[i] }))

  return (
    <section id="team" className="max-sm:px-2">
      <div className="mx-auto max-w-[1264px] border-x border-[#e5e5e5] px-[48px] py-[100px] max-sm:px-6 max-sm:py-16">
        <div className="mb-20 grid gap-10 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.15em] text-[#999]">
              {t.label}
            </p>
            <h2 className="mt-3 text-[36px] font-semibold leading-[1.1] tracking-[-0.02em] text-[#000] sm:text-[44px]">
              {t.headlineLine1}<br />{t.headlineLine2}
            </h2>
            <p className="mt-4 max-w-lg text-[16px] leading-[1.65] text-[#666]">
              {t.subtitle}
            </p>
          </div>
          <div className="flex flex-col items-start gap-3 md:items-end">
            <a
              href={bookingHref}
              className="flex h-[44px] items-center rounded-[10px] bg-black px-8 text-[14px] font-medium text-white transition-colors hover:bg-[#222]"
            >
              {t.cta}
            </a>
            <span className="text-[12px] text-[#999]">{t.ctaSub}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          {members.map((m, i) => (
            <motion.div
              key={m.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.08 }}
              className="group"
            >
              <div className="overflow-hidden rounded-2xl border border-[#e5e5e5] bg-[#fafafa]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={m.avatar}
                  alt={m.name}
                  loading="lazy"
                  decoding="async"
                  style={{ objectPosition: m.objectPos }}
                  className="h-[220px] w-full object-cover grayscale transition-all duration-500 group-hover:grayscale-0"
                />
              </div>
              <div className="mt-3 px-0.5">
                <p className="text-[14px] font-semibold text-[#000]">{m.name}</p>
                <p className="mt-0.5 text-[12px] text-[#999]">{m.role}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Footer({ lang }: { lang: Locale }) {
  const t = getDictionary(lang).footer
  const homePrefix = lang === 'en' ? '/en' : ''

  // Hash-only links (e.g. "#solutions") get smooth-scroll within the home page.
  const scrollOrNav = (href: string) => (e: React.MouseEvent<HTMLAnchorElement>) => {
    if (href.startsWith('#')) {
      e.preventDefault()
      document.getElementById(href.slice(1))?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // Localize anchor-only hrefs to ensure they go to the right home page.
  const localizeHash = (href: string) => (href.startsWith('#') ? `${homePrefix}/${href}` : href)
  const homeRoot = lang === 'en' ? '/en' : '/'

  return (
    <footer className="border-t border-[#e5e5e5]">
      <div className="mx-auto max-w-[1264px] border-x border-[#e5e5e5]">
        <div className="grid grid-cols-1 gap-12 px-[48px] py-16 md:grid-cols-[1.5fr_1fr_1fr_1fr] max-sm:px-6">
          <div className="flex flex-col gap-4">
            <a href={homeRoot} className="w-fit flex items-center gap-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo.png" alt="Lucid-Lab" className="h-6 w-auto" />
              <span
                className="text-[18px] font-bold tracking-tight text-black"
                style={{ fontFamily: 'var(--font-syne), sans-serif' }}
              >
                Lucid-Lab
              </span>
            </a>
            <p className="max-w-[260px] text-[13px] leading-[1.6] text-[#999]">
              {t.description}
            </p>
          </div>

          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#bbb]">{t.productLabel}</span>
            <ul className="mt-4 space-y-3">
              {t.productItems.map(({ label, href }) => (
                <li key={label}>
                  <a href={localizeHash(href)} onClick={scrollOrNav(href)} className="text-[13px] text-[#666] transition-colors hover:text-black">{label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#bbb]">{t.resourcesLabel}</span>
            <ul className="mt-4 space-y-3">
              {t.resourcesItems.map(({ label, href }) => (
                <li key={label}>
                  <a href={localizeHash(href)} onClick={scrollOrNav(href)} className="text-[13px] text-[#666] transition-colors hover:text-black">{label}</a>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <span className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#bbb]">{t.contactLabel}</span>
            <ul className="mt-4 space-y-3">
              <li>
                <a href={`mailto:${t.contactEmail}`} className="text-[13px] text-[#666] transition-colors hover:text-black">{t.contactEmail}</a>
              </li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col items-start justify-between gap-3 border-t border-[#e5e5e5] px-[48px] py-6 md:flex-row md:items-center max-sm:px-6">
          <span className="text-[12px] text-[#bbb]">{t.copyright}</span>
          <div className="flex items-center gap-6">
            {t.legalLinks.map(({ label, href }) => (
              <a key={label} href={href} className="text-[12px] text-[#bbb] transition-colors hover:text-black">{label}</a>
            ))}
            <span className="text-[12px] text-[#bbb]">{t.location}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

function BlueCTA({ lang }: { lang: Locale }) {
  const t = getDictionary(lang).blueCta
  const bookingHref = lang === 'en' ? '/en/#booking' : '/#booking'

  return (
    <section className="bg-[#F7F5F1]">
      <div
        className="mx-auto max-w-[1264px]"
        style={{ background: 'radial-gradient(ellipse 120% 80% at 50% 0%, #1a3461 0%, #0D1738 55%)' }}
      >
        <div className="px-[48px] py-[80px] text-center max-sm:px-6 max-sm:py-14">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="mx-auto max-w-2xl text-[36px] font-semibold leading-[1.1] tracking-[-0.02em] text-white sm:text-[44px]">
              {t.headlineLine1}
              <br />
              {t.headlineLine2}
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-[16px] leading-[1.65] text-white/50">
              {t.subtitle}
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <a
                href={bookingHref}
                className="flex h-[44px] items-center rounded-[10px] bg-white px-8 text-[14px] font-medium text-[#0D1738] transition-colors hover:bg-white/90"
              >
                {t.cta}
              </a>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default function HomePage({ lang }: { lang: Locale }) {
  return (
    <div className="flex w-full flex-col">
      <Header />
      <main className="grow">
        <HeroSection lang={lang} />
        <LogosSection lang={lang} />
        <PillarCards lang={lang} />
        <HowItWorks lang={lang} />
        <Suspense fallback={<div className="h-[820px]" />}>
          <FeaturesBento lang={lang} />
        </Suspense>
        <BookingSection lang={lang} />
        <FAQ lang={lang} />
        <BlueCTA lang={lang} />
      </main>
      <Footer lang={lang} />
    </div>
  )
}
