import type { Metadata } from "next";
import { Figtree } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AdminAwareChatWidget } from "@/components/chat-widget/AdminAwareChatWidget";
import "./globals.css";

const fontSans = Figtree({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});


export function generateMetadata(): Metadata {
  const isEn = false;

  const description = isEn
    ? "Lucid-Lab audits workflows, ranks AI opportunities and builds business AI systems in production: agents, internal tools, automations, integrations, monitoring and documentation."
    : "Lucid-Lab audite vos workflows, priorise les opportunités IA et construit des systèmes métier en production : agents, outils internes, automatisations, intégrations, monitoring et documentation.";

  const ogTitle = isEn
    ? "Lucid-Lab: business AI systems in production"
    : "Lucid-Lab : systèmes IA métier en production";

  const ogDescription = isEn
    ? "We ship agents, internal tools, automations, integrations, monitoring and documentation that run in production."
    : "On livre des agents, outils internes, automatisations, intégrations, monitoring et documentation qui tournent en production.";

  const twitterDescription = isEn
    ? "Agents, internal tools, automations and monitoring that run in production and stay with the client."
    : "Agents, outils internes, automatisations et monitoring qui tournent en production et restent au client.";

  const canonical = isEn ? "https://lucid-lab.fr/en" : "https://lucid-lab.fr";

  return {
    title: {
      default: isEn
        ? "Lucid-Lab: business AI systems in production"
        : "Lucid-Lab : systèmes IA métier en production",
      template: "%s | Lucid-Lab",
    },
    description,
    metadataBase: new URL("https://lucid-lab.fr"),
    verification: {
      google: "SjhOjbbRpjhrmHAaolDpyzdDc_WaT_pLRU9jH1ExWtU",
    },
    keywords: isEn
      ? [
          "AI systems builder",
          "production AI agents",
          "internal AI tools",
          "AI automation",
          "AI Audit Flash",
          "AI engineering",
          "AI monitoring",
          "enterprise process automation",
          "AI SME",
          "n8n workflows",
          "custom AI integrations",
          "AI deployment to production",
          "AI governance",
          "Lucid-Lab",
          "AI builder Paris",
          "France",
        ]
      : [
          "builder systèmes IA",
          "agents IA en production",
          "outils internes IA",
          "automatisation IA",
          "Audit Flash IA",
          "IA engineering",
          "monitoring IA",
          "automatisation processus PME",
          "IA PME",
          "workflows n8n",
          "intégrations IA sur mesure",
          "déploiement IA production",
          "gouvernance IA",
          "Lucid-Lab",
          "builder IA Paris",
          "France",
        ],
    authors: [{ name: "Lucid-Lab", url: "https://lucid-lab.fr" }],
    creator: "Lucid-Lab",
    publisher: "Lucid-Lab",
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    openGraph: {
      type: "website",
      locale: isEn ? "en_US" : "fr_FR",
      url: canonical,
      siteName: "Lucid-Lab",
      title: ogTitle,
      description: ogDescription,
      images: [
        {
          url: "/opengraph-image",
          width: 1200,
          height: 630,
          alt: ogTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: ogTitle,
      description: twitterDescription,
      images: ["/opengraph-image"],
    },
    alternates: {
      canonical,
      languages: {
        'fr-FR': 'https://lucid-lab.fr',
        'en-US': 'https://lucid-lab.fr/en',
        'x-default': 'https://lucid-lab.fr',
      },
    },
    category: "technology",
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${fontSans.variable} antialiased`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        {/* DNS prefetch for logo CDN (non-critical, below the fold) */}
        <link rel="dns-prefetch" href="https://storage.efferd.com" />
      </head>
      <body className="min-h-[100dvh] flex flex-col">
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@graph": [
                {
                  "@type": "Organization",
                  "@id": "https://lucid-lab.fr/#organization",
                  name: "Lucid-Lab",
                  alternateName: "Lucid-Lab — Systèmes IA construits, déployés, opérés",
                  url: "https://lucid-lab.fr",
                  logo: "https://lucid-lab.fr/logo-full.png",
                  description:
                    "Lucid-Lab construit, déploie et opère des systèmes IA en production : agents, outils internes, automatisations, intégrations, monitoring et documentation.",
                  knowsAbout: [
                    "Agents IA en production",
                    "Outils internes IA",
                    "Automatisations métier",
                    "Intégrations CRM, ERP et data",
                    "Monitoring IA",
                    "Workflows n8n",
                    "Agents IA OpenAI / Claude",
                    "Mistral et modèles souverains",
                    "Gouvernance IA, RGPD et EU AI Act",
                  ],
                  foundingDate: "2024",
                  contactPoint: {
                    "@type": "ContactPoint",
                    email: "info@lucid-lab.fr",
                    contactType: "customer service",
                    availableLanguage: ["French", "English"],
                  },
                  sameAs: ["https://linkedin.com/company/lucid-lab"],
                },
                {
                  "@type": "WebSite",
                  "@id": "https://lucid-lab.fr/#website",
                  url: "https://lucid-lab.fr",
                  name: "Lucid-Lab",
                  publisher: { "@id": "https://lucid-lab.fr/#organization" },
                  inLanguage: "fr-FR",
                },
                {
                  "@type": "ProfessionalService",
                  "@id": "https://lucid-lab.fr/#business",
                  name: "Lucid-Lab",
                  url: "https://lucid-lab.fr",
                  image: "https://lucid-lab.fr/logo-full.png",
                  description:
                    "Lucid-Lab livre des agents, outils internes et automatisations qui tournent en production, avec monitoring, documentation, transfert de propriété et adoption des équipes.",
                  address: {
                    "@type": "PostalAddress",
                    addressLocality: "Paris",
                    addressCountry: "FR",
                  },
                  areaServed: {
                    "@type": "Country",
                    name: "France",
                  },
                  serviceType: [
                    "Audit Flash",
                    "Agents IA et outils internes",
                    "Automatisations métier",
                    "Déploiement workflows n8n et APIs",
                    "Data & SI readiness",
                    "Monitoring IA",
                    "Documentation et runbooks",
                    "Gouvernance IA, RGPD et EU AI Act",
                  ],
                  hasOfferCatalog: {
                    "@type": "OfferCatalog",
                    name: "Entrées Lucid-Lab",
                    itemListElement: [
                      {
                        "@type": "Offer",
                        name: "Audit Flash",
                        description: "Appel de 30 minutes gratuit pour qualifier un besoin et identifier le premier système utile à construire.",
                        price: "0",
                        priceCurrency: "EUR",
                      },
                      {
                        "@type": "Offer",
                        name: "Agents IA & outils internes",
                        description: "Construction d'agents, dashboards, workflows, connecteurs et interfaces internes en production.",
                      },
                      {
                        "@type": "Offer",
                        name: "Build & Run",
                        description: "Déploiement, monitoring, runbooks, documentation et opération dans la durée.",
                      },
                      {
                        "@type": "Offer",
                        name: "Data & SI readiness",
                        description: "Sources, accès, risques, hébergement EU et architecture cible avant build.",
                      },
                    ],
                  },
                },
              ],
            }),
          }}
        />
        {/* Full-page vertical grid lines — spans the entire scroll height */}
        <div className="pointer-events-none fixed inset-0 z-[5] hidden md:block" aria-hidden="true">
          <div className="mx-auto h-full max-w-[1264px] border-x border-[#e5e5e5]" />
        </div>
        {children}
        <AdminAwareChatWidget lang="fr" />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
