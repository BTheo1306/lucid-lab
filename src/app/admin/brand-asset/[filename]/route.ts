import 'server-only';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin/auth';

export const dynamic = 'force-dynamic';

const ALLOWED_EXTENSIONS = new Set(['.html', '.png', '.svg', '.jpg', '.jpeg', '.gif', '.webp']);

const CONTENT_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ filename: string }> }
): Promise<NextResponse> {
  if (!(await isAdminAuthenticated())) {
    const loginUrl = new URL('/admin/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  const { filename } = await params;

  // Block path traversal
  if (!filename || filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
    return new NextResponse('Not found', { status: 404 });
  }

  const ext = path.extname(filename).toLowerCase();
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return new NextResponse('Not found', { status: 404 });
  }

  const filePath = path.join(process.cwd(), 'lucid-lab-brand', '05-digital', filename);
  const mimeType = CONTENT_TYPES[ext] ?? 'application/octet-stream';

  let buf: Buffer;
  try {
    buf = await readFile(filePath);
  } catch {
    return new NextResponse('Not found', { status: 404 });
  }

  const blob = new Blob([buf], { type: mimeType });

  return new NextResponse(blob, {
    headers: {
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
