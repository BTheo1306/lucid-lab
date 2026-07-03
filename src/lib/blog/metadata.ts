import type { Metadata } from "next";

import { BLOG_AUTHORS } from "./authors";
import type { Post } from "./types";

const SITE_URL = "https://lucid-lab.fr";

export function postUrl(slug: string, locale?: string): string {
  return locale === "en"
    ? `${SITE_URL}/en/blog/${slug}`
    : `${SITE_URL}/blog/${slug}`;
}

export function generatePostMetadata(post: Post): Metadata {
  const { frontmatter, slug } = post;
  const locale = frontmatter.locale ?? "fr";
  const isEn = locale === "en";
  const urlBase = isEn ? `${SITE_URL}/en/blog` : `${SITE_URL}/blog`;
  const url = `${urlBase}/${slug}`;
  const ogImage = frontmatter.ogImage ?? `${url}/opengraph-image`;
  const ogLocale = isEn ? "en_US" : "fr_FR";
  const author = BLOG_AUTHORS[frontmatter.author];

  // Hreflang alternates — only when a translation is declared
  const alternates: Metadata["alternates"] = { canonical: url };
  if (frontmatter.translationSlug) {
    if (isEn) {
      alternates.languages = {
        "en-US": url,
        "fr-FR": `${SITE_URL}/blog/${frontmatter.translationSlug}`,
        "x-default": `${SITE_URL}/blog/${frontmatter.translationSlug}`,
      };
    } else {
      alternates.languages = {
        "fr-FR": url,
        "en-US": `${SITE_URL}/en/blog/${frontmatter.translationSlug}`,
        "x-default": url,
      };
    }
  }

  return {
    title: frontmatter.title,
    description: frontmatter.description,
    ...(frontmatter.draft ? { robots: { index: false, follow: false } } : {}),
    alternates,
    openGraph: {
      type: "article",
      url,
      title: frontmatter.title,
      description: frontmatter.description,
      siteName: "Lucid-Lab",
      locale: ogLocale,
      publishedTime: frontmatter.publishedAt,
      modifiedTime: frontmatter.updatedAt ?? frontmatter.publishedAt,
      authors: [`${author.fullName} · Lucid-Lab`],
      tags: frontmatter.tags,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: frontmatter.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: frontmatter.title,
      description: frontmatter.description,
      images: [ogImage],
    },
  };
}
