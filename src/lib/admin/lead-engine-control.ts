import 'server-only';

import { supabase } from '@/lib/bot/db/supabase';
import {
  ensureWorkspaceId,
  isOutreachEnabled,
  getSenderAccountByLabel,
  getDailyCounter,
} from './lead-engine-store';
import { recordLucidAuditEvent } from './lucid-os';

/**
 * Lead Engine v2: control-panel reads + the kill switch.
 * Best-effort reads (counts degrade to 0 before the migration is applied).
 */

export interface ControlMessage {
  id: string;
  stepKind: string | null;
  body: string | null;
  personName: string | null;
  personTitle: string | null;
  linkedinUrl: string | null;
  company: string | null;
  /** Campaign motion: 'founder_smb' (Claude + Obsidian) | 'enterprise' (grand groupe). */
  motion: string | null;
}

export interface LeadRunSummary {
  runType: string;
  status: string;
  startedAt: string | null;
  finishedAt: string | null;
  queued: number;
  humanTouch: number;
  skipped: number;
}

export interface ControlPanelData {
  outreachEnabled: boolean;
  sender: {
    label: string;
    status: string;
    dailyInviteCap: number;
    dailyMessageCap: number;
    invitesSentToday: number;
    messagesSentToday: number;
    lastSeenAt: string | null;
    sessionExpired: boolean;
  } | null;
  funnel: {
    discovered: number;
    queued: number;
    handedToHuman: number;
    contacted: number;
    replied: number;
    converted: number;
  };
  humanTouch: ControlMessage[];
  queue: ControlMessage[];
  lastRun: LeadRunSummary | null;
}

async function countPeople(workspaceId: string, status: string): Promise<number> {
  const { count } = await supabase
    .from('prospect_people')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .eq('status', status);
  return count ?? 0;
}

async function countMessages(workspaceId: string, status: string): Promise<number> {
  const { count } = await supabase
    .from('outreach_messages')
    .select('id', { count: 'exact', head: true })
    .eq('workspace_id', workspaceId)
    .eq('status', status);
  return count ?? 0;
}

async function listMessages(workspaceId: string, status: string, limit: number): Promise<ControlMessage[]> {
  const { data } = await supabase
    .from('outreach_messages')
    .select('id,step_kind,body_text,person_id,company_id,campaign_id,created_at')
    .eq('workspace_id', workspaceId)
    .eq('status', status)
    .order('created_at', { ascending: false })
    .limit(limit);
  const rows = data ?? [];
  if (rows.length === 0) return [];

  const personIds = [...new Set(rows.map((r) => r.person_id).filter(Boolean))] as string[];
  const companyIds = [...new Set(rows.map((r) => r.company_id).filter(Boolean))] as string[];
  const people = personIds.length
    ? (await supabase.from('prospect_people').select('id,full_name,title,linkedin_url').in('id', personIds)).data ?? []
    : [];
  const companies = companyIds.length
    ? (await supabase.from('prospect_companies').select('id,name').in('id', companyIds)).data ?? []
    : [];
  const campaignIds = [...new Set(rows.map((r) => r.campaign_id).filter(Boolean))] as string[];
  const campaigns = campaignIds.length
    ? (await supabase.from('lead_engine_campaigns').select('id,icp_config').in('id', campaignIds)).data ?? []
    : [];
  const pMap = new Map(people.map((p) => [String(p.id), p]));
  const cMap = new Map(companies.map((c) => [String(c.id), c]));
  const motionMap = new Map(
    campaigns.map((c) => [String(c.id), String((c.icp_config as Record<string, unknown> | null)?.['motion'] ?? '') || null]),
  );

  return rows.map((r) => {
    const person = r.person_id ? pMap.get(String(r.person_id)) : undefined;
    const company = r.company_id ? cMap.get(String(r.company_id)) : undefined;
    return {
      id: String(r.id),
      stepKind: r.step_kind ? String(r.step_kind) : null,
      body: r.body_text ? String(r.body_text) : null,
      personName: person?.full_name ? String(person.full_name) : null,
      personTitle: person?.title ? String(person.title) : null,
      linkedinUrl: person?.linkedin_url ? String(person.linkedin_url) : null,
      company: company?.name ? String(company.name) : null,
      motion: r.campaign_id ? motionMap.get(String(r.campaign_id)) ?? null : null,
    };
  });
}

export async function getControlPanelData(): Promise<ControlPanelData> {
  const workspaceId = await ensureWorkspaceId();
  const [outreachEnabled, sender] = await Promise.all([
    isOutreachEnabled(),
    getSenderAccountByLabel('Anthony', 'linkedin'),
  ]);
  const today = sender ? await getDailyCounter(sender.id) : { invitesSent: 0, messagesSent: 0 };

  let lastSeenAt: string | null = null;
  let sessionExpired = false;
  if (sender) {
    const { data } = await supabase
      .from('outreach_sender_accounts')
      .select('last_seen_at,session_expired')
      .eq('id', sender.id)
      .maybeSingle();
    lastSeenAt = data?.last_seen_at ? String(data.last_seen_at) : null;
    sessionExpired = Boolean(data?.session_expired);
  }

  const [discovered, enriched, queued, dispatched, handedToHuman, contacted, replied, converted] = await Promise.all([
    countPeople(workspaceId, 'discovered'),
    countPeople(workspaceId, 'enriched'),
    countMessages(workspaceId, 'queued'),
    countMessages(workspaceId, 'dispatched'),
    countMessages(workspaceId, 'handed_to_human'),
    countPeople(workspaceId, 'contacted'),
    countPeople(workspaceId, 'replied'),
    countPeople(workspaceId, 'converted'),
  ]);

  const [humanTouch, queueList] = await Promise.all([
    listMessages(workspaceId, 'handed_to_human', 10),
    listMessages(workspaceId, 'queued', 10),
  ]);

  const { data: lastRunRow } = await supabase
    .from('lead_engine_runs')
    .select('run_type,status,started_at,finished_at,summary')
    .eq('workspace_id', workspaceId)
    .order('started_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  const runSummary = (lastRunRow?.summary ?? {}) as Record<string, unknown>;
  const lastRun: LeadRunSummary | null = lastRunRow
    ? {
        runType: String(lastRunRow.run_type),
        status: String(lastRunRow.status),
        startedAt: lastRunRow.started_at ? String(lastRunRow.started_at) : null,
        finishedAt: lastRunRow.finished_at ? String(lastRunRow.finished_at) : null,
        queued: Number(runSummary['queued'] ?? 0),
        humanTouch: Number(runSummary['humanTouch'] ?? 0),
        skipped: Number(runSummary['skipped'] ?? 0),
      }
    : null;

  return {
    outreachEnabled,
    sender: sender
      ? {
          label: sender.label,
          status: sender.status,
          dailyInviteCap: sender.dailyInviteCap,
          dailyMessageCap: sender.dailyMessageCap,
          invitesSentToday: today.invitesSent,
          messagesSentToday: today.messagesSent,
          lastSeenAt,
          sessionExpired,
        }
      : null,
    funnel: { discovered: discovered + enriched, queued: queued + dispatched, handedToHuman, contacted, replied, converted },
    humanTouch,
    queue: queueList,
    lastRun,
  };
}

export async function setOutreachEnabled(enabled: boolean): Promise<void> {
  const workspaceId = await ensureWorkspaceId();
  await supabase.from('lead_engine_workspaces').update({ outreach_enabled: enabled }).eq('id', workspaceId);
  await recordLucidAuditEvent({
    eventType: enabled ? 'lead_outreach_enabled' : 'lead_outreach_paused',
    summary: `Lead engine outreach ${enabled ? 'activé' : 'mis en pause (kill switch)'}`,
    actorType: 'admin',
    riskLevel: enabled ? 'low' : 'medium',
    targetTable: 'lead_engine_workspaces',
    targetId: workspaceId,
  });
}
