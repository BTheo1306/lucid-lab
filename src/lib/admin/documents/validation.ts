import type { LucidDocumentValidationIssue } from './types';

interface BonDeCommandeValidationInput {
  clientName: string | null;
  contactName: string | null;
  contactEmail: string | null;
  opportunityTitle: string | null;
  amountHtEur: number | null;
  setupAmountEur: number | null;
  monthlyAmountEur: number | null;
  googleDriveFolderId: string | null;
}

export function calculateVatAmounts(amountHtEur: number | null, vatRate: number): { vatAmountEur: number | null; amountTtcEur: number | null } {
  if (amountHtEur === null || !Number.isFinite(amountHtEur)) return { vatAmountEur: null, amountTtcEur: null };
  const vatAmountEur = Number((amountHtEur * (vatRate / 100)).toFixed(2));
  return { vatAmountEur, amountTtcEur: Number((amountHtEur + vatAmountEur).toFixed(2)) };
}

export function resolveBonDeCommandeAmount(input: { valueEstimateEur: number | null; setupValueEur: number | null; monthlyValueEur: number | null }): number | null {
  if (input.setupValueEur !== null) return input.setupValueEur;
  if (input.valueEstimateEur !== null) return input.valueEstimateEur;
  if (input.monthlyValueEur !== null) return input.monthlyValueEur;
  return null;
}

export function validateBonDeCommandeDraft(input: BonDeCommandeValidationInput): LucidDocumentValidationIssue[] {
  const issues: LucidDocumentValidationIssue[] = [];

  if (!input.clientName) {
    issues.push({ code: 'client_name_missing', field: 'client.name', message: 'Client legal or display name is missing.', severity: 'error' });
  }

  if (!input.contactName) {
    issues.push({ code: 'signer_name_missing', field: 'contact.full_name', message: 'Primary signer name is missing.', severity: 'error' });
  }

  if (!input.contactEmail) {
    issues.push({ code: 'signer_email_missing', field: 'contact.email', message: 'Primary signer email is required before sending to DocuSeal.', severity: 'error' });
  }

  if (!input.opportunityTitle) {
    issues.push({ code: 'opportunity_missing', field: 'opportunity_id', message: 'Attach a commercial opportunity before generating the bon de commande.', severity: 'error' });
  }

  if (input.amountHtEur === null || input.amountHtEur <= 0) {
    issues.push({ code: 'amount_missing', field: 'amount_ht_eur', message: 'A positive setup or forecast amount is required.', severity: 'error' });
  }

  if (input.setupAmountEur === null && input.monthlyAmountEur === null) {
    issues.push({ code: 'amount_split_missing', field: 'opportunity.amounts', message: 'No setup/monthly split is recorded; the draft uses the forecast amount only.', severity: 'warning' });
  }

  if (!input.googleDriveFolderId) {
    issues.push({ code: 'drive_folder_missing', field: 'google_drive_folder_id', message: 'Client Google Drive folder is missing; signed files cannot be archived automatically yet.', severity: 'warning' });
  }

  return issues;
}

export function hasBlockingValidationIssue(issues: LucidDocumentValidationIssue[]): boolean {
  return issues.some((issue) => issue.severity === 'error');
}