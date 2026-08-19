import { config } from '../config';

/**
 * Push Telegram sortant vers l'equipe (notifications tickets portail).
 *
 * Independant du webhook du COO agent : ici l'app ecrit sans avoir ete
 * sollicitee, il faut donc un chat de destination explicite
 * (TELEGRAM_COO_NOTIFY_CHAT_ID, repli sur le premier id autorise du COO).
 * Ne throw jamais et no-op si rien n'est configure : une notification perdue
 * ne doit jamais faire echouer l'action metier qui l'a declenchee.
 */

function resolveNotifyChatId(): string {
  if (config.telegramCooNotifyChatId) return config.telegramCooNotifyChatId;
  return (
    config.telegramCooAllowedChatIds
      .split(',')
      .map((value) => value.trim())
      .find((value) => value.length > 0) ?? ''
  );
}

export async function sendTeamTelegramNotification(text: string): Promise<void> {
  const chatId = resolveNotifyChatId();
  if (!config.telegramCooBotToken || !chatId) return;

  try {
    const response = await fetch(`https://api.telegram.org/bot${config.telegramCooBotToken}/sendMessage`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
    });
    if (!response.ok) {
      console.error(`[telegram] notification failed: ${response.status} ${await response.text()}`);
    }
  } catch (error) {
    console.error('[telegram] notification failed:', error instanceof Error ? error.message : error);
  }
}
