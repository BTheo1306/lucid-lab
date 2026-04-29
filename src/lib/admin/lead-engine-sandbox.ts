import 'server-only';

import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

type SandboxStatus = 'draft' | 'approved' | 'sent';

export type SandboxPriority = 'high' | 'medium' | 'low' | 'skip';

export interface SandboxProspect {
  id: string;
  companyName: string;
  niche: string;
  country: string;
  city: string;
  employeeCount: number;
  websiteUrl: string;
  linkedinSearchUrl: string;
  /** Direct LinkedIn URL of the decision maker (Apollo). */
  decisionMakerLinkedinUrl?: string | null;
  /** Verified work email of the decision maker (Apollo). */
  decisionMakerEmail?: string | null;
  /** Direct phone of the decision maker (Apollo paid). */
  decisionMakerPhone?: string | null;
  score: number;
  priority: SandboxPriority;
  topSignals: string[];
  decisionMaker: string;
  decisionMakerTitle: string;
  language: 'fr' | 'en';
  status: 'validated' | 'approved' | 'contacted';
  createdAt: string;
  lastTouchAt: string | null;
}

export interface SandboxMessage {
  id: string;
  companyId: string;
  companyName: string;
  companyWebsite: string;
  personName: string;
  personTitle: string;
  /** Direct LinkedIn URL of the person (Apollo). */
  personLinkedinUrl?: string | null;
  /** Verified email of the person (Apollo). */
  personEmail?: string | null;
  /** Direct phone of the person (Apollo paid). */
  personPhone?: string | null;
  status: SandboxStatus;
  channel: 'linkedin_manual';
  subject: string;
  bodyText: string;
  linkedinSearchUrl: string;
  createdAt: string;
  approvedAt: string | null;
  sentAt: string | null;
}

export interface SandboxRun {
  id: string;
  runType: string;
  campaignName: string;
  status: 'completed';
  processedCount: number;
  successCount: number;
  notFoundCount: number;
  blockedCount: number;
  errorCount: number;
  startedAt: string;
  finishedAt: string;
  errorMessage: string | null;
}

export interface SandboxState {
  campaign: {
    id: string;
    name: string;
    status: 'active';
    createdAt: string;
  } | null;
  prospects: SandboxProspect[];
  messages: SandboxMessage[];
  runs: SandboxRun[];
  customCampaigns?: SandboxCustomCampaign[];
}

export interface SandboxCustomCampaign {
  id: string;
  name: string;
  prompt: string;
  language: 'fr' | 'en';
  status: 'pending_review' | 'saved' | 'discarded';
  createdAt: string;
  candidates: SandboxGeneratedCandidate[];
}

export interface SandboxGeneratedCandidate {
  id: string;
  companyName: string;
  niche: string;
  country: string;
  city: string;
  employeeCount: number;
  websiteUrl: string;
  /** Company LinkedIn page URL (Apollo). */
  linkedinSearchUrl: string;
  /** Real person's name from Apollo, e.g. "Marie Dupont". */
  decisionMaker: string;
  /** Job title from Apollo, e.g. "Founder & CEO". */
  decisionMakerTitle: string;
  /** Direct LinkedIn URL of the decision maker. */
  decisionMakerLinkedinUrl?: string | null;
  /** Verified work email of the decision maker. */
  decisionMakerEmail?: string | null;
  /** Direct phone of the decision maker. */
  decisionMakerPhone?: string | null;
  language: 'fr' | 'en';
  whyFit: string[];
  draftSubject: string;
  draftBody: string;
}

const sandboxDir = path.join(process.cwd(), '.lead-engine-sandbox');
const sandboxFile = path.join(sandboxDir, 'state.json');

const emptyState: SandboxState = {
  campaign: null,
  prospects: [],
  messages: [],
  runs: [],
  customCampaigns: [],
};

interface DiscoveryCandidate {
  id: string;
  companyName: string;
  niche: string;
  country: string;
  city: string;
  employeeCount: number;
  websiteUrl: string;
  searchQuery: string;
  score: number;
  priority: 'high' | 'medium' | 'low' | 'skip';
  decisionMaker: string;
  decisionMakerTitle: string;
  language: 'fr' | 'en';
  topSignals: string[];
  draftSubject: string;
  draftBody: string;
}

const discoveryCandidates: DiscoveryCandidate[] = [
  {
    id: 'sandbox-carlili',
    companyName: 'Carlili',
    niche: 'vehicle_rental',
    country: 'France',
    city: 'Paris',
    employeeCount: 45,
    websiteUrl: 'https://www.carlili.fr',
    searchQuery: 'site:linkedin.com/company Carlili location voiture Paris',
    score: 18,
    priority: 'high',
    decisionMaker: 'Responsable operations',
    decisionMakerTitle: 'Operations / Growth',
    language: 'fr',
    topSignals: ['Location entre particuliers', 'Volume de demandes entrantes eleve', 'Reponse rapide = conversion'],
    draftSubject: 'Carlili - une question sur votre flux de demandes',
    draftBody: [
      'Bonjour,',
      '',
      "Je suis Jules, je dirige Lucid-Lab a Paris. Je suis tombe sur Carlili en regardant comment les acteurs francais de la location entre particuliers gerent l'experience cote locataire - le modele me parait plus exigeant qu'une marketplace classique parce qu'il y a deux interlocuteurs a aligner avant chaque reservation.",
      '',
      "Je suis curieux : aujourd'hui, comment vous gerez les questions recurrentes des locataires (caution, livraison, conditions) sans transformer vos proprietaires en SAV ? Pas de pitch derriere la question, c'est un sujet sur lequel on a appris des choses interessantes en bossant avec d'autres plateformes mobilite et je peux partager si ca vous intrigue.",
      '',
      'Jules',
    ].join('\n'),
  },
  {
    id: 'sandbox-roadstr',
    companyName: 'Roadstr',
    niche: 'premium_mobility',
    country: 'France',
    city: 'Paris',
    employeeCount: 25,
    websiteUrl: 'https://www.roadstr.fr',
    searchQuery: 'site:linkedin.com/company Roadstr location voiture premium France',
    score: 16,
    priority: 'high',
    decisionMaker: 'Founder / Growth lead',
    decisionMakerTitle: 'Direction / Growth',
    language: 'fr',
    topSignals: ['Positionnement premium', 'Validation manuelle des locataires', 'Conversation pre-booking critique'],
    draftBody: [
      'Bonjour,',
      '',
      "Je suis Jules, fondateur de Lucid-Lab. Roadstr m'a accroche parce que vous tenez un vrai positionnement premium sur un marche qui s'est largement banalise - et ca se sent jusque dans la facon dont vous communiquez avec les locataires avant la reservation.",
      '',
      "Une question honnete : a votre echelle, qu'est-ce qui est le plus difficile a tenir entre la qualite de reponse pre-booking et la rapidite ? Je pose parce qu'on a accompagne d'autres operateurs premium sur exactement ce trade-off et il y a deux ou trois choses contre-intuitives qu'on a apprises - ravi d'en partager si le sujet vous parle.",
      '',
      'Jules',
    ].join('\n'),
    draftSubject: 'Roadstr - une question sur votre experience pre-reservation',
  },
  {
    id: 'sandbox-paris-authentic',
    companyName: 'Paris Authentic',
    niche: 'premium_tourism',
    country: 'France',
    city: 'Paris',
    employeeCount: 12,
    websiteUrl: 'https://www.parisauthentic.com',
    searchQuery: 'site:linkedin.com/company Paris Authentic tours Paris',
    score: 15,
    priority: 'medium',
    decisionMaker: 'Founder / Customer experience lead',
    decisionMakerTitle: 'Direction / Customer experience',
    language: 'en',
    topSignals: ['Premium 2CV tours', 'International customers across timezones', 'Pre-booking questions drive conversion'],
    draftSubject: 'Paris Authentic - quick question from a fellow Paris founder',
    draftBody: [
      'Hi,',
      '',
      "I'm Jules, I run Lucid-Lab here in Paris. I came across Paris Authentic and got pulled in - the 2CV format is one of the few Paris experiences that genuinely travels well by word of mouth, and the way you stage it clearly took years to refine.",
      '',
      "Genuine question: with most of your inbound coming from international guests across timezones, what's currently the trickiest part of handling pre-booking conversations - keeping the same warmth at 11pm Paris time, or filtering serious requests from window-shoppers? We've learned a few things on that exact problem with other premium operators and happy to share if it's useful, no pitch.",
      '',
      'Jules',
    ].join('\n'),
  },
];

function nowIso(): string {
  return new Date().toISOString();
}

function linkedinSearchUrl(query: string): string {
  // The seeded and AI-generated queries often include the Google operator
  // "site:linkedin.com/company". LinkedIn's own search does not support that
  // operator, so feeding the raw string into LinkedIn returns no results.
  // Send the user to a Google search instead, which actually supports site:
  // and reliably lands on the LinkedIn company page.
  const cleaned = query.trim();
  const googleQuery = cleaned.includes('linkedin.com')
    ? cleaned
    : `site:linkedin.com/company ${cleaned}`;
  return `https://www.google.com/search?q=${encodeURIComponent(googleQuery)}`;
}

async function readSandboxState(): Promise<SandboxState> {
  try {
    const raw = await readFile(sandboxFile, 'utf8');
    const parsed = JSON.parse(raw) as Partial<SandboxState>;
    const state = {
      ...emptyState,
      ...parsed,
      customCampaigns: parsed.customCampaigns ?? [],
    } as SandboxState;
    return migrateLinkedinUrls(state);
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'ENOENT') return emptyState;
    throw error;
  }
}

function isBrokenLinkedinSearch(url: string | null | undefined): boolean {
  if (!url) return false;
  return url.includes('linkedin.com/search/results/companies') && url.includes('site%3Alinkedin');
}

function rebuildLinkedinUrl(companyName: string, city: string | null | undefined): string {
  const parts = [companyName];
  if (city) parts.push(city);
  return linkedinSearchUrl(parts.join(' '));
}

function migrateLinkedinUrls(state: SandboxState): SandboxState {
  const prospects = state.prospects.map((prospect) =>
    isBrokenLinkedinSearch(prospect.linkedinSearchUrl)
      ? { ...prospect, linkedinSearchUrl: rebuildLinkedinUrl(prospect.companyName, prospect.city) }
      : prospect,
  );
  const messages = state.messages.map((message) => {
    if (!isBrokenLinkedinSearch(message.linkedinSearchUrl)) return message;
    const prospect = prospects.find((p) => p.id === message.companyId);
    return { ...message, linkedinSearchUrl: rebuildLinkedinUrl(message.companyName, prospect?.city ?? null) };
  });
  return { ...state, prospects, messages };
}

async function writeSandboxState(state: SandboxState): Promise<void> {
  await mkdir(sandboxDir, { recursive: true });
  await writeFile(sandboxFile, `${JSON.stringify(state, null, 2)}\n`, 'utf8');
}

export async function getLeadEngineSandboxState(): Promise<SandboxState> {
  return readSandboxState();
}

export async function resetLeadEngineSandbox(): Promise<void> {
  await rm(sandboxFile, { force: true });
}

export async function runLeadEngineSandboxDiscovery(): Promise<SandboxState> {
  const state = await readSandboxState();
  const startedAt = nowIso();
  const campaign = state.campaign ?? {
    id: 'sandbox-campaign-mobility-tourism',
    name: 'Mobility, Rental & Tourism - FR/EN',
    status: 'active' as const,
    createdAt: startedAt,
  };

  const prospectsById = new Map(state.prospects.map((prospect) => [prospect.id, prospect]));
  const messagesById = new Map(state.messages.map((message) => [message.id, message]));

  discoveryCandidates.forEach((candidate) => {
    if (!prospectsById.has(candidate.id)) {
      prospectsById.set(candidate.id, {
        id: candidate.id,
        companyName: candidate.companyName,
        niche: candidate.niche,
        country: candidate.country,
        city: candidate.city,
        employeeCount: candidate.employeeCount,
        websiteUrl: candidate.websiteUrl,
        linkedinSearchUrl: linkedinSearchUrl(candidate.searchQuery),
        score: candidate.score,
        priority: candidate.priority,
        topSignals: candidate.topSignals,
        decisionMaker: candidate.decisionMaker,
        decisionMakerTitle: candidate.decisionMakerTitle,
        language: candidate.language,
        status: 'validated',
        createdAt: startedAt,
        lastTouchAt: null,
      });
    }

    const messageId = `${candidate.id}-linkedin-draft`;
    const existing = messagesById.get(messageId);
    if (!existing) {
      messagesById.set(messageId, {
        id: messageId,
        companyId: candidate.id,
        companyName: candidate.companyName,
        companyWebsite: candidate.websiteUrl,
        personName: candidate.decisionMaker,
        personTitle: candidate.decisionMakerTitle,
        status: 'draft',
        channel: 'linkedin_manual',
        subject: candidate.draftSubject,
        bodyText: candidate.draftBody,
        linkedinSearchUrl: linkedinSearchUrl(candidate.searchQuery),
        createdAt: startedAt,
        approvedAt: null,
        sentAt: null,
      });
    } else if (existing.status === 'draft') {
      existing.subject = candidate.draftSubject;
      existing.bodyText = candidate.draftBody;
    }
  });

  const finishedAt = nowIso();
  const nextState: SandboxState = {
    campaign,
    prospects: Array.from(prospectsById.values()).sort((left, right) => right.score - left.score),
    messages: Array.from(messagesById.values()).sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    runs: [
      {
        id: `sandbox-run-${Date.now()}`,
        runType: 'company_discovery',
        campaignName: campaign.name,
        status: 'completed' as const,
        processedCount: discoveryCandidates.length,
        successCount: discoveryCandidates.length,
        notFoundCount: 0,
        blockedCount: 0,
        errorCount: 0,
        startedAt,
        finishedAt,
        errorMessage: null,
      },
      ...state.runs,
    ].slice(0, 20),
  };

  await writeSandboxState(nextState);
  return nextState;
}

export async function approveLeadEngineSandboxDraft(messageId: string): Promise<void> {
  const state = await readSandboxState();
  const message = state.messages.find((item) => item.id === messageId);
  if (!message) throw new Error('Lead Engine draft not found');
  if (message.status === 'sent') return;
  message.status = 'approved';
  message.approvedAt = nowIso();
  await writeSandboxState(state);
}

export async function recordLeadEngineSandboxManualSend(messageId: string): Promise<void> {
  const state = await readSandboxState();
  const message = state.messages.find((item) => item.id === messageId);
  if (!message) throw new Error('Lead Engine draft not found');
  if (message.status !== 'approved') throw new Error('Draft must be approved before recording a manual send');
  message.status = 'sent';
  message.sentAt = nowIso();

  const prospect = state.prospects.find((item) => item.id === message.companyId);
  if (prospect) {
    prospect.status = 'contacted';
    prospect.lastTouchAt = message.sentAt;
  }

  await writeSandboxState(state);
}

function slugify(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 40) || 'custom';
}

export async function getCustomCampaign(campaignId: string): Promise<SandboxCustomCampaign | null> {
  const state = await readSandboxState();
  return (state.customCampaigns ?? []).find((item) => item.id === campaignId) ?? null;
}

export async function listCustomCampaigns(): Promise<SandboxCustomCampaign[]> {
  const state = await readSandboxState();
  return (state.customCampaigns ?? []).slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function saveCustomCampaignDraft(input: {
  name: string;
  prompt: string;
  language: 'fr' | 'en';
  candidates: SandboxGeneratedCandidate[];
}): Promise<SandboxCustomCampaign> {
  const state = await readSandboxState();
  const campaigns = state.customCampaigns ?? [];
  const campaign: SandboxCustomCampaign = {
    id: `custom-${slugify(input.name)}-${Date.now().toString(36)}`,
    name: input.name,
    prompt: input.prompt,
    language: input.language,
    status: 'pending_review',
    createdAt: nowIso(),
    candidates: input.candidates,
  };
  campaigns.unshift(campaign);
  await writeSandboxState({ ...state, customCampaigns: campaigns });
  return campaign;
}

export async function discardCustomCampaign(campaignId: string): Promise<void> {
  const state = await readSandboxState();
  const campaigns = (state.customCampaigns ?? []).filter((item) => item.id !== campaignId);
  await writeSandboxState({ ...state, customCampaigns: campaigns });
}

export async function commitCustomCampaignSelection(input: {
  campaignId: string;
  selectedCandidateIds: string[];
}): Promise<{ savedCount: number }> {
  const state = await readSandboxState();
  const campaign = (state.customCampaigns ?? []).find((item) => item.id === input.campaignId);
  if (!campaign) throw new Error('Custom campaign not found');
  if (campaign.status === 'saved') throw new Error('Custom campaign already saved');

  const selected = new Set(input.selectedCandidateIds);
  const kept = campaign.candidates.filter((candidate) => selected.has(candidate.id));
  if (kept.length === 0) throw new Error('Select at least one prospect to save');

  const startedAt = nowIso();
  const sandboxCampaign = state.campaign ?? {
    id: 'sandbox-campaign-mobility-tourism',
    name: 'Custom AI campaigns',
    status: 'active' as const,
    createdAt: startedAt,
  };

  const prospectsById = new Map(state.prospects.map((prospect) => [prospect.id, prospect]));
  const messagesById = new Map(state.messages.map((message) => [message.id, message]));

  kept.forEach((candidate) => {
    if (!prospectsById.has(candidate.id)) {
      prospectsById.set(candidate.id, {
        id: candidate.id,
        companyName: candidate.companyName,
        niche: candidate.niche,
        country: candidate.country,
        city: candidate.city,
        employeeCount: candidate.employeeCount,
        websiteUrl: candidate.websiteUrl,
        linkedinSearchUrl: candidate.linkedinSearchUrl,
        decisionMakerLinkedinUrl: candidate.decisionMakerLinkedinUrl ?? null,
        decisionMakerEmail: candidate.decisionMakerEmail ?? null,
        decisionMakerPhone: candidate.decisionMakerPhone ?? null,
        score: 15,
        priority: 'high',
        topSignals: candidate.whyFit,
        decisionMaker: candidate.decisionMaker,
        decisionMakerTitle: candidate.decisionMakerTitle,
        language: candidate.language,
        status: 'validated',
        createdAt: startedAt,
        lastTouchAt: null,
      });
    }

    const messageId = `${candidate.id}-linkedin-draft`;
    if (!messagesById.has(messageId)) {
      messagesById.set(messageId, {
        id: messageId,
        companyId: candidate.id,
        companyName: candidate.companyName,
        companyWebsite: candidate.websiteUrl,
        personName: candidate.decisionMaker,
        personTitle: candidate.decisionMakerTitle,
        personLinkedinUrl: candidate.decisionMakerLinkedinUrl ?? null,
        personEmail: candidate.decisionMakerEmail ?? null,
        personPhone: candidate.decisionMakerPhone ?? null,
        status: 'draft',
        channel: 'linkedin_manual',
        subject: candidate.draftSubject,
        bodyText: candidate.draftBody,
        linkedinSearchUrl: candidate.linkedinSearchUrl,
        createdAt: startedAt,
        approvedAt: null,
        sentAt: null,
      });
    }
  });

  const updatedCampaigns = (state.customCampaigns ?? []).map((item) =>
    item.id === input.campaignId
      ? {
          ...item,
          status: 'saved' as const,
          candidates: item.candidates.filter((candidate) => selected.has(candidate.id)),
        }
      : item,
  );

  const finishedAt = nowIso();
  await writeSandboxState({
    ...state,
    campaign: sandboxCampaign,
    prospects: Array.from(prospectsById.values()).sort((left, right) => right.score - left.score),
    messages: Array.from(messagesById.values()).sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
    customCampaigns: updatedCampaigns,
    runs: [
      {
        id: `sandbox-run-${Date.now()}`,
        runType: 'custom_campaign_save',
        campaignName: campaign.name,
        status: 'completed' as const,
        processedCount: kept.length,
        successCount: kept.length,
        notFoundCount: 0,
        blockedCount: 0,
        errorCount: 0,
        startedAt,
        finishedAt,
        errorMessage: null,
      },
      ...state.runs,
    ].slice(0, 20),
  });

  return { savedCount: kept.length };
}

export function buildLinkedinSearchUrl(query: string): string {
  return linkedinSearchUrl(query);
}

export function generateCandidateId(seed: string): string {
  return `custom-${slugify(seed)}-${Math.random().toString(36).slice(2, 8)}`;
}