import { findKnowledgeEntries, searchKnowledgeBase } from '../db/queries/knowledge-base';

export async function getRelevantKnowledge(query: string, language = 'fr'): Promise<string> {
  const terms = query
    .toLowerCase()
    .split(/\s+/)
    .filter((w) => w.length > 3);

  if (terms.length === 0) return '';

  const entries = await searchKnowledgeBase(terms, language);
  if (entries.length === 0) return '';

  return entries.map((e) => `[${e.category}] ${e.topic}: ${e.content}`).join('\n\n');
}

export async function getKnowledgeByCategory(category: string, language = 'fr'): Promise<string> {
  const entries = await findKnowledgeEntries(category, language);
  if (entries.length === 0) return '';
  return entries.map((e) => `${e.topic}: ${e.content}`).join('\n\n');
}
