'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { BookOpen, GraduationCap, Presentation, Users } from 'lucide-react'

import { Header } from '@/components/ui/header'
import { HeroSection, type HeroCopy } from '@/components/ui/hero-section'
import { AuditFlashBookingSection } from '@/components/marketing/AuditFlashBookingSection'
import { MarketingFooter } from '@/components/marketing/HomePage'
import type { Locale } from '@/lib/i18n/client'
import { breadcrumbSchema, faqPageSchema, serviceSchema, jsonLd } from '@/lib/seo/schema'

const INK = '#0A0A0A'
const PAPER = '#FAFAF7'
const GRAY_600 = '#525252'
const GRAY_400 = '#A3A3A3'
const GRAY_200 = '#E5E5E5'
const GRAY_100 = '#F2F2EE'
const EMBER = '#C85E1A'

const pagePath = { fr: '/formations-ia', en: '/en/ai-training' } as const

type FormationsContent = {
  hero: HeroCopy
  catalog: {
    title: string
    subtitle: string
    items: { detail: string; title: string; body: string }[]
  }
  approach: {
    title: string
    subtitle: string
    imageAlt: string
    items: [string, string][]
  }
  faq: {
    title: string
    subtitle: string
    items: { question: string; answer: string }[]
  }
}

const content: Record<Locale, FormationsContent> = {
  fr: {
    hero: {
      titleLine1: 'Des formations IA',
      titleLine2: 'sur vos cas réels.',
      subtitle:
        'Les formations sont préparées et animées par ceux qui construisent nos systèmes clients. On travaille sur **vos outils et vos documents**, pas sur des exemples génériques.',
      subtitleLine2: 'En intra ou à distance. Pour la direction comme pour les équipes.',
      ctaPrimary: 'Organiser une formation',
      ctaPrimaryHref: '#booking',
      ctaSecondary: 'Voir la méthode',
      ctaSecondaryHref: '/methode',
    },
    catalog: {
      title: 'Les six modules.',
      subtitle: 'Du comité de direction aux équipes techniques. Chaque module s’adapte à votre niveau, vos outils et vos règles.',
      items: [
        {
          detail: 'Une demi-journée · Direction',
          title: 'Comprendre l’IA pour décider',
          body: 'Ce que l’IA sait faire aujourd’hui, ce que ça coûte, ce que ça risque, et comment repérer les projets utiles dans votre secteur. De quoi arbitrer sans dépendre du discours des vendeurs.',
        },
        {
          detail: 'Une journée · Toutes équipes',
          title: 'Claude et ChatGPT au quotidien',
          body: 'Écrire des demandes précises, organiser ses projets, produire des documents. Chaque participant repart avec ses propres cas d’usage installés et une méthode réutilisable.',
        },
        {
          detail: 'Une journée · Direction, équipes support',
          title: 'Travailler avec le contexte de l’entreprise',
          body: 'Organiser les informations de l’entreprise pour que l’IA s’en serve vraiment. C’est le module qui accompagne notre installation Second Brain : base de connaissance, connexions aux outils, entretien dans le temps.',
        },
        {
          detail: 'Un à deux jours · Équipes techniques',
          title: 'Agents IA et automatisations',
          body: 'Construire des automatisations avec n8n et des agents reliés à vos outils, avec validation humaine sur les actions sensibles. On apprend aussi à les surveiller et à les corriger.',
        },
        {
          detail: 'Une demi-journée · Direction, DSI, juridique',
          title: 'Règles d’usage et conformité',
          body: 'Qui peut utiliser quoi, avec quelles données, dans quel cadre : RGPD, AI Act, données sensibles. Vous repartez avec une charte d’usage claire pour l’entreprise.',
        },
        {
          detail: 'À définir ensemble · Votre périmètre',
          title: 'Un module sur mesure',
          body: 'Un besoin particulier, un métier spécifique, un outil interne : on prépare le contenu sur vos dossiers et on assure le suivi après la session.',
        },
      ],
    },
    approach: {
      title: 'Comment se passent nos formations.',
      subtitle:
        'Les formateurs sont les ingénieurs qui construisent nos systèmes clients. Les exemples viennent de projets réels.',
      imageAlt: 'L’équipe Lucid-Lab anime un atelier IA en entreprise',
      items: [
        [
          'On travaille sur vos documents',
          'Chaque exercice utilise vos outils et vos dossiers. Ce qui est appris en session sert dès le lendemain.',
        ],
        [
          'Des groupes de 4 à 12 personnes',
          'Une demi-journée à deux jours selon le module, en français ou en anglais.',
        ],
        [
          'Chez vous ou à distance',
          'Dans vos locaux partout en France, ou en visio. Les supports sont remis à chaque participant.',
        ],
        [
          'Un mois de suivi après la session',
          'Un canal reste ouvert pour vos questions pendant 30 jours. Un accompagnement mensuel est possible ensuite.',
        ],
      ],
    },
    faq: {
      title: 'Questions fréquentes.',
      subtitle: 'Le programme et le calendrier se définissent lors du premier échange.',
      items: [
        {
          question: 'À qui s’adressent ces formations ?',
          answer:
            'Aux TPE, PME et ETI. Selon le module : direction, équipes métier ou équipes techniques. Le niveau de départ des participants est pris en compte à chaque fois.',
        },
        {
          question: 'Faut-il des connaissances techniques ?',
          answer:
            'Non pour les modules direction, quotidien et conformité. Le module agents et automatisations demande simplement d’être à l’aise avec ses outils numériques.',
        },
        {
          question: 'Peut-on combiner plusieurs modules ?',
          answer:
            'Oui. Le parcours le plus courant : une session pour la direction, une journée pour les équipes, puis un module spécialisé. On définit l’ensemble lors du premier échange.',
        },
        {
          question: 'Travaillez-vous sur nos données réelles ?',
          answer:
            'Oui, c’est le principe. On définit ensemble, avant la session, ce qui peut être utilisé, dans le respect de vos règles de confidentialité.',
        },
      ],
    },
  },
  en: {
    hero: {
      titleLine1: 'AI training',
      titleLine2: 'on your real cases.',
      subtitle:
        'Sessions are prepared and led by the people who build our client systems. We work on **your tools and your documents**, not on generic examples.',
      subtitleLine2: 'On site or remote. For leadership and for teams.',
      ctaPrimary: 'Plan a training',
      ctaPrimaryHref: '#booking',
      ctaSecondary: 'See the method',
      ctaSecondaryHref: '/en/method',
    },
    catalog: {
      title: 'The six modules.',
      subtitle: 'From the boardroom to technical teams. Each module adjusts to your level, your tools and your rules.',
      items: [
        {
          detail: 'Half a day · Leadership',
          title: 'Understanding AI to decide',
          body: 'What AI can do today, what it costs, what it risks, and how to spot useful projects in your sector. Enough to decide without depending on vendor talk.',
        },
        {
          detail: 'One day · All teams',
          title: 'Claude and ChatGPT day to day',
          body: 'Write precise requests, organize projects, produce documents. Every participant leaves with their own use cases set up and a reusable method.',
        },
        {
          detail: 'One day · Leadership, support teams',
          title: 'Working with company context',
          body: 'Organize company information so AI actually uses it. This is the module that goes with our Second Brain install: knowledge base, tool connections, upkeep over time.',
        },
        {
          detail: 'One to two days · Technical teams',
          title: 'AI agents and automations',
          body: 'Build automations with n8n and agents connected to your tools, with human validation on sensitive actions. We also cover how to monitor and fix them.',
        },
        {
          detail: 'Half a day · Leadership, IT, legal',
          title: 'Usage rules and compliance',
          body: 'Who can use what, with which data, in which frame: GDPR, the EU AI Act, sensitive data. You leave with a clear usage charter for the company.',
        },
        {
          detail: 'To define together · Your scope',
          title: 'A custom module',
          body: 'A specific need, a particular craft, an internal tool: we prepare the content on your files and follow up after the session.',
        },
      ],
    },
    approach: {
      title: 'How our sessions work.',
      subtitle:
        'The trainers are the engineers who build our client systems. Examples come from real projects.',
      imageAlt: 'The Lucid-Lab team leading an AI workshop in a company',
      items: [
        [
          'We work on your documents',
          'Every exercise uses your tools and your files. What is learned in session is useful the next day.',
        ],
        [
          'Groups of 4 to 12 people',
          'Half a day to two days depending on the module, in French or in English.',
        ],
        [
          'At your office or remote',
          'On site anywhere in France, or by video. Support material is delivered to every participant.',
        ],
        [
          'One month of follow-up',
          'A channel stays open for your questions for 30 days. Monthly support is possible afterwards.',
        ],
      ],
    },
    faq: {
      title: 'Frequent questions.',
      subtitle: 'The program and calendar are defined during the first call.',
      items: [
        {
          question: 'Who is this training for?',
          answer:
            'Small and mid-size companies. Depending on the module: leadership, business teams or technical teams. The starting level of participants is taken into account every time.',
        },
        {
          question: 'Are technical skills required?',
          answer:
            'Not for the leadership, day-to-day and compliance modules. The agents and automations module simply requires being comfortable with your digital tools.',
        },
        {
          question: 'Can we combine several modules?',
          answer:
            'Yes. The most common path: one session for leadership, one day for teams, then one specialized module. We define the whole during the first call.',
        },
        {
          question: 'Do you work on our real data?',
          answer:
            'Yes, that is the point. We define together, before the session, what can be used, within your confidentiality rules.',
        },
      ],
    },
  },
}

const approachIcons = [Users, GraduationCap, Presentation, BookOpen] as const

function Section({
  id,
  tone = 'paper',
  children,
}: {
  id?: string
  tone?: 'paper' | 'ink' | 'gray'
  children: React.ReactNode
}) {
  const bg = tone === 'ink' ? INK : tone === 'gray' ? GRAY_100 : PAPER
  const fg = tone === 'ink' ? PAPER : INK
  const divider = tone === 'ink' ? 'rgba(250,250,247,0.12)' : GRAY_200

  return (
    <motion.section
      id={id}
      style={{ background: bg, color: fg, borderTop: `1px solid ${divider}` }}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-10% 0px -10% 0px' }}
      transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
      className="relative scroll-mt-[68px]"
    >
      <div className="mx-auto w-full max-w-[1200px] px-6 pb-12 pt-8 md:px-10 md:pb-16 md:pt-10">
        {children}
      </div>
    </motion.section>
  )
}

function SectionTitle({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <h2
      className="max-w-[30ch] text-[22px] font-bold leading-[1.12] tracking-[-0.015em] sm:text-[26px] md:text-[32px]"
      style={{ color: light ? PAPER : INK }}
    >
      {children}
    </h2>
  )
}

function SectionLede({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <p
      className="mt-3 max-w-[60ch] text-[14px] leading-[1.5] md:text-[15px]"
      style={{ color: light ? 'rgba(250,250,247,0.72)' : GRAY_600 }}
    >
      {children}
    </p>
  )
}

function CatalogBento({ lang }: { lang: Locale }) {
  const t = content[lang].catalog

  const getBentoClass = (idx: number) => {
    switch (idx) {
      case 0: return 'lg:col-span-7'
      case 1: return 'lg:col-span-5'
      case 2: return 'lg:col-span-4'
      case 3: return 'lg:col-span-4'
      case 4: return 'lg:col-span-4'
      case 5: return 'lg:col-span-12 lg:row-span-1'
      default: return 'lg:col-span-12'
    }
  }

  return (
    <Section id="catalogue" tone="ink">
      <div className="flex flex-col justify-between gap-6 pb-4 md:flex-row md:items-end">
        <div className="max-w-2xl">
          <SectionTitle light>{t.title}</SectionTitle>
          <SectionLede light>{t.subtitle}</SectionLede>
        </div>
      </div>

      <div className="mt-12 grid auto-rows-fr gap-4 md:grid-cols-2 lg:grid-cols-12">
        {t.items.map((item, idx) => {
          const isFirstRow = idx < 2
          return (
            <motion.article
              key={item.title}
              className={`group relative flex flex-col justify-between overflow-hidden rounded-[16px] border p-6 transition-all duration-500 hover:-translate-y-1 hover:border-[#C85E1A]/40 md:p-8 ${getBentoClass(idx)}`}
              style={{
                background: 'linear-gradient(180deg, rgba(30,30,30,0.4) 0%, rgba(15,15,15,0.8) 100%)',
                borderColor: 'rgba(250,250,247,0.1)',
              }}
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: '-10% 0px -10% 0px' }}
              transition={{ duration: 0.5, delay: idx * 0.1, ease: [0.23, 1, 0.32, 1] }}
            >
              <div className="pointer-events-none absolute -right-8 -top-12 select-none opacity-[0.03] transition-opacity duration-500 group-hover:opacity-[0.06]">
                <span className="text-[240px] font-black leading-none" style={{ color: PAPER }}>{idx + 1}</span>
              </div>

              <div className="relative z-10">
                <div className="mb-8 flex items-center gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 font-mono text-[10px] text-white/50">0{idx + 1}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#C85E1A]">{item.detail}</span>
                </div>
                <h3 className={`font-bold leading-tight ${isFirstRow ? 'text-[22px] md:text-[28px]' : 'text-[18px] md:text-[22px]'}`} style={{ color: PAPER }}>
                  {item.title}
                </h3>
                <p className={`mt-4 leading-[1.6] ${isFirstRow ? 'text-[15px]' : 'text-[14px]'}`} style={{ color: 'rgba(250,250,247,0.64)' }}>
                  {item.body}
                </p>
              </div>

              <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-[#C85E1A]/[0.03] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100" />
            </motion.article>
          )
        })}
      </div>
    </Section>
  )
}

function Approach({ lang }: { lang: Locale }) {
  const t = content[lang].approach
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  return (
    <Section id="pedagogie">
      <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr] lg:gap-12">
        <div>
          <SectionTitle>{t.title}</SectionTitle>
          <SectionLede>{t.subtitle}</SectionLede>
          <motion.div
            className="mt-6 overflow-hidden rounded-[12px] border bg-white shadow-sm"
            style={{ borderColor: GRAY_200 }}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative aspect-[3/2]">
              <Image src="/formations-equipe.png" alt={t.imageAlt} fill sizes="(min-width: 1024px) 460px, 100vw" className="object-cover" />
            </div>
          </motion.div>
        </div>

        <ul className="flex flex-col divide-y self-center" style={{ borderColor: GRAY_400 + '30' }}>
          {t.items.map(([title, body], index) => {
            const Icon = approachIcons[index] ?? Users
            const isActive = hoveredIdx === index
            return (
              <li
                key={title}
                className="group relative flex cursor-pointer select-none gap-4 py-3 pl-4 transition-colors duration-200 first:pt-0 last:pb-0"
                onMouseEnter={() => setHoveredIdx(index)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {isActive && (
                  <motion.div
                    className="absolute bottom-0 left-0 top-0 w-[2px]"
                    style={{ background: EMBER }}
                    layoutId="activeApproachIndicator"
                  />
                )}
                <div className="mt-0.5">
                  <Icon className="size-4 transition-transform duration-200" style={{ color: isActive ? EMBER : GRAY_600, transform: isActive ? 'scale(1.1)' : 'none' }} />
                </div>
                <div className="grow">
                  <div className="flex items-baseline justify-between gap-4">
                    <h3 className="text-[15px] font-semibold transition-all duration-200" style={{ color: isActive ? INK : GRAY_600 }}>{title}</h3>
                    <span className="font-mono text-[10px] text-[#a3a3a3]">0{index + 1}</span>
                  </div>
                  <motion.div
                    initial={false}
                    animate={{ height: isActive ? 'auto' : 0, opacity: isActive ? 1 : 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <p className="pb-1 pt-2 text-[13.5px] leading-[1.55]" style={{ color: GRAY_600 }}>{body}</p>
                  </motion.div>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </Section>
  )
}

function FAQ({ lang }: { lang: Locale }) {
  const t = content[lang].faq

  return (
    <Section id="faq" tone="gray">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(faqPageSchema(t.items, lang)) }}
      />
      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <div>
          <SectionTitle>{t.title}</SectionTitle>
          <SectionLede>{t.subtitle}</SectionLede>
        </div>
        <div className="divide-y rounded-[6px] border bg-white" style={{ borderColor: GRAY_200 }}>
          {t.items.map((item) => (
            <details key={item.question} className="group p-4 transition-colors duration-200 open:bg-[#F7F2ED]/50">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[14.5px] font-bold outline-none" style={{ color: INK }}>
                {item.question}
                <span className="font-mono text-[16px] leading-none transition-transform duration-200 group-open:rotate-45" style={{ color: EMBER }}>+</span>
              </summary>
              <p className="mt-2.5 max-w-[64ch] text-[13px] leading-relaxed" style={{ color: GRAY_600 }}>{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </Section>
  )
}

export function FormationsPage({ lang }: { lang: Locale }) {
  const page = content[lang]
  const heroCopy: HeroCopy = {
    ...page.hero,
    ctaSecondaryHref: lang === 'en' ? '/en/method' : '/methode',
  }

  const pageUrl = `https://lucid-lab.fr${pagePath[lang]}`
  const homeUrl = lang === 'en' ? 'https://lucid-lab.fr/en' : 'https://lucid-lab.fr'
  const structuredData = [
    breadcrumbSchema([
      { name: lang === 'en' ? 'Home' : 'Accueil', item: homeUrl },
      { name: lang === 'en' ? 'Enterprise AI training' : 'Formations IA entreprises', item: pageUrl },
    ]),
    serviceSchema({
      name: lang === 'en' ? 'Enterprise AI training' : 'Formations IA entreprises',
      description: page.hero.subtitle.replace(/\*\*/g, ''),
      url: pageUrl,
      lang,
    }),
  ]

  return (
    <div className="flex w-full flex-col" style={{ background: PAPER }}>
      {structuredData.map((schema, i) => (
        <script
          key={i}
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(schema) }}
        />
      ))}
      <Header />
      <main className="grow">
        <HeroSection
          lang={lang}
          copy={heroCopy}
          visual={
            <div
              className="relative h-full w-full"
              style={{
                background: '#F7F0E6',
                WebkitMaskImage: 'radial-gradient(132% 128% at 53% 45%, #000 60%, transparent 100%)',
                maskImage: 'radial-gradient(132% 128% at 53% 45%, #000 60%, transparent 100%)',
              }}
            >
              <Image
                src="/hero-image.jpeg"
                alt={
                  lang === 'en'
                    ? 'The four Lucid-Lab training modules: Claude setup, autonomous AI agents, AI productivity, no-code automation'
                    : 'Les quatre modules de formation Lucid-Lab : Setup Claude, agents IA autonomes, IA productivité, automatisation no-code'
                }
                fill
                priority
                sizes="(min-width: 640px) 55vw, 100vw"
                className="object-contain object-center"
              />
            </div>
          }
        />
        <CatalogBento lang={lang} />
        <Approach lang={lang} />
        <FAQ lang={lang} />
        <AuditFlashBookingSection lang={lang} />
      </main>
      <MarketingFooter lang={lang} />
    </div>
  )
}
