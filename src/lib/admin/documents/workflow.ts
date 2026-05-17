import 'server-only';

import { createHash } from 'node:crypto';
import { config } from '@/lib/bot/config';
import { supabase } from '@/lib/bot/db/supabase';
import { sendDocumentSignatureRequest, sendDocumentSignedNotification } from '@/lib/bot/integrations/email-client';
import {
  createLucidClientInteraction,
  createLucidClientTask,
  ensureLucidOrganizationId,
  recordLucidAuditEvent,
} from '@/lib/admin/lucid-os';
import { createDocuSealSubmission, getDocuSealApiBaseUrl, getDocuSealSubmission, getDocuSealSubmissionDocuments } from './docuseal';
import { buildGoogleDriveFolderUrl, findOrCreateGoogleDriveFolder, isGoogleDriveArchiveConfigured, uploadPdfToGoogleDrive } from './google-drive';
import { calculateVatAmounts, hasBlockingValidationIssue, resolveBonDeCommandeAmount, validateBonDeCommandeDraft } from './validation';
import type {
  CreateBonDeCommandeDraftInput,
  CreateBonDeCommandeDraftResult,
  LucidClientDocumentStatus,
  LucidClientDocumentSummary,
  LucidDocumentValidationIssue,
} from './types';

type QueryError = { code?: string; message?: string };
type UnknownRecord = Record<string, unknown>;

interface ClientDocumentContext {
  organizationId: string;
  client: UnknownRecord;
  opportunity: UnknownRecord | null;
  contact: UnknownRecord | null;
}

interface DocuSealWebhookPayload {
  event_type?: string;
  timestamp?: string;
  data?: unknown;
}

function missingRelation(error: QueryError | null): boolean {
  return error?.code === '42P01' || error?.code === 'PGRST205';
}

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as UnknownRecord : null;
}

function asString(value: unknown): string | null {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function asNumber(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function asValidationIssues(value: unknown): LucidDocumentValidationIssue[] {
  if (!Array.isArray(value)) return [];
  return value
    .map(asRecord)
    .filter((record): record is UnknownRecord => Boolean(record))
    .map((record) => ({
      code: asString(record.code) ?? 'unknown',
      field: asString(record.field) ?? 'unknown',
      message: asString(record.message) ?? 'Validation issue',
      severity: record.severity === 'warning' ? 'warning' : 'error',
    }));
}

function normalizeDocument(row: unknown): LucidClientDocumentSummary {
  const record = asRecord(row) ?? {};
  return {
    id: String(record.id ?? ''),
    clientId: String(record.client_id ?? ''),
    opportunityId: asString(record.opportunity_id),
    primaryContactId: asString(record.primary_contact_id),
    documentType: (asString(record.document_type) ?? 'other') as LucidClientDocumentSummary['documentType'],
    status: (asString(record.status) ?? 'draft') as LucidClientDocumentStatus,
    title: asString(record.title) ?? 'Untitled document',
    documentNumber: asString(record.document_number),
    templateKey: asString(record.template_key) ?? 'unknown',
    templateVersion: asString(record.template_version) ?? 'v1',
    currency: 'EUR',
    amountHtEur: asNumber(record.amount_ht_eur),
    setupAmountEur: asNumber(record.setup_amount_eur),
    monthlyAmountEur: asNumber(record.monthly_amount_eur),
    vatRate: asNumber(record.vat_rate) ?? config.billingDefaultVatRate,
    vatAmountEur: asNumber(record.vat_amount_eur),
    amountTtcEur: asNumber(record.amount_ttc_eur),
    issuedAt: asString(record.issued_at),
    dueAt: asString(record.due_at),
    sentAt: asString(record.sent_at),
    completedAt: asString(record.completed_at),
    declinedAt: asString(record.declined_at),
    docusealSubmissionId: asString(record.docuseal_submission_id),
    docusealSubmissionUrl: asString(record.docuseal_submission_url),
    docusealAuditLogUrl: asString(record.docuseal_audit_log_url),
    docusealCombinedDocumentUrl: asString(record.docuseal_combined_document_url),
    googleDriveFolderId: asString(record.google_drive_folder_id),
    validationErrors: asValidationIssues(record.validation_errors),
    metadata: asRecord(record.metadata) ?? {},
    createdAt: asString(record.created_at) ?? new Date(0).toISOString(),
    updatedAt: asString(record.updated_at) ?? new Date(0).toISOString(),
  };
}

function generateDocumentNumber(type: string, clientSlug: string | null): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const suffix = (clientSlug ?? 'client').replace(/[^a-z0-9]+/gi, '-').replace(/^-|-$/g, '').toUpperCase();
  const prefix = type === 'bon_de_commande' ? 'BDC' : type === 'facture' ? 'FAC' : 'DOC';
  return `${prefix}-${date}-${suffix}`;
}

function getMetadataFolderId(client: UnknownRecord, explicitFolderId?: string | null): string | null {
  if (explicitFolderId) return explicitFolderId;
  const metadata = asRecord(client.metadata) ?? {};
  const documentAutomation = asRecord(metadata.document_automation) ?? {};
  return asString(documentAutomation.google_drive_folder_id) ?? asString(metadata.google_drive_folder_id);
}

function formatFrenchDate(value: string | null): string | null {
  const parsed = value ? new Date(value) : new Date();
  if (Number.isNaN(parsed.getTime())) return null;
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(parsed);
}

function formatEuro(value: number | null): string | null {
  if (value === null || !Number.isFinite(value)) return null;
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(value);
}

function formatPercent(value: number | null): string | null {
  if (value === null || !Number.isFinite(value)) return null;
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 2 }).format(value)} %`;
}

function compactFieldValues(values: Record<string, string | null>): Record<string, string> {
  return Object.fromEntries(Object.entries(values).filter((entry): entry is [string, string] => Boolean(entry[1])));
}

const DEFAULT_BON_DE_COMMANDE_DELIVERABLES = [
  'Cadrage du besoin, des acces, des contraintes operationnelles et des indicateurs de reussite.',
  'Conception, configuration ou developpement des systemes convenus avec le Client.',
  'Tests, mise en production, documentation de passation et ajustements prevus au perimetre.',
].join('\n');

const DEFAULT_BON_DE_COMMANDE_CALENDAR = [
  'Semaine 1 : cadrage, acces, audit initial.',
  'Semaines 2-3 : implementation, automatisations et validation intermediaire.',
  'Semaine 4 : finalisation, transfert et mise en production.',
].join('\n');

const DEFAULT_BON_DE_COMMANDE_NEXT_STEPS = [
  'Confirmer les acces necessaires (Drive, emails, outils).',
  'Valider la modalite de paiement et le demarrage.',
  'Signer le Bon de Commande et proceder au premier paiement.',
].join('\n');

function resolveBillingMode(inputMode: string | null, monthlyAmountEur: number | null | undefined): 'one_shot' | 'mensuel' {
  if (inputMode === 'one_shot' || inputMode === 'mensuel') return inputMode;
  return (typeof monthlyAmountEur === 'number' && monthlyAmountEur > 0) ? 'mensuel' : 'one_shot';
}

function buildBonDeCommandeFieldValues(document: UnknownRecord, recipient: UnknownRecord, generationPayload: UnknownRecord): Record<string, string> {
  const client = asRecord(generationPayload.client) ?? {};
  const opportunity = asRecord(generationPayload.opportunity) ?? {};
  const signer = asRecord(generationPayload.signer) ?? {};
  const payloadDocument = asRecord(generationPayload.document) ?? {};
  const issuedDate = formatFrenchDate(asString(document.issued_at));
  const scopePerimeter = asString(document.scope_perimeter) ?? asString(payloadDocument.scope_perimeter);
  const syntheticDescription = asString(document.synthetic_description)
    ?? asString(payloadDocument.synthetic_description)
    ?? asString(payloadDocument.notes)
    ?? asString(opportunity.notes);
  const deliverables = asString(document.deliverables) ?? asString(payloadDocument.deliverables) ?? DEFAULT_BON_DE_COMMANDE_DELIVERABLES;
  const calendarTimeline = asString(payloadDocument.calendar_timeline) ?? DEFAULT_BON_DE_COMMANDE_CALENDAR;
  const nextSteps = asString(payloadDocument.next_steps) ?? DEFAULT_BON_DE_COMMANDE_NEXT_STEPS;
  const billingMode = resolveBillingMode(asString(payloadDocument.billing_mode), asNumber(document.monthly_amount_eur) ?? asNumber(opportunity.monthly_value_eur));

  return compactFieldValues({
    'Document Number': asString(document.document_number) ?? asString(payloadDocument.number),
    'Issued Date': issuedDate,
    'Client Name': asString(client.name),
    'Signer Name': asString(recipient.name) ?? asString(signer.name),
    'Signer Email': asString(recipient.email) ?? asString(signer.email),
    'Opportunity Title': asString(opportunity.title),
    'Lucid Document Id': asString(document.id),
    'Scope Perimeter': scopePerimeter,
    'Synthetic Description': syntheticDescription,
    'Deliverables': deliverables,
    'Calendar Timeline': calendarTimeline,
    'Next Steps': nextSteps,
    'Billing One-Shot Mark': billingMode === 'one_shot' ? '☑' : '☐',
    'Billing Mensuel Mark': billingMode === 'mensuel' ? '☑' : '☐',
    'Billing Mode Label': billingMode === 'mensuel' ? 'mensuel 12 mois' : 'one-shot',
    'Setup Amount EUR': formatEuro(asNumber(document.setup_amount_eur) ?? asNumber(opportunity.setup_value_eur)),
    'Monthly Amount EUR': formatEuro(asNumber(document.monthly_amount_eur) ?? asNumber(opportunity.monthly_value_eur)),
    'Amount HT EUR': formatEuro(asNumber(document.amount_ht_eur) ?? asNumber(payloadDocument.amount_ht_eur)),
    'VAT Rate': formatPercent(asNumber(document.vat_rate) ?? asNumber(payloadDocument.vat_rate)),
    'VAT Amount EUR': formatEuro(asNumber(document.vat_amount_eur) ?? asNumber(payloadDocument.vat_amount_eur)),
    'Amount TTC EUR': formatEuro(asNumber(document.amount_ttc_eur) ?? asNumber(payloadDocument.amount_ttc_eur)),
    'Signed Date': issuedDate,
    'Contract Signed Date': issuedDate,
    'Lucid-Lab Signature': 'Lucid-Lab - Anthony Poirier',
  });
}

function getDocuSealAppUrl(): string {
  return getDocuSealApiBaseUrl().replace(/\/api\/?$/i, '');
}

/**
 * Normalise a phone number to E.164 (required by DocuSeal).
 * Returns null when the value is absent or cannot be normalised.
 * Examples handled:
 *   "0612345678"  → "+33612345678"  (French local format)
 *   "+33612345678" → "+33612345678" (already E.164)
 *   "33612345678"  → "+33612345678" (missing leading +)
 */
function normalizePhoneE164(raw: string | null | undefined): string | null {
  if (!raw) return null;
  const stripped = raw.replace(/[\s\-().]/g, ''); // remove common separators
  if (!stripped) return null;

  // Already E.164
  if (/^\+\d{7,15}$/.test(stripped)) return stripped;

  // Has digits-only country code without "+" (e.g. "33612345678")
  if (/^\d{10,15}$/.test(stripped)) {
    // French local: 10 digits starting with 0 → replace leading 0 with +33
    if (stripped.length === 10 && stripped.startsWith('0')) {
      return `+33${stripped.slice(1)}`;
    }
    // Assume it already has a country code, just prepend "+"
    return `+${stripped}`;
  }

  // Cannot normalise → omit rather than send an invalid value
  return null;
}

function buildDocuSealSigningUrl(submitter: UnknownRecord | null): string | null {
  const slug = asString(submitter?.slug);
  if (slug) return `${getDocuSealAppUrl()}/s/${encodeURIComponent(slug)}`;

  const embedSrc = asString(submitter?.embed_src);
  if (!embedSrc) return null;
  if (/^https?:\/\//i.test(embedSrc)) return embedSrc;

  const normalizedPath = embedSrc.startsWith('/') ? embedSrc : `/${embedSrc}`;
  return `${getDocuSealAppUrl()}${normalizedPath}`;
}

async function getDocumentContext(input: CreateBonDeCommandeDraftInput): Promise<ClientDocumentContext> {
  const organizationId = await ensureLucidOrganizationId();
  const { data: clientRow, error: clientError } = await supabase
    .from('clients')
    .select('id,name,slug,primary_contact_name,primary_contact_email,primary_contact_phone,metadata')
    .eq('organization_id', organizationId)
    .eq('id', input.clientId)
    .maybeSingle();

  if (clientError) throw new Error(`getDocumentContext client: ${clientError.message}`);
  const client = asRecord(clientRow);
  if (!client) throw new Error('Client not found for document automation.');

  let opportunity: UnknownRecord | null = null;
  if (input.opportunityId) {
    const { data, error } = await supabase
      .from('client_opportunities')
      .select('id,title,primary_contact_id,stage,status,offer_type,value_estimate_eur,setup_value_eur,monthly_value_eur,notes')
      .eq('organization_id', organizationId)
      .eq('client_id', input.clientId)
      .eq('id', input.opportunityId)
      .maybeSingle();
    if (error) throw new Error(`getDocumentContext opportunity: ${error.message}`);
    opportunity = asRecord(data);
  }

  const resolvedContactId = input.contactId ?? asString(opportunity?.primary_contact_id);
  let contact: UnknownRecord | null = null;
  if (resolvedContactId) {
    const { data, error } = await supabase
      .from('client_contacts')
      .select('id,full_name,email,phone,is_primary')
      .eq('organization_id', organizationId)
      .eq('client_id', input.clientId)
      .eq('id', resolvedContactId)
      .maybeSingle();
    if (error) throw new Error(`getDocumentContext contact: ${error.message}`);
    contact = asRecord(data);
  }

  if (!contact) {
    const { data, error } = await supabase
      .from('client_contacts')
      .select('id,full_name,email,phone,is_primary')
      .eq('organization_id', organizationId)
      .eq('client_id', input.clientId)
      .eq('is_primary', true)
      .maybeSingle();
    if (error && !missingRelation(error)) throw new Error(`getDocumentContext primary contact: ${error.message}`);
    contact = asRecord(data);
  }

  return { organizationId, client, opportunity, contact };
}

export async function listLucidClientDocumentsForClient(clientId: string, limit = 25): Promise<LucidClientDocumentSummary[]> {
  const organizationId = await ensureLucidOrganizationId();
  const { data, error } = await supabase
    .from('client_documents')
    .select('id,client_id,opportunity_id,primary_contact_id,document_type,status,title,document_number,template_key,template_version,currency,amount_ht_eur,setup_amount_eur,monthly_amount_eur,vat_rate,vat_amount_eur,amount_ttc_eur,issued_at,due_at,sent_at,completed_at,declined_at,docuseal_submission_id,docuseal_submission_url,docuseal_audit_log_url,docuseal_combined_document_url,google_drive_folder_id,validation_errors,metadata,created_at,updated_at')
    .eq('organization_id', organizationId)
    .eq('client_id', clientId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    if (missingRelation(error)) return [];
    throw new Error(`listLucidClientDocumentsForClient: ${error.message}`);
  }

  return (data ?? []).map(normalizeDocument);
}

export async function createBonDeCommandeDraft(input: CreateBonDeCommandeDraftInput): Promise<CreateBonDeCommandeDraftResult> {
  const context = await getDocumentContext(input);
  const clientName = asString(context.client.name);
  const clientSlug = asString(context.client.slug);
  const contactName = asString(context.contact?.full_name) ?? asString(context.client.primary_contact_name);
  const contactEmail = asString(context.contact?.email) ?? asString(context.client.primary_contact_email);
  const contactPhone = asString(context.contact?.phone) ?? asString(context.client.primary_contact_phone);
  const opportunityTitle = asString(context.opportunity?.title);
  const setupAmountEur = asNumber(context.opportunity?.setup_value_eur);
  const monthlyAmountEur = asNumber(context.opportunity?.monthly_value_eur);
  const amountHtEur = resolveBonDeCommandeAmount({
    valueEstimateEur: asNumber(context.opportunity?.value_estimate_eur),
    setupValueEur: setupAmountEur,
    monthlyValueEur: monthlyAmountEur,
  });
  const googleDriveFolderId = getMetadataFolderId(context.client, input.googleDriveFolderId ?? null);
  const vatRate = Number.isFinite(config.billingDefaultVatRate) ? config.billingDefaultVatRate : 20;
  const { vatAmountEur, amountTtcEur } = calculateVatAmounts(amountHtEur, vatRate);
  const validationIssues = validateBonDeCommandeDraft({
    clientName,
    contactName,
    contactEmail,
    opportunityTitle,
    amountHtEur,
    setupAmountEur,
    monthlyAmountEur,
    googleDriveFolderId,
  });
  const status: LucidClientDocumentStatus = hasBlockingValidationIssue(validationIssues) ? 'needs_review' : 'draft';
  const documentNumber = generateDocumentNumber('bon_de_commande', clientSlug);
  const title = `Bon de commande - ${clientName ?? 'Client'}${opportunityTitle ? ` - ${opportunityTitle}` : ''}`;
  const scopePerimeter = asString(input.scopePerimeter);
  const syntheticDescription = asString(input.syntheticDescription);
  const deliverables = asString(input.deliverables);
  const calendarTimeline = asString(input.calendarTimeline);
  const nextSteps = asString(input.nextSteps);
  const billingMode = resolveBillingMode(asString(input.billingMode), monthlyAmountEur);
  const generationPayload = {
    client: {
      id: input.clientId,
      name: clientName,
      slug: clientSlug,
    },
    opportunity: context.opportunity ? {
      id: asString(context.opportunity.id),
      title: opportunityTitle,
      offer_type: asString(context.opportunity.offer_type),
      value_estimate_eur: asNumber(context.opportunity.value_estimate_eur),
      setup_value_eur: setupAmountEur,
      monthly_value_eur: monthlyAmountEur,
      notes: asString(context.opportunity.notes),
    } : null,
    signer: {
      id: asString(context.contact?.id),
      name: contactName,
      email: contactEmail,
      phone: contactPhone,
    },
    document: {
      number: documentNumber,
      title,
      amount_ht_eur: amountHtEur,
      vat_rate: vatRate,
      vat_amount_eur: vatAmountEur,
      amount_ttc_eur: amountTtcEur,
      google_drive_folder_id: googleDriveFolderId,
      scope_perimeter: scopePerimeter,
      synthetic_description: syntheticDescription,
      deliverables,
      calendar_timeline: calendarTimeline,
      next_steps: nextSteps,
      billing_mode: billingMode,
      notes: asString(input.notes),
    },
  };

  const { data, error } = await supabase
    .from('client_documents')
    .insert({
      organization_id: context.organizationId,
      client_id: input.clientId,
      opportunity_id: asString(context.opportunity?.id),
      primary_contact_id: asString(context.contact?.id),
      document_type: 'bon_de_commande',
      status,
      title,
      document_number: documentNumber,
      template_key: 'lucid_lab_bdc_contract_docuseal_html',
      template_version: '2026-05-17-bdc-contract-v4-html',
      amount_ht_eur: amountHtEur,
      setup_amount_eur: setupAmountEur,
      monthly_amount_eur: monthlyAmountEur,
      vat_rate: vatRate,
      vat_amount_eur: vatAmountEur,
      amount_ttc_eur: amountTtcEur,
      issued_at: new Date().toISOString(),
      scope_perimeter: scopePerimeter,
      synthetic_description: syntheticDescription,
      deliverables,
      google_drive_folder_id: googleDriveFolderId,
      validation_errors: validationIssues,
      generation_payload: generationPayload,
      metadata: {
        source: 'admin_client_document_form',
        notes: asString(input.notes),
      },
    })
    .select('id')
    .single();

  if (error) throw new Error(`createBonDeCommandeDraft: ${error.message}`);
  const documentId = String(data.id);

  if (contactName || contactEmail) {
    const { error: recipientError } = await supabase.from('client_document_recipients').insert({
      organization_id: context.organizationId,
      client_id: input.clientId,
      document_id: documentId,
      contact_id: asString(context.contact?.id),
      role: 'Client',
      name: contactName,
      email: contactEmail,
      phone: contactPhone,
      status: 'pending',
      external_id: `${documentId}:client`,
      metadata: { source: 'bon_de_commande_draft' },
    });
    if (recipientError) throw new Error(`createBonDeCommandeDraft recipient: ${recipientError.message}`);
  }

  await supabase.from('client_billing_events').insert({
    organization_id: context.organizationId,
    client_id: input.clientId,
    opportunity_id: asString(context.opportunity?.id),
    document_id: documentId,
    event_type: 'bdc_drafted',
    billing_status: 'quoted',
    amount_ht_eur: amountHtEur,
    setup_amount_eur: setupAmountEur,
    monthly_amount_eur: monthlyAmountEur,
    vat_amount_eur: vatAmountEur,
    amount_ttc_eur: amountTtcEur,
    metadata: { document_number: documentNumber, validation_issue_count: validationIssues.length },
  });

  await createLucidClientInteraction({
    clientId: input.clientId,
    contactId: asString(context.contact?.id),
    opportunityId: asString(context.opportunity?.id),
    interactionType: 'decision',
    direction: 'internal',
    summary: `Bon de commande draft created: ${documentNumber}`,
    notes: validationIssues.length > 0 ? validationIssues.map((issue) => `${issue.severity}: ${issue.message}`).join('\n') : 'Ready for review.',
    sourceSystem: 'admin',
  });

  await recordLucidAuditEvent({
    eventType: 'client_document_drafted',
    summary: `Bon de commande draft created for ${clientName ?? input.clientId}`,
    actorType: 'admin',
    clientId: input.clientId,
    targetTable: 'client_documents',
    targetId: documentId,
    riskLevel: validationIssues.some((issue) => issue.severity === 'error') ? 'medium' : 'low',
    details: { document_number: documentNumber, status, validation_issues: validationIssues },
  });

  return { documentId, status, validationIssues };
}

async function getDocumentForSend(documentId: string): Promise<{ document: UnknownRecord; recipient: UnknownRecord | null }> {
  const organizationId = await ensureLucidOrganizationId();
  const { data, error } = await supabase
    .from('client_documents')
    .select('id,organization_id,client_id,opportunity_id,primary_contact_id,document_type,status,title,document_number,amount_ht_eur,setup_amount_eur,monthly_amount_eur,vat_rate,vat_amount_eur,amount_ttc_eur,issued_at,scope_perimeter,synthetic_description,deliverables,generation_payload,validation_errors')
    .eq('organization_id', organizationId)
    .eq('id', documentId)
    .maybeSingle();
  if (error) throw new Error(`getDocumentForSend document: ${error.message}`);
  const document = asRecord(data);
  if (!document) throw new Error('Document not found.');

  const { data: recipientRow, error: recipientError } = await supabase
    .from('client_document_recipients')
    .select('id,name,email,phone,role,external_id')
    .eq('organization_id', organizationId)
    .eq('document_id', documentId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (recipientError) throw new Error(`getDocumentForSend recipient: ${recipientError.message}`);

  return { document, recipient: asRecord(recipientRow) };
}

export async function sendBonDeCommandeForSignature(documentId: string): Promise<void> {
  if (!config.docusealBonDeCommandeTemplateId) throw new Error('DOCUSEAL_BON_DE_COMMANDE_TEMPLATE_ID is required before sending bon de commande documents.');
  const { document, recipient } = await getDocumentForSend(documentId);
  const validationIssues = asValidationIssues(document.validation_errors);
  if (hasBlockingValidationIssue(validationIssues)) throw new Error('Document still has blocking validation errors. Fix them before sending.');
  if (!recipient || !asString(recipient.email)) throw new Error('Document has no signer email.');

  const generationPayload = asRecord(document.generation_payload) ?? {};
  const fieldValues = buildBonDeCommandeFieldValues(document, recipient, generationPayload);
  const submission = await createDocuSealSubmission({
    templateId: config.docusealBonDeCommandeTemplateId,
    name: asString(document.title) ?? 'Bon de commande Lucid-Lab',
    variables: generationPayload,
    sendEmail: false,
    metadata: { lucid_document_id: documentId, lucid_client_id: asString(document.client_id) },
    submitters: [{
      role: asString(recipient.role) ?? 'Client',
      name: asString(recipient.name),
      email: asString(recipient.email),
      phone: normalizePhoneE164(asString(recipient.phone)) ?? undefined,
      external_id: asString(recipient.external_id) ?? `${documentId}:client`,
      values: fieldValues,
      fields: Object.entries(fieldValues).map(([name, defaultValue]) => ({ name, default_value: defaultValue, readonly: true })),
      metadata: { lucid_document_id: documentId, lucid_recipient_id: asString(recipient.id) },
      completed_redirect_url: config.docusealCompletedRedirectUrl || undefined,
    }],
  });

  const submissionId = asString(submission.id) ?? null;
  const firstSubmitter = asRecord(submission.submitters?.[0]) ?? null;
  const signingUrl = buildDocuSealSigningUrl(firstSubmitter);
  if (!signingUrl) throw new Error('DocuSeal did not return a signing URL for the recipient.');
  const now = new Date().toISOString();

  await sendDocumentSignatureRequest({
    to: asString(recipient.email) ?? '',
    signerName: asString(recipient.name),
    documentNumber: asString(document.document_number),
    documentTitle: asString(document.title) ?? 'Bon de commande Lucid-Lab',
    signingUrl,
    replyTo: config.teamNotificationEmail,
  });

  const { error: documentError } = await supabase
    .from('client_documents')
    .update({
      status: 'sent_for_signature',
      sent_at: now,
      docuseal_template_id: config.docusealBonDeCommandeTemplateId,
      docuseal_submission_id: submissionId,
      docuseal_submission_slug: asString(submission.slug),
      docuseal_submission_url: asString(submission.url),
      docuseal_audit_log_url: asString(submission.audit_log_url),
      docuseal_combined_document_url: asString(submission.combined_document_url),
      docuseal_response: submission,
    })
    .eq('id', documentId);
  if (documentError) throw new Error(`sendBonDeCommandeForSignature document: ${documentError.message}`);

  if (firstSubmitter) {
    const { error: recipientError } = await supabase
      .from('client_document_recipients')
      .update({
        status: 'sent',
        docuseal_submitter_id: asString(firstSubmitter.id),
        docuseal_submitter_uuid: asString(firstSubmitter.uuid),
        docuseal_submitter_slug: asString(firstSubmitter.slug),
        docuseal_embed_src: asString(firstSubmitter.embed_src),
        sent_at: asString(firstSubmitter.sent_at) ?? now,
      })
      .eq('id', asString(recipient.id));
    if (recipientError) throw new Error(`sendBonDeCommandeForSignature recipient: ${recipientError.message}`);
  }

  await supabase.from('client_billing_events').insert({
    organization_id: asString(document.organization_id),
    client_id: asString(document.client_id),
    opportunity_id: asString(document.opportunity_id),
    document_id: documentId,
    event_type: 'bdc_sent',
    billing_status: 'quoted',
    amount_ht_eur: asNumber(document.amount_ht_eur),
    setup_amount_eur: asNumber(document.setup_amount_eur),
    monthly_amount_eur: asNumber(document.monthly_amount_eur),
    vat_amount_eur: asNumber(document.vat_amount_eur),
    amount_ttc_eur: asNumber(document.amount_ttc_eur),
    metadata: { docuseal_submission_id: submissionId },
  });

  await recordLucidAuditEvent({
    eventType: 'client_document_sent_for_signature',
    summary: `Bon de commande sent for signature: ${asString(document.document_number) ?? documentId}`,
    actorType: 'admin',
    clientId: asString(document.client_id),
    targetTable: 'client_documents',
    targetId: documentId,
    riskLevel: 'medium',
    details: { docuseal_submission_id: submissionId },
  });
}

function getDocuSealSubmitters(submission: UnknownRecord): UnknownRecord[] {
  return Array.isArray(submission.submitters)
    ? submission.submitters.map(asRecord).filter((submitter): submitter is UnknownRecord => Boolean(submitter))
    : [];
}

function getDocuSealCompletedAt(submission: UnknownRecord): string | null {
  const directCompletedAt = asString(submission.completed_at);
  if (directCompletedAt) return directCompletedAt;

  const completedValues = getDocuSealSubmitters(submission)
    .map((submitter) => asString(submitter.completed_at))
    .filter((value): value is string => Boolean(value));
  if (completedValues.length === 0) return null;

  return completedValues.sort().at(-1) ?? null;
}

function isDocuSealSubmissionCompleted(submission: UnknownRecord): boolean {
  if (asString(submission.status)?.toLowerCase() === 'completed') return true;
  const submitters = getDocuSealSubmitters(submission);
  return submitters.length > 0 && submitters.every((submitter) => (
    asString(submitter.status)?.toLowerCase() === 'completed' || Boolean(asString(submitter.completed_at))
  ));
}

function inferDocuSealDocumentStatus(submission: UnknownRecord): LucidClientDocumentStatus | null {
  if (isDocuSealSubmissionCompleted(submission)) return 'signed';
  const submitters = getDocuSealSubmitters(submission);
  if (submitters.some((submitter) => asString(submitter.declined_at))) return 'declined';
  if (submitters.some((submitter) => asString(submitter.opened_at))) return 'viewed';
  return null;
}

async function upsertDocuSealStorageLocation(input: {
  organizationId: string;
  clientId: string;
  documentId: string;
  fileKind: 'combined_pdf' | 'audit_log';
  fileName: string;
  url: string;
  submissionId: string;
}): Promise<void> {
  await supabase
    .from('client_document_storage_locations')
    .delete()
    .eq('organization_id', input.organizationId)
    .eq('document_id', input.documentId)
    .eq('storage_provider', 'docuseal')
    .eq('file_kind', input.fileKind);

  const { error } = await supabase.from('client_document_storage_locations').insert({
    organization_id: input.organizationId,
    client_id: input.clientId,
    document_id: input.documentId,
    storage_provider: 'docuseal',
    file_kind: input.fileKind,
    file_name: input.fileName,
    url: input.url,
    mime_type: 'application/pdf',
    metadata: { docuseal_submission_id: input.submissionId },
  });
  if (error) throw new Error(`upsertDocuSealStorageLocation: ${error.message}`);
}

async function upsertGoogleDriveStorageLocation(input: {
  organizationId: string;
  clientId: string;
  documentId: string;
  fileKind: 'combined_pdf' | 'audit_log';
  fileName: string;
  fileId: string;
  folderId: string;
  url: string;
}): Promise<void> {
  await supabase
    .from('client_document_storage_locations')
    .delete()
    .eq('organization_id', input.organizationId)
    .eq('document_id', input.documentId)
    .eq('storage_provider', 'google_drive')
    .eq('file_kind', input.fileKind);

  const { error } = await supabase.from('client_document_storage_locations').insert({
    organization_id: input.organizationId,
    client_id: input.clientId,
    document_id: input.documentId,
    storage_provider: 'google_drive',
    file_kind: input.fileKind,
    file_name: input.fileName,
    file_id: input.fileId,
    folder_id: input.folderId,
    url: input.url,
    mime_type: 'application/pdf',
  });
  if (error) throw new Error(`upsertGoogleDriveStorageLocation: ${error.message}`);
}

async function getDocumentClient(clientId: string | null): Promise<UnknownRecord | null> {
  if (!clientId) return null;
  const { data, error } = await supabase
    .from('clients')
    .select('id,name,slug,primary_contact_name,primary_contact_email,metadata')
    .eq('id', clientId)
    .maybeSingle();
  if (error && !missingRelation(error)) throw new Error(`getDocumentClient: ${error.message}`);
  return asRecord(data);
}

async function getDocumentRecipient(documentId: string): Promise<UnknownRecord | null> {
  const { data, error } = await supabase
    .from('client_document_recipients')
    .select('id,full_name,email,status,completed_at')
    .eq('document_id', documentId)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (error && !missingRelation(error)) throw new Error(`getDocumentRecipient: ${error.message}`);
  return asRecord(data);
}

async function hasDocumentEvent(organizationId: string, documentId: string, idempotencyKey: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('client_document_events')
    .select('id')
    .eq('organization_id', organizationId)
    .eq('document_id', documentId)
    .eq('idempotency_key', idempotencyKey)
    .limit(1);
  if (error && !missingRelation(error)) throw new Error(`hasDocumentEvent: ${error.message}`);
  return (data ?? []).length > 0;
}

async function recordDocumentEvent(input: {
  organizationId: string;
  clientId: string | null;
  documentId: string;
  source: string;
  eventType: string;
  idempotencyKey: string;
  eventTimestamp?: string | null;
  payload?: unknown;
}): Promise<void> {
  const { error } = await supabase.from('client_document_events').insert({
    organization_id: input.organizationId,
    client_id: input.clientId,
    document_id: input.documentId,
    source: input.source,
    event_type: input.eventType,
    idempotency_key: input.idempotencyKey,
    event_timestamp: input.eventTimestamp ?? new Date().toISOString(),
    payload: input.payload ?? {},
  });
  if (error && error.code !== '23505') throw new Error(`recordDocumentEvent: ${error.message}`);
}

async function archiveSignedDocumentsToGoogleDrive(input: {
  organizationId: string;
  document: UnknownRecord;
  client: UnknownRecord | null;
  submissionId: string;
  completedAt: string | null;
  combinedDocumentUrl: string | null;
  auditLogUrl: string | null;
}): Promise<{ status: string; fileUrl: string | null; folderUrl: string | null }> {
  const documentId = asString(input.document.id) ?? '';
  const clientId = asString(input.document.client_id) ?? '';
  const documentNumber = asString(input.document.document_number) ?? documentId;
  let folderId = asString(input.document.google_drive_folder_id);

  const skipped = async (status: string, folderUrl: string | null = buildGoogleDriveFolderUrl(folderId)) => {
    await recordDocumentEvent({
      organizationId: input.organizationId,
      clientId,
      documentId,
      source: 'google_drive',
      eventType: 'google_drive_archive_skipped',
      idempotencyKey: `google-drive-archive-skipped:${input.submissionId}:${input.completedAt ?? 'completed'}:${status}`,
      eventTimestamp: input.completedAt,
      payload: { status, folder_id: folderId },
    });
    return { status, fileUrl: null, folderUrl };
  };

  if (!input.combinedDocumentUrl) return skipped('No signed PDF URL available yet.');
  if (!isGoogleDriveArchiveConfigured()) return skipped('Google Drive archive not configured.');

  if (!folderId) {
    // Determine the root folder: use configured one, or auto-create "Lucid OS - Documents Signés" at Drive root.
    const rootFolderId = config.googleDriveRootFolderId ||
      await findOrCreateGoogleDriveFolder({ parentFolderId: 'root', folderName: 'Lucid OS - Documents Signés' });
    const folderName = asString(input.client?.name) ?? asString(input.client?.slug) ?? clientId;
    folderId = await findOrCreateGoogleDriveFolder({ parentFolderId: rootFolderId, folderName });
    await supabase.from('client_documents').update({ google_drive_folder_id: folderId }).eq('id', documentId);
  }

  if (!folderId) return skipped('Client Google Drive folder id is missing.', null);

  try {
    const signedPdf = await uploadPdfToGoogleDrive({
      folderId,
      fileName: `${documentNumber}-bdc-contrat-signes.pdf`,
      sourceUrl: input.combinedDocumentUrl,
    });
    await upsertGoogleDriveStorageLocation({
      organizationId: input.organizationId,
      clientId,
      documentId,
      fileKind: 'combined_pdf',
      fileName: signedPdf.fileName,
      fileId: signedPdf.fileId,
      folderId: signedPdf.folderId,
      url: signedPdf.url,
    });

    if (input.auditLogUrl) {
      const auditLog = await uploadPdfToGoogleDrive({
        folderId,
        fileName: `${documentNumber}-audit-docuseal.pdf`,
        sourceUrl: input.auditLogUrl,
      });
      await upsertGoogleDriveStorageLocation({
        organizationId: input.organizationId,
        clientId,
        documentId,
        fileKind: 'audit_log',
        fileName: auditLog.fileName,
        fileId: auditLog.fileId,
        folderId: auditLog.folderId,
        url: auditLog.url,
      });
    }

    await recordDocumentEvent({
      organizationId: input.organizationId,
      clientId,
      documentId,
      source: 'google_drive',
      eventType: 'google_drive_archive_completed',
      idempotencyKey: `google-drive-archive:${input.submissionId}:${input.completedAt ?? 'completed'}`,
      eventTimestamp: input.completedAt,
      payload: { folder_id: folderId, signed_pdf_url: signedPdf.url },
    });

    return { status: 'Archived in Google Drive.', fileUrl: signedPdf.url, folderUrl: buildGoogleDriveFolderUrl(folderId) };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown Google Drive archive error';
    await recordDocumentEvent({
      organizationId: input.organizationId,
      clientId,
      documentId,
      source: 'google_drive',
      eventType: 'google_drive_archive_failed',
      idempotencyKey: `google-drive-archive-failed:${input.submissionId}:${input.completedAt ?? 'completed'}`,
      eventTimestamp: input.completedAt,
      payload: { error: message, folder_id: folderId },
    });
    return { status: `Google Drive archive failed: ${message}`, fileUrl: null, folderUrl: buildGoogleDriveFolderUrl(folderId) };
  }
}

async function sendSignedDocumentNotificationOnce(input: {
  organizationId: string;
  document: UnknownRecord;
  client: UnknownRecord | null;
  recipient: UnknownRecord | null;
  submissionId: string;
  completedAt: string | null;
  combinedDocumentUrl: string | null;
  auditLogUrl: string | null;
  driveArchive: { status: string; fileUrl: string | null; folderUrl: string | null };
}): Promise<void> {
  const documentId = asString(input.document.id) ?? '';
  const clientId = asString(input.document.client_id);
  const idempotencyKey = `signed-document-notification:${input.submissionId}:${input.completedAt ?? 'completed'}`;
  if (await hasDocumentEvent(input.organizationId, documentId, idempotencyKey)) return;

  const clientSlug = asString(input.client?.slug);
  const adminUrl = clientSlug ? `https://lucid-lab.fr/admin/lucid-os/clients/${clientSlug}` : null;
  await sendDocumentSignedNotification({
    clientName: asString(input.client?.name),
    signerName: asString(input.recipient?.full_name) ?? asString(input.client?.primary_contact_name),
    documentNumber: asString(input.document.document_number),
    documentTitle: asString(input.document.title) ?? 'Bon de commande + contrat Lucid-Lab',
    signedAt: input.completedAt,
    signedPdfUrl: input.combinedDocumentUrl,
    googleDriveUrl: input.driveArchive.fileUrl,
    googleDriveFolderUrl: input.driveArchive.folderUrl,
    auditLogUrl: input.auditLogUrl,
    adminUrl,
    driveStatus: input.driveArchive.status,
  });
  await recordDocumentEvent({
    organizationId: input.organizationId,
    clientId,
    documentId,
    source: 'lucid_os',
    eventType: 'signed_document_notification_sent',
    idempotencyKey,
    eventTimestamp: input.completedAt,
    payload: { to: config.teamNotificationEmail, drive_status: input.driveArchive.status },
  });
}

async function finalizeSignedDocumentBusinessEvents(input: {
  organizationId: string;
  document: UnknownRecord;
  submissionId: string;
  completedAt: string | null;
  source: string;
}): Promise<void> {
  const documentId = asString(input.document.id) ?? '';
  const { data: existingBillingEvents, error: billingLookupError } = await supabase
    .from('client_billing_events')
    .select('id')
    .eq('organization_id', input.organizationId)
    .eq('document_id', documentId)
    .eq('event_type', 'bdc_signed')
    .limit(1);
  if (billingLookupError) throw new Error(`finalizeSignedDocumentBusinessEvents billing lookup: ${billingLookupError.message}`);

  if ((existingBillingEvents ?? []).length > 0) return;

  await supabase.from('client_billing_events').insert({
    organization_id: input.organizationId,
    client_id: asString(input.document.client_id),
    opportunity_id: asString(input.document.opportunity_id),
    document_id: documentId,
    event_type: 'bdc_signed',
    billing_status: 'signed',
    amount_ht_eur: asNumber(input.document.amount_ht_eur),
    setup_amount_eur: asNumber(input.document.setup_amount_eur),
    monthly_amount_eur: asNumber(input.document.monthly_amount_eur),
    vat_amount_eur: asNumber(input.document.vat_amount_eur),
    amount_ttc_eur: asNumber(input.document.amount_ttc_eur),
    occurred_at: input.completedAt ?? new Date().toISOString(),
    metadata: { docuseal_submission_id: input.submissionId, source: input.source },
  });

  if (asString(input.document.opportunity_id)) {
    await supabase
      .from('client_opportunities')
      .update({ stage: 'won', status: 'won', closed_at: input.completedAt ?? new Date().toISOString(), next_step: 'Generate and send facture' })
      .eq('id', asString(input.document.opportunity_id));
  }

  await createLucidClientTask({
    clientId: asString(input.document.client_id) ?? '',
    opportunityId: asString(input.document.opportunity_id),
    title: `Generate facture for ${asString(input.document.document_number) ?? 'signed BDC'}`,
    description: 'Bon de commande and service contract have been signed in DocuSeal. Generate the facture, archive it in Drive, and send it to the client.',
    priority: 'high',
    createdBy: input.source,
  });
}

export async function refreshDocuSealDocumentStatus(documentId: string): Promise<void> {
  const organizationId = await ensureLucidOrganizationId();
  const { data: documentRow, error: documentError } = await supabase
    .from('client_documents')
    .select('id,organization_id,client_id,opportunity_id,status,title,document_number,amount_ht_eur,setup_amount_eur,monthly_amount_eur,vat_amount_eur,amount_ttc_eur,docuseal_submission_id,google_drive_folder_id')
    .eq('organization_id', organizationId)
    .eq('id', documentId)
    .maybeSingle();
  if (documentError) throw new Error(`refreshDocuSealDocumentStatus document: ${documentError.message}`);

  const document = asRecord(documentRow);
  if (!document) throw new Error('Document not found.');
  const submissionId = asString(document.docuseal_submission_id);
  if (!submissionId) throw new Error('Document has no DocuSeal submission id.');

  const latestSubmission = await getDocuSealSubmission(submissionId);
  const submissionRecord = asRecord(latestSubmission) ?? {};
  const submitters = getDocuSealSubmitters(submissionRecord);
  const firstSubmitter = submitters[0] ?? null;
  const inferredStatus = inferDocuSealDocumentStatus(submissionRecord);
  const completedAt = getDocuSealCompletedAt(submissionRecord);
  const completed = inferredStatus === 'signed';
  let combinedDocumentUrl = asString(submissionRecord.combined_document_url);

  if (completed && !combinedDocumentUrl) {
    try {
      const documents = await getDocuSealSubmissionDocuments(submissionId);
      combinedDocumentUrl = documents.documents?.map((documentItem) => asString(documentItem.url)).find(Boolean) ?? null;
    } catch {
      combinedDocumentUrl = null;
    }
  }

  const auditLogUrl = asString(submissionRecord.audit_log_url);
  const documentUpdates: UnknownRecord = { docuseal_response: latestSubmission };
  if (inferredStatus) documentUpdates.status = inferredStatus;
  if (completedAt) documentUpdates.completed_at = completedAt;
  if (auditLogUrl) documentUpdates.docuseal_audit_log_url = auditLogUrl;
  if (combinedDocumentUrl) documentUpdates.docuseal_combined_document_url = combinedDocumentUrl;

  const { error: updateDocumentError } = await supabase
    .from('client_documents')
    .update(documentUpdates)
    .eq('id', documentId);
  if (updateDocumentError) throw new Error(`refreshDocuSealDocumentStatus update document: ${updateDocumentError.message}`);

  if (firstSubmitter) {
    const recipientUpdates: UnknownRecord = {};
    if (completed) recipientUpdates.status = 'completed';
    else if (asString(firstSubmitter.opened_at)) recipientUpdates.status = 'opened';
    if (asString(firstSubmitter.opened_at)) recipientUpdates.opened_at = asString(firstSubmitter.opened_at);
    if (asString(firstSubmitter.completed_at)) recipientUpdates.completed_at = asString(firstSubmitter.completed_at);
    if (Array.isArray(firstSubmitter.values)) recipientUpdates.values = firstSubmitter.values;

    if (Object.keys(recipientUpdates).length > 0) {
      const { error: updateRecipientError } = await supabase
        .from('client_document_recipients')
        .update(recipientUpdates)
        .eq('organization_id', organizationId)
        .eq('document_id', documentId)
        .eq('docuseal_submitter_id', asString(firstSubmitter.id));
      if (updateRecipientError) throw new Error(`refreshDocuSealDocumentStatus update recipient: ${updateRecipientError.message}`);
    }
  }

  if (combinedDocumentUrl) {
    await upsertDocuSealStorageLocation({
      organizationId,
      clientId: asString(document.client_id) ?? '',
      documentId,
      fileKind: 'combined_pdf',
      fileName: `${asString(document.document_number) ?? documentId}-signed.pdf`,
      url: combinedDocumentUrl,
      submissionId,
    });
  }

  if (auditLogUrl) {
    await upsertDocuSealStorageLocation({
      organizationId,
      clientId: asString(document.client_id) ?? '',
      documentId,
      fileKind: 'audit_log',
      fileName: `${asString(document.document_number) ?? documentId}-audit-log.pdf`,
      url: auditLogUrl,
      submissionId,
    });
  }

  const idempotencyKey = `docuseal-refresh:${submissionId}:${completedAt ?? asString(submissionRecord.status) ?? 'pending'}`;
  const { error: eventError } = await supabase.from('client_document_events').insert({
    organization_id: organizationId,
    client_id: asString(document.client_id),
    document_id: documentId,
    source: 'docuseal',
    event_type: completed ? 'docuseal_refresh_completed' : 'docuseal_refresh_checked',
    idempotency_key: idempotencyKey,
    external_submission_id: submissionId,
    external_submitter_id: asString(firstSubmitter?.id),
    event_timestamp: completedAt ?? new Date().toISOString(),
    payload: latestSubmission,
  });
  if (eventError && eventError.code !== '23505') throw new Error(`refreshDocuSealDocumentStatus event: ${eventError.message}`);

  if (completed) {
    const client = await getDocumentClient(asString(document.client_id));
    const recipient = await getDocumentRecipient(documentId);
    const driveArchive = await archiveSignedDocumentsToGoogleDrive({
      organizationId,
      document,
      client,
      submissionId,
      completedAt,
      combinedDocumentUrl,
      auditLogUrl,
    });
    await sendSignedDocumentNotificationOnce({
      organizationId,
      document,
      client,
      recipient,
      submissionId,
      completedAt,
      combinedDocumentUrl,
      auditLogUrl,
      driveArchive,
    });
    await finalizeSignedDocumentBusinessEvents({
      organizationId,
      document,
      submissionId,
      completedAt,
      source: 'docuseal_refresh',
    });
  }

  await recordLucidAuditEvent({
    eventType: 'docuseal_document_status_refreshed',
    summary: `DocuSeal document status refreshed: ${asString(document.document_number) ?? documentId}`,
    actorType: 'admin',
    clientId: asString(document.client_id),
    targetTable: 'client_documents',
    targetId: documentId,
    riskLevel: completed ? 'medium' : 'low',
    details: { docuseal_submission_id: submissionId, status: inferredStatus, has_combined_document_url: Boolean(combinedDocumentUrl) },
  });
}

function webhookTimestamp(payload: DocuSealWebhookPayload): string {
  const parsed = payload.timestamp ? new Date(payload.timestamp) : new Date();
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

function webhookStatusForDocument(eventType: string, data: UnknownRecord): Partial<Record<string, unknown>> {
  const timestamp = webhookTimestamp({ timestamp: asString(data.completed_at) ?? asString(data.updated_at) ?? undefined });
  switch (eventType) {
    case 'form.viewed':
      return { status: 'viewed', viewed_at: asString(data.opened_at) ?? timestamp };
    case 'form.started':
      return { status: 'in_progress', started_at: timestamp };
    case 'form.completed':
    case 'submission.completed':
      return { status: 'signed', completed_at: asString(data.completed_at) ?? timestamp };
    case 'form.declined':
      return { status: 'declined', declined_at: asString(data.declined_at) ?? timestamp };
    case 'submission.expired':
      return { status: 'expired', expired_at: timestamp };
    case 'submission.archived':
      return { status: 'archived', archived_at: timestamp };
    default:
      return {};
  }
}

function webhookStatusForRecipient(eventType: string, data: UnknownRecord): Partial<Record<string, unknown>> {
  switch (eventType) {
    case 'form.viewed':
      return { status: 'opened', opened_at: asString(data.opened_at) ?? webhookTimestamp({ data }) };
    case 'form.started':
      return { status: 'in_progress', started_at: webhookTimestamp({ data }) };
    case 'form.completed':
      return { status: 'completed', completed_at: asString(data.completed_at) ?? webhookTimestamp({ data }) };
    case 'form.declined':
      return { status: 'declined', declined_at: asString(data.declined_at) ?? webhookTimestamp({ data }), decline_reason: asString(data.decline_reason) };
    default:
      return {};
  }
}

function webhookIdempotencyKey(eventType: string, payload: DocuSealWebhookPayload, rawBody: string): string {
  const data = asRecord(payload.data) ?? {};
  const submission = asRecord(data.submission) ?? data;
  const hash = createHash('sha256').update(rawBody).digest('hex').slice(0, 24);
  return [eventType, asString(payload.timestamp), asString(submission.id), asString(data.id), hash].filter(Boolean).join(':');
}

export async function recordDocuSealWebhookEvent(payload: DocuSealWebhookPayload, rawBody: string): Promise<void> {
  const eventType = asString(payload.event_type);
  if (!eventType) throw new Error('DocuSeal webhook payload is missing event_type.');

  const organizationId = await ensureLucidOrganizationId();
  const data = asRecord(payload.data) ?? {};
  const nestedSubmission = asRecord(data.submission);
  const submissionId = asString(nestedSubmission?.id) ?? (eventType.startsWith('submission.') ? asString(data.id) : null);
  const submitterId = eventType.startsWith('form.') ? asString(data.id) : null;

  let document: UnknownRecord | null = null;
  if (submissionId) {
    const { data: documentRow, error } = await supabase
      .from('client_documents')
      .select('id,organization_id,client_id,opportunity_id,title,document_number,amount_ht_eur,setup_amount_eur,monthly_amount_eur,vat_amount_eur,amount_ttc_eur,status,google_drive_folder_id')
      .eq('organization_id', organizationId)
      .eq('docuseal_submission_id', submissionId)
      .maybeSingle();
    if (error && !missingRelation(error)) throw new Error(`recordDocuSealWebhookEvent document lookup: ${error.message}`);
    document = asRecord(documentRow);
  }

  let recipient: UnknownRecord | null = null;
  if (document && submitterId) {
    const { data: recipientRow, error } = await supabase
      .from('client_document_recipients')
      .select('id,client_id,document_id')
      .eq('organization_id', organizationId)
      .eq('document_id', String(document.id))
      .eq('docuseal_submitter_id', submitterId)
      .maybeSingle();
    if (error && !missingRelation(error)) throw new Error(`recordDocuSealWebhookEvent recipient lookup: ${error.message}`);
    recipient = asRecord(recipientRow);
  }

  const eventTimestamp = webhookTimestamp(payload);
  const idempotencyKey = webhookIdempotencyKey(eventType, payload, rawBody);
  const { error: insertEventError } = await supabase.from('client_document_events').insert({
    organization_id: organizationId,
    client_id: asString(document?.client_id),
    document_id: asString(document?.id),
    recipient_id: asString(recipient?.id),
    source: 'docuseal',
    event_type: eventType,
    idempotency_key: idempotencyKey,
    external_submission_id: submissionId,
    external_submitter_id: submitterId,
    event_timestamp: eventTimestamp,
    payload,
  });

  if (insertEventError) {
    if (insertEventError.code === '23505') return;
    throw new Error(`recordDocuSealWebhookEvent event insert: ${insertEventError.message}`);
  }

  if (!document) return;

  const documentUpdates = webhookStatusForDocument(eventType, nestedSubmission ?? data);
  let auditLogUrl = asString(data.audit_log_url) ?? asString(nestedSubmission?.audit_log_url);
  let combinedDocumentUrl = asString(data.combined_document_url) ?? asString(nestedSubmission?.combined_document_url);
  if (auditLogUrl) documentUpdates.docuseal_audit_log_url = auditLogUrl;
  if (combinedDocumentUrl) documentUpdates.docuseal_combined_document_url = combinedDocumentUrl;
  if (Object.keys(documentUpdates).length > 0) {
    const { error } = await supabase
      .from('client_documents')
      .update({ ...documentUpdates, docuseal_response: payload })
      .eq('id', asString(document.id));
    if (error) throw new Error(`recordDocuSealWebhookEvent document update: ${error.message}`);
  }

  if (recipient) {
    const recipientUpdates = webhookStatusForRecipient(eventType, data);
    if (Object.keys(recipientUpdates).length > 0) {
      const { error } = await supabase
        .from('client_document_recipients')
        .update({ ...recipientUpdates, values: Array.isArray(data.values) ? data.values : [] })
        .eq('id', asString(recipient.id));
      if (error) throw new Error(`recordDocuSealWebhookEvent recipient update: ${error.message}`);
    }
  }

  if (eventType === 'submission.completed' || eventType === 'form.completed') {
    if (submissionId) {
      try {
        const latestSubmission = await getDocuSealSubmission(submissionId);
        auditLogUrl = asString(latestSubmission.audit_log_url) ?? auditLogUrl;
        combinedDocumentUrl = asString(latestSubmission.combined_document_url) ?? combinedDocumentUrl;
        if (!combinedDocumentUrl) {
          const documents = await getDocuSealSubmissionDocuments(submissionId);
          combinedDocumentUrl = documents.documents?.map((documentItem) => asString(documentItem.url)).find(Boolean) ?? null;
        }
        await supabase
          .from('client_documents')
          .update({
            docuseal_response: latestSubmission,
            docuseal_audit_log_url: auditLogUrl,
            docuseal_combined_document_url: combinedDocumentUrl,
          })
          .eq('id', asString(document.id));
      } catch {
        // The webhook payload is still enough to update Lucid OS; polling can recover later.
      }
    }

    if (combinedDocumentUrl && submissionId) {
      await upsertDocuSealStorageLocation({
        organizationId,
        clientId: asString(document.client_id) ?? '',
        documentId: asString(document.id) ?? '',
        fileKind: 'combined_pdf',
        fileName: `${asString(document.document_number) ?? asString(document.id)}-signed.pdf`,
        url: combinedDocumentUrl,
        submissionId,
      });
    }

    if (auditLogUrl && submissionId) {
      await upsertDocuSealStorageLocation({
        organizationId,
        clientId: asString(document.client_id) ?? '',
        documentId: asString(document.id) ?? '',
        fileKind: 'audit_log',
        fileName: `${asString(document.document_number) ?? asString(document.id)}-audit-log.pdf`,
        url: auditLogUrl,
        submissionId,
      });
    }

    if (submissionId) {
      const client = await getDocumentClient(asString(document.client_id));
      const driveArchive = await archiveSignedDocumentsToGoogleDrive({
        organizationId,
        document,
        client,
        submissionId,
        completedAt: eventTimestamp,
        combinedDocumentUrl,
        auditLogUrl,
      });
      await sendSignedDocumentNotificationOnce({
        organizationId,
        document,
        client,
        recipient,
        submissionId,
        completedAt: eventTimestamp,
        combinedDocumentUrl,
        auditLogUrl,
        driveArchive,
      });
      await finalizeSignedDocumentBusinessEvents({
        organizationId,
        document,
        submissionId,
        completedAt: eventTimestamp,
        source: 'docuseal_webhook',
      });
    }
  }

  if (eventType === 'form.declined') {
    await createLucidClientTask({
      clientId: asString(document.client_id) ?? '',
      opportunityId: asString(document.opportunity_id),
      title: `Follow up declined document ${asString(document.document_number) ?? ''}`.trim(),
      description: asString(data.decline_reason) ?? 'The client declined the DocuSeal document. Review and follow up.',
      priority: 'urgent',
      createdBy: 'docuseal_webhook',
    });
  }

  await recordLucidAuditEvent({
    eventType: 'docuseal_webhook_processed',
    summary: `DocuSeal event processed: ${eventType}`,
    actorType: 'integration',
    clientId: asString(document.client_id),
    targetTable: 'client_documents',
    targetId: asString(document.id),
    riskLevel: eventType.includes('declined') ? 'medium' : 'low',
    details: { event_type: eventType, docuseal_submission_id: submissionId, docuseal_submitter_id: submitterId },
  });
}