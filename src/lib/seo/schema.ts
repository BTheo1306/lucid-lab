// Site-wide JSON-LD helpers and entity constants.
// Blog-specific schema lives in src/lib/blog/schema.ts and reuses the same Organization @id.

const SITE_URL = "https://lucid-lab.fr"
const ORG_ID = `${SITE_URL}/#organization`

export const LINKEDIN_URL = "https://www.linkedin.com/company/lucid-lab-fr/"

// Profiles that genuinely exist and resolve. Add new profiles here as they are created
// (Crunchbase, Sortlist, YouTube, etc.) so every schema block stays consistent.
export const SAME_AS: string[] = [LINKEDIN_URL]

export const FOUNDERS = [
  { name: "Anthony Poirier", jobTitle: "CEO" },
  { name: "Théo Benard", jobTitle: "CTO" },
  { name: "Jules Gouron", jobTitle: "COO" },
] as const

export function founderNodes() {
  return FOUNDERS.map((f) => ({
    "@type": "Person",
    name: f.name,
    jobTitle: f.jobTitle,
  }))
}

type Lang = "fr" | "en"

const localeTag = (lang: Lang) => (lang === "en" ? "en-US" : "fr-FR")

export function faqPageSchema(
  items: ReadonlyArray<{ question: string; answer: string }>,
  lang: Lang,
) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    inLanguage: localeTag(lang),
    mainEntity: items.map((it) => ({
      "@type": "Question",
      name: it.question,
      acceptedAnswer: { "@type": "Answer", text: it.answer },
    })),
  }
}

export function breadcrumbSchema(
  crumbs: ReadonlyArray<{ name: string; item: string }>,
) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.name,
      item: c.item,
    })),
  }
}

export function serviceSchema(input: {
  name: string
  description: string
  url: string
  lang: Lang
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Service",
    name: input.name,
    description: input.description,
    url: input.url,
    inLanguage: localeTag(input.lang),
    serviceType: "AI systems, agents and automation",
    provider: { "@id": ORG_ID },
    areaServed: { "@type": "Country", name: "France" },
  }
}

// Builds canonical + hreflang alternates for a page that exists in both locales.
// Next.js merges metadata shallowly, so a page that sets `alternates` must include
// `languages` itself or it loses the layout-level hreflang.
export function pageAlternates(frPath: string, enPath: string, current: Lang) {
  const fr = `${SITE_URL}${frPath}`
  const en = `${SITE_URL}${enPath}`
  return {
    canonical: current === "en" ? en : fr,
    languages: {
      "fr-FR": fr,
      "en-US": en,
      "x-default": fr,
    },
  }
}

// Serialize JSON-LD for dangerouslySetInnerHTML, escaping `<` to prevent XSS
// (per the Next.js JSON-LD guide).
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c")
}
