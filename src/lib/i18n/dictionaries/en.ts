import type { fr } from './fr';

// Mirror of fr.ts with English translations.
// Translation principles applied:
// - "Audit Flash" → kept as-is (brand term).
// - "Full-Stack Transformation Engine" → kept (already English).
// - "Roadmap d'Exécution" → "Execution Roadmap".
// - "Stratégie Opérationnelle" → "Operational Strategy".
// - "Développement & Déploiement" → "Development & Deployment".
// - "Accompagnement au changement" → "Change Management".
// - "Cas clients" → "Case studies".
// - "RGPD" → "GDPR".
// - "PME" → "SME"; "paquebot industriel" → "enterprise organization".
// - "On ne conseille pas. On construit." → "We don't advise. We build."

// Structural shape of fr (without literal types) — lets EN values differ.

export const en: typeof fr = {
  header: {
    nav: {
      cases: 'Case studies',
      method: 'How it works',
      blog: 'Blog',
      contact: 'Contact',
    },
    cta: 'Book the Audit Flash',
    backToHome: '← Back',
    languageLabel: 'Language',
    switchToEnglish: 'English',
    switchToFrench: 'Français',
  },
  hero: {
    titleLine1: "We don't advise.",
    titleLine2: 'We build.',
    subtitle:
      'Lucid-Lab is the **Full-Stack Transformation Engine** that uncovers your operational chaos, maps it, and turns it into autonomous productivity systems.',
    subtitleLine2: 'Strategy. Software. AI Engineering. **Zero PowerPoint.**',
    ctaPrimary: 'Book the Audit Flash',
    ctaSecondary: 'See case studies',
  },
  pillars: {
    intro: {
      line1: 'Operational Strategy.',
      line2: 'Development & Deployment.',
      line3: 'Change Management.',
      paragraph:
        "A complete value chain: we map your organization, build the systems that move it forward, and deploy them.\nFrom agile startups to large enterprises, we operate everywhere with the same level of rigor.",
    },
    clickHint: 'Click for details',
    backHint: '← back',
    items: [
      {
        num: '01',
        label: 'Operational Strategy',
        title: 'From chaos\nto a clear action plan.',
        description:
          'Complete mapping of your organization, identification of bottlenecks, and a prioritized execution plan. In 30 minutes, you go from fog to a clear, costed direction.',
        features: [
          'End-to-end process mapping',
          'Execution plan delivered',
          'Target architecture & costed return on investment',
        ],
        backTitle: 'What you receive.',
        backItems: [
          'Initial 30-min audit (free)',
          'Complete mapping of your processes',
          'Execution plan prioritized by return on investment',
          'Detailed target technical architecture',
          'Actionable deliverable, ready to execute without intermediaries',
        ],
        backCta: 'Book the Audit Flash',
      },
      {
        num: '02',
        label: 'Development & Deployment',
        title: 'Development.\nAI Automation.',
        description:
          'We design and deploy your autonomous systems: AI agents, custom automations, connectors and data pipelines. On your infrastructure. No lock-in.',
        features: [
          'Custom AI agents & automations',
          'Connectors, scrapers & data pipelines',
          'Full production deployment',
        ],
        backTitle: 'What we build.',
        backItems: [
          'Autonomous AI agents (acquisition, support, qualification)',
          'Custom automations powered by OpenAI and Claude',
          'Connectors and integrations on your infrastructure',
          'Real-time dashboards and monitoring (Périscope case)',
          'Code, automations and documentation: 100\u00a0% yours',
        ],
        backCta: 'See our case studies',
      },
      {
        num: '03',
        label: 'Change Management',
        title: 'Your teams take back\ncontrol.',
        description:
          "We evolve your systems, train your teams, and secure your RFP responses. AI executes; your people drive strategy and the company's future.",
        features: [
          'Scaling & continuous oversight',
          'Team training & AI governance',
          'RFP responses',
        ],
        backTitle: 'How we operate.',
        backItems: [
          'Scaling without growing your headcount',
          'Training internal teams on automation and AI',
          'AI governance, compliance and legal framing',
          'Enterprise RFP responses',
          'Monthly report: performance, costs, return on investment',
        ],
        backCta: 'Talk to an expert',
      },
    ],
  },
  howItWorks: {
    headlineLine1: 'The Step-by-Step Offer.',
    headlineLine2: 'From the Audit Flash to continuous automation.',
    cta: 'Book the Audit Flash',
    steps: [
      {
        num: '01',
        title: 'Audit Flash · 30 min · free.',
        desc: 'You describe your business and its bottleneck. We qualify it, identify the chaos, quantify the opportunity cost, and decide together what automation could deliver.',
      },
      {
        num: '02',
        title: 'Execution Roadmap.',
        desc: 'The audit. Process fully mapped, target architecture (Tool A + Tool B + AI), costed cost/benefit, and a clear, defined Roadmap. Not a PowerPoint, not promises: a real lever for action.',
      },
      {
        num: '03',
        title: 'Build & Run.',
        desc: 'We code, integrate, and deploy. AI agents, n8n workflows, APIs, scrapers. Production rollout on your infrastructure with regular monitoring. Coaching, training, knowledge transfer: we are present at every step of your transition.',
      },
      {
        num: '04',
        title: 'Change management and maintenance.',
        desc: 'Scaling, team training, AI governance, RFP support. Your teams take back control of strategy and focus on their core business; AI executes. Lucid-Lab supports you on your next challenges and the continuity of operations.',
      },
    ],
  },
  faq: {
    label: 'FAQs',
    headline: 'A question?',
    subtitle: 'Everything you need to know before getting started.',
    items: [
      {
        q: 'What exactly is a Full-Stack Transformation Engine?',
        a: 'A single value chain covering the three links of transformation: Operational Strategy (Process Mapping, Execution Roadmap), Software Dev (APIs, scrapers, integrations), and AI Engineering (autonomous agents, n8n workflows, data pipelines). We solve your bottlenecks through a precise architecture to guarantee a measurable result. Not three prompts and a PowerPoint.',
      },
      {
        q: "How are you different from a consulting firm or a no-code shop?",
        a: "We don't advise. We build. We are Operational Strategists: we take the chaos, map it, and deliver autonomous systems in production on your infrastructure. Code, workflows and docs are 100\u00a0% yours. No lock-in.",
      },
      {
        q: 'What kind of companies do you work with?',
        a: "From agile startups to industrial enterprises. Recent cases: Turismo (full operational scaling without growing headcount), Universal and our LinkedIn Bots (autonomous lead generation), Périscope (real-time data monitoring), and many small niche businesses: interior design, massage therapists, Mym creators. If it has a process, we can systematize it.",
      },
      {
        q: 'And for large enterprises: RFPs, compliance, GDPR?',
        a: "We have a dedicated 'Change Management' track for large organizations: RFP responses, AI governance, GDPR compliance, sovereign hosting, and internal team training. Humans keep control of strategy; AI executes.",
      },
    ],
  },
  team: {
    label: 'The team',
    headlineLine1: 'Operational Strategists.',
    headlineLine2: 'Not project managers.',
    subtitle:
      "You speak directly with the engineers and architects who build your systems. No intermediaries, no re-briefing, no lost context.",
    cta: 'Book the Audit Flash',
    ctaSub: '30 min · free · no commitment',
    members: [
      { name: 'Anthony POIRIER', role: 'CEO · Co-founder' },
      { name: 'Théo BENARD', role: 'CTO · Co-founder' },
      { name: 'Jules GOURON', role: 'COO · Co-founder' },
    ],
  },
  blueCta: {
    headlineLine1: "We don't write reports.",
    headlineLine2: 'We change your operations.',
    subtitle:
      "30 minutes to go from your chaos to a costed Execution Roadmap. No PowerPoint. No commitment.",
    cta: 'Book the Audit Flash',
  },
  footer: {
    description: 'Full-Stack Transformation Engine. For startups, SMEs and industrial enterprises.',
    productLabel: 'Product',
    productItems: [
      { label: 'Expertise', href: '#solutions' },
      { label: 'Process', href: '#processus' },
    ],
    resourcesLabel: 'Resources',
    resourcesItems: [
      { label: 'FAQ', href: '#faq' },
      { label: 'Case studies', href: '#cas-clients' },
      { label: 'Book a call', href: '#booking' },
    ],
    contactLabel: 'Contact',
    contactEmail: 'info@lucid-lab.fr',
    copyright: '© 2026 Lucid-Lab. All rights reserved.',
    legalLinks: [
      { label: 'Legal notice', href: '/en/legal-notice' },
      { label: 'Privacy', href: '/en/privacy' },
    ],
    location: 'Paris, France 🇫🇷',
  },
  booking: {
    label: 'Book a call',
    headlineLine1: "Let's talk for 30 minutes",
    headlineLine2: 'about your project.',
    subtitle:
      'Audit, strategy or build: share your context. Together we identify what makes sense for you.',
    checklist: ['Free discovery call', 'Immediate response and confirmation'],
    ctaCalendar: 'See availability',
    ctaEmail: 'Send an email',
    daysShort: ['S', 'M', 'T', 'W', 'T', 'F', 'S'],
    daysLong: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    selectDay: 'Select a day',
    noSlots: 'No slots available this day',
    today: 'Today',
    selected: 'Selected',
    openCalendar: 'Open full calendar ↗',
    morning: 'Morning',
    afternoon: 'Afternoon',
  },
  features: {
    aiCustom: 'Custom AI',
    chatbots: {
      title: 'Automated chatbots',
      desc: 'WhatsApp Business, Messenger, web chat. Your customers get instant answers 24/7 without human intervention.',
    },
    roi: {
      title: 'Measurable ROI',
      desc: 'Every automation is tracked. You see in real time the impact on your costs, leads and conversions.',
    },
    n8n: {
      title: 'n8n automation',
      desc: 'Slack, CRM, ERP, e-commerce: we connect all your tools into intelligent workflows running continuously.',
    },
    web: {
      title: 'Websites & landing pages',
      desc: 'Conversion sites, funnels and landing pages with built-in AI, optimized to capture and qualify your prospects.',
    },
  },
  bento: {
    label: 'Proof through action',
    headline: 'Turismo, Universal, Périscope · and 10+ more in production.',
    subtitle:
      "Full operational scaling, autonomous lead gen, real-time data monitoring, niche micro-businesses, websites & e-commerce. If a process \u201c\u202fexists\u202f\u201d in any form, we systematize it, automate it, and hand the keys to your teams.",
    chat: {
      msg1: 'We get 200 support emails / week and my LinkedIn lead gen is sluggish. Can you handle both?',
      msg2: 'Yes: AI agent to qualify/route support + autonomous LinkedIn bot that scrapes, scores and engages. Costed roadmap in 30 min.',
      msg3: 'And what if the volume explodes like at Turismo?',
      msg4: "We scale without growing the headcount. That's exactly our Scalability Framework.",
    },
    chartMonths: ['Jan', 'Feb', 'Mar', 'Apr'],
    chartLegendExecuted: 'Workflows executed',
    chartLegendActive: 'Active automations',
    mapBadge: 'Latest deploy · Paris 🇫🇷',
    mapTitle: 'Multi-sector · multi-size',
    mapSubtitle: 'Startups, SMEs, enterprise organizations & niches',
    chatHeaderTitle: 'Lucid · your Strategist live',
    chatHeaderSubtitle: 'WhatsApp connected, reply within 2 business hours',
    statDeployedLabel: 'Autonomous systems in production',
    statDeployedSub: 'live deployments · from enterprise organization to niche',
    statRoadmapLabel: 'Roadmap → Production',
    statRoadmapSub: 'of Execution Roadmaps shipped to production on schedule',
    chartTitle: 'Volume handled by AI agents',
    chartSubtitle: 'Monthly executions · Turismo, Universal & other cases',
    chartLegendShortWorkflows: 'Workflows',
    chartLegendShortAutomations: 'Automations',
  },
  workflow: {
    headerLabel: 'AI Workflow',
    badgeLive: 'Live',
    addNode: 'Add a tool',
    addNodeAria: 'Add a node',
    statusConnected: 'Connected',
    nodes: [
      { title: 'WhatsApp', desc: 'Message received from a contact' },
      { title: 'Notion', desc: 'Create a customer record' },
      { title: 'n8n Logic', desc: 'Filter by priority' },
      { title: 'Slack', desc: 'Notify the team' },
      { title: 'Figma', desc: 'Generate a design brief' },
      { title: 'CRM', desc: 'Update the pipeline' },
      { title: 'Email', desc: 'Send an automatic follow-up' },
      { title: 'Zapier / Make', desc: 'Trigger a scenario' },
    ],
  },
  chat: {
    teaser: 'Hi there. A question about Lucid-Lab? I\u2019m here to help.',
    title: 'Lucid',
    subtitle: 'Lucid-Lab Assistant',
    open: 'Open chat',
    close: 'Close chat',
    closeAria: 'Close',
    poweredBy: 'Powered by Lucid-Lab · ',
    legalLink: 'Legal notice',
    inputPlaceholder: 'Your message…',
    inputAria: 'Message',
    sendAria: 'Send',
    bookingCta: '30 min · Discovery call',
  },
  privacy: {
    title: 'Privacy policy',
    description:
      'Privacy policy of Lucid-Lab — how we handle your personal data.',
    h1: 'Privacy policy',
    updated: 'Last updated: April 2026',
  },
  legal: {
    title: 'Legal notice',
    description: 'Legal notice of Lucid-Lab',
    h1: 'Legal notice',
  },
  blog: {
    indexTitle: 'Blog — Automation, AI & systems for SMEs',
    indexDescription:
      "Real cases, real costs, measured ROI. Everything we learn building systems for French and Belgian SMEs. Zero PowerPoint.",
    indexHero: {
      eyebrow: 'Lucid-Lab Blog',
      title: 'What we learn by building.',
      subtitle:
        "Real cases, real costs, measured ROI. We document what we do for French and Belgian SMEs. Zero PowerPoint.",
    },
    pillarTag: '· Pillar guide',
    minRead: 'min read',
    minShort: 'min',
    backToBlog: '← Back to blog',
    backToAll: '← All articles',
    eyebrowCategory: 'Category',
    emptyAll: 'First articles being written.',
    emptyCategory: 'Articles coming soon.',
    relatedTitle: 'Related articles',
    newsletterTitle: 'One article per month, nothing else.',
    auditCta: {
      stickyTitle: 'Audit Flash',
      stickySubtitle: '30 min to know if it\u2019s feasible',
      inlineHook: 'Stuck on',
      inlineGenericTopic: 'this topic',
      inlineDesc: "In 30 minutes, we identify what's feasible and how much it costs. Zero PowerPoint.",
      inlineButton: 'Book the Audit Flash →',
      blockTitle: "Audit Flash: 30 minutes to know if it's feasible.",
      bullet1: 'We qualify your need',
      bullet2: 'You leave with a clear estimate (feasibility, cost, timeline).',
      bullet3: 'No slides, no heavy sales follow-up.',
      blockButton: 'Book the free Audit Flash',
      tagline: 'Anthony, CEO — France & Belgium',
    },
    readingMeta: 'Updated on',
    byline: 'Anthony · CEO Lucid-Lab',
    dismissCta: 'Close prompt',
  },
  categories: {
    automatisation: {
      title: 'Automation',
      description:
        'Map, simplify, automate. How to move from operational chaos to reliable processes.',
    },
    'ia-pme': {
      title: 'AI for SMEs',
      description:
        'Real-world AI cases in SMEs: ROI, integration, costs. No hype.',
    },
    'outils-internes': {
      title: 'Internal tools',
      description: 'Build custom tools that are faster, cheaper, and better suited.',
    },
    methode: {
      title: 'How it works',
      description:
        'How we work: Audit Flash, Execution Roadmap, Build & Run.',
    },
  },
  metaSite: {
    siteTitle: 'Lucid-Lab',
    titleTemplate: '%s | Lucid-Lab',
    siteDescription:
      "Lucid-Lab is the Full-Stack Transformation Engine that takes your operational chaos and delivers autonomous systems in production. Operational Strategy, Software Dev and AI Engineering for startups, SMEs and industrial enterprises. We don't advise — we build.",
    ogTitle: "Lucid-Lab — We don't advise. We build.",
    ogDescription:
      "Full-Stack Transformation Engine. We take your operational chaos, map it, and deliver autonomous systems in production. Free 30-min Audit Flash.",
    twitterTitle: "Lucid-Lab — We don't advise. We build.",
    twitterDescription:
      'Full-Stack Transformation Engine. Strategy, Software & AI Engineering. From operational chaos to autonomous systems in production.',
    ogLocale: 'en_US',
  },
};
