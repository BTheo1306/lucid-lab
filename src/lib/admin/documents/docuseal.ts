import 'server-only';

import { createHmac, timingSafeEqual } from 'node:crypto';
import { config } from '@/lib/bot/config';
import type { DocuSealHtmlDocumentPayload, DocuSealSubmissionResponse, DocuSealSubmitterPayload } from './types';

export interface CreateDocuSealSubmissionInput {
  templateId: string;
  name: string;
  submitters: DocuSealSubmitterPayload[];
  variables?: Record<string, unknown>;
  sendEmail?: boolean;
  completedRedirectUrl?: string | null;
  replyTo?: string | null;
  bccCompleted?: string | null;
  expireAt?: string | null;
  metadata?: Record<string, unknown>;
}

export interface CreateDocuSealHtmlSubmissionInput {
  name: string;
  documents: DocuSealHtmlDocumentPayload[];
  submitters: DocuSealSubmitterPayload[];
  sendEmail?: boolean;
  completedRedirectUrl?: string | null;
  replyTo?: string | null;
  bccCompleted?: string | null;
  expireAt?: string | null;
  metadata?: Record<string, unknown>;
}

function normalizeApiBaseUrl(value: string): string {
  return value.replace(/\/+$/, '');
}

export function getDocuSealApiBaseUrl(): string {
  return normalizeApiBaseUrl(config.docusealApiBaseUrl || 'https://api.docuseal.com');
}

export function assertDocuSealConfigured(): void {
  if (!config.docusealApiKey) throw new Error('DOCUSEAL_API_KEY is required before sending documents to DocuSeal.');
}

async function docusealFetch<T>(path: string, init: RequestInit): Promise<T> {
  assertDocuSealConfigured();
  const response = await fetch(`${getDocuSealApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'X-Auth-Token': config.docusealApiKey,
      ...init.headers,
    },
  });

  const text = await response.text();
  const body = text ? JSON.parse(text) as T : ({} as T);
  if (!response.ok) {
    const errorBody = body as { error?: unknown; message?: unknown };
    const message = typeof body === 'object' && body
      ? String(errorBody.error ?? errorBody.message ?? text)
      : text;
    throw new Error(`DocuSeal API ${response.status}: ${message || response.statusText}`);
  }

  return body;
}

export async function createDocuSealSubmission(input: CreateDocuSealSubmissionInput): Promise<DocuSealSubmissionResponse> {
  const response = await docusealFetch<DocuSealSubmissionResponse | NonNullable<DocuSealSubmissionResponse['submitters']>>('/submissions', {
    method: 'POST',
    body: JSON.stringify({
      template_id: input.templateId,
      name: input.name,
      send_email: input.sendEmail ?? true,
      completed_redirect_url: (input.completedRedirectUrl ?? config.docusealCompletedRedirectUrl) || undefined,
      reply_to: input.replyTo ?? config.emailFrom,
      bcc_completed: input.bccCompleted || undefined,
      expire_at: input.expireAt ?? undefined,
      variables: input.variables ?? {},
      metadata: input.metadata ?? {},
      submitters: input.submitters,
    }),
  });

  if (Array.isArray(response)) {
    const firstSubmitter = response[0];
    return {
      id: firstSubmitter?.submission_id,
      status: 'pending',
      submitters: response,
    };
  }

  return response;
}

export async function createDocuSealHtmlSubmission(input: CreateDocuSealHtmlSubmissionInput): Promise<DocuSealSubmissionResponse> {
  const response = await docusealFetch<DocuSealSubmissionResponse | NonNullable<DocuSealSubmissionResponse['submitters']>>('/submissions/html', {
    method: 'POST',
    body: JSON.stringify({
      name: input.name,
      send_email: input.sendEmail ?? true,
      completed_redirect_url: (input.completedRedirectUrl ?? config.docusealCompletedRedirectUrl) || undefined,
      reply_to: input.replyTo ?? config.emailFrom,
      bcc_completed: input.bccCompleted || undefined,
      expire_at: input.expireAt ?? undefined,
      metadata: input.metadata ?? {},
      documents: input.documents,
      submitters: input.submitters,
      merge_documents: false,
    }),
  });

  if (Array.isArray(response)) {
    const firstSubmitter = response[0];
    return {
      id: firstSubmitter?.submission_id,
      status: 'pending',
      submitters: response,
    };
  }

  return response;
}

export async function getDocuSealSubmission(submissionId: string): Promise<DocuSealSubmissionResponse> {
  return docusealFetch<DocuSealSubmissionResponse>(`/submissions/${encodeURIComponent(submissionId)}`, { method: 'GET' });
}

export async function getDocuSealSubmissionDocuments(submissionId: string): Promise<{ id?: string | number; documents?: Array<{ name?: string; url?: string }> }> {
  return docusealFetch<{ id?: string | number; documents?: Array<{ name?: string; url?: string }> }>(`/submissions/${encodeURIComponent(submissionId)}/documents?merge=true`, { method: 'GET' });
}

export function verifyDocuSealWebhookSignature(rawBody: string, signatureHeader: string | null | Array<string | null>): boolean {
  if (!config.docusealWebhookSecret) return config.nodeEnv !== 'production';
  const signatureHeaders = (Array.isArray(signatureHeader) ? signatureHeader : [signatureHeader])
    .map((header) => header?.trim())
    .filter((header): header is string => Boolean(header));
  if (signatureHeaders.length === 0) return false;

  for (const trimmedSignature of signatureHeaders) {
    if (trimmedSignature === config.docusealWebhookSecret) return true;

    const [timestamp, timestampedSignature] = trimmedSignature.split('.', 2);
    const signedPayload = timestamp && timestampedSignature ? `${timestamp}.${rawBody}` : rawBody;
    const normalizedSignature = (timestampedSignature ?? trimmedSignature).replace(/^sha256=/i, '').trim();
    const expected = createHmac('sha256', config.docusealWebhookSecret).update(signedPayload).digest('hex');
    const expectedBuffer = Buffer.from(expected, 'hex');
    const receivedBuffer = Buffer.from(normalizedSignature, 'hex');

    if (expectedBuffer.length === receivedBuffer.length && timingSafeEqual(expectedBuffer, receivedBuffer)) return true;
  }

  return false;
}