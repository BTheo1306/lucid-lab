import {
  findLeadByContactId,
  createLead,
  updateLead,
  type Lead,
} from '../db/queries/leads';
import { updateContact, type Contact } from '../db/queries/contacts';
import { upsertCrmProspectFromLead, type CrmProspectResult } from '../db/queries/crm-prospect';
import { getConversationMessages } from '../db/queries/messages';
import { sendTeamLeadNotification } from '../integrations/email-client';

export interface CaptureLeadInput {
  contact: Contact;
  email?: string;
  firstName?: string;
  company?: string;
  projectBrief: string;
  interest?: Record<string, unknown>;
  marketingConsent?: boolean;
  conversationId: string;
}

/**
 * Capture a lead from the bot conversation. Upserts the lead, updates contact
 * details if provided, mirrors it into the CRM Prospects board, and notifies the
 * Lucid-Lab team by email with the whole conversation attached.
 */
export async function captureLead(input: CaptureLeadInput): Promise<Lead> {
  // Update contact with provided details
  const contactUpdates: Partial<Contact> = {};
  if (input.email && !input.contact.email) contactUpdates.email = input.email.toLowerCase();
  if (input.firstName && !input.contact.first_name) contactUpdates.first_name = input.firstName;
  if (input.company && !input.contact.company) contactUpdates.company = input.company;
  if (input.marketingConsent !== undefined) {
    contactUpdates.marketing_consent = input.marketingConsent;
    contactUpdates.marketing_consent_at = input.marketingConsent ? new Date().toISOString() : null;
  }
  if (Object.keys(contactUpdates).length > 0) {
    await updateContact(input.contact.id, contactUpdates);
  }

  // Upsert lead
  const existing = await findLeadByContactId(input.contact.id);
  let lead: Lead;
  if (existing) {
    lead = await updateLead(existing.id, {
      project_brief: input.projectBrief || existing.project_brief,
      interest: input.interest ?? existing.interest,
      marketing_consent: input.marketingConsent ?? existing.marketing_consent,
      marketing_consent_source: input.marketingConsent ? 'chat_widget' : existing.marketing_consent_source,
    });
  } else {
    lead = await createLead({
      contact_id: input.contact.id,
      status: 'new',
      project_brief: input.projectBrief,
      interest: input.interest ?? null,
      marketing_consent: input.marketingConsent ?? false,
      marketing_consent_source: input.marketingConsent ? 'chat_widget' : null,
      followup_step: 0,
    });
  }

  const email = input.email ?? input.contact.email ?? null;
  const firstName = input.firstName ?? input.contact.first_name;
  const company = input.company ?? input.contact.company;

  // Mirror into the CRM Prospects board so no captured lead lives only in an inbox.
  let crm: CrmProspectResult | null = null;
  if (email) {
    try {
      crm = await upsertCrmProspectFromLead({
        name: [firstName, input.contact.last_name].filter(Boolean).join(' ') || null,
        email,
        company,
        projectBrief: input.projectBrief,
        slugSeed: input.contact.id,
        leadSource: 'chat_widget',
      });
    } catch (err) {
      console.error('[lead] CRM prospect sync failed:', err);
    }
  }

  // The brief is what the bot understood; the transcript is what the visitor
  // actually wrote. Send both so nothing has to be chased down in the admin.
  let transcript: { role: string; content: string }[] = [];
  try {
    const messages = await getConversationMessages(input.conversationId, 50);
    transcript = messages.map((m) => ({
      role: m.direction === 'inbound' ? 'Visiteur' : 'Lucid',
      content:
        typeof m.content === 'object' && m.content !== null && 'text' in m.content
          ? String((m.content as { text: unknown }).text)
          : JSON.stringify(m.content),
    }));
  } catch (err) {
    console.error('[lead] transcript fetch failed:', err);
  }

  // Notify team
  try {
    await sendTeamLeadNotification({
      email: email ?? 'unknown@anonymous',
      firstName,
      company,
      language: input.contact.language,
      projectBrief: input.projectBrief,
      interest: input.interest ?? null,
      conversationId: input.conversationId,
      contactId: input.contact.id,
      transcript,
      crmClientSlug: crm?.slug ?? null,
      sourceLabel: 'chat du site',
    });
  } catch (err) {
    console.error('[lead] team notification failed:', err);
  }

  return lead;
}
