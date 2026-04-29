import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { getPostsByCategory } from "@/lib/blog/posts";
import { CATEGORIES, type PostCategory } from "@/lib/blog/types";

interface RouteParams {
  params: Promise<{ category: string }>;
}

export const revalidate = 300;

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { category } = await params;
  const meta = CATEGORIES[category as PostCategory];
  if (!meta) return {};
  const title = meta.titleEn ?? meta.title;
  const description = meta.descriptionEn ?? meta.description;
  return {
    title: `${title} — Lucid-Lab Blog`,
    description,
    alternates: { canonical: `https://lucid-lab.fr/en/blog/categorie/${category}` },
  };
}

const FORMATTER = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export default async function CategoryPage({ params }: RouteParams) {
  const { category } = await params;
  const meta = CATEGORIES[category as PostCategory];
  if (!meta) notFound();

  const posts = await getPostsByCategory(category as PostCategory, "en");
  const title = meta.titleEn ?? meta.title;
  const description = meta.descriptionEn ?? meta.description;

  return (
    <main className="mx-auto max-w-[1264px] border-x border-[#e5e5e5] px-[48px] py-[100px] max-sm:px-6 max-sm:py-16">
      <Link
        href="/en/blog"
        className="mb-8 inline-flex items-center gap-1.5 text-[13px] text-zinc-500 transition-colors hover:text-black"
      >
        ← All articles
      </Link>

      <header className="mb-12 max-w-[700px]">
        <p className="mb-3 text-[12px] uppercase tracking-wider text-zinc-500">
          Category
        </p>
        <h1 className="mb-4 text-[40px] font-semibold leading-[1.05] tracking-[-0.02em] text-zinc-900 sm:text-[48px]">
          {title}
        </h1>
        <p className="text-[16px] leading-[1.6] text-zinc-600 sm:text-[17px]">
          {description}
        </p>
      </header>

      {posts.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-300 p-10 text-center text-[15px] text-zinc-500">
          More articles coming.
        </p>
      ) : (
        <ul className="grid gap-6 md:grid-cols-2">
          {posts.map((p) => (
            <li
              key={p.slug}
              className="group rounded-[14px] border border-zinc-200 bg-white p-6 transition-colors hover:border-zinc-400"
            >
              <Link href={`/en/blog/${p.slug}`} className="block">
                <h2 className="mb-2 text-[20px] font-semibold leading-snug text-zinc-900 group-hover:text-black">
                  {p.frontmatter.title}
                </h2>
                <p className="mb-3 line-clamp-2 text-[14px] leading-[1.55] text-zinc-600">
                  {p.frontmatter.description}
                </p>
                <p className="text-[12px] text-zinc-500">
                  {FORMATTER.format(new Date(p.frontmatter.publishedAt))} ·{" "}
                  {p.readingTimeMinutes} min
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
