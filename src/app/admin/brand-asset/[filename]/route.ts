import 'server-only';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { NextResponse } from 'next/server';
import { adminRedirectUrl, isAdminAuthenticated } from '@/lib/admin/auth';

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
    return NextResponse.redirect(adminRedirectUrl(request, '/login'));
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

  // Slice out a plain ArrayBuffer (avoids SharedArrayBuffer typing issues)
  const arrayBuffer = buf.buffer.slice(
    buf.byteOffset,
    buf.byteOffset + buf.byteLength
  ) as ArrayBuffer;
  const blob = new Blob([arrayBuffer], { type: mimeType });

  return new NextResponse(blob, {
    headers: {
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
    },
  });
}
