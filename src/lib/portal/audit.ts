import 'server-only';

import { supabase } from '@/lib/bot/db/supabase';

/**
 * Audit trail for portal activity (logins, requests, downloads, intake).
 * Writes audit_events with actor_type 'client'. Failures are logged, never
 * thrown: an audit hiccup must not break a client-facing flow.
 */
export async function recordPortalAuditEvent(input: {
  organizationId: string;
  clientId: string;
  eventType: string;
  summary: string;
  actorId?: string | null;
  targetTable?: string | null;
  targetId?: string | null;
  riskLevel?: 'low' | 'medium' | 'high';
  details?: Record<string, unknown>;
}): Promise<void> {
  const { error } = await supabase.from('audit_events').insert({
    organization_id: input.organizationId,
    client_id: input.clientId,
    actor_type: 'client',
    actor_id: input.actorId ?? null,
    event_type: input.eventType,
    target_table: input.targetTable ?? null,
    target_id: input.targetId ?? null,
    risk_level: input.riskLevel ?? 'low',
    summary: input.summary,
    details: input.details ?? {},
  });

  if (error) {
    console.error('[portal] recordPortalAuditEvent failed:', error.message);
  }
}
