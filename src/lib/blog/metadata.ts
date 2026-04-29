import type { Metadata } from "next";

import type { Post } from "./types";

const SITE_URL = "https://lucid-lab.fr";

export function postUrl(slug: string): string {
  return `${SITE_URL}/blog/${slug}`;
}

export function generatePostMetadata(post: Post): Metadata {
  const { frontmatter, slug } = post;
  const url = postUrl(slug);
  const ogImage = frontmatter.ogImage ?? `${SITE_URL}/blog/${slug}/opengraph-image`;

  return {
    title: frontmatter.title,
    description: frontmatter.description,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: frontmatter.title,
      description: frontmatter.description,
      siteName: "Lucid-Lab",
      locale: "fr_FR",
      publishedTime: frontmatter.publishedAt,
      modifiedTime: frontmatter.updatedAt ?? frontmatter.publishedAt,
      authors: ["Anthony — Lucid-Lab"],
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
