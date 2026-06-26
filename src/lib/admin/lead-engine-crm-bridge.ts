import 'server-only';

import {
  ensureWorkspaceId,
  getProspectForConversion,
  markConverted,
  insertOutreachEvent,
} from './lead-engine-store';
import {
  upsertLucidClientIntake,
  createLucidClientContact,
  createLucidClientInteraction,
  createLucidClientTask,
  recordLucidAuditEvent,
} from './lucid-os';

/**
 * Lead Engine v2: reply to CRM handoff.
 *
 * When a prospect replies (the runner reports it, status -> 'replied'), promote
 * them into the Lucid OS CRM: a lead-stage client, a primary contact, an inbound
 * interaction, and a high-priority follow-up task for the human to book the call.
 * Reuses the existing lucid-os.ts helpers so the lead looks native in the CRM.
 */

function nextBusinessDayIso(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  const day = d.getDay();
  if (day === 6) d.setDate(d.getDate() + 2);
  else if (day === 0) d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return d.toISOString();
}

export async function convertProspectToCrm(personId: string): Promise<{ clientId: string } | null> {
  const workspaceId = await ensureWorkspaceId();
  const prospect = await getProspectForConversion(personId);
  if (!prospect) return null;

  const client = await upsertLucidClientIntake({
    name: prospect.companyName || prospect.fullName || 'Prospect LinkedIn',
    status: 'lead',
    lifecycleStage: 'qualified',
    industry: prospect.companyIndustry,
    websiteUrl: prospect.companyDomain ? `https://${prospect.companyDomain}` : null,
    primaryContactName: prospect.fullName,
    primaryContactEmail: prospect.email,
    source: 'lead_engine_linkedin',
    ownerLabel: 'Anthony',
  });

  const contactId = await createLucidClientContact({
    clientId: client.id,
    fullName: prospect.fullName || 'Contact',
    role: prospect.title,
    email: prospect.email,
    linkedinUrl: prospect.linkedinUrl,
    isPrimary: true,
    isDecisionMaker: prospect.buyerRole === 'economic_buyer' || prospect.buyerRole === 'founder_ceo',
    influenceLevel: prospect.buyerRole === 'champion' ? 'champion' : undefined,
  });

  await createLucidClientInteraction({
    clientId: client.id,
    contactId,
    interactionType: 'chat',
    direction: 'inbound',
    summary: 'Réponse positive LinkedIn (outbound Lead Engine)',
    sentiment: 'positive',
    sourceSystem: 'agent',
    sourceUri: prospect.linkedinUrl,
  });

  await createLucidClientTask({
    clientId: client.id,
    contactId,
    title: 'Répondre et proposer un créneau (lead LinkedIn)',
    description: `Lead converti automatiquement depuis l'outbound LinkedIn. Contact: ${prospect.fullName ?? 'inconnu'} (${prospect.title ?? 'rôle inconnu'})${prospect.companyName ? ` chez ${prospect.companyName}` : ''}.`,
    priority: 'high',
    ownerLabel: 'Anthony',
    dueAt: nextBusinessDayIso(),
  });

  await insertOutreachEvent({
    workspaceId,
    companyId: prospect.companyId,
    personId,
    eventType: 'converted_to_crm',
    payload: { client_id: client.id },
  });
  await markConverted(personId, prospect.companyId);
  await recordLucidAuditEvent({
    eventType: 'lead_converted_to_crm',
    summary: `Lead LinkedIn converti en client${prospect.companyName ? ` (${prospect.companyName})` : ''}`,
    actorType: 'automation',
    clientId: client.id,
    targetTable: 'prospect_people',
    targetId: personId,
    riskLevel: 'low',
    details: { source: 'lead_engine_linkedin', person_id: personId },
  });

  return { clientId: client.id };
}
