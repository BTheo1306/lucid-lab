import 'server-only';

/**
 * Free French company data via the official government API.
 *   GET https://recherche-entreprises.api.gouv.fr/search   (no API key)
 *
 * The "Annuaire des Entreprises" open-data API: firmographics (NAF, size band,
 * HQ city) plus the dirigeants array (officers with name and role), GDPR-clean.
 * Replaces the paid Pappers API for the lead engine's French firmographics and
 * decision-maker resolution at zero cost.
 *
 * Note: a Pappers MCP may also be connected to Claude for richer interactive
 * research, but an MCP cannot be reached by this server-side app, so production
 * uses this HTTP API.
 *
 * Docs: https://recherche-entreprises.api.gouv.fr/docs/
 */

const BASE = 'https://recherche-entreprises.api.gouv.fr';

// Public types

export interface FrenchCompanyFilters {
  /** Full-text query (name / keywords). Optional if other filters are given. */
  query?: string;
  /** NAF/APE codes in dotted format, e.g. ["62.02A"]. */
  nafCodes?: string[];
  /** Department codes, e.g. ["75", "69"]. */
  departments?: string[];
  /** Postal codes, e.g. ["75011"]. */
  postalCodes?: string[];
  /** Employee band (mapped to Sirene tranche codes). */
  minEmployees?: number;
  maxEmployees?: number;
  page?: number;
  /** Results per page (max 25). */
  perPage?: number;
}

export interface FrenchDirigeant {
  fullName: string;
  firstName: string | null;
  lastName: string | null;
  role: string | null;
  isCompany: boolean;
}

export interface FrenchCompany {
  siren: string;
  name: string;
  naf: string | null;
  employeeTranche: string | null;
  employeeMin: number | null;
  employeeMax: number | null;
  postalCode: string | null;
  city: string | null;
  department: string | null;
  dirigeants: FrenchDirigeant[];
}

// Sirene "tranche d'effectif" code -> [min, max] employees.
const TRANCHE_RANGES: Record<string, [number, number]> = {
  '00': [0, 0], NN: [0, 0],
  '01': [1, 2], '02': [3, 5], '03': [6, 9],
  '11': [10, 19], '12': [20, 49],
  '21': [50, 99], '22': [100, 199],
  '31': [200, 249], '32': [250, 499],
  '41': [500, 999], '42': [1000, 1999],
  '51': [2000, 4999], '52': [5000, 9999], '53': [10000, 999999],
};

function tranchesForRange(min?: number, max?: number): string[] {
  if (min == null && max == null) return [];
  const lo = min ?? 0;
  const hi = max ?? Number.MAX_SAFE_INTEGER;
  return Object.entries(TRANCHE_RANGES)
    .filter(([code, [tlo, thi]]) => code !== 'NN' && thi >= lo && tlo <= hi)
    .map(([code]) => code);
}

// Raw shapes (defensive subset)

interface RawDirigeant {
  nom?: string | null;
  prenoms?: string | null;
  denomination?: string | null;
  qualite?: string | null;
  type_dirigeant?: string | null;
}

interface RawSiege {
  code_postal?: string | null;
  libelle_commune?: string | null;
  departement?: string | null;
}

interface RawCompany {
  siren?: string | null;
  nom_complet?: string | null;
  nom_raison_sociale?: string | null;
  activite_principale?: string | null;
  tranche_effectif_salarie?: string | null;
  siege?: RawSiege | null;
  dirigeants?: RawDirigeant[] | null;
}

interface RawResponse {
  results?: RawCompany[];
  total_results?: number;
}

function mapDirigeant(raw: RawDirigeant): FrenchDirigeant | null {
  const isCompany = (raw.type_dirigeant ?? '').toLowerCase().includes('morale');
  if (isCompany) {
    const name = raw.denomination?.trim();
    if (!name) return null;
    return { fullName: name, firstName: null, lastName: null, role: raw.qualite ?? null, isCompany: true };
  }
  const firstName = raw.prenoms?.trim() || null;
  const lastName = raw.nom?.trim() || null;
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
  if (!fullName) return null;
  return { fullName, firstName, lastName, role: raw.qualite ?? null, isCompany: false };
}

function mapCompany(raw: RawCompany): FrenchCompany | null {
  const siren = raw.siren?.trim();
  const name = raw.nom_complet ?? raw.nom_raison_sociale ?? null;
  if (!siren || !name) return null;
  const tranche = raw.tranche_effectif_salarie ?? null;
  const range = tranche ? TRANCHE_RANGES[tranche] : undefined;
  return {
    siren,
    name,
    naf: raw.activite_principale ?? null,
    employeeTranche: tranche,
    employeeMin: range ? range[0] : null,
    employeeMax: range ? range[1] : null,
    postalCode: raw.siege?.code_postal ?? null,
    city: raw.siege?.libelle_commune ?? null,
    department: raw.siege?.departement ?? null,
    dirigeants: (raw.dirigeants ?? [])
      .map(mapDirigeant)
      .filter((d): d is FrenchDirigeant => d !== null),
  };
}

async function govGet(params: Record<string, string | undefined>): Promise<RawResponse> {
  const usp = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value != null && value.length > 0) usp.set(key, value);
  }
  const response = await fetch(`${BASE}/search?${usp.toString()}`, {
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    const err = await response.text().catch(() => '');
    throw new Error(`recherche-entreprises /search -> ${response.status}: ${err.slice(0, 200)}`);
  }
  return response.json() as Promise<RawResponse>;
}

// Public API

/** Search active French companies by firmographic filters. Results include dirigeants inline. */
export async function searchFrenchCompanies(filters: FrenchCompanyFilters): Promise<FrenchCompany[]> {
  const tranches = tranchesForRange(filters.minEmployees, filters.maxEmployees);
  const data = await govGet({
    q: filters.query,
    activite_principale: filters.nafCodes?.join(','),
    departement: filters.departments?.join(','),
    code_postal: filters.postalCodes?.join(','),
    tranche_effectif_salarie: tranches.length ? tranches.join(',') : undefined,
    etat_administratif: 'A',
    page: filters.page ? String(filters.page) : undefined,
    per_page: String(Math.max(1, Math.min(25, filters.perPage ?? 10))),
  });
  return (data.results ?? [])
    .map(mapCompany)
    .filter((c): c is FrenchCompany => c !== null);
}

/** Fetch a single company (incl. dirigeants) by SIREN. Returns null for an invalid SIREN. */
export async function getFrenchCompanyBySiren(siren: string): Promise<FrenchCompany | null> {
  const digits = siren.replace(/\D/g, '');
  if (digits.length !== 9) return null;
  const data = await govGet({ q: digits, per_page: '1' });
  const match = (data.results ?? []).find((c) => (c.siren ?? '').replace(/\D/g, '') === digits)
    ?? data.results?.[0];
  return match ? mapCompany(match) : null;
}
