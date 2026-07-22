/**
 * Admin host + URL helpers.
 *
 * Deliberately a leaf module: no 'server-only', no next/headers, no import of
 * `config`. It has to stay importable from `src/proxy.ts` (edge runtime) *and*
 * from server code, so the host list and the base URL live in exactly one
 * place. This is what `PORTAL_BASE_URL` failed to do: it is duplicated between
 * `src/proxy.ts` and `src/lib/bot/config.ts`.
 */

export const ADMIN_HOSTNAMES = new Set(['admin.lucid-lab.fr', 'admin.localhost']);

/** Absolute origin of the admin, for links that leave the app (emails, Telegram). */
export function adminBaseUrl(): string {
  return process.env.ADMIN_BASE_URL || 'https://admin.lucid-lab.fr';
}

/** True when the request is served on the admin subdomain (port-insensitive). */
export function isAdminHost(host: string | null | undefined): boolean {
  const hostname = (host ?? '').toLowerCase().split(':')[0];
  if (!hostname) return false;
  if (ADMIN_HOSTNAMES.has(hostname)) return true;
  try {
    return hostname === new URL(adminBaseUrl()).hostname;
  } catch {
    return false;
  }
}
