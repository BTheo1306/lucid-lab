'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/auth';
import { extractClientIntake } from '@/lib/admin/agents/client-intake-agent';
import { createBonDeCommandeDraft, refreshDocuSealDocumentStatus, sendBonDeCommandeForSignature } from '@/lib/admin/documents/workflow';
import {
  createLucidClientContact,
  createLucidClientImport,
  createLucidClientInteraction,
  createLucidClientOpportunity,
  createLucidClientTask,
  deleteLucidClient,
  updateClientStatusAndLifecycle,
  syncLucidClientRecordToObsidian,
  upsertLucidClientIntake,
  type LucidClientImportSourceType,
  type LucidClientTaskPriority,
  type LucidClientTaskStatus,
  type LucidContactInfluenceLevel,
  type LucidContactStatus,
  type LucidClientIntakeStage,
  type LucidClientLifecycleStage,
  type LucidClientMeetingStatus,
  type LucidClientStatus,
  type LucidInteractionDirection,
  type LucidInteractionSentiment,
  type LucidInteractionSourceSystem,
  type LucidInteractionType,
  type LucidOfferType,
  type LucidOpportunityStage,
  type LucidOpportunityStatus,
} from '@/lib/admin/lucid-os';

const clientStatuses = new Set<LucidClientStatus>(['lead', 'active', 'paused', 'offboarded', 'archived']);
const lifecycleStages = new Set<LucidClientLifecycleStage>(['lead', 'qualified', 'meeting_booked', 'discovery_done', 'proposal_needed', 'proposal_sent', 'negotiation', 'won', 'lost', 'onboarding', 'in_delivery', 'live_managed', 'success_retention', 'expansion_opportunity', 'archived']);
const intakeStages = new Set<LucidClientIntakeStage>(['potential', 'meeting_booked', 'meeting_done', 'proposal_sent', 'won', 'lost']);
const meetingStatuses = new Set<LucidClientMeetingStatus>(['not_booked', 'booked', 'done', 'cancelled']);
const contactStatuses = new Set<LucidContactStatus>(['active', 'inactive', 'left_company', 'archived']);
const influenceLevels = new Set<LucidContactInfluenceLevel>(['unknown', 'low', 'medium', 'high', 'champion', 'blocker']);
const opportunityStages = new Set<LucidOpportunityStage>(['new', 'qualified', 'discovery', 'proposal_needed', 'proposal_sent', 'negotiation', 'won', 'lost', 'paused']);
const opportunityStatuses = new Set<LucidOpportunityStatus>(['open', 'won', 'lost', 'paused', 'archived']);
const offerTypes = new Set<LucidOfferType>(['managed_website', 'website_database', 'ai_automation', 'ai_agent', 'custom_app', 'retainer', 'audit', 'custom']);
const interactionTypes = new Set<LucidInteractionType>(['note', 'meeting', 'call', 'email', 'chat', 'form', 'import', 'support', 'delivery_update', 'decision']);
const interactionDirections = new Set<LucidInteractionDirection>(['inbound', 'outbound', 'internal']);
const interactionSentiments = new Set<LucidInteractionSentiment>(['positive', 'neutral', 'negative', 'risk']);
const interactionSourceSystems = new Set<LucidInteractionSourceSystem>(['admin', 'tidycal', 'email', 'website', 'chat', 'github', 'obsidian', 'integration', 'agent']);
const taskStatuses = new Set<LucidClientTaskStatus>(['todo', 'in_progress', 'waiting', 'done', 'cancelled']);
const taskPriorities = new Set<LucidClientTaskPriority>(['low', 'normal', 'high', 'urgent']);
const importSourceTypes = new Set<LucidClientImportSourceType>(['note', 'meeting_notes', 'email', 'doc', 'linkedin', 'website', 'chat', 'github', 'other']);

function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === 'string' ? value.trim() : '';
}

function optionalDateTime(formData: FormData, key: string): string | null {
  const value = formString(formData, key);
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function optionalNumber(formData: FormData, key: string): number | null {
  const value = formString(formData, key);
  if (!value) return null;
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function optionalId(formData: FormData, key: string): string | null {
  const value = formString(formData, key);
  return value.length > 0 ? value : null;
}

function firstText(...values: Array<string | null | undefined>): string {
  return values.find((value): value is string => typeof value === 'string' && value.trim().length > 0)?.trim() ?? '';
}

function requireClientActionContext(formData: FormData): { clientId: string; clientSlug: string } {
  const clientId = formString(formData, 'client_id');
  const clientSlug = formString(formData, 'client_slug');
  if (!clientId || !clientSlug) throw new Error('Client context is missing. Refresh the page and try again.');
  return { clientId, clientSlug };
}

function revalidateClientWorkspace(clientSlug: string): void {
  revalidatePath('/admin/lucid-os');
  revalidatePath('/admin/lucid-os/clients');
  revalidatePath(`/admin/lucid-os/clients/${clientSlug}`);
}

function clientDocumentsHref(clientSlug: string, params?: Record<string, string>): string {
  const searchParams = new URLSearchParams(params);
  const query = searchParams.toString();
  return `/admin/lucid-os/clients/${clientSlug}${query ? `?${query}` : ''}#documents`;
}

function actionErrorMessage(error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  return (message || 'Unknown error').slice(0, 500);
}

export async function recordClientIntakeAction(formData: FormData): Promise<void> {
  await requireAdmin();

  const firstName = formString(formData, 'first_name');
  const lastName = formString(formData, 'last_name');
  const submittedName = firstText(
    formString(formData, 'name'),
    [firstName, lastName].filter(Boolean).join(' '),
  );
  const toolsRaw = formString(formData, 'tools_input');
  const tools = toolsRaw ? toolsRaw.split(',').map((t) => t.trim()).filter(Boolean) : [];
  const primaryContactName = formString(formData, 'primary_contact_name');
  const primaryContactEmail = formString(formData, 'primary_contact_email');
  const primaryContactPhone = formString(formData, 'primary_contact_phone');
  const rawContext = formString(formData, 'raw_context');
  const parsedContext = rawContext ? await extractClientIntake(rawContext) : null;
  const resolvedContactName = firstText(primaryContactName, parsedContext?.primaryContactName);
  const resolvedContactEmail = firstText(primaryContactEmail, parsedContext?.primaryContactEmail);
  const resolvedContactPhone = firstText(primaryContactPhone, parsedContext?.primaryContactPhone);
  const name = firstText(submittedName, parsedContext?.name, resolvedContactName, resolvedContactEmail, resolvedContactPhone);
  const statusRaw = formString(formData, 'status') as LucidClientStatus;
  const intakeStageRaw = formString(formData, 'intake_stage') as LucidClientIntakeStage;
  const meetingStatusRaw = formString(formData, 'meeting_status') as LucidClientMeetingStatus;
  const selectedIntakeStage = intakeStages.has(intakeStageRaw) ? intakeStageRaw : 'potential';
  const selectedMeetingStatus = meetingStatuses.has(meetingStatusRaw) ? meetingStatusRaw : 'not_booked';
  const desiredOutcome = firstText(formString(formData, 'desired_outcome'), parsedContext?.desiredOutcome);
  const meetingNotes = firstText(formString(formData, 'meeting_notes'), parsedContext?.meetingNotes);

  if (!name) throw new Error('Add a company, client/person name, email, phone, or pasted note so Lucid OS can identify the client.');

  const result = await upsertLucidClientIntake({
    name,
    firstName: firstName || null,
    lastName: lastName || null,
    slug: formString(formData, 'slug') || null,
    status: clientStatuses.has(statusRaw) ? statusRaw : 'lead',
    industry: firstText(formString(formData, 'industry'), parsedContext?.industry) || null,
    websiteUrl: firstText(formString(formData, 'website_url'), parsedContext?.websiteUrl) || null,
    primaryContactName: resolvedContactName || null,
    primaryContactEmail: resolvedContactEmail || null,
    primaryContactPhone: resolvedContactPhone || null,
    notes: firstText(formString(formData, 'notes'), desiredOutcome, meetingNotes) || null,
    tools: tools.length > 0 ? tools : undefined,
    intakeStage: selectedIntakeStage !== 'potential' ? selectedIntakeStage : parsedContext?.intakeStage ?? 'potential',
    meetingStatus: selectedMeetingStatus !== 'not_booked' ? selectedMeetingStatus : parsedContext?.meetingStatus ?? 'not_booked',
    meetingBookedAt: optionalDateTime(formData, 'meeting_booked_at'),
    meetingDoneAt: optionalDateTime(formData, 'meeting_done_at'),
    meetingNotes: meetingNotes || null,
    desiredOutcome: desiredOutcome || null,
    budgetRange: firstText(formString(formData, 'budget_range'), parsedContext?.budgetRange) || null,
    timeline: firstText(formString(formData, 'timeline'), parsedContext?.timeline) || null,
    nextStep: firstText(formString(formData, 'next_step'), parsedContext?.nextStep) || null,
    source: firstText(formString(formData, 'source'), parsedContext?.source) || null,
    rawContext: rawContext || null,
    indexAsKnowledge: formData.get('index_as_knowledge') === 'on',
    extractionTrace: parsedContext?.trace ?? null,
  });

  revalidatePath('/admin/lucid-os');
  revalidatePath('/admin/lucid-os/clients');
  revalidatePath(`/admin/lucid-os/clients/${result.slug}`);
  revalidatePath('/admin/lucid-os/knowledge');
  redirect(`/admin/lucid-os/clients/${result.slug}`);
}

export async function updateClientStatusAndLifecycleAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const { clientId, clientSlug } = requireClientActionContext(formData);
  const statusRaw = formString(formData, 'status') as LucidClientStatus;
  const lifecycleStageRaw = formString(formData, 'lifecycle_stage') as LucidClientLifecycleStage;
  const status = clientStatuses.has(statusRaw) ? statusRaw : undefined;
  const lifecycleStage = lifecycleStages.has(lifecycleStageRaw) ? lifecycleStageRaw : undefined;

  if (status || lifecycleStage) {
    await updateClientStatusAndLifecycle(clientId, status, lifecycleStage);
  }

  revalidatePath('/admin/lucid-os/clients');
  revalidatePath(`/admin/lucid-os/clients/${clientSlug}`);
  redirect(`/admin/lucid-os/clients/${clientSlug}`);
}

export async function deleteClientAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const { clientId, clientSlug } = requireClientActionContext(formData);

  await deleteLucidClient(clientId);

  revalidatePath('/admin/lucid-os');
  revalidatePath('/admin/lucid-os/clients');
  revalidatePath(`/admin/lucid-os/clients/${clientSlug}`);
  revalidatePath('/admin/lucid-os/knowledge');
  redirect('/admin/lucid-os/clients');
}

export async function syncClientObsidianAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const { clientSlug } = requireClientActionContext(formData);

  await syncLucidClientRecordToObsidian(clientSlug, 'intake');

  revalidateClientWorkspace(clientSlug);
  revalidatePath('/admin/lucid-os/knowledge');
  redirect(`/admin/lucid-os/clients/${clientSlug}`);
}

export async function recordClientContactAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const { clientId, clientSlug } = requireClientActionContext(formData);
  const fullName = formString(formData, 'full_name');
  if (!fullName) throw new Error('Contact name is required.');
  const influenceRaw = formString(formData, 'influence_level') as LucidContactInfluenceLevel;
  const statusRaw = formString(formData, 'contact_status') as LucidContactStatus;

  await createLucidClientContact({
    clientId,
    fullName,
    role: formString(formData, 'role') || null,
    email: formString(formData, 'email') || null,
    phone: formString(formData, 'phone') || null,
    linkedinUrl: formString(formData, 'linkedin_url') || null,
    isPrimary: formData.get('is_primary') === 'on',
    isDecisionMaker: formData.get('is_decision_maker') === 'on',
    influenceLevel: influenceLevels.has(influenceRaw) ? influenceRaw : 'unknown',
    status: contactStatuses.has(statusRaw) ? statusRaw : 'active',
    notes: formString(formData, 'notes') || null,
  });

  revalidateClientWorkspace(clientSlug);
  redirect(`/admin/lucid-os/clients/${clientSlug}#contacts`);
}

export async function recordClientOpportunityAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const { clientId, clientSlug } = requireClientActionContext(formData);
  const title = formString(formData, 'title');
  if (!title) throw new Error('Opportunity title is required.');
  const stageRaw = formString(formData, 'stage') as LucidOpportunityStage;
  const statusRaw = formString(formData, 'opportunity_status') as LucidOpportunityStatus;
  const offerTypeRaw = formString(formData, 'offer_type') as LucidOfferType;

  await createLucidClientOpportunity({
    clientId,
    title,
    primaryContactId: optionalId(formData, 'primary_contact_id'),
    stage: opportunityStages.has(stageRaw) ? stageRaw : 'discovery',
    status: opportunityStatuses.has(statusRaw) ? statusRaw : 'open',
    offerType: offerTypes.has(offerTypeRaw) ? offerTypeRaw : 'custom',
    valueEstimateEur: optionalNumber(formData, 'value_estimate_eur'),
    setupValueEur: optionalNumber(formData, 'setup_value_eur'),
    monthlyValueEur: optionalNumber(formData, 'monthly_value_eur'),
    probabilityPercent: optionalNumber(formData, 'probability_percent') ?? 20,
    source: formString(formData, 'source') || null,
    expectedCloseAt: optionalDateTime(formData, 'expected_close_at'),
    nextStep: formString(formData, 'next_step') || null,
    nextStepDueAt: optionalDateTime(formData, 'next_step_due_at'),
    notes: formString(formData, 'notes') || null,
  });

  revalidateClientWorkspace(clientSlug);
  redirect(`/admin/lucid-os/clients/${clientSlug}#opportunities`);
}

export async function createBonDeCommandeDraftAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const { clientId, clientSlug } = requireClientActionContext(formData);

  await createBonDeCommandeDraft({
    clientId,
    opportunityId: optionalId(formData, 'opportunity_id'),
    contactId: optionalId(formData, 'contact_id'),
    googleDriveFolderId: formString(formData, 'google_drive_folder_id') || null,
    scopePerimeter: formString(formData, 'scope_perimeter') || null,
    syntheticDescription: formString(formData, 'synthetic_description') || null,
    deliverables: formString(formData, 'deliverables') || null,
    notes: formString(formData, 'document_notes') || null,
  });

  revalidateClientWorkspace(clientSlug);
  redirect(`/admin/lucid-os/clients/${clientSlug}#documents`);
}

export async function sendBonDeCommandeForSignatureAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const { clientSlug } = requireClientActionContext(formData);
  const documentId = formString(formData, 'document_id');
  if (!documentId) throw new Error('Document id is required.');

  try {
    await sendBonDeCommandeForSignature(documentId);
  } catch (error) {
    const message = actionErrorMessage(error);
    console.error('[send-bdc-action]', message, error);
    revalidateClientWorkspace(clientSlug);
    redirect(clientDocumentsHref(clientSlug, { document_error: message }));
  }

  revalidateClientWorkspace(clientSlug);
  redirect(clientDocumentsHref(clientSlug));
}

export async function refreshDocuSealDocumentStatusAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const { clientSlug } = requireClientActionContext(formData);
  const documentId = formString(formData, 'document_id');
  if (!documentId) throw new Error('Document id is required.');

  await refreshDocuSealDocumentStatus(documentId);

  revalidateClientWorkspace(clientSlug);
  redirect(`/admin/lucid-os/clients/${clientSlug}#documents`);
}

export async function recordClientInteractionAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const { clientId, clientSlug } = requireClientActionContext(formData);
  const summary = formString(formData, 'summary');
  if (!summary) throw new Error('Interaction summary is required.');
  const typeRaw = formString(formData, 'interaction_type') as LucidInteractionType;
  const directionRaw = formString(formData, 'direction') as LucidInteractionDirection;
  const sentimentRaw = formString(formData, 'sentiment') as LucidInteractionSentiment;
  const sourceSystemRaw = formString(formData, 'source_system') as LucidInteractionSourceSystem;

  await createLucidClientInteraction({
    clientId,
    contactId: optionalId(formData, 'contact_id'),
    opportunityId: optionalId(formData, 'opportunity_id'),
    interactionType: interactionTypes.has(typeRaw) ? typeRaw : 'note',
    direction: interactionDirections.has(directionRaw) ? directionRaw : 'internal',
    summary,
    notes: formString(formData, 'notes') || null,
    occurredAt: optionalDateTime(formData, 'occurred_at'),
    nextStep: formString(formData, 'next_step') || null,
    nextStepDueAt: optionalDateTime(formData, 'next_step_due_at'),
    sentiment: interactionSentiments.has(sentimentRaw) ? sentimentRaw : 'neutral',
    sourceSystem: interactionSourceSystems.has(sourceSystemRaw) ? sourceSystemRaw : 'admin',
    sourceUri: formString(formData, 'source_uri') || null,
  });

  revalidateClientWorkspace(clientSlug);
  redirect(`/admin/lucid-os/clients/${clientSlug}#timeline`);
}

export async function recordClientTaskAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const { clientId, clientSlug } = requireClientActionContext(formData);
  const title = formString(formData, 'title');
  if (!title) throw new Error('Task title is required.');
  const statusRaw = formString(formData, 'task_status') as LucidClientTaskStatus;
  const priorityRaw = formString(formData, 'priority') as LucidClientTaskPriority;

  await createLucidClientTask({
    clientId,
    contactId: optionalId(formData, 'contact_id'),
    opportunityId: optionalId(formData, 'opportunity_id'),
    title,
    description: formString(formData, 'description') || null,
    status: taskStatuses.has(statusRaw) ? statusRaw : 'todo',
    priority: taskPriorities.has(priorityRaw) ? priorityRaw : 'normal',
    ownerLabel: formString(formData, 'owner_label') || null,
    dueAt: optionalDateTime(formData, 'due_at'),
    createdBy: 'admin',
  });

  revalidateClientWorkspace(clientSlug);
  redirect(`/admin/lucid-os/clients/${clientSlug}#tasks`);
}

export async function recordClientImportAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const { clientId, clientSlug } = requireClientActionContext(formData);
  const title = formString(formData, 'title');
  const rawContent = formString(formData, 'raw_content');
  if (!title || !rawContent) throw new Error('Import title and raw content are required.');
  const sourceTypeRaw = formString(formData, 'source_type') as LucidClientImportSourceType;
  const parsedContext = await extractClientIntake(rawContent);

  await createLucidClientImport({
    clientId,
    title,
    sourceType: importSourceTypes.has(sourceTypeRaw) ? sourceTypeRaw : 'note',
    sourceUri: formString(formData, 'source_uri') || null,
    rawContent,
    extractedSummary: firstText(parsedContext.desiredOutcome, parsedContext.meetingNotes, rawContent.slice(0, 500)) || null,
    status: parsedContext.trace.error ? 'needs_review' : 'processed',
    indexAsKnowledge: formData.get('index_as_knowledge') === 'on',
  });

  revalidateClientWorkspace(clientSlug);
  revalidatePath('/admin/lucid-os/knowledge');
  redirect(`/admin/lucid-os/clients/${clientSlug}#imports`);
}
