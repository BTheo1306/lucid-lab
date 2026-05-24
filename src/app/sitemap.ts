import type { MetadataRoute } from "next"

import { getAllPosts } from "@/lib/blog/posts"
import { CATEGORIES } from "@/lib/blog/types"

const SITE = "https://lucid-lab.fr"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const frPosts = await getAllPosts("fr")
  const enPosts = await getAllPosts("en")

  const frPostEntries: MetadataRoute.Sitemap = frPosts.map((p) => ({
    url: `${SITE}/blog/${p.slug}`,
    lastModified: new Date(p.frontmatter.updatedAt ?? p.frontmatter.publishedAt),
    changeFrequency: "monthly",
    priority: p.frontmatter.isPillar ? 0.9 : 0.7,
  }))

  const enPostEntries: MetadataRoute.Sitemap = enPosts.map((p) => ({
    url: `${SITE}/en/blog/${p.slug}`,
    lastModified: new Date(p.frontmatter.updatedAt ?? p.frontmatter.publishedAt),
    changeFrequency: "monthly",
    priority: p.frontmatter.isPillar ? 0.9 : 0.7,
  }))

  const frCategoryEntries: MetadataRoute.Sitemap = Object.keys(CATEGORIES).map(
    (slug) => ({
      url: `${SITE}/blog/categorie/${slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    }),
  )

  const enCategoryEntries: MetadataRoute.Sitemap = Object.keys(CATEGORIES).map(
    (slug) => ({
      url: `${SITE}/en/blog/categorie/${slug}`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.5,
    }),
  )

  return [
    {
      url: SITE,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE}/en`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE}/audit-flash`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE}/en/audit-flash`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${SITE}/confidentialite`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE}/en/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE}/mentions-legales`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE}/en/legal-notice`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${SITE}/blog`,
      lastModified: frPosts[0]?.frontmatter.updatedAt
        ? new Date(frPosts[0].frontmatter.updatedAt)
        : new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${SITE}/en/blog`,
      lastModified: enPosts[0]?.frontmatter.updatedAt
        ? new Date(enPosts[0].frontmatter.updatedAt)
        : new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...frCategoryEntries,
    ...enCategoryEntries,
    ...frPostEntries,
    ...enPostEntries,
  ]
}
