import 'server-only';

import Anthropic from '@anthropic-ai/sdk';
import { config } from '@/lib/bot/config';
import { getAllPosts } from '@/lib/blog/posts';

export interface BlogGenerationInput {
  title: string;
  description: string | null;
  category: string | null;
  tags: string[];
  funnelStage: string | null;
  locale: 'fr' | 'en';
  notes: string | null;
  isPillar: boolean;
  /** When set, the article is the long-form expansion of this LinkedIn post. */
  sourceText?: string | null;
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
- Mentions de cas concrets de Lucid-Lab quand c'est naturel (Universal pour la lead gen, Turismo pour le scaling, Périscope pour le monitoring)

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
- Mention concrete Lucid-Lab cases when natural (Universal for lead gen, Turismo for scaling, Périscope for monitoring)

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
  if (input.notes) lines.push('', `Notes éditoriales : ${input.notes}`);

  if (input.sourceText && input.sourceText.trim()) {
    lines.push('');
    lines.push(
      'Cet article est la version longue du post LinkedIn ci-dessous. Garde son angle, sa thèse et ses exemples, mais approfondis vraiment : pose le contexte, développe chaque point, ajoute des exemples chiffrés, des nuances et une structure complète. Ne te contente pas de paraphraser le post.',
    );
    lines.push('');
    lines.push('--- Post LinkedIn source ---');
    lines.push(input.sourceText.trim());
    lines.push('--- Fin du post source ---');
  }

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
// LinkedIn post -> blog generation input
// =============================================================================

/** Map a LinkedIn content pillar onto a blog category (best effort, defaults to methode). */
function categoryFromPillar(pillar: string | null): string {
  const p = (pillar ?? '').toLowerCase();
  if (p.includes('automat')) return 'automatisation';
  if (p.includes('outil') || p.includes('tool') || p.includes('interne')) return 'outils-internes';
  if (p.includes('pme') || p.includes('sme')) return 'ia-pme';
  // ai-readiness, gouvernance, opinion, poc-graveyard, ... -> methodology bucket
  return 'methode';
}

/** Derive a blog-worthy title from a LinkedIn hook (or the first line of the body). */
function deriveTitle(hook: string | null, body: string): string {
  const raw = (hook && hook.trim()) || body.split('\n').map((l) => l.trim()).find(Boolean) || 'Article';
  // Keep the first sentence, drop trailing punctuation/ellipsis.
  const firstSentence = raw.split(/(?<=[.!?])\s/)[0].trim();
  const base = firstSentence.replace(/[.!?…:]+$/u, '').trim();
  if (base.length <= 70) return base;
  const cut = base.slice(0, 70);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 30 ? cut.slice(0, lastSpace) : cut).trim();
}

/** Build a generation input that expands a LinkedIn post into a long-form article. */
export function blogInputFromSocialPost(post: {
  hook: string | null;
  body: string;
  pillar: string | null;
}): BlogGenerationInput {
  return {
    title: deriveTitle(post.hook, post.body),
    description: null,
    category: categoryFromPillar(post.pillar),
    tags: post.pillar ? [post.pillar] : [],
    funnelStage: null,
    locale: 'fr',
    notes: null,
    isPillar: false,
    sourceText: post.body,
  };
}
