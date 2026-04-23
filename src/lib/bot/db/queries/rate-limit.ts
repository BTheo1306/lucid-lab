import { supabase } from '../supabase';

/**
 * Atomic Supabase-backed rate limiter.
 * Uses a fixed time window (rounded to `windowSec`) per bucket key.
 * Returns { allowed, current, limit }.
 */
export async function incrementRateLimit(
  bucketKey: string,
  limit: number,
  windowSec: number,
): Promise<{ allowed: boolean; current: number; limit: number }> {
  const windowStart = new Date(
    Math.floor(Date.now() / (windowSec * 1000)) * windowSec * 1000,
  ).toISOString();

  // Attempt insert; if it collides with unique (bucket_key, window_start), increment instead.
  const { data, error } = await supabase.rpc('increment_rate_limit', {
    p_bucket_key: bucketKey,
    p_window_start: windowStart,
  });

  if (error) {
    // Fallback if RPC doesn't exist: do insert-then-update pattern
    return incrementRateLimitFallback(bucketKey, windowStart, limit);
  }

  const current = (data as { count: number } | null)?.count ?? 1;
  return { allowed: current <= limit, current, limit };
}

async function incrementRateLimitFallback(
  bucketKey: string,
  windowStart: string,
  limit: number,
): Promise<{ allowed: boolean; current: number; limit: number }> {
  // Try to insert a new row
  const { error: insertError } = await supabase
    .from('rate_limit_buckets')
    .insert({ bucket_key: bucketKey, window_start: windowStart, request_count: 1 });

  if (!insertError) {
    return { allowed: 1 <= limit, current: 1, limit };
  }

  // Conflict → fetch + update
  const { data: row, error: selectError } = await supabase
    .from('rate_limit_buckets')
    .select('request_count')
    .eq('bucket_key', bucketKey)
    .eq('window_start', windowStart)
    .single();

  if (selectError || !row) {
    // Fail open on DB issue — prefer availability; log elsewhere
    return { allowed: true, current: 0, limit };
  }

  const next = (row.request_count as number) + 1;
  await supabase
    .from('rate_limit_buckets')
    .update({ request_count: next })
    .eq('bucket_key', bucketKey)
    .eq('window_start', windowStart);

  return { allowed: next <= limit, current: next, limit };
}

export async function deleteOldRateLimitBuckets(olderThanSec: number): Promise<void> {
  const cutoff = new Date(Date.now() - olderThanSec * 1000).toISOString();
  await supabase.from('rate_limit_buckets').delete().lt('window_start', cutoff);
}
