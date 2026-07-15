import { NextResponse } from 'next/server';
import { config } from '@/lib/bot/config';
import { bearerMatches } from '@/lib/security/constant-time';
import { findLeadsDueForFollowUp, updateLead } from '@/lib/bot/db/queries/leads';
import { findContactById } from '@/lib/bot/db/queries/contacts';
import { sendLeadFollowup } from '@/lib/bot/integrations/email-client';
import { logSecurityEvent } from '@/lib/bot/db/queries/security-audit';

export const runtime = 'nodejs';
export const maxDuration = 60;

function isAuthorized(req: Request): boolean {
  if (!config.cronSecret) return false;
  return bearerMatches(req.headers.get('authorization'), config.cronSecret);
}

/** GET /api/cron/lead-followup — Send nurture emails to leads due. */
export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    await logSecurityEvent({ event_type: 'cron_unauthorized', details: { route: 'lead-followup' } });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Séquence de relance mise en pause le 2026-06-22 à la demande de Jules : copie
  // jugée trop insistante et claim non vérifiable. À retravailler avec du vrai trafic.
  // Le cron a aussi été retiré de vercel.json. Repasser à false pour réactiver.
  const LEAD_FOLLOWUP_DISABLED: boolean = true;
  if (LEAD_FOLLOWUP_DISABLED) {
    return NextResponse.json({ ok: true, disabled: true, reason: 'sequence paused 2026-06-22' });
  }

  const leads = await findLeadsDueForFollowUp();
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (const lead of leads) {
    const contact = await findContactById(lead.contact_id);
    if (!contact || !contact.email || contact.deletion_completed_at) {
      skipped++;
      continue;
    }

    const nextStep = (lead.followup_step + 1) as 1 | 2 | 3;

    try {
      await sendLeadFollowup({
        to: contact.email,
        firstName: contact.first_name,
        language: (contact.language as 'fr' | 'en') ?? 'fr',
        step: nextStep,
      });
      await updateLead(lead.id, {
        followup_step: nextStep,
        last_followup_sent_at: new Date().toISOString(),
        status: lead.status === 'new' ? 'contacted' : lead.status,
      });
      sent++;
    } catch (err) {
      console.error('[cron/lead-followup] send failed for lead', lead.id, err);
      failed++;
    }
  }

  return NextResponse.json({ ok: true, candidates: leads.length, sent, skipped, failed });
}
