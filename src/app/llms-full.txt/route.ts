import { readFileSync } from "node:fs";
import { join } from "node:path";

import { BLOG_AUTHORS } from "@/lib/blog/authors";
import { getAllPosts } from "@/lib/blog/posts";
import type { Post } from "@/lib/blog/types";

/**
 * /llms-full.txt — the full text corpus in a single fetch, for LLM crawlers.
 *
 * `llms.txt` is the map (identity + links); this is the territory (every article
 * in full). Generated from the same sources the site renders, never hand-written:
 * the header is read back from `public/llms.txt` and the posts come from
 * `getAllPosts()`, so this file cannot drift when an article is published.
 */

export const revalidate = 3600;

const SITE = "https://lucid-lab.fr";

function renderPost(post: Post, blogBase: string): string {
  const { frontmatter: fm, slug } = post;
  const author = BLOG_AUTHORS[fm.author];
  const updated = fm.updatedAt ?? fm.publishedAt;

  return [
    `### ${fm.title}`,
    ``,
    `URL: ${blogBase}/${slug}`,
    `Published: ${fm.publishedAt}`,
    `Updated: ${updated}`,
    author ? `Author: ${author.fullName} (${author.jobTitle}, Lucid-Lab)` : null,
    `Category: ${fm.category}`,
    `Reading time: ${post.readingTimeMinutes} min`,
    ``,
    fm.description,
    ``,
    post.content.trim(),
  ]
    .filter((line) => line !== null)
    .join("\n");
}

export async function GET() {
  const header = readFileSync(join(process.cwd(), "public", "llms.txt"), "utf8");

  const [frPosts, enPosts] = await Promise.all([
    getAllPosts("fr"),
    getAllPosts("en"),
  ]);

  const sections: string[] = [header.trim(), "", "---", ""];

  sections.push("# Full article content");
  sections.push("");
  sections.push(
    "Every published article below, in full. Same source as the website, so this file stays in sync.",
  );
  sections.push("");

  if (frPosts.length > 0) {
    sections.push("## Articles (French)");
    sections.push("");
    sections.push(
      frPosts.map((p) => renderPost(p, `${SITE}/blog`)).join("\n\n---\n\n"),
    );
    sections.push("");
  }

  if (enPosts.length > 0) {
    sections.push("## Articles (English)");
    sections.push("");
    sections.push(
      enPosts.map((p) => renderPost(p, `${SITE}/en/blog`)).join("\n\n---\n\n"),
    );
    sections.push("");
  }

  return new Response(sections.join("\n"), {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=0, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
