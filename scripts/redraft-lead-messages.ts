/**
 * One-off: re-draft existing lead-engine outreach messages with the improved
 * native-French gap-selling prompt.
 *
 * Reuses the gap-selling research already stored on each message (no new
 * sourcing, no TheirStack/gov credits): only the Claude DRAFT step re-runs.
 * Updates the primary message (invite / human_touch) body + its stored
 * follow-up, and the linked follow-up draft row for auto-lane invites.
 *
 * Nothing is sent: this only rewrites drafts/queued copy in place.
 *
 * Usage:
 *   NODE_OPTIONS=--conditions=react-server npx tsx scripts/redraft-lead-messages.ts
 */

// Load .env.local the same way Next.js does, before anything reads process.env.
import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

interface CaseStudyRow {
  vertical: string;
  proofLine: string;
  metric: string | null;
}

function pickCaseStudy(industry: string | null, caseStudies: CaseStudyRow[]) {
  if (!industry || caseStudies.length === 0) return null;
  const lc = industry.toLowerCase();
  const hit = caseStudies.find((cs) => {
    const v = cs.vertical.toLowerCase();
    return lc.includes(v) || v.includes(lc);
  });
  return hit ? { vertical: hit.vertical, proofLine: hit.proofLine, metric: hit.metric } : null;
}

async function main(): Promise<void> {
  // Dynamic imports so env vars are loaded before config.ts / server modules run.
  const { supabase } = await import('@/lib/bot/db/supabase');
  const { draftGapSellingOutreach } = await import('@/lib/admin/lead-engine-research');

  // Campaign offer/cta map.
  const { data: campaignRows } = await supabase
    .from('lead_engine_campaigns')
    .select('id,icp_config,outreach_config');
  const campaigns = new Map<string, { offer: string; cta: string }>();
  for (const c of campaignRows ?? []) {
    campaigns.set(String(c.id), {
      offer: String(c.icp_config?.offer ?? 'une mise en place IA sur mesure'),
      cta: String(c.outreach_config?.cta ?? 'un échange de 20 minutes'),
    });
  }

  // Case-study library.
  const { data: csRows } = await supabase
    .from('outreach_case_studies')
    .select('vertical,proof_line,metric')
    .eq('is_active', true);
  const caseStudies: CaseStudyRow[] = (csRows ?? []).map((r) => ({
    vertical: String(r.vertical),
    proofLine: String(r.proof_line),
    metric: r.metric ? String(r.metric) : null,
  }));

  // Hiring-role signal per person (rebuilds the invite hook for Motion 2).
  const { data: sigRows } = await supabase
    .from('prospect_signals')
    .select('person_id,value')
    .eq('signal_type', 'hiring_role');
  const hiringByPerson = new Map<string, string>();
  for (const s of sigRows ?? []) {
    const jt = (s.value as Record<string, unknown> | null)?.['job_title'];
    if (s.person_id && typeof jt === 'string') hiringByPerson.set(String(s.person_id), jt);
  }

  // Primary, not-yet-sent messages.
  const { data: msgs, error } = await supabase
    .from('outreach_messages')
    .select('id,campaign_id,company_id,person_id,step_kind,status,personalization')
    .in('step_kind', ['invite', 'human_touch'])
    .in('status', ['queued', 'handed_to_human']);
  if (error) throw error;

  console.log(`Re-drafting ${msgs?.length ?? 0} messages…`);
  let done = 0;
  let failed = 0;
  const samples: Array<{ company: string; invite: string; followup: string }> = [];

  for (const m of msgs ?? []) {
    try {
      const { data: person } = await supabase
        .from('prospect_people')
        .select('first_name,full_name,title')
        .eq('id', m.person_id)
        .maybeSingle();
      const { data: company } = await supabase
        .from('prospect_companies')
        .select('name,industry,city,country,employee_count')
        .eq('id', m.company_id)
        .maybeSingle();
      if (!person || !company) {
        failed++;
        continue;
      }

      const research = (m.personalization?.research ?? {}) as Record<string, unknown>;
      const campaign = campaigns.get(String(m.campaign_id));

      const draft = await draftGapSellingOutreach({
        senderName: 'Anthony',
        companyName: String(company.name),
        contactFirstName: (person.first_name as string) ?? (person.full_name as string) ?? null,
        contactTitle: (person.title as string) ?? null,
        industry: (company.industry as string) ?? null,
        hiringRoleTitle: hiringByPerson.get(String(m.person_id)) ?? null,
        research: {
          problem: String(research['problem'] ?? ''),
          impact: String(research['impact'] ?? ''),
          persona: String(research['persona'] ?? ''),
          angle: String(research['angle'] ?? ''),
        },
        caseStudy: pickCaseStudy((company.industry as string) ?? null, caseStudies),
        offer: campaign?.offer ?? 'une mise en place IA sur mesure',
        cta: campaign?.cta ?? 'un échange de 20 minutes',
        language: 'fr',
      });

      const personalization = {
        ...(m.personalization ?? {}),
        followup: draft.followup,
        whyFit: draft.whyFit,
      };

      await supabase
        .from('outreach_messages')
        .update({ body_text: draft.inviteNote, personalization })
        .eq('id', m.id);

      if (m.step_kind === 'invite') {
        await supabase
          .from('outreach_messages')
          .update({ body_text: draft.followup })
          .eq('parent_message_id', m.id)
          .eq('step_kind', 'followup');
      }

      done++;
      if (samples.length < 3) {
        samples.push({ company: String(company.name), invite: draft.inviteNote, followup: draft.followup });
      }
      process.stdout.write('.');
    } catch (err) {
      failed++;
      console.error(`\n  ✗ ${m.id}:`, (err as Error).message);
    }
  }

  console.log(`\nDone. ${done} re-drafted, ${failed} failed.`);
  for (const s of samples) {
    console.log(`\n=== ${s.company} ===`);
    console.log(`INVITE   : ${s.invite}`);
    console.log(`FOLLOWUP : ${s.followup}`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
