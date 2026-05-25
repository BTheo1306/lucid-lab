import Link from "next/link";
import type { Metadata } from "next";

import { getAllPosts } from "@/lib/blog/posts";
import { CATEGORIES, type PostCategory } from "@/lib/blog/types";

export const metadata: Metadata = {
  title: "Blog: automation, AI and systems for SMEs",
  description:
    "Real cases, real costs, measured ROI. We document what we learn while building systems for French and Belgian SMEs.",
  alternates: { canonical: "https://lucid-lab.fr/en/blog" },
};

const FORMATTER = new Intl.DateTimeFormat("en-US", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export const revalidate = 300;

export default async function BlogIndex() {
  const posts = await getAllPosts("en");
  const featured = posts.find((p) => p.frontmatter.isPillar) ?? posts[0];
  const rest = posts.filter((p) => p.slug !== featured?.slug);

  const categoryEntries = Object.values(CATEGORIES);

  return (
    <main className="mx-auto max-w-[1264px] border-x border-[#e5e5e5] px-[48px] py-[100px] max-sm:px-6 max-sm:py-16">
      <header className="mb-14 max-w-[700px]">
        <p className="mb-3 text-[12px] uppercase tracking-wider text-zinc-500">
          Lucid-Lab Blog
        </p>
        <h1
          className="mb-4 text-[40px] font-semibold leading-[1.05] tracking-tight text-zinc-900 sm:text-[56px]"
        >
          What we learn by building.
        </h1>
        <p className="text-[16px] leading-[1.6] text-zinc-600 sm:text-[18px]">
          Real cases, real costs, measured ROI. We document what we ship for
          French and Belgian SMEs.
        </p>
      </header>

      <nav className="mb-12 flex flex-wrap gap-2">
        {categoryEntries.map((c) => (
          <Link
            key={c.slug}
            href={`/en/blog/categorie/${c.slug}`}
            className="rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-[13px] text-zinc-700 transition-colors hover:border-zinc-900 hover:text-zinc-900"
          >
            {c.titleEn ?? c.title}
          </Link>
        ))}
      </nav>

      {posts.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-300 p-10 text-center text-[15px] text-zinc-500">
          First articles being written.
        </p>
      ) : (
        <>
          {featured && (
            <Link
              href={`/en/blog/${featured.slug}`}
              className="group mb-12 block rounded-[18px] border border-zinc-200 bg-white p-6 transition-colors hover:border-zinc-400 sm:p-10"
            >
              <p className="mb-3 text-[11px] uppercase tracking-wider text-zinc-500">
                {CATEGORIES[featured.frontmatter.category as PostCategory].titleEn ?? CATEGORIES[featured.frontmatter.category as PostCategory].title}
                {featured.frontmatter.isPillar ? " · Pillar guide" : ""}
              </p>
              <h2 className="mb-3 text-[28px] font-semibold leading-[1.1] tracking-[-0.02em] text-zinc-900 sm:text-[36px]">
                {featured.frontmatter.title}
              </h2>
              <p className="mb-4 text-[15px] leading-[1.6] text-zinc-600 sm:text-[16px]">
                {featured.frontmatter.description}
              </p>
              <p className="text-[13px] text-zinc-500">
                {FORMATTER.format(new Date(featured.frontmatter.publishedAt))} ·{" "}
                {featured.readingTimeMinutes} min read
              </p>
            </Link>
          )}

          <ul className="grid gap-6 md:grid-cols-2">
            {rest.map((p) => (
              <li
                key={p.slug}
                className="group rounded-[14px] border border-zinc-200 bg-white p-6 transition-colors hover:border-zinc-400"
              >
                <Link href={`/en/blog/${p.slug}`} className="block">
                  <p className="mb-2 text-[11px] uppercase tracking-wider text-zinc-500">
                    {CATEGORIES[p.frontmatter.category as PostCategory].titleEn ?? CATEGORIES[p.frontmatter.category as PostCategory].title}
                  </p>
                  <h3 className="mb-2 text-[20px] font-semibold leading-snug text-zinc-900 group-hover:text-black">
                    {p.frontmatter.title}
                  </h3>
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
        </>
      )}
    </main>
  );
}
