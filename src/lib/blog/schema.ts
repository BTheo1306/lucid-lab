import type { Post } from "./types";
import { postUrl } from "./metadata";
import { CATEGORIES } from "./types";
import { BLOG_AUTHORS } from "./authors";

const SITE_URL = "https://lucid-lab.fr";
const ORG_ID = `${SITE_URL}/#organization`;

export function articleSchema(post: Post) {
  const { frontmatter, slug } = post;
  const author = BLOG_AUTHORS[frontmatter.author];
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: frontmatter.title,
    description: frontmatter.description,
    image: frontmatter.ogImage
      ? [`${SITE_URL}${frontmatter.ogImage}`]
      : [`${SITE_URL}/blog/${slug}/opengraph-image`],
    datePublished: frontmatter.publishedAt,
    dateModified: frontmatter.updatedAt ?? frontmatter.publishedAt,
    author: {
      "@type": "Person",
      name: author.fullName,
      jobTitle: `${author.jobTitle}, Lucid-Lab`,
      url: SITE_URL,
      sameAs: [author.linkedin],
    },
    publisher: { "@id": ORG_ID },
    mainEntityOfPage: { "@type": "WebPage", "@id": postUrl(slug) },
    // Derive from the post: hardcoding fr-FR declared the English articles as
    // French to search engines and AI crawlers.
    inLanguage: frontmatter.locale === "en" ? "en-US" : "fr-FR",
    keywords: frontmatter.tags?.join(", "),
  };
}

// Blog index: a Blog node listing every post, plus its breadcrumb trail.
// Used by /blog and /en/blog so the editorial corpus is machine-readable by
// search engines and AI crawlers instead of existing only as HTML.
export function blogIndexSchema(posts: Post[], lang: "fr" | "en" = "fr") {
  const isEn = lang === "en";
  const base = isEn ? `${SITE_URL}/en` : SITE_URL;
  const blogUrl = `${base}/blog`;

  return [
    {
      "@context": "https://schema.org",
      "@type": "Blog",
      "@id": `${blogUrl}#blog`,
      url: blogUrl,
      name: isEn ? "Lucid-Lab Blog" : "Blog Lucid-Lab",
      description: isEn
        ? "Real cases, real costs, measured ROI. We document what we learn while building systems for French and Belgian SMEs."
        : "Cas concrets, coûts réels, ROI mesurés. On documente ce qu'on apprend en construisant des systèmes pour des PME françaises et belges.",
      inLanguage: isEn ? "en-US" : "fr-FR",
      publisher: { "@id": ORG_ID },
      blogPost: posts.map((p) => ({
        "@type": "BlogPosting",
        headline: p.frontmatter.title,
        description: p.frontmatter.description,
        url: `${blogUrl}/${p.slug}`,
        datePublished: p.frontmatter.publishedAt,
        dateModified: p.frontmatter.updatedAt ?? p.frontmatter.publishedAt,
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: isEn ? "Home" : "Accueil",
          item: base,
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "Blog",
          item: blogUrl,
        },
      ],
    },
  ];
}

export function breadcrumbSchema(post: Post) {
  const cat = CATEGORIES[post.frontmatter.category];
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Accueil",
        item: SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: `${SITE_URL}/blog`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: cat.title,
        item: `${SITE_URL}/blog/categorie/${cat.slug}`,
      },
      {
        "@type": "ListItem",
        position: 4,
        name: post.frontmatter.title,
        item: postUrl(post.slug),
      },
    ],
  };
}
