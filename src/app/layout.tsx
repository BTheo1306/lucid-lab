import type { Metadata } from "next";
import { Inter, Syne } from "next/font/google";
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

export const metadata: Metadata = {
  title: {
    default: "Lucid-Lab",
    template: "%s | Lucid-Lab",
  },
  description:
    "Lucid-Lab est la Full-Stack Transformation Engine qui prend votre chaos opérationnel et livre des systèmes autonomes en production. Stratégie Opérationnelle, Software Dev et IA Engineering pour startups, PMEs et paquebots industriels. On ne conseille pas, on construit.",
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${inter.variable} ${syne.variable} antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/* DNS + TLS handshake with Spline CDN before any JS runs */}
        <link rel="preconnect" href="https://prod.spline.design" />
        {/* DNS prefetch for logo CDN (non-critical, below the fold) */}
        <link rel="dns-prefetch" href="https://storage.efferd.com" />
        {/* Preload Spline 3D scene — starts download before React hydration */}
        <link
          rel="preload"
          href="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
          as="fetch"
          crossOrigin="anonymous"
        />
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
                    availableLanguage: ["French"],
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
      </body>
    </html>
  );
}
