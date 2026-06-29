import 'server-only';

import Anthropic from '@anthropic-ai/sdk';
import { config } from '@/lib/bot/config';

/**
 * Lead Engine v2: gap-selling research + drafting (Claude).
 *
 * Mirrors the friend's "Copilot gap-selling agent": given a company + the role
 * it is hiring for + the buyer persona, Claude researches the likely operational
 * pain and its business impact (public-info reasoning only, never claiming to
 * have visited the company), then drafts the outreach.
 *
 * Outreach sends from Anthony's LinkedIn, so the voice is the sender's. Because
 * a LinkedIn connection note is capped near 300 characters, the gap-selling
 * structure (problem -> impact -> offer -> ask) lives in the follow-up that goes
 * out after the invite is accepted. The invite note is a short, signal-anchored
 * hook. Max sequence = 1 invite + 1 follow-up (no spam).
 */

// LinkedIn connection-note hard limit. We stay safely under it.
const INVITE_NOTE_MAX = 280;

export interface GapResearch {
  problem: string;
  impact: string;
  persona: string;
  angle: string;
}

export interface GapResearchInput {
  companyName: string;
  industry: string | null;
  city: string | null;
  country: string | null;
  employeeCount: number | null;
  /** The role the company is recruiting (the buying signal), if any. */
  hiringRoleTitle?: string | null;
  buyerRole: string;
  motion: 'founder_smb' | 'enterprise' | string;
  language: 'fr' | 'en';
}

export interface CaseStudyRef {
  vertical: string;
  proofLine: string;
  metric?: string | null;
}

export interface GapDraftInput {
  /** Sender name shown on the message (the LinkedIn account owner). */
  senderName: string;
  companyName: string;
  contactFirstName: string | null;
  contactTitle: string | null;
  industry: string | null;
  hiringRoleTitle?: string | null;
  research: GapResearch;
  caseStudy?: CaseStudyRef | null;
  offer: string;
  cta: string;
  language: 'fr' | 'en';
}

export interface GapDraft {
  whyFit: string[];
  inviteNote: string;
  followup: string;
}

// ─── Helpers (local copies, mirroring lead-engine-generator.ts) ───────────────

function extractJson(text: string): string {
  const trimmed = text.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  return fence ? fence[1].trim() : trimmed;
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback;
}

function asStringArray(value: unknown, max = 6): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter((item) => item.length > 0)
    .slice(0, max);
}

/** Trim to a word boundary under the LinkedIn note limit. */
function clampNote(note: string, max = INVITE_NOTE_MAX): string {
  const clean = note.trim();
  if (clean.length <= max) return clean;
  const slice = clean.slice(0, max);
  const lastSpace = slice.lastIndexOf(' ');
  return (lastSpace > max * 0.6 ? slice.slice(0, lastSpace) : slice).trim();
}

/**
 * House rule: long dashes (— –) are banned in every text we produce, and they
 * are the #1 "AI / bad-translation" tell in French copy. Replace them with
 * native punctuation as a guaranteed safety net, even when the model slips.
 */
function stripLongDashes(text: string): string {
  return text
    .replace(/(\d)\s*[—–]\s*(\d)/g, '$1 à $2') // numeric range: 2—5 -> 2 à 5
    .replace(/\s*[—–]\s*/g, ', ') // any other long dash -> comma
    .replace(/\s+([,.;:!?])/g, '$1') // tidy stray space before punctuation
    .replace(/,\s*,/g, ',')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

function textFrom(response: Anthropic.Message): string {
  const block = response.content.find((b) => b.type === 'text');
  if (!block || block.type !== 'text') throw new Error('AI returned no text block.');
  return block.text;
}

function anthropic(): Anthropic {
  if (!config.anthropicApiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured.');
  }
  return new Anthropic({ apiKey: config.anthropicApiKey });
}

// ─── Research ─────────────────────────────────────────────────────────────────

const RESEARCH_SYSTEM_PROMPT = `Tu es chercheur commercial B2B pour Lucid-Lab, une agence IA. Tu appliques la méthode du gap selling.

À partir d'une entreprise (nom, secteur, taille, localisation), du poste qu'elle recrute en ce moment, et du profil d'acheteur visé, déduis :
- le PROBLÈME opérationnel que ce signal de recrutement et ce secteur/taille laissent supposer,
- l'IMPACT de ce problème (un coût réaliste et défendable, exprimé en temps ou en argent),
- la PERSONA qui subit cette douleur,
- l'ANGLE par lequel une agence IA (mise en place Claude + Obsidian, automatisations, plan d'action IA) peut aider.

Règles strictes :
- Raisonne UNIQUEMENT à partir de connaissances générales et défendables sur ce secteur et ce poste. N'affirme JAMAIS avoir visité leur site, leur LinkedIn ou une source privée. N'invente AUCUN fait privé précis (clients nommés, chiffre d'affaires exact).
- L'impact doit rester une généralité sectorielle plausible ("souvent", "typiquement"), pas un chiffre précis inventé sur CETTE entreprise.
- Chaque champ : une à deux phrases.
- N'utilise jamais de tiret long (les caractères — et –). Utilise une virgule, un deux-points ou une parenthèse.
- Écris les champs dans la langue demandée.

Réponds UNIQUEMENT avec un objet JSON (aucun texte, aucune balise) :
{ "problem": string, "impact": string, "persona": string, "angle": string }`;

export async function researchProspectPain(input: GapResearchInput): Promise<GapResearch> {
  const userPrompt = [
    `Output language: ${input.language === 'fr' ? 'French' : 'English'}`,
    '',
    'Company:',
    `- Name: ${input.companyName}`,
    `- Industry: ${input.industry ?? 'Unknown'}`,
    `- Size: ${input.employeeCount ?? 'Unknown'} employees`,
    `- Location: ${[input.city, input.country].filter(Boolean).join(', ') || 'Unknown'}`,
    `- Hiring for: ${input.hiringRoleTitle ?? 'no specific role detected'}`,
    `- Buyer persona: ${input.buyerRole}`,
    `- Motion: ${input.motion}`,
  ].join('\n');

  const response = await anthropic().messages.create({
    model: config.aiModel,
    max_tokens: 700,
    system: RESEARCH_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  });

  let raw: Partial<Record<keyof GapResearch, unknown>>;
  try {
    raw = JSON.parse(extractJson(textFrom(response))) as typeof raw;
  } catch {
    throw new Error('AI returned malformed research JSON.');
  }

  return {
    problem: stripLongDashes(asString(raw.problem)),
    impact: stripLongDashes(asString(raw.impact)),
    persona: stripLongDashes(asString(raw.persona)),
    angle: stripLongDashes(asString(raw.angle)),
  };
}

// ─── Drafting (gap selling) ───────────────────────────────────────────────────

const DRAFT_SYSTEM_PROMPT = `Tu écris des messages d'approche LinkedIn pour Lucid-Lab, une agence IA basée à Paris (mises en place Claude + Obsidian, automatisations, audits et plans d'action IA, formation des équipes).

Le message part du compte LinkedIn de l'émetteur : écris à la première personne, dans sa voix, et signe le follow-up avec son prénom. Vise un français parlé, sobre et direct, comme un fondateur qui écrit lui-même à un pair. Aucun ton commercial, aucun superlatif.

Tu produis DEUX éléments :
1. "inviteNote" : la note jointe à la demande de connexion. Limite stricte 280 caractères, vise 160 à 220. Une seule accroche, humaine, ancrée sur le signal concret et vérifiable (par exemple "j'ai vu que vous recrutez un Head of AI"). Aucune offre, aucun lien, aucune promesse de résoudre un problème. Varie les ouvertures, n'enchaîne pas toujours "je travaille avec...".
2. "followup" : le message envoyé APRÈS l'acceptation. 70 à 95 mots maximum. Structure gap selling, légère et concrète : nomme le PROBLÈME précis (à partir de la recherche), chiffre l'IMPACT en temps ou en argent avec prudence ("souvent", "typiquement"), glisse UNE preuve (l'étude de cas fournie) seulement si elle colle vraiment au secteur, puis termine par UNE seule demande précise. La demande doit être concrète et facile à accepter : soit un créneau court et daté (par exemple "20 minutes mardi ou jeudi prochain ?"), soit une prochaine étape tangible (par exemple proposer de résumer en trois lignes comment une entreprise comparable a récupéré quelques heures par semaine). Une seule question, à la fin.

Règles absolues :
- Écris dans la langue demandée (français par défaut).
- N'utilise JAMAIS de tiret long (les caractères — et –). Remplace par une virgule, un deux-points, une parenthèse, ou reformule.
- Français natif, zéro calque de l'anglais. Bannis notamment : "ça fait sens", "résonner avec", "j'espère que ce message vous trouve bien", "scaler", "passer à l'échelle", "leviers", "synergies", "disruptif", et tout emoji.
- Ne mentionne AUCUN prix ni fourchette tarifaire dans ce premier message.
- Ne prétends jamais avoir vu leur site ou leurs réseaux. Appuie-toi uniquement sur le signal donné et un raisonnement sectoriel général.
- Phrases courtes. Pas de jargon corporate. Une seule demande.

Réponds UNIQUEMENT avec un objet JSON (aucun texte autour, aucune balise markdown) :
{ "whyFit": string[], "inviteNote": string, "followup": string }`;

export async function draftGapSellingOutreach(input: GapDraftInput): Promise<GapDraft> {
  const userPrompt = [
    `Output language: ${input.language === 'fr' ? 'French' : 'English'}`,
    `Sender first name: ${input.senderName}`,
    '',
    'Prospect:',
    `- Contact: ${input.contactFirstName ?? 'Unknown'} (${input.contactTitle ?? 'role unknown'})`,
    `- Company: ${input.companyName}`,
    `- Industry: ${input.industry ?? 'Unknown'}`,
    `- Hiring signal: ${input.hiringRoleTitle ?? 'none'}`,
    '',
    'Gap-selling research:',
    `- Problem: ${input.research.problem}`,
    `- Impact: ${input.research.impact}`,
    `- Angle: ${input.research.angle}`,
    '',
    `Offer: ${input.offer}`,
    `CTA to ask for: ${input.cta}`,
    input.caseStudy
      ? `Proof point to weave in (only if it fits the vertical): ${input.caseStudy.proofLine}`
      : 'No case study provided; do not invent one.',
  ].join('\n');

  const response = await anthropic().messages.create({
    model: config.aiModel,
    max_tokens: 900,
    system: DRAFT_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  });

  let raw: { whyFit?: unknown; inviteNote?: unknown; followup?: unknown };
  try {
    raw = JSON.parse(extractJson(textFrom(response))) as typeof raw;
  } catch {
    throw new Error('AI returned malformed draft JSON.');
  }

  const inviteNote = clampNote(stripLongDashes(asString(raw.inviteNote)));
  const followup = stripLongDashes(asString(raw.followup));
  if (!inviteNote) throw new Error('AI returned an empty invite note.');
  if (!followup) throw new Error('AI returned an empty follow-up.');

  return { whyFit: asStringArray(raw.whyFit, 4).map(stripLongDashes), inviteNote, followup };
}
