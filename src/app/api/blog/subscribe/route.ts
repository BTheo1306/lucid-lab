import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';

import { checkOrigin, corsHeaders } from '@/lib/bot/middleware/origin-check';
import { checkRateLimit } from '@/lib/bot/middleware/rate-limiter';
import {
  createContact,
  findContactByEmail,
  updateContact,
} from '@/lib/bot/db/queries/contacts';
import { hashIp } from '@/lib/bot/utils/crypto';
import { getClientIp } from '@/lib/bot/utils/request';

export const runtime = 'nodejs';
export const maxDuration = 10;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST /api/blog/subscribe
 * Lightweight newsletter signup from blog posts. Stores the email in the existing
 * `contacts` table with `source='blog_newsletter'`. No email is sent in v1 — we
 * just record consent so we can ship a digest later.
 */
export async function POST(req: Request) {
  const origin = req.headers.get('origin');
  if (!(await checkOrigin(req))) {
    return NextResponse.json(
      { error: 'Origin not allowed' },
      { status: 403, headers: corsHeaders(origin) },
    );
  }

  const ipHash = hashIp(getClientIp(req));

  let body: { email?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON' },
      { status: 400, headers: corsHeaders(origin) },
    );
  }

  const email = body.email?.trim().toLowerCase();
  if (!email || !EMAIL_RE.test(email)) {
    return NextResponse.json(
      { error: 'Email invalide.' },
      { status: 400, headers: corsHeaders(origin) },
    );
  }

  // 5 signups per IP / 10 min — generous, but stops obvious abuse.
  const rl = await checkRateLimit(`ip:${ipHash}:blog_subscribe`, {
    limit: 5,
    windowSec: 600,
    ipHash,
  });
  if (!rl.allowed) {
    return NextResponse.json(
      { error: 'Trop de tentatives, réessayez plus tard.' },
      { status: 429, headers: corsHeaders(origin) },
    );
  }

  const now = new Date().toISOString();
  const existing = await findContactByEmail(email);

  if (existing) {
    if (!existing.marketing_consent) {
      await updateContact(existing.id, {
        marketing_consent: true,
        marketing_consent_at: now,
      });
    }
  } else {
    await createContact({
      session_id: randomUUID(),
      email,
      language: 'fr',
      source: 'blog_newsletter',
      marketing_consent: true,
      marketing_consent_at: now,
      visitor_ip_hash: ipHash,
    });
  }

  return NextResponse.json({ ok: true }, { headers: corsHeaders(origin) });
}

export async function OPTIONS(req: Request) {
  return new Response(null, {
    status: 204,
    headers: corsHeaders(req.headers.get('origin')),
  });
}
