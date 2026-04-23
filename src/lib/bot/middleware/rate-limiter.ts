import { config } from '../config';
import { incrementRateLimit } from '../db/queries/rate-limit';
import { logSecurityEvent } from '../db/queries/security-audit';

export interface RateLimitResult {
  allowed: boolean;
  current: number;
  limit: number;
}

/**
 * Checks and increments a rate-limit bucket. Each bucketKey is independently tracked.
 * Bucket keys: `ip:<hash>`, `session:<uuid>`, `global:<name>`.
 */
export async function checkRateLimit(
  bucketKey: string,
  opts?: { limit?: number; windowSec?: number; contactId?: string | null; ipHash?: string },
): Promise<RateLimitResult> {
  const limit = opts?.limit ?? config.rateLimitMax;
  const windowSec = opts?.windowSec ?? config.rateLimitWindowSec;

  const result = await incrementRateLimit(bucketKey, limit, windowSec);

  if (!result.allowed) {
    await logSecurityEvent({
      contact_id: opts?.contactId ?? null,
      event_type: 'rate_limit_breach',
      details: { bucket_key: bucketKey, current: result.current, limit },
      ip_hash: opts?.ipHash ?? null,
    });
  }

  return result;
}
