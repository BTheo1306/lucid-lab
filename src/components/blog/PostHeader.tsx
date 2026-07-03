import Link from "next/link";

import { BLOG_AUTHORS } from "@/lib/blog/authors";
import type { Post } from "@/lib/blog/types";
import { CATEGORIES } from "@/lib/blog/types";

const FORMATTERS = {
  fr: new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric" }),
  en: new Intl.DateTimeFormat("en-US", { day: "numeric", month: "long", year: "numeric" }),
};

export function PostHeader({ post }: { post: Post }) {
  const { frontmatter, readingTimeMinutes } = post;
  const locale = frontmatter.locale ?? "fr";
  const FORMATTER = FORMATTERS[locale];
  const category = CATEGORIES[frontmatter.category];
  const categoryTitle = locale === "en" ? (category.titleEn ?? category.title) : category.title;
  const categoryHref = locale === "en" ? `/en/blog/categorie/${category.slug}` : `/blog/categorie/${category.slug}`;
  const published = FORMATTER.format(new Date(frontmatter.publishedAt));
  const updated = frontmatter.updatedAt
    ? FORMATTER.format(new Date(frontmatter.updatedAt))
    : null;
  const updatedLabel = locale === "en" ? `Updated ${updated}` : `Mis à jour le ${updated}`;
  const readingLabel = locale === "en" ? `${readingTimeMinutes} min read` : `${readingTimeMinutes} min de lecture`;
  const author = BLOG_AUTHORS[frontmatter.author];
  const authorLabel = `${author.firstName} · ${author.jobTitle} Lucid-Lab`;

  return (
    <>
      <header className="not-prose mb-10 border-b border-zinc-200 pb-8">
        <Link
          href={categoryHref}
          className="mb-4 inline-block text-[12px] uppercase tracking-wider text-zinc-500 transition-colors hover:text-black"
        >
          {categoryTitle}
        </Link>
        <h1 className="mb-4 text-[36px] font-bold leading-[1.1] tracking-[-0.03em] text-zinc-900 sm:text-[44px]">
          {frontmatter.title}
        </h1>
        <p className="mb-6 text-[17px] leading-[1.55] text-zinc-600">
          {frontmatter.description}
        </p>
        <div className="flex flex-wrap items-center gap-3 text-[13px] text-zinc-500">
          <div className="flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={author.photo}
              alt={author.firstName}
              className="size-7 rounded-full object-cover"
            />
            <span className="text-zinc-700">{authorLabel}</span>
          </div>
          <span aria-hidden>•</span>
          <time dateTime={frontmatter.publishedAt}>{published}</time>
          {updated && updated !== published && (
            <>
              <span aria-hidden>•</span>
              <span>{updatedLabel}</span>
            </>
          )}
          <span aria-hidden>•</span>
          <span>{readingLabel}</span>
        </div>
      </header>
      {frontmatter.heroImage && (
        /* eslint-disable-next-line @next/next/no-img-element */
        <div className="not-prose mb-10 overflow-hidden rounded-[12px]">
          <img
            src={frontmatter.heroImage}
            alt={frontmatter.heroImageAlt ?? frontmatter.title}
            className="w-full aspect-[2/1] object-cover"
          />
        </div>
      )}
    </>
  );
}
