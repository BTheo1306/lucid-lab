/**
 * Regression tests for the Dougs -> CRM sync.
 *
 * Covers the two defects found during the manual /dougs-sync of 2026-09-08:
 *   1. an avoir (credit note) was written as 'paid', so it ADDED to
 *      revenueCollectedEur instead of netting out;
 *   2. unpaid invoices were filtered out entirely, so overdue receivables never
 *      reached the CRM.
 *
 * The KPI assertion runs the real getAgencyMetrics over the rows the real
 * syncDougsInvoices wrote, so it verifies the actual end-to-end behaviour rather
 * than restating the mapping table.
 *
 * Run:
 *   npm test
 *   npx tsx --conditions=react-server --experimental-test-module-mocks --test src/lib/admin/dougs.test.ts
 *
 * `--conditions=react-server` makes the `server-only` import a no-op, exactly as
 * it behaves inside a Next.js server component.
 */
process.env['DOUGS_SESSION_COOKIE'] = 'test-cookie';
process.env['DOUGS_COMPANY_ID'] = '246248';

import { before, beforeEach, test, mock } from 'node:test';
import assert from 'node:assert/strict';

type Row = Record<string, unknown>;
type Store = Record<string, Row[]>;

const ORG_ID = 'org-lucid-lab';

/**
 * In-memory stand-in for the Supabase client, covering only the query shapes
 * dougs.ts and metrics.ts actually use: select/eq/filter/limit/maybeSingle,
 * insert and update. The builder is thenable so `await` resolves it.
 */
function createFakeSupabase(getStore: () => Store) {
  return {
    from(table: string) {
      const predicates: Array<(row: Row) => boolean> = [];
      let limitTo: number | null = null;
      let wantsSingle = false;
      let toInsert: Row | null = null;
      let toUpdate: Row | null = null;

      const rows = (): Row[] => (getStore()[table] ??= []);

      const run = (): { data: unknown; error: null } => {
        const matched = rows().filter((row) => predicates.every((p) => p(row)));

        if (toInsert) {
          const created = { id: `${table}-${rows().length + 1}`, ...toInsert };
          rows().push(created);
          return { data: [created], error: null };
        }

        if (toUpdate) {
          for (const row of matched) Object.assign(row, toUpdate);
          return { data: matched, error: null };
        }

        if (wantsSingle) return { data: matched[0] ?? null, error: null };
        return { data: limitTo === null ? matched : matched.slice(0, limitTo), error: null };
      };

      const builder = {
        select: () => builder,
        eq(column: string, value: unknown) {
          predicates.push((row) => row[column] === value);
          return builder;
        },
        filter(expression: string, operator: string, value: unknown) {
          const jsonPath = /^metadata->>(.+)$/.exec(expression);
          if (!jsonPath || operator !== 'eq') {
            throw new Error(`fake supabase: unsupported filter ${expression} ${operator}`);
          }
          const key = jsonPath[1];
          predicates.push((row) => (row['metadata'] as Row | null)?.[key] === value);
          return builder;
        },
        limit(count: number) {
          limitTo = count;
          return builder;
        },
        maybeSingle() {
          wantsSingle = true;
          return builder;
        },
        insert(row: Row) {
          toInsert = row;
          return builder;
        },
        update(row: Row) {
          toUpdate = row;
          return builder;
        },
        then(resolve: (value: { data: unknown; error: null }) => unknown) {
          return Promise.resolve(run()).then(resolve);
        },
      };

      return builder;
    },
  };
}

type Invoice = {
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
};

function invoice(overrides: Partial<Invoice> & Pick<Invoice, 'id' | 'reference'>): Invoice {
  return {
    clientName: 'BSP37',
    amount: 1200,
    netAmount: 1000,
    vatAmount: 200,
    currency: 'EUR',
    paymentStatus: 'paid',
    paidAt: '2026-08-15T00:00:00.000Z',
    date: '2026-08-01T00:00:00.000Z',
    dueDate: '2026-08-31T00:00:00.000Z',
    isRefund: false,
    isDraft: false,
    ...overrides,
  };
}

const PAID = invoice({ id: 'inv-paid', reference: '2026-08-FAC20' });

// Same amount as PAID: if the avoir is counted as revenue instead of netting
// out, revenueCollectedEur doubles to 2400 rather than settling at 1200.
const CREDIT_NOTE = invoice({
  id: 'inv-avoir',
  reference: '2026-08-AV01',
  isRefund: true,
  paidAt: '2026-08-20T00:00:00.000Z',
  date: '2026-08-20T00:00:00.000Z',
});

// Fixed far-past / far-future due dates so the overdue split never depends on
// the day the suite happens to run.
const WAITING_OVERDUE = invoice({
  id: 'inv-overdue',
  reference: '2026-06-FAC10',
  clientName: 'Turismo',
  amount: 5130,
  netAmount: 4275,
  vatAmount: 855,
  paymentStatus: 'waiting',
  paidAt: null,
  date: '2020-06-01T00:00:00.000Z',
  dueDate: '2020-07-01T00:00:00.000Z',
});

const WAITING_FUTURE = invoice({
  id: 'inv-due',
  reference: '2026-09-FAC31',
  clientName: 'Axone Avocats',
  amount: 2000,
  netAmount: 1666.67,
  vatAmount: 333.33,
  paymentStatus: 'waiting',
  paidAt: null,
  date: '2099-01-01T00:00:00.000Z',
  dueDate: '2099-02-01T00:00:00.000Z',
});

let store: Store;
let syncDougsInvoices: typeof import('@/lib/admin/dougs').syncDougsInvoices;
let getAgencyMetrics: typeof import('@/lib/admin/metrics').getAgencyMetrics;

function seed(): Store {
  return {
    organizations: [{ id: ORG_ID, slug: 'lucid-lab' }],
    clients: [
      { id: 'client-bsp37', name: 'BSP37', organization_id: ORG_ID, status: 'active' },
      { id: 'client-turismo', name: 'Turismo', organization_id: ORG_ID, status: 'active' },
      { id: 'client-axone', name: 'Axone Avocats', organization_id: ORG_ID, status: 'active' },
    ],
    client_opportunities: [],
    client_billing_events: [],
  };
}

let dougsPayload: Invoice[] = [];

function stubDougs(invoices: Invoice[]): void {
  dougsPayload = invoices;
}

function billingRows(): Row[] {
  return store['client_billing_events'] ?? [];
}

function rowFor(reference: string): Row {
  const row = billingRows().find((r) => (r['metadata'] as Row)['dougs_reference'] === reference);
  assert.ok(row, `no billing event written for ${reference}`);
  return row;
}

before(async () => {
  // Mocked before the first import so dougs.ts and metrics.ts both bind the fake.
  // The getter is read per query, so each test's fresh store is picked up.
  mock.module('@/lib/bot/db/supabase', {
    namedExports: { supabase: createFakeSupabase(() => store) },
  });

  // One fetch mock for the whole file; stubDougs() swaps the payload it serves.
  mock.method(globalThis, 'fetch', async () => new Response(JSON.stringify(dougsPayload), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  }));

  ({ syncDougsInvoices } = await import('@/lib/admin/dougs'));
  ({ getAgencyMetrics } = await import('@/lib/admin/metrics'));
});

beforeEach(() => {
  store = seed();
  dougsPayload = [];
});

test('a credit note does not increase revenueCollectedEur', async () => {
  stubDougs([PAID, CREDIT_NOTE]);

  const result = await syncDougsInvoices();
  assert.deepEqual(result.errors, []);
  assert.equal(result.inserted, 2);

  const metrics = await getAgencyMetrics();
  assert.equal(
    metrics.kpis.revenueCollectedEur,
    1200,
    'the avoir must net out of collected revenue, not add 1200 on top of it',
  );

  const avoir = rowFor('2026-08-AV01');
  assert.equal(avoir['event_type'], 'credit_note');
  assert.equal(avoir['billing_status'], 'cancelled', 'an avoir must never be stored as paid');
});

test('an unresolved credit note is surfaced for human resolution', async () => {
  stubDougs([PAID, CREDIT_NOTE]);

  const result = await syncDougsInvoices();
  assert.deepEqual(result.creditNotesForReview, ['2026-08-AV01 (BSP37, 1200 EUR)']);
});

test('a waiting invoice past its due date lands as overdue', async () => {
  stubDougs([WAITING_OVERDUE, WAITING_FUTURE]);

  const result = await syncDougsInvoices();
  assert.deepEqual(result.errors, []);
  assert.equal(result.inserted, 2, 'unpaid invoices must reach the CRM');

  const overdue = rowFor('2026-06-FAC10');
  assert.equal(overdue['event_type'], 'payment_overdue');
  assert.equal(overdue['billing_status'], 'overdue');
  assert.equal(overdue['amount_ttc_eur'], 5130);
  assert.equal(overdue['due_at'], '2020-07-01T00:00:00.000Z');

  const notYetDue = rowFor('2026-09-FAC31');
  assert.equal(notYetDue['event_type'], 'invoice_generated');
  assert.equal(notYetDue['billing_status'], 'due');

  // Receivables are not revenue.
  const metrics = await getAgencyMetrics();
  assert.equal(metrics.kpis.revenueCollectedEur, 0);
});

test('an invoice paid since the last run is updated, not duplicated', async () => {
  stubDougs([WAITING_OVERDUE]);
  await syncDougsInvoices();
  assert.equal(billingRows().length, 1);

  const settled = { ...WAITING_OVERDUE, paymentStatus: 'paid', paidAt: '2026-09-01T00:00:00.000Z' };
  stubDougs([settled]);
  const second = await syncDougsInvoices();

  assert.equal(second.inserted, 0);
  assert.equal(second.updated, 1);
  assert.equal(billingRows().length, 1, 'the same Dougs invoice must not create a second row');

  const row = rowFor('2026-06-FAC10');
  assert.equal(row['billing_status'], 'paid');
  assert.equal(row['event_type'], 'payment_received');
  assert.equal(row['occurred_at'], '2026-09-01T00:00:00.000Z');
});

test('a human-cancelled invoice is never flipped back to paid', async () => {
  // What the /dougs-sync skill writes by hand for an invoice an avoir cancels:
  // Dougs still reports it as paid, so an unconditional upsert would resurrect it.
  store['client_billing_events'] = [{
    id: 'existing-1',
    organization_id: ORG_ID,
    client_id: 'client-bsp37',
    event_type: 'other',
    billing_status: 'cancelled',
    amount_ttc_eur: 1200,
    occurred_at: '2026-08-15T00:00:00.000Z',
    source: 'dougs',
    metadata: {
      dougs_invoice_id: 'inv-paid',
      dougs_reference: '2026-08-FAC20',
      credited_by: '2026-08-AV01',
      cancel_reason: 'avoir total',
    },
  }];

  stubDougs([PAID]);
  const result = await syncDougsInvoices();

  assert.equal(result.skipped, 1);
  assert.equal(result.updated, 0);

  const row = rowFor('2026-08-FAC20');
  assert.equal(row['billing_status'], 'cancelled');
  assert.equal((row['metadata'] as Row)['credited_by'], '2026-08-AV01');

  const metrics = await getAgencyMetrics();
  assert.equal(metrics.kpis.revenueCollectedEur, 0);
});
