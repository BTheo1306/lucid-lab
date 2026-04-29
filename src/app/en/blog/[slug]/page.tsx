import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { MDXComponents } from "mdx/types";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";

import { AuditFlashCTA } from "@/components/blog/AuditFlashCTA";
import { NewsletterForm } from "@/components/blog/NewsletterForm";
import { PostHeader } from "@/components/blog/PostHeader";
import { RelatedPosts } from "@/components/blog/RelatedPosts";
import { generatePostMetadata } from "@/lib/blog/metadata";
import { mdxComponents } from "@/lib/blog/mdx-components";
import { getPostBySlug, getRelatedPosts } from "@/lib/blog/posts";
import { articleSchema, breadcrumbSchema } from "@/lib/blog/schema";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

// Bind the MDX `<AuditFlashCTA>` to lang="en" for EN posts.
const enMdxComponents: MDXComponents = {
  ...mdxComponents,
  AuditFlashCTA: (props: React.ComponentProps<typeof AuditFlashCTA>) => (
    <AuditFlashCTA lang="en" {...props} />
  ),
};

export const revalidate = 300;

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(slug, "en");
  if (!post) return {};
  return generatePostMetadata(post);
}

export default async function PostPage({ params }: RouteParams) {
  const { slug } = await params;
  const post = await getPostBySlug(slug, "en");
  if (!post) notFound();

  const related = await getRelatedPosts(post, 3);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([articleSchema(post), breadcrumbSchema(post)]),
        }}
      />

      <main className="mx-auto max-w-[760px] px-6 py-16 md:py-20">
        <Link
          href="/en/blog"
          className="mb-10 inline-flex items-center gap-1.5 text-[13px] text-zinc-500 transition-colors hover:text-black"
        >
          ← Back to blog
        </Link>

        <PostHeader post={post} />

        <article
          className="prose prose-zinc max-w-none text-[16px] leading-[1.75] text-zinc-700
            [&_h2]:mb-3 [&_h2]:mt-12 [&_h2]:text-[24px] [&_h2]:font-semibold [&_h2]:tracking-tight [&_h2]:text-zinc-900
            [&_h3]:mb-2 [&_h3]:mt-8 [&_h3]:text-[19px] [&_h3]:font-semibold [&_h3]:text-zinc-900
            [&_p]:my-5
            [&_ul]:my-5 [&_ul]:list-disc [&_ul]:pl-6 [&_ul>li]:my-1.5
            [&_ol]:my-5 [&_ol]:list-decimal [&_ol]:pl-6 [&_ol>li]:my-1.5
            [&_p_a]:text-zinc-900 [&_p_a]:underline [&_p_a]:underline-offset-2 [&_p_a]:decoration-zinc-300 hover:[&_p_a]:decoration-zinc-900
            [&_li_a]:text-zinc-900 [&_li_a]:underline [&_li_a]:underline-offset-2 [&_li_a]:decoration-zinc-300 hover:[&_li_a]:decoration-zinc-900
            [&_strong]:text-zinc-900
            [&_blockquote]:my-6 [&_blockquote]:border-l-2 [&_blockquote]:border-zinc-300 [&_blockquote]:pl-4 [&_blockquote]:text-zinc-600 [&_blockquote]:italic
            [&_code]:rounded [&_code]:bg-zinc-100 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:text-[14px]
            [&_pre]:my-6 [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-zinc-900 [&_pre]:p-4 [&_pre]:text-[14px] [&_pre_code]:bg-transparent [&_pre_code]:text-zinc-100"
        >
          <MDXRemote
            source={post.content}
            components={enMdxComponents}
            options={{
              mdxOptions: {
                remarkPlugins: [remarkGfm],
              },
            }}
          />
        </article>

        <AuditFlashCTA variant="block" lang="en" />
        <NewsletterForm lang="en" />
        <RelatedPosts posts={related} />
      </main>
    </>
  );
}
