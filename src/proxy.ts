import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

import { ADMIN_HOSTNAMES } from '@/lib/admin/urls';

const PORTAL_HOSTNAMES = new Set(['client.lucid-lab.fr', 'client.localhost']);
const APEX_HOSTNAMES = new Set(['lucid-lab.fr', 'www.lucid-lab.fr']);

/**
 * Root-level static files that keep being served from /public on the admin
 * subdomain. Deliberately an allowlist rather than the portal's extension regex
 * (/\.[a-zA-Z0-9]+$/): the brand guide injects `/brand-asset/<file>.png` URLs,
 * which an extension test would wrongly pass through to a route that only
 * exists under /admin, 404-ing every image of the guide.
 */
const ADMIN_STATIC_PATHS = new Set([
  '/favicon.ico',
  '/icon.png',
  '/logo.png',
  '/robots.txt',
]);

function portalBaseUrl(): string {
  return process.env.PORTAL_BASE_URL || 'https://client.lucid-lab.fr';
}

/**
 * Host routing (sign + client subdomains) and pathname header injection so
 * server components (e.g. the root layout) can read the current path via
 * `headers()` to determine the active locale and set `<html lang>`.
 */
export function proxy(request: NextRequest) {
  const host = request.headers.get('host')?.toLowerCase();
  const hostname = host?.split(':')[0] ?? '';
  const { pathname } = request.nextUrl;

  if (hostname === 'sign.lucid-lab.fr' && !pathname.startsWith('/api/docuseal-proxy')) {
    const proxiedUrl = request.nextUrl.clone();
    proxiedUrl.pathname = `/api/docuseal-proxy${pathname}`;
    return NextResponse.rewrite(proxiedUrl);
  }

  // Client portal subdomain: rewrite /x to /portal/x. Assets, API routes and
  // already-prefixed paths pass through untouched.
  if (PORTAL_HOSTNAMES.has(hostname)) {
    const isPassthrough =
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api') ||
      pathname.startsWith('/portal') ||
      /\.[a-zA-Z0-9]+$/.test(pathname);

    const requestHeaders = new Headers(request.headers);
    let response: NextResponse;

    if (isPassthrough) {
      requestHeaders.set('x-pathname', pathname);
      response = NextResponse.next({ request: { headers: requestHeaders } });
    } else {
      const proxiedUrl = request.nextUrl.clone();
      proxiedUrl.pathname = pathname === '/' ? '/portal' : `/portal${pathname}`;
      requestHeaders.set('x-pathname', proxiedUrl.pathname);
      response = NextResponse.rewrite(proxiedUrl, { request: { headers: requestHeaders } });
    }

    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return response;
  }

  // Admin subdomain: rewrite /x to /admin/x, mirroring the portal above.
  if (ADMIN_HOSTNAMES.has(hostname)) {
    // A leftover /admin path lands here (a redirect or href we missed). 308 to
    // the clean URL rather than passing it through: it keeps a single canonical
    // URL, self-corrects in the address bar, and the miss stays observable as a
    // 308 on /admin/* in the logs instead of silently working forever.
    if (pathname === '/admin' || pathname.startsWith('/admin/')) {
      const target = request.nextUrl.clone();
      target.pathname = pathname.replace(/^\/admin/, '') || '/';
      return NextResponse.redirect(target, 308);
    }

    const isPassthrough =
      pathname.startsWith('/_next') ||
      pathname.startsWith('/api') ||
      ADMIN_STATIC_PATHS.has(pathname);

    const requestHeaders = new Headers(request.headers);
    let response: NextResponse;

    if (isPassthrough) {
      requestHeaders.set('x-pathname', pathname);
      response = NextResponse.next({ request: { headers: requestHeaders } });
    } else {
      const proxiedUrl = request.nextUrl.clone();
      proxiedUrl.pathname = pathname === '/' ? '/admin' : `/admin${pathname}`;
      requestHeaders.set('x-pathname', proxiedUrl.pathname);
      response = NextResponse.rewrite(proxiedUrl, { request: { headers: requestHeaders } });
    }

    response.headers.set('X-Robots-Tag', 'noindex, nofollow');
    return response;
  }

  // The portal lives on its own subdomain: redirect direct /portal hits on the
  // apex only, so Vercel previews (*.vercel.app) keep serving /portal directly.
  if (APEX_HOSTNAMES.has(hostname) && (pathname === '/portal' || pathname.startsWith('/portal/'))) {
    const target = new URL(pathname.replace(/^\/portal/, '') || '/', portalBaseUrl());
    target.search = request.nextUrl.search;
    return NextResponse.redirect(target, 308);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  // Run broadly so the DocuSeal signing subdomain can proxy assets and form POSTs.
  matcher: ['/:path*'],
};
