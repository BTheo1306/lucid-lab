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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function getClient(): SupabaseClient<any, 'public', any> {
  if (!_client) {
    const url = process.env['SUPABASE_URL'] ?? '';
    const key = process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? '';
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
