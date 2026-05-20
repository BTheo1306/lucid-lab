import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Server-only Supabase client using the service role key.
 * MUST never be imported from client components.
 *
 * The client is created lazily so that importing this module during the
 * Next.js build phase (when Vercel has not yet injected runtime secrets)
 * does not throw at module-evaluation time.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _client: SupabaseClient<any, 'public', any> | null = null;
let _clientCredentials: { url: string; key: string } | null = null;

function cleanEnvValue(value: string | undefined): string {
  const trimmed = value?.trim() ?? '';
  if (trimmed.length < 2) return trimmed;

  const first = trimmed[0];
  const last = trimmed[trimmed.length - 1];
  if ((first === '"' && last === '"') || (first === "'" && last === "'")) {
    return trimmed.slice(1, -1).trim();
  }

  return trimmed;
}

function serverSupabaseUrl(): string {
  return cleanEnvValue(process.env['SUPABASE_URL']) || cleanEnvValue(process.env['NEXT_PUBLIC_SUPABASE_URL']);
}

function serverSupabaseKey(): string {
  return cleanEnvValue(process.env['SUPABASE_SERVICE_ROLE_KEY']) || cleanEnvValue(process.env['SUPABASE_SECRET_KEY']);
}

function jwtRole(key: string): string | null {
  const [, payload] = key.split('.');
  if (!payload) return null;

  try {
    const decoded = Buffer.from(payload, 'base64url').toString('utf8');
    const parsed = JSON.parse(decoded) as { role?: unknown };
    return typeof parsed.role === 'string' ? parsed.role : null;
  } catch {
    return null;
  }
}

function hasPrivilegedSupabaseKey(key: string): boolean {
  if (key.startsWith('sb_secret_')) return true;
  return jwtRole(key) === 'service_role';
}

export function assertSupabaseServiceRoleConfigured(): void {
  const key = serverSupabaseKey().trim();
  if (!key) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY. Lucid OS admin writes require a Supabase server secret key.');
  }

  if (!hasPrivilegedSupabaseKey(key)) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not a privileged Supabase server key. Replace the current publishable key with a Supabase secret key (`sb_secret_...`) or legacy service_role JWT before creating or editing CRM records.');
  }
}

export function supabaseServiceRoleConfigurationError(): string | null {
  try {
    assertSupabaseServiceRoleConfigured();
    return null;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getClient(): SupabaseClient<any, 'public', any> {
  const url = serverSupabaseUrl();
  const key = serverSupabaseKey();

  if (!_client || !_clientCredentials || _clientCredentials.url !== url || _clientCredentials.key !== key) {
    // At Next.js build time these vars may not be present.  We still create the
    // client (with empty strings) so module evaluation succeeds; the Supabase
    // client will throw / return an error on actual network calls, which every
    // caller already handles defensively (e.g. getAllPosts returns []).
    _client = createClient(url || 'http://localhost', key || 'anon', {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
    _clientCredentials = { url, key };
  }
  return _client;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase: SupabaseClient<any, 'public', any> = new Proxy(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  {} as SupabaseClient<any, 'public', any>,
  {
    get(_target, prop) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (getClient() as any)[prop];
    },
  },
);
