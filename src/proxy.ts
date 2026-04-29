import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Inject the current request pathname into the response headers so server
 * components (e.g. the root layout) can read it via `headers()` to determine
 * the active locale and set `<html lang>` accordingly.
 */
export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', request.nextUrl.pathname);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

export const config = {
  // Run on every page request; skip Next internals, API routes and static assets.
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|logo.png|logo-full.png|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|txt|xml)$).*)'],
};
