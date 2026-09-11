import 'server-only';

import { supabase } from '@/lib/bot/db/supabase';
import { config } from '@/lib/bot/config';

const DOUGS_BASE = 'https://app.dougs.fr';
const ORG_SLUG = 'lucid-lab';

interface DougsInvoice {
  id: string;
  reference: string;
  clientName: string;
  amount: number;
  netAmount: number;
  vatAmount: number;
  currency: string;
  paymentStatus: string;
  paidAt: string | null;
  date: string;
  dueDate: string | null;
  isRefund: boolean;
  isDraft: boolean;
}

export interface DougsSyncResult {
  inserted: number;
  updated: number;
  skipped: number;
  unmatched: string[];
  creditNotesForReview: string[];
  errors: string[];
  sessionExpired: boolean;
}

export type DougsBillingState = {
  eventType: 'payment_received' | 'credit_note' | 'invoice_generated' | 'payment_overdue';
  billingStatus: 'paid' | 'cancelled' | 'due' | 'overdue';
  occurredAt: string;
};

/**
 * Maps one Dougs invoice to the CRM billing event it should produce.
 *
 * An invoice flagged `isRefund` is an avoir: in Dougs it counts NEGATIVE against
 * revenue. `client_billing_events_amount_check` forbids negative amounts, so an
 * avoir cannot be stored as a negative payment. It is stored as 'cancelled'
 * instead, which keeps it out of `revenueCollectedEur` (metrics.ts sums
 * `billing_status = 'paid'` and subtracts nothing). Storing it as 'paid' made an
 * avoir ADD its amount to revenue instead of netting out (a 2x error).
 *
 * Same convention the /dougs-sync skill applies by hand, where the credited
 * original is also flipped to 'cancelled' with `metadata.credited_by`.
 */
export function mapInvoiceToBillingState(inv: DougsInvoice, now: Date): DougsBillingState {
  if (inv.isRefund) {
    return { eventType: 'credit_note', billingStatus: 'cancelled', occurredAt: inv.paidAt ?? inv.date };
  }

  if (inv.paymentStatus === 'paid') {
    return { eventType: 'payment_received', billingStatus: 'paid', occurredAt: inv.paidAt ?? inv.date };
  }

  // Anything not settled is an outstanding receivable. The endpoint only returns
  // finalized invoices, and Dougs reports those as paid / partially paid / unpaid,
  // so the remaining states are all "still owed"; the raw value is kept in
  // metadata.dougs_payment_status so an unexpected one stays auditable.
  const overdue = inv.dueDate !== null && new Date(inv.dueDate).getTime() < now.getTime();
  return {
    eventType: overdue ? 'payment_overdue' : 'invoice_generated',
    billingStatus: overdue ? 'overdue' : 'due',
    occurredAt: inv.date,
  };
}

function normalizeForMatch(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

async function getOrganizationId(): Promise<string | null> {
  const { data, error } = await supabase
    .from('organizations')
    .select('id')
    .eq('slug', ORG_SLUG)
    .maybeSingle();
  if (error || !data) return null;
  return (data as { id: string }).id;
}

async function findClientByName(
  organizationId: string,
  name: string,
  clientsCache: Array<{ id: string; name: string }>
): Promise<string | null> {
  const normDougs = normalizeForMatch(name);

  for (const c of clientsCache) {
    const normCrm = normalizeForMatch(c.name);
    // Dougs name is a prefix/substring of CRM name
    if (normCrm.includes(normDougs)) return c.id;
    // CRM name base (before parenthesis) is in Dougs name
    const crmBase = normalizeForMatch(c.name.split('(')[0]);
    if (normDougs.includes(crmBase) && crmBase.length > 3) return c.id;
  }

  return null;
}

type ExistingEvent = {
  id: string;
  billing_status: string | null;
  metadata: Record<string, unknown> | null;
};

async function findExistingEvent(dougsInvoiceId: string): Promise<ExistingEvent | null> {
  const { data } = await supabase
    .from('client_billing_events')
    .select('id, billing_status, metadata')
    .filter('metadata->>dougs_invoice_id', 'eq', dougsInvoiceId)
    .limit(1);
  return ((data ?? []) as ExistingEvent[])[0] ?? null;
}

export async function fetchDougsInvoices(): Promise<DougsInvoice[]> {
  const sessionCookie = config.dougsSessionCookie;
  const companyId = config.dougsCompanyId;

  if (!sessionCookie || !companyId) {
    throw new Error('DOUGS_SESSION_COOKIE or DOUGS_COMPANY_ID not configured');
  }

  const response = await fetch(`${DOUGS_BASE}/companies/${companyId}/sales-invoices`, {
    headers: {
      Accept: 'application/json',
      Cookie: sessionCookie,
    },
  });

  if (response.status === 401 || response.status === 403) {
    const err = new Error(`Dougs session expired (${response.status})`);
    (err as Error & { sessionExpired: boolean }).sessionExpired = true;
    throw err;
  }

  if (!response.ok) {
    throw new Error(`Dougs API error: ${response.status}`);
  }

  return response.json() as Promise<DougsInvoice[]>;
}

export async function syncDougsInvoices(): Promise<DougsSyncResult> {
  const result: DougsSyncResult = {
    inserted: 0,
    updated: 0,
    skipped: 0,
    unmatched: [],
    creditNotesForReview: [],
    errors: [],
    sessionExpired: false,
  };

  const organizationId = await getOrganizationId();
  if (!organizationId) {
    result.errors.push('Organization lucid-lab not found');
    return result;
  }

  let invoices: DougsInvoice[];
  try {
    invoices = await fetchDougsInvoices();
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    result.errors.push(message);
    result.sessionExpired = !!(err as Error & { sessionExpired?: boolean }).sessionExpired;
    return result;
  }

  const { data: clientRows } = await supabase
    .from('clients')
    .select('id, name')
    .eq('organization_id', organizationId);
  const clientsCache = (clientRows ?? []) as Array<{ id: string; name: string }>;

  // Unpaid invoices are synced too: without them, overdue receivables never reach
  // the CRM and Lucid OS shows no outstanding balance at all.
  const syncable = invoices.filter((inv) => !inv.isDraft);
  const now = new Date();

  for (const inv of syncable) {
    try {
      const existing = await findExistingEvent(inv.id);
      const existingMetadata = (existing?.metadata ?? {}) as Record<string, unknown>;

      // Dougs' sourceDocumentId points at an accounting document, not the credited
      // invoice, so the cron cannot tell which invoice an avoir cancels. Surface
      // every unresolved avoir on each run rather than guessing; a human links the
      // pair by setting metadata.credited_by on the original and cancelling it.
      if (inv.isRefund && !existingMetadata['credited_by']) {
        result.creditNotesForReview.push(`${inv.reference} (${inv.clientName}, ${inv.amount} EUR)`);
      }

      // 'cancelled' is the terminal state a human sets on an avoir and on the
      // invoice it cancels. Dougs still reports that original as paid, so an
      // unconditional update would flip it back to 'paid' and re-inflate revenue.
      if (existing?.billing_status === 'cancelled') {
        result.skipped++;
        continue;
      }

      const clientId = await findClientByName(organizationId, inv.clientName, clientsCache);
      if (!clientId) {
        result.unmatched.push(`${inv.reference} (${inv.clientName})`);
        continue;
      }

      const state = mapInvoiceToBillingState(inv, now);
      const row = {
        organization_id: organizationId,
        client_id: clientId,
        event_type: state.eventType,
        billing_status: state.billingStatus,
        currency: 'EUR',
        amount_ht_eur: inv.netAmount,
        vat_amount_eur: inv.vatAmount,
        amount_ttc_eur: inv.amount,
        due_at: inv.dueDate,
        occurred_at: state.occurredAt,
        source: 'dougs',
        metadata: {
          ...existingMetadata,
          dougs_invoice_id: inv.id,
          dougs_reference: inv.reference,
          dougs_invoice_date: inv.date.split('T')[0],
          dougs_is_refund: inv.isRefund,
          dougs_payment_status: inv.paymentStatus,
        },
      };

      // Keyed on dougs_invoice_id: a waiting invoice that later gets paid has to
      // move from 'overdue' to 'paid', which insert-if-absent never did.
      const { error } = existing
        ? await supabase.from('client_billing_events').update(row).eq('id', existing.id)
        : await supabase.from('client_billing_events').insert(row);

      if (error) {
        result.errors.push(`${inv.reference}: ${error.message}`);
      } else if (existing) {
        result.updated++;
      } else {
        result.inserted++;
      }
    } catch (err) {
      result.errors.push(err instanceof Error ? err.message : String(err));
    }
  }

  return result;
}
