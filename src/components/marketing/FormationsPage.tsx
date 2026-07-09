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
      titleLine1: 'Des équipes formées.',
      titleLine2: 'Sur vos cas réels.',
      subtitle:
        'Des formations **construites par ceux qui livrent** des systèmes IA en production : vos outils, vos documents, vos workflows.',
      subtitleLine2: 'Dirigeants. Équipes métier. Ops. **Intra ou distanciel.**',
      ctaPrimary: 'Cadrer une formation',
      ctaPrimaryHref: '#booking',
      ctaSecondary: 'Voir la méthode',
      ctaSecondaryHref: '/methode',
    },
    catalog: {
      title: 'Le catalogue.',
      subtitle: 'Six modules, du comité de direction aux équipes techniques. Chacun se cale sur votre niveau, vos outils et vos règles.',
      items: [
        {
          detail: 'Une demi-journée · Comex, direction',
          title: 'Acculturation IA pour dirigeants',
          body: 'Ce que l’IA change pour votre secteur, ce que ça coûte, ce que ça risque. De quoi arbitrer vos chantiers sans dépendre du discours des vendeurs : panorama concret des usages, lecture coûts et RGPD, grille de décision.',
        },
        {
          detail: 'Une journée · Toutes équipes',
          title: 'Claude & ChatGPT au quotidien',
          body: 'Écrire des prompts qui tiennent, structurer des projets, produire des documents. Chaque participant repart avec ses propres cas d’usage configurés et une méthode reproductible.',
        },
        {
          detail: 'Une journée · Dirigeants, support',
          title: 'Second Brain : l’IA avec votre contexte',
          body: 'Structurer le contexte de l’entreprise pour que l’IA travaille avec, pas à côté. Le module qui prolonge notre installation Second Brain : base de connaissance, connecteurs, routines d’entretien.',
        },
        {
          detail: 'Un à deux jours · Ops, tech',
          title: 'Agents IA & automatisations',
          body: 'Construire des workflows n8n et des agents outillés, avec validation humaine sur les actions sensibles. Monitoring et reprise en main inclus.',
        },
        {
          detail: 'Une demi-journée · Direction, DSI, juridique',
          title: 'Gouvernance, sécurité & conformité',
          body: 'Règles d’usage, données sensibles, RGPD et AI Act : un cadre clair pour ouvrir l’IA aux équipes sans s’exposer. Charte d’usage et cartographie des données sensibles.',
        },
        {
          detail: 'À cadrer · Votre périmètre',
          title: 'Sur mesure, construit sur vos workflows',
          body: 'Un besoin spécifique, un métier particulier, un outil interne : on cadre sur vos irritants, on construit le contenu sur vos cas réels, et on assure le suivi après la session.',
        },
      ],
    },
    approach: {
      title: 'La pédagogie de ceux qui construisent.',
      subtitle:
        'Les formateurs sont les ingénieurs qui livrent nos systèmes clients. Les exemples viennent de projets réels, pas de démos préparées.',
      imageAlt: 'L’équipe Lucid-Lab anime un atelier IA en entreprise',
      items: [
        [
          'Vos cas, pas les nôtres',
          'Chaque session travaille sur vos documents, vos outils et vos workflows. Les acquis sont utilisables dès le lendemain.',
        ],
        [
          'Des formats courts et denses',
          'Une demi-journée à deux jours par module, en groupes de 4 à 12 personnes, en français ou en anglais.',
        ],
        [
          'Dans vos locaux ou à distance',
          'Intra-entreprise partout en France, ou en visio. Les supports sont remis à chaque participant.',
        ],
        [
          'Un suivi de 30 jours',
          'Canal de questions ouvert un mois après la session, et option de suivi mensuel pour ancrer les usages.',
        ],
      ],
    },
    faq: {
      title: 'Questions fréquentes.',
      subtitle: 'Les publics, les modules et le calendrier se cadrent lors du premier échange.',
      items: [
        {
          question: 'À qui s’adressent ces formations ?',
          answer:
            'Aux TPE, PME et ETI qui veulent des équipes opérationnelles sur l’IA : direction, équipes métier, ops et tech. Chaque module précise son public et s’ajuste à votre niveau de départ.',
        },
        {
          question: 'Faut-il des prérequis techniques ?',
          answer:
            'Non pour les modules dirigeants, quotidien et gouvernance. Le module agents & automatisations vise des profils ops ou tech à l’aise avec leurs outils.',
        },
        {
          question: 'Peut-on combiner plusieurs modules ?',
          answer:
            'Oui. Le parcours type combine une acculturation dirigeants, un module quotidien pour les équipes et un module spécialisé. On cadre l’ensemble lors du premier échange.',
        },
        {
          question: 'Travaillez-vous sur nos données réelles ?',
          answer:
            'Oui, c’est le principe. On définit ensemble en amont ce qui peut être utilisé en session, et les exercices respectent vos règles de confidentialité.',
        },
      ],
    },
  },
  en: {
    hero: {
      titleLine1: 'Teams trained.',
      titleLine2: 'On your real cases.',
      subtitle:
        'Training **built by the people who ship** AI systems to production: your tools, your documents, your workflows.',
      subtitleLine2: 'Leadership. Business teams. Ops. **On site or remote.**',
      ctaPrimary: 'Frame a training',
      ctaPrimaryHref: '#booking',
      ctaSecondary: 'See the method',
      ctaSecondaryHref: '/en/method',
    },
    catalog: {
      title: 'The catalog.',
      subtitle: 'Six modules, from the boardroom to technical teams. Each one adjusts to your level, your tools and your rules.',
      items: [
        {
          detail: 'Half a day · Board, executives',
          title: 'AI literacy for leadership',
          body: 'What AI changes for your sector, what it costs, what it risks. Enough to decide on your builds without depending on vendor talk: concrete usage panorama, cost and GDPR reading, decision grid.',
        },
        {
          detail: 'One day · All teams',
          title: 'Claude & ChatGPT day to day',
          body: 'Write prompts that hold, structure projects, produce documents. Every participant leaves with their own use cases configured and a repeatable method.',
        },
        {
          detail: 'One day · Leaders, support',
          title: 'Second Brain: AI with your context',
          body: 'Structure company context so AI works with it, not next to it. The module that extends our Second Brain install: knowledge base, connectors, maintenance routines.',
        },
        {
          detail: 'One to two days · Ops, tech',
          title: 'AI agents & automations',
          body: 'Build n8n workflows and tool-using agents, with human validation on sensitive actions. Monitoring and recovery included.',
        },
        {
          detail: 'Half a day · Executives, IT, legal',
          title: 'Governance, security & compliance',
          body: 'Usage rules, sensitive data, GDPR and the EU AI Act: a clear frame to open AI to teams without exposure. Usage charter and sensitive data mapping.',
        },
        {
          detail: 'To frame · Your scope',
          title: 'Custom, built on your workflows',
          body: 'A specific need, a particular craft, an internal tool: we frame on your pain points, build the content on your real cases, and follow up after the session.',
        },
      ],
    },
    approach: {
      title: 'Taught by the people who build.',
      subtitle:
        'The trainers are the engineers who ship our client systems. Examples come from real projects, not prepared demos.',
      imageAlt: 'The Lucid-Lab team leading an AI workshop in a company',
      items: [
        [
          'Your cases, not ours',
          'Every session works on your documents, your tools and your workflows. Skills are usable the next day.',
        ],
        [
          'Short, dense formats',
          'Half a day to two days per module, in groups of 4 to 12 people, in French or in English.',
        ],
        [
          'On site or remote',
          'In-company anywhere in France, or by video. Support material is delivered to every participant.',
        ],
        [
          'A 30-day follow-up',
          'A questions channel open for a month after the session, and an optional monthly follow-up to anchor usage.',
        ],
      ],
    },
    faq: {
      title: 'Frequent questions.',
      subtitle: 'Audiences, modules and calendar are framed during the first call.',
      items: [
        {
          question: 'Who is this training for?',
          answer:
            'Small and mid-size companies that want teams operational on AI: leadership, business teams, ops and tech. Each module states its audience and adjusts to your starting level.',
        },
        {
          question: 'Are technical prerequisites required?',
          answer:
            'Not for the leadership, day-to-day and governance modules. The agents & automations module targets ops or tech profiles comfortable with their tools.',
        },
        {
          question: 'Can we combine several modules?',
          answer:
            'Yes. The typical path combines a leadership session, a day-to-day module for teams and one specialized module. We frame the whole during the first call.',
        },
        {
          question: 'Do you work on our real data?',
          answer:
            'Yes, that is the point. We define upfront what can be used in session, and exercises follow your confidentiality rules.',
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
        <HeroSection lang={lang} copy={heroCopy} />
        <CatalogBento lang={lang} />
        <Approach lang={lang} />
        <FAQ lang={lang} />
        <AuditFlashBookingSection lang={lang} />
      </main>
      <MarketingFooter lang={lang} />
    </div>
  )
}
