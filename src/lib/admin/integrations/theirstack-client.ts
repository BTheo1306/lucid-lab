import 'server-only';

import { config } from '@/lib/bot/config';

/**
 * TheirStack Job Postings API client.
 *
 *   POST https://api.theirstack.com/v1/jobs/search   (Bearer auth)
 *
 * Surfaces companies that are actively hiring for a target role, the buying
 * signal for Motion 2. A company posting "Head of AI" or "COO" has budget
 * approved and a project starting. TheirStack often returns the hiring-team
 * contact (name + role + LinkedIn) inline, which seeds the decision-maker.
 *
 * Docs: https://theirstack.com/en/docs/api-reference/jobs/search_jobs_v1
 * Note: the API requires a date filter, so we always send posted_at_max_age_days.
 * Response fields are read defensively (we consume a subset).
 */

const BASE = 'https://api.theirstack.com/v1';

// ─── Public types ─────────────────────────────────────────────────────────────

export interface TheirStackFilters {
  /** Job titles to match, e.g. ["Head of AI", "COO", "Chief AI Officer"]. */
  jobTitles: string[];
  /** ISO-2 country codes of the job location, e.g. ["FR", "BE", "CH", "LU"]. */
  countryCodes: string[];
  /** Only postings at most this many days old (TheirStack requires a date filter). Default 30. */
  postedWithinDays?: number;
  minEmployees?: number;
  maxEmployees?: number;
  /** Max results to fetch (1 credit per job). Default 25, capped at 100. */
  limit?: number;
  /** 0-based page. Default 0. */
  page?: number;
}

export interface TheirStackHiringContact {
  fullName: string;
  role: string | null;
  linkedinUrl: string | null;
}

export interface TheirStackProspect {
  company: {
    name: string;
    domain: string | null;
    linkedinUrl: string | null;
    employeeCount: number | null;
    industry: string | null;
    country: string | null;
    city: string | null;
  };
  job: {
    title: string;
    url: string | null;
    location: string | null;
    seniority: string | null;
    datePosted: string | null;
    countryCode: string | null;
  };
  /** First hiring-team member TheirStack surfaced, else null. */
  hiringContact: TheirStackHiringContact | null;
}

// ─── Raw shapes (only the fields we consume) ──────────────────────────────────

interface RawCompanyObject {
  name?: string | null;
  domain?: string | null;
  url?: string | null;
  linkedin_url?: string | null;
  employee_count?: number | null;
  industry?: string | null;
  country?: string | null;
  country_code?: string | null;
  city?: string | null;
}

interface RawHiringTeamMember {
  full_name?: string | null;
  name?: string | null;
  role?: string | null;
  title?: string | null;
  linkedin_url?: string | null;
}

interface RawJob {
  job_title?: string | null;
  title?: string | null;
  final_url?: string | null;
  url?: string | null;
  location?: string | null;
  seniority?: string | null;
  date_posted?: string | null;
  country?: string | null;
  country_code?: string | null;
  company_object?: RawCompanyObject | null;
  company?: string | null;
  hiring_team?: RawHiringTeamMember[] | null;
}

interface RawSearchResponse {
  data?: RawJob[];
  metadata?: { total_results?: number; total_companies?: number };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function theirStackHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    Authorization: `Bearer ${config.theirstackApiKey}`,
  };
}

function normalize(job: RawJob): TheirStackProspect | null {
  const co = job.company_object ?? {};
  const name = co.name ?? job.company ?? null;
  if (!name) return null;

  const hire = (job.hiring_team ?? []).find((m) => m.full_name ?? m.name);

  return {
    company: {
      name,
      domain: co.domain ?? co.url ?? null,
      linkedinUrl: co.linkedin_url ?? null,
      employeeCount: typeof co.employee_count === 'number' ? co.employee_count : null,
      industry: co.industry ?? null,
      country: co.country ?? co.country_code ?? null,
      city: co.city ?? null,
    },
    job: {
      title: job.job_title ?? job.title ?? '',
      url: job.final_url ?? job.url ?? null,
      location: job.location ?? null,
      seniority: job.seniority ?? null,
      datePosted: job.date_posted ?? null,
      countryCode: job.country_code ?? job.country ?? null,
    },
    hiringContact: hire
      ? {
          fullName: (hire.full_name ?? hire.name) as string,
          role: hire.role ?? hire.title ?? null,
          linkedinUrl: hire.linkedin_url ?? null,
        }
      : null,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Search TheirStack for companies hiring the given roles in the given countries.
 * Each result pairs the hiring company with the job posting (the signal) and,
 * when available, the inline hiring-team contact.
 */
export async function searchTheirStackJobs(filters: TheirStackFilters): Promise<TheirStackProspect[]> {
  if (!config.theirstackApiKey) {
    throw new Error('THEIRSTACK_API_KEY is not configured. Set it to use the lead engine hiring-signal source.');
  }

  const body: Record<string, unknown> = {
    job_title_or: filters.jobTitles,
    job_country_code_or: filters.countryCodes,
    posted_at_max_age_days: filters.postedWithinDays ?? 30,
    limit: Math.max(1, Math.min(100, filters.limit ?? 25)),
    page: filters.page ?? 0,
    blur_company_data: false,
  };
  if (typeof filters.minEmployees === 'number') body.min_employee_count = filters.minEmployees;
  if (typeof filters.maxEmployees === 'number') body.max_employee_count = filters.maxEmployees;

  const response = await fetch(`${BASE}/jobs/search`, {
    method: 'POST',
    headers: theirStackHeaders(),
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const err = await response.text().catch(() => '');
    throw new Error(`TheirStack /jobs/search → ${response.status}: ${err.slice(0, 300)}`);
  }

  const data = (await response.json()) as RawSearchResponse;
  return (data.data ?? [])
    .map(normalize)
    .filter((p): p is TheirStackProspect => p !== null);
}
