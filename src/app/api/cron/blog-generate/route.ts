import { NextResponse } from 'next/server';

import { config } from '@/lib/bot/config';
import { logSecurityEvent } from '@/lib/bot/db/queries/security-audit';
import { createBlogVersion, getSocialPostsMissingBlogVersion } from '@/lib/admin/blog';
import {
  blogInputFromSocialPost,
  generateBlogContent,
  slugify,
} from '@/lib/admin/blog-content-generator';

export const runtime = 'nodejs';
export const maxDuration = 300;

/** How many articles to generate per run, to bound LLM cost and runtime. */
const MAX_PER_RUN = 5;
/** Publish the blog article ~1h before its LinkedIn post so the link is live first. */
const SCHEDULE_LEAD_MS = 60 * 60 * 1000;

function isAuthorized(req: Request): boolean {
  if (!config.cronSecret) return false;
  return req.headers.get('authorization') === `Bearer ${config.cronSecret}`;
}

/**
 * GET /api/cron/blog-generate
 * For each LinkedIn post without a blog companion, generate the long-form
 * article with Claude and drop it into the blog "À valider" queue (status
 * `queued`), linked to the LinkedIn post and scheduled just before its slot.
 * No manual "Generate" step: this is what makes blog posts appear like LinkedIn ones.
 */
export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    await logSecurityEvent({ event_type: 'cron_unauthorized', details: { route: 'blog-generate' } });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!config.anthropicApiKey) {
    return NextResponse.json({ ok: false, reason: 'anthropic_not_configured' });
  }

  const candidates = await getSocialPostsMissingBlogVersion(MAX_PER_RUN);
  if (candidates.length === 0) {
    return NextResponse.json({ ok: true, generated: 0 });
  }

  const created: { socialPostId: string; blogId: string }[] = [];
  const failures: { socialPostId: string; error: string }[] = [];

  for (const sp of candidates) {
    try {
      const input = blogInputFromSocialPost(sp);
      const generated = await generateBlogContent(input);

      const scheduledFor = sp.scheduledFor
        ? new Date(new Date(sp.scheduledFor).getTime() - SCHEDULE_LEAD_MS).toISOString()
        : null;

      const blogId = await createBlogVersion({
        socialPostId: sp.id,
        title: input.title,
        slug: slugify(input.title),
        description: generated.description,
        content: generated.content,
        category: input.category,
        locale: 'fr',
        // queued enters the "À valider" queue (silence = approval). Without a
        // slot we cannot queue (schedule constraint), so it lands as a draft.
        status: scheduledFor ? 'queued' : 'draft',
        scheduledFor,
      });

      if (blogId) created.push({ socialPostId: sp.id, blogId });
      else failures.push({ socialPostId: sp.id, error: 'insert_failed' });
    } catch (err) {
      failures.push({ socialPostId: sp.id, error: (err as Error).message.slice(0, 300) });
    }
  }

  return NextResponse.json({ ok: true, generated: created.length, created, failures });
}
