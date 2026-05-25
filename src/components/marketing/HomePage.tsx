'use client'

import Image from 'next/image'
import Link from 'next/link'
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
  Radio,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  UserCheck,
  Workflow,
} from 'lucide-react'

import { AuditFlashForm } from '@/components/marketing/AuditFlashForm'
import { Header } from '@/components/ui/header'
import type { Locale } from '@/lib/i18n/client'

// Brand tokens — see lucid-lab-branding.md (Ink, Paper, Gray 600/400/200, Ember).
// Single-accent rule: Ember used sparingly; no secondary blue.
const INK = '#0A0A0A'
const PAPER = '#FAFAF7'
const GRAY_600 = '#525252'
const GRAY_400 = '#A3A3A3'
const GRAY_200 = '#E5E5E5'
const GRAY_100 = '#F2F2EE'
const EMBER = '#C85E1A'

const auditHref = {
  fr: '/audit-flash',
  en: '/en/audit-flash',
} as const

const blogHref = {
  fr: '/blog',
  en: '/en/blog',
} as const

const content = {
  fr: {
    hero: {
      title: 'Vos systèmes IA, construits, déployés, opérés.',
      subtitle:
        'On livre des agents, outils internes et automatisations qui tournent en production. Le cadrage sert à démarrer vite. Chaque étape livrée vous reste : propriété, code, documentation.',
      primary: 'Réserver un Audit Flash (30 min, gratuit)',
      secondary: 'Tester un agent (Lex)',
      tertiary: "Voir ce qu'on a livré",
      proofs: ['Build', 'Run', 'Intégrations', 'Monitoring', 'Documentation'],
    },
    problems: {
      title: "Là où les projets IA s'arrêtent d'habitude.",
      subtitle:
        "Les dirigeants n'ont pas besoin d'un nouveau discours IA. Ils ont besoin d'un premier système fiable qui passe en prod et reste exploitable.",
      items: [
        ['Idées IA dispersées', 'Beaucoup de tests, peu de systèmes réellement utilisés par les équipes.'],
        ['Workflows manuels', 'Des tâches répétitives qui mangent des jours entiers chaque mois.'],
        ['Outils non connectés', 'CRM, fichiers, ERP, boîtes mail et bases internes qui ne se parlent pas.'],
        ['Données difficiles', 'Accès, qualité, formats et droits insuffisamment clarifiés avant de builder.'],
        ['Sécurité mal cadrée', 'RGPD, permissions et usages IA sensibles traités trop tard.'],
        ['Adoption fragile', 'Un pilote existe, mais personne ne sait le surveiller, le reprendre ou l’améliorer.'],
      ],
    },
    pillars: {
      title: 'Expertises',
      subtitle: 'Quatre entrées, un seul objectif : livrer un acquis opérationnel.',
      items: [
        {
          title: 'IA, automatisation & outils internes',
          problem: 'Un workflow métier peut être confié à un agent ou à un outil interne.',
          deliverables: ['Agents IA en prod', 'Dashboards métier', 'Portails et interfaces internes'],
          result: 'Les équipes gagnent un système utilisable tous les jours.',
          href: '#offres',
        },
        {
          title: 'Build & Run / adoption',
          problem: 'Le système doit tourner, être surveillé et repris par les équipes.',
          deliverables: ['Monitoring coût / qualité', 'Runbooks incidents', 'Passage de main clair'],
          result: 'Le pilote devient un outil opéré, pas une démo oubliée.',
          href: '#comment-on-livre',
        },
        {
          title: 'Data & SI readiness',
          problem: "Le build échoue si les sources, accès et risques ne sont pas prêts.",
          deliverables: ['Inventaire sources', 'Droits et permissions', 'Architecture cible EU'],
          result: 'Les blocages techniques sont visibles avant d’engager le chantier.',
          href: '#enterprise-readiness',
        },
        {
          title: 'Diagnostic & cadrage',
          problem: 'Le bon premier chantier doit être choisi vite, sans mois de comité.',
          deliverables: ['Lecture du besoin', 'Arbitrage rapide / pérenne', 'Séquence de build'],
          result: 'On sait quoi construire, pourquoi, et ce qui restera au client.',
          href: auditHref.fr,
        },
      ],
    },
    offers: {
      title: 'Offres concrètes',
      subtitle: 'Pas de catalogue public ni de prix affichés. On part du besoin, puis on construit le bon système.',
      items: [
        {
          title: 'Audit Flash',
          detail: '30 min, gratuit',
          body: 'Porte d’entrée : pré-qualification, lecture du contexte, premier chantier plausible, orientation honnête.',
          cta: 'Réserver',
          featured: true,
        },
        {
          title: 'Agents IA & outils internes',
          detail: 'Le coeur',
          body: 'Agents, dashboards, workflows, connecteurs et interfaces qui remplacent un vrai travail manuel.',
          cta: 'Cadrer un build',
        },
        {
          title: 'Build & Run operations',
          detail: 'Prod + run',
          body: 'Déploiement, monitoring, alerting, documentation, runbooks et transfert d’exploitation.',
          cta: 'En savoir plus',
        },
        {
          title: 'Data & SI readiness',
          detail: 'Préparation technique',
          body: 'Sources, droits, risques, hébergement EU, modèles et intégrations à sécuriser avant le build.',
          cta: 'Évaluer ma maturité',
        },
        {
          title: 'Forma & adoption',
          detail: 'Option légère',
          body: 'Prise en main des équipes, bons réflexes IA, documentation et usages concrets. Sans catalogue public.',
          cta: 'En parler en call',
        },
      ],
    },
    delivery: {
      title: 'Comment on livre',
      subtitle: 'Le diagnostic sert le build. Le build sert la prod. La prod sert le prochain acquis.',
      steps: [
        ['Audit Flash', '30 min, gratuit. On qualifie, on comprend le contexte, on décide si Lucid-Lab est pertinent.'],
        ['Présentation d’offre', 'Second échange : problème lu, système proposé, architecture cible, séquence de livraison.'],
        ['Build', 'Cycles courts, démos régulières, intégrations réelles, code propriété client.'],
        ['Mise en prod', 'Monitoring, runbooks, documentation technique et utilisateur, transfert propre.'],
        ['Forma & adoption', 'Les équipes prennent la main sur les usages importants, pas sur une théorie IA.'],
        ['Run dans la durée', 'On surveille, on opère, on améliore et on attaque le chantier suivant quand il fait sens.'],
      ],
    },
    rd: {
      title: "Ce qu'on teste / shippe en ce moment",
      subtitle:
        "Le blog sert de carnet d'ingénierie : arbitrages, intégrations, prod, conformité et retours terrain.",
      updated: 'Mis à jour le 24 mai 2026',
      cards: [
        ['Architecture agent IA en production', 'Pourquoi on sépare outils, mémoire, traces, coûts et permissions.'],
        ['EU AI Act côté implémentation', 'Ce qui change dans la classification des cas, la doc et les logs.'],
        ['Mistral, Claude, open-source local', 'Quand la souveraineté prime, quand la précision prime, quand le coût prime.'],
      ],
      badges: ['Mistral Large', 'Vercel AI SDK', 'Langfuse', 'Supabase EU'],
    },
    lex: {
      title: 'Décris ton cas, Lex te répond.',
      subtitle:
        'Cycle 1 : Lex collecte le contexte et on revient avec une vraie analyse sous 24h. Cycle 2 : réponse live câblée sur nos savoir-faire.',
      placeholder: 'Exemple : notre DAF passe 4 jours par mois à consolider le reporting, avec des exports ERP et Excel...',
    },
    cases: {
      title: 'Acquis livrés',
      subtitle: "Des systèmes en prod, pas des recommandations. Chiffres anonymisés jusqu'à validation publique.",
      items: [
        {
          context: 'PME services · finance',
          title: 'Reporting finance automatisé',
          problem: 'Clôture mensuelle manuelle, données compta dispersées, pack envoyé trop tard.',
          system: ['Extraction compta', 'Pack reporting généré', 'Alertes écarts budget', 'Envoi automatique'],
          metric: 'Clôture passée de 4 jours à 2h',
          remains: 'Code propriété, documentation, monitoring.',
        },
        {
          context: 'Cabinet de services · 80 collaborateurs',
          title: 'Assistant interne de connaissance',
          problem: 'Base documentaire éclatée entre SharePoint, Notion et Drive.',
          system: ['Assistant web + Slack', 'Réponses sourcées', 'Droits calqués AD', 'Usage monitoré'],
          metric: '~600 requêtes/mois · ~75% utiles',
          remains: 'Assistant en prod, permissions, dashboard usage.',
        },
        {
          context: 'SaaS B2B · acquisition',
          title: 'Qualification leads / support',
          problem: 'Triage manuel de 200 leads par mois et risque de perte dans le CRM.',
          system: ['Scoring ICP', 'Routage automatique', 'Pré-remplissage CRM', 'Dashboard pilotage'],
          metric: '95% des leads routés en moins de 5 min',
          remains: 'Agent, intégration CRM, tableau de suivi.',
        },
      ],
    },
    team: {
      title: "L'équipe",
      subtitle:
        "Une petite équipe senior, branchée sur un réseau étendu quand le chantier le demande. On compose au cas par cas.",
      members: [
        {
          name: 'Anthony Poirier',
          role: 'Pilote en mode startup',
          bio: 'Restructurations d’ampleur pendant que le business continue à facturer. Quand il dit que ça part en prod cette semaine, ça part en prod cette semaine.',
          image: '/team/anthony.png',
        },
        {
          name: 'Theo Benard',
          role: 'Code et lit les bilans',
          bio: 'Software engineer + master finance. Le pont rare entre architecture technique et lecture P&L.',
          image: '/team/theo.png',
        },
        {
          name: 'Jules Gouron',
          role: 'Livre les outils IA en prod',
          bio: 'Expert outils IA, dev pur. Du prototype au truc qui tourne tous les jours, sans détour par la slide.',
          image: null,
        },
      ],
      network:
        'Quand le chantier dépasse l’équipe, on plug architectes, data engineers et partenaires sectoriels. On ne facture pas une équipe gonflée.',
    },
    enterprise: {
      title: 'Enterprise readiness',
      subtitle:
        'Les sujets sérieux sont intégrés au build : sécurité, données, conformité, hébergement, opérations.',
      items: [
        'RGPD et données personnelles',
        'EU AI Act : classification des risques, conformité, documentation',
        'Souveraineté & hébergement EU',
        'Modèles souverains : Mistral et alternatives open-source EU selon sensibilité',
        'Droits d’accès et permissions',
        'Documentation et runbooks',
        'Monitoring coût, usage, latence, qualité',
        'Transfert de propriété',
        'Forma et adoption',
        'Gouvernance IA',
      ],
    },
    resources: {
      title: "Ressources d'ingénierie",
      subtitle: 'Pas de théorie longue. Des choix d’architecture, des pièges d’intégration, du terrain.',
      cta: 'Lire le blog',
    },
    final: {
      title: '30 minutes pour qualifier ton besoin.',
      subtitle: "Aucun engagement. Si on est pertinents, on enchaîne. Sinon, on t'oriente.",
      cta: 'Réserver un Audit Flash (gratuit)',
    },
    footer: {
      description:
        'Lucid-Lab construit, déploie et opère des systèmes IA qui restent au client : agents, outils internes, automatisations, monitoring, documentation.',
      product: 'Navigation',
      resources: 'Ressources',
      contact: 'Contact',
      copyright: '© 2026 Lucid-Lab. Tous droits réservés.',
      location: 'Paris, France',
    },
  },
  en: {
    hero: {
      title: 'Your AI systems, built, deployed, operated.',
      subtitle:
        'We ship agents, internal tools and automations that run in production. Framing exists to start fast. Every delivered step stays with you: ownership, code, documentation.',
      primary: 'Book a free Audit Flash (30 min)',
      secondary: 'Test an agent (Lex)',
      tertiary: 'See delivered assets',
      proofs: ['Build', 'Run', 'Integrations', 'Monitoring', 'Documentation'],
    },
    problems: {
      title: 'Where AI projects usually stop.',
      subtitle:
        'Leaders do not need another AI speech. They need a first reliable system that reaches production and remains usable.',
      items: [
        ['Scattered AI ideas', 'Many tests, few systems actually used by teams.'],
        ['Manual workflows', 'Repetitive tasks consuming whole days every month.'],
        ['Disconnected tools', 'CRM, files, ERP, inboxes and internal databases do not talk to each other.'],
        ['Hard-to-use data', 'Access, quality, formats and permissions are unclear before the build.'],
        ['Security unclear', 'GDPR, permissions and sensitive AI usage are handled too late.'],
        ['Fragile adoption', 'A pilot exists, but nobody can monitor, own or improve it.'],
      ],
    },
    pillars: {
      title: 'Expertise',
      subtitle: 'Four entry points, one objective: deliver an operational asset.',
      items: [
        {
          title: 'AI, automation & internal tools',
          problem: 'A business workflow can be handed to an agent or internal tool.',
          deliverables: ['Production AI agents', 'Business dashboards', 'Internal portals and interfaces'],
          result: 'Teams get a system they can use every day.',
          href: '#offres',
        },
        {
          title: 'Build & Run / adoption',
          problem: 'The system must run, be monitored and be owned by teams.',
          deliverables: ['Cost / quality monitoring', 'Incident runbooks', 'Clear handover'],
          result: 'The pilot becomes an operated tool, not a forgotten demo.',
          href: '#comment-on-livre',
        },
        {
          title: 'Data & IT readiness',
          problem: 'The build fails if sources, access and risks are not ready.',
          deliverables: ['Source inventory', 'Rights and permissions', 'EU target architecture'],
          result: 'Technical blockers are visible before committing the build.',
          href: '#enterprise-readiness',
        },
        {
          title: 'Diagnostic & framing',
          problem: 'The first useful build must be chosen fast, without months of committees.',
          deliverables: ['Need reading', 'Fast / durable arbitration', 'Build sequence'],
          result: 'We know what to build, why, and what stays with the client.',
          href: auditHref.en,
        },
      ],
    },
    offers: {
      title: 'Concrete offers',
      subtitle: 'No public catalogue or visible pricing. We start from the need, then build the right system.',
      items: [
        {
          title: 'Audit Flash',
          detail: '30 min, free',
          body: 'Entry point: pre-qualification, context read, plausible first build, honest orientation.',
          cta: 'Book',
          featured: true,
        },
        {
          title: 'AI agents & internal tools',
          detail: 'Core work',
          body: 'Agents, dashboards, workflows, connectors and interfaces that replace real manual work.',
          cta: 'Frame a build',
        },
        {
          title: 'Build & Run operations',
          detail: 'Prod + run',
          body: 'Deployment, monitoring, alerting, documentation, runbooks and operational transfer.',
          cta: 'Learn more',
        },
        {
          title: 'Data & IT readiness',
          detail: 'Technical preparation',
          body: 'Sources, rights, risks, EU hosting, models and integrations to secure before build.',
          cta: 'Assess readiness',
        },
        {
          title: 'Training & adoption',
          detail: 'Light option',
          body: 'Team onboarding, practical AI habits, documentation and concrete usage. No public catalogue.',
          cta: 'Discuss on call',
        },
      ],
    },
    delivery: {
      title: 'How we ship',
      subtitle: 'Framing serves the build. The build serves production. Production serves the next asset.',
      steps: [
        ['Audit Flash', '30 min, free. We qualify, understand context and decide if Lucid-Lab is relevant.'],
        ['Offer presentation', 'Second exchange: problem read, proposed system, target architecture, delivery sequence.'],
        ['Build', 'Short cycles, regular demos, real integrations, client-owned code.'],
        ['Production release', 'Monitoring, runbooks, technical and user documentation, clean transfer.'],
        ['Training & adoption', 'Teams take control of the important usage, not AI theory.'],
        ['Long-term run', 'We monitor, operate, improve and start the next build when it makes sense.'],
      ],
    },
    rd: {
      title: 'What we test / ship right now',
      subtitle:
        'The blog is an engineering notebook: decisions, integrations, production, compliance and field notes.',
      updated: 'Updated May 24, 2026',
      cards: [
        ['Production AI agent architecture', 'Why tools, memory, traces, costs and permissions are separated.'],
        ['EU AI Act implementation view', 'What changes in use-case classification, documentation and logs.'],
        ['Mistral, Claude, local open-source', 'When sovereignty wins, when precision wins, when cost wins.'],
      ],
      badges: ['Mistral Large', 'Vercel AI SDK', 'Langfuse', 'Supabase EU'],
    },
    lex: {
      title: 'Describe your case. Lex answers.',
      subtitle:
        'Cycle 1: Lex collects context and we come back with a real analysis within 24h. Cycle 2: live answer connected to our know-how.',
      placeholder: 'Example: our finance team spends 4 days each month consolidating reporting from ERP exports and Excel...',
    },
    cases: {
      title: 'Delivered assets',
      subtitle: 'Production systems, not recommendations. Figures anonymized until public validation.',
      items: [
        {
          context: 'Services SME · finance',
          title: 'Automated finance reporting',
          problem: 'Manual monthly close, scattered accounting data, reporting pack sent too late.',
          system: ['Accounting extraction', 'Generated reporting pack', 'Budget variance alerts', 'Automatic delivery'],
          metric: 'Close reduced from 4 days to 2h',
          remains: 'Owned code, documentation, monitoring.',
        },
        {
          context: 'Services firm · 80 employees',
          title: 'Internal knowledge assistant',
          problem: 'Documentation split across SharePoint, Notion and Drive.',
          system: ['Web + Slack assistant', 'Sourced answers', 'AD-like permissions', 'Usage monitoring'],
          metric: '~600 queries/month · ~75% useful',
          remains: 'Production assistant, permissions, usage dashboard.',
        },
        {
          context: 'B2B SaaS · acquisition',
          title: 'Lead qualification / support triage',
          problem: 'Manual triage of 200 leads per month and CRM loss risk.',
          system: ['ICP scoring', 'Automatic routing', 'CRM pre-fill', 'Control dashboard'],
          metric: '95% of leads routed in under 5 min',
          remains: 'Agent, CRM integration, tracking dashboard.',
        },
      ],
    },
    team: {
      title: 'Team',
      subtitle:
        'A small senior team, connected to an extended network when the work requires it. We compose case by case.',
      members: [
        {
          name: 'Anthony Poirier',
          role: 'Startup-mode operator',
          bio: 'Large restructurings while the business keeps invoicing. When he says it ships this week, it ships this week.',
          image: '/team/anthony.png',
        },
        {
          name: 'Theo Benard',
          role: 'Codes and reads financial statements',
          bio: 'Software engineer + finance master. A rare bridge between technical architecture and P&L reading.',
          image: '/team/theo.png',
        },
        {
          name: 'Jules Gouron',
          role: 'Ships AI tools to production',
          bio: 'AI tools expert, pure developer. From prototype to daily-running system without a slide detour.',
          image: null,
        },
      ],
      network:
        'When the work exceeds the core team, we plug architects, data engineers and sector partners. We do not bill inflated teams.',
    },
    enterprise: {
      title: 'Enterprise readiness',
      subtitle:
        'Serious topics are part of the build: security, data, compliance, hosting, operations.',
      items: [
        'GDPR and personal data',
        'EU AI Act: risk classification, compliance, documentation',
        'Sovereignty & EU hosting',
        'Sovereign models: Mistral and EU open-source alternatives when relevant',
        'Access rights and permissions',
        'Documentation and runbooks',
        'Cost, usage, latency and quality monitoring',
        'Ownership transfer',
        'Training and adoption',
        'AI governance',
      ],
    },
    resources: {
      title: 'Engineering resources',
      subtitle: 'No long theory. Architecture decisions, integration traps and field notes.',
      cta: 'Read the blog',
    },
    final: {
      title: '30 minutes to qualify your need.',
      subtitle: 'No commitment. If we are relevant, we continue. Otherwise, we point you elsewhere.',
      cta: 'Book a free Audit Flash',
    },
    footer: {
      description:
        'Lucid-Lab builds, deploys and operates AI systems that stay with the client: agents, internal tools, automations, monitoring, documentation.',
      product: 'Navigation',
      resources: 'Resources',
      contact: 'Contact',
      copyright: '© 2026 Lucid-Lab. All rights reserved.',
      location: 'Paris, France',
    },
  },
} as const


const problemIcons = [Sparkles, Workflow, Network, Database, ShieldCheck, UserCheck] as const
const pillarIcons = [Bot, MonitorCheck, Database, SearchCheck] as const
const readinessIcons = [LockKeyhole, ShieldCheck, Database, Code2, Network, FileText, Gauge, UserCheck, MonitorCheck, Workflow] as const

function localize(lang: Locale, href: string) {
  if (href === auditHref.fr || href === auditHref.en) return auditHref[lang]
  if (href === blogHref.fr || href === blogHref.en) return blogHref[lang]
  return href
}

// --- Primitives ------------------------------------------------------------

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
  const fg = tone === 'ink' ? '#FFFFFF' : INK
  return (
    <section
      id={id}
      style={{ background: bg, color: fg, borderTop: `1px solid ${GRAY_200}` }}
    >
      <div className="mx-auto w-full max-w-[1200px] px-6 py-24 md:px-10 md:py-32">
        {children}
      </div>
    </section>
  )
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[12px] font-medium uppercase tracking-[0.16em]"
      style={{ color: EMBER }}
    >
      {children}
    </p>
  )
}

function SectionTitle({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <h2
      className="mt-4 max-w-[34ch] text-[34px] font-semibold leading-[1.08] tracking-[-0.01em] md:text-[48px]"
      style={{ color: light ? '#FFFFFF' : INK }}
    >
      {children}
    </h2>
  )
}

function SectionLede({ children, light = false }: { children: React.ReactNode; light?: boolean }) {
  return (
    <p
      className="mt-5 max-w-[60ch] text-[17px] leading-[1.6] md:text-[18px]"
      style={{ color: light ? 'rgba(255,255,255,0.72)' : GRAY_600 }}
    >
      {children}
    </p>
  )
}

function PrimaryCta({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex h-[48px] items-center justify-center rounded-[8px] px-6 text-[15px] font-medium transition-colors duration-200"
      style={{ background: INK, color: PAPER }}
    >
      {children}
      <ArrowRight className="ml-2 size-4" aria-hidden />
    </Link>
  )
}

function SecondaryCta({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex h-[48px] items-center justify-center rounded-[8px] border px-6 text-[15px] font-medium transition-colors duration-200"
      style={{ borderColor: GRAY_200, color: INK, background: 'transparent' }}
    >
      {children}
    </Link>
  )
}

function TextLink({ href, children, light = false }: { href: string; children: React.ReactNode; light?: boolean }) {
  return (
    <Link
      href={href}
      className="group inline-flex items-center gap-2 text-[14px] font-medium"
      style={{ color: light ? '#FFFFFF' : INK }}
    >
      <span className="border-b" style={{ borderColor: EMBER }}>{children}</span>
      <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
    </Link>
  )
}

// --- Hero ------------------------------------------------------------------

function Hero({ lang }: { lang: Locale }) {
  const t = content[lang].hero
  return (
    <section style={{ background: PAPER, color: INK }} className="pt-[68px]">
      <div className="mx-auto grid w-full max-w-[1200px] gap-16 px-6 py-24 md:px-10 md:py-32 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <div className="max-w-[640px]">
          <SectionEyebrow>Lucid-Lab</SectionEyebrow>
          <h1
            className="mt-4 text-[44px] font-semibold leading-[1.02] tracking-[-0.02em] md:text-[64px] lg:text-[72px]"
            style={{ color: INK }}
          >
            {t.title}
          </h1>
          <p className="mt-6 max-w-[58ch] text-[18px] leading-[1.55] md:text-[20px]" style={{ color: GRAY_600 }}>
            {t.subtitle}
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center">
            <PrimaryCta href={auditHref[lang]}>{t.primary}</PrimaryCta>
            <SecondaryCta href="#lex">{t.secondary}</SecondaryCta>
          </div>
          <div className="mt-12 flex flex-wrap gap-x-6 gap-y-2 text-[12px] font-medium uppercase tracking-[0.14em]" style={{ color: GRAY_400 }}>
            {t.proofs.map((proof) => (
              <span key={proof}>{proof}</span>
            ))}
          </div>
        </div>
        <div className="relative aspect-[4/5] w-full max-w-[480px] justify-self-end overflow-hidden rounded-[8px]" style={{ background: GRAY_100 }}>
          <Image
            src="/robot-poster-new.png"
            alt="Lex"
            fill
            priority
            sizes="(min-width: 1024px) 480px, 80vw"
            className="object-contain object-bottom"
          />
        </div>
      </div>
    </section>
  )
}

// --- Problems --------------------------------------------------------------

function Problems({ lang }: { lang: Locale }) {
  const t = content[lang].problems
  return (
    <Section id="problemes" tone="paper">
      <div className="max-w-[640px]">
        <SectionEyebrow>{lang === 'en' ? 'Context' : 'Constat'}</SectionEyebrow>
        <SectionTitle>{t.title}</SectionTitle>
        <SectionLede>{t.subtitle}</SectionLede>
      </div>
      <ul className="mt-16 grid gap-x-12 gap-y-10 md:grid-cols-2 lg:grid-cols-3">
        {t.items.map(([title, body], i) => {
          const Icon = problemIcons[i] ?? Sparkles
          return (
            <li key={title} className="border-t pt-6" style={{ borderColor: GRAY_200 }}>
              <Icon className="size-5" strokeWidth={1.6} style={{ color: INK }} aria-hidden />
              <h3 className="mt-5 text-[20px] font-semibold leading-[1.2]" style={{ color: INK }}>
                {title}
              </h3>
              <p className="mt-2 max-w-[40ch] text-[15px] leading-[1.55]" style={{ color: GRAY_600 }}>
                {body}
              </p>
            </li>
          )
        })}
      </ul>
    </Section>
  )
}

// --- Pillars ---------------------------------------------------------------

function Pillars({ lang }: { lang: Locale }) {
  const t = content[lang].pillars
  return (
    <Section id="expertises" tone="gray">
      <div className="max-w-[640px]">
        <SectionEyebrow>{lang === 'en' ? 'Capabilities' : 'Expertises'}</SectionEyebrow>
        <SectionTitle>{t.title}</SectionTitle>
        <SectionLede>{t.subtitle}</SectionLede>
      </div>
      <div className="mt-16 grid gap-px overflow-hidden rounded-[8px]" style={{ background: GRAY_200 }}>
        <div className="grid gap-px md:grid-cols-2" style={{ background: GRAY_200 }}>
          {t.items.map((item, i) => {
            const Icon = pillarIcons[i] ?? Bot
            return (
              <Link
                key={item.title}
                href={localize(lang, item.href)}
                className="group flex flex-col p-8 transition-colors duration-200 md:p-10"
                style={{ background: PAPER }}
              >
                <div className="flex items-center justify-between">
                  <Icon className="size-6" strokeWidth={1.5} style={{ color: INK }} aria-hidden />
                  <span className="font-mono text-[12px]" style={{ color: GRAY_400 }}>
                    0{i + 1}
                  </span>
                </div>
                <h3 className="mt-10 text-[24px] font-semibold leading-[1.15]" style={{ color: INK }}>
                  {item.title}
                </h3>
                <p className="mt-3 text-[15px] leading-[1.55]" style={{ color: GRAY_600 }}>
                  {item.problem}
                </p>
                <ul className="mt-6 space-y-2">
                  {item.deliverables.map((d) => (
                    <li key={d} className="flex items-start gap-2 text-[14px]" style={{ color: INK }}>
                      <span aria-hidden style={{ color: EMBER }} className="mt-[2px]">·</span>
                      {d}
                    </li>
                  ))}
                </ul>
                <p
                  className="mt-8 border-t pt-5 text-[14px] leading-[1.5]"
                  style={{ borderColor: GRAY_200, color: GRAY_600 }}
                >
                  {item.result}
                </p>
                <span
                  className="mt-6 inline-flex items-center gap-2 text-[14px] font-medium"
                  style={{ color: INK }}
                >
                  {lang === 'en' ? 'Read more' : 'En savoir plus'}
                  <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </Section>
  )
}

// --- Offers ----------------------------------------------------------------

function Offers({ lang }: { lang: Locale }) {
  const t = content[lang].offers
  return (
    <Section id="offres" tone="ink">
      <div className="max-w-[640px]">
        <p className="text-[12px] font-medium uppercase tracking-[0.16em]" style={{ color: EMBER }}>
          {lang === 'en' ? 'Offers' : 'Offres'}
        </p>
        <SectionTitle light>{t.title}</SectionTitle>
        <SectionLede light>{t.subtitle}</SectionLede>
      </div>
      <div className="mt-16 grid gap-px" style={{ background: 'rgba(255,255,255,0.10)' }}>
        <div className="grid gap-px md:grid-cols-2 lg:grid-cols-3" style={{ background: 'rgba(255,255,255,0.10)' }}>
          {t.items.map((item, i) => {
            const featured = 'featured' in item && item.featured
            return (
              <Link
                key={item.title}
                href={auditHref[lang]}
                className="group flex flex-col p-8 transition-colors duration-200 md:p-10"
                style={{ background: featured ? PAPER : INK, color: featured ? INK : '#FFFFFF' }}
              >
                <div className="flex items-center justify-between">
                  <span
                    className="text-[11px] font-medium uppercase tracking-[0.16em]"
                    style={{ color: featured ? EMBER : 'rgba(255,255,255,0.5)' }}
                  >
                    {item.detail}
                  </span>
                  <span
                    className="font-mono text-[12px]"
                    style={{ color: featured ? GRAY_400 : 'rgba(255,255,255,0.35)' }}
                  >
                    0{i + 1}
                  </span>
                </div>
                <h3 className="mt-10 text-[26px] font-semibold leading-[1.1]">{item.title}</h3>
                <p
                  className="mt-3 text-[15px] leading-[1.55]"
                  style={{ color: featured ? GRAY_600 : 'rgba(255,255,255,0.66)' }}
                >
                  {item.body}
                </p>
                <span className="mt-8 inline-flex items-center gap-2 text-[14px] font-medium">
                  {item.cta}
                  <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
                </span>
              </Link>
            )
          })}
        </div>
      </div>
    </Section>
  )
}

// --- Delivery --------------------------------------------------------------

function Delivery({ lang }: { lang: Locale }) {
  const t = content[lang].delivery
  return (
    <Section id="comment-on-livre" tone="paper">
      <div className="max-w-[640px]">
        <SectionEyebrow>{lang === 'en' ? 'Method' : 'Méthode'}</SectionEyebrow>
        <SectionTitle>{t.title}</SectionTitle>
        <SectionLede>{t.subtitle}</SectionLede>
      </div>
      <ol className="mt-16 grid gap-px overflow-hidden rounded-[8px] md:grid-cols-2 lg:grid-cols-3" style={{ background: GRAY_200 }}>
        {t.steps.map(([title, body], i) => (
          <li key={title} className="flex flex-col p-8" style={{ background: PAPER }}>
            <span className="font-mono text-[12px]" style={{ color: EMBER }}>
              0{i + 1}
            </span>
            <h3 className="mt-8 text-[19px] font-semibold leading-[1.2]" style={{ color: INK }}>
              {title}
            </h3>
            <p className="mt-2 text-[14px] leading-[1.55]" style={{ color: GRAY_600 }}>
              {body}
            </p>
          </li>
        ))}
      </ol>
    </Section>
  )
}

// --- R&D Signal ------------------------------------------------------------

function RDSignal({ lang }: { lang: Locale }) {
  const t = content[lang].rd
  return (
    <Section id="rd" tone="paper">
      <div className="flex flex-col gap-10 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-[640px]">
          <SectionEyebrow>R&D</SectionEyebrow>
          <SectionTitle>{t.title}</SectionTitle>
          <SectionLede>{t.subtitle}</SectionLede>
        </div>
        <div className="flex flex-wrap gap-2">
          {t.badges.map((badge) => (
            <span
              key={badge}
              className="rounded-[6px] border px-3 py-1.5 text-[12px] font-medium"
              style={{ borderColor: GRAY_200, color: INK, background: PAPER }}
            >
              {badge}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-16 grid gap-8 md:grid-cols-3">
        {t.cards.map(([title, body]) => (
          <Link
            key={title}
            href={blogHref[lang]}
            className="group flex flex-col border-t pt-6 transition-colors duration-200"
            style={{ borderColor: GRAY_200 }}
          >
            <Radio className="size-5" strokeWidth={1.5} style={{ color: INK }} aria-hidden />
            <h3 className="mt-6 text-[20px] font-semibold leading-[1.2]" style={{ color: INK }}>
              {title}
            </h3>
            <p className="mt-2 text-[15px] leading-[1.55]" style={{ color: GRAY_600 }}>
              {body}
            </p>
            <span className="mt-6 inline-flex items-center gap-2 text-[13px] font-medium" style={{ color: INK }}>
              {lang === 'en' ? 'Read' : 'Lire'}
              <ArrowRight className="size-4 transition-transform duration-200 group-hover:translate-x-0.5" aria-hidden />
            </span>
          </Link>
        ))}
      </div>
      <p className="mt-10 text-[12px] font-medium uppercase tracking-[0.14em]" style={{ color: GRAY_400 }}>
        {t.updated}
      </p>
    </Section>
  )
}

// --- Lex Teaser ------------------------------------------------------------

function LexTeaser({ lang }: { lang: Locale }) {
  const t = content[lang].lex
  return (
    <Section id="lex" tone="gray">
      <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div className="max-w-[520px]">
          <SectionEyebrow>Lex</SectionEyebrow>
          <SectionTitle>{t.title}</SectionTitle>
          <SectionLede>{t.subtitle}</SectionLede>
        </div>
        <div className="rounded-[8px] border p-6 md:p-8" style={{ borderColor: GRAY_200, background: PAPER }}>
          <AuditFlashForm lang={lang} mode="lex" placeholder={t.placeholder} />
        </div>
      </div>
    </Section>
  )
}

// --- Cases -----------------------------------------------------------------

function Cases({ lang }: { lang: Locale }) {
  const t = content[lang].cases
  return (
    <Section id="acquis-livres" tone="paper">
      <div className="max-w-[640px]">
        <SectionEyebrow>{lang === 'en' ? 'Delivered' : 'Acquis livrés'}</SectionEyebrow>
        <SectionTitle>{t.title}</SectionTitle>
        <SectionLede>{t.subtitle}</SectionLede>
      </div>
      <div className="mt-16 grid gap-8 lg:grid-cols-3">
        {t.items.map((item) => (
          <article
            key={item.title}
            className="flex flex-col border-t pt-8"
            style={{ borderColor: GRAY_200 }}
          >
            <p className="text-[12px] font-medium uppercase tracking-[0.14em]" style={{ color: GRAY_400 }}>
              {item.context}
            </p>
            <h3 className="mt-6 text-[22px] font-semibold leading-[1.2]" style={{ color: INK }}>
              {item.title}
            </h3>
            <p className="mt-3 text-[15px] leading-[1.55]" style={{ color: GRAY_600 }}>
              {item.problem}
            </p>
            <ul className="mt-6 space-y-2">
              {item.system.map((sys) => (
                <li key={sys} className="flex items-start gap-2 text-[14px]" style={{ color: INK }}>
                  <span aria-hidden style={{ color: EMBER }} className="mt-[2px]">·</span>
                  {sys}
                </li>
              ))}
            </ul>
            <p className="mt-8 font-mono text-[14px]" style={{ color: EMBER }}>
              {item.metric}
            </p>
            <p
              className="mt-6 border-t pt-5 text-[13px] leading-[1.55]"
              style={{ borderColor: GRAY_200, color: GRAY_600 }}
            >
              {item.remains}
            </p>
          </article>
        ))}
      </div>
    </Section>
  )
}

// --- Team ------------------------------------------------------------------

function Team({ lang }: { lang: Locale }) {
  const t = content[lang].team
  return (
    <Section id="equipe" tone="gray">
      <div className="max-w-[640px]">
        <SectionEyebrow>{lang === 'en' ? 'Team' : 'Équipe'}</SectionEyebrow>
        <SectionTitle>{t.title}</SectionTitle>
        <SectionLede>{t.subtitle}</SectionLede>
      </div>
      <div className="mt-16 grid gap-8 md:grid-cols-3">
        {t.members.map((member) => (
          <article key={member.name}>
            <div
              className="relative aspect-[4/5] w-full overflow-hidden rounded-[8px]"
              style={{ background: GRAY_200 }}
            >
              {member.image ? (
                <Image
                  src={member.image}
                  alt={member.name}
                  fill
                  sizes="(min-width: 1024px) 360px, 100vw"
                  className="object-cover grayscale"
                />
              ) : (
                <div
                  className="flex h-full w-full items-center justify-center text-[64px] font-semibold"
                  style={{ background: INK, color: PAPER }}
                >
                  {member.name
                    .split(' ')
                    .map((part) => part[0])
                    .join('')}
                </div>
              )}
            </div>
            <h3 className="mt-6 text-[20px] font-semibold" style={{ color: INK }}>
              {member.name}
            </h3>
            <p className="mt-1 text-[13px] font-medium" style={{ color: EMBER }}>
              {member.role}
            </p>
            <p className="mt-3 text-[15px] leading-[1.55]" style={{ color: GRAY_600 }}>
              {member.bio}
            </p>
          </article>
        ))}
      </div>
      <p className="mt-12 max-w-[60ch] text-[15px] leading-[1.55]" style={{ color: GRAY_600 }}>
        <span className="font-semibold" style={{ color: INK }}>
          {lang === 'en' ? 'Extended network. ' : 'Réseau étendu. '}
        </span>
        {t.network}
      </p>
    </Section>
  )
}

// --- Enterprise readiness --------------------------------------------------

function Enterprise({ lang }: { lang: Locale }) {
  const t = content[lang].enterprise
  return (
    <Section id="enterprise-readiness" tone="paper">
      <div className="max-w-[640px]">
        <SectionEyebrow>{lang === 'en' ? 'Readiness' : 'Readiness'}</SectionEyebrow>
        <SectionTitle>{t.title}</SectionTitle>
        <SectionLede>{t.subtitle}</SectionLede>
      </div>
      <ul className="mt-16 grid gap-px overflow-hidden rounded-[8px] md:grid-cols-2" style={{ background: GRAY_200 }}>
        {t.items.map((item, i) => {
          const Icon = readinessIcons[i] ?? ShieldCheck
          return (
            <li
              key={item}
              className="flex items-center gap-4 p-6"
              style={{ background: PAPER }}
            >
              <Icon className="size-5 shrink-0" strokeWidth={1.5} style={{ color: INK }} aria-hidden />
              <span className="text-[15px]" style={{ color: INK }}>
                {item}
              </span>
            </li>
          )
        })}
      </ul>
    </Section>
  )
}

// --- Resources -------------------------------------------------------------

function Resources({ lang }: { lang: Locale }) {
  const t = content[lang].resources
  const rd = content[lang].rd
  return (
    <Section id="blog" tone="gray">
      <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="max-w-[480px]">
          <SectionEyebrow>{lang === 'en' ? 'Resources' : 'Ressources'}</SectionEyebrow>
          <SectionTitle>{t.title}</SectionTitle>
          <SectionLede>{t.subtitle}</SectionLede>
          <div className="mt-8">
            <TextLink href={blogHref[lang]}>{t.cta}</TextLink>
          </div>
        </div>
        <ul className="divide-y rounded-[8px] border" style={{ borderColor: GRAY_200, background: PAPER, borderStyle: 'solid' }}>
          {rd.cards.map(([title, body]) => (
            <li key={title}>
              <Link href={blogHref[lang]} className="block p-6 transition-colors duration-200">
                <h3 className="text-[18px] font-semibold" style={{ color: INK }}>
                  {title}
                </h3>
                <p className="mt-2 text-[14px] leading-[1.55]" style={{ color: GRAY_600 }}>
                  {body}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </Section>
  )
}

// --- Final CTA -------------------------------------------------------------

function FinalCTA({ lang }: { lang: Locale }) {
  const t = content[lang].final
  return (
    <section style={{ background: INK, color: '#FFFFFF', borderTop: `1px solid ${GRAY_200}` }}>
      <div className="mx-auto grid w-full max-w-[1200px] gap-10 px-6 py-24 md:grid-cols-[1fr_auto] md:items-end md:px-10 md:py-32">
        <div>
          <p className="text-[12px] font-medium uppercase tracking-[0.16em]" style={{ color: EMBER }}>
            {lang === 'en' ? 'Next step' : 'Prochaine étape'}
          </p>
          <h2
            className="mt-4 max-w-[24ch] text-[36px] font-semibold leading-[1.05] tracking-[-0.01em] md:text-[56px]"
            style={{ color: '#FFFFFF' }}
          >
            {t.title}
          </h2>
          <p className="mt-5 max-w-[52ch] text-[17px] leading-[1.55]" style={{ color: 'rgba(255,255,255,0.72)' }}>
            {t.subtitle}
          </p>
        </div>
        <Link
          href={auditHref[lang]}
          className="inline-flex h-[52px] items-center justify-center rounded-[8px] px-7 text-[15px] font-medium transition-colors duration-200"
          style={{ background: PAPER, color: INK }}
        >
          {t.cta}
          <ArrowRight className="ml-2 size-4" aria-hidden />
        </Link>
      </div>
    </section>
  )
}

// --- Footer ----------------------------------------------------------------

export function MarketingFooter({ lang }: { lang: Locale }) {
  const t = content[lang].footer
  const nav: Array<[string, string]> = [
    [lang === 'en' ? 'Capabilities' : 'Expertises', '#expertises'],
    [lang === 'en' ? 'Offers' : 'Offres', '#offres'],
    [lang === 'en' ? 'Method' : 'Méthode', '#comment-on-livre'],
    [lang === 'en' ? 'Delivered' : 'Acquis livrés', '#acquis-livres'],
  ]
  return (
    <footer style={{ background: PAPER, borderTop: `1px solid ${GRAY_200}` }}>
      <div className="mx-auto w-full max-w-[1200px] px-6 py-16 md:px-10">
        <div className="grid gap-12 md:grid-cols-[1.4fr_0.8fr_0.8fr_0.8fr]">
          <div>
            <Link href={lang === 'en' ? '/en' : '/'} className="inline-flex items-center gap-2">
              <Image src="/logo.png" alt="Lucid-Lab" width={28} height={28} className="size-7" />
              <span className="text-[18px] font-semibold tracking-tight" style={{ color: INK }}>
                Lucid-Lab
              </span>
            </Link>
            <p className="mt-5 max-w-[40ch] text-[14px] leading-[1.6]" style={{ color: GRAY_600 }}>
              {t.description}
            </p>
          </div>
          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.14em]" style={{ color: GRAY_400 }}>
              {t.product}
            </p>
            <ul className="mt-4 space-y-3">
              {nav.map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="text-[14px]" style={{ color: GRAY_600 }}>
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.14em]" style={{ color: GRAY_400 }}>
              {t.resources}
            </p>
            <ul className="mt-4 space-y-3">
              <li>
                <Link href={blogHref[lang]} className="text-[14px]" style={{ color: GRAY_600 }}>
                  Blog
                </Link>
              </li>
              <li>
                <Link href={auditHref[lang]} className="text-[14px]" style={{ color: GRAY_600 }}>
                  Audit Flash
                </Link>
              </li>
              <li>
                <Link
                  href={lang === 'en' ? '/en/privacy' : '/confidentialite'}
                  className="text-[14px]"
                  style={{ color: GRAY_600 }}
                >
                  {lang === 'en' ? 'Privacy' : 'Confidentialité'}
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <p className="text-[12px] font-medium uppercase tracking-[0.14em]" style={{ color: GRAY_400 }}>
              {t.contact}
            </p>
            <ul className="mt-4 space-y-3">
              <li>
                <a href="mailto:info@lucid-lab.fr" className="text-[14px]" style={{ color: GRAY_600 }}>
                  info@lucid-lab.fr
                </a>
              </li>
              <li>
                <span className="text-[14px]" style={{ color: GRAY_600 }}>
                  {t.location}
                </span>
              </li>
            </ul>
          </div>
        </div>
        <div className="mt-12 border-t pt-6 text-[12px]" style={{ borderColor: GRAY_200, color: GRAY_400 }}>
          {t.copyright}
        </div>
      </div>
    </footer>
  )
}

// --- Page ------------------------------------------------------------------

export default function HomePage({ lang }: { lang: Locale }) {
  return (
    <div className="flex w-full flex-col" style={{ background: PAPER }}>
      <Header />
      <main className="grow">
        <Hero lang={lang} />
        <Problems lang={lang} />
        <Pillars lang={lang} />
        <Offers lang={lang} />
        <Delivery lang={lang} />
        <Cases lang={lang} />
        <RDSignal lang={lang} />
        <LexTeaser lang={lang} />
        <Team lang={lang} />
        <Enterprise lang={lang} />
        <Resources lang={lang} />
        <FinalCTA lang={lang} />
      </main>
      <MarketingFooter lang={lang} />
    </div>
  )
}
