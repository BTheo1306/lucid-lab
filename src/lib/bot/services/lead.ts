import {
  findLeadByContactId,
  createLead,
  updateLead,
  type Lead,
} from '../db/queries/leads';
import { updateContact, type Contact } from '../db/queries/contacts';
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
 * details if provided, and notifies the Lucid-Lab team by email.
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

  // Notify team
  try {
    await sendTeamLeadNotification({
      email: input.email ?? input.contact.email ?? 'unknown@anonymous',
      firstName: input.firstName ?? input.contact.first_name,
      company: input.company ?? input.contact.company,
      language: input.contact.language,
      projectBrief: input.projectBrief,
      interest: input.interest ?? null,
      conversationId: input.conversationId,
    });
  } catch (err) {
    console.error('[lead] team notification failed:', err);
  }

  return lead;
}
