import { NextResponse } from 'next/server';
import { checkOrigin, corsHeaders } from '@/lib/bot/middleware/origin-check';
import { checkRateLimit } from '@/lib/bot/middleware/rate-limiter';
import { findContactBySessionId } from '@/lib/bot/db/queries/contacts';
import { findConversationById } from '@/lib/bot/db/queries/conversations';
import { createMessage, getConversationMessages } from '@/lib/bot/db/queries/messages';
import { processWithAI } from '@/lib/bot/services/ai';
import { detectLanguage } from '@/lib/bot/utils/language';
import { updateContact } from '@/lib/bot/db/queries/contacts';
import { hashIp } from '@/lib/bot/utils/crypto';
import { getClientIp } from '@/lib/bot/utils/request';
import { assertProviderKey, config } from '@/lib/bot/config';

export const runtime = 'nodejs';
export const maxDuration = 60;

/** POST /api/bot/chat — Send a user message and receive the bot's reply. */
export async function POST(req: Request) {
  const origin = req.headers.get('origin');

  if (!(await checkOrigin(req))) {
    return NextResponse.json({ error: 'Origin not allowed' }, { status: 403, headers: corsHeaders(origin) });
  }

  assertProviderKey();

  const ipHash = hashIp(getClientIp(req));

  let body: { session_id?: string; conversation_id?: string; message?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400, headers: corsHeaders(origin) });
  }

  const sessionId = body.session_id?.trim();
  const conversationId = body.conversation_id?.trim();
  const userMessage = body.message?.trim();

  if (!sessionId || !conversationId || !userMessage) {
    return NextResponse.json(
      { error: 'session_id, conversation_id and message required' },
      { status: 400, headers: corsHeaders(origin) },
    );
  }
  if (userMessage.length > 4000) {
    return NextResponse.json({ error: 'Message too long' }, { status: 400, headers: corsHeaders(origin) });
  }

  const contact = await findContactBySessionId(sessionId);
  if (!contact) {
    return NextResponse.json({ error: 'Unknown session' }, { status: 404, headers: corsHeaders(origin) });
  }

  // Dual rate limit: per-session + per-ip
  const rl1 = await checkRateLimit(`session:${sessionId}`, {
    limit: config.rateLimitMax,
    windowSec: config.rateLimitWindowSec,
    contactId: contact.id,
    ipHash,
  });
  const rl2 = await checkRateLimit(`ip:${ipHash}:chat`, {
    limit: config.rateLimitMax * 3,
    windowSec: config.rateLimitWindowSec,
    contactId: contact.id,
    ipHash,
  });
  if (!rl1.allowed || !rl2.allowed) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429, headers: corsHeaders(origin) });
  }

  const conversation = await findConversationById(conversationId);
  if (!conversation || conversation.contact_id !== contact.id) {
    return NextResponse.json({ error: 'Conversation not found' }, { status: 404, headers: corsHeaders(origin) });
  }

  // Detect language on first inbound if unknown
  if (!contact.language || contact.language === 'fr') {
    const detected = detectLanguage(userMessage);
    if (detected !== contact.language) {
      await updateContact(contact.id, { language: detected });
      contact.language = detected;
    }
  }

  // Save inbound message
  await createMessage({
    conversation_id: conversation.id,
    direction: 'inbound',
    content_type: 'text',
    content: { text: userMessage },
    ai_metadata: null,
  });

  const recent = await getConversationMessages(conversation.id, 20);

  const { text, tokensUsed } = await processWithAI(contact, conversation, recent, userMessage);

  await createMessage({
    conversation_id: conversation.id,
    direction: 'outbound_bot',
    content_type: 'text',
    content: { text },
    ai_metadata: { tokens: tokensUsed, provider: config.aiProvider, model: config.aiModel },
  });

  return NextResponse.json(
    { reply: text, tokens_used: tokensUsed },
    { headers: corsHeaders(origin) },
  );
}

export async function OPTIONS(req: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(req.headers.get('origin')) });
}
