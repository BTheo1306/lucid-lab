import 'server-only';

import { supabase } from '@/lib/bot/db/supabase';
import type { PortalSession } from './auth';

/**
 * Unique read layer for the client portal. Every function takes the
 * authenticated PortalSession and injects organization + client scoping on
 * each query: portal routes never touch Supabase directly (enforced by an
 * ESLint no-restricted-imports rule on src/app/portal).
 */

export type PortalTaskStatus = 'todo' | 'in_progress' | 'waiting' | 'done';

export interface PortalTask {
  id: string;
  title: string;
  description: string | null;
  status: PortalTaskStatus;
  priority: string;
  dueAt: string | null;
  completedAt: string | null;
}

export async function listPortalTasks(session: PortalSession, limit = 120): Promise<PortalTask[]> {
  const { data, error } = await supabase
    .from('client_tasks')
    .select('id,title,description,status,priority,due_at,completed_at,updated_at')
    .eq('organization_id', session.organizationId)
    .eq('client_id', session.clientId)
    .eq('client_visible', true)
    .neq('status', 'cancelled')
    .order('due_at', { ascending: true, nullsFirst: false })
    .limit(limit);

  if (error) {
    console.error('[portal] listPortalTasks failed:', error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: String(row.id),
    title: String(row.title ?? ''),
    description: row.description ? String(row.description) : null,
    status: (['todo', 'in_progress', 'waiting', 'done'].includes(String(row.status))
      ? String(row.status)
      : 'todo') as PortalTaskStatus,
    priority: String(row.priority ?? 'normal'),
    dueAt: row.due_at ? String(row.due_at) : null,
    completedAt: row.completed_at ? String(row.completed_at) : null,
  }));
}

export interface PortalMeeting {
  id: string;
  title: string;
  clientSummary: string;
  occurredAt: string;
}

/** Client-safe meeting recaps only: the internal notes column is never selected. */
export async function listPortalMeetings(session: PortalSession, limit = 20): Promise<PortalMeeting[]> {
  const { data, error } = await supabase
    .from('client_interactions')
    .select('id,summary,client_summary,occurred_at')
    .eq('organization_id', session.organizationId)
    .eq('client_id', session.clientId)
    .eq('interaction_type', 'meeting')
    .eq('client_visible', true)
    .not('client_summary', 'is', null)
    .order('occurred_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[portal] listPortalMeetings failed:', error.message);
    return [];
  }

  return (data ?? [])
    .filter((row) => row.client_summary)
    .map((row) => ({
      id: String(row.id),
      title: String(row.summary ?? 'Réunion'),
      clientSummary: String(row.client_summary),
      occurredAt: String(row.occurred_at ?? ''),
    }));
}

export interface PortalProject {
  id: string;
  name: string;
  projectType: string;
  status: string;
  summary: string | null;
  dueAt: string | null;
  updatedAt: string | null;
}

export async function listPortalProjects(session: PortalSession, limit = 25): Promise<PortalProject[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('id,name,project_type,status,summary,due_at,updated_at')
    .eq('organization_id', session.organizationId)
    .eq('client_id', session.clientId)
    .neq('status', 'archived')
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[portal] listPortalProjects failed:', error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: String(row.id),
    name: String(row.name ?? ''),
    projectType: String(row.project_type ?? 'website'),
    status: String(row.status ?? 'active'),
    summary: row.summary ? String(row.summary) : null,
    dueAt: row.due_at ? String(row.due_at) : null,
    updatedAt: row.updated_at ? String(row.updated_at) : null,
  }));
}
