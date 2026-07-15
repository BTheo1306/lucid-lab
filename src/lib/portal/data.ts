import 'server-only';

import { downloadGoogleDriveFile } from '@/lib/admin/documents/google-drive';
import { supabase } from '@/lib/bot/db/supabase';
import type { PortalSession } from './auth';

/**
 * Unique read layer for the client portal. Every function takes the
 * authenticated PortalSession and injects organization + client scoping on
 * each query: portal routes never touch Supabase directly (enforced by an
 * ESLint no-restricted-imports rule on src/app/portal).
 */

export type PortalTaskStatus = 'todo' | 'in_progress' | 'waiting' | 'done';

export interface PortalTask {
  id: string;
  title: string;
  description: string | null;
  status: PortalTaskStatus;
  priority: string;
  dueAt: string | null;
  completedAt: string | null;
}

export async function listPortalTasks(session: PortalSession, limit = 120): Promise<PortalTask[]> {
  const { data, error } = await supabase
    .from('client_tasks')
    .select('id,title,description,status,priority,due_at,completed_at,updated_at')
    .eq('organization_id', session.organizationId)
    .eq('client_id', session.clientId)
    .eq('client_visible', true)
    .neq('status', 'cancelled')
    .order('due_at', { ascending: true, nullsFirst: false })
    .limit(limit);

  if (error) {
    console.error('[portal] listPortalTasks failed:', error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: String(row.id),
    title: String(row.title ?? ''),
    description: row.description ? String(row.description) : null,
    status: (['todo', 'in_progress', 'waiting', 'done'].includes(String(row.status))
      ? String(row.status)
      : 'todo') as PortalTaskStatus,
    priority: String(row.priority ?? 'normal'),
    dueAt: row.due_at ? String(row.due_at) : null,
    completedAt: row.completed_at ? String(row.completed_at) : null,
  }));
}

export interface PortalMeeting {
  id: string;
  title: string;
  clientSummary: string;
  occurredAt: string;
}

/** Client-safe meeting recaps only: the internal notes column is never selected. */
export async function listPortalMeetings(session: PortalSession, limit = 20): Promise<PortalMeeting[]> {
  const { data, error } = await supabase
    .from('client_interactions')
    .select('id,summary,client_summary,occurred_at')
    .eq('organization_id', session.organizationId)
    .eq('client_id', session.clientId)
    .eq('interaction_type', 'meeting')
    .eq('client_visible', true)
    .not('client_summary', 'is', null)
    .order('occurred_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[portal] listPortalMeetings failed:', error.message);
    return [];
  }

  return (data ?? [])
    .filter((row) => row.client_summary)
    .map((row) => ({
      id: String(row.id),
      title: String(row.summary ?? 'Réunion'),
      clientSummary: String(row.client_summary),
      occurredAt: String(row.occurred_at ?? ''),
    }));
}

/** Statuses a client may see: drafts and internal review states stay hidden. */
const PORTAL_DOCUMENT_STATUSES = [
  'sent_for_signature',
  'viewed',
  'in_progress',
  'signed',
  'declined',
  'expired',
  'archived',
];

/** Drive file kinds a client may download, in preference order. */
const DOWNLOAD_KIND_PRIORITY = ['signed_pdf', 'combined_pdf', 'invoice_pdf', 'draft_pdf'];

export interface PortalDocument {
  id: string;
  documentType: string;
  status: string;
  title: string;
  documentNumber: string | null;
  amountHtEur: number | null;
  amountTtcEur: number | null;
  setupAmountEur: number | null;
  monthlyAmountEur: number | null;
  issuedAt: string | null;
  dueAt: string | null;
  signedAt: string | null;
  hasDownload: boolean;
}

interface StorageLocationRow {
  storage_provider: string;
  file_kind: string;
  file_id: string | null;
}

export async function listPortalDocuments(session: PortalSession, limit = 50): Promise<PortalDocument[]> {
  const { data, error } = await supabase
    .from('client_documents')
    .select('id,document_type,status,title,document_number,amount_ht_eur,amount_ttc_eur,setup_amount_eur,monthly_amount_eur,issued_at,due_at,completed_at,created_at,storage:client_document_storage_locations(storage_provider,file_kind,file_id)')
    .eq('organization_id', session.organizationId)
    .eq('client_id', session.clientId)
    .in('status', PORTAL_DOCUMENT_STATUSES)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[portal] listPortalDocuments failed:', error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const storage = (row.storage ?? []) as StorageLocationRow[];
    const hasDownload = storage.some(
      (location) =>
        location.storage_provider === 'google_drive' &&
        location.file_id &&
        DOWNLOAD_KIND_PRIORITY.includes(location.file_kind),
    );

    return {
      id: String(row.id),
      documentType: String(row.document_type ?? 'other'),
      status: String(row.status ?? ''),
      title: String(row.title ?? ''),
      documentNumber: row.document_number ? String(row.document_number) : null,
      amountHtEur: row.amount_ht_eur == null ? null : Number(row.amount_ht_eur),
      amountTtcEur: row.amount_ttc_eur == null ? null : Number(row.amount_ttc_eur),
      setupAmountEur: row.setup_amount_eur == null ? null : Number(row.setup_amount_eur),
      monthlyAmountEur: row.monthly_amount_eur == null ? null : Number(row.monthly_amount_eur),
      issuedAt: row.issued_at ? String(row.issued_at) : null,
      dueAt: row.due_at ? String(row.due_at) : null,
      signedAt: row.completed_at ? String(row.completed_at) : null,
      hasDownload,
    };
  });
}

export interface PortalBillingEvent {
  id: string;
  eventType: string;
  billingStatus: string;
  amountHtEur: number | null;
  amountTtcEur: number | null;
  dueAt: string | null;
  occurredAt: string;
}

export async function listPortalBillingEvents(session: PortalSession, limit = 50): Promise<PortalBillingEvent[]> {
  const { data, error } = await supabase
    .from('client_billing_events')
    .select('id,event_type,billing_status,amount_ht_eur,amount_ttc_eur,due_at,occurred_at')
    .eq('organization_id', session.organizationId)
    .eq('client_id', session.clientId)
    .order('occurred_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[portal] listPortalBillingEvents failed:', error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: String(row.id),
    eventType: String(row.event_type ?? 'other'),
    billingStatus: String(row.billing_status ?? 'pending'),
    amountHtEur: row.amount_ht_eur == null ? null : Number(row.amount_ht_eur),
    amountTtcEur: row.amount_ttc_eur == null ? null : Number(row.amount_ttc_eur),
    dueAt: row.due_at ? String(row.due_at) : null,
    occurredAt: String(row.occurred_at ?? ''),
  }));
}

export interface PortalDocumentDownload {
  fileId: string;
  fileName: string;
}

/**
 * Resolve the downloadable Drive file of one document, scoped to the session
 * client. A document of another client resolves to null (rendered as 404).
 */
export async function getPortalDocumentDownload(
  session: PortalSession,
  documentId: string,
): Promise<PortalDocumentDownload | null> {
  const { data: document, error } = await supabase
    .from('client_documents')
    .select('id,title,document_number,status')
    .eq('organization_id', session.organizationId)
    .eq('client_id', session.clientId)
    .eq('id', documentId)
    .in('status', PORTAL_DOCUMENT_STATUSES)
    .maybeSingle();

  if (error || !document) return null;

  const { data: locations, error: locationsError } = await supabase
    .from('client_document_storage_locations')
    .select('file_kind,file_id,file_name')
    .eq('document_id', documentId)
    .eq('storage_provider', 'google_drive')
    .not('file_id', 'is', null);

  if (locationsError || !locations?.length) return null;

  for (const kind of DOWNLOAD_KIND_PRIORITY) {
    const location = locations.find((entry) => entry.file_kind === kind && entry.file_id);
    if (location) {
      const fallbackName = `${String(document.document_number ?? document.title ?? 'document-lucid-lab')}.pdf`;
      return {
        fileId: String(location.file_id),
        fileName: String(location.file_name ?? fallbackName),
      };
    }
  }
  return null;
}

/**
 * Resolve and stream one document file for the session client. Returns null
 * when the document does not belong to the client or has no archived file;
 * throws when Google Drive itself fails (the route renders a 502).
 */
export async function downloadPortalDocumentFile(
  session: PortalSession,
  documentId: string,
): Promise<{ body: ReadableStream<Uint8Array> | null; contentType: string; fileName: string } | null> {
  const download = await getPortalDocumentDownload(session, documentId);
  if (!download) return null;

  const file = await downloadGoogleDriveFile(download.fileId);
  return { body: file.body, contentType: file.contentType, fileName: download.fileName };
}

export interface PortalProject {
  id: string;
  name: string;
  projectType: string;
  status: string;
  summary: string | null;
  dueAt: string | null;
  updatedAt: string | null;
}

export async function listPortalProjects(session: PortalSession, limit = 25): Promise<PortalProject[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('id,name,project_type,status,summary,due_at,updated_at')
    .eq('organization_id', session.organizationId)
    .eq('client_id', session.clientId)
    .neq('status', 'archived')
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[portal] listPortalProjects failed:', error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: String(row.id),
    name: String(row.name ?? ''),
    projectType: String(row.project_type ?? 'website'),
    status: String(row.status ?? 'active'),
    summary: row.summary ? String(row.summary) : null,
    dueAt: row.due_at ? String(row.due_at) : null,
    updatedAt: row.updated_at ? String(row.updated_at) : null,
  }));
}
