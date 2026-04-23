import { NextResponse } from 'next/server';
import { checkOrigin, corsHeaders } from '@/lib/bot/middleware/origin-check';
import { checkRateLimit } from '@/lib/bot/middleware/rate-limiter';
import { findContactBySessionId } from '@/lib/bot/db/queries/contacts';
import { findConversationById } from '@/lib/bot/db/queries/conversations';
import { captureLead } from '@/lib/bot/services/lead';
import { hashIp } from '@/lib/bot/utils/crypto';
import { getClientIp } from '@/lib/bot/utils/request';

export const runtime = 'nodejs';
export const maxDuration = 15;

/** POST /api/bot/lead — Explicit lead-capture from the widget's lead form. */
export async function POST(req: Request) {
  const origin = req.headers.get('origin');
  if (!(await checkOrigin(req))) {
    return NextResponse.json({ error: 'Origin not allowed' }, { status: 403, headers: corsHeaders(origin) });
  }

  const ipHash = hashIp(getClientIp(req));

  let body: {
    session_id?: string;
    conversation_id?: string;
    email?: string;
    first_name?: string;
    company?: string;
    project_brief?: string;
    marketing_consent?: boolean;
  } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400, headers: corsHeaders(origin) });
  }

  if (!body.session_id || !body.conversation_id || !body.email || !body.project_brief) {
    return NextResponse.json(
      { error: 'session_id, conversation_id, email and project_brief required' },
      { status: 400, headers: corsHeaders(origin) },
    );
  }
  if (!body.email.includes('@')) {
    return NextResponse.json({ error: 'Invalid email' }, { status: 400, headers: corsHeaders(origin) });
  }

  const contact = await findContactBySessionId(body.session_id);
  if (!contact) {
    return NextResponse.json({ error: 'Unknown session' }, { status: 404, headers: corsHeaders(origin) });
  }

  const rl = await checkRateLimit(`session:${body.session_id}:lead`, {
    limit: 3,
    windowSec: 600,
    contactId: contact.id,
    ipHash,
  });
  if (!rl.allowed) {
    return NextResponse.json({ error: 'Too many submissions' }, { status: 429, headers: corsHeaders(origin) });
  }

  const conversation = await findConversationById(body.conversation_id);
  if (!conversation || conversation.contact_id !== contact.id) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404, headers: corsHeaders(origin) });
  }

  const lead = await captureLead({
    contact,
    email: body.email,
    firstName: body.first_name,
    company: body.company,
    projectBrief: body.project_brief,
    marketingConsent: Boolean(body.marketing_consent),
    conversationId: conversation.id,
  });

  return NextResponse.json({ ok: true, lead_id: lead.id }, { headers: corsHeaders(origin) });
}

export async function OPTIONS(req: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(req.headers.get('origin')) });
}
