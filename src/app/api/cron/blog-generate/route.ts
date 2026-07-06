import { NextResponse } from 'next/server';

import { config } from '@/lib/bot/config';
import { logSecurityEvent } from '@/lib/bot/db/queries/security-audit';
import {
  fillIdeaWithContent,
  insertBlogIdeas,
  listBlogTitles,
  listIdeaBacklog,
  listUpcomingScheduledArticles,
} from '@/lib/admin/blog';
import {
  generateBlogContent,
  generateSeoIdeas,
  slugify,
} from '@/lib/admin/blog-content-generator';
import { pickAuthor } from '@/lib/blog/authors';

export const runtime = 'nodejs';
export const maxDuration = 300;

/** Keep this many articles queued ahead (the blog publishes 2 per week). */
const TARGET_SCHEDULED_AHEAD = 2;
/** Replenish the idea backlog when it drops below this. */
const IDEA_BACKLOG_MIN = 4;
/** How many ideas to generate per replenishment. */
const IDEA_BATCH_SIZE = 6;

function isAuthorized(req: Request): boolean {
  if (!config.cronSecret) return false;
  return req.headers.get('authorization') === `Bearer ${config.cronSecret}`;
}

/** Publication slots: Tuesday and Thursday at 06:00 UTC (published by the
 * 07:00 UTC publish-blog run). Returns the next free slot strictly after
 * `after` and not already taken. */
function nextFreeSlot(after: Date, taken: Set<string>): Date {
  const candidate = new Date(Date.UTC(after.getUTCFullYear(), after.getUTCMonth(), after.getUTCDate(), 6, 0));
  for (let i = 0; i < 60; i += 1) {
    candidate.setUTCDate(candidate.getUTCDate() + 1);
    const day = candidate.getUTCDay();
    if ((day === 2 || day === 4) && candidate > after && !taken.has(candidate.toISOString())) {
      return new Date(candidate);
    }
  }
  return new Date(after.getTime() + 7 * 24 * 60 * 60 * 1000);
}

/** Extract the target keyword persisted in an idea's notes at idea-generation time. */
function targetKeywordFromNotes(notes: string | null): string | null {
  if (!notes) return null;
  const match = notes.match(/Mot-clé cible\s*:\s*(.+)/);
  return match ? match[1].trim() : null;
}

/**
 * GET /api/cron/blog-generate
 * The blog's own SEO pipeline, decoupled from LinkedIn:
 * 1. Replenish the idea backlog with Claude-generated SEO topics when low
 *    (rows land as `idea` in /admin/blog, editable/deletable before writing).
 * 2. Keep TARGET_SCHEDULED_AHEAD articles in the review queue: take the oldest
 *    ideas, generate the long-form article, schedule on the next free
 *    Tuesday/Thursday slot as `queued` (silence = approval, like LinkedIn).
 */
export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    await logSecurityEvent({ event_type: 'cron_unauthorized', details: { route: 'blog-generate' } });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!config.anthropicApiKey) {
    return NextResponse.json({ ok: false, reason: 'anthropic_not_configured' });
  }

  // 1. Replenish the idea backlog.
  let ideasAdded = 0;
  let ideaError: string | null = null;
  let backlog = await listIdeaBacklog(20);
  if (backlog.length < IDEA_BACKLOG_MIN) {
    try {
      const titles = await listBlogTitles();
      const ideas = await generateSeoIdeas(titles, IDEA_BATCH_SIZE);
      ideasAdded = await insertBlogIdeas(ideas);
      if (ideasAdded > 0) backlog = await listIdeaBacklog(20);
    } catch (err) {
      ideaError = (err as Error).message.slice(0, 300);
    }
  }

  // 2. Top up the scheduled queue from the backlog.
  const upcoming = await listUpcomingScheduledArticles();
  const toGenerate = Math.min(
    Math.max(0, TARGET_SCHEDULED_AHEAD - upcoming.length),
    backlog.length,
  );

  // Normalize DB timestamps (+00:00 suffix) to toISOString() form for comparison.
  const taken = new Set(upcoming.map((p) => new Date(p.scheduled_for).toISOString()));
  let lastSlot = new Date();
  const created: { blogId: string; slug: string; scheduledFor: string }[] = [];
  const failures: { blogId: string; error: string }[] = [];

  for (const idea of backlog.slice(0, toGenerate)) {
    try {
      const targetKeyword = targetKeywordFromNotes(idea.notes);
      const author = pickAuthor({ category: idea.category, tags: idea.tags ?? [], title: idea.title });
      const generated = await generateBlogContent({
        title: idea.title,
        description: idea.description,
        category: idea.category,
        tags: idea.tags ?? [],
        funnelStage: idea.funnel_stage,
        locale: idea.locale,
        notes: idea.notes,
        isPillar: idea.is_pillar,
        targetKeyword,
        author,
      });

      const slot = nextFreeSlot(lastSlot, taken);
      taken.add(slot.toISOString());
      lastSlot = slot;

      const slug = slugify(idea.title);
      await fillIdeaWithContent(idea.id, {
        slug,
        description: idea.description ?? generated.description,
        content: generated.content,
        scheduledFor: slot.toISOString(),
        author,
      });
      created.push({ blogId: idea.id, slug, scheduledFor: slot.toISOString() });
    } catch (err) {
      failures.push({ blogId: idea.id, error: (err as Error).message.slice(0, 300) });
    }
  }

  return NextResponse.json({
    ok: true,
    ideasAdded,
    ...(ideaError ? { ideaError } : {}),
    generated: created.length,
    created,
    failures,
  });
}
