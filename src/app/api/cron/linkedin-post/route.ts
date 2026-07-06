import { NextResponse } from 'next/server';

import { config } from '@/lib/bot/config';
import { logSecurityEvent } from '@/lib/bot/db/queries/security-audit';
import { listPostablePosts, recordPostFailure, recordPosted } from '@/lib/admin/social';
import { getPostingCredentials } from '@/lib/admin/linkedin/account';
import { getOrgPostingCredentials } from '@/lib/admin/linkedin/org-account';
import {
  addComment,
  appendOrganizationMention,
  createMemberPost,
  createOrganizationReshare,
  postUrlFromUrn,
} from '@/lib/admin/linkedin/client';

export const runtime = 'nodejs';
export const maxDuration = 60;

function isAuthorized(req: Request): boolean {
  if (!config.cronSecret) return false;
  return req.headers.get('authorization') === `Bearer ${config.cronSecret}`;
}

/**
 * GET /api/cron/linkedin-post
 * Publishes approved + due LinkedIn posts on the connected member's feed, then
 * posts the configured link as the first comment. When the Lucid-Lab page has
 * its own Community Management API connection (a separate LinkedIn app, see
 * org-account.ts), the page reshares each post so it also appears on the
 * company feed.
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

  const credentials = await getPostingCredentials();
  if (!credentials) {
    return NextResponse.json({ ok: false, reason: 'linkedin_not_connected', due: due.length });
  }

  // Best effort, independent of member credentials: absence must never block posting.
  const orgCredentials = config.linkedinOrganizationId ? await getOrgPostingCredentials() : null;

  let posted = 0;
  let mentioned = 0;
  let resharedByPage = 0;
  const failures: { id: string; error: string }[] = [];

  for (const post of due) {
    try {
      let postUrn: string;
      if (config.linkedinOrganizationId) {
        const mention = appendOrganizationMention(post.body, { organizationId: config.linkedinOrganizationId });
        try {
          ({ postUrn } = await createMemberPost({
            accessToken: credentials.accessToken,
            authorSub: credentials.memberSub,
            text: mention.text,
            commentaryAttributes: mention.attributes,
          }));
          mentioned += 1;
        } catch (mentionError) {
          // The tag must never block publishing: retry once with the plain body.
          console.error('[linkedin-post] mention attempt failed, retrying without tag:', mentionError);
          ({ postUrn } = await createMemberPost({
            accessToken: credentials.accessToken,
            authorSub: credentials.memberSub,
            text: post.body,
          }));
        }
      } else {
        ({ postUrn } = await createMemberPost({
          accessToken: credentials.accessToken,
          authorSub: credentials.memberSub,
          text: post.body,
        }));
      }

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

      // Page reshare (best effort, never blocks the member post).
      let orgPostUrn: string | null = null;
      if (orgCredentials && config.linkedinOrganizationId) {
        try {
          ({ postUrn: orgPostUrn } = await createOrganizationReshare({
            accessToken: orgCredentials.accessToken,
            organizationId: config.linkedinOrganizationId,
            parentPostUrn: postUrn,
          }));
          resharedByPage += 1;
        } catch (reshareError) {
          console.error('[linkedin-post] page reshare failed:', reshareError);
        }
      }

      await recordPosted(post.id, { postUrl: postUrlFromUrn(postUrn), postUrn, firstCommentPosted, orgPostUrn });
      posted += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      await recordPostFailure(post.id, message);
      failures.push({ id: post.id, error: message });
    }
  }

  return NextResponse.json({ ok: true, posted, mentioned, resharedByPage, failures });
}
