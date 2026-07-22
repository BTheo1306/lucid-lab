import { NextRequest, NextResponse } from 'next/server';
import { handleCooTelegramUpdate, sendTelegramCooMessage, type TelegramUpdate } from '@/lib/admin/agents/coo-agent';
import { config } from '@/lib/bot/config';
import { safeEqual } from '@/lib/security/constant-time';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 30;

function verifyTelegramSecret(request: NextRequest): boolean {
  if (!config.telegramCooWebhookSecret) return false;
  return safeEqual(request.headers.get('x-telegram-bot-api-secret-token'), config.telegramCooWebhookSecret);
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!verifyTelegramSecret(request)) {
    return NextResponse.json({ error: 'Invalid webhook secret' }, { status: 401 });
  }

  let payload: TelegramUpdate;
  try {
    payload = (await request.json()) as TelegramUpdate;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
  }

  try {
    const result = await handleCooTelegramUpdate(payload);
    let replySent = false;
    let replyError: string | null = null;

    if (result.chatId && result.replyText) {
      const telegramResult = await sendTelegramCooMessage(result.chatId, result.replyText);
      replySent = telegramResult.ok;
      replyError = telegramResult.error;
    }

    return NextResponse.json({
      ok: true,
      processed: result.processed,
      authorized: result.authorized,
      run_id: result.runId,
      task_id: result.taskId,
      approval_id: result.approvalId,
      reply_sent: replySent,
      reply_error: replyError,
      reason: result.reason,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Telegram COO webhook error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}