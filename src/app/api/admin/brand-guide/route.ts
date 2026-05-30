import 'server-only';

import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin/auth';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.redirect(new URL('/admin/login', 'http://localhost'));
  }

  const filePath = path.join(process.cwd(), 'lucid-lab-brand/00-overview/charte-graphique.html');

  try {
    const content = await readFile(filePath, 'utf-8');
    return new NextResponse(content, {
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        // Allow same-origin iframe
        'X-Frame-Options': 'SAMEORIGIN',
      },
    });
  } catch {
    return new NextResponse('<p style="font-family:sans-serif;padding:2rem">Fichier de charte introuvable. Lance <code>node scripts/gen-brandbook-v2.mjs</code> pour le générer.</p>', {
      status: 404,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }
}
