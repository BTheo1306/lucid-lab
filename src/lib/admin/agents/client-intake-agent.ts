import 'server-only';

import { z } from 'zod';
import { config } from '@/lib/bot/config';
import { isBudgetExceeded, recordAiUsage } from '@/lib/bot/db/queries/ai-budget';
import { getAIProvider, type ToolDefinition } from '@/lib/bot/integrations/ai-client';
import type { LucidClientIntakeStage, LucidClientMeetingStatus } from '@/lib/admin/lucid-os';

const PROMPT_VERSION = 'client-intake-agent-v1';
const AGENT_SLUG = 'client-intake-agent';
const SKILL_NAME = 'extract_client_intake';

export type ClientIntakeExtractionMethod = 'ai' | 'rules';

export interface ClientIntakeAgentTrace {
  agentSlug: string;
  skillName: string;
  method: ClientIntakeExtractionMethod;
  provider: string | null;
  model: string | null;
  promptVersion: string;
  tokensInput: number;
  tokensOutput: number;
  tokensTotal: number;
  latencyMs: number | null;
  error: string | null;
}

export interface ClientIntakeExtraction {
  name: string | null;
  primaryContactName: string | null;
  primaryContactEmail: string | null;
  primaryContactPhone: string | null;
  websiteUrl: string | null;
  industry: string | null;
  source: string | null;
  desiredOutcome: string | null;
  meetingNotes: string | null;
  budgetRange: string | null;
  timeline: string | null;
  nextStep: string | null;
  intakeStage: LucidClientIntakeStage | null;
  meetingStatus: LucidClientMeetingStatus | null;
  trace: ClientIntakeAgentTrace;
}

const extractedContextSchema = z.object({
  name: z.string().nullable().optional(),
  primaryContactName: z.string().nullable().optional(),
  primaryContactEmail: z.string().nullable().optional(),
  primaryContactPhone: z.string().nullable().optional(),
  websiteUrl: z.string().nullable().optional(),
  industry: z.string().nullable().optional(),
  source: z.string().nullable().optional(),
  desiredOutcome: z.string().nullable().optional(),
  meetingNotes: z.string().nullable().optional(),
  budgetRange: z.string().nullable().optional(),
  timeline: z.string().nullable().optional(),
  nextStep: z.string().nullable().optional(),
  intakeStage: z.enum(['potential', 'meeting_booked', 'meeting_done', 'proposal_sent', 'won', 'lost']).nullable().optional(),
  meetingStatus: z.enum(['not_booked', 'booked', 'done', 'cancelled']).nullable().optional(),
});

type ExtractedContext = z.infer<typeof extractedContextSchema>;

function emptyTrace(method: ClientIntakeExtractionMethod, error: string | null = null): ClientIntakeAgentTrace {
  return {
    agentSlug: AGENT_SLUG,
    skillName: SKILL_NAME,
    method,
    provider: method === 'ai' ? config.aiProvider : null,
    model: method === 'ai' ? config.aiModel : null,
    promptVersion: PROMPT_VERSION,
    tokensInput: 0,
    tokensOutput: 0,
    tokensTotal: 0,
    latencyMs: null,
    error,
  };
}

function cleanText(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value
    .replace(/^[-*\s]+/, '')
    .replace(/^['"]+|['"]+$/g, '')
    .trim();
  return trimmed.length > 0 ? trimmed : null;
}

function firstText(...values: Array<string | null | undefined>): string | null {
  return values.find((value): value is string => typeof value === 'string' && value.trim().length > 0)?.trim() ?? null;
}

function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function labelMatches(label: string, matches: string[]): boolean {
  return matches.some((match) => label === match || label.includes(match));
}

function splitLabeledLine(line: string): { label: string; value: string } | null {
  const match = line.match(/^\s*(?:[-*]\s*)?([^:=\-]{2,48})\s*(?::|=|-)\s*(.+?)\s*$/);
  if (!match) return null;

  const label = normalizeSearchText(match[1]);
  const value = cleanText(match[2]);
  if (!label || !value) return null;

  return { label, value };
}

function extractEmail(context: string): string | null {
  return context.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i)?.[0] ?? null;
}

function extractPhone(context: string): string | null {
  const match = context.match(/(?:\+|00)?\d[\d\s().-]{7,}\d/);
  return match ? cleanText(match[0].replace(/\s+/g, ' ')) : null;
}

function extractWebsite(context: string): string | null {
  const contextWithoutEmails = context.replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, ' ');
  const match = contextWithoutEmails.match(/\b(?:https?:\/\/|www\.)?[a-z0-9-]+(?:\.[a-z0-9-]+)+(?:\/[^\s,;]*)?/i);
  return match ? cleanText(match[0]) : null;
}

function hostnameFromWebsite(value: string | null): string | null {
  if (!value) return null;
  try {
    const url = new URL(/^https?:\/\//i.test(value) ? value : `https://${value}`);
    return url.hostname.replace(/^www\./i, '');
  } catch {
    return null;
  }
}

function titleCase(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ');
}

function companyNameFromWebsite(value: string | null): string | null {
  const hostname = hostnameFromWebsite(value);
  if (!hostname) return null;
  const base = hostname.split('.')[0]?.replace(/[-_]+/g, ' ').trim();
  return base ? titleCase(base) : null;
}

function inferIndustry(context: string, website: string | null): string | null {
  const normalized = normalizeSearchText(`${context} ${website ?? ''}`);
  if (labelMatches(normalized, ['architecte', 'architecture', 'permis construire', 'construction'])) return 'Architecture / construction';
  if (labelMatches(normalized, ['immobilier', 'maison', 'appart', 'real estate'])) return 'Real estate';
  if (labelMatches(normalized, ['saas', 'software', 'logiciel'])) return 'SaaS';
  return null;
}

function cleanKeywordLine(line: string | null): string | null {
  if (!line) return null;
  return cleanText(line.replace(/^\s*[-*]\s*/, '').replace(/^[^:=\-]{2,36}\s*(?::|=|-)\s*/, ''));
}

function meetingSubjectFromLine(line: string): string | null {
  const match = line.match(/^\s*(?:rdv|rendez[\s-]?vous|meeting|call|appel)\s+(.+?)(?:\s+(?:points?|notes?|besoins?|objectifs?)\b|\s*[:\-]|$)/i);
  return match ? cleanText(match[1])?.slice(0, 80) ?? null : null;
}

function fallbackNameFromContext(context: string): string | null {
  return context
    .split(/\r?\n/)
    .map((line) => line.trim())
    .find((line) => {
      const normalizedLine = normalizeSearchText(line);
      return Boolean(line)
        && !line.includes('@')
        && !/^https?:\/\//i.test(line)
        && !labelMatches(normalizedLine, ['rdv', 'rendez vous', 'meeting', 'call', 'appel', 'points clefs', 'notes', 'meeting notes', 'call notes', 'import notes', 'contexte', 'context']);
    })
    ?.slice(0, 80) ?? null;
}

function inferPipelineState(context: string): Pick<ClientIntakeExtraction, 'intakeStage' | 'meetingStatus'> {
  const normalizedContext = normalizeSearchText(context);

  if (labelMatches(normalizedContext, ['won', 'signe', 'deal signe', 'client gagne'])) {
    return { intakeStage: 'won', meetingStatus: null };
  }

  if (labelMatches(normalizedContext, ['lost', 'perdu', 'pas interesse', 'no fit'])) {
    return { intakeStage: 'lost', meetingStatus: null };
  }

  if (labelMatches(normalizedContext, ['proposal sent', 'devis envoye', 'offre envoyee', 'proposition envoyee'])) {
    return { intakeStage: 'proposal_sent', meetingStatus: null };
  }

  if (labelMatches(normalizedContext, ['meeting done', 'call done', 'notes rdv', 'notes de reunion', 'appel fait', 'rdv fait', 'points clefs'])) {
    return { intakeStage: 'meeting_done', meetingStatus: 'done' };
  }

  if (labelMatches(normalizedContext, ['meeting booked', 'call booked', 'rdv booke', 'rendez vous prevu', 'meeting scheduled'])) {
    return { intakeStage: 'meeting_booked', meetingStatus: 'booked' };
  }

  return { intakeStage: null, meetingStatus: null };
}

function extractBulletLines(lines: string[]): string[] {
  return lines
    .filter((line) => /^[-*]\s+/.test(line))
    .map((line) => cleanKeywordLine(line))
    .filter((value): value is string => Boolean(value));
}

function findLineByKeywords(lines: string[], keywords: string[]): string | null {
  return lines.find((line) => {
    const normalizedLine = normalizeSearchText(line);
    return keywords.some((keyword) => normalizedLine.includes(keyword));
  }) ?? null;
}

function likelyNeedLines(lines: string[]): string[] {
  const keywords = [
    'trouver',
    'nouveaux clients',
    'appel d offre',
    'conseil',
    'vente',
    'extension',
    'service',
    'accompagnement',
    'pub',
    'meta ads',
    'projet',
    'saas',
    'permis',
    'ia',
    'automation',
    'automatisation',
  ];

  return lines
    .map((line) => cleanKeywordLine(line))
    .filter((line): line is string => Boolean(line))
    .filter((line) => {
      const normalizedLine = normalizeSearchText(line);
      return keywords.some((keyword) => normalizedLine.includes(keyword));
    });
}

function parseClientContextWithRules(rawContext: string, error: string | null = null): ClientIntakeExtraction {
  const lines = rawContext.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  const bulletLines = extractBulletLines(lines);
  const parsed: Omit<ClientIntakeExtraction, 'trace'> = {
    name: null,
    primaryContactName: null,
    primaryContactEmail: null,
    primaryContactPhone: null,
    websiteUrl: null,
    industry: null,
    source: null,
    desiredOutcome: null,
    meetingNotes: null,
    budgetRange: null,
    timeline: null,
    nextStep: null,
    intakeStage: null,
    meetingStatus: null,
  };

  for (const line of lines) {
    const labeledLine = splitLabeledLine(line);
    if (!labeledLine) continue;

    const { label, value } = labeledLine;
    if (!parsed.name && labelMatches(label, ['client', 'company', 'compagnie', 'societe', 'entreprise', 'business', 'prospect', 'nom'])) parsed.name = value;
    if (!parsed.primaryContactName && labelMatches(label, ['contact', 'personne', 'interlocuteur', 'decision maker', 'decideur'])) parsed.primaryContactName = value;
    if (!parsed.primaryContactEmail && labelMatches(label, ['email', 'mail', 'e mail'])) parsed.primaryContactEmail = value;
    if (!parsed.primaryContactPhone && labelMatches(label, ['phone', 'tel', 'telephone', 'mobile'])) parsed.primaryContactPhone = value;
    if (!parsed.websiteUrl && labelMatches(label, ['website', 'site web', 'site', 'url', 'domaine'])) parsed.websiteUrl = value;
    if (!parsed.industry && labelMatches(label, ['industry', 'secteur', 'activite', 'metier', 'niche'])) parsed.industry = value;
    if (!parsed.source && labelMatches(label, ['source', 'origine', 'canal'])) parsed.source = value;
    if (!parsed.desiredOutcome && labelMatches(label, ['besoin', 'besoins', 'need', 'needs', 'objectif', 'objectifs', 'wants', 'souhait', 'projet', 'attente'])) parsed.desiredOutcome = value;
    if (!parsed.meetingNotes && labelMatches(label, ['notes', 'meeting notes', 'call notes', 'rdv', 'reunion', 'appel'])) parsed.meetingNotes = value;
    if (!parsed.budgetRange && labelMatches(label, ['budget', 'price', 'prix', 'tarif'])) parsed.budgetRange = value;
    if (!parsed.timeline && labelMatches(label, ['timeline', 'timing', 'delai', 'deadline', 'echeance'])) parsed.timeline = value;
    if (!parsed.nextStep && labelMatches(label, ['next step', 'next action', 'prochaine etape', 'prochaine action', 'suivi', 'follow up'])) parsed.nextStep = value;
  }

  const meetingSubject = lines.map(meetingSubjectFromLine).find((value): value is string => Boolean(value));
  parsed.primaryContactName = parsed.primaryContactName ?? meetingSubject ?? null;
  parsed.primaryContactEmail = parsed.primaryContactEmail ?? extractEmail(rawContext);
  parsed.primaryContactPhone = parsed.primaryContactPhone ?? extractPhone(rawContext);
  parsed.websiteUrl = parsed.websiteUrl ?? extractWebsite(rawContext);
  parsed.name = parsed.name ?? companyNameFromWebsite(parsed.websiteUrl) ?? meetingSubject ?? fallbackNameFromContext(rawContext);
  parsed.industry = parsed.industry ?? inferIndustry(rawContext, parsed.websiteUrl);

  const needLines = likelyNeedLines(bulletLines.length > 0 ? bulletLines : lines);
  parsed.desiredOutcome = parsed.desiredOutcome ?? (needLines.length > 0 ? needLines.join('\n') : null);
  parsed.meetingNotes = parsed.meetingNotes ?? (bulletLines.length > 0 ? bulletLines.join('\n') : null);
  parsed.budgetRange = parsed.budgetRange ?? cleanKeywordLine(findLineByKeywords(lines, ['budget', 'prix', 'tarif', 'euros', 'eur', 'mois']));
  parsed.timeline = parsed.timeline ?? cleanKeywordLine(findLineByKeywords(lines, ['timeline', 'timing', 'delai', 'deadline', 'echeance', 'asap']));
  parsed.nextStep = parsed.nextStep ?? cleanKeywordLine(findLineByKeywords(lines, ['next step', 'prochaine etape', 'next action', 'prochaine action', 'follow up', 'relancer']));
  parsed.source = parsed.source ?? (normalizeSearchText(rawContext).includes('linkedin') ? 'LinkedIn' : null);

  const inferredState = inferPipelineState(rawContext);
  parsed.intakeStage = inferredState.intakeStage;
  parsed.meetingStatus = inferredState.meetingStatus;

  return { ...parsed, trace: emptyTrace('rules', error) };
}

function providerKeyConfigured(): boolean {
  switch (config.aiProvider) {
    case 'anthropic': return Boolean(config.anthropicApiKey);
    case 'openai': return Boolean(config.openaiApiKey);
    case 'gemini': return Boolean(config.googleAiApiKey);
    case 'mistral': return Boolean(config.mistralApiKey);
    default: return false;
  }
}

async function aiBudgetAvailable(): Promise<boolean> {
  try {
    return !(await isBudgetExceeded());
  } catch {
    return true;
  }
}

async function recordUsageBestEffort(tokens: number): Promise<void> {
  try {
    await recordAiUsage(tokens);
  } catch {
    return;
  }
}

function normalizeExtractedContext(value: ExtractedContext, trace: ClientIntakeAgentTrace): ClientIntakeExtraction {
  return {
    name: cleanText(value.name),
    primaryContactName: cleanText(value.primaryContactName),
    primaryContactEmail: cleanText(value.primaryContactEmail),
    primaryContactPhone: cleanText(value.primaryContactPhone),
    websiteUrl: cleanText(value.websiteUrl),
    industry: cleanText(value.industry),
    source: cleanText(value.source),
    desiredOutcome: cleanText(value.desiredOutcome),
    meetingNotes: cleanText(value.meetingNotes),
    budgetRange: cleanText(value.budgetRange),
    timeline: cleanText(value.timeline),
    nextStep: cleanText(value.nextStep),
    intakeStage: value.intakeStage ?? null,
    meetingStatus: value.meetingStatus ?? null,
    trace,
  };
}

function parseJsonObject(value: string | null): unknown {
  if (!value) return null;
  const trimmed = value.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i)?.[1]?.trim();
  const candidate = fenced ?? trimmed;
  const objectMatch = candidate.match(/\{[\s\S]*\}/);
  return JSON.parse(objectMatch?.[0] ?? candidate);
}

function mergeExtractions(primary: ClientIntakeExtraction, fallback: ClientIntakeExtraction): ClientIntakeExtraction {
  return {
    name: firstText(primary.name, fallback.name),
    primaryContactName: firstText(primary.primaryContactName, fallback.primaryContactName),
    primaryContactEmail: firstText(primary.primaryContactEmail, fallback.primaryContactEmail),
    primaryContactPhone: firstText(primary.primaryContactPhone, fallback.primaryContactPhone),
    websiteUrl: firstText(primary.websiteUrl, fallback.websiteUrl),
    industry: firstText(primary.industry, fallback.industry),
    source: firstText(primary.source, fallback.source),
    desiredOutcome: firstText(primary.desiredOutcome, fallback.desiredOutcome),
    meetingNotes: firstText(primary.meetingNotes, fallback.meetingNotes),
    budgetRange: firstText(primary.budgetRange, fallback.budgetRange),
    timeline: firstText(primary.timeline, fallback.timeline),
    nextStep: firstText(primary.nextStep, fallback.nextStep),
    intakeStage: primary.intakeStage ?? fallback.intakeStage,
    meetingStatus: primary.meetingStatus ?? fallback.meetingStatus,
    trace: primary.trace,
  };
}

const extractClientIntakeTool: ToolDefinition = {
  name: SKILL_NAME,
  description: 'Extract a structured Lucid OS client intake record from messy notes without duplicating the raw source text.',
  parameters: {
    type: 'object',
    properties: {
      name: { type: 'string', description: 'Client company/account name. Prefer the company over the contact person. Empty if unknown.' },
      primaryContactName: { type: 'string', description: 'Main person mentioned in the notes. Empty if unknown.' },
      primaryContactEmail: { type: 'string', description: 'Main email address. Empty if unknown.' },
      primaryContactPhone: { type: 'string', description: 'Main phone number. Empty if unknown.' },
      websiteUrl: { type: 'string', description: 'Website or domain. Empty if unknown.' },
      industry: { type: 'string', description: 'Business sector in a short label. Empty if unknown.' },
      source: { type: 'string', description: 'Lead/source channel if explicitly mentioned. Empty if unknown.' },
      desiredOutcome: { type: 'string', description: 'Concise summary of what the client wants, derived from the notes. Do not paste the raw note.' },
      meetingNotes: { type: 'string', description: 'Concise cleaned meeting summary. Do not copy the complete raw text.' },
      budgetRange: { type: 'string', description: 'Budget or pricing context if explicit. Empty if unknown.' },
      timeline: { type: 'string', description: 'Timeline/deadline if explicit. Empty if unknown.' },
      nextStep: { type: 'string', description: 'Immediate next action if explicit or strongly implied. Empty if unknown.' },
      intakeStage: { type: 'string', description: 'Pipeline stage.', enum: ['potential', 'meeting_booked', 'meeting_done', 'proposal_sent', 'won', 'lost'] },
      meetingStatus: { type: 'string', description: 'Meeting status.', enum: ['not_booked', 'booked', 'done', 'cancelled'] },
    },
    required: [],
  },
};

async function extractWithAi(rawContext: string): Promise<ClientIntakeExtraction | null> {
  if (!providerKeyConfigured() || !(await aiBudgetAvailable())) return null;

  const startedAt = Date.now();
  const provider = getAIProvider();
  const response = await provider.chat([
    {
      role: 'system',
      content: [
        'You are the Lucid OS Client Intake Agent.',
        `Your only skill is ${SKILL_NAME}. Use it exactly once to extract structured CRM fields from messy notes.`,
        'Never copy the full raw note into every field. The raw source is stored separately by the system.',
        'Use null or empty strings when information is not present. Do not invent facts.',
        'Keep desiredOutcome and meetingNotes concise but useful for an agency operator.',
      ].join('\n'),
    },
    {
      role: 'user',
      content: `Extract the client intake record from these notes:\n\n${rawContext}`,
    },
  ], [extractClientIntakeTool]);
  await recordUsageBestEffort(response.tokensUsed.total);

  const toolArguments = response.toolCalls.find((toolCall) => toolCall.name === SKILL_NAME)?.arguments;
  const rawExtraction = toolArguments ?? parseJsonObject(response.text);
  const parsed = extractedContextSchema.safeParse(rawExtraction);
  if (!parsed.success) {
    throw new Error(`Client intake agent returned invalid extraction: ${parsed.error.message}`);
  }

  return normalizeExtractedContext(parsed.data, {
    agentSlug: AGENT_SLUG,
    skillName: SKILL_NAME,
    method: 'ai',
    provider: config.aiProvider,
    model: config.aiModel,
    promptVersion: PROMPT_VERSION,
    tokensInput: response.tokensUsed.prompt,
    tokensOutput: response.tokensUsed.completion,
    tokensTotal: response.tokensUsed.total,
    latencyMs: Date.now() - startedAt,
    error: null,
  });
}

export async function extractClientIntake(rawContext: string): Promise<ClientIntakeExtraction> {
  const rulesExtraction = parseClientContextWithRules(rawContext);
  if (!rawContext.trim()) return rulesExtraction;

  try {
    const aiExtraction = await extractWithAi(rawContext);
    return aiExtraction ? mergeExtractions(aiExtraction, rulesExtraction) : rulesExtraction;
  } catch (error) {
    return parseClientContextWithRules(rawContext, error instanceof Error ? error.message : 'Client intake agent failed');
  }
}
