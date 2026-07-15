import 'server-only';

import { createSign } from 'node:crypto';
import { config } from '@/lib/bot/config';

const googleTokenUrl = 'https://oauth2.googleapis.com/token';
const googleDriveFilesUrl = 'https://www.googleapis.com/drive/v3/files';
const googleDriveUploadUrl = 'https://www.googleapis.com/upload/drive/v3/files';
const googleDriveScope = 'https://www.googleapis.com/auth/drive';

export interface GoogleDriveUploadResult {
  fileId: string;
  fileName: string;
  url: string;
  folderId: string;
}

export function buildGoogleDriveFolderUrl(folderId: string | null): string | null {
  if (!folderId) return null;
  return `https://drive.google.com/drive/folders/${encodeURIComponent(folderId)}`;
}

export function buildGoogleDriveFileUrl(fileId: string | null): string | null {
  if (!fileId) return null;
  return `https://drive.google.com/file/d/${encodeURIComponent(fileId)}/view`;
}

export function isGoogleDriveArchiveConfigured(): boolean {
  const hasOAuth2 = Boolean(config.googleDriveClientId && config.googleDriveClientSecret && config.googleDriveRefreshToken);
  const hasServiceAccount = Boolean(config.googleDriveClientEmail && config.googleDrivePrivateKey);
  return hasOAuth2 || hasServiceAccount;
}

function normalizePrivateKey(value: string): string {
  return value.replace(/\\n/g, '\n');
}

function base64Url(input: string | Buffer): string {
  return Buffer.from(input)
    .toString('base64')
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

async function getGoogleDriveAccessTokenOAuth2(): Promise<string> {
  const response = await fetch(googleTokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: config.googleDriveClientId,
      client_secret: config.googleDriveClientSecret,
      refresh_token: config.googleDriveRefreshToken,
      grant_type: 'refresh_token',
    }),
  });
  const body = await response.json() as { access_token?: string; error?: string; error_description?: string };
  if (!response.ok || !body.access_token) {
    throw new Error(`Google Drive OAuth2 token refresh failed: ${body.error_description ?? body.error ?? response.statusText}`);
  }
  return body.access_token;
}

async function getGoogleDriveAccessToken(): Promise<string> {
  if (!isGoogleDriveArchiveConfigured()) throw new Error('Google Drive archive is not configured.');

  // Prefer OAuth2 refresh token over service account JWT
  if (config.googleDriveClientId && config.googleDriveClientSecret && config.googleDriveRefreshToken) {
    return getGoogleDriveAccessTokenOAuth2();
  }

  const now = Math.floor(Date.now() / 1000);
  const header = { alg: 'RS256', typ: 'JWT' };
  const payload: Record<string, unknown> = {
    iss: config.googleDriveClientEmail,
    scope: googleDriveScope,
    aud: googleTokenUrl,
    iat: now,
    exp: now + 3600,
  };
  if (config.googleDriveImpersonatedUser) payload.sub = config.googleDriveImpersonatedUser;

  const unsignedToken = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(payload))}`;
  const signature = createSign('RSA-SHA256')
    .update(unsignedToken)
    .sign(normalizePrivateKey(config.googleDrivePrivateKey));
  const assertion = `${unsignedToken}.${base64Url(signature)}`;

  const response = await fetch(googleTokenUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  });

  const body = await response.json() as { access_token?: string; error?: string; error_description?: string };
  if (!response.ok || !body.access_token) {
    throw new Error(`Google Drive auth failed: ${body.error_description ?? body.error ?? response.statusText}`);
  }
  return body.access_token;
}

/**
 * Stream a Drive file (alt=media). Used by the portal download proxy so
 * clients get their PDFs through an authenticated route, never a Drive URL.
 */
export async function downloadGoogleDriveFile(fileId: string): Promise<{
  body: ReadableStream<Uint8Array> | null;
  contentType: string;
}> {
  const token = await getGoogleDriveAccessToken();
  const response = await fetch(
    `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(fileId)}?alt=media&supportsAllDrives=true`,
    { headers: { Authorization: `Bearer ${token}` } },
  );

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Google Drive download ${response.status}: ${text.slice(0, 300) || response.statusText}`);
  }

  return {
    body: response.body,
    contentType: response.headers.get('content-type') ?? 'application/pdf',
  };
}

function escapeDriveQueryValue(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

async function googleDriveFetch<T>(pathOrUrl: string, init: RequestInit = {}): Promise<T> {
  const token = await getGoogleDriveAccessToken();
  const url = pathOrUrl.startsWith('https://') ? pathOrUrl : `${googleDriveFilesUrl}${pathOrUrl}`;
  const response = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...init.headers,
    },
  });
  const text = await response.text();
  const body = text ? JSON.parse(text) as T : ({} as T);
  if (!response.ok) {
    const message = typeof body === 'object' && body && 'error' in body
      ? JSON.stringify((body as { error?: unknown }).error)
      : text;
    throw new Error(`Google Drive API ${response.status}: ${message || response.statusText}`);
  }
  return body;
}

export async function findOrCreateGoogleDriveFolder(input: { parentFolderId: string; folderName: string }): Promise<string> {
  const query = [
    `name='${escapeDriveQueryValue(input.folderName)}'`,
    `'${escapeDriveQueryValue(input.parentFolderId)}' in parents`,
    `mimeType='application/vnd.google-apps.folder'`,
    'trashed=false',
  ].join(' and ');
  const searchParams = new URLSearchParams({
    q: query,
    fields: 'files(id,name)',
    supportsAllDrives: 'true',
    includeItemsFromAllDrives: 'true',
  });
  const existing = await googleDriveFetch<{ files?: Array<{ id?: string }> }>(`?${searchParams.toString()}`);
  const existingFolderId = existing.files?.[0]?.id;
  if (existingFolderId) return existingFolderId;

  const created = await googleDriveFetch<{ id?: string }>('', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: input.folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [input.parentFolderId],
    }),
  });
  if (!created.id) throw new Error('Google Drive did not return a folder id.');
  return created.id;
}

async function findExistingFile(folderId: string, fileName: string): Promise<string | null> {
  const query = [
    `name='${escapeDriveQueryValue(fileName)}'`,
    `'${escapeDriveQueryValue(folderId)}' in parents`,
    'trashed=false',
  ].join(' and ');
  const searchParams = new URLSearchParams({
    q: query,
    fields: 'files(id,name)',
    supportsAllDrives: 'true',
    includeItemsFromAllDrives: 'true',
  });
  const existing = await googleDriveFetch<{ files?: Array<{ id?: string }> }>(`?${searchParams.toString()}`);
  return existing.files?.[0]?.id ?? null;
}

function multipartBody(metadata: Record<string, unknown>, fileBuffer: Buffer, mimeType: string): { body: Buffer; contentType: string } {
  const boundary = `lucid_lab_${Date.now().toString(36)}_${Math.random().toString(36).slice(2)}`;
  const chunks = [
    Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify(metadata)}\r\n`),
    Buffer.from(`--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`),
    fileBuffer,
    Buffer.from(`\r\n--${boundary}--\r\n`),
  ];
  return { body: Buffer.concat(chunks), contentType: `multipart/related; boundary=${boundary}` };
}

export async function uploadPdfToGoogleDrive(input: {
  folderId: string;
  fileName: string;
  sourceUrl: string;
}): Promise<GoogleDriveUploadResult> {
  const pdfResponse = await fetch(input.sourceUrl);
  if (!pdfResponse.ok) throw new Error(`Could not download signed PDF: ${pdfResponse.status} ${pdfResponse.statusText}`);
  const fileBuffer = Buffer.from(await pdfResponse.arrayBuffer());
  const existingFileId = await findExistingFile(input.folderId, input.fileName);
  const metadata = existingFileId ? { name: input.fileName } : { name: input.fileName, parents: [input.folderId] };
  const multipart = multipartBody(metadata, fileBuffer, 'application/pdf');
  const uploadBody = new Blob([new Uint8Array(multipart.body)], { type: multipart.contentType });
  const uploadUrl = existingFileId
    ? `${googleDriveUploadUrl}/${encodeURIComponent(existingFileId)}?uploadType=multipart&supportsAllDrives=true`
    : `${googleDriveUploadUrl}?uploadType=multipart&supportsAllDrives=true`;
  const uploaded = await googleDriveFetch<{ id?: string }>(uploadUrl, {
    method: existingFileId ? 'PATCH' : 'POST',
    headers: { 'Content-Type': multipart.contentType },
    body: uploadBody,
  });
  const fileId = uploaded.id ?? existingFileId;
  if (!fileId) throw new Error('Google Drive did not return a file id.');
  return {
    fileId,
    fileName: input.fileName,
    folderId: input.folderId,
    url: buildGoogleDriveFileUrl(fileId) ?? '',
  };
}