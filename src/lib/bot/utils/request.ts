/**
 * Extracts the client IP from a Next.js request.
 * Prioritises common proxy headers (Vercel uses `x-forwarded-for`).
 */
export function getClientIp(req: Request): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  const realIp = req.headers.get('x-real-ip');
  if (realIp) return realIp;
  return '0.0.0.0';
}
