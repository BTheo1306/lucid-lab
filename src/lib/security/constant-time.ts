import 'server-only';

import { createHash, timingSafeEqual } from 'node:crypto';

/**
 * Constant-time string equality. Hashing both sides first keeps the compare
 * length-independent, so neither the value nor its length leaks via timing.
 * Returns false when either side is empty (fail closed).
 */
export function safeEqual(a: string | null | undefined, b: string | null | undefined): boolean {
  if (!a || !b) return false;
  const left = createHash('sha256').update(a).digest();
  const right = createHash('sha256').update(b).digest();
  return timingSafeEqual(left, right);
}

/**
 * Constant-time "Authorization: Bearer <secret>" check. Fails closed when the
 * secret is unset, so a route can never authorize against an empty secret.
 */
export function bearerMatches(header: string | null | undefined, secret: string): boolean {
  if (!secret) return false;
  return safeEqual(header, `Bearer ${secret}`);
}
