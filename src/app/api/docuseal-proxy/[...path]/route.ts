import { NextRequest } from 'next/server';
import { config } from '@/lib/bot/config';

export const dynamic = 'force-dynamic';

const fallbackDocuSealOrigin = 'https://docuseal-production-3e6b.up.railway.app';

function docuSealOrigin(): string {
  const configured = process.env['DOCUSEAL_PROXY_ORIGIN'] || config.docusealApiBaseUrl;
  if (!configured) return fallbackDocuSealOrigin;
  const url = new URL(configured);
  if (url.hostname === 'sign.lucid-lab.fr') return fallbackDocuSealOrigin;
  return url.origin;
}

function proxyTargetUrl(request: NextRequest, path: string[]): string {
  const url = new URL(request.url);
  const target = new URL(`/${path.join('/')}`, docuSealOrigin());
  target.search = url.search;
  return target.toString();
}

function proxiedRequestHeaders(request: NextRequest): Headers {
  const upstreamOrigin = docuSealOrigin();
  const headers = new Headers(request.headers);
  headers.set('host', new URL(upstreamOrigin).host);
  headers.set('x-forwarded-host', 'sign.lucid-lab.fr');
  headers.set('x-forwarded-proto', 'https');
  headers.set('x-forwarded-port', '443');

  // Rewrite Origin/Referer so Rails CSRF origin check passes on the upstream server.
  // The CSRF token (authenticity_token) is still verified — only the origin header is normalised.
  const origin = headers.get('origin');
  if (origin) headers.set('origin', upstreamOrigin);
  const referer = headers.get('referer');
  if (referer) {
    try {
      const refUrl = new URL(referer);
      refUrl.hostname = new URL(upstreamOrigin).hostname;
      refUrl.protocol = new URL(upstreamOrigin).protocol;
      refUrl.port = new URL(upstreamOrigin).port;
      headers.set('referer', refUrl.toString());
    } catch {
      headers.delete('referer');
    }
  }

  headers.delete('content-length');
  headers.delete('accept-encoding');
  return headers;
}

function proxiedResponseHeaders(upstreamHeaders: Headers): Headers {
  const headers = new Headers(upstreamHeaders);
  headers.delete('content-encoding');
  headers.delete('content-length');
  headers.delete('transfer-encoding');

  const location = headers.get('location');
  if (location) {
    const origin = docuSealOrigin();
    headers.set('location', location.replace(origin, 'https://sign.lucid-lab.fr'));
  }

  return headers;
}

export async function proxyDocuSeal(request: NextRequest, path: string[]): Promise<Response> {
  const method = request.method.toUpperCase();
  const body = method === 'GET' || method === 'HEAD' ? undefined : await request.arrayBuffer();
  const upstream = await fetch(proxyTargetUrl(request, path), {
    method,
    headers: proxiedRequestHeaders(request),
    body,
    redirect: 'manual',
  });

  return new Response(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: proxiedResponseHeaders(upstream.headers),
  });
}

export async function GET(request: NextRequest, context: { params: Promise<{ path?: string[] }> }): Promise<Response> {
  const params = await context.params;
  return proxyDocuSeal(request, params.path ?? []);
}

export async function HEAD(request: NextRequest, context: { params: Promise<{ path?: string[] }> }): Promise<Response> {
  const params = await context.params;
  return proxyDocuSeal(request, params.path ?? []);
}

export async function OPTIONS(request: NextRequest, context: { params: Promise<{ path?: string[] }> }): Promise<Response> {
  const params = await context.params;
  return proxyDocuSeal(request, params.path ?? []);
}

export async function POST(request: NextRequest, context: { params: Promise<{ path?: string[] }> }): Promise<Response> {
  const params = await context.params;
  return proxyDocuSeal(request, params.path ?? []);
}

export async function PUT(request: NextRequest, context: { params: Promise<{ path?: string[] }> }): Promise<Response> {
  const params = await context.params;
  return proxyDocuSeal(request, params.path ?? []);
}

export async function PATCH(request: NextRequest, context: { params: Promise<{ path?: string[] }> }): Promise<Response> {
  const params = await context.params;
  return proxyDocuSeal(request, params.path ?? []);
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ path?: string[] }> }): Promise<Response> {
  const params = await context.params;
  return proxyDocuSeal(request, params.path ?? []);
}
