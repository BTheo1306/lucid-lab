import 'server-only';

import { config } from '@/lib/bot/config';
import { supabase } from '@/lib/bot/db/supabase';
import {
  findOrCreateGoogleDriveFolder,
  isGoogleDriveArchiveConfigured,
  uploadBufferToGoogleDrive,
} from '@/lib/admin/documents/google-drive';
import { sendPortalUploadTeamNotification } from '@/lib/bot/integrations/email-client';
import type { PortalSession } from './auth';
import { recordPortalAuditEvent } from './audit';

/**
 * Pièces déposées par le client depuis son portail.
 *
 * Elles partent sur le dossier Drive du client, le même que celui des documents
 * signés : le client remet une pièce, elle se range où l'équipe a déjà
 * l'habitude de chercher.
 */

/** Types acceptés : de quoi couvrir un document signé, un justificatif, une photo. */
const ALLOWED_MIME_TYPES = new Set([
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/heic',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

export const PORTAL_UPLOAD_MAX_BYTES = 20 * 1024 * 1024;

export interface PortalUpload {
  id: string;
  fileName: string;
  note: string | null;
  sizeBytes: number | null;
  status: string;
  createdAt: string;
  documentTitle: string | null;
}

export async function listPortalUploads(session: PortalSession, limit = 30): Promise<PortalUpload[]> {
  const { data, error } = await supabase
    .from('client_uploads')
    .select('id,file_name,note,size_bytes,status,created_at,document:client_documents(title)')
    .eq('organization_id', session.organizationId)
    .eq('client_id', session.clientId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('[portal] listPortalUploads failed:', error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const document = (row.document ?? null) as { title?: string } | null;
    return {
      id: String(row.id),
      fileName: String(row.file_name),
      note: row.note ? String(row.note) : null,
      sizeBytes: row.size_bytes === null ? null : Number(row.size_bytes),
      status: String(row.status ?? 'received'),
      createdAt: String(row.created_at),
      documentTitle: document?.title ? String(document.title) : null,
    };
  });
}

/** Nom de fichier sûr pour Drive, horodaté pour qu'un second dépôt n'écrase pas le premier. */
function buildStoredFileName(clientSlug: string, originalName: string): string {
  const cleaned = originalName
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^A-Za-z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .slice(-80);
  const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');
  return `${stamp}_${clientSlug}_${cleaned || 'document'}`;
}

export type PortalUploadResult =
  | { ok: true }
  | { ok: false; reason: 'empty' | 'too_large' | 'type' | 'storage' };

export async function createPortalUpload(
  session: PortalSession,
  input: { file: File; note?: string | null; documentId?: string | null },
): Promise<PortalUploadResult> {
  const { file } = input;

  if (!file || file.size === 0) return { ok: false, reason: 'empty' };
  if (file.size > PORTAL_UPLOAD_MAX_BYTES) return { ok: false, reason: 'too_large' };
  if (!ALLOWED_MIME_TYPES.has(file.type)) return { ok: false, reason: 'type' };
  if (!isGoogleDriveArchiveConfigured()) {
    console.error('[portal] createPortalUpload: Google Drive is not configured.');
    return { ok: false, reason: 'storage' };
  }

  // Le document cible doit appartenir au client de la session : un identifiant
  // d'un autre client est ignore plutot que refuse, le depot reste valable.
  let documentId: string | null = null;
  if (input.documentId) {
    const { data } = await supabase
      .from('client_documents')
      .select('id')
      .eq('id', input.documentId)
      .eq('client_id', session.clientId)
      .maybeSingle();
    documentId = data ? String(data.id) : null;
  }

  const content = Buffer.from(await file.arrayBuffer());
  const storedName = buildStoredFileName(session.clientSlug, file.name);

  let uploaded;
  try {
    const rootFolderId =
      config.googleDriveRootFolderId ||
      (await findOrCreateGoogleDriveFolder({ parentFolderId: 'root', folderName: 'Lucid OS - Documents Signés' }));
    const folderId = await findOrCreateGoogleDriveFolder({
      parentFolderId: rootFolderId,
      folderName: session.clientName || session.clientSlug,
    });
    uploaded = await uploadBufferToGoogleDrive({
      folderId,
      fileName: storedName,
      mimeType: file.type,
      content,
    });
  } catch (error) {
    console.error('[portal] createPortalUpload: Drive upload failed:', error);
    return { ok: false, reason: 'storage' };
  }

  const note = (input.note ?? '').trim().slice(0, 500) || null;

  const { error } = await supabase.from('client_uploads').insert({
    organization_id: session.organizationId,
    client_id: session.clientId,
    contact_id: session.contactId,
    document_id: documentId,
    file_name: file.name.slice(0, 200),
    mime_type: file.type,
    size_bytes: file.size,
    note,
    storage_provider: 'google_drive',
    file_id: uploaded.fileId,
    folder_id: uploaded.folderId,
    url: uploaded.url,
    status: 'received',
    metadata: { stored_file_name: storedName },
  });

  if (error) {
    console.error('[portal] createPortalUpload: insert failed:', error.message);
    return { ok: false, reason: 'storage' };
  }

  await recordPortalAuditEvent({
    organizationId: session.organizationId,
    clientId: session.clientId,
    eventType: 'portal_document_uploaded',
    summary: `Document déposé depuis le portail : ${file.name}`,
    actorId: session.contactId,
    targetTable: 'client_uploads',
    targetId: uploaded.fileId,
  });

  try {
    await sendPortalUploadTeamNotification({
      clientName: session.clientName,
      contactName: session.contactName,
      fileName: file.name,
      note,
      driveUrl: uploaded.url,
    });
  } catch (notifyError) {
    // Le fichier est deja sur le Drive : l'echec d'email ne doit pas faire
    // croire au client que son depot n'a pas abouti.
    console.error('[portal] createPortalUpload: team notification failed:', notifyError);
  }

  return { ok: true };
}
