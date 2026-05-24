'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion } from 'framer-motion'
import {
  ArrowRight,
  Bot,
  CheckCircle2,
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
  Zap,
} from 'lucide-react'

import { AuditFlashForm } from '@/components/marketing/AuditFlashForm'
import { Header } from '@/components/ui/header'
import type { Locale } from '@/lib/i18n/client'

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
const readinessIcons = [LockKeyhole, ShieldCheck, Database, Code2, Network, FileText, Gauge, CheckCircle2, UserCheck, MonitorCheck] as const

function localize(lang: Locale, href: string) {
  if (href === auditHref.fr || href === auditHref.en) return auditHref[lang]
  if (href === blogHref.fr || href === blogHref.en) return blogHref[lang]
  return href
}

function SectionShell({
  id,
  className = '',
  children,
}: {
  id?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className={`border-t border-[#dedbd2] ${className}`}>
      <div className="mx-auto max-w-[1264px] border-x border-[#dedbd2] px-5 py-16 sm:px-8 md:px-12 md:py-24">
        {children}
      </div>
    </section>
  )
}

function SectionHeader({
  title,
  subtitle,
  className = '',
}: {
  title: string
  subtitle: string
  className?: string
}) {
  return (
    <div className={`mb-10 max-w-3xl md:mb-14 ${className}`}>
      <h2 className="text-[32px] font-semibold leading-[1.05] tracking-normal text-[#111111] md:text-[48px]">
        {title}
      </h2>
      <p className="mt-4 text-[16px] leading-[1.7] text-[#5f5a52] md:text-[18px]">{subtitle}</p>
    </div>
  )
}

function TextLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-2 text-[14px] font-semibold text-[#111111]">
      {children}
      <ArrowRight className="size-4" aria-hidden />
    </Link>
  )
}

function HeroVisual() {
  return (
    <div className="relative min-h-[460px] overflow-hidden rounded-[8px] border border-[#d7d2c8] bg-[#101112] shadow-[0_24px_80px_rgba(17,17,17,0.18)]">
      <div
        aria-hidden
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(135deg, rgba(18,19,20,0.98) 0%, rgba(19,31,38,0.96) 55%, rgba(58,44,26,0.9) 100%)',
        }}
      />
      <div aria-hidden className="absolute inset-0 opacity-45 [background-image:linear-gradient(rgba(255,255,255,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.07)_1px,transparent_1px)] [background-size:56px_56px]" />
      <div className="absolute inset-x-6 top-6 flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-white/45">
        <span>Lex / production console</span>
        <span>live build</span>
      </div>

      <motion.div
        aria-hidden
        className="absolute left-8 top-28 hidden w-[42%] space-y-3 md:block"
        initial={{ opacity: 0.65 }}
        animate={{ opacity: [0.45, 0.9, 0.45] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      >
        {['CRM -> scoring', 'Docs -> assistant', 'ERP -> reporting', 'Runbook -> alert'].map((line, i) => (
          <div key={line} className="grid grid-cols-[74px_1fr] items-center gap-3 text-[11px] text-white/60">
            <span className="font-mono text-white/35">0{i + 1}</span>
            <span className="h-px bg-gradient-to-r from-[#7fc7ff] via-white/35 to-transparent" />
            <span className="col-start-2 -mt-1 font-mono">{line}</span>
          </div>
        ))}
      </motion.div>

      <div className="absolute bottom-8 left-6 right-6 z-10 grid gap-3 md:left-8 md:right-auto md:w-[44%]">
        {[
          ['usage', '1 284 runs', '#7fc7ff'],
          ['latence', '1.8s p95', '#f6b34b'],
          ['qualité', '92% validé', '#7acb91'],
        ].map(([label, value, color]) => (
          <div key={label} className="flex items-center justify-between rounded-[8px] border border-white/10 bg-white/[0.06] px-3 py-2 backdrop-blur">
            <span className="text-[12px] text-white/45">{label}</span>
            <span className="font-mono text-[12px] text-white" style={{ color }}>
              {value}
            </span>
          </div>
        ))}
      </div>

      <motion.div
        className="absolute bottom-0 right-4 h-[68%] w-[58%] overflow-hidden rounded-t-[8px] border border-white/15 bg-[#f8f7f3] shadow-[0_18px_60px_rgba(0,0,0,0.25)] md:right-6 md:w-[43%]"
        animate={{ y: [0, -8, 0] }}
        transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      >
        <div className="absolute inset-x-0 top-0 z-10 flex h-8 items-center justify-between border-b border-[#dedbd2] bg-white/70 px-3 text-[10px] font-mono uppercase tracking-[0.16em] text-[#7a7368]">
          <span>Lex</span>
          <span>ready</span>
        </div>
        <Image
          src="/robot-poster-new.png"
          alt="Lex, robot Lucid-Lab"
          fill
          priority
          sizes="(min-width: 1024px) 560px, 80vw"
          className="object-contain object-bottom pt-8"
        />
      </motion.div>
    </div>
  )
}

function Hero({ lang }: { lang: Locale }) {
  const t = content[lang].hero

  return (
    <section className="relative overflow-hidden bg-[#f8f7f3] pt-[68px]">
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(180deg,#f8f7f3_0%,#ffffff_52%,#f1f4f6_100%)]" />
      <div className="mx-auto grid max-w-[1264px] gap-10 border-x border-[#dedbd2] px-5 pb-12 pt-12 sm:px-8 md:px-12 md:pb-16 md:pt-16 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55 }}
          className="max-w-[680px]"
        >
          <h1 className="text-[44px] font-semibold leading-[0.98] tracking-normal text-[#111111] sm:text-[60px] lg:text-[72px]">
            {t.title}
          </h1>
          <p className="mt-6 max-w-[610px] text-[17px] leading-[1.7] text-[#5f5a52] md:text-[19px]">{t.subtitle}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Link
              href={auditHref[lang]}
              className="inline-flex min-h-[46px] items-center justify-center rounded-[8px] bg-[#111111] px-5 text-[14px] font-semibold text-white transition hover:bg-[#2a2926]"
            >
              {t.primary}
            </Link>
            <a
              href="#lex"
              className="inline-flex min-h-[46px] items-center justify-center rounded-[8px] border border-[#cfcac1] bg-white px-5 text-[14px] font-semibold text-[#111111] transition hover:bg-[#f1eee8]"
            >
              {t.secondary}
            </a>
            <a href="#acquis-livres" className="inline-flex min-h-[46px] items-center text-[14px] font-semibold text-[#3f3a33]">
              {t.tertiary}
            </a>
          </div>
          <div className="mt-7 flex flex-wrap gap-x-4 gap-y-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#777064]">
            {t.proofs.map((proof) => (
              <span key={proof}>{proof}</span>
            ))}
          </div>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.65, delay: 0.1 }}
        >
          <HeroVisual />
        </motion.div>
      </div>
    </section>
  )
}

function Problems({ lang }: { lang: Locale }) {
  const t = content[lang].problems
  return (
    <SectionShell id="problemes" className="bg-white">
      <SectionHeader title={t.title} subtitle={t.subtitle} />
      <div className="grid gap-px overflow-hidden rounded-[8px] border border-[#dedbd2] bg-[#dedbd2] md:grid-cols-2 lg:grid-cols-3">
        {t.items.map(([title, body], i) => {
          const Icon = problemIcons[i] ?? CheckCircle2
          return (
            <div key={title} className="min-h-[190px] bg-[#fbfaf7] p-6">
              <Icon className="size-5 text-[#1f6f93]" strokeWidth={1.8} aria-hidden />
              <h3 className="mt-8 text-[20px] font-semibold leading-tight text-[#111111]">{title}</h3>
              <p className="mt-3 text-[14px] leading-[1.65] text-[#625d55]">{body}</p>
            </div>
          )
        })}
      </div>
    </SectionShell>
  )
}

function Pillars({ lang }: { lang: Locale }) {
  const t = content[lang].pillars
  return (
    <SectionShell id="expertises" className="bg-[#f8f7f3]">
      <SectionHeader title={t.title} subtitle={t.subtitle} />
      <div className="grid gap-4 lg:grid-cols-4">
        {t.items.map((item, i) => {
          const Icon = pillarIcons[i] ?? CheckCircle2
          return (
            <Link
              key={item.title}
              href={localize(lang, item.href)}
              className="group flex min-h-[430px] flex-col rounded-[8px] border border-[#d8d3c9] bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-[#9fc0d1] hover:shadow-[0_18px_50px_rgba(31,111,147,0.12)]"
            >
              <div className="flex items-start justify-between">
                <Icon className="size-6 text-[#1f6f93]" strokeWidth={1.7} aria-hidden />
                <span className="font-mono text-[12px] text-[#b0a89b]">0{i + 1}</span>
              </div>
              <h3 className="mt-10 text-[24px] font-semibold leading-[1.08] text-[#111111]">{item.title}</h3>
              <p className="mt-4 text-[14px] leading-[1.65] text-[#625d55]">{item.problem}</p>
              <div className="mt-7 space-y-3">
                {item.deliverables.map((d) => (
                  <div key={d} className="flex items-center gap-2 text-[13px] font-medium text-[#2f2b26]">
                    <CheckCircle2 className="size-4 text-[#b87721]" aria-hidden />
                    {d}
                  </div>
                ))}
              </div>
              <p className="mt-auto border-t border-[#ece8df] pt-5 text-[13px] leading-[1.6] text-[#1f6f93]">{item.result}</p>
            </Link>
          )
        })}
      </div>
    </SectionShell>
  )
}

function Offers({ lang }: { lang: Locale }) {
  const t = content[lang].offers
  return (
    <SectionShell id="offres" className="bg-[#111111] text-white">
      <SectionHeader title={t.title} subtitle={t.subtitle} className="[&_h2]:text-white [&_p]:text-white/62" />
      <div className="grid gap-4 lg:grid-cols-[1.15fr_1fr_1fr]">
        {t.items.map((item, i) => {
          const featured = 'featured' in item && item.featured
          return (
            <Link
              key={item.title}
              href={auditHref[lang]}
              className={`group rounded-[8px] border p-6 transition hover:-translate-y-1 ${
                featured
                  ? 'border-[#f6b34b]/70 bg-[#f6b34b] text-[#111111] lg:row-span-2'
                  : 'border-white/10 bg-white/[0.055] text-white hover:bg-white/[0.08]'
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <span className={`text-[12px] font-semibold uppercase tracking-[0.14em] ${featured ? 'text-[#62400d]' : 'text-white/45'}`}>
                  {item.detail}
                </span>
                <span className="font-mono text-[12px] opacity-45">0{i + 1}</span>
              </div>
              <h3 className={`mt-8 text-[26px] font-semibold leading-[1.05] ${featured ? 'md:text-[42px]' : ''}`}>{item.title}</h3>
              <p className={`mt-4 text-[15px] leading-[1.7] ${featured ? 'text-[#3c2a10]' : 'text-white/58'}`}>{item.body}</p>
              <span className="mt-8 inline-flex items-center gap-2 text-[14px] font-semibold">
                {item.cta}
                <ArrowRight className="size-4 transition group-hover:translate-x-1" aria-hidden />
              </span>
            </Link>
          )
        })}
      </div>
    </SectionShell>
  )
}

function Delivery({ lang }: { lang: Locale }) {
  const t = content[lang].delivery
  return (
    <SectionShell id="comment-on-livre" className="bg-white">
      <SectionHeader title={t.title} subtitle={t.subtitle} />
      <div className="relative grid gap-3 lg:grid-cols-6">
        {t.steps.map(([title, body], i) => (
          <div key={title} className="relative rounded-[8px] border border-[#dedbd2] bg-[#fbfaf7] p-5">
            <span className="font-mono text-[12px] text-[#b0a89b]">0{i + 1}</span>
            <h3 className="mt-8 text-[18px] font-semibold leading-tight text-[#111111]">{title}</h3>
            <p className="mt-3 text-[13px] leading-[1.6] text-[#625d55]">{body}</p>
          </div>
        ))}
      </div>
    </SectionShell>
  )
}

function RDSignal({ lang }: { lang: Locale }) {
  const t = content[lang].rd
  return (
    <SectionShell id="rd" className="bg-[#eef3f5]">
      <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
        <SectionHeader title={t.title} subtitle={t.subtitle} className="mb-0" />
        <div className="flex flex-wrap gap-2 lg:justify-end">
          {t.badges.map((badge) => (
            <span key={badge} className="rounded-[999px] border border-[#c8d8df] bg-white px-3 py-1.5 text-[12px] font-semibold text-[#34515d]">
              {badge}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-10 grid gap-4 lg:grid-cols-3">
        {t.cards.map(([title, body]) => (
          <Link key={title} href={blogHref[lang]} className="rounded-[8px] border border-[#cad7dd] bg-white p-6 transition hover:-translate-y-1 hover:shadow-[0_18px_50px_rgba(31,111,147,0.12)]">
            <Radio className="size-5 text-[#1f6f93]" aria-hidden />
            <h3 className="mt-8 text-[21px] font-semibold leading-tight text-[#111111]">{title}</h3>
            <p className="mt-3 text-[14px] leading-[1.65] text-[#5f5a52]">{body}</p>
          </Link>
        ))}
      </div>
      <p className="mt-6 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#6c7880]">{t.updated}</p>
    </SectionShell>
  )
}

function LexTeaser({ lang }: { lang: Locale }) {
  const t = content[lang].lex
  return (
    <SectionShell id="lex" className="bg-[#f8f7f3]">
      <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
        <div>
          <Bot className="size-8 text-[#1f6f93]" aria-hidden />
          <h2 className="mt-6 text-[36px] font-semibold leading-[1.05] tracking-normal text-[#111111] md:text-[56px]">{t.title}</h2>
          <p className="mt-5 max-w-xl text-[17px] leading-[1.7] text-[#5f5a52]">{t.subtitle}</p>
        </div>
        <div className="rounded-[8px] border border-[#d8d3c9] bg-white p-4 shadow-sm md:p-6">
          <AuditFlashForm lang={lang} mode="lex" placeholder={t.placeholder} />
        </div>
      </div>
    </SectionShell>
  )
}

function Cases({ lang }: { lang: Locale }) {
  const t = content[lang].cases
  return (
    <SectionShell id="acquis-livres" className="bg-white">
      <SectionHeader title={t.title} subtitle={t.subtitle} />
      <div className="grid gap-4 lg:grid-cols-3">
        {t.items.map((item, i) => (
          <article key={item.title} className="flex min-h-[520px] flex-col rounded-[8px] border border-[#dedbd2] bg-[#fbfaf7]">
            <div className="relative h-44 overflow-hidden border-b border-[#dedbd2] bg-[#101112]">
              <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px)] [background-size:28px_28px]" />
              <div className="absolute inset-x-5 top-5 flex items-center justify-between text-[11px] font-mono text-white/45">
                <span>case_0{i + 1}</span>
                <span>prod</span>
              </div>
              <div className="absolute bottom-5 left-5 right-5 rounded-[8px] border border-white/10 bg-white/[0.07] p-4 text-white backdrop-blur">
                <p className="text-[12px] text-white/45">{item.context}</p>
                <p className="mt-2 text-[22px] font-semibold leading-tight">{item.metric}</p>
              </div>
            </div>
            <div className="flex flex-1 flex-col p-6">
              <h3 className="text-[24px] font-semibold leading-tight text-[#111111]">{item.title}</h3>
              <p className="mt-3 text-[14px] leading-[1.65] text-[#625d55]">{item.problem}</p>
              <div className="mt-6 space-y-2">
                {item.system.map((system) => (
                  <div key={system} className="flex items-center gap-2 text-[13px] font-medium text-[#2f2b26]">
                    <Zap className="size-4 text-[#b87721]" aria-hidden />
                    {system}
                  </div>
                ))}
              </div>
              <p className="mt-auto border-t border-[#ece8df] pt-5 text-[13px] font-semibold text-[#1f6f93]">{item.remains}</p>
            </div>
          </article>
        ))}
      </div>
    </SectionShell>
  )
}

function Team({ lang }: { lang: Locale }) {
  const t = content[lang].team
  return (
    <SectionShell id="equipe" className="bg-[#f8f7f3]">
      <SectionHeader title={t.title} subtitle={t.subtitle} />
      <div className="grid gap-4 lg:grid-cols-3">
        {t.members.map((member) => (
          <article key={member.name} className="rounded-[8px] border border-[#d8d3c9] bg-white p-5">
            <div className="relative h-[260px] overflow-hidden rounded-[8px] bg-[#e6e0d5]">
              {member.image ? (
                <Image src={member.image} alt={member.name} fill sizes="(min-width: 1024px) 360px, 100vw" className="object-cover grayscale" />
              ) : (
                <div className="flex h-full w-full items-center justify-center bg-[#111111] text-[72px] font-semibold text-white">JG</div>
              )}
            </div>
            <h3 className="mt-5 text-[22px] font-semibold text-[#111111]">{member.name}</h3>
            <p className="mt-1 text-[13px] font-semibold uppercase tracking-[0.12em] text-[#1f6f93]">{member.role}</p>
            <p className="mt-4 text-[14px] leading-[1.65] text-[#625d55]">{member.bio}</p>
          </article>
        ))}
      </div>
      <div className="mt-4 rounded-[8px] border border-[#d8d3c9] bg-white p-6 text-[16px] leading-[1.7] text-[#3f3a33]">
        <strong className="text-[#111111]">Réseau étendu.</strong> {t.network}
      </div>
    </SectionShell>
  )
}

function Enterprise({ lang }: { lang: Locale }) {
  const t = content[lang].enterprise
  return (
    <SectionShell id="enterprise-readiness" className="bg-white">
      <SectionHeader title={t.title} subtitle={t.subtitle} />
      <div className="grid gap-px overflow-hidden rounded-[8px] border border-[#dedbd2] bg-[#dedbd2] md:grid-cols-2">
        {t.items.map((item, i) => {
          const Icon = readinessIcons[i] ?? CheckCircle2
          return (
            <div key={item} className="flex min-h-[92px] items-center gap-4 bg-[#fbfaf7] p-5">
              <Icon className="size-5 shrink-0 text-[#1f6f93]" strokeWidth={1.8} aria-hidden />
              <span className="text-[15px] font-medium leading-snug text-[#2f2b26]">{item}</span>
            </div>
          )
        })}
      </div>
    </SectionShell>
  )
}

function Resources({ lang }: { lang: Locale }) {
  const t = content[lang].resources
  const rd = content[lang].rd
  return (
    <SectionShell id="blog" className="bg-[#f8f7f3]">
      <div className="grid gap-10 lg:grid-cols-[0.85fr_1.15fr]">
        <div>
          <BookOpenIcon />
          <h2 className="mt-6 text-[34px] font-semibold leading-[1.05] tracking-normal text-[#111111] md:text-[48px]">{t.title}</h2>
          <p className="mt-4 text-[16px] leading-[1.7] text-[#5f5a52]">{t.subtitle}</p>
          <div className="mt-7">
            <TextLink href={blogHref[lang]}>{t.cta}</TextLink>
          </div>
        </div>
        <div className="divide-y divide-[#dedbd2] rounded-[8px] border border-[#dedbd2] bg-white">
          {rd.cards.map(([title, body]) => (
            <Link key={title} href={blogHref[lang]} className="block p-6 transition hover:bg-[#fbfaf7]">
              <h3 className="text-[20px] font-semibold text-[#111111]">{title}</h3>
              <p className="mt-2 text-[14px] leading-[1.6] text-[#625d55]">{body}</p>
            </Link>
          ))}
        </div>
      </div>
    </SectionShell>
  )
}

function BookOpenIcon() {
  return (
    <div className="flex size-10 items-center justify-center rounded-[8px] border border-[#d8d3c9] bg-white">
      <FileText className="size-5 text-[#1f6f93]" aria-hidden />
    </div>
  )
}

function FinalCTA({ lang }: { lang: Locale }) {
  const t = content[lang].final
  return (
    <section className="bg-[#111111]">
      <div className="mx-auto grid max-w-[1264px] gap-8 border-x border-white/10 px-5 py-16 text-white sm:px-8 md:px-12 md:py-20 lg:grid-cols-[1fr_auto] lg:items-center">
        <div>
          <h2 className="max-w-2xl text-[36px] font-semibold leading-[1.05] tracking-normal md:text-[54px]">{t.title}</h2>
          <p className="mt-4 max-w-xl text-[17px] leading-[1.65] text-white/62">{t.subtitle}</p>
        </div>
        <Link href={auditHref[lang]} className="inline-flex min-h-[48px] items-center justify-center rounded-[8px] bg-white px-6 text-[14px] font-semibold text-[#111111] transition hover:bg-[#efece5]">
          {t.cta}
        </Link>
      </div>
    </section>
  )
}

export function MarketingFooter({ lang }: { lang: Locale }) {
  const t = content[lang].footer
  const nav = [
    ['Expertises', '#expertises'],
    ['Offres', '#offres'],
    [lang === 'en' ? 'How we ship' : 'Comment on livre', '#comment-on-livre'],
    [lang === 'en' ? 'Delivered assets' : 'Acquis livrés', '#acquis-livres'],
  ]

  return (
    <footer className="border-t border-[#dedbd2] bg-[#f8f7f3]">
      <div className="mx-auto max-w-[1264px] border-x border-[#dedbd2] px-5 py-12 sm:px-8 md:px-12">
        <div className="grid gap-10 md:grid-cols-[1.35fr_0.8fr_0.8fr_0.8fr]">
          <div>
            <Link href={lang === 'en' ? '/en' : '/'} className="inline-flex items-center gap-2">
              <Image src="/logo.png" alt="Lucid-Lab" width={28} height={28} className="size-7" />
              <span className="text-[18px] font-bold tracking-normal text-[#111111]" style={{ fontFamily: 'var(--font-syne), sans-serif' }}>
                Lucid-Lab
              </span>
            </Link>
            <p className="mt-5 max-w-sm text-[14px] leading-[1.65] text-[#625d55]">{t.description}</p>
          </div>
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#8a8276]">{t.product}</p>
            <ul className="mt-4 space-y-3">
              {nav.map(([label, href]) => (
                <li key={label}>
                  <Link href={href} className="text-[14px] text-[#625d55] hover:text-[#111111]">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#8a8276]">{t.resources}</p>
            <ul className="mt-4 space-y-3">
              <li><Link href={blogHref[lang]} className="text-[14px] text-[#625d55] hover:text-[#111111]">Blog</Link></li>
              <li><Link href={auditHref[lang]} className="text-[14px] text-[#625d55] hover:text-[#111111]">Audit Flash</Link></li>
              <li><Link href={lang === 'en' ? '/en/privacy' : '/confidentialite'} className="text-[14px] text-[#625d55] hover:text-[#111111]">{lang === 'en' ? 'Privacy' : 'Confidentialité'}</Link></li>
            </ul>
          </div>
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.14em] text-[#8a8276]">{t.contact}</p>
            <ul className="mt-4 space-y-3">
              <li><a href="mailto:info@lucid-lab.fr" className="text-[14px] text-[#625d55] hover:text-[#111111]">info@lucid-lab.fr</a></li>
              <li><span className="text-[14px] text-[#625d55]">{t.location}</span></li>
            </ul>
          </div>
        </div>
        <div className="mt-10 border-t border-[#dedbd2] pt-5 text-[12px] text-[#8a8276]">{t.copyright}</div>
      </div>
    </footer>
  )
}

export default function HomePage({ lang }: { lang: Locale }) {
  return (
    <div className="flex w-full flex-col bg-[#f8f7f3]">
      <Header />
      <main className="grow">
        <Hero lang={lang} />
        <Problems lang={lang} />
        <Pillars lang={lang} />
        <Offers lang={lang} />
        <Delivery lang={lang} />
        <RDSignal lang={lang} />
        <LexTeaser lang={lang} />
        <Cases lang={lang} />
        <Team lang={lang} />
        <Enterprise lang={lang} />
        <Resources lang={lang} />
        <FinalCTA lang={lang} />
      </main>
      <MarketingFooter lang={lang} />
    </div>
  )
}
