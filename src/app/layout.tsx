import type { Metadata } from "next";
import { Inter, Syne } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { AdminAwareChatWidget } from "@/components/chat-widget/AdminAwareChatWidget";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["700", "800"],
  display: "swap",
});

export function generateMetadata(): Metadata {
  const isEn = false;

  const description = isEn
    ? "Lucid-Lab is the Full-Stack Transformation Engine that turns your operational chaos into autonomous systems running in production. Operational Strategy, Software Dev and AI Engineering for startups, SMEs and enterprise organizations. We don't advise. We build."
    : "On conçoit et livre vos systèmes IA en production : lead gen automatisée, agents conversationnels, dashboards métier et plus. Diagnostic gratuit en 30 min.";

  const ogTitle = isEn
    ? "Lucid-Lab — We don't advise. We build."
    : "Lucid-Lab — Agence IA sur-mesure : Agents, Automatisations & Web";

  const ogDescription = isEn
    ? "Full-Stack Transformation Engine. We take your operational chaos, map it, and ship autonomous systems to production. Free 30-min Audit Flash."
    : "On conçoit et livre vos systèmes IA en production : lead gen automatisée, agents conversationnels, dashboards métier et plus. Diagnostic gratuit en 30 min.";

  const twitterDescription = isEn
    ? "Full-Stack Transformation Engine. Strategy, Software & AI Engineering. From operational chaos to autonomous systems in production."
    : "Agence IA sur-mesure pour PMEs et ETIs. Agents IA, automatisations métier, apps web — livrés en production en 4 à 8 semaines.";

  const canonical = isEn ? "https://lucid-lab.fr/en" : "https://lucid-lab.fr";

  return {
    title: {
      default: isEn
        ? "Lucid-Lab — AI Agency & Full-Stack Transformation Engine"
        : "Lucid-Lab — Agence IA sur-mesure : Agents, Automatisations & Web",
      template: "%s | Lucid-Lab",
    },
    description,
    metadataBase: new URL("https://lucid-lab.fr"),
    verification: {
      google: "SjhOjbbRpjhrmHAaolDpyzdDc_WaT_pLRU9jH1ExWtU",
    },
    keywords: isEn
      ? [
          "Operational Strategists",
          "Full-Stack Transformation Engine",
          "Process Mapping",
          "Systemic Automation",
          "Scalability Framework",
          "Execution Roadmap",
          "AI Audit Flash",
          "AI Engineering",
          "autonomous AI agents",
          "autonomous Lead Gen",
          "enterprise process automation",
          "AI Roadmap SME",
          "n8n workflows",
          "custom OpenAI",
          "operational transformation",
          "AI deployment to production",
          "AI tenders",
          "AI governance",
          "Lucid-Lab",
          "AI agency Paris",
          "France",
        ]
      : [
          "Operational Strategists",
          "Full-Stack Transformation Engine",
          "Process Mapping",
          "Systemic Automation",
          "Scalability Framework",
          "Roadmap d'Exécution",
          "Audit Flash IA",
          "IA Engineering",
          "agents IA autonomes",
          "Lead Gen autonome",
          "automatisation processus paquebot industriel",
          "IA Roadmap PME",
          "workflows n8n",
          "OpenAI sur-mesure",
          "transformation opérationnelle",
          "déploiement IA production",
          "appels d'offres IA",
          "gouvernance IA",
          "Lucid-Lab",
          "agence IA Paris",
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

const metadataPlaceholder: Metadata = {
  title: {
    default: "Lucid-Lab",
    template: "%s | Lucid-Lab",
  },
  description:
    "On conçoit et livre vos systèmes IA en production : lead gen automatisée, agents conversationnels, dashboards métier et plus. Diagnostic gratuit en 30 min.",
  metadataBase: new URL("https://lucid-lab.fr"),
  keywords: [
    "Operational Strategists",
    "Full-Stack Transformation Engine",
    "Process Mapping",
    "Systemic Automation",
    "Scalability Framework",
    "Roadmap d'Exécution",
    "Audit Flash IA",
    "IA Engineering",
    "agents IA autonomes",
    "Lead Gen autonome",
    "automatisation processus paquebot industriel",
    "IA Roadmap PME",
    "workflows n8n",
    "OpenAI sur-mesure",
    "transformation opérationnelle",
    "déploiement IA production",
    "appels d'offres IA",
    "gouvernance IA",
    "Lucid-Lab",
    "agence IA Paris",
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
    locale: "fr_FR",
    url: "https://lucid-lab.fr",
    siteName: "Lucid-Lab",
    title: "Lucid-Lab — On ne conseille pas. On construit.",
    description:
      "Full-Stack Transformation Engine. On prend votre chaos opérationnel, on le map, on livre des systèmes autonomes en production. Audit Flash gratuit en 30 min.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Lucid-Lab — On ne conseille pas. On construit.",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Lucid-Lab — On ne conseille pas. On construit.",
    description:
      "Full-Stack Transformation Engine. Stratégie, Software & IA Engineering. Du chaos opérationnel à des systèmes autonomes en production.",
    images: ["/opengraph-image"],
  },
  alternates: {
    canonical: "https://lucid-lab.fr",
  },
  category: "technology",
};
void metadataPlaceholder;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${syne.variable} antialiased`}
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
                  alternateName: "Lucid-Lab — Full-Stack Transformation Engine",
                  url: "https://lucid-lab.fr",
                  logo: "https://lucid-lab.fr/logo-full.png",
                  description:
                    "Lucid-Lab est une Full-Stack Transformation Engine spécialisée en Enterprise Transformation et IA Engineering. Operational Strategists qui livrent des systèmes autonomes en production via Process Mapping, Systemic Automation et Scalability Framework.",
                  knowsAbout: [
                    "Process Mapping",
                    "Systemic Automation",
                    "Scalability Framework",
                    "IA Engineering",
                    "Software Development",
                    "Enterprise Transformation",
                    "Lead Generation autonome",
                    "Monitoring data temps réel",
                    "Workflows n8n",
                    "Agents IA OpenAI / Claude",
                    "Gouvernance IA & RGPD",
                    "Réponse à appels d'offres IA",
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
                    "Full-Stack Transformation Engine. Lucid-Lab résout vos goulots d'étranglement opérationnels via une architecture combinant Stratégie Opérationnelle, Software Dev et IA Engineering pour garantir des résultats mesurables en production.",
                  address: {
                    "@type": "PostalAddress",
                    addressLocality: "Paris",
                    addressCountry: "FR",
                  },
                  areaServed: {
                    "@type": "Country",
                    name: "France",
                  },
                  priceRange: "€€",
                  serviceType: [
                    "Audit Flash & Roadmap d'Exécution",
                    "Process Mapping & Stratégie Opérationnelle",
                    "Software Development sur-mesure",
                    "IA Engineering & agents autonomes",
                    "Déploiement workflows n8n + OpenAI / Claude",
                    "Lead Generation autonome (cas Universal, LinkedIn Bot)",
                    "Full Scaling opérationnel (cas Turismo)",
                    "Monitoring data temps réel (cas Périscope)",
                    "Accompagnement au changement & gouvernance IA",
                    "Réponse à appels d'offres grands comptes",
                  ],
                  hasOfferCatalog: {
                    "@type": "OfferCatalog",
                    name: "L'Offre Escalier Lucid-Lab",
                    itemListElement: [
                      {
                        "@type": "Offer",
                        name: "Audit Flash",
                        description: "Appel de 30 minutes gratuit pour qualifier votre goulot d'étranglement et chiffrer l'opportunité.",
                        price: "0",
                        priceCurrency: "EUR",
                      },
                      {
                        "@type": "Offer",
                        name: "Roadmap d'Exécution",
                        description: "Process Mapping complet, architecture cible et blueprint actionnable prêt à builder.",
                      },
                      {
                        "@type": "Offer",
                        name: "Build & Run",
                        description: "Construction et déploiement en production des systèmes autonomes (agents IA, workflows, APIs, scrapers).",
                      },
                      {
                        "@type": "Offer",
                        name: "Accompagnement au changement",
                        description: "Scaling continu, formation des équipes, gouvernance IA et support sur appels d'offres.",
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
