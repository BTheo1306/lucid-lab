import { getAllowedOrigins } from '../config';
import { logSecurityEvent } from '../db/queries/security-audit';
import { hashIp } from '../utils/crypto';
import { getClientIp } from '../utils/request';

/**
 * Returns true if the request origin is allowlisted.
 * Logs rejections to the security audit trail.
 */
export async function checkOrigin(req: Request): Promise<boolean> {
  const origin = req.headers.get('origin');
  const allowed = getAllowedOrigins();

  // Same-origin GETs and server-to-server calls may have no Origin header.
  if (!origin) {
    const requestOrigin = new URL(req.url).origin;
    return allowed.includes('*') || allowed.includes(requestOrigin);
  }
  if (allowed.includes('*')) return true;
  if (allowed.includes(origin)) return true;

  await logSecurityEvent({
    event_type: 'origin_rejected',
    details: { origin, allowed },
    ip_hash: hashIp(getClientIp(req)),
  });
  return false;
}

export function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = getAllowedOrigins();
  const allowOrigin = origin && (allowed.includes('*') || allowed.includes(origin)) ? origin : allowed[0] ?? '';

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Session-Id, X-Turnstile-Token',
    'Access-Control-Max-Age': '86400',
  };
}
