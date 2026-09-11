/**
 * Regression tests for the agency KPIs shown on /admin/lucid-os/metrics.
 *
 * Covers the three reporting defects found on 2026-09-11:
 *   1. "Encaissé" summed amount_ttc_eur, so collected VAT was counted as revenue
 *      and sat on the same chart axis as the HT MRR;
 *   2. the MRR summed every won opportunity ever, so a stopped mission kept
 *      billing every month for good;
 *   3. won opportunities with no closed_at counted in the MRR card but were
 *      dropped from every chart bar, so the card and the last bar disagreed.
 *
 * Run:
 *   npm test
 *   npx tsx --conditions=react-server --experimental-test-module-mocks --test src/lib/admin/metrics.test.ts
 */
import { before, beforeEach, test, mock } from 'node:test';
import assert from 'node:assert/strict';

import { createFakeSupabase, type Store } from '@/lib/admin/test-support/fake-supabase';

const ORG_ID = 'org-lucid-lab';

let store: Store;
let getAgencyMetrics: typeof import('@/lib/admin/metrics').getAgencyMetrics;

before(async () => {
  mock.module('@/lib/bot/db/supabase', {
    namedExports: { supabase: createFakeSupabase(() => store) },
  });
  ({ getAgencyMetrics } = await import('@/lib/admin/metrics'));
});

beforeEach(() => {
  store = {
    organizations: [{ id: ORG_ID, slug: 'lucid-lab' }],
    clients: [
      { id: 'client-actif', name: 'Shannon', organization_id: ORG_ID, status: 'active' },
      { id: 'client-pause', name: 'Sinibaldi Agency', organization_id: ORG_ID, status: 'paused' },
    ],
    client_opportunities: [],
    client_billing_events: [],
  };
});

test('le CA encaissé est en HT, la TVA n\'est pas du revenu', async () => {
  store['client_billing_events'] = [
    {
      id: 'evt-1',
      organization_id: ORG_ID,
      client_id: 'client-actif',
      billing_status: 'paid',
      amount_ht_eur: 600,
      amount_ttc_eur: 720,
      occurred_at: '2026-08-18T00:00:00.000Z',
      metadata: { dougs_reference: '2026-08-FAC22' },
    },
  ];

  const { kpis, collectedDetail } = await getAgencyMetrics();

  assert.equal(kpis.revenueCollectedEur, 600, '720 TTC vaut 600 HT, les 120 de TVA ne sont pas du CA');
  assert.equal(collectedDetail[0]?.amountHtEur, 600);
});

test('une mission arrêtée sort du MRR', async () => {
  store['client_opportunities'] = [
    {
      id: 'opp-actif',
      organization_id: ORG_ID,
      client_id: 'client-actif',
      stage: 'won',
      status: 'won',
      monthly_value_eur: 600,
      value_estimate_eur: null,
      closed_at: '2026-06-01T00:00:00.000Z',
    },
    {
      // Client repassé en 'paused' : l'opportunité gagnée reste en base pour
      // l'historique, mais elle ne doit plus facturer tous les mois.
      id: 'opp-pause',
      organization_id: ORG_ID,
      client_id: 'client-pause',
      stage: 'won',
      status: 'won',
      monthly_value_eur: 3200,
      value_estimate_eur: null,
      closed_at: '2026-06-19T00:00:00.000Z',
    },
  ];

  const { kpis, mrrDetail } = await getAgencyMetrics();

  assert.equal(kpis.mrrEurHt, 600, 'la mission en pause ne doit plus compter dans le MRR');
  assert.deepEqual(mrrDetail.map((r) => r.clientName), ['Shannon']);
});

test('la carte MRR et la dernière barre du graphe affichent le même montant', async () => {
  store['client_opportunities'] = [
    {
      id: 'opp-date',
      organization_id: ORG_ID,
      client_id: 'client-actif',
      stage: 'won',
      status: 'won',
      monthly_value_eur: 600,
      value_estimate_eur: null,
      closed_at: '2026-06-01T00:00:00.000Z',
    },
    {
      // Gagnée mais sans date de signature renseignée : comptée dans le KPI,
      // elle était écartée de toutes les barres du graphe.
      id: 'opp-sans-date',
      organization_id: ORG_ID,
      client_id: 'client-actif',
      stage: 'won',
      status: 'won',
      monthly_value_eur: 259,
      value_estimate_eur: null,
      closed_at: null,
    },
  ];

  const { kpis, revenueByMonth } = await getAgencyMetrics();

  assert.equal(kpis.mrrEurHt, 859);
  assert.equal(
    revenueByMonth.at(-1)?.mrr,
    kpis.mrrEurHt,
    'le mois courant doit valoir le KPI, sinon la page affiche deux chiffres pour la même chose',
  );
});
