import { NextResponse } from 'next/server';
import { config } from '@/lib/bot/config';
import { deleteMessagesOlderThan } from '@/lib/bot/db/queries/messages';
import { deleteOldRateLimitBuckets } from '@/lib/bot/db/queries/rate-limit';
import { deleteAuditLogsOlderThan, logSecurityEvent } from '@/lib/bot/db/queries/security-audit';
import { supabase } from '@/lib/bot/db/supabase';

export const runtime = 'nodejs';
export const maxDuration = 60;

function isAuthorized(req: Request): boolean {
  if (!config.cronSecret) return false;
  const header = req.headers.get('authorization');
  return header === `Bearer ${config.cronSecret}`;
}

/** GET /api/cron/data-retention — Enforce GDPR retention windows. */
export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    await logSecurityEvent({
      event_type: 'cron_unauthorized',
      details: { route: 'data-retention' },
    });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const results: Record<string, number> = {};

  try {
    results.messages_deleted = await deleteMessagesOlderThan(config.retentionMessagesDays);

    const leadsCutoff = new Date(
      Date.now() - config.retentionLeadsLostDays * 86_400_000,
    ).toISOString();
    const { count: leadsDeleted } = await supabase
      .from('leads')
      .delete({ count: 'exact' })
      .eq('status', 'lost')
      .lt('created_at', leadsCutoff);
    results.leads_lost_deleted = leadsDeleted ?? 0;

    results.audit_deleted = await deleteAuditLogsOlderThan(config.retentionAuditLogDays);

    // Anonymize contacts with no active conversation + no lead + older than retention
    const contactCutoff = new Date(
      Date.now() - config.retentionMessagesDays * 86_400_000,
    ).toISOString();
    const { data: staleContacts } = await supabase
      .from('contacts')
      .select('id')
      .is('deletion_completed_at', null)
      .lt('updated_at', contactCutoff)
      .limit(1000);

    let anonymized = 0;
    for (const c of staleContacts ?? []) {
      const { count: activeConvs } = await supabase
        .from('conversations')
        .select('*', { count: 'exact', head: true })
        .eq('contact_id', c.id)
        .neq('status', 'closed');
      if ((activeConvs ?? 0) > 0) continue;

      await supabase
        .from('contacts')
        .update({
          email: null,
          first_name: null,
          last_name: null,
          company: null,
          visitor_ip_hash: null,
          user_agent: null,
          deletion_completed_at: new Date().toISOString(),
        })
        .eq('id', c.id);
      anonymized++;
    }
    results.contacts_anonymized = anonymized;

    // Clean old rate-limit buckets (24h+)
    await deleteOldRateLimitBuckets(86_400);
    results.rate_limit_cleaned = 1;

    return NextResponse.json({ ok: true, results });
  } catch (err) {
    console.error('[cron/data-retention] failed:', err);
    return NextResponse.json({ error: (err as Error).message, results }, { status: 500 });
  }
}
