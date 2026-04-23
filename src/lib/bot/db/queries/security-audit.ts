import { supabase } from '../supabase';

export interface SecurityAuditEvent {
  contact_id?: string | null;
  event_type:
    | 'rate_limit_breach'
    | 'origin_rejected'
    | 'turnstile_failed'
    | 'erasure_requested'
    | 'erasure_completed'
    | 'admin_access'
    | 'admin_unauthorized'
    | 'cron_unauthorized'
    | 'budget_exceeded';
  details: Record<string, unknown>;
  ip_hash?: string | null;
}

export async function logSecurityEvent(event: SecurityAuditEvent): Promise<void> {
  await supabase.from('security_audit_log').insert(event);
}

export async function deleteAuditLogsOlderThan(days: number): Promise<number> {
  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
  const { error, count } = await supabase
    .from('security_audit_log')
    .delete({ count: 'exact' })
    .lt('created_at', cutoff);

  if (error) throw error;
  return count ?? 0;
}
