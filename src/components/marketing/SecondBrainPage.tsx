'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Brain, FolderOpen, Network, Sparkles, Users, Zap } from 'lucide-react'

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

const pagePath = { fr: '/second-brain', en: '/en/second-brain' } as const

type SecondBrainContent = {
  hero: HeroCopy
  problems: {
    title: string
    subtitle: string
    monitorLabel: string
    sources: string[]
    hub: string
    statuses: string[]
    items: [string, string][]
  }
  system: {
    title: string
    subtitle: string
    items: { detail: string; title: string; body: string }[]
  }
  timeline: {
    title: string
    subtitle: string
    steps: string[]
  }
  proof: {
    title: string
    subtitle: string
    imageAlt: string
    impactLabel: string
    items: { title: string; body: string; metric: string }[]
  }
  faq: {
    title: string
    subtitle: string
    items: { question: string; answer: string }[]
  }
}

const content: Record<Locale, SecondBrainContent> = {
  fr: {
    hero: {
      titleLine1: 'Un second cerveau.',
      titleLine2: 'Pour votre entreprise.',
      subtitle:
        'Vos équipes utilisent déjà l’IA, chacune dans son coin. On installe **Claude branché sur votre contexte** : offres, process, clients, décisions.',
      subtitleLine2: 'Installé en 14 jours. **Propriété de l’entreprise.**',
      ctaPrimary: 'Réserver un audit IA',
      ctaPrimaryHref: '#booking',
      ctaSecondary: 'Voir la méthode',
      ctaSecondaryHref: '/methode',
    },
    problems: {
      title: 'Vos équipes ont l’IA. Votre entreprise n’a rien.',
      subtitle:
        'L’usage individuel progresse vite. L’intelligence collective, elle, ne se capitalise nulle part : c’est exactement ce que le second cerveau corrige.',
      monitorLabel: '// Second cerveau en direct',
      sources: ['Mails', 'Agenda', 'Drive', 'CRM'],
      hub: 'Second cerveau',
      statuses: ['contexte chargé', 'réponse sourcée', 'automatisation exécutée'],
      items: [
        [
          'Le contexte est dispersé',
          'Les process vivent dans des têtes, les documents dans le Drive, les décisions dans les mails, les chiffres dans le CRM. Aucun outil ne voit l’ensemble.',
        ],
        [
          'Chaque prompt repart de zéro',
          'Sans contexte partagé, une IA générique donne des réponses génériques. Chacun réexplique l’entreprise à chaque conversation.',
        ],
        [
          'La qualité dépend de qui prompte',
          'Chaque équipe réinvente ses usages dans son coin. Les résultats varient d’une personne à l’autre et rien ne se capitalise.',
        ],
        [
          'Le savoir part avec les gens',
          'Ce que savent dix personnes devrait être interrogeable par toute l’équipe. Aujourd’hui, un départ efface des années de contexte.',
        ],
      ],
    },
    system: {
      title: 'Ce qu’on installe.',
      subtitle: 'Pas un abonnement de plus : une infrastructure de connaissance branchée sur vos comptes, que vous gardez.',
      items: [
        {
          detail: 'Claude',
          title: 'Claude configuré pour vos équipes',
          body: 'Comptes, projets, instructions et bonnes pratiques : chaque équipe démarre avec un Claude qui connaît déjà le métier, le ton et les règles de la maison.',
        },
        {
          detail: 'Connaissance',
          title: 'Le second cerveau',
          body: 'Votre contexte structuré en fichiers Markdown : offres, process, clients, décisions. Lisible par l’IA et par les humains, propriété de l’entreprise.',
        },
        {
          detail: 'Connecteurs',
          title: 'Branché sur vos outils',
          body: 'Mails, agenda, Drive, CRM : Claude lit ce dont il a besoin, selon vos règles d’accès, et chaque accès reste visible.',
        },
        {
          detail: 'Preuves',
          title: 'Deux automatisations réelles',
          body: 'Deux workflows mis en production pendant l’installation. La valeur se mesure sur vos tâches, pas sur une démo.',
        },
        {
          detail: 'Adoption',
          title: 'Formation et référent interne',
          body: 'Sessions d’usage par équipe, un référent formé pour entretenir le système, guide et bonnes pratiques remis.',
        },
        {
          detail: 'Propriété',
          title: 'Tout vous appartient, dès le premier jour',
          body: 'Comptes à votre nom, fichiers en clair, connecteurs documentés, runbook de maintenance. Pas de boîte noire, pas de dépendance à l’agence : si on part demain, tout continue de tourner.',
        },
      ],
    },
    timeline: {
      title: 'Installé en 14 jours.',
      subtitle: 'Du premier entretien au transfert complet : un calendrier court et des étapes lisibles.',
      steps: [
        'Cadrage : sources, accès et automatisations à prouver',
        'Installation de Claude, de la base et des connecteurs',
        'Le contexte se remplit, les deux preuves tournent',
        'Formation des équipes et transfert complet',
      ],
    },
    proof: {
      title: 'Ce que ça change, mesuré.',
      subtitle:
        'Premier système installé chez une artisane (signalétique, dirigeante seule) : mémoire d’entreprise, assistant branché sur les mails, l’agenda et le Drive, génération de documents. Chiffres issus de l’étude de cas produite avec la cliente.',
      imageAlt: 'Une dirigeante travaille avec Claude branché sur la connaissance de son entreprise',
      impactLabel: '// Impact',
      items: [
        {
          title: 'Mails, devis et documents préparés avec le contexte maison',
          body: 'L’assistant lit la demande, retrouve le dossier et prépare la réponse ou le document.',
          metric: '≈ 9 h / semaine',
        },
        {
          title: 'Du temps administratif rendu au métier',
          body: 'Le back-office récurrent est absorbé par le système, la dirigeante retourne à l’atelier.',
          metric: '≈ 40 h / mois',
        },
        {
          title: 'L’équivalent d’un quart de poste',
          body: 'Sans recrutement, dès le premier mois d’usage réel.',
          metric: '≈ ¼ de poste admin',
        },
      ],
    },
    faq: {
      title: 'Questions fréquentes.',
      subtitle: 'Le périmètre exact se cadre lors du premier échange.',
      items: [
        {
          question: 'Qu’est-ce qu’un second cerveau d’entreprise ?',
          answer:
            'Une base de connaissance structurée qui centralise le contexte de l’entreprise (offres, process, clients, décisions) dans des fichiers lisibles par l’IA et par les humains. Branchée sur Claude, elle transforme un chatbot générique en assistant qui connaît réellement votre entreprise.',
        },
        {
          question: 'Pourquoi Claude plutôt qu’un autre outil ?',
          answer:
            'Claude gère de gros volumes de contexte, se connecte à vos outils via les connecteurs MCP et travaille directement sur des fichiers. C’est aujourd’hui le socle le plus solide pour ce type de système. Et le contenu reste en Markdown standard : si un autre modèle fait mieux demain, votre second cerveau le suit.',
        },
        {
          question: 'Nos données restent-elles chez nous ?',
          answer:
            'Oui. La base de connaissance vit dans vos outils (fichiers, Drive ou Git selon votre choix), les accès suivent vos règles, et les données sensibles sont exclues du périmètre dès le cadrage. Les comptes Claude sont les vôtres.',
        },
        {
          question: 'Combien de temps prend l’installation ?',
          answer:
            '14 jours entre le premier entretien et le transfert : cadrage, installation, remplissage du contexte, deux automatisations de preuve, formation des équipes.',
        },
        {
          question: 'Que se passe-t-il après l’installation ?',
          answer:
            'Vos équipes sont autonomes : un référent interne entretient le second cerveau avec le guide remis. Si vous voulez aller plus loin (agents, automatisations métier), l’offre Build & Run prend le relais.',
        },
      ],
    },
  },
  en: {
    hero: {
      titleLine1: 'A second brain.',
      titleLine2: 'For your company.',
      subtitle:
        'Your teams already use AI, each on their own. We install **Claude connected to your context**: offers, processes, clients, decisions.',
      subtitleLine2: 'Installed in 14 days. **Owned by your company.**',
      ctaPrimary: 'Book an AI audit',
      ctaPrimaryHref: '#booking',
      ctaSecondary: 'See the method',
      ctaSecondaryHref: '/en/method',
    },
    problems: {
      title: 'Your team has AI. Your company has nothing.',
      subtitle:
        'Individual usage grows fast. Collective intelligence compounds nowhere: that is exactly what the second brain fixes.',
      monitorLabel: '// Second brain, live',
      sources: ['Email', 'Calendar', 'Drive', 'CRM'],
      hub: 'Second brain',
      statuses: ['context loaded', 'answer sourced', 'automation executed'],
      items: [
        [
          'Context is scattered',
          'Processes live in heads, documents in the Drive, decisions in emails, numbers in the CRM. No tool sees the whole picture.',
        ],
        [
          'Every prompt starts from zero',
          'Without shared context, generic AI gives generic answers. Everyone re-explains the company in every conversation.',
        ],
        [
          'Quality depends on who prompts',
          'Each team reinvents its own usage. Results vary from one person to the next and nothing compounds.',
        ],
        [
          'Knowledge leaves with people',
          'What ten people know should be queryable by the whole team. Today, one departure erases years of context.',
        ],
      ],
    },
    system: {
      title: 'What we install.',
      subtitle: 'Not another subscription: a knowledge infrastructure connected to your accounts, and it stays yours.',
      items: [
        {
          detail: 'Claude',
          title: 'Claude configured for your teams',
          body: 'Accounts, projects, instructions and best practices: every team starts with a Claude that already knows the business, the tone and the house rules.',
        },
        {
          detail: 'Knowledge',
          title: 'The second brain',
          body: 'Your context structured in Markdown files: offers, processes, clients, decisions. Readable by AI and by humans, owned by the company.',
        },
        {
          detail: 'Connectors',
          title: 'Connected to your tools',
          body: 'Email, calendar, Drive, CRM: Claude reads what it needs, under your access rules, and every access stays visible.',
        },
        {
          detail: 'Proof',
          title: 'Two real automations',
          body: 'Two workflows shipped to production during the install. Value is measured on your tasks, not on a demo.',
        },
        {
          detail: 'Adoption',
          title: 'Training and internal owner',
          body: 'Usage sessions per team, one internal owner trained to maintain the system, guide and best practices delivered.',
        },
        {
          detail: 'Ownership',
          title: 'Everything is yours, from day one',
          body: 'Accounts in your name, plain files, documented connectors, maintenance runbook. No black box, no agency dependence: if we leave tomorrow, everything keeps running.',
        },
      ],
    },
    timeline: {
      title: 'Installed in 14 days.',
      subtitle: 'From the first interview to the full handover: a short calendar with readable steps.',
      steps: [
        'Framing: sources, access and automations to prove',
        'Install of Claude, the knowledge base and connectors',
        'Context fills up, the two proofs run',
        'Team training and full handover',
      ],
    },
    proof: {
      title: 'What it changes, measured.',
      subtitle:
        'First system installed for a solo founder (signage workshop): company memory, an assistant connected to email, calendar and Drive, document generation. Numbers from the case study produced with the client.',
      imageAlt: 'A founder working with Claude connected to her company knowledge',
      impactLabel: '// Impact',
      items: [
        {
          title: 'Emails, quotes and documents prepared with house context',
          body: 'The assistant reads the request, finds the file and prepares the answer or the document.',
          metric: '≈ 9 h / week',
        },
        {
          title: 'Admin time given back to the craft',
          body: 'Recurring back-office is absorbed by the system, the founder goes back to the workshop.',
          metric: '≈ 40 h / month',
        },
        {
          title: 'The equivalent of a quarter position',
          body: 'Without hiring, from the first month of real usage.',
          metric: '≈ ¼ admin position',
        },
      ],
    },
    faq: {
      title: 'Frequent questions.',
      subtitle: 'The exact scope is framed during the first call.',
      items: [
        {
          question: 'What is a company second brain?',
          answer:
            'A structured knowledge base that centralizes company context (offers, processes, clients, decisions) in files readable by AI and by humans. Connected to Claude, it turns a generic chatbot into an assistant that actually knows your company.',
        },
        {
          question: 'Why Claude rather than another tool?',
          answer:
            'Claude handles large context, connects to your tools through MCP connectors and works directly on files. It is the most solid base for this kind of system today. And the content stays in standard Markdown: if another model does better tomorrow, your second brain follows.',
        },
        {
          question: 'Does our data stay with us?',
          answer:
            'Yes. The knowledge base lives in your tools (files, Drive or Git, your choice), access follows your rules, and sensitive data is excluded from scope at framing. The Claude accounts are yours.',
        },
        {
          question: 'How long does the install take?',
          answer:
            '14 days from the first interview to the handover: framing, install, context filling, two proof automations, team training.',
        },
        {
          question: 'What happens after the install?',
          answer:
            'Your teams are autonomous: an internal owner maintains the second brain with the delivered guide. If you want to go further (agents, business automations), the Build & Run offer takes over.',
        },
      ],
    },
  },
}

const problemIcons = [Network, Zap, Users, Sparkles] as const

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

// Live "second brain" monitor: sources feed the hub, statuses pulse. Sibling of
// the homepage's diagnostic monitor, built with the same motion idioms.
function SecondBrainMonitor({ t }: { t: SecondBrainContent['problems'] }) {
  return (
    <div className="mt-6 hidden rounded-[8px] border bg-[#FDFDFB] p-4 lg:block" style={{ borderColor: GRAY_200 }}>
      <span className="mb-3 block font-mono text-[10px] uppercase tracking-[0.14em] text-[#8a8276]">{t.monitorLabel}</span>
      <div className="flex flex-wrap gap-1.5">
        {t.sources.map((source, index) => (
          <motion.span
            key={source}
            className="flex items-center gap-1.5 rounded-[6px] border px-2 py-1 font-mono text-[11px]"
            style={{ borderColor: GRAY_200, color: GRAY_600, background: 'rgba(10,10,10,0.02)' }}
            animate={{ opacity: [0.45, 1, 0.45] }}
            transition={{ duration: 3.2, delay: index * 0.4, repeat: Infinity, ease: 'easeOut' }}
          >
            <FolderOpen className="size-3" style={{ color: EMBER }} aria-hidden />
            {source}
          </motion.span>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2 rounded-[6px] border px-3 py-2" style={{ borderColor: GRAY_200, background: PAPER }}>
        <Brain className="size-4" style={{ color: EMBER }} aria-hidden />
        <span className="text-[12.5px] font-semibold" style={{ color: INK }}>{t.hub}</span>
        <motion.span
          className="ml-auto h-2 w-2 rounded-full"
          style={{ background: EMBER }}
          animate={{ scale: [1, 1.35, 1], opacity: [0.55, 1, 0.55] }}
          transition={{ duration: 2.2, repeat: Infinity, ease: 'easeOut' }}
        />
      </div>
      <div className="mt-2 space-y-1.5">
        {t.statuses.map((status, index) => (
          <div key={status} className="flex items-center gap-2 font-mono text-[11px] leading-none">
            <motion.span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: index === 0 ? EMBER : GRAY_200 }}
              animate={{ opacity: [0.4, 1, 0.4] }}
              transition={{ duration: 2.4, delay: index * 0.5, repeat: Infinity, ease: 'easeOut' }}
            />
            <span style={{ color: '#8b8478' }}>{status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

function ContextProblems({ lang }: { lang: Locale }) {
  const t = content[lang].problems
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  return (
    <Section id="probleme">
      <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr] lg:gap-12">
        <div>
          <SectionTitle>{t.title}</SectionTitle>
          <SectionLede>{t.subtitle}</SectionLede>
          <SecondBrainMonitor t={t} />
        </div>

        <ul className="flex flex-col divide-y" style={{ borderColor: GRAY_400 + '30' }}>
          {t.items.map(([title, body], index) => {
            const Icon = problemIcons[index] ?? Sparkles
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
                    layoutId="activeSecondBrainProblem"
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

function SystemBento({ lang }: { lang: Locale }) {
  const t = content[lang].system

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
    <Section id="systeme" tone="ink">
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
                  <span className="flex size-6 items-center justify-center rounded-full border border-white/10 bg-white/5 font-mono text-[10px] text-white/50">0{idx + 1}</span>
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

function Timeline({ lang }: { lang: Locale }) {
  const t = content[lang].timeline

  return (
    <Section id="quatorze-jours">
      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <SectionTitle>{t.title}</SectionTitle>
        <SectionLede>{t.subtitle}</SectionLede>
      </div>

      <div className="mx-auto mt-16 flex w-full max-w-5xl flex-col font-sans md:mt-24">
        {t.steps.map((step, idx) => {
          const offsetClass = ['md:ml-[0%]', 'md:ml-[8%]', 'md:ml-[16%]', 'md:ml-[24%]'][idx]

          return (
            <motion.div
              key={idx}
              className={`group flex w-full cursor-default items-center gap-5 p-3 transition-transform duration-500 md:w-[80%] md:gap-8 md:p-5 ${offsetClass}`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-10% 0px -10% 0px' }}
              transition={{ duration: 0.6, delay: 0.05 }}
            >
              <motion.div
                className="cursor-default select-none text-[4rem] font-black tracking-tighter transition-colors duration-500 md:text-[6.5rem]"
                initial={{ color: '#F2DCC9' }}
                whileInView={{ color: '#E4A076' }}
                viewport={{ margin: '-25% 0px -25% 0px' }}
              >
                0{idx + 1}
              </motion.div>

              <motion.h3
                className="text-[18px] font-bold leading-tight transition-colors duration-500 md:text-[28px] md:leading-snug"
                initial={{ color: '#BDBAB6' }}
                whileInView={{ color: '#1C1917' }}
                viewport={{ margin: '-25% 0px -25% 0px' }}
              >
                {step}
              </motion.h3>
            </motion.div>
          )
        })}
      </div>
    </Section>
  )
}

function Proof({ lang }: { lang: Locale }) {
  const t = content[lang].proof

  return (
    <Section id="preuves" tone="gray">
      <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:gap-12">
        <div>
          <SectionTitle>{t.title}</SectionTitle>
          <SectionLede>{t.subtitle}</SectionLede>
          <motion.div
            className="mt-8 overflow-hidden rounded-[12px] border bg-white shadow-sm"
            style={{ borderColor: GRAY_200 }}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="relative aspect-[3/2]">
              <Image src="/second-brain-claude.png" alt={t.imageAlt} fill sizes="(min-width: 1024px) 460px, 100vw" className="object-cover" />
            </div>
          </motion.div>
        </div>

        <div className="flex flex-col self-center">
          {t.items.map((item, idx) => (
            <motion.div
              key={item.title}
              className="group flex flex-col justify-between gap-6 border-t py-6 first:border-0 md:flex-row md:items-center"
              style={{ borderColor: GRAY_200 }}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: idx * 0.1 }}
            >
              <div className="md:w-3/5">
                <h3 className="text-[18px] font-bold tracking-tight text-stone-900">{item.title}</h3>
                <p className="mt-2 text-[14px] leading-relaxed text-stone-600">{item.body}</p>
              </div>

              <div className="flex flex-col md:w-2/5 md:items-end md:text-right">
                <div className="mb-1.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[#8a8276]">{t.impactLabel}</div>
                <p className="text-[22px] font-extrabold tracking-tight text-stone-900">{item.metric}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </Section>
  )
}

function FAQ({ lang }: { lang: Locale }) {
  const t = content[lang].faq

  return (
    <Section id="faq">
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

export function SecondBrainPage({ lang }: { lang: Locale }) {
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
      { name: 'Second Brain', item: pageUrl },
    ]),
    serviceSchema({
      name: lang === 'en' ? 'Second Brain install (Claude + company context)' : 'Installation Second Brain (Claude + contexte d’entreprise)',
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
        <ContextProblems lang={lang} />
        <SystemBento lang={lang} />
        <Timeline lang={lang} />
        <Proof lang={lang} />
        <FAQ lang={lang} />
        <AuditFlashBookingSection lang={lang} />
      </main>
      <MarketingFooter lang={lang} />
    </div>
  )
}
