import { createClient } from '@supabase/supabase-js';

/**
 * Server-only Supabase client using the service role key.
 * MUST never be imported from client components.
 *
 * We defer reading env vars to a getter so that importing this module at
 * Next.js build time (when Vercel has not yet injected runtime secrets) does
 * not throw.  The client is created lazily on first use.
 */
let _client: ReturnType<typeof createClient> | null = null;

function getClient(): ReturnType<typeof createClient> {
  if (!_client) {
    const url = process.env['SUPABASE_URL'] ?? '';
    const key = process.env['SUPABASE_SERVICE_ROLE_KEY'] ?? '';
    if (!url || !key) {
      throw new Error('Missing required environment variable: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }
    _client = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    });
  }
  return _client;
}

export const supabase: ReturnType<typeof createClient> = new Proxy(
  {} as ReturnType<typeof createClient>,
  {
    get(_target, prop) {
      return (getClient() as Record<string | symbol, unknown>)[prop];
    },
  },
);
