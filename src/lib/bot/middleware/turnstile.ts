import { config } from '../config';

/**
 * Verify a Cloudflare Turnstile token server-side.
 * If no secret is configured, we allow (useful for local dev) — log a warning.
 */
export async function verifyTurnstile(token: string | null, remoteIp?: string): Promise<boolean> {
  if (!config.turnstileSecret) {
    console.warn('[turnstile] TURNSTILE_SECRET not set — skipping verification');
    return true;
  }
  if (!token) return false;

  const body = new URLSearchParams();
  body.set('secret', config.turnstileSecret);
  body.set('response', token);
  if (remoteIp) body.set('remoteip', remoteIp);

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
    });
    if (!res.ok) return false;
    const data = (await res.json()) as { success: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}
