import 'server-only';

import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { NextResponse } from 'next/server';
import { adminBasePath, adminRedirectUrl, isAdminAuthenticated } from '@/lib/admin/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<NextResponse> {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.redirect(adminRedirectUrl(request, '/login'));
  }

  const filePath = path.join(process.cwd(), 'lucid-lab-brand/00-overview/charte-graphique.html');
  const raw = await readFile(filePath, 'utf-8');

  // Rewrite relative brand asset links so they resolve through the admin route
  // handler. base is '' on the subdomain (the proxy rewrites /brand-asset/* to
  // /admin/brand-asset/*) and '/admin' on direct access.
  const base = await adminBasePath();
  const content = raw.replaceAll('../05-digital/', `${base}/brand-asset/`);

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Frame-Options': 'SAMEORIGIN',
      'Cache-Control': 'no-store',
    },
  });
}
