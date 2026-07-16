import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PORTAL_HOSTNAMES = new Set(['client.lucid-lab.fr', 'client.localhost']);
const APEX_HOSTNAMES = new Set(['lucid-lab.fr', 'www.lucid-lab.fr']);

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
  // Only Next's own static assets are excluded: they never transit through that
  // proxy, and skipping them avoids invoking the edge function on every file.
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
