import { supabase } from '../supabase';

export interface Lead {
  id: string;
  contact_id: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  project_brief: string | null;
  interest: Record<string, unknown> | null;
  notes: string | null;
  follow_up_at: string | null;
  last_followup_sent_at: string | null;
  followup_step: number;
  marketing_consent: boolean;
  marketing_consent_source: string | null;
  created_at: string;
  updated_at: string;
}

export type LeadInsert = Pick<Lead, 'contact_id'> &
  Partial<Omit<Lead, 'id' | 'created_at' | 'updated_at' | 'contact_id'>>;

export async function findLeadByContactId(contactId: string): Promise<Lead | null> {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .eq('contact_id', contactId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function createLead(lead: LeadInsert): Promise<Lead> {
  const { data, error } = await supabase
    .from('leads')
    .insert(lead)
    .select()
    .single();

  if (error) throw error;
  return data as Lead;
}

export async function updateLead(
  id: string,
  updates: Partial<Omit<Lead, 'id' | 'created_at'>>,
): Promise<Lead> {
  const { data, error } = await supabase
    .from('leads')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as Lead;
}

/**
 * Find leads due for follow-up emails. Returns only leads with marketing consent.
 * followup_step: 0 = never emailed, 1 = 24h sent, 2 = 72h sent, 3 = 7d sent (done)
 */
export async function findLeadsDueForFollowUp(): Promise<Lead[]> {
  const now = new Date();
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .in('status', ['new', 'contacted', 'qualified'])
    .eq('marketing_consent', true)
    .lt('followup_step', 3);

  if (error) throw error;

  // Filter in-app: check if due based on followup_step
  return (data ?? []).filter((l: Lead) => {
    const created = new Date(l.created_at);
    const last = l.last_followup_sent_at ? new Date(l.last_followup_sent_at) : null;
    const hoursSinceCreated = (now.getTime() - created.getTime()) / 3_600_000;
    const hoursSinceLast = last ? (now.getTime() - last.getTime()) / 3_600_000 : Infinity;

    switch (l.followup_step) {
      case 0:
        return hoursSinceCreated >= 24;
      case 1:
        return hoursSinceLast >= 48; // total ~72h after created
      case 2:
        return hoursSinceLast >= 96; // total ~7d after created
      default:
        return false;
    }
  });
}

export async function countLeadsSince(since: Date): Promise<number> {
  const { count, error } = await supabase
    .from('leads')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', since.toISOString());

  if (error) throw error;
  return count ?? 0;
}

export async function listRecentLeads(limit = 10): Promise<Lead[]> {
  const { data, error } = await supabase
    .from('leads')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as Lead[];
}
