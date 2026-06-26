import 'server-only';

import { searchTheirStackJobs } from './integrations/theirstack-client';
import { searchFrenchCompanies } from './integrations/gouv-entreprises-client';
import {
  ensureWorkspaceId,
  listActiveCampaigns,
  getSenderAccountByLabel,
  isSuppressed,
  upsertProspectCompany,
  upsertProspectPerson,
  insertSignals,
  upsertProspectScore,
  insertOutreachMessage,
  insertOutreachEvent,
  createRun,
  finishRun,
  listCaseStudies,
  type LeadEngineCampaign,
  type SenderAccount,
  type CaseStudy,
} from './lead-engine-store';
import { scoreProspect, hiringRoleTier, inferBuyerRole } from './lead-engine-scoring';
import { researchProspectPain, draftGapSellingOutreach, type CaseStudyRef } from './lead-engine-research';

/**
 * Lead Engine v2: pipeline orchestrator.
 *
 * One pass per campaign: source (TheirStack hiring signals for Motion 2, the
 * free gov API for Motion 1 founders), persist + dedup, score, then for each
 * qualified prospect research the pain (Claude), draft the gap-selling invite
 * and follow-up, and route by tier:
 *   - auto         -> queued outreach_messages (invite + follow-up draft)
 *   - human_touch  -> a handed_to_human message surfaced in the lead-engine UI
 *
 * Cost is bounded by limitPerCampaign (2 Claude calls per qualified prospect).
 * dryRun sources + scores only (no AI, no writes) for cheap validation.
 */

const SENDER_LABEL = 'Anthony';

const COUNTRY_CODES: Record<string, string> = {
  france: 'FR', belgium: 'BE', belgique: 'BE', switzerland: 'CH', suisse: 'CH',
  luxembourg: 'LU', monaco: 'MC',
};

// Default NAF codes for Motion 1 founder/SMB sourcing when none are configured.
const MOTION1_DEFAULT_NAF = ['62.01Z', '62.02A', '70.22Z', '73.11Z', '74.10Z', '63.11Z'];

function locationCodes(locations: string[]): string[] {
  const codes = new Set<string>();
  for (const l of locations) {
    const c = COUNTRY_CODES[l.trim().toLowerCase()];
    if (c) codes.add(c);
  }
  return codes.size ? [...codes] : ['FR'];
}

function asStringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((x): x is string => typeof x === 'string') : [];
}

function pickCaseStudy(industry: string | null, caseStudies: CaseStudy[]): CaseStudyRef | null {
  if (!industry || caseStudies.length === 0) return null;
  const lc = industry.toLowerCase();
  const hit = caseStudies.find((cs) => {
    const v = cs.vertical.toLowerCase();
    return lc.includes(v) || v.includes(lc);
  });
  return hit ? { vertical: hit.vertical, proofLine: hit.proofLine, metric: hit.metric } : null;
}

function thresholdsFromConfig(config: Record<string, unknown>): { high: number; medium: number; low: number } | undefined {
  const t = config.priority_thresholds as { high?: number; medium?: number; low?: number } | undefined;
  if (!t || typeof t.high !== 'number') return undefined;
  return { high: t.high, medium: t.medium ?? 11, low: t.low ?? 7 };
}

interface Candidate {
  company: {
    name: string;
    domain: string | null;
    linkedinUrl: string | null;
    country: string | null;
    city: string | null;
    industry: string | null;
    employeeCount: number | null;
    sourceUrl: string | null;
  };
  person: {
    fullName: string | null;
    firstName: string | null;
    lastName: string | null;
    title: string | null;
    linkedinUrl: string | null;
  };
  hiringRoleTitle: string | null;
  signal: {
    type: string;
    label: string;
    value: Record<string, unknown>;
    scoreDelta: number;
    source: string;
    sourceUrl: string | null;
  };
}

// Motion 2: companies hiring an exec/AI role (TheirStack). Resolve a contact
// from the hiring team, or fall back to the company's dirigeant via the gov API.
async function sourceMotion2(campaign: LeadEngineCampaign, limit: number): Promise<Candidate[]> {
  const codes = locationCodes(campaign.targetLocations);
  const roles = asStringArray(campaign.icpConfig.hiring_roles);
  if (roles.length === 0) return [];

  const jobs = await searchTheirStackJobs({
    jobTitles: roles,
    countryCodes: codes,
    minEmployees: campaign.idealEmployeeMin,
    maxEmployees: campaign.idealEmployeeMax,
    postedWithinDays: 30,
    limit: limit * 2,
  });

  const candidates: Candidate[] = [];
  for (const job of jobs) {
    let person: Candidate['person'] | null = job.hiringContact
      ? { fullName: job.hiringContact.fullName, firstName: null, lastName: null, title: job.hiringContact.role, linkedinUrl: job.hiringContact.linkedinUrl }
      : null;

    if (!person && (job.company.country?.toLowerCase().includes('france') || codes.includes('FR'))) {
      const matches = await searchFrenchCompanies({ query: job.company.name, perPage: 1 }).catch(() => []);
      const dir = matches[0]?.dirigeants.find((d) => !d.isCompany);
      if (dir) person = { fullName: dir.fullName, firstName: dir.firstName, lastName: dir.lastName, title: dir.role, linkedinUrl: null };
    }
    if (!person?.fullName) continue;

    candidates.push({
      company: {
        name: job.company.name,
        domain: job.company.domain,
        linkedinUrl: job.company.linkedinUrl,
        country: job.company.country,
        city: job.company.city,
        industry: job.company.industry,
        employeeCount: job.company.employeeCount,
        sourceUrl: job.job.url,
      },
      person,
      hiringRoleTitle: job.job.title,
      signal: {
        type: 'hiring_role',
        label: `Recrute: ${job.job.title}`,
        value: { job_title: job.job.title, job_url: job.job.url, location: job.job.location, source: 'theirstack' },
        scoreDelta: hiringRoleTier(job.job.title) === 'exec' ? 8 : 5,
        source: 'theirstack',
        sourceUrl: job.job.url,
      },
    });
    if (candidates.length >= limit) break;
  }
  return candidates;
}

// Motion 1: French SMBs by activity (gov API), targeting the founder/dirigeant.
async function sourceMotion1(campaign: LeadEngineCampaign, limit: number): Promise<Candidate[]> {
  const naf = asStringArray(campaign.icpConfig.naf_codes);
  const departments = asStringArray(campaign.icpConfig.departments);
  const companies = await searchFrenchCompanies({
    nafCodes: naf.length ? naf : MOTION1_DEFAULT_NAF,
    departments: departments.length ? departments : undefined,
    minEmployees: campaign.idealEmployeeMin,
    maxEmployees: campaign.idealEmployeeMax,
    perPage: Math.min(25, limit * 2),
  });

  const candidates: Candidate[] = [];
  for (const company of companies) {
    const dir = company.dirigeants.find((d) => !d.isCompany);
    if (!dir) continue;
    candidates.push({
      company: {
        name: company.name,
        domain: null,
        linkedinUrl: null,
        country: 'France',
        city: company.city,
        industry: company.naf,
        employeeCount: company.employeeMin,
        sourceUrl: null,
      },
      person: { fullName: dir.fullName, firstName: dir.firstName, lastName: dir.lastName, title: dir.role, linkedinUrl: null },
      hiringRoleTitle: null,
      signal: {
        type: 'founder_led',
        label: `Dirigeant: ${dir.role ?? 'fondateur'}`,
        value: { naf: company.naf, siren: company.siren, source: 'gouv' },
        scoreDelta: 4,
        source: 'gouv',
        sourceUrl: null,
      },
    });
    if (candidates.length >= limit) break;
  }
  return candidates;
}

type Outcome = 'queued' | 'human_touch' | 'suppressed' | 'skipped_low' | 'skipped_contacted' | 'dry';

async function processCandidate(
  workspaceId: string,
  campaign: LeadEngineCampaign,
  sender: SenderAccount | null,
  caseStudies: CaseStudy[],
  candidate: Candidate,
  dryRun: boolean,
): Promise<Outcome> {
  const motion = String(campaign.icpConfig.motion ?? (campaign.name.includes('Motion 2') ? 'enterprise' : 'founder_smb'));

  if (await isSuppressed({ domain: candidate.company.domain, linkedinUrl: candidate.person.linkedinUrl })) {
    return 'suppressed';
  }

  const score = scoreProspect({
    motion,
    company: { employeeCount: candidate.company.employeeCount, country: candidate.company.country, industry: candidate.company.industry },
    person: { title: candidate.person.title, seniority: null, linkedinUrl: candidate.person.linkedinUrl, email: null },
    hiringRoleTitle: candidate.hiringRoleTitle,
    aiInterest: false,
    idealEmployeeMin: campaign.idealEmployeeMin,
    idealEmployeeMax: campaign.idealEmployeeMax,
    geoTargets: campaign.targetLocations,
    thresholds: thresholdsFromConfig(campaign.scoringConfig),
  });
  if (score.priority === 'skip') return 'skipped_low';
  if (dryRun) return 'dry';

  const companyId = await upsertProspectCompany({
    workspaceId,
    campaignId: campaign.id,
    name: candidate.company.name,
    domain: candidate.company.domain,
    linkedinUrl: candidate.company.linkedinUrl,
    country: candidate.company.country,
    city: candidate.company.city,
    industry: candidate.company.industry,
    employeeCount: candidate.company.employeeCount,
    source: candidate.signal.source,
    sourceUrl: candidate.company.sourceUrl,
    status: 'enriched',
  });

  const buyerRole = inferBuyerRole(candidate.person.title, motion);
  const { id: personId, alreadyContacted } = await upsertProspectPerson({
    workspaceId,
    companyId,
    fullName: candidate.person.fullName,
    firstName: candidate.person.firstName,
    lastName: candidate.person.lastName,
    title: candidate.person.title,
    linkedinUrl: candidate.person.linkedinUrl,
    language: 'fr',
    country: candidate.company.country,
    buyerRole,
    status: 'enriched',
  });
  if (alreadyContacted) return 'skipped_contacted';

  await insertSignals([{
    workspaceId,
    companyId,
    personId,
    signalType: candidate.signal.type,
    label: candidate.signal.label,
    value: candidate.signal.value,
    scoreDelta: candidate.signal.scoreDelta,
    source: candidate.signal.source,
    sourceUrl: candidate.signal.sourceUrl,
  }]);
  await upsertProspectScore({
    workspaceId,
    companyId,
    personId,
    campaignId: campaign.id,
    score: score.score,
    maxScore: score.maxScore,
    priority: score.priority,
    factors: score.factors,
  });

  const research = await researchProspectPain({
    companyName: candidate.company.name,
    industry: candidate.company.industry,
    city: candidate.company.city,
    country: candidate.company.country,
    employeeCount: candidate.company.employeeCount,
    hiringRoleTitle: candidate.hiringRoleTitle,
    buyerRole,
    motion,
    language: 'fr',
  });
  const draft = await draftGapSellingOutreach({
    senderName: SENDER_LABEL,
    companyName: candidate.company.name,
    contactFirstName: candidate.person.firstName ?? candidate.person.fullName,
    contactTitle: candidate.person.title,
    industry: candidate.company.industry,
    hiringRoleTitle: candidate.hiringRoleTitle,
    research,
    caseStudy: pickCaseStudy(candidate.company.industry, caseStudies),
    offer: String(campaign.icpConfig.offer ?? 'une intégration IA'),
    cta: String(campaign.outreachConfig.cta ?? 'un échange de 30 minutes'),
    language: 'fr',
  });

  const personalization = {
    research,
    followup: draft.followup,
    whyFit: draft.whyFit,
    score: score.score,
    priority: score.priority,
    buyerRole,
  };

  if (score.tier === 'human_touch') {
    await insertOutreachMessage({
      workspaceId, campaignId: campaign.id, companyId, personId,
      senderAccountId: sender?.id ?? null,
      channel: 'linkedin', stepKind: 'human_touch', status: 'handed_to_human',
      bodyText: draft.inviteNote, personalization,
    });
    await insertOutreachEvent({ workspaceId, companyId, personId, eventType: 'handed_to_human' });
    return 'human_touch';
  }

  const inviteId = await insertOutreachMessage({
    workspaceId, campaignId: campaign.id, companyId, personId,
    senderAccountId: sender?.id ?? null,
    channel: 'linkedin', stepKind: 'invite', status: 'queued',
    bodyText: draft.inviteNote, scheduledAt: new Date().toISOString(), personalization,
  });
  await insertOutreachMessage({
    workspaceId, campaignId: campaign.id, companyId, personId,
    senderAccountId: sender?.id ?? null,
    channel: 'linkedin', stepKind: 'followup', status: 'draft',
    bodyText: draft.followup, parentMessageId: inviteId, personalization: { research },
  });
  await insertOutreachEvent({ workspaceId, companyId, personId, messageId: inviteId, eventType: 'draft_created' });
  return 'queued';
}

export interface PipelineResult {
  campaigns: number;
  sourced: number;
  queued: number;
  humanTouch: number;
  skipped: number;
  errors: number;
}

export async function runLeadPipeline(opts: { campaignId?: string; limitPerCampaign?: number; dryRun?: boolean } = {}): Promise<PipelineResult> {
  const limit = Math.max(1, Math.min(50, opts.limitPerCampaign ?? 10));
  const dryRun = Boolean(opts.dryRun);
  const workspaceId = await ensureWorkspaceId();
  const sender = await getSenderAccountByLabel(SENDER_LABEL, 'linkedin');
  const caseStudies = await listCaseStudies(workspaceId);

  let campaigns = await listActiveCampaigns();
  if (opts.campaignId) campaigns = campaigns.filter((c) => c.id === opts.campaignId);

  const result: PipelineResult = { campaigns: campaigns.length, sourced: 0, queued: 0, humanTouch: 0, skipped: 0, errors: 0 };

  for (const campaign of campaigns) {
    const motion = String(campaign.icpConfig.motion ?? '');
    const runId = await createRun({
      workspaceId,
      campaignId: campaign.id,
      runType: motion === 'enterprise' ? 'theirstack_source' : 'gouv_enrich',
      config: { limit, dryRun },
    });

    let processed = 0;
    let success = 0;
    let errors = 0;
    try {
      const candidates = motion === 'enterprise'
        ? await sourceMotion2(campaign, limit)
        : await sourceMotion1(campaign, limit);
      result.sourced += candidates.length;

      for (const candidate of candidates) {
        processed += 1;
        try {
          const outcome = await processCandidate(workspaceId, campaign, sender, caseStudies, candidate, dryRun);
          if (outcome === 'queued') { result.queued += 1; success += 1; }
          else if (outcome === 'human_touch') { result.humanTouch += 1; success += 1; }
          else { result.skipped += 1; }
        } catch {
          errors += 1;
          result.errors += 1;
        }
      }

      await finishRun(runId, {
        status: errors ? 'completed_with_errors' : 'completed',
        totalCount: candidates.length,
        processedCount: processed,
        successCount: success,
        errorCount: errors,
        summary: { queued: result.queued, humanTouch: result.humanTouch, skipped: result.skipped },
      });
    } catch (error) {
      result.errors += 1;
      await finishRun(runId, {
        status: 'failed',
        processedCount: processed,
        successCount: success,
        errorCount: errors + 1,
        errorMessage: error instanceof Error ? error.message : String(error),
      });
    }
  }

  return result;
}
