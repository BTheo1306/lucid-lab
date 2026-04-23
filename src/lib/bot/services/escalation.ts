import { escalateConversation, type Conversation } from '../db/queries/conversations';
import { getConversationMessages } from '../db/queries/messages';
import { sendEscalationEmail } from '../integrations/email-client';
import type { Contact } from '../db/queries/contacts';

export async function escalateToHuman(
  contact: Contact,
  conversation: Conversation,
  reason: string,
): Promise<void> {
  await escalateConversation(conversation.id, reason);

  const msgs = await getConversationMessages(conversation.id, 30);
  const transcript = msgs.map((m) => ({
    role: m.direction === 'inbound' ? 'Visiteur' : 'Bot',
    content:
      typeof m.content === 'object' && m.content !== null && 'text' in m.content
        ? String((m.content as { text: unknown }).text)
        : JSON.stringify(m.content),
  }));

  try {
    await sendEscalationEmail({
      contactEmail: contact.email,
      reason,
      transcript,
      conversationId: conversation.id,
    });
  } catch (err) {
    console.error('[escalation] email failed:', err);
  }
}
