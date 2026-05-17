/**
 * Creates a realistic test client + BDC/contrat document and sends it for signature.
 *
 * Usage: npx tsx scripts/create-test-document.ts
 *
 * The signing email will be info@lucid-lab.fr so the team can validate the full flow.
 */

import { loadEnvConfig } from '@next/env';
loadEnvConfig(process.cwd());

async function main(): Promise<void> {
  // Dynamic imports so env vars are loaded first
  const { createClient } = await import('@supabase/supabase-js');
  const { createBonDeCommandeDraft, sendBonDeCommandeForSignature } = await import(
    '@/lib/admin/documents/workflow'
  );
  const { ensureLucidOrganizationId } = await import('@/lib/admin/lucid-os');

  const supabase = createClient(
    process.env['SUPABASE_URL']!,
    process.env['SUPABASE_SERVICE_ROLE_KEY']!,
  );

  const organizationId = await ensureLucidOrganizationId();
  console.log('Organization ID:', organizationId);

  // ─── 1. Create client ────────────────────────────────────────────────────
  const clientSlug = `brasserie-du-port-test-${Date.now()}`;
  const { data: client, error: clientError } = await supabase
    .from('clients')
    .insert({
      organization_id: organizationId,
      name: 'Brasserie du Port',
      slug: clientSlug,
      status: 'active',
      lifecycle_stage: 'won',
      industry: 'Restauration',
      website_url: 'https://brasserie-du-port.fr',
      primary_contact_name: 'Pierre Dumont',
      primary_contact_email: 'info@lucid-lab.fr',
      primary_contact_phone: '+33 6 12 34 56 78',
      notes: 'Restaurant gastronomique 60 couverts, Bordeaux. Besoin d\'automatiser la qualification des réservations en ligne et la gestion des avis Google. Fort volume de messages entrants non traités. Objectif : gagner 5h/semaine sur l\'admin.',
      metadata: {
        source: 'test-script',
        test: true,
      },
    })
    .select('id, slug')
    .single();

  if (clientError) throw new Error(`Client insert: ${clientError.message}`);
  console.log('✓ Client created:', client.id, client.slug);

  // ─── 2. Create primary contact ───────────────────────────────────────────
  const { data: contact, error: contactError } = await supabase
    .from('client_contacts')
    .insert({
      organization_id: organizationId,
      client_id: client.id,
      full_name: 'Pierre Dumont',
      role: 'Gérant',
      email: 'info@lucid-lab.fr',
      phone: '+33 6 12 34 56 78',
      is_primary: true,
      is_decision_maker: true,
      influence_level: 'high',
      status: 'active',
    })
    .select('id')
    .single();

  if (contactError) throw new Error(`Contact insert: ${contactError.message}`);
  console.log('✓ Contact created:', contact.id);

  // ─── 3. Create opportunity ───────────────────────────────────────────────
  const { data: opportunity, error: oppError } = await supabase
    .from('client_opportunities')
    .insert({
      organization_id: organizationId,
      client_id: client.id,
      primary_contact_id: contact.id,
      title: 'Automatisation IA — Réservations & Avis Google',
      offer_type: 'ai_automation',
      stage: 'won',
      status: 'open',
      setup_value_eur: 1800,
      monthly_value_eur: 320,
      probability_percent: 90,
      notes: `Périmètre :
1. Agent IA de qualification des réservations (WhatsApp + email)
   - Réponse automatique 24h/24, qualification du groupe, date, préférences alimentaires
   - Intégration agenda (Google Calendar)
2. Automatisation des réponses aux avis Google
   - Modèles personnalisés selon note et contenu
   - Envoi semi-automatique via n8n
3. Dashboard de suivi (Supabase + interface web simple)

Livrables :
- Agent opérationnel J+15
- Formation équipe (1h)
- Documentation technique
- 3 mois de support inclus`,
      source: 'referral',
      expected_close_at: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(), // J+2
      next_step: 'Signature BDC + contrat',
    })
    .select('id')
    .single();

  if (oppError) throw new Error(`Opportunity insert: ${oppError.message}`);
  console.log('✓ Opportunity created:', opportunity.id);

  // ─── 4. Create BDC draft ─────────────────────────────────────────────────
  console.log('\nCreating BDC draft...');
  const draftResult = await createBonDeCommandeDraft({
    clientId: client.id,
    opportunityId: opportunity.id,
    contactId: contact.id,
    notes: `Automatisation IA complète : agent de qualification réservations WhatsApp/email + automatisation réponses avis Google. Inclut intégration Google Calendar, 3 mois de support, formation équipe.`,
  });

  console.log('✓ Draft created:', draftResult.documentId, 'status:', draftResult.status);
  if (draftResult.validationIssues.length > 0) {
    console.warn('Validation issues:', JSON.stringify(draftResult.validationIssues, null, 2));
  }

  // ─── 5. Send for signature ───────────────────────────────────────────────
  console.log('\nSending for signature...');
  await sendBonDeCommandeForSignature(draftResult.documentId);

  console.log('✓ Sent for signature!');
  console.log('  Document ID:', draftResult.documentId);
  console.log('\n→ Check info@lucid-lab.fr for the signing email.');
  console.log(`→ Admin page: https://lucid-lab.fr/admin/lucid-os/clients/${client.slug}#documents`);
}

main().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
