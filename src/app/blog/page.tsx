import Link from "next/link";
import type { Metadata } from "next";

import { getAllPosts } from "@/lib/blog/posts";
import { blogIndexSchema } from "@/lib/blog/schema";
import { CATEGORIES, type PostCategory } from "@/lib/blog/types";
import { jsonLd } from "@/lib/seo/schema";

export const metadata: Metadata = {
  title: "Blog : automatisation, IA et systèmes pour PME",
  description:
    "Cas concrets, coûts réels, ROI mesurés. On documente ce qu'on apprend en construisant des systèmes pour des PME françaises et belges.",
  alternates: { canonical: "https://lucid-lab.fr/blog" },
};

const FORMATTER = new Intl.DateTimeFormat("fr-FR", {
  day: "numeric",
  month: "short",
  year: "numeric",
});

export const revalidate = 300;

export default async function BlogIndex() {
  const posts = await getAllPosts("fr");
  const featured = posts.find((p) => p.frontmatter.isPillar) ?? posts[0];
  const rest = posts.filter((p) => p.slug !== featured?.slug);

  const categoryEntries = Object.values(CATEGORIES);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(blogIndexSchema(posts, "fr")) }}
      />
    <main className="mx-auto max-w-[1264px] border-x border-[#e5e5e5] px-[48px] py-[100px] max-sm:px-6 max-sm:py-16">
      <header className="mb-14 max-w-[700px]">
        <p className="mb-3 text-[12px] uppercase tracking-wider text-zinc-500">
          Blog Lucid-Lab
        </p>
        <h1
          className="mb-4 text-[40px] font-bold leading-[1.05] tracking-[-0.03em] text-zinc-900 sm:text-[56px]"
        >
          Ce qu&apos;on apprend en construisant.
        </h1>
        <p className="text-[16px] leading-[1.6] text-zinc-600 sm:text-[18px]">
          Cas concrets, coûts réels, ROI mesurés. On documente ce qu&apos;on
          fait pour des PME françaises et belges.
        </p>
      </header>

      <nav className="mb-12 flex flex-wrap gap-2">
        {categoryEntries.map((c) => (
          <Link
            key={c.slug}
            href={`/blog/categorie/${c.slug}`}
            className="rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-[13px] text-zinc-700 transition-colors hover:border-zinc-900 hover:text-zinc-900"
          >
            {c.title}
          </Link>
        ))}
      </nav>

      {posts.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-zinc-300 p-10 text-center text-[15px] text-zinc-500">
          Premiers articles en cours d&apos;écriture.
        </p>
      ) : (
        <>
          {featured && (
            <Link
              href={`/blog/${featured.slug}`}
              className="group mb-12 block overflow-hidden rounded-[18px] border border-zinc-200 bg-white transition-colors hover:border-zinc-400"
            >
              {featured.frontmatter.heroImage ? (
                <div className="overflow-hidden">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={featured.frontmatter.heroImage}
                    alt={featured.frontmatter.heroImageAlt ?? featured.frontmatter.title}
                    className="w-full aspect-[21/9] object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                  />
                </div>
              ) : null}
              <div className="p-6 sm:p-10">
                <p className="mb-3 text-[11px] uppercase tracking-wider text-zinc-500">
                  {CATEGORIES[featured.frontmatter.category as PostCategory].title}
                  {featured.frontmatter.isPillar ? " · Guide pillar" : ""}
                </p>
                <h2 className="mb-3 text-[28px] font-bold leading-[1.1] tracking-[-0.03em] text-zinc-900 sm:text-[36px]">
                  {featured.frontmatter.title}
                </h2>
                <p className="mb-4 text-[15px] leading-[1.6] text-zinc-600 sm:text-[16px]">
                  {featured.frontmatter.description}
                </p>
                <p className="text-[13px] text-zinc-500">
                  {FORMATTER.format(new Date(featured.frontmatter.publishedAt))} ·{" "}
                  {featured.readingTimeMinutes} min de lecture
                </p>
              </div>
            </Link>
          )}

          <ul className="grid gap-6 md:grid-cols-2">
            {rest.map((p) => (
              <li
                key={p.slug}
                className="group overflow-hidden rounded-[14px] border border-zinc-200 bg-white transition-colors hover:border-zinc-400"
              >
                <Link href={`/blog/${p.slug}`} className="block">
                  {p.frontmatter.heroImage ? (
                    <div className="overflow-hidden">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.frontmatter.heroImage}
                        alt={p.frontmatter.heroImageAlt ?? p.frontmatter.title}
                        className="w-full aspect-[16/9] object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                      />
                    </div>
                  ) : null}
                  <div className="p-6">
                    <p className="mb-2 text-[11px] uppercase tracking-wider text-zinc-500">
                      {CATEGORIES[p.frontmatter.category as PostCategory].title}
                    </p>
                    <h3 className="mb-2 text-[20px] font-bold leading-snug tracking-[-0.02em] text-zinc-900 group-hover:text-black">
                      {p.frontmatter.title}
                    </h3>
                    <p className="mb-3 line-clamp-2 text-[14px] leading-[1.55] text-zinc-600">
                      {p.frontmatter.description}
                    </p>
                    <p className="text-[12px] text-zinc-500">
                      {FORMATTER.format(new Date(p.frontmatter.publishedAt))} ·{" "}
                      {p.readingTimeMinutes} min
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
    </>
  );
}
