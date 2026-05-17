import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Inject the current request pathname into the response headers so server
 * components (e.g. the root layout) can read it via `headers()` to determine
 * the active locale and set `<html lang>` accordingly.
 */
export function proxy(request: NextRequest) {
  const host = request.headers.get('host')?.toLowerCase();
  if (host === 'sign.lucid-lab.fr' && !request.nextUrl.pathname.startsWith('/api/docuseal-proxy')) {
    const proxiedUrl = request.nextUrl.clone();
    proxiedUrl.pathname = `/api/docuseal-proxy${request.nextUrl.pathname}`;
    return NextResponse.rewrite(proxiedUrl);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', request.nextUrl.pathname);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  // Run broadly so the DocuSeal signing subdomain can proxy assets and form POSTs.
  matcher: ['/:path*'],
};
