import { NextResponse } from 'next/server';
import { randomUUID } from 'node:crypto';
import { checkOrigin, corsHeaders } from '@/lib/bot/middleware/origin-check';
import { verifyTurnstile } from '@/lib/bot/middleware/turnstile';
import { checkRateLimit } from '@/lib/bot/middleware/rate-limiter';
import { findContactBySessionId, createContact } from '@/lib/bot/db/queries/contacts';
import { findActiveConversation, createConversation } from '@/lib/bot/db/queries/conversations';
import { hashIp } from '@/lib/bot/utils/crypto';
import { getClientIp } from '@/lib/bot/utils/request';

export const runtime = 'nodejs';
export const maxDuration = 30;

/** POST /api/bot/session — Initialise or resume a visitor session. */
export async function POST(req: Request) {
  const origin = req.headers.get('origin');

  if (!(await checkOrigin(req))) {
    return NextResponse.json({ error: 'Origin not allowed' }, { status: 403, headers: corsHeaders(origin) });
  }

  const ip = getClientIp(req);
  const ipHash = hashIp(ip);

  let body: { session_id?: string; turnstile_token?: string; language?: string } = {};
  try {
    body = await req.json();
  } catch {
    // empty body allowed
  }

  // Rate-limit only NEW session creation, not resumptions.
  // A resumption is when session_id is provided and the contact exists in DB.
  let contact = body.session_id ? await findContactBySessionId(body.session_id) : null;
  const isResumption = !!contact;

  if (!isResumption) {
    const rate = await checkRateLimit(`ip:${ipHash}:session`, {
      limit: 20,
      windowSec: 3600,
      ipHash,
    });
    if (!rate.allowed) {
      return NextResponse.json({ error: 'Too many sessions' }, { status: 429, headers: corsHeaders(origin) });
    }
  }

  const ok = await verifyTurnstile(body.turnstile_token ?? null, ip);
  if (!ok) {
    return NextResponse.json({ error: 'Turnstile verification failed' }, { status: 401, headers: corsHeaders(origin) });
  }

  let sessionId = body.session_id;

  if (!contact) {
    sessionId = randomUUID();
    contact = await createContact({
      session_id: sessionId,
      language: body.language === 'en' ? 'en' : 'fr',
      source: 'chat_widget',
      visitor_ip_hash: ipHash,
      user_agent: req.headers.get('user-agent')?.slice(0, 500) ?? null,
      privacy_notice_shown: true,
      privacy_notice_shown_at: new Date().toISOString(),
    });
  }

  let conversation = await findActiveConversation(contact.id);
  if (!conversation) {
    conversation = await createConversation({ contact_id: contact.id });
  }

  return NextResponse.json(
    {
      session_id: sessionId,
      conversation_id: conversation.id,
      language: contact.language,
      status: conversation.status,
    },
    { headers: corsHeaders(origin) },
  );
}

export async function OPTIONS(req: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(req.headers.get('origin')) });
}
