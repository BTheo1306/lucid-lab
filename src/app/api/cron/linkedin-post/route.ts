import { NextResponse } from 'next/server';

import { config } from '@/lib/bot/config';
import { logSecurityEvent } from '@/lib/bot/db/queries/security-audit';
import { listPostablePosts, recordPostFailure, recordPosted } from '@/lib/admin/social';
import { socialPostsBlockedByUnpublishedBlog } from '@/lib/admin/blog';
import { getPostingCredentials } from '@/lib/admin/linkedin/account';
import { addComment, createMemberPost, postUrlFromUrn } from '@/lib/admin/linkedin/client';

export const runtime = 'nodejs';
export const maxDuration = 60;

function isAuthorized(req: Request): boolean {
  if (!config.cronSecret) return false;
  return req.headers.get('authorization') === `Bearer ${config.cronSecret}`;
}

/**
 * GET /api/cron/linkedin-post
 * Publishes approved + due LinkedIn posts on the connected member's feed, then
 * posts the configured link as the first comment.
 */
export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    await logSecurityEvent({ event_type: 'cron_unauthorized', details: { route: 'linkedin-post' } });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const due = await listPostablePosts();
  if (due.length === 0) {
    return NextResponse.json({ ok: true, posted: 0 });
  }

  // Hold back any post whose linked blog article isn't published yet: its
  // first-comment link would point at a not-yet-live URL. It posts on a later
  // run once publish-blog has published the article (and set link_in_comment).
  const blocked = await socialPostsBlockedByUnpublishedBlog(due.map((p) => p.id));
  const ready = due.filter((p) => !blocked.has(p.id));
  if (ready.length === 0) {
    return NextResponse.json({ ok: true, posted: 0, waitingForBlog: blocked.size });
  }

  const credentials = await getPostingCredentials();
  if (!credentials) {
    return NextResponse.json({ ok: false, reason: 'linkedin_not_connected', due: ready.length });
  }

  let posted = 0;
  const failures: { id: string; error: string }[] = [];

  for (const post of ready) {
    try {
      const { postUrn } = await createMemberPost({
        accessToken: credentials.accessToken,
        authorSub: credentials.memberSub,
        text: post.body,
      });

      let firstCommentPosted = false;
      if (post.linkInComment) {
        try {
          await addComment({
            accessToken: credentials.accessToken,
            authorSub: credentials.memberSub,
            postUrn,
            text: post.linkInComment,
          });
          firstCommentPosted = true;
        } catch (commentError) {
          console.error('[linkedin-post] first comment failed:', commentError);
        }
      }

      await recordPosted(post.id, { postUrl: postUrlFromUrn(postUrn), postUrn, firstCommentPosted });
      posted += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await recordPostFailure(post.id, message);
      failures.push({ id: post.id, error: message });
    }
  }

  return NextResponse.json({ ok: true, posted, waitingForBlog: blocked.size, failures });
}
