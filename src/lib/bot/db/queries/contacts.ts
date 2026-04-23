import { supabase } from '../supabase';

export interface Contact {
  id: string;
  session_id: string;
  email: string | null;
  first_name: string | null;
  last_name: string | null;
  company: string | null;
  language: string;
  source: string;
  visitor_ip_hash: string | null;
  user_agent: string | null;
  marketing_consent: boolean;
  marketing_consent_at: string | null;
  privacy_notice_shown: boolean;
  privacy_notice_shown_at: string | null;
  deletion_requested_at: string | null;
  deletion_completed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type ContactInsert = Pick<Contact, 'session_id'> &
  Partial<Omit<Contact, 'id' | 'created_at' | 'updated_at' | 'session_id'>>;

export async function findContactBySessionId(sessionId: string): Promise<Contact | null> {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('session_id', sessionId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function findContactById(id: string): Promise<Contact | null> {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function findContactByEmail(email: string): Promise<Contact | null> {
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('email', email.toLowerCase())
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createContact(contact: ContactInsert): Promise<Contact> {
  const { data, error } = await supabase
    .from('contacts')
    .insert(contact)
    .select()
    .single();

  if (error) throw error;
  return data as Contact;
}

export async function upsertContactBySessionId(contact: ContactInsert): Promise<Contact> {
  const { data, error } = await supabase
    .from('contacts')
    .upsert(contact, { onConflict: 'session_id' })
    .select()
    .single();

  if (error) throw error;
  return data as Contact;
}

export async function updateContact(
  id: string,
  updates: Partial<Omit<Contact, 'id' | 'created_at'>>,
): Promise<Contact> {
  const { data, error } = await supabase
    .from('contacts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Contact;
}

export async function anonymizeContact(id: string): Promise<void> {
  const { error } = await supabase
    .from('contacts')
    .update({
      email: null,
      first_name: null,
      last_name: null,
      company: null,
      visitor_ip_hash: null,
      user_agent: null,
      deletion_completed_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw error;
}
