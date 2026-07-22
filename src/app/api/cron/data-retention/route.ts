import { NextResponse } from 'next/server';
import { config } from '@/lib/bot/config';
import { deleteMessagesOlderThan } from '@/lib/bot/db/queries/messages';
import { deleteOldRateLimitBuckets } from '@/lib/bot/db/queries/rate-limit';
import { deleteAuditLogsOlderThan, logSecurityEvent } from '@/lib/bot/db/queries/security-audit';
import { supabase } from '@/lib/bot/db/supabase';
import { bearerMatches } from '@/lib/security/constant-time';

export const runtime = 'nodejs';
export const maxDuration = 60;

function isAuthorized(req: Request): boolean {
  return bearerMatches(req.headers.get('authorization'), config.cronSecret);
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

    // Purge portal login tokens expired for more than 30 days (covers used
    // tokens too: they all carry a short expiry from creation)
    const portalTokenCutoff = new Date(Date.now() - 30 * 86_400_000).toISOString();
    const { count: portalTokensDeleted } = await supabase
      .from('portal_login_tokens')
      .delete({ count: 'exact' })
      .lt('expires_at', portalTokenCutoff);
    results.portal_login_tokens_deleted = portalTokensDeleted ?? 0;

    return NextResponse.json({ ok: true, results });
  } catch (err) {
    console.error('[cron/data-retention] failed:', err);
    return NextResponse.json({ error: (err as Error).message, results }, { status: 500 });
  }
}
