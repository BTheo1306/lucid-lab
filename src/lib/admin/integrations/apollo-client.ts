import 'server-only';

import { config } from '@/lib/bot/config';

/**
 * Apollo.io API client — free-tier single-step flow:
 *
 *   POST /api/v1/mixed_people/search
 *   → people filtered by title, seniority, industry, location, employee count
 *   → each person includes inline organization info (name, website, company LinkedIn URL)
 *
 * Permission required: api/v1/people/search  (available on free plan)
 *
 * Free-plan limits:
 *   - Emails are masked ("m***@example.com") → treated as null here
 *   - Phone numbers are masked or empty
 *   - LinkedIn URL for the PERSON is returned when Apollo has it
 *
 * When upgrading to Apollo Pro, add a second call to people/bulk_match or
 * people/enrich to unlock verified emails and direct-dial phones.
 *
 * Docs: https://docs.apollo.io/reference/people-search
 */

// ─── Public types ───────────────────────────────────────────────────────────

export interface ApolloSearchFilters {
  /** Industry keyword tags, e.g. ["wedding planning", "event management"]. */
  industries?: string[];
  /** Country / city names for HQ location, e.g. ["France", "Paris"]. */
  countries?: string[];
  cities?: string[];
  /** Free-form keywords matched against company name + description. */
  keywords?: string[];
  /** Head-count ranges in Apollo format, e.g. ["1,10", "11,50"]. */
  employeeRanges?: string[];
  /** Job titles for the target decision maker. */
  titles?: string[];
  /** Apollo seniority flags: owner | founder | c_suite | partner | vp | head | director */
  seniorities?: string[];
  /** Max companies to fetch (1–100). Defaults to 25. */
  perPage?: number;
}

export interface ApolloPerson {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string;
  title: string;
  /** Verified work email — only available on paid enrichment plans. Null on free tier. */
  email: string | null;
  emailStatus: string | null;
  /** Direct LinkedIn URL of the PERSON, e.g. https://www.linkedin.com/in/marie-dupont/ */
  linkedinUrl: string | null;
  phone: string | null;
  // Company snapshot (from the org search step)
  companyName: string;
  companyDomain: string | null;
  companyWebsite: string | null;
  /** Company LinkedIn page, e.g. https://www.linkedin.com/company/acme/ */
  companyLinkedinUrl: string | null;
  companyEmployees: number | null;
  companyIndustry: string | null;
  companyCountry: string | null;
  companyCity: string | null;
}

// ─── Raw Apollo shapes ───────────────────────────────────────────────────────

interface ApolloInlineOrg {
  id?: string;
  name?: string;
  website_url?: string | null;
  linkedin_url?: string | null;
  primary_domain?: string | null;
  estimated_num_employees?: number | null;
  industry?: string | null;
  country?: string | null;
  city?: string | null;
}

interface ApolloRawPerson {
  id?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  title?: string | null;
  linkedin_url?: string | null;
  email?: string | null;
  email_status?: string | null;
  phone_numbers?: Array<{ sanitized_number?: string; raw_number?: string }>;
  organization?: ApolloInlineOrg | null;
  // Sometimes org info is at the top level (mixed_people/search variant)
  organization_id?: string;
  organization_name?: string;
}

interface ApolloPeopleSearchResponse {
  people?: ApolloRawPerson[];
  pagination?: { total_entries?: number };
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const BASE = 'https://api.apollo.io/api/v1';

function apolloHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Api-Key': config.apolloApiKey,
  };
}

async function apolloPost<T>(path: string, body: Record<string, unknown>): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: apolloHeaders(),
    body: JSON.stringify(body),
  });
  if (!response.ok) {
    const err = await response.text().catch(() => '');
    throw new Error(`Apollo ${path} → ${response.status}: ${err.slice(0, 300)}`);
  }
  return response.json() as Promise<T>;
}

// ─── Email mask detection ─────────────────────────────────────────────────────

/** Apollo masks free-tier emails as "m***@example.com". Treat those as null. */
function unmaskedEmail(raw: string | null | undefined): string | null {
  if (!raw) return null;
  // Masked pattern: contains "***" or "@example.com" placeholder
  if (raw.includes('***') || raw.endsWith('@example.com')) return null;
  return raw;
}

// ─── Normalizer ───────────────────────────────────────────────────────────────

function buildApolloPerson(person: ApolloRawPerson): ApolloPerson {
  const org = person.organization ?? {};
  const phone = person.phone_numbers?.[0]?.sanitized_number
    ?? person.phone_numbers?.[0]?.raw_number
    ?? null;
  const firstName = person.first_name ?? (person.name?.split(' ')[0] ?? '');
  const lastName = person.last_name ?? (person.name?.split(' ').slice(1).join(' ') ?? '');
  const companyName = org.name ?? person.organization_name ?? '';

  return {
    id: person.id ?? '',
    fullName: person.name ?? `${firstName} ${lastName}`.trim(),
    firstName,
    lastName,
    title: person.title ?? '',
    email: unmaskedEmail(person.email),
    emailStatus: person.email_status ?? null,
    linkedinUrl: person.linkedin_url ?? null,
    phone,
    companyName,
    companyDomain: org.primary_domain ?? null,
    companyWebsite: org.website_url ?? null,
    companyLinkedinUrl: org.linkedin_url ?? null,
    companyEmployees: typeof org.estimated_num_employees === 'number' ? org.estimated_num_employees : null,
    companyIndustry: org.industry ?? null,
    companyCountry: org.country ?? null,
    companyCity: org.city ?? null,
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Search Apollo for real decision makers matching the given ICP filters.
 *
 * Free-tier single-step flow:
 *   POST /api/v1/mixed_people/search
 *   Filters by person title + seniority + company industry / location / size.
 *   Returns people with inline org info (name, website, company LinkedIn URL).
 *
 * Note: emails and phones are masked on free tier and treated as null here.
 * Personal LinkedIn URL is returned when Apollo has it.
 */
export async function searchApolloPeople(filters: ApolloSearchFilters): Promise<ApolloPerson[]> {
  if (!config.apolloApiKey) {
    throw new Error('APOLLO_API_KEY is not configured. Set it in .env.local to use the lead engine.');
  }

  const defaultSeniorities = ['owner', 'founder', 'c_suite', 'partner', 'vp', 'head'];
  const seniorities = filters.seniorities?.length ? filters.seniorities : defaultSeniorities;
  const locations = [...(filters.countries ?? []), ...(filters.cities ?? [])];

  const body: Record<string, unknown> = {
    page: 1,
    per_page: Math.max(1, Math.min(100, filters.perPage ?? 25)),
    person_seniorities: seniorities,
  };
  if (filters.titles?.length) body.person_titles = filters.titles;
  if (filters.industries?.length) body.q_organization_keyword_tags = filters.industries;
  if (locations.length) body.organization_locations = locations;
  if (filters.keywords?.length) body.q_keywords = filters.keywords.join(' ');
  if (filters.employeeRanges?.length) body.organization_num_employees_ranges = filters.employeeRanges;

  const data = await apolloPost<ApolloPeopleSearchResponse>('/mixed_people/search', body);
  return (data.people ?? [])
    .filter((p) => p.id && (p.name ?? p.first_name))
    .map(buildApolloPerson);
}
