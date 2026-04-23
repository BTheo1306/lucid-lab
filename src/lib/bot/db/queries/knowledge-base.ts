import { supabase } from '../supabase';

export interface KnowledgeBaseEntry {
  id: string;
  category: string;
  topic: string;
  content: string;
  language: string;
  active: boolean;
  created_at: string;
}

export async function findKnowledgeEntries(
  category?: string,
  language = 'fr',
): Promise<KnowledgeBaseEntry[]> {
  let query = supabase
    .from('ai_knowledge_base')
    .select('*')
    .eq('active', true)
    .eq('language', language);

  if (category) query = query.eq('category', category);

  const { data, error } = await query.order('category').order('topic');
  if (error) throw error;
  return (data ?? []) as KnowledgeBaseEntry[];
}

export async function searchKnowledgeBase(
  searchTerms: string[],
  language = 'fr',
): Promise<KnowledgeBaseEntry[]> {
  const sanitized = searchTerms
    .map((t) => t.replace(/[^\w\s]/g, '').trim())
    .filter((t) => t.length > 0);

  if (sanitized.length === 0) return [];

  const conditions = sanitized
    .map((term) => `topic.ilike.%${term}%,content.ilike.%${term}%`)
    .join(',');

  const { data, error } = await supabase
    .from('ai_knowledge_base')
    .select('*')
    .eq('active', true)
    .eq('language', language)
    .or(conditions);

  if (error) throw error;
  return (data ?? []) as KnowledgeBaseEntry[];
}

export async function upsertKnowledgeEntry(
  entry: Omit<KnowledgeBaseEntry, 'id' | 'created_at'>,
): Promise<KnowledgeBaseEntry> {
  const { data, error } = await supabase
    .from('ai_knowledge_base')
    .upsert(entry, { onConflict: 'category,topic,language' })
    .select()
    .single();

  if (error) throw error;
  return data as KnowledgeBaseEntry;
}
