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
  skipped: number;
  unmatched: string[];
  errors: string[];
  sessionExpired: boolean;
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

async function isAlreadySynced(dougsInvoiceId: string): Promise<boolean> {
  const { data } = await supabase
    .from('client_billing_events')
    .select('id')
    .filter('metadata->>dougs_invoice_id', 'eq', dougsInvoiceId)
    .limit(1);
  return (data?.length ?? 0) > 0;
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
    skipped: 0,
    unmatched: [],
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

  const paid = invoices.filter((inv) => inv.paymentStatus === 'paid' && !inv.isDraft);

  for (const inv of paid) {
    try {
      if (await isAlreadySynced(inv.id)) {
        result.skipped++;
        continue;
      }

      const clientId = await findClientByName(organizationId, inv.clientName, clientsCache);
      if (!clientId) {
        result.unmatched.push(`${inv.reference} (${inv.clientName})`);
        continue;
      }

      const { error } = await supabase.from('client_billing_events').insert({
        organization_id: organizationId,
        client_id: clientId,
        event_type: inv.isRefund ? 'credit_note' : 'payment_received',
        billing_status: 'paid',
        currency: 'EUR',
        amount_ht_eur: inv.netAmount,
        vat_amount_eur: inv.vatAmount,
        amount_ttc_eur: inv.amount,
        occurred_at: inv.paidAt ?? inv.date,
        source: 'system',
        metadata: {
          dougs_invoice_id: inv.id,
          dougs_reference: inv.reference,
          dougs_invoice_date: inv.date.split('T')[0],
          dougs_is_refund: inv.isRefund,
        },
      });

      if (error) {
        result.errors.push(`${inv.reference}: ${error.message}`);
      } else {
        result.inserted++;
      }
    } catch (err) {
      result.errors.push(err instanceof Error ? err.message : String(err));
    }
  }

  return result;
}
