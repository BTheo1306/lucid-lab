import { supabase } from '../supabase';

export interface Message {
  id: string;
  conversation_id: string;
  direction: 'inbound' | 'outbound_bot';
  content_type: string;
  content: Record<string, unknown>;
  ai_metadata: Record<string, unknown> | null;
  created_at: string;
}

export type MessageInsert = Omit<Message, 'id' | 'created_at'>;

export async function createMessage(message: MessageInsert): Promise<Message> {
  const { data, error } = await supabase
    .from('messages')
    .insert(message)
    .select()
    .single();

  if (error) throw error;
  return data as Message;
}

export async function getConversationMessages(
  conversationId: string,
  limit = 20,
): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('conversation_id', conversationId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return ((data ?? []) as Message[]).reverse();
}

export async function getConversationMessageCount(conversationId: string): Promise<number> {
  const { count, error } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('conversation_id', conversationId);

  if (error) throw error;
  return count ?? 0;
}

export async function deleteMessagesOlderThan(days: number): Promise<number> {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { error, count } = await supabase
    .from('messages')
    .delete({ count: 'exact' })
    .lt('created_at', cutoff);

  if (error) throw error;
  return count ?? 0;
}
