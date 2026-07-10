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
      titleLine1: 'Un second cerveau',
      titleLine2: 'pour votre entreprise.',
      subtitle:
        'On installe Claude et on le connecte à ce que votre entreprise sait déjà : **vos offres, vos process, vos clients**. Vos équipes n’ont plus à tout réexpliquer à chaque conversation.',
      subtitleLine2: 'Installé en 14 jours. Tout reste **votre propriété**.',
      ctaPrimary: 'Réserver un audit IA',
      ctaPrimaryHref: '#booking',
      ctaSecondary: 'Voir la méthode',
      ctaSecondaryHref: '/methode',
    },
    problems: {
      title: 'Chacun utilise l’IA dans son coin.',
      subtitle:
        'ChatGPT et Claude sont déjà dans l’entreprise, mais rien ne se transmet : ce que l’un apprend ne sert pas aux autres, et tout reste à refaire.',
      monitorLabel: '// Second cerveau en direct',
      sources: ['Mails', 'Agenda', 'Drive', 'CRM'],
      hub: 'Second cerveau',
      statuses: ['contexte chargé', 'dossier retrouvé', 'réponse préparée'],
      items: [
        [
          'Les informations sont éparpillées',
          'Les process sont dans les têtes, les documents dans le Drive, les décisions dans les mails, les chiffres dans le CRM. Personne n’a la vue d’ensemble.',
        ],
        [
          'L’IA ne connaît pas votre entreprise',
          'Un assistant générique ne sait rien de vos offres ni de vos clients. Il faut tout lui réexpliquer, et les réponses restent vagues.',
        ],
        [
          'Les résultats dépendent des personnes',
          'Chacun utilise l’IA à sa manière. La qualité varie d’une personne à l’autre et les bonnes pratiques ne circulent pas.',
        ],
        [
          'Le savoir part avec les départs',
          'L’expérience accumulée reste dans quelques têtes. Quand une personne s’en va, tout est à reconstruire.',
        ],
      ],
    },
    system: {
      title: 'Ce qu’on installe.',
      subtitle: 'Pas un abonnement de plus : une base de connaissance et des outils reliés à vos comptes, qui restent à vous.',
      items: [
        {
          detail: 'Claude',
          title: 'Claude, configuré pour vos équipes',
          body: 'On prépare les comptes, les projets et les instructions pour chaque équipe. Dès le premier jour, Claude connaît votre métier, votre ton et vos règles internes.',
        },
        {
          detail: 'Connaissance',
          title: 'Une base de connaissance structurée',
          body: 'Vos offres, vos process, vos clients et vos décisions, organisés dans des fichiers simples, lisibles par l’IA comme par vos équipes. C’est le second cerveau de l’entreprise.',
        },
        {
          detail: 'Connecteurs',
          title: 'Relié à vos outils',
          body: 'Claude lit vos mails, votre agenda, votre Drive ou votre CRM, selon les règles d’accès que vous fixez.',
        },
        {
          detail: 'Preuves',
          title: 'Deux automatisations pour commencer',
          body: 'Pendant l’installation, on automatise deux tâches récurrentes de bout en bout. Vous jugez sur vos dossiers, pas sur une démonstration.',
        },
        {
          detail: 'Formation',
          title: 'Vos équipes formées',
          body: 'Chaque équipe apprend à travailler avec le système. Une personne en interne est formée pour le faire vivre, avec un guide écrit.',
        },
        {
          detail: 'Propriété',
          title: 'Tout reste à vous',
          body: 'Les comptes sont à votre nom, les fichiers restent lisibles sans nous et la maintenance est documentée. Si la collaboration s’arrête, le système continue de fonctionner.',
        },
      ],
    },
    timeline: {
      title: 'Installé en 14 jours.',
      subtitle: 'Le déroulé est le même pour chaque installation, du premier entretien à l’autonomie de vos équipes.',
      steps: [
        'Jours 1 à 3 : état des lieux de vos outils et choix des deux automatisations',
        'Jours 4 à 8 : installation de Claude et connexion à vos outils',
        'Jours 9 à 12 : la base se remplit, les automatisations démarrent',
        'Jours 13 et 14 : formation des équipes et passage de relais',
      ],
    },
    proof: {
      title: 'Les résultats chez une cliente.',
      subtitle:
        'Artisane en signalétique, seule à la tête de son atelier. On a installé la mémoire de son entreprise, un assistant relié à ses mails, son agenda et son Drive, et la génération de ses documents. Les chiffres, arrondis, viennent de l’étude de cas réalisée avec elle.',
      imageAlt: 'Une dirigeante travaille avec Claude connecté à la connaissance de son entreprise',
      impactLabel: '// Impact',
      items: [
        {
          title: 'Les demandes clients traitées plus vite',
          body: 'L’assistant lit la demande, retrouve le dossier et prépare une réponse ou un devis, qu’elle relit avant envoi.',
          metric: '9 h gagnées par semaine',
        },
        {
          title: 'Moins de travail administratif',
          body: 'Les tâches répétitives sont prises en charge par le système. Ce temps retourne à l’atelier.',
          metric: '40 h gagnées par mois',
        },
        {
          title: 'Sans embaucher',
          body: 'Le temps récupéré équivaut à un quart de poste administratif, dès le premier mois.',
          metric: 'un quart de poste',
        },
      ],
    },
    faq: {
      title: 'Questions fréquentes.',
      subtitle: 'Les réponses aux questions qu’on nous pose le plus souvent.',
      items: [
        {
          question: 'Qu’est-ce qu’un second cerveau d’entreprise ?',
          answer:
            'Une base de connaissance qui rassemble ce que votre entreprise sait : offres, process, clients, décisions. Elle est écrite dans des fichiers simples, lisibles par l’IA comme par vos équipes. Connectée à Claude, elle lui permet de répondre avec votre contexte plutôt que par des généralités.',
        },
        {
          question: 'Pourquoi Claude et pas un autre outil ?',
          answer:
            'C’est aujourd’hui l’outil le plus solide pour travailler avec beaucoup de contexte et se connecter à vos logiciels. Et comme la base est en fichiers standards, elle ne dépend pas de Claude : si un meilleur outil sort demain, vous changez sans tout refaire.',
        },
        {
          question: 'Nos données restent-elles chez nous ?',
          answer:
            'Oui. La base est stockée dans vos outils (fichiers, Drive ou Git, au choix), les accès suivent vos règles et les données sensibles sont écartées dès le départ. Les comptes Claude sont ouverts à votre nom.',
        },
        {
          question: 'Combien de temps prend l’installation ?',
          answer:
            '14 jours entre le premier entretien et la fin de la formation, en suivant le déroulé décrit plus haut. De votre côté : quelques entretiens courts et deux sessions de formation.',
        },
        {
          question: 'Et après l’installation ?',
          answer:
            'Vos équipes sont autonomes. Une personne en interne fait vivre la base avec le guide fourni. Si vous voulez aller plus loin (agents, automatisations métier), on peut continuer ensemble, mais rien ne vous y oblige.',
        },
      ],
    },
  },
  en: {
    hero: {
      titleLine1: 'A second brain',
      titleLine2: 'for your company.',
      subtitle:
        'We install Claude and connect it to what your company already knows: **your offers, your processes, your clients**. Your teams stop re-explaining the company in every conversation.',
      subtitleLine2: 'Installed in 14 days. Everything stays **your property**.',
      ctaPrimary: 'Book an AI audit',
      ctaPrimaryHref: '#booking',
      ctaSecondary: 'See the method',
      ctaSecondaryHref: '/en/method',
    },
    problems: {
      title: 'Everyone uses AI on their own.',
      subtitle:
        'ChatGPT and Claude are already inside the company, but nothing carries over: what one person learns does not help the others, and the same work gets redone.',
      monitorLabel: '// Second brain, live',
      sources: ['Email', 'Calendar', 'Drive', 'CRM'],
      hub: 'Second brain',
      statuses: ['context loaded', 'file found', 'answer drafted'],
      items: [
        [
          'Information is scattered',
          'Processes live in heads, documents in the Drive, decisions in emails, numbers in the CRM. Nobody has the full picture.',
        ],
        [
          'AI does not know your company',
          'A generic assistant knows nothing about your offers or your clients. Everything has to be re-explained, and answers stay vague.',
        ],
        [
          'Results depend on people',
          'Everyone uses AI their own way. Quality varies from one person to the next and good practices do not spread.',
        ],
        [
          'Knowledge leaves with departures',
          'Accumulated experience sits in a few heads. When one person leaves, everything has to be rebuilt.',
        ],
      ],
    },
    system: {
      title: 'What we install.',
      subtitle: 'Not another subscription: a knowledge base and tools connected to your accounts, and they stay yours.',
      items: [
        {
          detail: 'Claude',
          title: 'Claude, configured for your teams',
          body: 'We prepare the accounts, projects and instructions for each team. From day one, Claude knows your business, your tone and your internal rules.',
        },
        {
          detail: 'Knowledge',
          title: 'A structured knowledge base',
          body: 'Your offers, processes, clients and decisions, organized in simple files readable by AI and by your teams. This is the company’s second brain.',
        },
        {
          detail: 'Connectors',
          title: 'Connected to your tools',
          body: 'Claude reads your email, calendar, Drive or CRM, under access rules you define.',
        },
        {
          detail: 'Proof',
          title: 'Two automations to start',
          body: 'During the install, we automate two recurring tasks end to end. You judge on your files, not on a demonstration.',
        },
        {
          detail: 'Training',
          title: 'Your teams trained',
          body: 'Each team learns to work with the system. One person in-house is trained to keep it alive, with a written guide.',
        },
        {
          detail: 'Ownership',
          title: 'Everything stays yours',
          body: 'Accounts in your name, files readable without us, documented maintenance. If the collaboration stops, the system keeps working.',
        },
      ],
    },
    timeline: {
      title: 'Installed in 14 days.',
      subtitle: 'The sequence is the same for every install, from the first interview to your teams’ autonomy.',
      steps: [
        'Days 1 to 3: review of your tools and choice of the two automations',
        'Days 4 to 8: Claude install and connection to your tools',
        'Days 9 to 12: the base fills up, the automations start',
        'Days 13 and 14: team training and handover',
      ],
    },
    proof: {
      title: 'Results with one client.',
      subtitle:
        'A signage craftswoman running her workshop alone. We installed her company memory, an assistant connected to her email, calendar and Drive, and document generation. The rounded numbers come from the case study produced with her.',
      imageAlt: 'A founder working with Claude connected to her company knowledge',
      impactLabel: '// Impact',
      items: [
        {
          title: 'Client requests handled faster',
          body: 'The assistant reads the request, finds the file and prepares an answer or a quote, which she reviews before sending.',
          metric: '9 h saved per week',
        },
        {
          title: 'Less admin work',
          body: 'Recurring tasks are handled by the system. That time goes back to the workshop.',
          metric: '40 h saved per month',
        },
        {
          title: 'Without hiring',
          body: 'The recovered time equals a quarter of an admin position, from the first month.',
          metric: 'a quarter position',
        },
      ],
    },
    faq: {
      title: 'Frequent questions.',
      subtitle: 'Answers to the questions we hear most often.',
      items: [
        {
          question: 'What is a company second brain?',
          answer:
            'A knowledge base that gathers what your company knows: offers, processes, clients, decisions. It is written in simple files, readable by AI and by your teams. Connected to Claude, it lets him answer with your context instead of generalities.',
        },
        {
          question: 'Why Claude and not another tool?',
          answer:
            'It is currently the most solid tool for working with large context and connecting to your software. And since the base is standard files, it does not depend on Claude: if a better tool ships tomorrow, you switch without redoing everything.',
        },
        {
          question: 'Does our data stay with us?',
          answer:
            'Yes. The base is stored in your tools (files, Drive or Git, your choice), access follows your rules and sensitive data is excluded from the start. The Claude accounts are opened in your name.',
        },
        {
          question: 'How long does the install take?',
          answer:
            '14 days from the first interview to the end of training, following the sequence described above. On your side: a few short interviews and two training sessions.',
        },
        {
          question: 'What happens after the install?',
          answer:
            'Your teams are autonomous. One person in-house keeps the base alive with the delivered guide. If you want to go further (agents, business automations), we can continue together, but nothing forces you to.',
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
        <HeroSection
          lang={lang}
          copy={heroCopy}
          videoSrc="/second-brain-scan.mp4"
          videoPoster="/second-brain-scan-poster.png"
        />
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
