import Link from "next/link";

import type { Post } from "@/lib/blog/types";
import { CATEGORIES } from "@/lib/blog/types";

export function RelatedPosts({ posts }: { posts: Post[] }) {
  if (posts.length === 0) return null;
  const locale = posts[0].frontmatter.locale ?? "fr";
  const heading = locale === "en" ? "Read next" : "À lire ensuite";
  const blogPath = locale === "en" ? "/en/blog" : "/blog";

  return (
    <section className="not-prose mt-20 border-t border-zinc-200 pt-10">
      <h2
        className="mb-6 text-[20px] font-semibold tracking-tight text-zinc-900"
        style={{ fontFamily: "var(--font-syne), sans-serif" }}
      >
        {heading}
      </h2>
      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((p) => {
          const cat = CATEGORIES[p.frontmatter.category];
          const catTitle = locale === "en" ? (cat.titleEn ?? cat.title) : cat.title;
          return (
            <li
              key={p.slug}
              className="group rounded-[14px] border border-zinc-200 bg-white p-5 transition-colors hover:border-zinc-400"
            >
              <Link href={`${blogPath}/${p.slug}`} className="block">
                <p className="mb-2 text-[11px] uppercase tracking-wider text-zinc-500">
                  {catTitle}
                </p>
                <h3 className="mb-2 text-[16px] font-semibold leading-snug text-zinc-900 group-hover:text-black">
                  {p.frontmatter.title}
                </h3>
                <p className="line-clamp-2 text-[13px] leading-[1.5] text-zinc-600">
                  {p.frontmatter.description}
                </p>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
