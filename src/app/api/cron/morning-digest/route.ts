import { NextResponse } from 'next/server';
import { config } from '@/lib/bot/config';
import { bearerMatches } from '@/lib/security/constant-time';
import { countLeadsSince, listRecentLeads } from '@/lib/bot/db/queries/leads';
import { supabase } from '@/lib/bot/db/supabase';
import { sendMorningDigest } from '@/lib/bot/integrations/email-client';
import { logSecurityEvent } from '@/lib/bot/db/queries/security-audit';
import { countOpenTicketsForDigest, listOpenTicketsForDigest } from '@/lib/admin/tickets';

export const runtime = 'nodejs';
export const maxDuration = 30;

function isAuthorized(req: Request): boolean {
  if (!config.cronSecret) return false;
  return bearerMatches(req.headers.get('authorization'), config.cronSecret);
}

/** GET /api/cron/morning-digest — Email yesterday's bot activity to the team. */
export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    await logSecurityEvent({ event_type: 'cron_unauthorized', details: { route: 'morning-digest' } });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const now = new Date();
  const since = new Date(now.getTime() - 24 * 3_600_000);
  const dateLabel = since.toISOString().slice(0, 10);

  const leadsCount = await countLeadsSince(since);

  const { count: conversationsCount } = await supabase
    .from('conversations')
    .select('*', { count: 'exact', head: true })
    .gte('started_at', since.toISOString());

  const { count: escalationsCount } = await supabase
    .from('conversations')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'escalated')
    .gte('escalated_at', since.toISOString());

  const recent = await listRecentLeads(5);
  const recentWithContacts = await Promise.all(
    recent.map(async (l) => {
      const { data: c } = await supabase
        .from('contacts')
        .select('email,first_name')
        .eq('id', l.contact_id)
        .maybeSingle();
      return {
        email: c?.email ?? 'anonymous',
        firstName: (c?.first_name as string | null) ?? null,
        projectBrief: l.project_brief,
        contactId: l.contact_id,
      };
    }),
  );

  // Tickets clients encore ouverts (portail). Best-effort : un souci sur ces
  // requetes ne doit pas priver l'equipe du reste du digest.
  let openTickets: Parameters<typeof sendMorningDigest>[0]['openTickets'];
  try {
    const [ticketsCount, oldestTickets] = await Promise.all([
      countOpenTicketsForDigest(),
      listOpenTicketsForDigest(5),
    ]);
    openTickets = {
      count: ticketsCount,
      oldest: oldestTickets.map((ticket) => ({
        reference: ticket.reference,
        title: ticket.title,
        clientName: ticket.clientName,
        ageDays: Math.max(0, Math.floor((now.getTime() - new Date(ticket.createdAt).getTime()) / 86_400_000)),
      })),
      adminUrl: `${config.adminBaseUrl}/lucid-os/tickets`,
    };
  } catch (error) {
    console.error('[morning-digest] tickets section failed:', error instanceof Error ? error.message : error);
  }

  await sendMorningDigest({
    dateLabel,
    leadsCount,
    conversationsCount: conversationsCount ?? 0,
    escalationsCount: escalationsCount ?? 0,
    recentLeads: recentWithContacts,
    openTickets,
  });

  return NextResponse.json({
    ok: true,
    date: dateLabel,
    leads: leadsCount,
    conversations: conversationsCount ?? 0,
    escalations: escalationsCount ?? 0,
    openTickets: openTickets?.count ?? null,
  });
}
