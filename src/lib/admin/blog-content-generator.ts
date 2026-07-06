import 'server-only';

import Anthropic from '@anthropic-ai/sdk';
import { config } from '@/lib/bot/config';
import { getAllPosts } from '@/lib/blog/posts';
import type { BlogAuthorSlug } from '@/lib/blog/authors';

export interface BlogGenerationInput {
  title: string;
  description: string | null;
  category: string | null;
  tags: string[];
  funnelStage: string | null;
  locale: 'fr' | 'en';
  notes: string | null;
  isPillar: boolean;
  /** Primary search query the article targets (drives title/H2/FAQ placement). */
  targetKeyword?: string | null;
  /** Author for the generated article, picked by expertise from the pillar/category. */
  author: BlogAuthorSlug;
}

export interface BlogGenerationOutput {
  content: string;
  description: string;
}

/**
 * Slugify a title — lowercase, ASCII, hyphenated.
 */
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

const SYSTEM_PROMPT_FR = `Tu es l'éditorialiste en chef de Lucid-Lab, une agence française qui combine Stratégie Opérationnelle, Software Development et IA Engineering pour des PMEs et grands comptes. Lucid-Lab livre des systèmes autonomes en production — pas du conseil, pas des slides.

Ton ton :
- Direct, concret, sans bullshit corporate
- Honnête : tu reconnais les limites, tu chiffres ce qui est chiffrable
- Pédagogique mais sans condescendance
- Tu écris pour des décideurs PME (CEO, COO, opérations) qui ont peu de temps

Format obligatoire (markdown) :
- Pas de titre H1 (le titre est géré ailleurs)
- Hook d'introduction en 2-3 phrases qui pose le problème concret
- Structure claire avec H2 et H3
- Listes à puces, exemples chiffrés, mini-tableaux quand pertinent
- Tableaux : utilise la syntaxe GFM standard avec séparateurs \`|\` et ligne de séparation \`|---|---|\` — chaque colonne doit avoir un en-tête, aligne bien les pipes, 3 colonnes maximum pour rester lisible sur mobile
- 1200 à 1800 mots
- Conclusion courte qui résume + un CTA implicite vers l'Audit Flash gratuit (sans le nommer ainsi de manière forcée)
- Termine par une section "## Questions fréquentes" avec 3 à 4 questions telles qu'on les taperait dans Google ou qu'on les poserait à un assistant IA, chacune suivie d'une réponse directe de 2 à 4 phrases (la réponse doit se suffire à elle-même, citable hors contexte)
- Mentions de cas concrets de Lucid-Lab quand c'est naturel (Universal pour la lead gen, Turismo pour le scaling, Périscope pour le monitoring)

SEO :
- Si un mot-clé cible est fourni, place-le naturellement dans les 100 premiers mots, dans au moins un H2, et dans la section Questions fréquentes ; ne le répète jamais mécaniquement
- Formule les H2 comme de vraies requêtes ou questions de recherche quand c'est naturel ("Combien coûte...", "Comment choisir...")
- Chaque affirmation importante doit être autoportante : sujet explicite, pas de "cela" ou "ce dernier" flottants (les moteurs de réponse IA extraient des passages isolés)

Liens internes :
- Si une liste d'articles existants t'est fournie, intègre 2 à 4 liens internes là où c'est naturellement pertinent
- Syntaxe : [texte anchor](/blog/slug) — jamais le titre exact comme anchor, mais une formulation naturelle dans la prose
- Ne force pas les liens, intègre-les dans des phrases qui ont déjà un sens sans eux

À éviter absolument :
- Le ton "guide ultime" ou listicle pompeux
- Les promesses chiffrées non vérifiables ("multipliez par 10 votre productivité")
- Les emojis dans le corps du texte
- Le name-dropping d'outils sans justification
- Les tirets longs (—) ou demi-tirets (–) : utilise des deux-points (:), des virgules ou des points à la place
- L'expression "feuille de route" : écrire "roadmap IA" ou "plan d'action IA"

Réponds UNIQUEMENT avec le markdown du contenu, rien avant, rien après.`;

const SYSTEM_PROMPT_EN = `You are the editor-in-chief of Lucid-Lab, a French agency combining Operational Strategy, Software Development and AI Engineering for SMEs and large accounts. Lucid-Lab ships autonomous systems to production — not advisory work, not slides.

Tone:
- Direct, concrete, no corporate fluff
- Honest: acknowledge limits, quantify what's quantifiable
- Educational but never condescending
- Written for SME decision-makers (CEO, COO, operations) with limited time

Required format (markdown):
- No H1 title (title is rendered elsewhere)
- 2-3 sentence hook intro that frames the concrete problem
- Clear structure with H2 / H3
- Bullet lists, quantified examples, small tables when relevant
- Tables: use standard GFM pipe syntax with a separator row \`|---|---|\` — every column must have a header, align pipes properly, max 3 columns to stay readable on mobile
- 1200-1800 words
- Short conclusion summarising + an implicit CTA towards the free Audit Flash
- End with a "## Frequently asked questions" section: 3-4 questions phrased the way people type them into Google or ask an AI assistant, each answered directly in 2-4 self-contained sentences
- Mention concrete Lucid-Lab cases when natural (Universal for lead gen, Turismo for scaling, Périscope for monitoring)

SEO:
- If a target keyword is provided, place it naturally in the first 100 words, in at least one H2, and in the FAQ section; never repeat it mechanically
- Phrase H2s as real search queries or questions when natural ("How much does...", "How to choose...")
- Keep important claims self-contained: explicit subjects, no floating "this" or "the latter" (AI answer engines extract isolated passages)

Internal links:
- If a list of existing posts is provided, weave in 2-4 internal links where naturally relevant
- Syntax: [anchor text](/en/blog/slug) — never use the exact post title as anchor; write natural prose instead
- Don't force links; they should make sense even without the hyperlink

Avoid:
- "Ultimate guide" tone or pompous listicles
- Unverifiable quantified promises ("10x your productivity")
- Emojis in body text
- Tool name-dropping without justification
- Em-dashes (—) or en-dashes (–): use colons (:), commas, or full stops instead

Respond ONLY with the markdown content, nothing before, nothing after.`;

interface ExistingPost {
  slug: string;
  title: string;
  description: string;
  category: string;
}

function buildUserPrompt(input: BlogGenerationInput, existingPosts: ExistingPost[]): string {
  const lang = input.locale === 'fr' ? 'français' : 'anglais';
  const lines = [
    `Rédige un article de blog en ${lang}.`,
    '',
    `Titre : ${input.title}`,
  ];
  if (input.description) lines.push(`Angle / résumé visé : ${input.description}`);
  if (input.category) lines.push(`Catégorie : ${input.category}`);
  if (input.tags.length) lines.push(`Tags : ${input.tags.join(', ')}`);
  if (input.funnelStage) {
    const funnelLabel =
      input.funnelStage === 'TOFU' ? 'TOFU (découverte, sensibilisation)' :
      input.funnelStage === 'MOFU' ? 'MOFU (considération, évaluation)' :
      'BOFU (décision, conversion)';
    lines.push(`Étape funnel : ${funnelLabel}`);
  }
  if (input.isPillar) lines.push('Type : article PILIER (plus exhaustif, ~1800 mots, vise à devenir une référence sur le sujet)');
  if (input.targetKeyword) lines.push(`Mot-clé cible : ${input.targetKeyword}`);
  if (input.notes) lines.push('', `Notes éditoriales : ${input.notes}`);

  if (existingPosts.length > 0) {
    const blogBase = input.locale === 'fr' ? '/blog' : '/en/blog';
    lines.push('');
    lines.push('Articles déjà publiés sur le blog (à lier si pertinent) :');
    for (const p of existingPosts) {
      lines.push(`- ${blogBase}/${p.slug} | "${p.title}" | ${p.category} | ${p.description}`);
    }
  }

  return lines.join('\n');
}

/**
 * Fetch published posts for the same locale.
 * Excludes the post currently being generated (matched by title).
 * Capped at 20 to keep the prompt concise.
 */
async function getExistingPostsForLinking(
  locale: 'fr' | 'en',
  currentTitle: string,
): Promise<ExistingPost[]> {
  try {
    const posts = await getAllPosts(locale);
    return posts
      .filter((p) => p.frontmatter.title.trim() !== currentTitle.trim())
      .map((p) => ({
        slug: p.slug,
        title: p.frontmatter.title,
        description: p.frontmatter.description,
        category: p.frontmatter.category,
      }))
      .slice(0, 20);
  } catch {
    return [];
  }
}

/**
 * Generate full markdown blog content from an idea row.
 * Fetches existing published posts first so the AI can add internal links.
 */
export async function generateBlogContent(input: BlogGenerationInput): Promise<BlogGenerationOutput> {
  if (!config.anthropicApiKey) {
    throw new Error('ANTHROPIC_API_KEY missing — cannot generate content');
  }

  const [client, existingPosts] = await Promise.all([
    Promise.resolve(new Anthropic({ apiKey: config.anthropicApiKey })),
    getExistingPostsForLinking(input.locale, input.title),
  ]);

  const systemPrompt = input.locale === 'fr' ? SYSTEM_PROMPT_FR : SYSTEM_PROMPT_EN;

  const response = await client.messages.create({
    model: config.aiModel,
    max_tokens: 8000,
    system: systemPrompt,
    messages: [{ role: 'user', content: buildUserPrompt(input, existingPosts) }],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();

  if (!text) throw new Error('AI returned empty content');

  // Strip em-dashes and en-dashes — replace with colon or comma depending on context
  const cleaned = text
    .replace(/ \u2014 /g, ': ')   // " — " → ": "
    .replace(/\u2014/g, ', ')     // bare em-dash → ", "
    .replace(/ \u2013 /g, ': ')   // " – " → ": "
    .replace(/\u2013/g, ', ')     // bare en-dash → ", "
    .trim();
  const description = input.description ?? cleaned.split('\n').find((l) => l.trim())?.slice(0, 180).trim() ?? input.title;

  return { content: cleaned, description };
}

// =============================================================================
// SEO idea generation (fills the blog's own editorial backlog)
// =============================================================================

export interface GeneratedSeoIdea {
  title: string;
  description: string | null;
  category: string | null;
  funnelStage: string | null;
  targetKeyword: string | null;
  isPillar: boolean;
}

const IDEA_SYSTEM_PROMPT = `Tu es le responsable SEO de Lucid-Lab, agence française qui vend des audits IA (Audit Flash), des roadmaps IA, des automatisations de processus, des agents IA en production et des sites web à des PME et ETI françaises.

Ta mission : proposer des sujets d'articles de blog qui captent du trafic de recherche qualifié. Chaque sujet doit viser une vraie requête qu'un dirigeant, un DSI ou un responsable opérations tape dans Google (ou demande à un assistant IA), et se raccrocher à ce que Lucid-Lab vend.

Règles :
- Requêtes en français, intention business ou informationnelle à forte proximité d'achat ("audit ia entreprise", "automatiser la saisie de factures", "agent ia service client pme", "eu ai act obligations pme", "combien coute un agent ia")
- Catégories autorisées : methode, automatisation, outils-internes, ia-pme
- funnelStage : TOFU, MOFU ou BOFU
- isPillar true seulement pour un sujet large qui mérite un article de référence (~1 sur 6)
- Jamais deux sujets qui se cannibalisent entre eux ou avec les articles existants fournis
- Titre : formulation naturelle et cliquable, pas de "guide ultime", pas de tirets longs (—), jamais "feuille de route" (dire "roadmap IA" ou "plan d'action IA")

Réponds UNIQUEMENT avec un tableau JSON :
[{"title": "...", "description": "angle en 1-2 phrases", "category": "methode|automatisation|outils-internes|ia-pme", "funnelStage": "TOFU|MOFU|BOFU", "targetKeyword": "la requête visée", "isPillar": false}]`;

/** Generate fresh SEO article ideas, avoiding overlap with existing titles. */
export async function generateSeoIdeas(existingTitles: string[], count: number): Promise<GeneratedSeoIdea[]> {
  if (!config.anthropicApiKey) {
    throw new Error('ANTHROPIC_API_KEY missing: cannot generate blog ideas');
  }

  const client = new Anthropic({ apiKey: config.anthropicApiKey });
  const userPrompt = [
    `Propose ${count} nouveaux sujets d'articles.`,
    '',
    'Sujets déjà couverts (ne pas dupliquer ni cannibaliser) :',
    ...existingTitles.slice(0, 60).map((t) => `- ${t}`),
  ].join('\n');

  const response = await client.messages.create({
    model: config.aiModel,
    max_tokens: 2500,
    system: IDEA_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();

  const start = text.indexOf('[');
  const end = text.lastIndexOf(']');
  if (start === -1 || end === -1) throw new Error('AI idea response contains no JSON array');

  const parsed = JSON.parse(text.slice(start, end + 1)) as unknown;
  if (!Array.isArray(parsed)) throw new Error('AI idea response is not a JSON array');

  const validCategories = new Set(['methode', 'automatisation', 'outils-internes', 'ia-pme']);
  const validFunnel = new Set(['TOFU', 'MOFU', 'BOFU']);

  const ideas: GeneratedSeoIdea[] = [];
  for (const item of parsed) {
    const row = item as Record<string, unknown>;
    const title = typeof row.title === 'string' ? row.title.trim() : '';
    if (!title) continue;
    ideas.push({
      title,
      description: typeof row.description === 'string' ? row.description : null,
      category: typeof row.category === 'string' && validCategories.has(row.category) ? row.category : 'methode',
      funnelStage: typeof row.funnelStage === 'string' && validFunnel.has(row.funnelStage) ? row.funnelStage : null,
      targetKeyword: typeof row.targetKeyword === 'string' ? row.targetKeyword : null,
      isPillar: row.isPillar === true,
    });
  }
  return ideas;
}
