import 'server-only';

import { supabase } from '@/lib/bot/db/supabase';

const ORG_SLUG = 'lucid-lab';

export interface DashboardTask {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  ownerLabel: string | null;
  dueAt: string | null;
  clientId: string;
  clientName: string;
  clientSlug: string;
}

export async function getAllClientTasksForDashboard(): Promise<DashboardTask[]> {
  const { data: org } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', ORG_SLUG)
    .maybeSingle();

  if (!org) return [];
  const orgId = (org as { id: string }).id;

  const [clientsRes, tasksRes] = await Promise.all([
    supabase.from('clients').select('id,name,slug').eq('organization_id', orgId),
    supabase
      .from('client_tasks')
      .select('id,title,description,status,priority,owner_label,due_at,client_id')
      .eq('organization_id', orgId)
      .neq('status', 'cancelled')
      .order('due_at', { ascending: true, nullsFirst: false }),
  ]);

  const clients = (clientsRes.data ?? []) as Array<{ id: string; name: string; slug: string }>;
  const tasks = (tasksRes.data ?? []) as Array<{
    id: string; title: string; description: string | null;
    status: string; priority: string; owner_label: string | null;
    due_at: string | null; client_id: string;
  }>;

  const clientById = new Map(clients.map((c) => [c.id, c]));

  return tasks
    .map((t) => {
      const client = clientById.get(t.client_id);
      if (!client) return null;
      return {
        id: t.id,
        title: t.title,
        description: t.description,
        status: t.status,
        priority: t.priority,
        ownerLabel: t.owner_label,
        dueAt: t.due_at,
        clientId: t.client_id,
        clientName: client.name,
        clientSlug: client.slug,
      };
    })
    .filter((t): t is DashboardTask => t !== null);
}
