import 'server-only';

import Anthropic from '@anthropic-ai/sdk';
import { config } from '@/lib/bot/config';
import { searchApolloPeople, type ApolloPerson, type ApolloSearchFilters } from './integrations/apollo-client';
import { getCachedApolloSearch, setCachedApolloSearch } from './integrations/apollo-cache';
import { generateCandidateId, type SandboxGeneratedCandidate } from './lead-engine-sandbox';

/**
 * Lead generation pipeline:
 *   1. Claude translates the human ICP description into Apollo search filters.
 *   2. Apollo returns real verified prospects (with email, LinkedIn, phone).
 *   3. Claude drafts a personalized opening message for each prospect.
 *
 * Apollo is the source of truth for company/person data, so the LLM is never
 * asked to invent companies, websites, or names — only to translate intent and
 * write outreach copy.
 */

interface GenerateInput {
  campaignName: string;
  prompt: string;
  language: 'fr' | 'en';
  count: number;
}

interface RawFilters {
  titles?: unknown;
  industries?: unknown;
  countries?: unknown;
  cities?: unknown;
  keywords?: unknown;
  employeeRanges?: unknown;
  seniorities?: unknown;
}

interface RawDraft {
  whyFit?: unknown;
  draftSubject?: unknown;
  draftBody?: unknown;
}

const FILTER_SYSTEM_PROMPT = `You translate a human ICP description into Apollo.io search filters.

Apollo uses a single people-search call (mixed_people/search) that filters by:
  - Person: title, seniority
  - Company: industry keyword tags, location (country/city), employee count range, free-text keywords

You return ONLY a JSON object matching this schema (no prose, no markdown fences):

{
  "industries":      string[],   // Apollo keyword tags for company industry, e.g. ["wedding planning", "event planning"]
  "countries":       string[],   // HQ country names Apollo expects, e.g. ["France"]
  "cities":          string[],   // optional HQ cities, e.g. ["Paris", "Lyon"]
  "keywords":        string[],   // free-form keywords matched against company name/description
  "employeeRanges":  string[],   // Apollo head-count range strings e.g. ["1,10","11,50"]
  "titles":          string[],   // job titles for the decision maker, e.g. ["Founder", "CEO", "COO"]
  "seniorities":     string[]    // Apollo seniority flags: owner | founder | c_suite | partner | vp | head | director
}

Rules:
- industries: 1-4 tight keyword tags that Apollo would recognise (e.g. "event planning", not "events").
- countries: only ones explicitly mentioned or strongly implied. Default to ["France"] if French context.
- employeeRanges: cover the requested head-count. Use Apollo format "min,max". E.g. 5-30 employees → ["1,10","11,20","21,50"].
- titles: 3-6 variants of the decision-maker role (founder, owner, CEO, COO, directeur général…).
- seniorities: always include at least ["owner","founder","c_suite"]. Add "partner","vp","head" when relevant.
- Never invent a country or industry not implied by the prompt. Empty arrays are fine.
- Output ONLY the JSON object.`;

const DRAFT_SYSTEM_PROMPT = `You are Jules, founder of Lucid-Lab — an AI agency in Paris that builds AI agents and automations for B2B companies (chatbots that qualify leads, AI customer support, workflow automations, internal copilots, voice agents).

You will receive a real prospect (their name, title, company, industry, city, employee count). Write a short LinkedIn-style opening message.

Hard rules:
- Output language matches the requested language.
- Subject: under 60 characters, no all-caps, no emoji.
- Body: under 110 words.
- Open with a VERIFIABLE factual observation about the company you can infer from the data given (industry, size, city). NEVER reference their website, social media, "j'ai regardé votre site", "votre présence Instagram" — you have not visited anything.
- No "you have a problem we fix" framing. No corporate jargon (synergy, leverage, scale, leak, audit).
- Ask one curiosity-led open question about how they currently handle X.
- Soft CTA: offer to share a quick insight, no aggressive 20-min call ask.
- Sign with first name "Jules".
- For email channel, append a one-line GDPR unsubscribe footer in the same language (e.g. "Si ce message ne vous concerne pas, répondez 'STOP' et je n'écrirai plus." / "If this isn't relevant, reply 'STOP' and I won't write again.").

Return ONLY a JSON object (no prose, no markdown fences):

{
  "whyFit":      string[],  // 2-4 short concrete signals tied to this specific company
  "draftSubject": string,
  "draftBody":   string
}`;

function extractJson(text: string): string {
  const trimmed = text.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  return fence ? fence[1].trim() : trimmed;
}

function asString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value.trim() : fallback;
}

function asStringArray(value: unknown, max = 12): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => (typeof item === 'string' ? item.trim() : ''))
    .filter((item) => item.length > 0)
    .slice(0, max);
}

function inferLanguageFromCountry(country: string | null): 'fr' | 'en' {
  const fr = ['france', 'belgique', 'belgium', 'suisse', 'switzerland', 'luxembourg', 'monaco', 'québec', 'quebec'];
  return country && fr.includes(country.toLowerCase()) ? 'fr' : 'en';
}

async function translateIcpToFilters(
  client: Anthropic,
  input: GenerateInput,
): Promise<ApolloSearchFilters> {
  const userPrompt = [
    `Output JSON. Language hint: ${input.language === 'fr' ? 'French' : 'English'}.`,
    `Number of prospects desired: ${input.count}.`,
    '',
    'ICP description:',
    '"""',
    input.prompt,
    '"""',
  ].join('\n');

  const response = await client.messages.create({
    model: config.aiModel,
    max_tokens: 1024,
    system: FILTER_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('AI did not return any filter JSON.');
  }

  let raw: RawFilters;
  try {
    raw = JSON.parse(extractJson(textBlock.text)) as RawFilters;
  } catch {
    throw new Error('AI returned malformed filter JSON.');
  }

  return {
    titles: asStringArray(raw.titles, 8),
    industries: asStringArray(raw.industries, 6),
    countries: asStringArray(raw.countries, 6),
    cities: asStringArray(raw.cities, 8),
    keywords: asStringArray(raw.keywords, 10),
    employeeRanges: asStringArray(raw.employeeRanges, 6),
    seniorities: asStringArray(raw.seniorities, 8),
    perPage: Math.max(1, Math.min(100, input.count * 2)), // overshoot, we'll filter
  };
}

async function draftMessageForPerson(
  client: Anthropic,
  person: ApolloPerson,
  language: 'fr' | 'en',
): Promise<{ whyFit: string[]; draftSubject: string; draftBody: string }> {
  const userPrompt = [
    `Output language: ${language === 'fr' ? 'French' : 'English'}`,
    '',
    'Prospect:',
    `- Name: ${person.fullName || 'Unknown'}`,
    `- Title: ${person.title || 'Unknown'}`,
    `- Company: ${person.companyName || 'Unknown'}`,
    `- Industry: ${person.companyIndustry ?? 'Unknown'}`,
    `- City: ${person.companyCity ?? 'Unknown'}`,
    `- Country: ${person.companyCountry ?? 'Unknown'}`,
    `- Employees: ${person.companyEmployees ?? 'Unknown'}`,
    `- Channel: ${person.email ? 'email' : 'linkedin'}`,
    `- Has verified email: ${person.email ? 'yes' : 'no (LinkedIn outreach only for now)'}`,
  ].join('\n');

  const response = await client.messages.create({
    model: config.aiModel,
    max_tokens: 1024,
    system: DRAFT_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const textBlock = response.content.find((block) => block.type === 'text');
  if (!textBlock || textBlock.type !== 'text') {
    throw new Error('AI did not return draft JSON.');
  }

  let raw: RawDraft;
  try {
    raw = JSON.parse(extractJson(textBlock.text)) as RawDraft;
  } catch {
    throw new Error('AI returned malformed draft JSON.');
  }

  const draftSubject = asString(raw.draftSubject) || `${person.companyName} - quick question`;
  const draftBody = asString(raw.draftBody);
  if (!draftBody) throw new Error('AI returned empty draft body.');

  return {
    whyFit: asStringArray(raw.whyFit, 4),
    draftSubject,
    draftBody,
  };
}

function personToCandidate(
  person: ApolloPerson,
  draft: { whyFit: string[]; draftSubject: string; draftBody: string },
  requestedLanguage: 'fr' | 'en',
): SandboxGeneratedCandidate {
  const language = inferLanguageFromCountry(person.companyCountry) === 'fr' ? 'fr' : requestedLanguage;
  const websiteUrl = person.companyWebsite
    ?? (person.companyDomain ? `https://${person.companyDomain}` : `https://www.google.com/search?q=${encodeURIComponent(person.companyName)}`);
  const companyLinkedinUrl = person.companyLinkedinUrl
    ?? `https://www.google.com/search?q=${encodeURIComponent(`site:linkedin.com/company "${person.companyName}"`)}`;

  return {
    id: generateCandidateId(`${person.companyName}-${person.fullName}`),
    companyName: person.companyName || 'Unknown company',
    niche: person.companyIndustry ?? 'Unclassified',
    country: person.companyCountry ?? 'Unknown',
    city: person.companyCity ?? 'Unknown',
    employeeCount: person.companyEmployees ?? 0,
    websiteUrl,
    linkedinSearchUrl: companyLinkedinUrl,
    decisionMaker: person.fullName || person.title || 'Decision maker',
    decisionMakerTitle: person.title || 'Decision maker',
    decisionMakerLinkedinUrl: person.linkedinUrl,
    decisionMakerEmail: person.email,
    decisionMakerPhone: person.phone,
    language,
    whyFit: draft.whyFit,
    draftSubject: draft.draftSubject,
    draftBody: draft.draftBody,
  };
}

export async function generateCustomCampaignCandidates(input: GenerateInput): Promise<SandboxGeneratedCandidate[]> {
  if (!config.anthropicApiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured. Set it in .env.local to generate custom campaigns.');
  }
  if (!config.apolloApiKey) {
    throw new Error('APOLLO_API_KEY is not configured. Set it in .env.local to use the lead engine.');
  }

  const count = Math.max(1, Math.min(25, Math.round(input.count)));
  const client = new Anthropic({ apiKey: config.anthropicApiKey });

  // 1. ICP -> Apollo filters
  const filters = await translateIcpToFilters(client, { ...input, count });

  // 2. Apollo (cached)
  let people = await getCachedApolloSearch(filters);
  if (!people) {
    people = await searchApolloPeople(filters);
    await setCachedApolloSearch(filters, people);
  }

  // Prefer prospects that have at least a person LinkedIn URL or an email.
  // On the free tier, emails are null — LinkedIn URL is the primary contact channel.
  const usable = people
    .filter((p) => p.companyName && (p.linkedinUrl || p.email))
    .slice(0, count);

  if (usable.length === 0) {
    throw new Error('Apollo returned no contactable prospects for these filters. Try broadening the ICP.');
  }

  // 3. Draft a message per person in parallel.
  const candidates = await Promise.all(
    usable.map(async (person) => {
      const draft = await draftMessageForPerson(client, person, input.language);
      return personToCandidate(person, draft, input.language);
    }),
  );

  return candidates;
}
