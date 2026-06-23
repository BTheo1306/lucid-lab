'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/auth';
import {
  createSocialPost,
  setSocialPostStatus,
  updateSocialPostContent,
  type SocialPostStatus,
} from '@/lib/admin/social';

const SOCIAL_PATH = '/admin/lucid-os/social';
const VIEWS = new Set(['a-valider', 'postes', 'brouillons']);

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function optionalText(formData: FormData, key: string): string | null {
  const value = formString(formData, key);
  return value.length > 0 ? value : null;
}

function optionalDateTime(formData: FormData, key: string): string | null {
  const value = formString(formData, key);
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function returnTo(formData: FormData): string {
  const view = formString(formData, 'vue');
  return VIEWS.has(view) ? `${SOCIAL_PATH}?vue=${view}` : SOCIAL_PATH;
}

function requirePostId(formData: FormData): string {
  const id = formString(formData, 'post_id');
  if (!id) throw new Error('Post id is missing. Refresh the page and try again.');
  return id;
}

async function transition(formData: FormData, status: SocialPostStatus, reviewNote?: string | null): Promise<void> {
  await requireAdmin();
  const id = requirePostId(formData);
  await setSocialPostStatus(id, status, reviewNote);
  revalidatePath(SOCIAL_PATH);
  redirect(returnTo(formData));
}

export async function approveSocialPostAction(formData: FormData): Promise<void> {
  await transition(formData, 'approved', null);
}

export async function rejectSocialPostAction(formData: FormData): Promise<void> {
  await transition(formData, 'rejected', optionalText(formData, 'review_note'));
}

export async function queueSocialPostAction(formData: FormData): Promise<void> {
  await transition(formData, 'queued', null);
}

export async function editSocialPostAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = requirePostId(formData);
  const body = formString(formData, 'body');
  if (!body) redirect(`${returnTo(formData)}`);

  await updateSocialPostContent(id, {
    hook: optionalText(formData, 'hook'),
    body,
    pillar: optionalText(formData, 'pillar'),
    linkInComment: optionalText(formData, 'link_in_comment'),
    scheduledFor: optionalDateTime(formData, 'scheduled_for'),
  });

  revalidatePath(SOCIAL_PATH);
  redirect(returnTo(formData));
}

export async function createSocialPostAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const body = formString(formData, 'body');
  if (!body) redirect(returnTo(formData));

  await createSocialPost({
    authorLabel: formString(formData, 'author_label') || 'Anthony Poirier',
    pillar: optionalText(formData, 'pillar'),
    hook: optionalText(formData, 'hook'),
    body,
    linkInComment: optionalText(formData, 'link_in_comment'),
    scheduledFor: optionalDateTime(formData, 'scheduled_for'),
    status: 'draft',
  });

  revalidatePath(SOCIAL_PATH);
  redirect(`${SOCIAL_PATH}?vue=brouillons`);
}
