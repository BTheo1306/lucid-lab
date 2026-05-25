'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, useScroll, useMotionValueEvent } from 'framer-motion'
import {
  ArrowRight,
  Bot,
  Code2,
  Database,
  FileText,
  Gauge,
  LockKeyhole,
  MonitorCheck,
  Network,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Workflow,
} from 'lucide-react'

import { Header } from '@/components/ui/header'
import { HeroSection, LogosSection } from '@/components/ui/hero-section'
import type { Locale } from '@/lib/i18n/client'

const INK = '#0A0A0A'
const PAPER = '#FAFAF7'
const GRAY_600 = '#525252'
const GRAY_400 = '#A3A3A3'
const GRAY_200 = '#E5E5E5'
const GRAY_100 = '#F2F2EE'
const EMBER = '#C85E1A'

const routeMap = {
  fr: {
    booking: '/audit-flash',
    audit: '/audit-ia',
    data: '/readiness-data-si',
    roadmap: '/roadmap-automatisation',
    agents: '/agents-ia-outils-internes',
    buildRun: '/build-run',
    method: '/methode',
    cases: '/cas-clients',
    blog: '/blog',
  },
  en: {
    booking: '/en/audit-flash',
    audit: '/en/audit-ia',
    data: '/en/readiness-data-si',
    roadmap: '/en/roadmap-automatisation',
    agents: '/en/agents-ia-outils-internes',
    buildRun: '/en/build-run',
    method: '/en/method',
    cases: '/en/case-studies',
    blog: '/en/blog',
  },
} as const

const content = {
  fr: {
    hero: {
      title: 'Le bon système IA, livré.',
      subtitle:
        'Lucid-Lab audite vos workflows, vérifie vos données et priorise les cas d’usage avant de construire agents, outils internes et intégrations.',
      primary: 'Réserver un audit IA',
      secondary: 'Voir les cas d’usage',
      proofs: ['Audit', 'Roadmap', 'Build', 'Run', 'Ownership'],
    },
    trusted: {
      title: 'Les entreprises qui nous ont fait confiance',
      subtitle:
        'Des équipes nous ont confié des workflows, des données et des livrables métier. Les cas publics arrivent après validation client.',
      logos: [
        { name: 'Turismo', logo: '/logos/logo%20Turismo.png' },
        { name: 'Kobia', logo: '/logos/logo-wordmark-kobia-black.png' },
        { name: 'Universal', logo: null },
        { name: 'Périscope', logo: null },
      ],
    },
    problems: {
      title: 'Les blocages arrivent avant le modèle.',
      subtitle:
        'Vous avez des idées IA, des exports, des outils et des équipes pressées. Lucid-Lab transforme ce matériau en chantier priorisé.',
      items: [
        ['Idées IA dispersées', 'Les métiers listent des cas d’usage, mais personne ne score valeur, faisabilité et risque.'],
        ['Workflows manuels', 'Les équipes copient, recollent, consolident et vérifient les mêmes données chaque semaine.'],
        ['Outils non connectés', 'CRM, ERP, fichiers et boîtes mail gardent chacun une partie du processus.'],
        ['Données difficiles', 'Les sources existent, mais les accès, formats et droits ralentissent le build.'],
        ['Sécurité tardive', 'RGPD, permissions et données sensibles entrent dans la discussion trop tard.'],
        ['Adoption fragile', 'Un pilote sans runbook, owner et monitoring finit en démo oubliée.'],
      ],
    },
    pillars: {
      title: 'Quatre portes d’entrée, un système livré.',
      subtitle:
        'Chaque domaine a sa page, ses livrables et ses cas d’usage. Le parcours reste le même : comprendre, prioriser, construire, transférer.',
      items: [
        {
          title: 'Diagnostic & Roadmap',
          problem: 'Vous devez choisir le premier chantier IA avec des critères métier, data et risque.',
          deliverables: ['Cartographie workflows', 'Scoring valeur, faisabilité, risque', 'Roadmap de build'],
          result: 'Vous repartez avec un plan d’exécution exploitable par direction et équipes métier.',
          href: routeMap.fr.audit,
        },
        {
          title: 'Data & SI Readiness',
          problem: 'Le build dépend des sources, permissions, formats, outils et règles de sécurité.',
          deliverables: ['Inventaire sources', 'Matrice droits et accès', 'Architecture cible EU'],
          result: 'Les blocages techniques et réglementaires sortent avant le développement.',
          href: routeMap.fr.data,
        },
        {
          title: 'IA & Outils Internes',
          problem: 'Un workflow métier doit passer dans un agent, un portail ou une automatisation fiable.',
          deliverables: ['Agents IA', 'Dashboards métier', 'Connecteurs et interfaces internes'],
          result: 'Les équipes utilisent un système branché à leurs outils et gardent le contrôle de l’usage.',
          href: routeMap.fr.agents,
        },
        {
          title: 'Adoption, Formation & Run',
          problem: 'Le système doit tourner, se surveiller et rester compréhensible par les équipes.',
          deliverables: ['Runbooks', 'Monitoring coût et qualité', 'Formation ciblée'],
          result: 'Le client garde le code, la documentation, les accès et la capacité d’opérer.',
          href: routeMap.fr.buildRun,
        },
      ],
    },
    offers: {
      title: 'Des formats lisibles avant le devis.',
      subtitle:
        'Le problème fixe le format. Le format réduit le risque avant le build.',
      items: [
        {
          title: 'AI Opportunity Audit',
          detail: 'Diagnostic court',
          body: 'Lecture des workflows, cas d’usage, maturité data, risques et premier chantier IA.',
          href: routeMap.fr.audit,
        },
        {
          title: 'Data & System Readiness Assessment',
          detail: 'Préparation SI',
          body: 'Sources, droits, sécurité, hébergement, outils et architecture cible à valider avant dev.',
          href: routeMap.fr.data,
        },
        {
          title: 'Automation Roadmap',
          detail: 'Plan de build',
          body: 'Priorisation des processus manuels, séquence de livraison, dépendances et ROI attendu.',
          href: routeMap.fr.roadmap,
        },
        {
          title: 'Custom AI Agents & Internal Tools',
          detail: 'Build métier',
          body: 'Agents, dashboards, portails, intégrations, workflows et contrôles humains.',
          href: routeMap.fr.agents,
        },
        {
          title: 'Build & Run Operations',
          detail: 'Prod et maintien',
          body: 'Déploiement, monitoring, documentation, runbooks, formation et transfert d’exploitation.',
          href: routeMap.fr.buildRun,
        },
      ],
    },
    delivery: {
      title: 'La méthode Lucid-Lab.',
      subtitle:
        'Le plan commence par le terrain. Le build avance par cycles courts. Le transfert se prépare dès le premier jour.',
      steps: [
        ['Diagnostiquer les workflows', 'On lit les tâches, les irritants, les outils et les volumes.'],
        ['Collecter les cas d’usage', 'Les équipes décrivent les gains attendus, les risques et les dépendances.'],
        ['Scorer valeur, faisabilité, risque', 'La direction choisit le premier chantier avec une grille claire.'],
        ['Valider données et accès', 'Les sources, formats, permissions et contraintes RGPD passent avant le code.'],
        ['Concevoir l’architecture cible', 'On définit outils, modèles, hébergement, logs, monitoring et ownership.'],
        ['Construire et déployer', 'On livre par cycles courts avec démos, tests et intégrations réelles.'],
        ['Former, documenter, monitorer', 'Les équipes reçoivent runbooks, modes opératoires et indicateurs de suivi.'],
      ],
    },
    cases: {
      title: 'Cas clients et livrables.',
      subtitle:
        'Les exemples restent anonymisés quand le client le demande. La structure reste lisible : contexte, système livré, effet métier.',
      items: [
        {
          context: 'PME services, finance',
          title: 'Reporting finance automatisé',
          problem: 'La DAF consolidait exports ERP et fichiers Excel avant chaque comité.',
          system: ['Extraction compta', 'Pack reporting généré', 'Alertes écarts budget', 'Envoi automatique'],
          metric: 'Clôture passée de 4 jours à 2 h',
          remains: 'Code, documentation, monitoring et procédure de reprise livrés au client.',
        },
        {
          context: 'Cabinet de services, 80 collaborateurs',
          title: 'Assistant interne de connaissance',
          problem: 'Les réponses vivaient dans SharePoint, Notion, Drive et quelques messages Slack.',
          system: ['Assistant web et Slack', 'Réponses sourcées', 'Permissions par groupe', 'Dashboard usage'],
          metric: 'Environ 600 requêtes par mois',
          remains: 'Assistant en production, sources documentées et règles d’accès transférées.',
        },
        {
          context: 'B2B SaaS, acquisition',
          title: 'Qualification leads et support',
          problem: 'L’équipe triait les demandes entrantes et perdait des signaux dans le CRM.',
          system: ['Scoring ICP', 'Routage automatique', 'Pré-remplissage CRM', 'Contrôle humain'],
          metric: '95 % des leads routés en moins de 5 min',
          remains: 'Agent, intégration CRM, logs et tableau de suivi restent côté client.',
        },
      ],
    },
    enterprise: {
      title: 'Les sujets sérieux entrent dans le build.',
      subtitle:
        'Une direction ou une DSI doit voir les risques avant la mise en production. On traite ces points dès l’architecture.',
      items: [
        'RGPD et données personnelles',
        'Droits d’accès et permissions',
        'Hébergement et infrastructure EU',
        'Documentation et runbooks',
        'Monitoring coût, usage, latence, qualité',
        'Transfert de propriété',
        'Formation et adoption',
        'Gouvernance IA',
      ],
    },
    resources: {
      title: 'Ressources pour décider.',
      subtitle: 'Guides, critères de scoring, sécurité IA, ROI et automatisation des processus métier.',
      cta: 'Lire les ressources',
    },
    faq: {
      title: 'Questions fréquentes.',
      subtitle: 'Les questions qui reviennent avant un premier audit IA ou un build métier.',
      items: [
        {
          question: 'Lucid-Lab intervient à quel moment du projet IA ?',
          answer:
            'Lucid-Lab intervient dès le cadrage. On aide la direction à choisir le bon chantier, puis on construit le système, on le déploie et on prépare le transfert.',
        },
        {
          question: 'Que contient un AI Opportunity Audit ?',
          answer:
            'L’audit couvre workflows, irritants métier, sources de données, outils, risques, gains attendus et priorisation. Le livrable liste les chantiers à lancer, ceux à repousser et les prérequis à régler.',
        },
        {
          question: 'Le client garde quoi après la livraison ?',
          answer:
            'Le client garde le code, les workflows, les accès, les runbooks, la documentation utilisateur et les tableaux de monitoring prévus dans le périmètre.',
        },
        {
          question: 'Vous travaillez avec les outils déjà en place ?',
          answer:
            'Oui. On connecte CRM, ERP, fichiers, bases internes, boîtes mail, outils no-code ou APIs métier quand ces briques tiennent le besoin. On propose un remplacement seulement si l’existant bloque le run.',
        },
        {
          question: 'Les données sensibles peuvent-elles rester en Europe ?',
          answer:
            'Oui. On peut cadrer hébergement EU, modèles adaptés, permissions, logs et règles d’accès selon le niveau de sensibilité du cas d’usage.',
        },
        {
          question: 'Le premier échange engage-t-il un projet complet ?',
          answer:
            'Le premier échange sert à qualifier le besoin. Si le chantier sort de notre zone de valeur, on le dit et on oriente vers une solution plus adaptée.',
        },
      ],
    },
    final: {
      title: 'Choisissez le premier système utile.',
      subtitle:
        'En 30 minutes, on lit votre contexte, vos workflows et vos contraintes. Vous savez si un audit IA mérite d’être lancé.',
      cta: 'Réserver un audit',
    },
    footer: {
      description:
        'Lucid-Lab audite, construit et opère des systèmes IA métier : agents, outils internes, automatisations, intégrations, monitoring et documentation.',
      product: 'Navigation',
      resources: 'Ressources',
      contact: 'Contact',
      copyright: '© 2026 Lucid-Lab.',
      location: 'Paris, France',
    },
  },
  en: {
    hero: {
      title: 'The right AI system, delivered.',
      subtitle:
        'Lucid-Lab audits workflows, checks data and ranks AI use cases before building agents, internal tools and integrations.',
      primary: 'Book an AI audit',
      secondary: 'See use cases',
      proofs: ['Audit', 'Roadmap', 'Build', 'Run', 'Ownership'],
    },
    trusted: {
      title: 'Companies that trusted us',
      subtitle:
        'Teams trusted us with workflows, data and business deliverables. Public cases follow client validation.',
      logos: [
        { name: 'Turismo', logo: '/logos/logo%20Turismo.png' },
        { name: 'Kobia', logo: '/logos/logo-wordmark-kobia-black.png' },
        { name: 'Universal', logo: null },
        { name: 'Periscope', logo: null },
      ],
    },
    problems: {
      title: 'The blockers arrive before the model.',
      subtitle:
        'You have AI ideas, exports, tools and busy teams. Lucid-Lab turns that raw material into a ranked build plan.',
      items: [
        ['Scattered AI ideas', 'Teams list use cases, but no one scores value, feasibility and risk.'],
        ['Manual workflows', 'People copy, paste, consolidate and check the same data each week.'],
        ['Disconnected tools', 'CRM, ERP, files and inboxes each keep part of the process.'],
        ['Difficult data', 'Sources exist, but access, formats and rights slow the build.'],
        ['Late security', 'GDPR, permissions and sensitive data enter the discussion too late.'],
        ['Fragile adoption', 'A pilot without a runbook, owner and monitoring turns into a forgotten demo.'],
      ],
    },
    pillars: {
      title: 'Four entry points, one delivered system.',
      subtitle:
        'Each domain has its page, deliverables and use cases. The path stays clear: understand, rank, build, transfer.',
      items: [
        {
          title: 'Diagnostic & Roadmap',
          problem: 'You need to choose the first AI build with business, data and risk criteria.',
          deliverables: ['Workflow map', 'Value, feasibility and risk scoring', 'Build roadmap'],
          result: 'You leave with an execution plan your leaders and teams can use.',
          href: routeMap.en.audit,
        },
        {
          title: 'Data & IT Readiness',
          problem: 'The build depends on sources, permissions, formats, tools and security rules.',
          deliverables: ['Source inventory', 'Rights and access matrix', 'EU target architecture'],
          result: 'Technical and compliance blockers surface before development starts.',
          href: routeMap.en.data,
        },
        {
          title: 'AI & Internal Tools',
          problem: 'A business workflow needs a reliable agent, portal or automation.',
          deliverables: ['AI agents', 'Business dashboards', 'Connectors and internal interfaces'],
          result: 'Teams use a system connected to their tools, not an isolated prototype.',
          href: routeMap.en.agents,
        },
        {
          title: 'Adoption, Training & Run',
          problem: 'The system must run, stay monitored and remain clear for the teams.',
          deliverables: ['Runbooks', 'Cost and quality monitoring', 'Focused training'],
          result: 'The client keeps the code, documentation, access and operating ability.',
          href: routeMap.en.buildRun,
        },
      ],
    },
    offers: {
      title: 'Readable formats before a proposal.',
      subtitle:
        'The problem sets the format. The format reduces risk before build.',
      items: [
        {
          title: 'AI Opportunity Audit',
          detail: 'Short diagnostic',
          body: 'Workflow review, use cases, data maturity, risks and first AI build.',
          href: routeMap.en.audit,
        },
        {
          title: 'Data & System Readiness Assessment',
          detail: 'IT preparation',
          body: 'Sources, rights, security, hosting, tools and target architecture to validate before dev.',
          href: routeMap.en.data,
        },
        {
          title: 'Automation Roadmap',
          detail: 'Build plan',
          body: 'Manual process ranking, delivery sequence, dependencies and expected ROI.',
          href: routeMap.en.roadmap,
        },
        {
          title: 'Custom AI Agents & Internal Tools',
          detail: 'Business build',
          body: 'Agents, dashboards, portals, integrations, workflows and human controls.',
          href: routeMap.en.agents,
        },
        {
          title: 'Build & Run Operations',
          detail: 'Prod and run',
          body: 'Deployment, monitoring, documentation, runbooks, training and operations handover.',
          href: routeMap.en.buildRun,
        },
      ],
    },
    delivery: {
      title: 'The Lucid-Lab method.',
      subtitle:
        'The plan starts in the field. The build moves in short cycles. The handover starts on day one.',
      steps: [
        ['Diagnose workflows', 'We read tasks, irritants, tools and volumes.'],
        ['Collect use cases', 'Teams describe expected gains, risks and dependencies.'],
        ['Score value, feasibility, risk', 'Leaders choose the first build with a clear grid.'],
        ['Validate data and access', 'Sources, formats, permissions and GDPR constraints come before code.'],
        ['Design the target architecture', 'We define tools, models, hosting, logs, monitoring and ownership.'],
        ['Build and deploy', 'We ship in short cycles with demos, tests and real integrations.'],
        ['Train, document, monitor', 'Teams receive runbooks, operating notes and monitoring indicators.'],
      ],
    },
    cases: {
      title: 'Client cases and deliverables.',
      subtitle:
        'Examples stay anonymized when the client asks. The structure remains clear: context, delivered system, business effect.',
      items: [
        {
          context: 'Services SME, finance',
          title: 'Automated finance reporting',
          problem: 'The finance team consolidated ERP exports and Excel files before each committee.',
          system: ['Accounting extraction', 'Generated reporting pack', 'Budget variance alerts', 'Automatic delivery'],
          metric: 'Close moved from 4 days to 2 h',
          remains: 'Code, documentation, monitoring and recovery procedure delivered to the client.',
        },
        {
          context: 'Services firm, 80 people',
          title: 'Internal knowledge assistant',
          problem: 'Answers lived in SharePoint, Notion, Drive and scattered Slack messages.',
          system: ['Web and Slack assistant', 'Sourced answers', 'Group permissions', 'Usage dashboard'],
          metric: 'Around 600 queries per month',
          remains: 'Production assistant, documented sources and access rules transferred.',
        },
        {
          context: 'B2B SaaS, acquisition',
          title: 'Lead qualification and support',
          problem: 'The team sorted inbound requests and lost signals in the CRM.',
          system: ['ICP scoring', 'Automatic routing', 'CRM pre-fill', 'Human control'],
          metric: '95% of leads routed in under 5 min',
          remains: 'Agent, CRM integration, logs and tracking dashboard stay client-side.',
        },
      ],
    },
    enterprise: {
      title: 'Serious topics enter the build.',
      subtitle:
        'A leader or IT team needs to see risks before production. We treat these points in the architecture, not after launch.',
      items: [
        'GDPR and personal data',
        'Access rights and permissions',
        'EU hosting and infrastructure',
        'Documentation and runbooks',
        'Cost, usage, latency and quality monitoring',
        'Ownership transfer',
        'Training and adoption',
        'AI governance',
      ],
    },
    resources: {
      title: 'Resources for decisions.',
      subtitle: 'Guides, scoring criteria, AI security, ROI and business process automation.',
      cta: 'Read resources',
    },
    faq: {
      title: 'Questions leaders ask.',
      subtitle: 'Questions that come up before a first AI audit or business build.',
      items: [
        {
          question: 'Lucid-Lab joins the project at which stage?',
          answer:
            'Lucid-Lab joins from framing. We help leaders choose the right build, then we build the system, deploy it and prepare the handover.',
        },
        {
          question: 'An AI Opportunity Audit contains which deliverables?',
          answer:
            'The audit covers workflows, business irritants, data sources, tools, risks, expected gains and prioritization. The deliverable lists builds to launch, builds to postpone and prerequisites to solve.',
        },
        {
          question: 'The client keeps which assets after delivery?',
          answer:
            'The client keeps the code, workflows, access, runbooks, user documentation and monitoring dashboards included in the scope.',
        },
        {
          question: 'Lucid-Lab works with existing tools?',
          answer:
            'Yes. We connect CRM, ERP, files, internal databases, inboxes, no-code tools or business APIs when these bricks fit the need. We recommend replacement only when the current tool blocks the run.',
        },
        {
          question: 'Sensitive data can stay in Europe?',
          answer:
            'Yes. We can frame EU hosting, suitable models, permissions, logs and access rules according to the sensitivity of the use case.',
        },
        {
          question: 'The first call commits the client to a full project?',
          answer:
            'The first call qualifies the need. If the build sits outside our value zone, we say it and point to a better fit.',
        },
      ],
    },
    final: {
      title: 'Choose the first useful system.',
      subtitle:
        'In 30 minutes, we read your context, workflows and constraints. You know whether an AI audit deserves a launch.',
      cta: 'Book an audit',
    },
    footer: {
      description:
        'Lucid-Lab audits, builds and operates business AI systems: agents, internal tools, automations, integrations, monitoring and documentation.',
      product: 'Navigation',
      resources: 'Resources',
      contact: 'Contact',
      copyright: '© 2026 Lucid-Lab.',
      location: 'Paris, France',
    },
  },
} as const

const problemIcons = [Sparkles, Workflow, Network, Database, ShieldCheck, UserCheck] as const
const pillarIcons = [SearchCheck, Database, Bot, MonitorCheck] as const
const readinessIcons = [LockKeyhole, ShieldCheck, Database, FileText, Gauge, Code2, UserCheck, Network] as const

function resolveHref(lang: Locale, href: string) {
  if (lang === 'en' && href.startsWith('/') && !href.startsWith('/en')) return `/en${href}`
  return href
}

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
      className="relative"
    >
      {/* Visual Guide Connecting Sections */}
      <div className="mx-auto flex flex-col items-center justify-center pt-6 select-none opacity-80">
        <div className="h-8 w-px relative overflow-hidden" style={{ background: tone === 'ink' ? 'rgba(250,250,247,0.15)' : 'rgba(10,10,10,0.15)' }}>
          <motion.div
            className="absolute top-0 left-0 w-full h-1/2"
            style={{ background: EMBER }}
            animate={{ y: ['-100%', '200%'] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: 'linear' }}
          />
        </div>
        {id && (
          <span className="mt-2 text-[9px] font-mono tracking-widest uppercase opacity-40">
            {id}
          </span>
        )}
      </div>
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

function PrimaryCta({ href, children, inverted = false }: { href: string; children: React.ReactNode; inverted?: boolean }) {
  return (
    <Link
      href={href}
      className="inline-flex min-h-[48px] items-center justify-center rounded-[8px] px-5 text-[15px] font-medium transition duration-200 hover:-translate-y-0.5"
      style={{ background: inverted ? PAPER : INK, color: inverted ? INK : PAPER }}
    >
      {children}
      <ArrowRight className="ml-2 size-4" aria-hidden />
    </Link>
  )
}

function TextLink({ href, children, light = false }: { href: string; children: React.ReactNode; light?: boolean }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-2 text-[14px] font-medium"
      style={{ color: light ? PAPER : INK }}
    >
      <span className="border-b" style={{ borderColor: EMBER }}>{children}</span>
      <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-1" aria-hidden />
    </Link>
  )
}

function HeroVisual() {
  const nodes = ['Workflow', 'Données', 'Agent', 'Runbook']

  return (
    <div className="relative min-h-[320px] overflow-hidden rounded-[8px] border sm:min-h-[380px] md:min-h-[520px]" style={{ borderColor: GRAY_200, background: PAPER }}>
      <div className="absolute inset-x-5 top-5 z-10 flex items-center justify-between text-[11px] uppercase tracking-[0.16em]" style={{ color: GRAY_400 }}>
        <span>Lex</span>
        <span>Production loop</span>
      </div>

      <div className="absolute left-5 top-20 z-10 hidden w-[44%] space-y-3 md:block">
        {nodes.map((node, index) => (
          <motion.div
            key={node}
            className="flex items-center gap-3 rounded-[8px] border px-3 py-2"
            style={{ borderColor: GRAY_200, color: INK, background: 'rgba(10,10,10,0.03)' }}
            animate={{ opacity: [0.42, 1, 0.42], x: [0, 6, 0] }}
            transition={{ duration: 3.4, delay: index * 0.35, repeat: Infinity, ease: 'easeOut' }}
          >
            <span className="font-mono text-[11px]" style={{ color: EMBER }}>0{index + 1}</span>
            <span className="text-[13px]">{node}</span>
          </motion.div>
        ))}
      </div>

      <motion.div
        className="absolute bottom-0 right-[-4%] h-[86%] w-[82%] sm:right-[-2%] md:h-[88%] md:w-[68%]"
        animate={{ y: [0, -12, 0], rotate: [0, -1.2, 0.8, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: [0.22, 1, 0.36, 1] }}
      >
        <Image
          src="/robot-poster-lit.png"
          alt="Lex, robot Lucid-Lab"
          fill
          priority
          sizes="(min-width: 1024px) 520px, 80vw"
          className="object-contain object-bottom mix-blend-multiply"
        />
      </motion.div>

      <motion.div
        className="absolute bottom-5 left-5 right-5 z-10 grid gap-2 md:right-auto md:w-[48%]"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, delay: 0.25 }}
      >
        {['cas scoré', 'données validées', 'run monitoré'].map((label, index) => (
          <div key={label} className="flex items-center justify-between rounded-[8px] border px-3 py-2" style={{ borderColor: GRAY_200, background: 'rgba(250,250,247,0.78)' }}>
            <span className="text-[12px]" style={{ color: GRAY_600 }}>{label}</span>
            <motion.span
              className="h-2 w-2 rounded-full"
              style={{ background: index === 1 ? EMBER : INK }}
              animate={{ scale: [1, 1.35, 1], opacity: [0.55, 1, 0.55] }}
              transition={{ duration: 2.2, delay: index * 0.25, repeat: Infinity, ease: 'easeOut' }}
            />
          </div>
        ))}
      </motion.div>
    </div>
  )
}

function Hero({ lang }: { lang: Locale }) {
  const t = content[lang].hero
  const routes = routeMap[lang]

  return (
    <section style={{ background: PAPER, color: INK }} className="pt-[68px]">
      <div className="mx-auto grid w-full max-w-[1200px] gap-8 px-6 pb-16 pt-10 sm:pt-14 md:grid-cols-[minmax(0,1fr)_320px] md:gap-10 md:px-10 md:pb-24 md:pt-20 lg:grid-cols-[1fr_480px] lg:gap-16 lg:pb-28">
        <div className="max-w-[680px]">
          <p className="text-[12px] font-medium uppercase tracking-[0.18em]" style={{ color: EMBER }}>Lucid-Lab</p>
          <h1
            className="mt-5 max-w-[10ch] text-[42px] font-semibold leading-[1.02] tracking-normal sm:text-[56px] md:text-[58px] lg:text-[72px] xl:text-[80px]"
            style={{ color: INK }}
          >
            {t.title}
          </h1>
          <p className="mt-5 max-w-[54ch] text-[16px] leading-[1.55] sm:text-[18px] md:mt-6 md:text-[19px]" style={{ color: GRAY_600 }}>
            {t.subtitle}
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center md:mt-9">
            <PrimaryCta href={routes.booking}>{t.primary}</PrimaryCta>
            <TextLink href={routes.cases}>{t.secondary}</TextLink>
          </div>
          <div className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-[12px] font-medium uppercase tracking-[0.14em] md:mt-10" style={{ color: GRAY_400 }}>
            {t.proofs.map((proof) => <span key={proof}>{proof}</span>)}
          </div>
        </div>

        <div>
          <HeroVisual />
        </div>
      </div>
    </section>
  )
}

function TrustedBand({ lang }: { lang: Locale }) {
  const t = content[lang].trusted

  return (
    <section style={{ background: PAPER, borderTop: `1px solid ${GRAY_200}` }}>
      <div className="mx-auto grid w-full max-w-[1200px] gap-8 px-6 py-12 md:grid-cols-[0.9fr_1.1fr] md:px-10">
        <div>
          <h2 className="text-[22px] font-semibold tracking-[-0.01em]" style={{ color: INK }}>{t.title}</h2>
          <p className="mt-3 max-w-[52ch] text-[14px] leading-[1.55]" style={{ color: GRAY_600 }}>{t.subtitle}</p>
        </div>
        <div className="grid grid-cols-2 gap-px self-start overflow-hidden rounded-[8px] border md:grid-cols-4" style={{ borderColor: GRAY_200, background: GRAY_200 }}>
          {t.logos.map((company) => (
            <div key={company.name} className="flex h-24 items-center justify-center px-5" style={{ background: PAPER }}>
              {company.logo ? (
                <Image src={company.logo} alt={company.name} width={150} height={48} className="max-h-10 w-auto object-contain grayscale" />
              ) : (
                <span className="text-[15px] font-semibold tracking-[-0.01em]" style={{ color: INK }}>{company.name}</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Problems({ lang }: { lang: Locale }) {
  const t = content[lang].problems
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  return (
    <Section id="problemes">
      <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr] lg:gap-12">
        <div>
          <SectionTitle>{t.title}</SectionTitle>
          <SectionLede>{t.subtitle}</SectionLede>
          
          {/* Live Diagnostic Monitor Panel */}
          <div className="mt-6 hidden lg:block rounded-[8px] border p-4 bg-[#FDFDFB]" style={{ borderColor: GRAY_200 }}>
            <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#8a8276] block mb-2">// Diagnostic en temps réel</span>
            <div className="space-y-1.5">
              {t.items.map(([title], i) => (
                <div key={title} className="flex items-center gap-2 text-[11px] font-mono leading-none">
                  <span className="h-1.5 w-1.5 rounded-full transition-colors duration-200 animate-pulse" style={{ backgroundColor: hoveredIdx === i ? EMBER : '#E5E5E5' }} />
                  <span className="transition-all duration-200" style={{ color: hoveredIdx === i ? INK : '#8b8478' }}>
                    0{i+1}. {title}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
        
        <ul className="flex flex-col divide-y" style={{ borderColor: GRAY_400 + '30' }}>
          {t.items.map(([title, body], index) => {
            const Icon = problemIcons[index] ?? Sparkles
            const isActive = hoveredIdx === index
            return (
              <li
                key={title}
                className="py-3 flex gap-4 cursor-pointer transition-colors duration-200 relative pl-4 first:pt-0 last:pb-0 select-none group"
                onMouseEnter={() => setHoveredIdx(index)}
                onMouseLeave={() => setHoveredIdx(null)}
              >
                {isActive && (
                  <motion.div
                    className="absolute left-0 top-0 bottom-0 w-[2px]"
                    style={{ background: EMBER }}
                    layoutId="activeProblemIndicator"
                  />
                )}
                <div className="mt-0.5">
                  <Icon className="size-4 transition-transform duration-200" style={{ color: isActive ? EMBER : GRAY_600, transform: isActive ? 'scale(1.1)' : 'none' }} />
                </div>
                <div className="grow">
                  <div className="flex justify-between items-baseline gap-4">
                    <h3 className="text-[15px] font-semibold transition-all duration-200" style={{ color: isActive ? INK : GRAY_600 }}>{title}</h3>
                    <span className="text-[10px] font-mono text-[#a3a3a3]">0{index + 1}</span>
                  </div>
                  <div className={`overflow-hidden transition-all duration-300 ${isActive ? 'max-h-[100px] mt-2 opacity-100' : 'max-h-0 opacity-0 pointer-events-none'}`}>
                    <p className="max-w-[48ch] text-[13px] leading-[1.45]" style={{ color: GRAY_600 }}>
                      {body}
                    </p>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      </div>
    </Section>
  )
}

function Pillars({ lang }: { lang: Locale }) {
  const t = content[lang].pillars
  const [activeIdx, setActiveIdx] = useState<number>(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start center", "end center"],
  })

  useMotionValueEvent(scrollYProgress, "change", (latest) => {
    const newIndex = Math.min(
      t.items.length - 1,
      Math.floor(latest * t.items.length)
    )
    if (newIndex !== activeIdx) {
      setActiveIdx(newIndex)
    }
  })

  const activeItem = t.items[activeIdx]
  const ActiveIcon = pillarIcons[activeIdx] ?? SearchCheck

  return (
    <Section id="expertises" tone="gray">
      <div ref={containerRef} className="relative h-[250vh]">
        <div className="sticky top-32">
          <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <SectionTitle>{t.title}</SectionTitle>
            <SectionLede>{t.subtitle}</SectionLede>
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
        <div className="flex flex-col gap-1.5 justify-center">
          {t.items.map((item, index) => {
            const Icon = pillarIcons[index] ?? SearchCheck
            const isActive = activeIdx === index
            return (
              <button
                key={item.title}
                onClick={() => {
                  if (containerRef.current) {
                    const rect = containerRef.current.getBoundingClientRect()
                    const offsetTop = rect.top + window.scrollY
                    // We go to specific point inside the 250vh track
                    const scrollPosition = offsetTop + (rect.height * (index / t.items.length))
                    window.scrollTo({ top: scrollPosition + 10, behavior: 'smooth' })
                  }
                  setActiveIdx(index)
                }}
                onMouseEnter={() => setActiveIdx(index)}
                className="flex items-center justify-between p-3.5 rounded-[6px] border text-left transition-all duration-200 outline-none"
                style={{
                  background: isActive ? PAPER : 'transparent',
                  borderColor: isActive ? GRAY_200 : 'transparent',
                  transform: isActive ? 'translateX(4px)' : 'none',
                }}
              >
                <div className="flex items-center gap-3">
                  <Icon className="size-4 shrink-0" style={{ color: isActive ? EMBER : GRAY_600 }} />
                  <span className="text-[13.5px] font-semibold" style={{ color: isActive ? INK : GRAY_600 }}>
                    {item.title}
                  </span>
                </div>
                <span className="font-mono text-[10px]" style={{ color: GRAY_400 }}>0{index + 1}</span>
              </button>
            )
          })}
        </div>

        <div className="relative min-h-[300px] rounded-[8px] border p-6 flex flex-col justify-between bg-white" style={{ borderColor: GRAY_200 }}>
          <motion.div
            key={activeIdx}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="flex flex-col h-full justify-between"
          >
            <div>
              <div className="flex items-center justify-between border-b pb-3 mb-3" style={{ borderColor: GRAY_100 }}>
                <div className="flex items-center gap-2">
                  <ActiveIcon className="size-4" style={{ color: EMBER }} />
                  <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#8a8276]">Expertise 0{activeIdx + 1}</span>
                </div>
                <Link
                  href={resolveHref(lang, activeItem.href)}
                  className="text-[11px] font-bold underline decoration-[#C85E1A]/40 decoration-2 hover:decoration-[#C85E1A] text-stone-700 hover:text-stone-950 transition"
                >
                  {lang === 'en' ? 'Explore methodology' : 'Explorer la méthode'}
                </Link>
              </div>

              <h3 className="text-[16px] md:text-[18px] font-bold" style={{ color: INK }}>{activeItem.title}</h3>
              <p className="mt-1.5 text-[13px] leading-[1.45]" style={{ color: GRAY_600 }}>{activeItem.problem}</p>
              
              <ul className="mt-3.5 space-y-1.5">
                {activeItem.deliverables.map((deliverable) => (
                  <li key={deliverable} className="flex gap-2 text-[12.5px] items-center" style={{ color: INK }}>
                    <span className="h-1 w-1 rounded-full" style={{ background: EMBER }} />
                    {deliverable}
                  </li>
                ))}
              </ul>
            </div>

            <div className="mt-5 pt-3 border-t" style={{ borderColor: GRAY_100 }}>
              <span className="text-[10px] font-mono text-[#8a8276] block mb-0.5">Impact final :</span>
              <p className="text-[12.5px] font-semibold leading-[1.45]" style={{ color: EMBER }}>{activeItem.result}</p>
              
              <Link 
                href={resolveHref(lang, activeItem.href)}
                className="mt-3.5 inline-flex items-center gap-1.5 text-[12.5px] font-semibold"
                style={{ color: INK }}
              >
                {lang === 'en' ? 'Open details' : 'Voir les détails'}
                <ArrowRight className="size-3 transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            </div>
          </motion.div>
        </div>
        </div>
      </div>
      </div>
    </Section>
  )
}

function Offers({ lang }: { lang: Locale }) {
  const t = content[lang].offers

  return (
    <Section id="offres" tone="ink">
      <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <SectionTitle light>{t.title}</SectionTitle>
        <SectionLede light>{t.subtitle}</SectionLede>
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {t.items.map((item, idx) => (
          <motion.article 
            key={item.title} 
            className="flex min-h-[220px] flex-col justify-between p-5 rounded-[6px] border transition-all duration-300 hover:border-[#C85E1A]/40" 
            style={{ 
              background: INK,
              borderColor: 'rgba(250,250,247,0.12)'
            }}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: idx * 0.1 }}
          >
            <div>
              <span className="text-[9px] font-semibold uppercase tracking-[0.14em] text-orange-500">{item.detail}</span>
              <h3 className="mt-4 text-[15px] font-bold leading-tight" style={{ color: PAPER }}>{item.title}</h3>
              <p className="mt-2 text-[12px] leading-normal" style={{ color: 'rgba(250,250,247,0.64)' }}>{item.body}</p>
            </div>
            <div className="mt-4 pt-3 border-t border-white/5">
              <TextLink href={resolveHref(lang, item.href)} light>{lang === 'en' ? 'Details' : 'Détails'}</TextLink>
            </div>
          </motion.article>
        ))}
      </div>
    </Section>
  )
}

function Delivery({ lang }: { lang: Locale }) {
  const t = content[lang].delivery

  return (
    <Section id="comment-on-livre">
      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <SectionTitle>{t.title}</SectionTitle>
        <SectionLede>{t.subtitle}</SectionLede>
      </div>

      <div className="mt-8 relative">
        <div className="absolute left-[3%] right-[3%] top-4 hidden h-[1px] bg-stone-200 lg:block" />

        <ol className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 relative z-10">
          {t.steps.map(([title, body], index) => (
            <motion.li 
              key={title} 
              className="flex flex-col relative select-none"
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.35, delay: index * 0.08 }}
            >
              <div className="flex items-center gap-3 lg:flex-col lg:items-start lg:gap-0">
                <div 
                  className="flex h-8 w-8 items-center justify-center rounded-full border bg-white shadow-sm transition-colors duration-200"
                  style={{ borderColor: GRAY_200 }}
                >
                  <span className="text-[11px] font-mono text-[#C85E1A] font-bold">0{index + 1}</span>
                </div>
                
                <h3 className="mt-2.5 text-[13px] font-bold leading-snug text-stone-900">{title}</h3>
              </div>
              <p className="mt-1.5 text-[11.5px] leading-relaxed text-stone-500 lg:pr-1">{body}</p>
            </motion.li>
          ))}
        </ol>
      </div>

      <div className="mt-8 border-t pt-4 flex justify-between items-center" style={{ borderColor: GRAY_200 }}>
        <span className="text-[11px] font-mono text-[#8a8276]">// Processus de livraison monitoré</span>
        <TextLink href={routeMap[lang].method}>
          {lang === 'en' ? 'Explore full method' : 'Voir la méthode complète'}
        </TextLink>
      </div>
    </Section>
  )
}

function Cases({ lang }: { lang: Locale }) {
  const t = content[lang].cases

  return (
    <Section id="acquis-livres" tone="gray">
      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <SectionTitle>{t.title}</SectionTitle>
        <SectionLede>{t.subtitle}</SectionLede>
      </div>
      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {t.items.map((item, idx) => (
          <motion.article 
            key={item.title} 
            className="rounded-[6px] border p-5 flex flex-col justify-between hover:shadow-sm transition-all duration-300 bg-white" 
            style={{ borderColor: GRAY_200 }}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: idx * 0.1 }}
          >
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.14em]" style={{ color: GRAY_400 }}>{item.context}</p>
              <h3 className="mt-3 text-[15px] font-bold leading-snug" style={{ color: INK }}>{item.title}</h3>
              <p className="mt-2 text-[12.5px] leading-relaxed" style={{ color: GRAY_600 }}>{item.problem}</p>
              
              <ul className="mt-3 space-y-1 bg-[#FAF9F5] p-3 rounded-[4px] border border-stone-200/50">
                {item.system.map((part) => (
                  <li key={part} className="flex gap-2 text-[11.5px] items-center text-stone-800">
                    <span className="h-1 w-1 rounded-full shrink-0 animate-pulse" style={{ background: EMBER }} />
                    {part}
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="mt-4 pt-3 border-t" style={{ borderColor: GRAY_200 }}>
              <p className="font-mono text-[12.5px] font-bold" style={{ color: EMBER }}>{item.metric}</p>
              <p className="mt-1 text-[11px] leading-tight" style={{ color: GRAY_600 }}>{item.remains}</p>
            </div>
          </motion.article>
        ))}
      </div>
      <div className="mt-6 border-t pt-4 flex justify-between items-center" style={{ borderColor: GRAY_200 }}>
        <span className="text-[11px] font-mono text-[#8a8276]">// Cas clients validés et chiffrés</span>
        <TextLink href={routeMap[lang].cases}>{lang === 'en' ? 'Open client cases' : 'Voir les cas clients'}</TextLink>
      </div>
    </Section>
  )
}

function Enterprise({ lang }: { lang: Locale }) {
  const t = content[lang].enterprise

  return (
    <Section id="enterprise-readiness">
      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <SectionTitle>{t.title}</SectionTitle>
        <SectionLede>{t.subtitle}</SectionLede>
      </div>
      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {t.items.map((item, index) => {
          const Icon = readinessIcons[index] ?? ShieldCheck
          return (
            <motion.li 
              key={item} 
              className="flex items-start gap-3 p-4 rounded-[6px] border bg-[#FDFDFB]" 
              style={{ borderColor: GRAY_200 }}
              initial={{ opacity: 0, scale: 0.98 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Icon className="mt-0.5 size-4 p-[1px] shrink-0" strokeWidth={1.8} style={{ color: EMBER }} aria-hidden />
              <span className="text-[12.5px] leading-relaxed font-medium text-stone-800">{item}</span>
            </motion.li>
          )
        })}
      </ul>
    </Section>
  )
}

function Resources({ lang }: { lang: Locale }) {
  const t = content[lang].resources
  const resourceLinks = lang === 'en'
    ? ['AI audit deliverables', 'AI, GDPR and internal data', 'Automation ROI for operations']
    : ['Audit IA : livrables et scoring', 'IA, RGPD et données internes', 'ROI des automatisations métier']

  return (
    <Section id="blog" tone="gray">
      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <div>
          <SectionTitle>{t.title}</SectionTitle>
          <SectionLede>{t.subtitle}</SectionLede>
          <div className="mt-4">
            <TextLink href={routeMap[lang].blog}>{t.cta}</TextLink>
          </div>
        </div>
        <ul className="divide-y rounded-[6px] border bg-white" style={{ borderColor: GRAY_200 }}>
          {resourceLinks.map((title) => (
            <li key={title}>
              <Link href={routeMap[lang].blog} className="group flex items-center justify-between gap-6 p-4">
                <span className="text-[14px] font-bold transition-all duration-200 group-hover:text-[#C85E1A]" style={{ color: INK }}>{title}</span>
                <ArrowRight className="size-3.5 shrink-0 transition-transform group-hover:translate-x-1" style={{ color: EMBER }} aria-hidden />
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  )
}

function FAQ({ lang }: { lang: Locale }) {
  const t = content[lang].faq

  return (
    <Section id="faq">
      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <div>
          <SectionTitle>{t.title}</SectionTitle>
          <SectionLede>{t.subtitle}</SectionLede>
        </div>
        <div className="divide-y rounded-[6px] border bg-white" style={{ borderColor: GRAY_200 }}>
          {t.items.map((item) => (
            <details key={item.question} className="group p-4 open:bg-[#F7F2ED]/50 transition-colors duration-200">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-6 text-[14.5px] font-bold outline-none" style={{ color: INK }}>
                {item.question}
                <span className="text-[16px] font-mono leading-none transition-transform duration-200 group-open:rotate-45" style={{ color: EMBER }}>+</span>
              </summary>
              <p className="mt-2.5 max-w-[64ch] text-[13px] leading-relaxed" style={{ color: GRAY_600 }}>{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </Section>
  )
}

function FinalCTA({ lang }: { lang: Locale }) {
  const t = content[lang].final

  return (
    <section style={{ background: INK, color: PAPER }}>
      <div className="mx-auto grid w-full max-w-[1200px] gap-8 px-6 py-12 md:grid-cols-[1fr_auto] md:items-center md:px-10 md:py-16">
        <div>
          <h2 className="max-w-[24ch] text-[24px] font-bold leading-[1.1] tracking-[-0.02em] md:text-[32px]" style={{ color: PAPER }}>{t.title}</h2>
          <p className="mt-3 max-w-[58ch] text-[13.5px] leading-relaxed" style={{ color: 'rgba(250,250,247,0.68)' }}>{t.subtitle}</p>
        </div>
        <PrimaryCta href={routeMap[lang].booking} inverted>{t.cta}</PrimaryCta>
      </div>
    </section>
  )
}

export function MarketingFooter({ lang }: { lang: Locale }) {
  const t = content[lang].footer
  const routes = routeMap[lang]
  const nav: Array<[string, string]> = [
    [lang === 'en' ? 'Expertise' : 'Expertises', '/#expertises'],
    [lang === 'en' ? 'Offers' : 'Offres', '/#offres'],
    [lang === 'en' ? 'Method' : 'Méthode', routes.method],
    [lang === 'en' ? 'Client cases' : 'Cas clients', routes.cases],
  ]

  return (
    <footer style={{ background: PAPER, borderTop: `1px solid ${GRAY_200}` }}>
      <div className="mx-auto w-full max-w-[1200px] px-6 py-16 md:px-10">
        <div className="grid gap-12 md:grid-cols-[1.35fr_0.8fr_0.8fr_0.8fr]">
          <div>
            <Link href={lang === 'en' ? '/en' : '/'} className="inline-flex items-center gap-2">
              <Image src="/logo.png" alt="Lucid-Lab" width={28} height={28} className="size-7" />
              <span className="text-[18px] font-semibold tracking-tight" style={{ color: INK }}>Lucid-Lab</span>
            </Link>
            <p className="mt-5 max-w-[42ch] text-[14px] leading-[1.6]" style={{ color: GRAY_600 }}>{t.description}</p>
          </div>
          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.14em]" style={{ color: GRAY_400 }}>{t.product}</p>
            <ul className="mt-4 space-y-3">
              {nav.map(([label, href]) => (
                <li key={label}>
                  <Link href={lang === 'en' && href.startsWith('/#') ? `/en${href}` : href} className="text-[14px]" style={{ color: GRAY_600 }}>{label}</Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.14em]" style={{ color: GRAY_400 }}>{t.resources}</p>
            <ul className="mt-4 space-y-3">
              <li><Link href={routes.blog} className="text-[14px]" style={{ color: GRAY_600 }}>Blog</Link></li>
              <li><Link href={routes.audit} className="text-[14px]" style={{ color: GRAY_600 }}>AI Opportunity Audit</Link></li>
              <li><Link href={routes.buildRun} className="text-[14px]" style={{ color: GRAY_600 }}>Build & Run</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.14em]" style={{ color: GRAY_400 }}>{t.contact}</p>
            <ul className="mt-4 space-y-3">
              <li><a href="mailto:info@lucid-lab.fr" className="text-[14px]" style={{ color: GRAY_600 }}>info@lucid-lab.fr</a></li>
              <li><span className="text-[14px]" style={{ color: GRAY_600 }}>{t.location}</span></li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t pt-6 text-[12px]" style={{ borderColor: GRAY_200, color: GRAY_400 }}>{t.copyright}</div>
      </div>
    </footer>
  )
}

export default function HomePage({ lang }: { lang: Locale }) {
  return (
    <div className="flex w-full flex-col" style={{ background: PAPER }}>
      <Header />
      <main className="grow">
        <HeroSection lang={lang} />
        <LogosSection lang={lang} />
        <Problems lang={lang} />
        <Pillars lang={lang} />
        <Offers lang={lang} />
        <Delivery lang={lang} />
        <Cases lang={lang} />
        <Enterprise lang={lang} />
        <Resources lang={lang} />
        <FAQ lang={lang} />
        <FinalCTA lang={lang} />
      </main>
      <MarketingFooter lang={lang} />
    </div>
  )
}