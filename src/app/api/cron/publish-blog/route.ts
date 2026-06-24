import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

import { config } from '@/lib/bot/config';
import { logSecurityEvent } from '@/lib/bot/db/queries/security-audit';
import {
  autoApproveDueBlogPosts,
  blogPublicUrl,
  listPublishableBlogPosts,
  markBlogPostPublished,
} from '@/lib/admin/blog';
import { setLinkInComment } from '@/lib/admin/social';

export const runtime = 'nodejs';
export const maxDuration = 30;

function isAuthorized(req: Request): boolean {
  if (!config.cronSecret) return false;
  return req.headers.get('authorization') === `Bearer ${config.cronSecret}`;
}

/**
 * GET /api/cron/publish-blog
 * Mirrors the LinkedIn flow for the blog:
 *   1. "Silence = approval": flip `queued` posts within 24h of their slot to `approved`.
 *   2. Publish `approved` posts whose `scheduled_for <= now()`.
 *   3. For each published article linked to a LinkedIn post, point that post's
 *      first-comment link at the freshly published article URL (the "raccord").
 */
export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    await logSecurityEvent({ event_type: 'cron_unauthorized', details: { route: 'publish-blog' } });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 1. Silence = approval.
  const autoApproved = await autoApproveDueBlogPosts(24);

  // 2. Publish what is due.
  const due = await listPublishableBlogPosts();
  if (due.length === 0) {
    return NextResponse.json({ ok: true, autoApproved, published: 0 });
  }

  const published: { id: string; slug: string | null; locale: string; linkedSocialPostId: string | null }[] = [];

  for (const post of due) {
    await markBlogPostPublished(post.id);

    // 3. Point the linked LinkedIn post at the article (best effort, non-fatal).
    if (post.social_post_id && post.slug) {
      try {
        await setLinkInComment(post.social_post_id, blogPublicUrl(post.locale, post.slug));
      } catch (err) {
        console.error('[publish-blog] setLinkInComment failed:', (err as Error).message);
      }
    }

    // Refresh the public pages so the article shows immediately.
    if (post.locale === 'en') {
      revalidatePath('/en/blog');
      if (post.slug) revalidatePath(`/en/blog/${post.slug}`);
    } else {
      revalidatePath('/blog');
      if (post.slug) revalidatePath(`/blog/${post.slug}`);
    }

    published.push({
      id: post.id,
      slug: post.slug,
      locale: post.locale,
      linkedSocialPostId: post.social_post_id,
    });
  }

  return NextResponse.json({ ok: true, autoApproved, published: published.length, posts: published });
}
