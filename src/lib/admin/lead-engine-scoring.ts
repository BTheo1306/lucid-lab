import type { BuyerRole } from './lead-engine-store';

/**
 * Lead Engine v2: prospect scoring + buyer-role inference + tiering.
 *
 * Pure logic (no DB). The sourcing crons assemble the input from a prospect's
 * company, person, and hiring-role signal, then persist the result via
 * upsertProspectScore. The score weights the hiring signal highest (a company
 * recruiting a COO / Head of AI has budget and intent), then buyer fit.
 *
 * Tiering implements the owner's "tiered automation" decision: top leads
 * (founders, champions, economic buyers at high priority) are routed to a
 * human-touch lane; everyone else goes to the automated send queue.
 */

export interface ScoreWeights {
  hiringRoleExec: number;
  hiringRolePm: number;
  founderOrCSuite: number;
  employeeBandFit: number;
  aiInterest: number;
  geoFit: number;
  reachableChannel: number;
}

const DEFAULT_WEIGHTS: ScoreWeights = {
  hiringRoleExec: 8,
  hiringRolePm: 5,
  founderOrCSuite: 4,
  employeeBandFit: 3,
  aiInterest: 2,
  geoFit: 2,
  reachableChannel: 1,
};

const DEFAULT_THRESHOLDS = { high: 16, medium: 11, low: 7 };

export interface ScoreProspectInput {
  motion: 'founder_smb' | 'enterprise' | string;
  company: { employeeCount: number | null; country: string | null; industry: string | null };
  person: { title: string | null; seniority: string | null; linkedinUrl: string | null; email: string | null };
  /** The hiring-signal job title (the role the company is recruiting), if any. */
  hiringRoleTitle?: string | null;
  /** Independent AI-interest signal (tech stack, posts, AI roles). */
  aiInterest?: boolean;
  idealEmployeeMin: number;
  idealEmployeeMax: number;
  /** Campaign target_locations (names and/or codes). */
  geoTargets: string[];
  weights?: Partial<ScoreWeights>;
  thresholds?: { high: number; medium: number; low: number };
}

export interface ScoreFactor {
  label: string;
  score_delta: number;
}

export interface ScoreResult {
  score: number;
  maxScore: number;
  priority: 'high' | 'medium' | 'low' | 'skip';
  buyerRole: BuyerRole;
  tier: 'auto' | 'human_touch';
  factors: ScoreFactor[];
}

// ─── Role detection ───────────────────────────────────────────────────────────

const EXEC_HIRING_RE =
  /\b(coo|cao|chief\s+(ai|data|operating|automation|digital)\s+officer|head\s+of\s+(ai|data|automation|operations?)|vp\s+(of\s+)?operations?|directeur\s+(des\s+)?op[ée]rations?|responsable\s+transformation|chief\s+of\s+staff)\b/i;

const PM_HIRING_RE =
  /\b((ai|ia|it|data|digital)\s+(project\s+manager|product\s+manager)|chef\s+de\s+projet\s+(ia|ai|data|digital|it|si)|product\s+manager\s+(ia|ai)|automation\s+(engineer|specialist))\b/i;

const FOUNDER_RE =
  /\b(founder|co-?founder|owner|ceo|president|président|g[ée]rant|dirigeant|managing\s+director|directeur\s+g[ée]n[ée]ral|pdg|dg)\b/i;

const C_SUITE_RE =
  /\b(coo|cao|cfo|cto|cmo|cio|cdo|chief\s+\w+\s+officer|vp\b|vice\s+president|directeur|director)\b/i;

const CHAMPION_RE =
  /\b(head\s+of|lead|responsable|manager|director|directeur|chef\s+de)\b/i;

/** Tier of the role the company is HIRING for (the buying signal). */
export function hiringRoleTier(jobTitle?: string | null): 'exec' | 'pm' | null {
  if (!jobTitle) return null;
  if (EXEC_HIRING_RE.test(jobTitle)) return 'exec';
  if (PM_HIRING_RE.test(jobTitle)) return 'pm';
  return null;
}

/** Infer the buyer role of the PERSON we would contact. */
export function inferBuyerRole(personTitle: string | null, motion: string): BuyerRole {
  if (!personTitle) return 'unknown';
  if (FOUNDER_RE.test(personTitle)) {
    // In an SMB the founder/CEO is the buyer; in a bigger org they are the sponsor.
    return motion === 'enterprise' ? 'economic_buyer' : 'founder_ceo';
  }
  if (C_SUITE_RE.test(personTitle)) return 'economic_buyer';
  if (CHAMPION_RE.test(personTitle)) return 'champion';
  return 'end_user';
}

function isFounderOrCSuite(personTitle: string | null): boolean {
  if (!personTitle) return false;
  return FOUNDER_RE.test(personTitle) || C_SUITE_RE.test(personTitle);
}

// ─── Geo matching (names + ISO-2 codes for the French-speaking core) ──────────

const GEO_ALIASES: Record<string, string[]> = {
  france: ['france', 'fr'],
  belgium: ['belgium', 'belgique', 'be'],
  switzerland: ['switzerland', 'suisse', 'ch'],
  luxembourg: ['luxembourg', 'lu'],
  monaco: ['monaco', 'mc'],
};

function geoMatches(country: string | null, targets: string[]): boolean {
  if (!country) return false;
  const c = country.trim().toLowerCase();
  const expanded = new Set<string>();
  for (const t of targets) {
    const key = t.trim().toLowerCase();
    expanded.add(key);
    for (const alias of GEO_ALIASES[key] ?? []) expanded.add(alias);
  }
  return expanded.has(c);
}

// ─── Scoring ──────────────────────────────────────────────────────────────────

export function scoreProspect(input: ScoreProspectInput): ScoreResult {
  const weights = { ...DEFAULT_WEIGHTS, ...(input.weights ?? {}) };
  const thresholds = input.thresholds ?? DEFAULT_THRESHOLDS;
  const factors: ScoreFactor[] = [];
  let score = 0;

  const add = (label: string, delta: number) => {
    if (delta <= 0) return;
    score += delta;
    factors.push({ label, score_delta: delta });
  };

  const tier = hiringRoleTier(input.hiringRoleTitle);
  if (tier === 'exec') add(`Recrute un poste de direction: ${input.hiringRoleTitle}`, weights.hiringRoleExec);
  else if (tier === 'pm') add(`Recrute un poste IA/IT: ${input.hiringRoleTitle}`, weights.hiringRolePm);

  if (isFounderOrCSuite(input.person.title)) add('Contact fondateur / C-suite', weights.founderOrCSuite);

  const count = input.company.employeeCount;
  if (typeof count === 'number' && count >= input.idealEmployeeMin && count <= input.idealEmployeeMax) {
    add(`Effectif dans la cible (${count})`, weights.employeeBandFit);
  }

  if (input.aiInterest) add('Signal d\'intérêt IA', weights.aiInterest);
  if (geoMatches(input.company.country, input.geoTargets)) add('Zone géographique cible', weights.geoFit);
  if (input.person.linkedinUrl || input.person.email) add('Canal de contact disponible', weights.reachableChannel);

  const maxScore = 20;
  score = Math.min(score, maxScore);

  const priority: ScoreResult['priority'] =
    score >= thresholds.high ? 'high'
    : score >= thresholds.medium ? 'medium'
    : score >= thresholds.low ? 'low'
    : 'skip';

  const buyerRole = inferBuyerRole(input.person.title, input.motion);

  // Tiered automation: top-scored founders / champions / economic buyers go to
  // the human-touch lane; everyone else is auto-sent.
  const humanTouchRoles: BuyerRole[] = ['founder_ceo', 'economic_buyer', 'champion'];
  const tierDecision: ScoreResult['tier'] =
    priority === 'high' && humanTouchRoles.includes(buyerRole) ? 'human_touch' : 'auto';

  return { score, maxScore, priority, buyerRole, tier: tierDecision, factors };
}
