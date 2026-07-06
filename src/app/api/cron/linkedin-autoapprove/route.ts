import { NextResponse } from 'next/server';

import { config } from '@/lib/bot/config';
import { logSecurityEvent } from '@/lib/bot/db/queries/security-audit';
import {
  autoApproveDuePosts,
  createSocialPost,
  listPostsScheduledBetween,
  listRecentPostsForContext,
} from '@/lib/admin/social';
import { generateWeeklyLinkedInPosts, type WeeklySlot } from '@/lib/admin/social-content-generator';

export const runtime = 'nodejs';
// Friday runs include a Claude call generating 3 posts.
export const maxDuration = 300;

const REVIEW_WINDOW_HOURS = 24;

/** Default first-comment link while no article is tied to the post. */
const DEFAULT_LINK_IN_COMMENT = 'https://lucid-lab.fr/audit-flash';

/** Publication slots: Monday / Wednesday / Friday at 07:30 UTC (~09:30 Paris),
 * just before the daily posting cron at 08:00 UTC. */
const SLOT_DAY_OFFSETS: { offsetDays: number; rubrique: WeeklySlot['rubrique'] }[] = [
  { offsetDays: 0, rubrique: 'decryptage' },
  { offsetDays: 2, rubrique: 'terrain' },
  { offsetDays: 4, rubrique: 'point-de-vue' },
];

function isAuthorized(req: Request): boolean {
  if (!config.cronSecret) return false;
  return req.headers.get('authorization') === `Bearer ${config.cronSecret}`;
}

/** Next Monday (strictly after `from`) at 07:30 UTC. */
function nextMondaySlot(from: Date): Date {
  const date = new Date(Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate(), 7, 30));
  const day = date.getUTCDay();
  const daysUntilMonday = ((8 - day) % 7) || 7;
  date.setUTCDate(date.getUTCDate() + daysUntilMonday);
  return date;
}

/**
 * Generate next week's 3 posts (Friday runs only), unless the week already has
 * posts scheduled (manual planning wins). Posts land as `queued`, so the
 * cockpit review + silence-equals-approval flow applies before anything publishes.
 */
async function generateNextWeekIfDue(now: Date): Promise<{ generated: number; skipped?: string }> {
  if (now.getUTCDay() !== 5) return { generated: 0, skipped: 'not_friday' };
  if (!config.anthropicApiKey) return { generated: 0, skipped: 'anthropic_not_configured' };

  const monday = nextMondaySlot(now);
  const weekStart = new Date(monday);
  weekStart.setUTCHours(0, 0, 0, 0);
  const weekEnd = new Date(weekStart);
  weekEnd.setUTCDate(weekEnd.getUTCDate() + 7);

  const existing = await listPostsScheduledBetween(weekStart.toISOString(), weekEnd.toISOString());
  if (existing.length > 0) return { generated: 0, skipped: 'week_already_planned' };

  const slots: WeeklySlot[] = SLOT_DAY_OFFSETS.map(({ offsetDays, rubrique }) => {
    const date = new Date(monday);
    date.setUTCDate(date.getUTCDate() + offsetDays);
    return { scheduledFor: date.toISOString(), rubrique };
  });

  const recentPosts = await listRecentPostsForContext(12);
  const posts = await generateWeeklyLinkedInPosts(slots, recentPosts);

  let generated = 0;
  for (const post of posts) {
    const id = await createSocialPost({
      authorLabel: 'Anthony Poirier',
      pillar: post.pillar,
      hook: post.hook,
      body: post.body,
      linkInComment: DEFAULT_LINK_IN_COMMENT,
      scheduledFor: post.scheduledFor,
      status: 'queued',
    });
    if (id) generated += 1;
  }
  return { generated };
}

/**
 * GET /api/cron/linkedin-autoapprove
 * Daily. Two jobs:
 * 1. Silence = approval: any `queued` LinkedIn post whose scheduled time is
 *    within the review window flips to `approved` for the posting cron.
 * 2. On Fridays, generate next week's 3 newsletter-style posts (lundi
 *    decryptage / mercredi terrain / vendredi point de vue) into the review
 *    queue, giving the weekend + the weekly Monday email to review them.
 */
export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    await logSecurityEvent({ event_type: 'cron_unauthorized', details: { route: 'linkedin-autoapprove' } });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const approved = await autoApproveDuePosts(REVIEW_WINDOW_HOURS);

  let generation: { generated: number; skipped?: string };
  try {
    generation = await generateNextWeekIfDue(new Date());
  } catch (error) {
    console.error('[linkedin-autoapprove] weekly generation failed:', error);
    generation = { generated: 0, skipped: `error: ${(error as Error).message.slice(0, 200)}` };
  }

  return NextResponse.json({ ok: true, approved, ...generation });
}
