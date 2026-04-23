import { supabase } from '../supabase';

export interface Conversation {
  id: string;
  contact_id: string;
  status: 'active' | 'escalated' | 'closed';
  escalation_reason: string | null;
  started_at: string;
  last_message_at: string;
  escalated_at: string | null;
  closed_at: string | null;
}

export type ConversationInsert = Pick<Conversation, 'contact_id'> &
  Partial<Omit<Conversation, 'id' | 'started_at' | 'last_message_at' | 'contact_id'>>;

export async function findActiveConversation(contactId: string): Promise<Conversation | null> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('contact_id', contactId)
    .neq('status', 'closed')
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function findConversationById(id: string): Promise<Conversation | null> {
  const { data, error } = await supabase
    .from('conversations')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createConversation(conversation: ConversationInsert): Promise<Conversation> {
  const { data, error } = await supabase
    .from('conversations')
    .insert(conversation)
    .select()
    .single();

  if (error) throw error;
  return data as Conversation;
}

export async function updateConversation(
  id: string,
  updates: Partial<Omit<Conversation, 'id' | 'started_at'>>,
): Promise<Conversation> {
  const { data, error } = await supabase
    .from('conversations')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Conversation;
}

export async function escalateConversation(
  id: string,
  reason: string,
): Promise<Conversation> {
  return updateConversation(id, {
    status: 'escalated',
    escalation_reason: reason,
    escalated_at: new Date().toISOString(),
  });
}
