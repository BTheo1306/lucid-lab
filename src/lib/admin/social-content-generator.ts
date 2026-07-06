import 'server-only';

import Anthropic from '@anthropic-ai/sdk';
import { config } from '@/lib/bot/config';

/**
 * Weekly LinkedIn content generation (newsletter-style).
 *
 * One Claude call per week produces the 3 posts of the coming week, each tied
 * to a recurring rubrique so the feed reads like an editorial program rather
 * than isolated posts:
 *   - lundi    "Le decryptage du lundi"  : one AI mechanism explained properly
 *   - mercredi "Sur le terrain"          : a real Lucid-Lab delivery story
 *   - vendredi "Point de vue"            : a clear stance on a live AI debate
 *
 * Posts land as `queued` in the CRM cockpit (silence = approval), so a human
 * still reviews every word before it reaches LinkedIn.
 */

export type LinkedInRubrique = 'decryptage' | 'terrain' | 'point-de-vue';

export interface WeeklySlot {
  /** ISO datetime the post should publish at (scheduled_for). */
  scheduledFor: string;
  rubrique: LinkedInRubrique;
}

export interface GeneratedLinkedInPost {
  scheduledFor: string;
  rubrique: LinkedInRubrique;
  pillar: string;
  hook: string;
  body: string;
}

export interface RecentPostContext {
  hook: string | null;
  pillar: string | null;
}

const RUBRIQUE_LABELS: Record<LinkedInRubrique, string> = {
  decryptage: 'Le décryptage du lundi',
  terrain: 'Sur le terrain',
  'point-de-vue': 'Point de vue',
};

/**
 * The only client stories the generator may use, with the only facts it may
 * state. Anything beyond these facts must be framed as generic ("un client",
 * "une PME") without invented numbers: the human review catches the rest.
 */
const CASE_LIBRARY = `- Universal (agence de voyages) : système de génération de leads automatisé, prospection outbound pilotée par IA.
- Turismo : accompagnement scaling des opérations, automatisation des processus internes.
- Périscope : monitoring et observabilité d'un système en production.
- Un groupe assurantiel et financier belge : roadmap IA, cadrage des cas d'usage et gouvernance (toujours le désigner ainsi, jamais "grand compte financier").
- BSP37 (PME d'Indre-et-Loire, films solaires et sellerie) : refonte de la présence web et des fondations SEO d'un artisan.
- Des PME accompagnées sur un setup Claude + Obsidian : base de connaissance d'entreprise exploitable par l'IA au quotidien.`;

const SYSTEM_PROMPT = `Tu écris les posts LinkedIn hebdomadaires d'Anthony Poirier, cofondateur de Lucid-Lab, une agence française qui livre des systèmes IA en production pour des PME et des grands comptes (pas du conseil, pas des slides).

Objectif : que chaque lecteur termine le post en ayant appris quelque chose de concret qu'il pourra répéter en réunion. Le feed doit se lire comme une newsletter avec des rendez-vous récurrents, pas comme des posts isolés.

Les 3 rubriques hebdomadaires :
1. "Le décryptage du lundi" (rubrique: decryptage) : un mécanisme ou concept IA expliqué simplement pour un dirigeant de PME. Pas de survol : on explique COMMENT ça marche et POURQUOI c'est important pour son business. Exemples d'angles : pourquoi un agent IA échoue en production, ce que coûte vraiment un LLM, comment fonctionne le RAG, ce que l'EU AI Act impose concrètement à une PME, build vs buy.
2. "Sur le terrain" (rubrique: terrain) : une histoire vraie d'une livraison Lucid-Lab. Le problème de départ, ce qu'on a construit, ce qui a surpris, ce qu'on referait autrement. Honnête sur les limites.
3. "Point de vue" (rubrique: point-de-vue) : une prise de position claire sur un débat IA du moment. Une thèse, des arguments, et une invitation au désaccord. Modèle de ton : les posts de François Rivard.

Règles éditoriales (non négociables) :
- Français. Tutoiement interdit, vouvoiement implicite ou adresse directe neutre.
- Chaque post commence par un hook d'une ou deux lignes qui crée une tension ou une surprise (jamais "Aujourd'hui je vais vous parler de...").
- Ligne 3 du post : le tag de rubrique entre crochets, par exemple [Le décryptage du lundi]. C'est ce qui crée l'effet rendez-vous.
- Phrases courtes. Beaucoup de retours à la ligne. Une seule idée par post.
- Sur les affirmations chiffrées éducatives : cite la source réelle (institution + chiffre + année), uniquement des études largement connues et vérifiables (McKinsey, BCG, Stanford HAI, INSEE, Commission européenne, France Num). Si tu n'es pas certain d'un chiffre, N'INVENTE PAS : reformule sans chiffre.
- Pour la rubrique terrain : utilise UNIQUEMENT les cas et les faits listés ci-dessous. N'invente jamais de chiffres de résultats client.
- Termine par une question ouverte qui appelle une réponse en commentaire.
- Interdits : émojis, tirets longs (—) et demi-tirets (–) (utilise deux-points, virgules ou parenthèses), "feuille de route" (dire "roadmap IA" ou "plan d'action IA"), jargon corporate ("synergie", "disruption"), promesses chiffrées invérifiables, listicles pompeux.
- Longueur : 120 à 220 mots par post. Le hook seul doit donner envie de cliquer sur "voir plus".

Cas clients autorisés pour la rubrique terrain :
${CASE_LIBRARY}

Réponds UNIQUEMENT avec un tableau JSON (pas de markdown, pas de texte autour) :
[{"rubrique": "decryptage" | "terrain" | "point-de-vue", "pillar": "string court", "hook": "la ou les 2 premières lignes du post", "body": "le post complet, hook inclus"}]`;

function buildUserPrompt(slots: WeeklySlot[], recentPosts: RecentPostContext[]): string {
  const lines = [
    'Écris les 3 posts LinkedIn de la semaine prochaine, dans cet ordre :',
  ];
  for (const slot of slots) {
    const day = new Date(slot.scheduledFor).toLocaleDateString('fr-FR', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      timeZone: 'Europe/Paris',
    });
    lines.push(`- ${day} : rubrique "${RUBRIQUE_LABELS[slot.rubrique]}" (${slot.rubrique})`);
  }

  if (recentPosts.length > 0) {
    lines.push('');
    lines.push('Posts récents (NE PAS répéter ces angles ni ces hooks, varier les sujets et les cas clients) :');
    for (const p of recentPosts) {
      const hook = (p.hook ?? '').split('\n')[0].slice(0, 120);
      if (hook) lines.push(`- [${p.pillar ?? 'divers'}] ${hook}`);
    }
  }

  return lines.join('\n');
}

/** Strip long dashes the model might still emit, mirroring the blog generator. */
function stripLongDashes(text: string): string {
  return text
    .replace(/ — /g, ': ')
    .replace(/—/g, ', ')
    .replace(/ – /g, ': ')
    .replace(/–/g, ', ');
}

function parseGeneratedPosts(raw: string): { rubrique: LinkedInRubrique; pillar: string; hook: string; body: string }[] {
  const jsonText = raw
    .replace(/^```(?:json)?/m, '')
    .replace(/```\s*$/m, '')
    .trim();
  const start = jsonText.indexOf('[');
  const end = jsonText.lastIndexOf(']');
  if (start === -1 || end === -1) throw new Error('AI response contains no JSON array');

  const parsed = JSON.parse(jsonText.slice(start, end + 1)) as unknown;
  if (!Array.isArray(parsed)) throw new Error('AI response is not a JSON array');

  return parsed.map((item) => {
    const row = item as Record<string, unknown>;
    const rubrique = String(row.rubrique ?? '');
    if (!['decryptage', 'terrain', 'point-de-vue'].includes(rubrique)) {
      throw new Error(`Unknown rubrique in AI response: ${rubrique}`);
    }
    const body = typeof row.body === 'string' ? stripLongDashes(row.body).trim() : '';
    if (!body) throw new Error('AI returned a post with an empty body');
    return {
      rubrique: rubrique as LinkedInRubrique,
      pillar: typeof row.pillar === 'string' && row.pillar.trim() ? row.pillar.trim() : rubrique,
      hook: typeof row.hook === 'string' ? stripLongDashes(row.hook).trim() : body.split('\n')[0],
      body,
    };
  });
}

/**
 * Generate the coming week's 3 LinkedIn posts in one Claude call.
 * Matches generated posts to slots by rubrique (falling back to order).
 */
export async function generateWeeklyLinkedInPosts(
  slots: WeeklySlot[],
  recentPosts: RecentPostContext[],
): Promise<GeneratedLinkedInPost[]> {
  if (!config.anthropicApiKey) {
    throw new Error('ANTHROPIC_API_KEY missing: cannot generate LinkedIn posts');
  }

  const client = new Anthropic({ apiKey: config.anthropicApiKey });
  const response = await client.messages.create({
    model: config.aiModel,
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: buildUserPrompt(slots, recentPosts) }],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();
  if (!text) throw new Error('AI returned empty content');

  const generated = parseGeneratedPosts(text);

  // Each weekly slot has a distinct rubrique: match on it, fall back to order.
  return slots.map((slot, index) => {
    const match = generated.find((g) => g.rubrique === slot.rubrique) ?? generated[index];
    if (!match) throw new Error(`AI returned ${generated.length} posts for ${slots.length} slots`);
    return { ...match, scheduledFor: slot.scheduledFor, rubrique: slot.rubrique };
  });
}
