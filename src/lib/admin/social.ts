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
  postUrn: string | null;
  impressions: number | null;
  reactions: number | null;
  comments: number | null;
  reposts: number | null;
  clicks: number | null;
  createdAt: string;
  updatedAt: string;
};

export async function getLucidOrganizationId(): Promise<string | null> {
  const bySlug = await supabase.from('organizations').select('id').eq('slug', ORGANIZATION_SLUG).maybeSingle();
  if (bySlug.data) return (bySlug.data as { id: string }).id;

  const first = await supabase.from('organizations').select('id').order('created_at', { ascending: true }).limit(1).maybeSingle();
  return first.data ? (first.data as { id: string }).id : null;
}

function normalizeSocialPost(row: Record<string, unknown>): SocialPost {
  const num = (value: unknown): number | null => (typeof value === 'number' ? value : null);
  const str = (value: unknown): string | null => (typeof value === 'string' ? value : null);
  const metadata = (row.metadata ?? {}) as Record<string, unknown>;

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
    postUrn: str(metadata.post_urn),
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
  const organizationId = await getLucidOrganizationId();
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

export async function getSocialPostById(id: string): Promise<SocialPost | null> {
  const { data, error } = await supabase.from('social_posts').select('*').eq('id', id).maybeSingle();
  if (error || !data) return null;
  return normalizeSocialPost(data as Record<string, unknown>);
}

export type CreateSocialPostInput = {
  authorLabel: string;
  pillar: string | null;
  hook: string | null;
  body: string;
  linkInComment: string | null;
  scheduledFor: string | null;
  status?: SocialPostStatus;
};

export async function createSocialPost(input: CreateSocialPostInput): Promise<string | null> {
  const organizationId = await getLucidOrganizationId();
  if (!organizationId) return null;

  const { data, error } = await supabase
    .from('social_posts')
    .insert({
      organization_id: organizationId,
      platform: 'linkedin',
      author_label: input.authorLabel,
      pillar: input.pillar,
      hook: input.hook,
      body: input.body,
      link_in_comment: input.linkInComment,
      scheduled_for: input.scheduledFor,
      status: input.status ?? 'draft',
    })
    .select('id')
    .single();
  if (error || !data) {
    console.error('[social] createSocialPost failed:', error?.message);
    return null;
  }
  return (data as { id: string }).id;
}

export type UpdateSocialPostContent = {
  pillar?: string | null;
  hook?: string | null;
  body?: string;
  linkInComment?: string | null;
  scheduledFor?: string | null;
};

export async function updateSocialPostContent(id: string, patch: UpdateSocialPostContent): Promise<void> {
  const update: Record<string, unknown> = {};
  if (patch.pillar !== undefined) update.pillar = patch.pillar;
  if (patch.hook !== undefined) update.hook = patch.hook;
  if (patch.body !== undefined) update.body = patch.body;
  if (patch.linkInComment !== undefined) update.link_in_comment = patch.linkInComment;
  if (patch.scheduledFor !== undefined) update.scheduled_for = patch.scheduledFor;
  if (Object.keys(update).length === 0) return;

  const { error } = await supabase.from('social_posts').update(update).eq('id', id);
  if (error) throw new Error(error.message);
}

export async function setSocialPostStatus(
  id: string,
  status: SocialPostStatus,
  reviewNote?: string | null,
): Promise<void> {
  const update: Record<string, unknown> = { status };
  if (reviewNote !== undefined) update.review_note = reviewNote;
  const { error } = await supabase.from('social_posts').update(update).eq('id', id);
  if (error) throw new Error(error.message);
}

/** Posts the cron should publish: approved, due, LinkedIn, under the retry cap. */
export async function listPostablePosts(
  maxAttempts = 5,
): Promise<{ id: string; body: string; linkInComment: string | null; attempts: number }[]> {
  const organizationId = await getLucidOrganizationId();
  if (!organizationId) return [];

  const { data, error } = await supabase
    .from('social_posts')
    .select('id,body,link_in_comment,metadata')
    .eq('organization_id', organizationId)
    .eq('platform', 'linkedin')
    .eq('status', 'approved')
    .lte('scheduled_for', new Date().toISOString());
  if (error || !data) return [];

  return (data as Record<string, unknown>[])
    .map((row) => {
      const meta = (row.metadata ?? {}) as Record<string, unknown>;
      const attempts = typeof meta.attempts === 'number' ? meta.attempts : 0;
      return {
        id: String(row.id),
        body: typeof row.body === 'string' ? row.body : '',
        linkInComment: typeof row.link_in_comment === 'string' ? row.link_in_comment : null,
        attempts,
      };
    })
    .filter((row) => row.attempts < maxAttempts);
}

/** Silence = approval: queued LinkedIn posts within the review window get approved. */
export async function autoApproveDuePosts(windowHours = 24): Promise<number> {
  const organizationId = await getLucidOrganizationId();
  if (!organizationId) return 0;

  const cutoff = new Date(Date.now() + windowHours * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('social_posts')
    .update({ status: 'approved' })
    .eq('organization_id', organizationId)
    .eq('platform', 'linkedin')
    .eq('status', 'queued')
    .lte('scheduled_for', cutoff)
    .select('id');
  if (error || !data) return 0;
  return (data as unknown[]).length;
}

async function mergeMetadata(id: string, patch: Record<string, unknown>): Promise<Record<string, unknown>> {
  const { data } = await supabase.from('social_posts').select('metadata').eq('id', id).maybeSingle();
  const current = ((data as { metadata: Record<string, unknown> | null } | null)?.metadata ?? {}) as Record<string, unknown>;
  return { ...current, ...patch };
}

export async function recordPosted(id: string, input: { postUrl: string; postUrn: string; firstCommentPosted: boolean }): Promise<void> {
  const metadata = await mergeMetadata(id, {
    post_urn: input.postUrn,
    first_comment_posted: input.firstCommentPosted,
    last_error: null,
  });
  const { error } = await supabase
    .from('social_posts')
    .update({ status: 'posted', posted_at: new Date().toISOString(), post_url: input.postUrl, metadata })
    .eq('id', id);
  if (error) throw new Error(error.message);
}

export async function recordPostFailure(id: string, errorMessage: string): Promise<void> {
  const { data } = await supabase.from('social_posts').select('metadata').eq('id', id).maybeSingle();
  const current = ((data as { metadata: Record<string, unknown> | null } | null)?.metadata ?? {}) as Record<string, unknown>;
  const attempts = (typeof current.attempts === 'number' ? current.attempts : 0) + 1;
  await supabase
    .from('social_posts')
    .update({ metadata: { ...current, attempts, last_error: errorMessage.slice(0, 1000) } })
    .eq('id', id);
}

export async function updateEngagement(id: string, input: { reactions: number | null; comments: number | null }): Promise<void> {
  const update: Record<string, unknown> = { metrics_updated_at: new Date().toISOString() };
  if (input.reactions !== null) update.reactions = input.reactions;
  if (input.comments !== null) update.comments = input.comments;
  await supabase.from('social_posts').update(update).eq('id', id);
}

/** Queue + approved LinkedIn posts scheduled within the next N days (for the weekly digest). */
export async function listUpcomingPosts(days = 7): Promise<SocialPost[]> {
  const organizationId = await getLucidOrganizationId();
  if (!organizationId) return [];
  const horizon = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from('social_posts')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('platform', 'linkedin')
    .in('status', ['queued', 'approved'])
    .lte('scheduled_for', horizon)
    .order('scheduled_for', { ascending: true });
  return ((data as Record<string, unknown>[]) ?? []).map(normalizeSocialPost);
}

/** Posts published in the last N days (for the weekly digest performance section). */
export async function listRecentlyPosted(days = 7): Promise<SocialPost[]> {
  const organizationId = await getLucidOrganizationId();
  if (!organizationId) return [];
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { data } = await supabase
    .from('social_posts')
    .select('*')
    .eq('organization_id', organizationId)
    .eq('platform', 'linkedin')
    .eq('status', 'posted')
    .gte('posted_at', since)
    .order('posted_at', { ascending: false });
  return ((data as Record<string, unknown>[]) ?? []).map(normalizeSocialPost);
}
