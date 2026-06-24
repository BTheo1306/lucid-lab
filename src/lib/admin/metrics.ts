import 'server-only';

import { supabase } from '@/lib/bot/db/supabase';

const ORG_SLUG = 'lucid-lab';

export type MetricsKpis = {
  mrrEurHt: number;
  activeClients: number;
  openPipelineEur: number;
  revenueCollectedEur: number;
};

export type RevenuePoint = { month: string; label: string; mrr: number; collected: number };
export type PipelinePoint = { stage: string; label: string; valueEur: number; count: number };
export type StatusPoint = { status: string; label: string; count: number };

export type MrrRow = { clientName: string; monthlyValueEur: number; closedAt: string | null };
export type CollectedRow = { clientName: string; amountTtcEur: number; occurredAt: string | null; dougsRef: string | null };
export type PipelineRow = { clientName: string; stage: string; stageLabel: string; valueEstimateEur: number };

export type AgencyMetrics = {
  kpis: MetricsKpis;
  revenueByMonth: RevenuePoint[];
  pipelineByStage: PipelinePoint[];
  clientsByStatus: StatusPoint[];
  mrrDetail: MrrRow[];
  collectedDetail: CollectedRow[];
  pipelineDetail: PipelineRow[];
};

const STAGE_LABELS: Record<string, string> = {
  new: 'Nouveau',
  qualified: 'Qualifié',
  discovery: 'Découverte',
  proposal_needed: 'Proposition à envoyer',
  proposal_sent: 'Proposition envoyée',
  negotiation: 'Négociation',
  won: 'Gagné',
  lost: 'Perdu',
  paused: 'En pause',
};

const STATUS_LABELS: Record<string, string> = {
  lead: 'Prospects',
  active: 'Actifs',
  paused: 'En pause',
  offboarded: 'Terminés',
  archived: 'Archivés',
};

function toNumber(value: unknown): number {
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

async function getOrganizationId(): Promise<string | null> {
  const { data, error } = await supabase.from('organizations').select('id').eq('slug', ORG_SLUG).maybeSingle();
  if (error || !data) return null;
  return (data as { id: string }).id;
}

export async function getAgencyMetrics(monthsBack = 6): Promise<AgencyMetrics> {
  const empty: AgencyMetrics = {
    kpis: { mrrEurHt: 0, activeClients: 0, openPipelineEur: 0, revenueCollectedEur: 0 },
    revenueByMonth: [],
    pipelineByStage: [],
    clientsByStatus: [],
    mrrDetail: [],
    collectedDetail: [],
    pipelineDetail: [],
  };

  const organizationId = await getOrganizationId();
  if (!organizationId) return empty;

  const [clientsRes, oppsRes, billingRes] = await Promise.all([
    supabase.from('clients').select('status').eq('organization_id', organizationId),
    supabase
      .from('client_opportunities')
      .select('stage,status,monthly_value_eur,value_estimate_eur,closed_at,clients(name)')
      .eq('organization_id', organizationId),
    supabase
      .from('client_billing_events')
      .select('billing_status,amount_ttc_eur,occurred_at,metadata,clients(name)')
      .eq('organization_id', organizationId),
  ]);

  const clients = (clientsRes.data ?? []) as Array<{ status: string | null }>;
  const opps = (oppsRes.data ?? []) as unknown as Array<{
    stage: string | null;
    status: string | null;
    monthly_value_eur: number | string | null;
    value_estimate_eur: number | string | null;
    closed_at: string | null;
    clients: { name: string }[] | null;
  }>;
  const billing = (billingRes.data ?? []) as unknown as Array<{
    billing_status: string | null;
    amount_ttc_eur: number | string | null;
    occurred_at: string | null;
    metadata: Record<string, unknown> | null;
    clients: { name: string }[] | null;
  }>;

  function clientName(c: { name: string }[] | null): string {
    return c?.[0]?.name ?? 'Client inconnu';
  }

  const wonOpps = opps.filter((o) => o.status === 'won');
  const paidBilling = billing.filter((b) => b.billing_status === 'paid');

  const kpis: MetricsKpis = {
    mrrEurHt: wonOpps.reduce((sum, o) => sum + toNumber(o.monthly_value_eur), 0),
    activeClients: clients.filter((c) => c.status === 'active').length,
    openPipelineEur: opps
      .filter((o) => o.status === 'open')
      .reduce((sum, o) => sum + toNumber(o.value_estimate_eur), 0),
    revenueCollectedEur: paidBilling.reduce((sum, b) => sum + toNumber(b.amount_ttc_eur), 0),
  };

  // Monthly buckets (oldest -> current), cumulative MRR + revenue collected in-month.
  const now = new Date();
  const months = Array.from({ length: monthsBack }, (_, idx) => {
    const start = new Date(now.getFullYear(), now.getMonth() - (monthsBack - 1 - idx), 1);
    const end = new Date(start.getFullYear(), start.getMonth() + 1, 1);
    return { key: monthKey(start), label: start.toLocaleDateString('fr-FR', { month: 'short' }), end };
  });

  const collectedByMonth = new Map<string, number>();
  for (const b of paidBilling) {
    if (!b.occurred_at) continue;
    const key = monthKey(new Date(b.occurred_at));
    collectedByMonth.set(key, (collectedByMonth.get(key) ?? 0) + toNumber(b.amount_ttc_eur));
  }

  const revenueByMonth: RevenuePoint[] = months.map((m) => ({
    month: m.key,
    label: m.label,
    mrr: wonOpps
      .filter((o) => o.closed_at && new Date(o.closed_at) < m.end)
      .reduce((sum, o) => sum + toNumber(o.monthly_value_eur), 0),
    collected: collectedByMonth.get(m.key) ?? 0,
  }));

  const stageMap = new Map<string, { valueEur: number; count: number }>();
  for (const o of opps.filter((x) => x.status === 'open')) {
    const stage = o.stage ?? 'new';
    const entry = stageMap.get(stage) ?? { valueEur: 0, count: 0 };
    entry.valueEur += toNumber(o.value_estimate_eur);
    entry.count += 1;
    stageMap.set(stage, entry);
  }
  const pipelineByStage: PipelinePoint[] = Array.from(stageMap.entries())
    .map(([stage, v]) => ({ stage, label: STAGE_LABELS[stage] ?? stage, valueEur: v.valueEur, count: v.count }))
    .sort((a, b) => b.valueEur - a.valueEur);

  const statusMap = new Map<string, number>();
  for (const c of clients) {
    const status = c.status ?? 'lead';
    statusMap.set(status, (statusMap.get(status) ?? 0) + 1);
  }
  const clientsByStatus: StatusPoint[] = Array.from(statusMap.entries())
    .map(([status, count]) => ({ status, label: STATUS_LABELS[status] ?? status, count }))
    .sort((a, b) => b.count - a.count);

  const mrrDetail: MrrRow[] = wonOpps
    .map((o) => ({
      clientName: clientName(o.clients),
      monthlyValueEur: toNumber(o.monthly_value_eur),
      closedAt: o.closed_at,
    }))
    .sort((a, b) => b.monthlyValueEur - a.monthlyValueEur);

  const collectedDetail: CollectedRow[] = paidBilling
    .map((b) => ({
      clientName: clientName(b.clients),
      amountTtcEur: toNumber(b.amount_ttc_eur),
      occurredAt: b.occurred_at,
      dougsRef: (b.metadata?.dougs_reference as string | null) ?? null,
    }))
    .sort((a, b) => new Date(b.occurredAt ?? 0).getTime() - new Date(a.occurredAt ?? 0).getTime());

  const pipelineDetail: PipelineRow[] = opps
    .filter((o) => o.status === 'open')
    .map((o) => ({
      clientName: clientName(o.clients),
      stage: o.stage ?? 'new',
      stageLabel: STAGE_LABELS[o.stage ?? 'new'] ?? (o.stage ?? 'new'),
      valueEstimateEur: toNumber(o.value_estimate_eur),
    }))
    .sort((a, b) => b.valueEstimateEur - a.valueEstimateEur);

  return { kpis, revenueByMonth, pipelineByStage, clientsByStatus, mrrDetail, collectedDetail, pipelineDetail };
}
