'use client'

import React, { useState, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, useScroll, useMotionValueEvent } from 'framer-motion'
import {
  CheckCircle2,
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

const LinkedinIcon = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
    <rect x="2" y="9" width="4" height="12"></rect>
    <circle cx="4" cy="4" r="2"></circle>
  </svg>
)

import { Header } from '@/components/ui/header'
import { HeroSection, LogosSection } from '@/components/ui/hero-section'
import type { Locale } from '@/lib/i18n/client'
import { faqPageSchema, jsonLd } from '@/lib/seo/schema'
import { AuditFlashBookingSection } from '@/components/marketing/AuditFlashBookingSection'
import { TeamSection } from '@/components/marketing/TeamSection'
import type { Post } from '@/lib/blog/types'
import { CATEGORIES } from '@/lib/blog/types'

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
      proofs: ['Audit', 'Roadmap', 'Build', 'Run', 'Documentation', 'Gouvernance'],
    },
    trusted: {
      title: 'Les entreprises qui nous ont fait confiance',
      subtitle:
        'Des équipes nous ont confié des workflows, des données et des livrables métier. Les cas publics arrivent après validation client.',
      logos: [
        { name: 'Turismo', logo: '/logos/logo%20Turismo.png' },
        { name: 'Kobia', logo: '/logos/logo-wordmark-kobia-black.png' },
        { name: 'Nextra', logo: '/nextra.png' },
        { name: 'BSP37', logo: '/bsp37.png' },
        { name: 'Melting Forme', logo: '/melting-forme.png' },
        { name: 'Universal', logo: null },
        { name: 'Périscope', logo: null },
      ],
    },
    problems: {
      title: 'Le succès d\'un projet de transformation se joue avant la première ligne de code.',
      subtitle:
        'Nous transformons vos processus opérationnels et vos données fragmentées en une infrastructure intelligente, scalable et sécurisée.',
      items: [
        ['Idées IA dispersées', 'Les métiers listent des cas d’usage, mais personne ne score valeur, faisabilité et risque.'],
        ['Workflows', 'Les équipes copient, recollent, consolident et vérifient les mêmes données chaque semaine.'],
        ['Outils non connectés', 'CRM, ERP, fichiers et boîtes mail gardent chacun une partie du processus.'],
        ['Gouvernance de données', 'Les sources existent, mais les accès, formats et droits ralentissent le build.'],
        ['Souveraineté & Compliance', 'RGPD, permissions et données sensibles entrent dans la discussion trop tard.'],
        ['Compréhension', 'Un accompagnement à toutes les étapes de la transformation.'],
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
          title: 'Data & SI Compliance',
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
          deliverables: ['Cartographie', 'Monitoring coût et qualité', 'Formation ciblée'],
          result: 'Le client garde le code, la documentation, les accès et la capacité d’opérer.',
          href: routeMap.fr.buildRun,
        },
      ],
    },
    offers: {
      title: 'Nos formats d\'intervention.',
      subtitle:
        'Un cadre contractuel et technique défini pour réduire les risques avant la phase de développement.',
      items: [
        {
          title: 'Audit Flash',
          detail: 'Cadrage métier',
          body: 'Analyse des flux de travail, ciblage des cas d\'usage rentables et évaluation de la maturité technique.',
          href: routeMap.fr.audit,
        },
        {
          title: 'Validation d\'architecture des données et cas d\'usage',
          detail: 'Préparation technique',
          body: 'Validation des sources de données, de la sécurité technique et des prérequis d\'hébergement avant développement.',
          href: routeMap.fr.data,
        },
        {
          title: 'Roadmap inclusion business et premières automatisations',
          detail: 'Stratégie de déploiement',
          body: 'Priorisation des processus à automatiser, séquencement des livraisons et retour sur investissement attendu.',
          href: routeMap.fr.roadmap,
        },
        {
          title: 'Agents IA & Outils Sur-Mesure',
          detail: 'Ingénierie logicielle',
          body: 'Développement d\'agents intelligents, de tableaux de bord, de portails métier et mise en place de contrôles humains.',
          href: routeMap.fr.agents,
        },
        {
          title: 'Mise en Production & Exploitation',
          detail: 'Déploiement et transfert',
          body: 'Déploiement sécurisé, mise en place des outils de supervision, documentation technique et transfert de compétences.',
          href: routeMap.fr.buildRun,
        },
        {
          title: 'Gouvernance et Consultance IA',
          detail: 'Stratégie & Sécurité',
          body: 'Mise en place des processus de sécurité, conformité réglementaire, audits réguliers et comités de pilotage stratégique.',
          href: routeMap.fr.buildRun,
        },
      ],
    },
    delivery: {
      title: 'La méthode Lucid-Lab.',
      subtitle:
        'Propulsé par le top management la transformation digitale et IA avancera en cycles courts avec un transfert dès le premier jour.',
      steps: [
        'Audit et cartographie de vos processus réels.',
        'Collecte organisation, et qualification des cas d\'usage à fort impact.',
        'Scoring des chantiers IA : l\'équilibre parfait entre valeur et risque.',
        'Sécurisation des accès, données et conformité.',
        'Support à la conception d\'une architecture technique solide, monitorée et scalable.',
        'Développement et intégration par cas d\'usage.',
        'Formation et transfert de connaissance.',
        'Gouvernance et consultance IA.'
      ],
    },
    cases: {
      title: 'Cas clients livrés.',
      subtitle:
        'Trois formats de systèmes déjà cadrés ou livrés : back-office simple, CRM automatisé, feuille de route IA grand compte.',
      items: [
        {
          title: 'Back-office automatisé pour une petite structure',
          metric: 'Administration centralisée dans une feuille maître',
          body: 'Récupération des données clients depuis email, Drive et formulaires, contrôle des pièces, relances automatiques et synchronisation dans un master Excel/Google Sheets exploitable par l\'admin.',
        },
        {
          title: 'CRM complet pour un opérateur de mobilité premium',
          metric: 'Vente, support et opérations dans le même système',
          body: 'Structuration du CRM, automatisation des processus internes, chatbot commercial, support client et feuille de route IA pour faire évoluer les outils sur plusieurs années.',
        },
        {
          title: 'Feuille de route IA pour un grand compte financier',
          metric: '90+ cas d\'usage qualifiés et priorisés',
          body: 'Cartographie Finance, Compliance, Crédit, Legal et Risk, scoring valeur/effort/risque, inventaire data, gouvernance IA, formation des ambassadeurs et déploiement par vagues.',
        },
      ],
    },
    enterprise: {
      title: 'Standards industriels pour la production.',
      subtitle:
        'Le passage à l\'échelle impose une conformité rigoureuse. Nous traitons la sécurité, la gouvernance de données et l\'opérabilité à la source.',
      items: [
        {
          title: 'Conformité RGPD',
          description: 'Anonymisation des flux utilisateurs, hébergement conforme et politique stricte de non-conservation des secrets.'
        },
        {
          title: 'Gestion des Accès',
          description: 'Mise en place de rôles (RBAC) pour limiter l\'accès aux bases de données et contrôle strict des tokens API.'
        },
        {
          title: 'Infrastructure Européenne',
          description: 'Hébergement et transit des données basés en Europe (généralement Supabase et Cloudflare) pour une parfaite souveraineté.'
        },
        {
          title: 'Documentation & Runs',
          description: 'Remise systématique de runbooks opérationnels, schémas d\'architecture et consignes de reprise sur incident.'
        },
        {
          title: 'Suivi des Coûts & Métriques',
          description: 'Supervision de la consommation (tokens), de la latence, du taux de succès et de la dérive de qualité des modèles.'
        },
        {
          title: 'Propriété Intellectuelle',
          description: 'Transfert de propriété à 100% de l\'ensemble du code source, de la configuration Cloud et des bases de données.'
        },
        {
          title: 'Adoption et Transfert',
          description: 'Sessions de formation technique et ateliers pratiques pour garantir l\'autonomie complète de vos équipes internes.'
        },
        {
          title: 'Sécurité de l\'IA',
          description: 'Audit et limitation des hallucinations via des garde-fous stricts, des schémas d\'évaluation de prompt et du contrôle humain.'
        }
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
            'Lucid-Lab intervient en amont de la définition de besoin et vous aide à définir les chantiers, construire le système, on le déploie et on prépare le transfert.',
        },
        {
          question: 'Que contient l\'Audit Flash ?',
          answer:
            'L\'audit flash est une première approche qui consiste à définir votre besoin, une approche, votre budget et les solutions applicables.',
        },
        {
          question: 'Quels sont les livrables en fin de mission ?',
          answer:
            'Tout dépend de l\'étape mais ce sont le développement et la documentation technique.',
        },
        {
          question: 'Vous travaillez avec les outils déjà en place ?',
          answer:
            'Oui. On connecte CRM, ERP, fichiers, bases internes, boîtes mail, outils no-code ou APIs métier quand ces briques tiennent le besoin. Nous travaillons avec des partenaires pour des solutions développées dans le cas de solutions non compatibles et sans connecteur qui bloquent les opérations.',
        },
        {
          question: 'Les données sensibles peuvent-elles être gardées de manière souveraine ?',
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
      proofs: ['Audit', 'Roadmap', 'Build', 'Run', 'Documentation', 'Governance'],
    },
    trusted: {
      title: 'Companies that trusted us',
      subtitle:
        'Teams trusted us with workflows, data and business deliverables. Public cases follow client validation.',
      logos: [
        { name: 'Turismo', logo: '/logos/logo%20Turismo.png' },
        { name: 'Kobia', logo: '/logos/logo-wordmark-kobia-black.png' },
        { name: 'Nextra', logo: '/nextra.png' },
        { name: 'BSP37', logo: '/bsp37.png' },
        { name: 'Melting Forme', logo: '/melting-forme.png' },
        { name: 'Universal', logo: null },
        { name: 'Périscope', logo: null },
      ],
    },
    problems: {
      title: 'The success of a transformation project is decided before the first line of code.',
      subtitle:
        'We transform your operational processes and fragmented data into intelligent, scalable and secure infrastructure.',
      items: [
        ['Scattered AI ideas', 'Teams list use cases, but no one scores value, feasibility and risk.'],
        ['Workflows', 'Teams copy, paste, consolidate and check the same data every week.'],
        ['Disconnected tools', 'CRM, ERP, files and inboxes each keep part of the process.'],
        ['Data governance', 'Sources exist, but access, formats and rights slow the build.'],
        ['Sovereignty & Compliance', 'GDPR, permissions and sensitive data enter the discussion too late.'],
        ['Understanding', 'Support at every stage of the transformation.'],
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
          result: 'Teams use a system connected to their tools and keep control of usage.',
          href: routeMap.en.agents,
        },
        {
          title: 'Adoption, Training & Run',
          problem: 'The system must run, stay monitored and remain clear for the teams.',
          deliverables: ['Mapping', 'Cost and quality monitoring', 'Focused training'],
          result: 'The client keeps the code, documentation, access and operating ability.',
          href: routeMap.en.buildRun,
        },
      ],
    },
    offers: {
      title: 'Our intervention formats.',
      subtitle:
        'A fixed contractual and technical framework to reduce risks before the development phase.',
      items: [
        {
          title: 'Audit Flash',
          detail: 'Business scoping',
          body: 'Workflow analysis, targeting of profitable use cases, and technical maturity evaluation.',
          href: routeMap.en.audit,
        },
        {
          title: 'Data architecture and use-case validation',
          detail: 'Technical preparation',
          body: 'Validation of data sources, technical security, and hosting prerequisites before any development.',
          href: routeMap.en.data,
        },
        {
          title: 'Business integration roadmap and first automations',
          detail: 'Deployment strategy',
          body: 'Prioritization of processes to automate, delivery sequencing, and expected return on investment.',
          href: routeMap.en.roadmap,
        },
        {
          title: 'AI Agents & Custom Tools',
          detail: 'Software engineering',
          body: 'Development of intelligent agents, business dashboards, portals, and implementation of human controls.',
          href: routeMap.en.agents,
        },
        {
          title: 'Production Release & Operations',
          detail: 'Deployment and handover',
          body: 'Secure deployment, monitoring setup, technical documentation, and complete skills transfer.',
          href: routeMap.en.buildRun,
        },
        {
          title: 'AI Governance and Consulting',
          detail: 'Strategy & Security',
          body: 'Security processes, regulatory compliance, regular audits and strategic steering committees.',
          href: routeMap.en.buildRun,
        },
      ],
    },
    delivery: {
      title: 'The Lucid-Lab method.',
      subtitle:
        'Driven by top management, digital and AI transformation moves forward in short cycles with handover from day one.',
      steps: [
        'Audit and mapping of your real processes.',
        'Collect organizational context and qualify high-impact use cases.',
        'AI build scoring: the perfect balance between value and risk.',
        'Securing access, data and compliance.',
        'Support designing a robust, monitored and scalable technical architecture.',
        'Development and integration by use case.',
        'Training and knowledge transfer.',
        'AI governance and consulting.',
      ],
    },
    cases: {
      title: 'Delivered client cases.',
      subtitle:
        'Three system formats already scoped or delivered: simple back office, automated CRM, enterprise AI roadmap.',
      items: [
        {
          title: 'Automated back office for a small operator',
          metric: 'Admin work centralized in one master sheet',
          body: 'Client data collected from email, Drive and forms, document checks, automated reminders and synchronization into a master Excel/Google Sheets file that the admin team can run from.',
        },
        {
          title: 'Full CRM for a premium mobility operator',
          metric: 'Sales, support and operations in one system',
          body: 'CRM structuring, internal process automation, commercial chatbot, customer support and a multi-year AI roadmap to evolve the operating stack.',
        },
        {
          title: 'AI roadmap for a large financial account',
          metric: '90+ use cases qualified and prioritized',
          body: 'Mapping Finance, Compliance, Credit, Legal and Risk, scoring value/effort/risk, inventorying data, framing AI governance, training ambassadors and sequencing deployment waves.',
        },
      ],
    },
    enterprise: {
      title: 'Enterprise standards for production.',
      subtitle:
        'Scaling up requires rigorous compliance. We handle security, data governance and operability at the source.',
      items: [
        {
          title: 'GDPR Compliance',
          description: 'Anonymization of user flows, compliant hosting and a strict policy of not storing secrets.'
        },
        {
          title: 'Access Management',
          description: 'Role-based access controls (RBAC) to limit database access and strict control of API tokens.'
        },
        {
          title: 'European Infrastructure',
          description: 'Data hosting and transit based in Europe, generally with Supabase and Cloudflare, for clear sovereignty.'
        },
        {
          title: 'Documentation & Runbooks',
          description: 'Systematic delivery of operational runbooks, architecture diagrams and incident recovery instructions.'
        },
        {
          title: 'Cost & Metrics Tracking',
          description: 'Monitoring of consumption, tokens, latency, success rate and model quality drift.'
        },
        {
          title: 'Intellectual Property',
          description: '100% ownership transfer for all source code, cloud configuration and databases.'
        },
        {
          title: 'Adoption and Handover',
          description: 'Technical training sessions and practical workshops to guarantee full autonomy for your internal teams.'
        },
        {
          title: 'AI Security',
          description: 'Audit and limitation of hallucinations through strict guardrails, prompt evaluation schemes and human control.'
        }
      ],
    },
    resources: {
      title: 'Resources for decisions.',
      subtitle: 'Guides, scoring criteria, AI security, ROI and business process automation.',
      cta: 'Read resources',
    },
    faq: {
      title: 'Frequently asked questions.',
      subtitle: 'Questions that come up before a first AI audit or business build.',
      items: [
        {
          question: 'When does Lucid-Lab get involved in an AI project?',
          answer:
            'Lucid-Lab gets involved upstream of need definition and helps you define the builds, construct the system, deploy it and prepare the handover.',
        },
        {
          question: 'What does the Audit Flash contain?',
          answer:
            'The Audit Flash is a first approach that defines your need, an approach, your budget and the applicable solutions.',
        },
        {
          question: 'What are the deliverables at the end of a mission?',
          answer:
            'It depends on the stage, but the core deliverables are development and technical documentation.',
        },
        {
          question: 'Do you work with tools already in place?',
          answer:
            'Yes. We connect CRM, ERP, files, internal databases, inboxes, no-code tools or business APIs when those bricks fit the need. We work with partners on developed solutions when incompatible tools without connectors block operations.',
        },
        {
          question: 'Can sensitive data be kept sovereign?',
          answer:
            'Yes. We can frame EU hosting, adapted models, permissions, logs and access rules according to the sensitivity level of the use case.',
        },
        {
          question: 'Does the first exchange commit us to a full project?',
          answer:
            'The first exchange qualifies the need. If the build sits outside our value zone, we say it and point you to a better suited solution.',
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
  const diagnosticLabel = lang === 'en' ? '// Real-time diagnostic' : '// Diagnostic en temps réel'
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)

  return (
    <Section id="problemes">
      <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr] lg:gap-12">
        <div>
          <SectionTitle>{t.title}</SectionTitle>
          <SectionLede>{t.subtitle}</SectionLede>
          
          {/* Live Diagnostic Monitor Panel */}
          <div className="mt-6 hidden lg:block rounded-[8px] border p-4 bg-[#FDFDFB]" style={{ borderColor: GRAY_200 }}>
            <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#8a8276] block mb-2">{diagnosticLabel}</span>
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
                  <motion.div
                    initial={false}
                    animate={{ height: isActive ? 'auto' : 0, opacity: isActive ? 1 : 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    className="overflow-hidden"
                  >
                    <p className="max-w-[48ch] text-[13px] leading-[1.45] pt-2" style={{ color: GRAY_600 }}>
                      {body}
                    </p>
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

function Pillars({ lang }: { lang: Locale }) {
  const t = content[lang].pillars
  const expertiseLabel = lang === 'en' ? 'Expertise' : 'Expertise'
  const impactLabel = lang === 'en' ? 'Final impact:' : 'Impact final :'
  const [activeIdx, setActiveIdx] = useState<number>(0)
  
  return (
    <Section id="expertises" tone="gray">
      <div className="relative">
        <div className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start lg:min-h-[100vh]">
          
          <div className="relative lg:sticky lg:top-32 flex flex-col gap-6 lg:gap-12 z-20 pb-4 lg:pb-0 self-start lg:h-max">
            <div className="grid gap-3 lg:gap-4">
              <SectionTitle>{t.title}</SectionTitle>
              <SectionLede>{t.subtitle}</SectionLede>
            </div>

            <div className="hidden lg:flex flex-col gap-1.5">
              {t.items.map((item, index) => {
                const Icon = pillarIcons[index] ?? SearchCheck
                const isActive = activeIdx === index
                return (
                  <button
                    key={item.title}
                    className="flex items-center justify-between p-3.5 rounded-[6px] border text-left transition-all duration-200 outline-none cursor-default"
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
          </div>

          <div className="flex flex-col relative w-full">
            {t.items.map((item, index) => {
              const Icon = pillarIcons[index] ?? SearchCheck
              const isLast = index === t.items.length - 1
              
              return (
                <React.Fragment key={index}>
                  <motion.div
                    onViewportEnter={() => setActiveIdx(index)}
                    viewport={{ margin: "-40% 0px -40% 0px" }}
                    className="sticky w-full h-[450px] lg:h-[380px] rounded-[12px] border p-6 md:p-8 flex flex-col justify-between bg-white shadow-sm top-[var(--card-top-mobile)] lg:top-[var(--card-top-desktop)]"
                    style={{ 
                      borderColor: GRAY_200,
                      '--card-top-mobile': `calc(130px + ${index * 16}px)`,
                      '--card-top-desktop': `calc(130px + ${index * 16}px)`,
                      zIndex: index
                    } as React.CSSProperties}
                  >
                    <div className="flex flex-col h-full justify-between relative z-10 w-full bg-white">
                      <div>
                        <div className="flex items-center justify-between border-b pb-3 mb-4" style={{ borderColor: GRAY_100 }}>
                          <div className="flex items-center gap-2">
                            <Icon className="size-4" style={{ color: EMBER }} />
                            <span className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#8a8276]">{expertiseLabel} 0{index + 1}</span>
                          </div>
                        </div>

                        <h3 className="text-[18px] md:text-[20px] font-bold" style={{ color: INK }}>{item.title}</h3>
                        <p className="mt-2 text-[13.5px] leading-[1.5]" style={{ color: GRAY_600 }}>{item.problem}</p>
                        
                        <ul className="mt-5 space-y-2.5">
                          {item.deliverables.map((deliverable) => (
                            <li key={deliverable} className="flex gap-2.5 text-[13px] items-center font-medium" style={{ color: INK }}>
                              <span className="h-1.5 w-1.5 rounded-full" style={{ background: EMBER }} />
                              {deliverable}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="mt-6 pt-4 border-t" style={{ borderColor: GRAY_100 }}>
                        <span className="text-[10px] font-mono text-[#8a8276] block mb-1">{impactLabel}</span>
                        <p className="text-[13px] font-semibold leading-[1.5]" style={{ color: EMBER }}>{item.result}</p>
                      </div>
                    </div>
                  </motion.div>
                  {/* Space tracker to allow the user to scroll before the next card arrives */}
                  <div className={isLast ? "h-[30vh] lg:h-[40vh]" : "h-[45vh] lg:h-[55vh]"} />
                </React.Fragment>
              )
            })}
          </div>

        </div>
      </div>
    </Section>
  )
}

function Offers({ lang }: { lang: Locale }) {
  const t = content[lang].offers

  // Creates the Bento Box layout
  const getBentoClass = (idx: number) => {
    switch(idx) {
      case 0: return "lg:col-span-7"
      case 1: return "lg:col-span-5"
      case 2: return "lg:col-span-4"
      case 3: return "lg:col-span-4"
      case 4: return "lg:col-span-4"
      case 5: return "lg:col-span-12 lg:row-span-1"
      default: return "lg:col-span-12"
    }
  }

  return (
    <Section id="offres" tone="ink">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-4">
        <div className="max-w-2xl">
          <SectionTitle light>{t.title}</SectionTitle>
          <SectionLede light>{t.subtitle}</SectionLede>
        </div>
      </div>
      
      <div className="mt-12 grid gap-4 md:grid-cols-2 lg:grid-cols-12 auto-rows-fr">
        {t.items.map((item, idx) => {
          const isFirstRow = idx < 2;
          return (
            <motion.article 
              key={item.title} 
              className={`group relative flex flex-col justify-between overflow-hidden rounded-[16px] border p-6 md:p-8 transition-all duration-500 hover:border-[#C85E1A]/40 hover:-translate-y-1 ${getBentoClass(idx)}`}
              style={{ 
                background: 'linear-gradient(180deg, rgba(30,30,30,0.4) 0%, rgba(15,15,15,0.8) 100%)',
                borderColor: 'rgba(250,250,247,0.1)'
              }}
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
              transition={{ duration: 0.5, delay: idx * 0.1, ease: [0.23, 1, 0.32, 1] }}
            >
              {/* Giant watermark number background */}
              <div className="absolute -top-12 -right-8 opacity-[0.03] transition-opacity duration-500 group-hover:opacity-[0.06] select-none pointer-events-none">
                <span className="text-[240px] font-black leading-none" style={{ color: PAPER }}>{idx + 1}</span>
              </div>

              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-8">
                  <span className="flex items-center justify-center size-6 rounded-full border border-white/10 text-[10px] font-mono text-white/50 bg-white/5">0{idx + 1}</span>
                  <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#C85E1A]">{item.detail}</span>
                </div>
                <h3 className={`font-bold leading-tight ${isFirstRow ? 'text-[22px] md:text-[28px]' : 'text-[18px] md:text-[22px]'}`} style={{ color: PAPER }}>
                  {item.title}
                </h3>
                <p className={`mt-4 leading-[1.6] ${isFirstRow ? 'text-[15px]' : 'text-[14px]'}`} style={{ color: 'rgba(250,250,247,0.64)' }}>
                  {item.body}
                </p>
              </div>
              
              {/* Subtle hover glow effect built with CSS shadow internally or just a nice gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-br from-[#C85E1A]/[0.03] to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none" />
            </motion.article>
          )
        })}
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

      <div className="mt-16 md:mt-24 w-full max-w-5xl mx-auto flex flex-col font-sans">
        {t.steps.map((step, idx) => {
          const offsetClass = [
            'md:ml-[0%]',
            'md:ml-[8%]',
            'md:ml-[16%]',
            'md:ml-[24%]',
            'md:ml-[16%]',
            'md:ml-[8%]',
            'md:ml-[0%]',
            'md:ml-[8%]',
          ][idx];

          return (
            <motion.div 
              key={idx}
              className={`group flex items-center gap-5 md:gap-8 p-3 md:p-5 w-full md:w-[80%] ${offsetClass} transition-transform duration-500 cursor-default`}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-10% 0px -10% 0px" }}
              transition={{ duration: 0.6, delay: 0.05 }}
            >
              <motion.div 
                className="text-[4rem] md:text-[6.5rem] font-black tracking-tighter transition-colors duration-500 cursor-default select-none"
                initial={{ color: '#F2DCC9' }}
                whileInView={{ color: '#E4A076' }}
                viewport={{ margin: "-25% 0px -25% 0px" }}
              >
                0{idx + 1}
              </motion.div>

              <motion.h3 
                className="text-[18px] md:text-[28px] font-bold leading-tight md:leading-snug transition-colors duration-500"
                initial={{ color: '#BDBAB6' }}
                whileInView={{ color: '#1C1917' }}
                viewport={{ margin: "-25% 0px -25% 0px" }}
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


function Cases({ lang }: { lang: Locale }) {
  const t = content[lang].cases

  return (
    <Section id="acquis-livres" tone="gray">
      <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
        <SectionTitle>{t.title}</SectionTitle>
        <SectionLede>{t.subtitle}</SectionLede>
      </div>
      
      <div className="mt-10 flex flex-col">
        {t.items.map((item, idx) => (
          <motion.div 
            key={item.title} 
            className="group flex flex-col md:flex-row md:items-center justify-between gap-6 py-6 border-t first:border-0" 
            style={{ borderColor: GRAY_200 }}
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: idx * 0.1 }}
          >
            <div className="md:w-1/2">
              <h3 className="text-[18px] font-bold text-stone-900 tracking-tight">{item.title}</h3>
              <p className="mt-2 text-[14px] leading-relaxed text-stone-600">
                {item.body}
              </p>
            </div>
            
            <div className="md:w-1/3 flex flex-col md:items-end md:text-right">
              <div className="text-[10px] font-mono uppercase tracking-[0.14em] text-[#8a8276] mb-1.5">{'// Impact'}</div>
              <p className="text-[22px] font-extrabold tracking-tight text-stone-900">
                {item.metric}
              </p>
            </div>
          </motion.div>
        ))}
      </div>
    </Section>
  )
}

function Enterprise({ lang }: { lang: Locale }) {
  const t = content[lang].enterprise

  return (
    <Section id="enterprise-readiness" tone="ink">
      <div className="relative">
        {/* Subtle glow effect behind the section */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl h-full blur-[120px] bg-white/5 opacity-40 pointer-events-none" />
        
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-start relative z-10">
          <div className="lg:sticky lg:top-32 max-w-md">
            <SectionTitle light>{t.title}</SectionTitle>
            <SectionLede light>{t.subtitle}</SectionLede>
          </div>
          
          <ul className="grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:mt-0 mt-10">
            {t.items.map((item, index) => {
              const Icon = readinessIcons[index] ?? ShieldCheck
              return (
                <motion.li 
                  key={item.title} 
                  className="flex flex-col gap-3 group" 
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center size-8 rounded-[6px] bg-white/5 border border-white/10 group-hover:bg-white/10 transition-colors duration-300">
                      <Icon className="size-3.5" strokeWidth={2} style={{ color: EMBER }} aria-hidden />
                    </div>
                    <h4 className="text-[15px] font-semibold text-[#EEEEEE] tracking-tight">{item.title}</h4>
                  </div>
                  <p className="text-[13px] leading-[1.6] text-[#A1A1AA]">
                    {item.description}
                  </p>
                </motion.li>
              )
            })}
          </ul>
        </div>
      </div>
    </Section>
  )
}

function Resources({ lang, posts }: { lang: Locale; posts?: Post[] }) {
  const t = content[lang].resources
  const hasPosts = posts && posts.length > 0

  const staticLinks = lang === 'en'
    ? ['AI audit: deliverables and scoring', 'AI, GDPR and internal data', 'Business automation ROI']
    : ['Audit IA : livrables et scoring', 'IA, RGPD et données internes', 'ROI des automatisations métier']

  return (
    <Section id="blog">
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <SectionTitle>{t.title}</SectionTitle>
          <SectionLede>{t.subtitle}</SectionLede>
        </div>
        <div className="hidden md:block">
          <TextLink href={routeMap[lang].blog}>{t.cta}</TextLink>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {hasPosts
          ? posts!.map((post) => {
              const cat = CATEGORIES[post.frontmatter.category]
              const catTitle = lang === 'en' ? (cat.titleEn ?? cat.title) : cat.title
              const href = lang === 'en' ? `/en/blog/${post.slug}` : `/blog/${post.slug}`
              return (
                <Link
                  key={post.slug}
                  href={href}
                  className="group flex flex-col overflow-hidden rounded-[12px] bg-white border border-zinc-200/80 transition-all hover:-translate-y-1 hover:border-zinc-300 hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.05)] shadow-sm"
                >
                  {post.frontmatter.heroImage ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.frontmatter.heroImage}
                      alt={post.frontmatter.heroImageAlt ?? post.frontmatter.title}
                      className="w-full aspect-[16/9] object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                  ) : (
                    <div className="aspect-[16/9] bg-zinc-100" />
                  )}
                  <div className="flex flex-1 flex-col justify-between p-6">
                    <div>
                      <span className="mb-3 inline-flex px-2 py-0.5 rounded-sm bg-zinc-100/80 text-[10.5px] font-bold uppercase tracking-widest text-zinc-500">
                        {catTitle}
                      </span>
                      <h3 className="mt-2 text-[17px] font-bold leading-[1.3] tracking-tight transition-colors group-hover:text-[#EC5A1D]" style={{ color: INK }}>
                        {post.frontmatter.title}
                      </h3>
                    </div>
                    <div className="mt-4 flex items-center justify-between border-t border-zinc-100 pt-4">
                      <span className="text-[13px] font-medium" style={{ color: EMBER }}>
                        {lang === 'en' ? 'Read' : 'Lire'}
                      </span>
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" style={{ color: EMBER }} aria-hidden />
                    </div>
                  </div>
                </Link>
              )
            })
          : staticLinks.map((title) => (
              <Link
                key={title}
                href={routeMap[lang].blog}
                className="group flex flex-col justify-between rounded-[12px] bg-white p-6 border border-zinc-200/80 transition-all hover:-translate-y-1 hover:border-zinc-300 hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.05)] shadow-sm"
              >
                <div className="mb-12">
                  <span className="mb-4 inline-flex px-2 py-0.5 rounded-sm bg-zinc-100/80 text-[10.5px] font-bold uppercase tracking-widest text-zinc-500">
                    Article
                  </span>
                  <h3 className="text-[17px] font-bold leading-[1.3] tracking-tight transition-colors group-hover:text-[#EC5A1D]" style={{ color: INK }}>
                    {title}
                  </h3>
                </div>
                <div className="flex items-center justify-between border-t border-zinc-100 pt-4">
                  <span className="text-[13px] font-medium" style={{ color: EMBER }}>
                    {lang === 'en' ? 'Read' : 'Lire'}
                  </span>
                  <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" style={{ color: EMBER }} aria-hidden />
                </div>
              </Link>
            ))
        }
      </div>

      <div className="mt-8 md:hidden">
        <TextLink href={routeMap[lang].blog}>{t.cta}</TextLink>
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

export function MarketingFooter({ lang }: { lang: Locale }) {
  const t = content[lang].footer
  const routes = routeMap[lang]
  const nav: Array<[string, string]> = [
    [lang === 'en' ? 'Expertise' : 'Expertises', '/#expertises'],
    [lang === 'en' ? 'Offers' : 'Offres', '/#offres'],
    [lang === 'en' ? 'Method' : 'Méthode', '/#comment-on-livre'],
    [lang === 'en' ? 'Client cases' : 'Cas clients', '/#acquis-livres'],
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
            <a href="https://www.linkedin.com/company/lucid-lab-fr/" target="_blank" rel="noopener noreferrer" className="mt-6 flex items-center transition-colors hover:text-stone-900" style={{ color: GRAY_400 }} aria-label="LinkedIn">
              <LinkedinIcon className="size-5" />
            </a>
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
              <li><Link href={routes.audit} className="text-[14px]" style={{ color: GRAY_600 }}>Audit Flash</Link></li>
              <li><Link href={lang === 'en' ? '/en/#offres' : '/#offres'} className="text-[14px]" style={{ color: GRAY_600 }}>Build & Run</Link></li>
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
        <div className="mt-12 flex flex-col items-start justify-between gap-3 border-t pt-6 text-[12px] sm:flex-row sm:items-center" style={{ borderColor: GRAY_200, color: GRAY_400 }}>
          <span>{t.copyright}</span>
          <nav className="flex items-center gap-4">
            <Link href="/mentions-legales" className="transition-colors hover:text-stone-700">{lang === 'en' ? 'Legal Notice' : 'Mentions légales'}</Link>
            <Link href="/cgv" className="transition-colors hover:text-stone-700">{lang === 'en' ? 'Terms of Sale' : 'CGV'}</Link>
            <Link href="/confidentialite" className="transition-colors hover:text-stone-700">{lang === 'en' ? 'Privacy' : 'Confidentialité'}</Link>
          </nav>
        </div>
      </div>
    </footer>
  )
}

export default function HomePage({ lang, latestPosts }: { lang: Locale; latestPosts?: Post[] }) {
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
        <TeamSection lang={lang} />
        <Enterprise lang={lang} />
        <Resources lang={lang} posts={latestPosts} />
        <FAQ lang={lang} />
        <AuditFlashBookingSection lang={lang} />
      </main>
      <MarketingFooter lang={lang} />
    </div>
  )
}