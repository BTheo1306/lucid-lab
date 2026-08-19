import { NextResponse } from 'next/server';
import { assertProviderKey, config } from '@/lib/bot/config';
import { checkRateLimit } from '@/lib/bot/middleware/rate-limiter';
import { hashIp } from '@/lib/bot/utils/crypto';
import { getClientIp } from '@/lib/bot/utils/request';
import { runPortalAssistant } from '@/lib/portal/assistant';
import { getPortalSession, isPortalReadOnly } from '@/lib/portal/auth';

export const runtime = 'nodejs';
export const maxDuration = 60;

/**
 * POST /api/portal/assistant : un message du client a l'assistant SAV.
 *
 * Auth par le cookie de session du portail (meme host, fetch same-origin ; le
 * proxy laisse passer /api sans reecriture). Pas de CORS : le Content-Type
 * application/json force un preflight, qui echoue pour toute autre origine.
 */
export async function POST(req: Request) {
  const session = await getPortalSession();
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // L'apercu admin voit le widget mais ne chatte pas : un message partirait au
  // nom du client alors qu'il n'a rien ecrit.
  if (isPortalReadOnly(session)) {
    return NextResponse.json(
      { error: 'read_only', message: 'Aperçu lecture seule : le chat est désactivé.' },
      { status: 403 },
    );
  }

  try {
    assertProviderKey();
  } catch {
    return NextResponse.json({ error: 'unavailable' }, { status: 503 });
  }

  let body: { conversation_id?: string; message?: string } = {};
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'invalid_json' }, { status: 400 });
  }

  const message = body.message?.trim();
  if (!message) {
    return NextResponse.json({ error: 'message_required' }, { status: 400 });
  }
  if (message.length > 4000) {
    return NextResponse.json({ error: 'message_too_long' }, { status: 400 });
  }

  const ipHash = hashIp(getClientIp(req));
  const [byContact, byIp] = await Promise.all([
    checkRateLimit(`portal-chat:${session.contactId}`, {
      limit: config.rateLimitMax,
      windowSec: config.rateLimitWindowSec,
      ipHash,
    }),
    checkRateLimit(`ip:${ipHash}:portal-chat`, {
      limit: config.rateLimitMax * 3,
      windowSec: config.rateLimitWindowSec,
      ipHash,
    }),
  ]);
  if (!byContact.allowed || !byIp.allowed) {
    return NextResponse.json({ error: 'rate_limited' }, { status: 429 });
  }

  const result = await runPortalAssistant(session, {
    conversationId: body.conversation_id?.trim() || null,
    message,
  });

  if (!result) {
    return NextResponse.json({ error: 'internal' }, { status: 500 });
  }

  return NextResponse.json({
    reply: result.reply,
    conversation_id: result.conversationId,
    ticket: result.ticket ?? null,
  });
}
