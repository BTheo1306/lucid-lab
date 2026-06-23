import { NextResponse } from 'next/server';

import { config } from '@/lib/bot/config';
import { logSecurityEvent } from '@/lib/bot/db/queries/security-audit';
import { listRecentlyPosted, listUpcomingPosts, updateEngagement, type SocialPost } from '@/lib/admin/social';
import { getPostingCredentials } from '@/lib/admin/linkedin/account';
import { fetchEngagement } from '@/lib/admin/linkedin/client';
import { sendLinkedInWeeklyDigest } from '@/lib/bot/integrations/email-client';

export const runtime = 'nodejs';
export const maxDuration = 60;

const STATUS_LABELS: Record<string, string> = { queued: 'à valider', approved: 'approuvé' };
const dateFormatter = new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' });

function isAuthorized(req: Request): boolean {
  if (!config.cronSecret) return false;
  return req.headers.get('authorization') === `Bearer ${config.cronSecret}`;
}

function postTitle(post: SocialPost): string {
  const raw = post.hook || post.body.split('\n').find((line) => line.trim().length > 0) || '(sans titre)';
  return raw.length > 120 ? `${raw.slice(0, 117)}…` : raw;
}

function dateLabel(iso: string | null): string {
  if (!iso) return 'non planifié';
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? 'non planifié' : dateFormatter.format(date);
}

/**
 * GET /api/cron/linkedin-weekly
 * Refreshes engagement on recently posted items, then emails info@lucid-lab.fr
 * with this week's queue and last week's performance.
 */
export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    await logSecurityEvent({ event_type: 'cron_unauthorized', details: { route: 'linkedin-weekly' } });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const [upcoming, recent] = await Promise.all([listUpcomingPosts(7), listRecentlyPosted(7)]);

  // Best-effort engagement refresh for last week's posts.
  const credentials = await getPostingCredentials();
  const freshStats = new Map<string, { reactions: number | null; comments: number | null }>();
  if (credentials) {
    for (const post of recent) {
      if (!post.postUrn) continue;
      try {
        const engagement = await fetchEngagement({ accessToken: credentials.accessToken, postUrn: post.postUrn });
        freshStats.set(post.id, engagement);
        await updateEngagement(post.id, engagement);
      } catch (error) {
        console.error('[linkedin-weekly] engagement refresh failed:', error);
      }
    }
  }

  await sendLinkedInWeeklyDigest({
    adminUrl: 'https://lucid-lab.fr/admin/lucid-os/social?vue=a-valider',
    upcoming: upcoming.map((post) => ({
      dateLabel: dateLabel(post.scheduledFor),
      pillar: post.pillar,
      title: postTitle(post),
      statusLabel: STATUS_LABELS[post.status] ?? post.status,
    })),
    recent: recent.map((post) => {
      const fresh = freshStats.get(post.id);
      return {
        title: postTitle(post),
        postUrl: post.postUrl,
        reactions: fresh?.reactions ?? post.reactions,
        comments: fresh?.comments ?? post.comments,
      };
    }),
  });

  return NextResponse.json({ ok: true, upcoming: upcoming.length, recent: recent.length });
}
