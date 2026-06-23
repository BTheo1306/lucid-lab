import 'server-only';

import { supabase } from '@/lib/bot/db/supabase';

const ORGANIZATION_SLUG = 'lucid-lab';

export type SocialPostStatus = 'draft' | 'queued' | 'approved' | 'posted' | 'rejected' | 'skipped';

export type SocialPost = {
  id: string;
  platform: string;
  authorLabel: string;
  pillar: string | null;
  hook: string | null;
  body: string;
  linkInComment: string | null;
  status: SocialPostStatus;
  reviewNote: string | null;
  scheduledFor: string | null;
  postedAt: string | null;
  postUrl: string | null;
  impressions: number | null;
  reactions: number | null;
  comments: number | null;
  reposts: number | null;
  clicks: number | null;
  createdAt: string;
  updatedAt: string;
};

async function getOrganizationId(): Promise<string | null> {
  const bySlug = await supabase.from('organizations').select('id').eq('slug', ORGANIZATION_SLUG).maybeSingle();
  if (bySlug.data) return (bySlug.data as { id: string }).id;

  const first = await supabase.from('organizations').select('id').order('created_at', { ascending: true }).limit(1).maybeSingle();
  return first.data ? (first.data as { id: string }).id : null;
}

function normalizeSocialPost(row: Record<string, unknown>): SocialPost {
  const num = (value: unknown): number | null => (typeof value === 'number' ? value : null);
  const str = (value: unknown): string | null => (typeof value === 'string' ? value : null);

  return {
    id: String(row.id),
    platform: str(row.platform) ?? 'linkedin',
    authorLabel: str(row.author_label) ?? 'company',
    pillar: str(row.pillar),
    hook: str(row.hook),
    body: str(row.body) ?? '',
    linkInComment: str(row.link_in_comment),
    status: (str(row.status) as SocialPostStatus) ?? 'draft',
    reviewNote: str(row.review_note),
    scheduledFor: str(row.scheduled_for),
    postedAt: str(row.posted_at),
    postUrl: str(row.post_url),
    impressions: num(row.impressions),
    reactions: num(row.reactions),
    comments: num(row.comments),
    reposts: num(row.reposts),
    clicks: num(row.clicks),
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

/**
 * Lists social posts for the Lucid-Lab organization. Defensive by design:
 * returns an empty array if Supabase is not configured (e.g. during build) or
 * the query fails, mirroring the other Lucid OS admin data loaders.
 */
export async function listSocialPosts(limit = 200): Promise<SocialPost[]> {
  const organizationId = await getOrganizationId();
  if (!organizationId) return [];

  const { data, error } = await supabase
    .from('social_posts')
    .select('*')
    .eq('organization_id', organizationId)
    .limit(limit);

  if (error || !data) {
    if (error) console.error('[social] listSocialPosts failed:', error.message);
    return [];
  }

  return (data as Record<string, unknown>[]).map(normalizeSocialPost);
}
