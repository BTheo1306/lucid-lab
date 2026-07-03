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
    inLanguage: "fr-FR",
    keywords: frontmatter.tags?.join(", "),
  };
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
