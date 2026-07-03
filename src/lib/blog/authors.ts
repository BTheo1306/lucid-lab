/**
 * Blog post authors: the Lucid-Lab team roster and expertise-based picking.
 *
 * Full names/titles/photos mirror `src/lib/seo/schema.ts` TEAM. Kept as pure
 * data + pure functions (no 'server-only') so this is importable from the
 * opengraph-image route and other client-safe code.
 */

export type BlogAuthorSlug = "theo" | "anthony" | "jules";

export interface BlogAuthor {
  slug: BlogAuthorSlug;
  firstName: string;
  fullName: string;
  jobTitle: "CTO" | "CEO" | "COO";
  photo: string;
  linkedin: string;
}

export const BLOG_AUTHORS: Record<BlogAuthorSlug, BlogAuthor> = {
  theo: {
    slug: "theo",
    firstName: "Théo",
    fullName: "Théo Benard",
    jobTitle: "CTO",
    photo: "/team/theo.png",
    linkedin: "https://www.linkedin.com/in/th%C3%A9o-b%C3%A9nard/",
  },
  jules: {
    slug: "jules",
    firstName: "Jules",
    fullName: "Jules Gouron",
    jobTitle: "COO",
    photo: "/team/jules.png",
    linkedin: "https://www.linkedin.com/in/jules-gouron-455b58300/",
  },
  anthony: {
    slug: "anthony",
    firstName: "Anthony",
    fullName: "Anthony Poirier",
    jobTitle: "CEO",
    photo: "/team/anthony.png",
    linkedin: "https://www.linkedin.com/in/anthonypoire/",
  },
};

const FALLBACK_ORDER: BlogAuthorSlug[] = ["jules", "anthony", "theo"];

const GOUVERNANCE_RE = /gouvernance|readiness|process|opérat|operat|méthod|method/;
const MARCHE_RE = /vente|commercial|marché|marche|adoption|dirigeant|opinion|budget|coût|cout|roi/;
const TECH_RE = /agent|outil|stack|tech|data|poc|build|intégr|integr|llm|ia génér|automat/;

/**
 * Deterministic expertise mapping: category first, then a keyword scan over
 * title + tags, then a stable per-post fallback so legacy/uncategorized posts
 * still get varied (but consistent) authorship.
 */
export function pickAuthor(input: {
  category?: string | null;
  tags?: string[];
  slug?: string | null;
  title?: string | null;
}): BlogAuthorSlug {
  if (input.category === "outils-internes") return "theo";
  if (input.category === "automatisation") return "jules";
  if (input.category === "ia-pme") return "anthony";

  // 'methode' or null: scan title + tags for expertise keywords.
  const haystack = `${input.title ?? ""} ${(input.tags ?? []).join(" ")}`.toLowerCase();
  if (GOUVERNANCE_RE.test(haystack)) return "jules";
  if (MARCHE_RE.test(haystack)) return "anthony";
  if (TECH_RE.test(haystack)) return "theo";

  // Stable fallback: varies per post but never changes for the same post.
  const seed = input.slug ?? input.title ?? "";
  let sum = 0;
  for (let i = 0; i < seed.length; i += 1) sum += seed.charCodeAt(i);
  return FALLBACK_ORDER[sum % FALLBACK_ORDER.length];
}

/** Resolves an explicit author slug, or falls back to expertise-based picking. */
export function resolveAuthor(
  slug: string | null | undefined,
  fallbackInput: Parameters<typeof pickAuthor>[0],
): BlogAuthor {
  if (slug && slug in BLOG_AUTHORS) return BLOG_AUTHORS[slug as BlogAuthorSlug];
  return BLOG_AUTHORS[pickAuthor(fallbackInput)];
}
