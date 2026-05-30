import 'server-only';

import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin/auth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request): Promise<NextResponse> {
  if (!(await isAdminAuthenticated())) {
    const loginUrl = new URL('/admin/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  const filePath = path.join(process.cwd(), 'lucid-lab-brand/00-overview/charte-graphique.html');
  const content = await readFile(filePath, 'utf-8');

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'X-Frame-Options': 'SAMEORIGIN',
      'Cache-Control': 'no-store',
    },
  });
}
