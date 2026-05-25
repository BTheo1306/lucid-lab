import type { fr } from './fr';

// Mirror of fr.ts with English translations.
// Structural shape of fr lets EN values differ.

export const en: typeof fr = {
  header: {
    nav: {
      expertise: 'Expertise',
      offers: 'Offers',
      delivery: 'Method',
      cases: 'Client cases',
      team: 'Team',
      blog: 'Blog',
      contact: 'Contact',
    },
    cta: 'AI audit',
    backToHome: '← Back',
    languageLabel: 'Language',
    switchToEnglish: 'English',
    switchToFrench: 'Français',
  },
  hero: {
    titleLine1: 'AI opportunities.',
    titleLine2: 'Reliable business systems.',
    subtitle:
      'Lucid-Lab audits your workflows, checks your data, ranks AI use cases, then builds the agents, internal tools and integrations that run in production.',
    subtitleLine2: 'Audit. Roadmap. Build. Run. Documentation.',
    ctaPrimary: 'Book an AI audit',
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
    label: 'FAQ',
    headline: 'Questions leaders ask',
    subtitle: 'Questions that come up before an AI audit or business build.',
    items: [
      {
        q: 'Lucid-Lab joins the project at which stage?',
        a: 'Lucid-Lab joins from framing. We help leaders choose the right build, then we build the system, deploy it and prepare the handover.',
      },
      {
        q: 'An AI Opportunity Audit contains which deliverables?',
        a: 'The audit covers workflows, business irritants, data sources, tools, risks, expected gains and prioritization. The deliverable lists builds to launch, builds to postpone and prerequisites to solve.',
      },
      {
        q: 'The client keeps which assets after delivery?',
        a: 'The client keeps the code, workflows, access, runbooks, user documentation and monitoring dashboards included in the scope.',
      },
      {
        q: 'Sensitive data can stay in Europe?',
        a: 'Yes. We can frame EU hosting, suitable models, permissions, logs and access rules according to the sensitivity of the use case.',
      },
    ],
  },
  team: {
    label: 'The team',
    headlineLine1: 'Business architects.',
    headlineLine2: 'AI builders.',
    subtitle:
      'You speak with the people who frame, architect and build your systems. Context stays inside the delivery team.',
    cta: 'Book an AI audit',
    ctaSub: '30 min · free · no commitment',
    members: [
      { name: 'Anthony POIRIER', role: 'CEO · Co-founder' },
      { name: 'Théo BENARD', role: 'CTO · Co-founder' },
      { name: 'Jules GOURON', role: 'COO · Co-founder' },
    ],
  },
  blueCta: {
    headlineLine1: 'One clear first build.',
    headlineLine2: 'A system that reaches production.',
    subtitle:
      '30 minutes to read your context, qualify the workflow and decide whether an AI audit deserves a launch.',
    cta: 'Book an AI audit',
  },
  footer: {
    description: 'Business AI systems for SMEs, services firms and operations leaders.',
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
      { label: 'Terms', href: '/en/terms' },
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
      'Lucid-Lab privacy policy: personal data processing.',
    h1: 'Privacy policy',
    updated: 'Last updated: April 2026',
  },
  legal: {
    title: 'Legal notice',
    description: 'Legal notice of Lucid-Lab',
    h1: 'Legal notice',
  },
  blog: {
    indexTitle: 'Blog: automation, AI and systems for SMEs',
    indexDescription:
      'Real cases, real costs, measured ROI. We document what we learn building systems for French and Belgian SMEs.',
    indexHero: {
      eyebrow: 'Lucid-Lab Blog',
      title: 'Lessons from shipped systems.',
      subtitle:
        'Real cases, real costs, measured ROI. We document what we do for French and Belgian SMEs.',
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
      inlineDesc: 'In 30 minutes, we identify feasibility, cost and the prerequisite blocking the build.',
      inlineButton: 'Book an AI audit →',
      blockTitle: "Audit Flash: 30 minutes to know if it's feasible.",
      bullet1: 'We qualify your need',
      bullet2: 'You leave with a clear estimate (feasibility, cost, timeline).',
      bullet3: 'No slides, no heavy sales follow-up.',
      blockButton: 'Book the free Audit Flash',
      tagline: 'Anthony, CEO, France & Belgium',
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
      'Lucid-Lab audits workflows, ranks AI opportunities and builds business systems in production for SMEs, services firms and operations leaders.',
    ogTitle: 'Lucid-Lab: business AI systems in production',
    ogDescription:
      'Workflow audit, AI roadmap, internal tools, agents, integrations, monitoring and documentation.',
    twitterTitle: 'Lucid-Lab: business AI systems in production',
    twitterDescription:
      'AI audit, roadmap, build, run, monitoring and documentation for business systems in production.',
    ogLocale: 'en_US',
  },
};
