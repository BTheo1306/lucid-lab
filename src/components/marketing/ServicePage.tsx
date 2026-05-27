'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight, Bot, Database, FileText, MonitorCheck, SearchCheck, ShieldCheck, Workflow } from 'lucide-react'

import { Header } from '@/components/ui/header'
import { MarketingFooter } from '@/components/marketing/HomePage'
import type { Locale } from '@/lib/i18n/client'

const INK = '#0A0A0A'
const PAPER = '#FAFAF7'
const GRAY_600 = '#525252'
const GRAY_400 = '#A3A3A3'
const GRAY_200 = '#E5E5E5'
const GRAY_100 = '#F2F2EE'
const EMBER = '#C85E1A'

export type ServicePageKey = 'audit' | 'data' | 'roadmap' | 'agents' | 'buildRun' | 'method' | 'cases'

type ContentSection = {
  title: string
  body: string
  items: string[]
}

type CaseCard = {
  context: string
  title: string
  problem: string
  solution: string[]
  result: string
}

type ServicePageContent = {
  eyebrow: string
  title: string
  intro: string
  primary: string
  secondary?: string
  sections: ContentSection[]
  deliverables: string[]
  cases?: CaseCard[]
}

const routes = {
  fr: {
    booking: '/audit-flash',
    method: '/methode',
    cases: '/cas-clients',
    blog: '/blog',
  },
  en: {
    booking: '/en/audit-flash',
    method: '/en/method',
    cases: '/en/case-studies',
    blog: '/en/blog',
  },
} as const

const content: Record<Locale, Record<ServicePageKey, ServicePageContent>> = {
  fr: {
    audit: {
      eyebrow: 'Audit IA & Opportunités',
      title: 'Choisir le premier chantier IA sans partir dans tous les sens.',
      intro:
        'Lucid-Lab lit vos workflows, vos données, vos outils et vos contraintes. Vous repartez avec les cas d’usage à lancer, les prérequis à régler et les chantiers à repousser.',
      primary: 'Réserver un audit',
      secondary: 'Voir la méthode',
      sections: [
        {
          title: 'Enjeu',
          body: 'Les équipes repèrent des idées IA partout. La direction doit choisir le premier système utile avec des critères lisibles.',
          items: ['Cas d’usage dispersés', 'ROI difficile à comparer', 'Risque data ou RGPD sous-estimé'],
        },
        {
          title: 'Méthode',
          body: 'On collecte les irritants métier, on cartographie les flux, on score chaque cas d’usage et on identifie le premier build réaliste.',
          items: ['Entretiens ciblés', 'Scoring valeur, faisabilité, risque', 'Séquence de build'],
        },
        {
          title: 'Résultat',
          body: 'Vous disposez d’une roadmap claire, défendable en interne et utilisable par les équipes techniques.',
          items: ['Priorités arbitrées', 'Périmètre du premier build', 'Risques visibles avant engagement'],
        },
      ],
      deliverables: ['Matrice de scoring', 'Cartographie workflow', 'Backlog de cas d’usage', 'Roadmap de build', 'Note risques et prérequis'],
    },
    data: {
      eyebrow: 'Data & SI Readiness',
      title: 'Vérifier les données, les accès et l’architecture avant le code.',
      intro:
        'Un système IA métier tient sur des sources fiables, des droits clairs et une architecture exploitable. Lucid-Lab prépare ce socle avant le développement.',
      primary: 'Évaluer la readiness',
      secondary: 'Voir Build & Run',
      sections: [
        {
          title: 'Enjeu',
          body: 'Le build ralentit quand les sources, formats, permissions et règles d’hébergement arrivent après le cadrage.',
          items: ['Accès non documentés', 'Fichiers et bases dispersés', 'Permissions métier floues'],
        },
        {
          title: 'Méthode',
          body: 'On inventorie les sources, on vérifie les flux, on documente les droits et on définit l’architecture cible.',
          items: ['Inventaire SI', 'Matrice droits et accès', 'Contraintes RGPD et hébergement'],
        },
        {
          title: 'Résultat',
          body: 'Les équipes savent ce qui peut être connecté, ce qui doit être nettoyé et ce qui doit rester hors périmètre.',
          items: ['Architecture cible', 'Plan de préparation data', 'Risques techniques classés'],
        },
      ],
      deliverables: ['Inventaire des sources', 'Matrice d’accès', 'Schéma d’architecture cible', 'Checklist RGPD', 'Plan de sécurisation'],
    },
    roadmap: {
      eyebrow: 'Roadmap Automatisation',
      title: 'Transformer les processus manuels en plan de build.',
      intro:
        'Lucid-Lab passe vos tâches répétitives au filtre valeur, faisabilité et risque. La roadmap donne un ordre de livraison, des dépendances et un premier lot.',
      primary: 'Cadrer une roadmap',
      secondary: 'Voir les cas clients',
      sections: [
        {
          title: 'Enjeu',
          body: 'Les workflows manuels coûtent cher quand personne ne les mesure, ne les relie ou ne les classe.',
          items: ['Consolidations Excel', 'Triage mail ou CRM', 'Reporting et relances manuelles'],
        },
        {
          title: 'Méthode',
          body: 'On mesure volumes, fréquence, irritants et dépendances, puis on découpe les automatisations en cycles livrables.',
          items: ['Cartographie avant/après', 'Backlog automatisation', 'Séquence par lots'],
        },
        {
          title: 'Résultat',
          body: 'Vous voyez quoi automatiser, dans quel ordre, avec quels prérequis et quel effet attendu.',
          items: ['Chantiers priorisés', 'Dépendances visibles', 'ROI estimé par lot'],
        },
      ],
      deliverables: ['Workflow avant/après', 'Backlog priorisé', 'Planning de livraison', 'Estimation ROI', 'Périmètre du premier lot'],
    },
    agents: {
      eyebrow: 'Agents IA & Outils Internes',
      title: 'Construire les systèmes que vos équipes utilisent tous les jours.',
      intro:
        'Lucid-Lab conçoit des agents IA, portails, dashboards et intégrations branchés à vos outils métier. Le système livré sert un workflow précis.',
      primary: 'Cadrer un build',
      secondary: 'Lire les cas clients',
      sections: [
        {
          title: 'Enjeu',
          body: 'Un agent IA utile doit lire les bonnes sources, respecter les droits et renvoyer une action contrôlable.',
          items: ['Qualification lead', 'Assistant connaissance', 'Reporting finance', 'Support interne'],
        },
        {
          title: 'Méthode',
          body: 'On définit le workflow cible, les sources, les outils, les règles de contrôle humain et le monitoring attendu.',
          items: ['Prototype branché', 'Tests sur cas réels', 'Mise en production progressive'],
        },
        {
          title: 'Résultat',
          body: 'Les équipes gagnent un outil intégré, documenté et surveillé, avec un propriétaire clair côté client.',
          items: ['Système en production', 'Logs et dashboard', 'Documentation de reprise'],
        },
      ],
      deliverables: ['Agent IA', 'Dashboard métier', 'Connecteurs', 'Portail interne', 'Monitoring qualité et coût'],
    },
    buildRun: {
      eyebrow: 'Build & Run',
      title: 'Déployer, surveiller et transférer le système.',
      intro:
        'Lucid-Lab prépare la mise en production, les runbooks, le monitoring et la formation. Le système doit rester opérable après la livraison.',
      primary: 'Parler du run',
      secondary: 'Voir la méthode',
      sections: [
        {
          title: 'Enjeu',
          body: 'Un système IA perd sa valeur quand personne ne surveille coût, qualité, accès, incidents et usages.',
          items: ['Coûts non suivis', 'Qualité non mesurée', 'Documentation absente'],
        },
        {
          title: 'Méthode',
          body: 'On met en place les indicateurs, alertes, runbooks, modes opératoires et sessions de transfert.',
          items: ['Monitoring coût et usage', 'Runbooks incidents', 'Formation ciblée'],
        },
        {
          title: 'Résultat',
          body: 'Le client garde la capacité de comprendre, opérer et faire évoluer le système.',
          items: ['Ownership clair', 'Transfert documenté', 'Run sous contrôle'],
        },
      ],
      deliverables: ['Déploiement', 'Monitoring', 'Runbooks', 'Documentation utilisateur', 'Formation et transfert'],
    },
    method: {
      eyebrow: 'Méthode Lucid-Lab',
      title: 'Du diagnostic au système en production.',
      intro:
        'La méthode relie conseil, architecture, build et adoption. Chaque étape produit un livrable que la direction peut relire et que les équipes peuvent utiliser.',
      primary: 'Réserver un audit',
      secondary: 'Voir les cas clients',
      sections: [
        {
          title: '1. Diagnostic terrain',
          body: 'On part des tâches, volumes, irritants, outils et contraintes. Les entretiens restent courts et orientés décision.',
          items: ['Workflows', 'Données', 'Risques'],
        },
        {
          title: '2. Roadmap et architecture',
          body: 'On score les cas d’usage, puis on propose la séquence de build, les dépendances et l’architecture cible.',
          items: ['Scoring', 'Priorisation', 'Architecture cible'],
        },
        {
          title: '3. Build, run et transfert',
          body: 'On construit, déploie, documente, monitor et forme les équipes. Le client garde les actifs prévus au périmètre.',
          items: ['Build', 'Monitoring', 'Documentation'],
        },
      ],
      deliverables: ['Diagnostic', 'Roadmap', 'Architecture', 'Système en production', 'Runbooks', 'Formation'],
    },
    cases: {
      eyebrow: 'Cas clients',
      title: 'Des systèmes livrés, avec actifs transférés.',
      intro:
        'Ces cas montrent les workflows traités, les livrables produits et les effets métier. Les noms restent anonymisés quand le client le demande.',
      primary: 'Réserver un audit',
      secondary: 'Lire les ressources',
      sections: [
        {
          title: 'Lecture',
          body: 'Chaque cas présente contexte, problème, système livré, métrique et actifs transférés.',
          items: ['Contexte', 'Système', 'Effet métier'],
        },
      ],
      deliverables: ['Code', 'Workflows', 'Documentation', 'Monitoring', 'Procédures de reprise'],
      cases: [
        {
          context: 'PME services, finance',
          title: 'Reporting finance automatisé',
          problem: 'La DAF consolidait exports ERP et fichiers Excel avant chaque comité.',
          solution: ['Extraction compta', 'Pack reporting', 'Alertes écarts budget'],
          result: 'Clôture passée de 4 jours à 2 h',
        },
        {
          context: 'Cabinet de services',
          title: 'Assistant interne de connaissance',
          problem: 'Les réponses vivaient dans plusieurs outils documentaires.',
          solution: ['Assistant web et Slack', 'Réponses sourcées', 'Permissions par groupe'],
          result: 'Environ 600 requêtes par mois',
        },
        {
          context: 'B2B SaaS',
          title: 'Qualification leads et support',
          problem: 'L’équipe triait les demandes entrantes à la main.',
          solution: ['Scoring ICP', 'Routage automatique', 'Pré-remplissage CRM'],
          result: '95 % des leads routés en moins de 5 min',
        },
      ],
    },
  },
  en: {
    audit: {
      eyebrow: 'AI Audit & Opportunities',
      title: 'Choose the first AI build without going in every direction.',
      intro:
        'Lucid-Lab reads your workflows, data, tools and constraints. You leave with use cases to launch, prerequisites to solve and builds to postpone.',
      primary: 'Book an audit',
      secondary: 'See the method',
      sections: [
        {
          title: 'Challenge',
          body: 'Teams spot AI ideas everywhere. Leaders need to choose the first useful system with readable criteria.',
          items: ['Scattered use cases', 'ROI hard to compare', 'Data or GDPR risk underestimated'],
        },
        {
          title: 'Method',
          body: 'We collect business irritants, map flows, score each use case and identify the first realistic build.',
          items: ['Focused interviews', 'Value, feasibility and risk scoring', 'Build sequence'],
        },
        {
          title: 'Result',
          body: 'You get a clear roadmap that is defensible internally and usable by technical teams.',
          items: ['Priorities decided', 'First build scope', 'Risks visible before commitment'],
        },
      ],
      deliverables: ['Scoring matrix', 'Workflow map', 'Use-case backlog', 'Build roadmap', 'Risk and prerequisite note'],
    },
    data: {
      eyebrow: 'Data & IT Readiness',
      title: 'Check data, access and architecture before code.',
      intro:
        'A business AI system depends on reliable sources, clear rights and an architecture teams can operate. Lucid-Lab prepares that base before development.',
      primary: 'Assess readiness',
      secondary: 'See Build & Run',
      sections: [
        {
          title: 'Challenge',
          body: 'The build slows down when sources, formats, permissions and hosting rules arrive after framing.',
          items: ['Undocumented access', 'Scattered files and databases', 'Unclear business permissions'],
        },
        {
          title: 'Method',
          body: 'We inventory sources, check flows, document rights and define the target architecture.',
          items: ['IT inventory', 'Rights and access matrix', 'GDPR and hosting constraints'],
        },
        {
          title: 'Result',
          body: 'Teams know what can be connected, what needs cleanup and what should stay outside scope.',
          items: ['Target architecture', 'Data preparation plan', 'Ranked technical risks'],
        },
      ],
      deliverables: ['Source inventory', 'Access matrix', 'Target architecture diagram', 'GDPR checklist', 'Security plan'],
    },
    roadmap: {
      eyebrow: 'Automation Roadmap',
      title: 'Turn manual processes into a build plan.',
      intro:
        'Lucid-Lab runs repetitive tasks through value, feasibility and risk criteria. The roadmap gives a delivery order, dependencies and a first batch.',
      primary: 'Frame a roadmap',
      secondary: 'See client cases',
      sections: [
        {
          title: 'Challenge',
          body: 'Manual workflows cost money when no one measures, connects or ranks them.',
          items: ['Excel consolidation', 'Email or CRM triage', 'Reporting and manual follow-ups'],
        },
        {
          title: 'Method',
          body: 'We measure volume, frequency, irritants and dependencies, then split automation into shippable cycles.',
          items: ['Before and after workflow', 'Automation backlog', 'Batch sequence'],
        },
        {
          title: 'Result',
          body: 'You see what to automate, in which order, with which prerequisites and expected effect.',
          items: ['Ranked builds', 'Visible dependencies', 'ROI estimate by batch'],
        },
      ],
      deliverables: ['Before and after workflow', 'Ranked backlog', 'Delivery plan', 'ROI estimate', 'First batch scope'],
    },
    agents: {
      eyebrow: 'AI Agents & Internal Tools',
      title: 'Build systems your teams use every day.',
      intro:
        'Lucid-Lab designs AI agents, portals, dashboards and integrations connected to your business tools. Each delivered system serves one precise workflow.',
      primary: 'Frame a build',
      secondary: 'Read client cases',
      sections: [
        {
          title: 'Challenge',
          body: 'A useful AI agent must read the right sources, respect rights and return a controllable action.',
          items: ['Lead qualification', 'Knowledge assistant', 'Finance reporting', 'Internal support'],
        },
        {
          title: 'Method',
          body: 'We define the target workflow, sources, tools, human controls and expected monitoring.',
          items: ['Connected prototype', 'Tests on real cases', 'Progressive production release'],
        },
        {
          title: 'Result',
          body: 'Teams get an integrated, documented and monitored tool with a clear owner on the client side.',
          items: ['Production system', 'Logs and dashboard', 'Handover documentation'],
        },
      ],
      deliverables: ['AI agent', 'Business dashboard', 'Connectors', 'Internal portal', 'Quality and cost monitoring'],
    },
    buildRun: {
      eyebrow: 'Build & Run',
      title: 'Deploy, monitor and transfer the system.',
      intro:
        'Lucid-Lab prepares production release, runbooks, monitoring and training. The system must remain operable after delivery.',
      primary: 'Discuss the run',
      secondary: 'See the method',
      sections: [
        {
          title: 'Challenge',
          body: 'An AI system loses value when no one tracks cost, quality, access, incidents and usage.',
          items: ['Untracked costs', 'Unmeasured quality', 'Missing documentation'],
        },
        {
          title: 'Method',
          body: 'We set up indicators, alerts, runbooks, operating notes and handover sessions.',
          items: ['Cost and usage monitoring', 'Incident runbooks', 'Focused training'],
        },
        {
          title: 'Result',
          body: 'The client keeps the ability to understand, operate and improve the system.',
          items: ['Clear ownership', 'Documented handover', 'Controlled run'],
        },
      ],
      deliverables: ['Deployment', 'Monitoring', 'Runbooks', 'User documentation', 'Training and handover'],
    },
    method: {
      eyebrow: 'Lucid-Lab Method',
      title: 'From diagnosis to production system.',
      intro:
        'The method connects advisory, architecture, build and adoption. Each step produces a deliverable leadership can review and teams can use.',
      primary: 'Book an audit',
      secondary: 'See client cases',
      sections: [
        {
          title: '1. Field diagnosis',
          body: 'We start from tasks, volumes, irritants, tools and constraints. Interviews stay short and decision oriented.',
          items: ['Workflows', 'Data', 'Risks'],
        },
        {
          title: '2. Roadmap and architecture',
          body: 'We score use cases, then propose the build sequence, dependencies and target architecture.',
          items: ['Scoring', 'Prioritization', 'Target architecture'],
        },
        {
          title: '3. Build, run and handover',
          body: 'We build, deploy, document, monitor and train the teams. The client keeps the assets included in scope.',
          items: ['Build', 'Monitoring', 'Documentation'],
        },
      ],
      deliverables: ['Diagnosis', 'Roadmap', 'Architecture', 'Production system', 'Runbooks', 'Training'],
    },
    cases: {
      eyebrow: 'Client Cases',
      title: 'Systems delivered with transferred assets.',
      intro:
        'These cases show treated workflows, produced deliverables and business effects. Names stay anonymized when the client asks.',
      primary: 'Book an audit',
      secondary: 'Read resources',
      sections: [
        {
          title: 'Reading grid',
          body: 'Each case presents context, problem, delivered system, metric and transferred assets.',
          items: ['Context', 'System', 'Business effect'],
        },
      ],
      deliverables: ['Code', 'Workflows', 'Documentation', 'Monitoring', 'Recovery procedures'],
      cases: [
        {
          context: 'Services SME, finance',
          title: 'Automated finance reporting',
          problem: 'The finance team consolidated ERP exports and Excel files before each committee.',
          solution: ['Accounting extraction', 'Reporting pack', 'Budget variance alerts'],
          result: 'Close moved from 4 days to 2 h',
        },
        {
          context: 'Services firm',
          title: 'Internal knowledge assistant',
          problem: 'Answers lived across several documentation tools.',
          solution: ['Web and Slack assistant', 'Sourced answers', 'Group permissions'],
          result: 'Around 600 queries per month',
        },
        {
          context: 'B2B SaaS',
          title: 'Lead qualification and support',
          problem: 'The team sorted inbound requests by hand.',
          solution: ['ICP scoring', 'Automatic routing', 'CRM pre-fill'],
          result: '95% of leads routed in under 5 min',
        },
      ],
    },
  },
}

const pageIcons = [SearchCheck, Database, Bot, MonitorCheck, Workflow, ShieldCheck]

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h2 className="text-[32px] font-semibold leading-[1.08] tracking-[-0.015em] md:text-[46px]" style={{ color: INK }}>{children}</h2>
}

function PrimaryCta({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex min-h-[48px] items-center justify-center rounded-[8px] px-5 text-[15px] font-medium transition duration-200 hover:-translate-y-0.5" style={{ background: INK, color: PAPER }}>
      {children}
      <ArrowRight className="ml-2 size-4" aria-hidden />
    </Link>
  )
}

function TextLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="group inline-flex items-center gap-2 text-[14px] font-medium" style={{ color: INK }}>
      <span className="border-b" style={{ borderColor: EMBER }}>{children}</span>
      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" aria-hidden />
    </Link>
  )
}

export function ServicePage({ lang, pageKey }: { lang: Locale; pageKey: ServicePageKey }) {
  const page = content[lang][pageKey]
  const route = routes[lang]
  const secondaryHref = pageKey === 'method' ? route.cases : pageKey === 'cases' ? route.blog : route.method

  return (
    <div className="flex min-h-screen flex-col" style={{ background: PAPER }}>
      <Header />
      <main className="grow pt-[68px]">
        <section style={{ background: PAPER }}>
          <div className="mx-auto grid w-full max-w-[1200px] gap-12 px-6 py-20 md:px-10 md:py-28 lg:grid-cols-[1fr_380px] lg:items-end">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.65, ease: [0.22, 1, 0.36, 1] }}>
              <p className="text-[12px] font-medium uppercase tracking-[0.18em]" style={{ color: EMBER }}>{page.eyebrow}</p>
              <h1 className="mt-5 max-w-[12ch] text-[clamp(3rem,7vw,5.8rem)] font-semibold leading-[0.98] tracking-[-0.035em]" style={{ color: INK }}>{page.title}</h1>
              <p className="mt-6 max-w-[62ch] text-[18px] leading-[1.6] md:text-[20px]" style={{ color: GRAY_600 }}>{page.intro}</p>
              <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
                <PrimaryCta href={route.booking}>{page.primary}</PrimaryCta>
                {page.secondary ? <TextLink href={secondaryHref}>{page.secondary}</TextLink> : null}
              </div>
            </motion.div>
            <div className="rounded-[8px] border p-5" style={{ borderColor: GRAY_200, background: GRAY_100 }}>
              <div className="relative aspect-square overflow-hidden rounded-[8px]" style={{ background: INK }}>
                <motion.div animate={{ y: [0, -10, 0], rotate: [0, -1, 1, 0] }} transition={{ duration: 6, repeat: Infinity, ease: [0.22, 1, 0.36, 1] }} className="absolute inset-0">
                  <Image src="/robot-poster-new.png" alt="Lex" fill sizes="380px" className="object-contain object-bottom" />
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        <section style={{ background: GRAY_100, borderTop: `1px solid ${GRAY_200}` }}>
          <div className="mx-auto w-full max-w-[1200px] px-6 py-20 md:px-10 md:py-28">
            <div className="grid gap-px overflow-hidden rounded-[8px] border md:grid-cols-3" style={{ borderColor: GRAY_200, background: GRAY_200 }}>
              {page.sections.map((section, index) => {
                const Icon = pageIcons[index] ?? FileText
                return (
                  <article key={section.title} className="flex min-h-[360px] flex-col p-7" style={{ background: PAPER }}>
                    <div className="flex items-start justify-between gap-6">
                      <Icon className="size-6" strokeWidth={1.5} style={{ color: EMBER }} aria-hidden />
                      <span className="font-mono text-[12px]" style={{ color: GRAY_400 }}>0{index + 1}</span>
                    </div>
                    <h2 className="mt-9 text-[26px] font-semibold leading-[1.1]" style={{ color: INK }}>{section.title}</h2>
                    <p className="mt-4 text-[15px] leading-[1.58]" style={{ color: GRAY_600 }}>{section.body}</p>
                    <ul className="mt-auto space-y-2 pt-8">
                      {section.items.map((item) => (
                        <li key={item} className="flex gap-2 text-[14px]" style={{ color: INK }}>
                          <span style={{ color: EMBER }}>•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </article>
                )
              })}
            </div>
          </div>
        </section>

        <section style={{ background: PAPER, borderTop: `1px solid ${GRAY_200}` }}>
          <div className="mx-auto grid w-full max-w-[1200px] gap-12 px-6 py-20 md:px-10 md:py-28 lg:grid-cols-[0.85fr_1.15fr]">
            <SectionTitle>{lang === 'en' ? 'Deliverables you can keep.' : 'Des livrables que vous gardez.'}</SectionTitle>
            <div className="grid gap-px overflow-hidden rounded-[8px] border md:grid-cols-2" style={{ borderColor: GRAY_200, background: GRAY_200 }}>
              {page.deliverables.map((deliverable) => (
                <div key={deliverable} className="flex items-center gap-3 p-5" style={{ background: PAPER }}>
                  <FileText className="size-5 shrink-0" strokeWidth={1.5} style={{ color: EMBER }} aria-hidden />
                  <span className="text-[15px]" style={{ color: INK }}>{deliverable}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {page.cases ? (
          <section style={{ background: GRAY_100, borderTop: `1px solid ${GRAY_200}` }}>
            <div className="mx-auto w-full max-w-[1200px] px-6 py-20 md:px-10 md:py-28">
              <SectionTitle>{lang === 'en' ? 'Selected cases.' : 'Cas sélectionnés.'}</SectionTitle>
              <div className="mt-12 grid gap-8 lg:grid-cols-3">
                {page.cases.map((caseItem) => (
                  <article key={caseItem.title} className="rounded-[8px] border p-7" style={{ borderColor: GRAY_200, background: PAPER }}>
                    <p className="text-[12px] font-medium uppercase tracking-[0.14em]" style={{ color: GRAY_400 }}>{caseItem.context}</p>
                    <h3 className="mt-6 text-[24px] font-semibold leading-[1.12]" style={{ color: INK }}>{caseItem.title}</h3>
                    <p className="mt-4 text-[15px] leading-[1.55]" style={{ color: GRAY_600 }}>{caseItem.problem}</p>
                    <ul className="mt-6 space-y-2">
                      {caseItem.solution.map((item) => (
                        <li key={item} className="flex gap-2 text-[14px]" style={{ color: INK }}>
                          <span style={{ color: EMBER }}>•</span>
                          {item}
                        </li>
                      ))}
                    </ul>
                    <p className="mt-8 font-mono text-[14px]" style={{ color: EMBER }}>{caseItem.result}</p>
                  </article>
                ))}
              </div>
            </div>
          </section>
        ) : null}

        <section style={{ background: INK, color: PAPER }}>
          <div className="mx-auto grid w-full max-w-[1200px] gap-8 px-6 py-20 md:grid-cols-[1fr_auto] md:items-end md:px-10 md:py-28">
            <div>
              <h2 className="max-w-[22ch] text-[38px] font-semibold leading-[1.04] tracking-[-0.02em] md:text-[56px]" style={{ color: PAPER }}>
                {lang === 'en' ? 'Start with one useful system.' : 'Commencez par un système utile.'}
              </h2>
              <p className="mt-5 max-w-[58ch] text-[17px] leading-[1.6]" style={{ color: 'rgba(250,250,247,0.72)' }}>
                {lang === 'en'
                  ? 'The first call clarifies the workflow, constraints and next decision.'
                  : 'Le premier échange clarifie le workflow, les contraintes et la prochaine décision.'}
              </p>
            </div>
            <Link href={route.booking} className="inline-flex min-h-[50px] items-center justify-center rounded-[8px] px-6 text-[15px] font-medium transition duration-200 hover:-translate-y-0.5" style={{ background: PAPER, color: INK }}>
              {lang === 'en' ? 'Book an audit' : 'Réserver un audit'}
              <ArrowRight className="ml-2 size-4" aria-hidden />
            </Link>
          </div>
        </section>
      </main>
      <MarketingFooter lang={lang} />
    </div>
  )
}
