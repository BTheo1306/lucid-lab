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

const RESEARCH_SYSTEM_PROMPT = `You are a B2B sales researcher for Lucid-Lab, an AI agency. You use the gap selling methodology.

Given a company (name, industry, size, location), the role it is currently hiring for, and the buyer persona, infer:
- the operational PROBLEM that this hiring signal and this industry/size imply,
- the business IMPACT of that problem (a realistic, defensible cost framed in time or money),
- the PERSONA who feels the pain,
- the ANGLE for an AI agency (Claude + Obsidian setup, automations, AI roadmap) to help.

Hard rules:
- Reason ONLY from general, publicly defensible knowledge about that industry and role. NEVER claim to have visited their website, LinkedIn, or any private source. NEVER invent specific private facts (named clients, exact revenue).
- Impact must be a plausible industry generality ("typiquement", "souvent"), not a fabricated precise figure about THIS company.
- Keep each field to one or two sentences.
- Write the fields in the requested output language.

Return ONLY a JSON object (no prose, no markdown fences):
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
    problem: asString(raw.problem),
    impact: asString(raw.impact),
    persona: asString(raw.persona),
    angle: asString(raw.angle),
  };
}

// ─── Drafting (gap selling) ───────────────────────────────────────────────────

const DRAFT_SYSTEM_PROMPT = `You write outbound LinkedIn outreach for Lucid-Lab, an AI agency in Paris that turns companies AI-native (Claude + Obsidian setups, automations, AI audits and roadmaps, AI training).

The message is sent FROM the sender's own LinkedIn account, so write in the sender's voice and sign with the sender's first name.

You produce TWO things:
1. "inviteNote": a LinkedIn CONNECTION note. HARD limit 280 characters. Short, human, anchored on a verifiable signal (e.g. "j'ai vu que vous recrutez un Head of AI"). NO pitch, NO link, NO "I can fix your problem". One warm line + a light reason to connect.
2. "followup": the message sent AFTER they accept. Max 110 words. Use the gap selling structure: name the PROBLEM (from the research), state the IMPACT, weave ONE proof point (the provided case study) if relevant, then OFFER the CTA and ASK for it. Conversational, specific, no corporate jargon (no "synergy", "leverage", "scale", "leak"). One clear ask.

Hard rules:
- Output language matches the requested language.
- NEVER claim to have visited their website or socials. Only reference the given signal and general industry reasoning.
- Do not be pushy. The follow-up asks for the CTA once, softly.
- Sign the follow-up with the sender's first name.

Return ONLY a JSON object (no prose, no markdown fences):
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

  const inviteNote = clampNote(asString(raw.inviteNote));
  const followup = asString(raw.followup);
  if (!inviteNote) throw new Error('AI returned an empty invite note.');
  if (!followup) throw new Error('AI returned an empty follow-up.');

  return { whyFit: asStringArray(raw.whyFit, 4), inviteNote, followup };
}
