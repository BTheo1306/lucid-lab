import { createClient } from '@supabase/supabase-js';
import { config } from '../config';

/**
 * Server-only Supabase client using the service role key.
 * MUST never be imported from client components.
 */
export const supabase = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});
