import { createHash, randomBytes } from 'node:crypto';
import { config } from '../config';

/** Generate a cryptographically strong random token (URL-safe base64). */
export function generateSecureToken(bytes = 32): string {
  return randomBytes(bytes).toString('base64url');
}

/**
 * Hash a visitor IP with a project-specific salt. Never store raw IPs.
 * Returns a stable hex digest usable for rate-limit keys and audit trails.
 */
export function hashIp(ip: string): string {
  return createHash('sha256')
    .update(ip + '|' + config.ipHashSalt)
    .digest('hex');
}

/** Generic sha256 hex digest — used for dedup keys etc. */
export function sha256Hex(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}
