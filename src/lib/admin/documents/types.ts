export type LucidClientDocumentType = 'bon_de_commande' | 'facture' | 'contrat' | 'proposal' | 'other';

export type LucidClientDocumentStatus =
  | 'draft'
  | 'needs_review'
  | 'approved'
  | 'generated'
  | 'ready_to_send'
  | 'sent_for_signature'
  | 'viewed'
  | 'in_progress'
  | 'signed'
  | 'declined'
  | 'expired'
  | 'cancelled'
  | 'archived'
  | 'failed';

export type LucidClientDocumentRecipientStatus =
  | 'pending'
  | 'awaiting'
  | 'sent'
  | 'opened'
  | 'in_progress'
  | 'completed'
  | 'declined'
  | 'expired'
  | 'failed';

export type LucidClientDocumentStorageProvider = 'google_drive' | 'supabase_storage' | 'docuseal' | 'local' | 'other';

export type LucidClientDocumentFileKind =
  | 'draft_docx'
  | 'draft_pdf'
  | 'signed_pdf'
  | 'audit_log'
  | 'combined_pdf'
  | 'invoice_pdf'
  | 'source_docx'
  | 'other';

export type LucidDocumentValidationSeverity = 'error' | 'warning';

export interface LucidDocumentValidationIssue {
  code: string;
  field: string;
  message: string;
  severity: LucidDocumentValidationSeverity;
}

export interface LucidClientDocumentSummary {
  id: string;
  clientId: string;
  opportunityId: string | null;
  primaryContactId: string | null;
  documentType: LucidClientDocumentType;
  status: LucidClientDocumentStatus;
  title: string;
  documentNumber: string | null;
  templateKey: string;
  templateVersion: string;
  currency: 'EUR';
  amountHtEur: number | null;
  setupAmountEur: number | null;
  monthlyAmountEur: number | null;
  vatRate: number;
  vatAmountEur: number | null;
  amountTtcEur: number | null;
  issuedAt: string | null;
  dueAt: string | null;
  sentAt: string | null;
  completedAt: string | null;
  declinedAt: string | null;
  docusealSubmissionId: string | null;
  docusealSubmissionUrl: string | null;
  docusealAuditLogUrl: string | null;
  docusealCombinedDocumentUrl: string | null;
  googleDriveFolderId: string | null;
  validationErrors: LucidDocumentValidationIssue[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateBonDeCommandeDraftInput {
  clientId: string;
  opportunityId?: string | null;
  contactId?: string | null;
  googleDriveFolderId?: string | null;
  scopePerimeter?: string | null;
  syntheticDescription?: string | null;
  deliverables?: string | null;
  calendarTimeline?: string | null;
  nextSteps?: string | null;
  pricingModel?: 'one_shot' | 'monthly' | null;
  clientLegalName?: string | null;
  clientSiret?: string | null;
  clientBillingAddress?: string | null;
  notes?: string | null;
}

export interface CreateBonDeCommandeDraftResult {
  documentId: string;
  status: LucidClientDocumentStatus;
  validationIssues: LucidDocumentValidationIssue[];
}

export interface DocuSealSubmitterPayload {
  role: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  external_id?: string | null;
  values?: Record<string, unknown>;
  fields?: Array<{ name: string; default_value?: string | number | boolean | string[]; readonly?: boolean }>;
  metadata?: Record<string, unknown>;
  send_email?: boolean;
  completed_redirect_url?: string;
  require_email_2fa?: boolean;
}

export interface DocuSealSubmissionResponse {
  id?: string | number;
  slug?: string;
  status?: string;
  submitters?: Array<{
    id?: string | number;
    submission_id?: string | number;
    uuid?: string;
    slug?: string;
    email?: string;
    name?: string;
    role?: string;
    status?: string;
    embed_src?: string;
    sent_at?: string | null;
    opened_at?: string | null;
    completed_at?: string | null;
    declined_at?: string | null;
  }>;
  audit_log_url?: string | null;
  combined_document_url?: string | null;
  url?: string | null;
  [key: string]: unknown;
}

export interface DocuSealHtmlDocumentPayload {
  name: string;
  html: string;
  html_header?: string;
  html_footer?: string;
  size?: 'Letter' | 'Legal' | 'Tabloid' | 'Ledger' | 'A0' | 'A1' | 'A2' | 'A3' | 'A4' | 'A5' | 'A6';
  position?: number;
}