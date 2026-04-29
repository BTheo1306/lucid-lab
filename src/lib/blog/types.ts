/**
 * Blog post types — shared between MDX loader, page components, and metadata generators.
 *
 * Posts live as `.mdx` files in `content/posts/` with YAML frontmatter at the top.
 * See `content/posts/_template.mdx` for the canonical shape.
 */

export type PostCategory =
  | "automatisation"
  | "ia-pme"
  | "outils-internes"
  | "methode";

export type PostLocale = "fr" | "en";

export type FunnelStage = "TOFU" | "MOFU" | "BOFU";

export interface PostFrontmatter {
  /** SEO title — used in <title> + OG. Keep ≤ 60 chars. */
  title: string;
  /** SEO meta description. 150-160 chars. */
  description: string;
  /** ISO date the post was first published. */
  publishedAt: string;
  /** ISO date the post was last meaningfully updated. */
  updatedAt?: string;
  /** Category slug — must match `PostCategory`. */
  category: PostCategory;
  /** Optional list of free-form tags. */
  tags?: string[];
  /** TOFU / MOFU / BOFU — drives CTA hook + internal tracking. */
  funnelStage?: FunnelStage;
  /** Marks pillar pages so the index can feature them. */
  isPillar?: boolean;
  /** Cornerstone backlink-bait piece. */
  isCornerstone?: boolean;
  /** Hero image URL (relative to /public or absolute). */
  heroImage?: string;
  /** Alt text for the hero image. */
  heroImageAlt?: string;
  /** Optional override of the OG image. Defaults to dynamic per-post OG. */
  ogImage?: string;
  /** Set to true to keep the post out of the index/sitemap (still builds). */
  draft?: boolean;
  /** Locale of the post. Defaults to 'fr'. */
  locale?: PostLocale;
}

export interface Post {
  slug: string;
  frontmatter: PostFrontmatter;
  content: string;
  readingTimeMinutes: number;
}

export interface CategoryMeta {
  slug: PostCategory;
  title: string;
  description: string;
  /** English title for /en/blog. */
  titleEn?: string;
  /** English description for /en/blog. */
  descriptionEn?: string;
}

export const CATEGORIES: Record<PostCategory, CategoryMeta> = {
  automatisation: {
    slug: "automatisation",
    title: "Automatisation",
    description:
      "Automatiser vos processus métier sans détruire ce qui fonctionne. Cas concrets, coûts, ROI.",
    titleEn: "Automation",
    descriptionEn:
      "Automating your business processes without breaking what works. Real cases, costs, ROI.",
  },
  "ia-pme": {
    slug: "ia-pme",
    title: "IA pour PME",
    description:
      "Implémenter l'IA dans une PME française ou belge — agents, RAG, sécurité, RGPD.",
    titleEn: "AI for SMEs",
    descriptionEn:
      "Implementing AI in a French or Belgian SME — agents, RAG, security, GDPR.",
  },
  "outils-internes": {
    slug: "outils-internes",
    title: "Outils internes",
    description:
      "Quand développer un outil interne, dashboard ou logiciel sur-mesure plutôt qu'un SaaS.",
    titleEn: "Internal tools",
    descriptionEn:
      "When to build an internal tool, dashboard or custom software instead of buying SaaS.",
  },
  methode: {
    slug: "methode",
    title: "Méthode",
    description:
      "Diagnose → Map → Build → Automate. Comment Lucid-Lab livre, sans PowerPoint.",
    titleEn: "Method",
    descriptionEn:
      "Diagnose → Map → Build → Automate. How Lucid-Lab ships, without PowerPoint.",
  },
};
