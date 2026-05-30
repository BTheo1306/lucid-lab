'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { requireAdmin } from '@/lib/admin/auth';
import { extractClientIntake } from '@/lib/admin/agents/client-intake-agent';
import { createBonDeCommandeDraft, createNdaDraft, refreshDocuSealDocumentStatus, sendBonDeCommandeForSignature, sendNdaForSignature } from '@/lib/admin/documents/workflow';
import {
  createLucidClientContact,
  createLucidClientImport,
  createLucidClientInteraction,
  createLucidClientOpportunity,
  createLucidClientTask,
  deleteLucidClient,
  listLucidClientContactsForClient,
  listLucidClientTasksForClient,
  updateClientStatusAndLifecycle,
  updateLucidClientCompanyProfile,
  updateLucidClientTaskStatus,
  syncLucidClientRecordToObsidian,
  upsertLucidClientIntake,
  type LucidClientImportSourceType,
  type LucidClientTaskPriority,
  type LucidClientTaskStatus,
  type LucidContactInfluenceLevel,
  type LucidContactStatus,
  type LucidClientIntakeStage,
  type LucidClientHealthStatus,
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
const clientHealthStatuses = new Set<LucidClientHealthStatus>(['unknown', 'healthy', 'watch', 'risk', 'critical']);
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
const pricingModels = new Set(['one_shot', 'monthly']);

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

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : null;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value.trim() : null;
}

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

function registrationNumberFromText(value: string): string | null {
  const matches = value.match(/\d[\d\s.-]{7,}\d/g) ?? [];

  for (const match of matches) {
    const digits = digitsOnly(match);
    if (digits.length === 14) return digits;
    if (digits.length === 9) return digits;
  }

  return null;
}

function compactAddress(parts: Array<string | null | undefined>): string | null {
  const value = parts.map((part) => part?.trim()).filter(Boolean).join(' ');
  return value.length > 0 ? value : null;
}

function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function taskTitleMatchesLine(title: string, line: string): boolean {
  const normalizedTitle = normalizeSearchText(title);
  const normalizedLine = normalizeSearchText(line);
  if (!normalizedTitle || !normalizedLine) return false;
  if (normalizedLine.includes(normalizedTitle)) return true;

  const tokens = normalizedTitle.split(' ').filter((token) => token.length >= 4);
  if (tokens.length === 0) return false;
  return tokens.every((token) => normalizedLine.includes(token));
}

function taskStatusHint(line: string): LucidClientTaskStatus | null {
  const normalizedLine = normalizeSearchText(line);
  if (/\b(fait|faite|fini|finie|termine|terminee|done|complete|completed|valide|validee)\b/.test(normalizedLine)) return 'done';
  if (/\b(en cours|started|wip|travaille|bloque|attente)\b/.test(normalizedLine)) return 'in_progress';
  if (/\b(a faire|todo|a realiser|a lancer)\b/.test(normalizedLine)) return 'todo';
  return null;
}

async function applyTaskHintsFromNote(clientId: string, rawContent: string): Promise<void> {
  const lines = rawContent.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length === 0) return;

  const tasks = await listLucidClientTasksForClient(clientId, 100);
  for (const line of lines) {
    const status = taskStatusHint(line);
    if (!status) continue;

    const matchingTask = tasks.find((task) => task.status !== status && taskTitleMatchesLine(task.title, line));
    if (!matchingTask) continue;
    await updateLucidClientTaskStatus({ clientId, taskId: matchingTask.id, status });
  }
}

async function fetchFrenchCompanyProfile(registrationNumber: string): Promise<{
  legalName: string | null;
  siren: string | null;
  siret: string | null;
  billingAddress: string | null;
  nafCode: string | null;
  nafLabel: string | null;
  companyStatus: string | null;
  employeeRange: string | null;
}> {
  const digits = digitsOnly(registrationNumber);
  if (digits.length !== 9 && digits.length !== 14) {
    throw new Error('Ajoute un SIREN à 9 chiffres ou un SIRET à 14 chiffres.');
  }

  const response = await fetch(`https://recherche-entreprises.api.gouv.fr/search?q=${digits}&per_page=1`, {
    headers: { accept: 'application/json' },
    cache: 'no-store',
  });
  if (!response.ok) throw new Error(`Recherche entreprise impossible (${response.status}).`);

  const payload = asRecord(await response.json());
  const result = Array.isArray(payload?.results) ? asRecord(payload.results[0]) : null;
  if (!result) throw new Error('Aucune entreprise trouvée pour ce numéro.');

  const siege = asRecord(result.siege) ?? {};
  const fallbackAddress = compactAddress([
    asString(siege.numero_voie),
    asString(siege.type_voie),
    asString(siege.libelle_voie),
    asString(siege.code_postal),
    asString(siege.libelle_commune),
  ]);

  return {
    legalName: firstText(asString(result.nom_complet), asString(result.nom_raison_sociale), asString(result.denomination), asString(result.nom_commercial)) || null,
    siren: firstText(asString(result.siren), digits.length === 9 ? digits : digits.slice(0, 9)) || null,
    siret: firstText(asString(siege.siret), digits.length === 14 ? digits : null) || null,
    billingAddress: firstText(asString(siege.adresse), fallbackAddress) || null,
    nafCode: asString(result.activite_principale) ?? asString(siege.activite_principale),
    nafLabel: asString(result.section_activite_principale) ?? asString(result.libelle_activite_principale),
    companyStatus: asString(result.etat_administratif) ?? asString(siege.etat_administratif),
    employeeRange: asString(result.tranche_effectif_salarie) ?? asString(siege.tranche_effectif_salarie),
  };
}

async function updateClientCompanyProfileFromText(clientId: string, rawText: string): Promise<boolean> {
  const registrationNumber = registrationNumberFromText(rawText);
  if (!registrationNumber) return false;

  const profile = await fetchFrenchCompanyProfile(registrationNumber);
  await updateLucidClientCompanyProfile({
    clientId,
    ...profile,
    source: 'recherche-entreprises.api.gouv.fr',
    fetchedAt: new Date().toISOString(),
  });

  return true;
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

function clientActionErrorHref(clientSlug: string, anchor: string, error: unknown): string {
  const params = new URLSearchParams({ client_error: actionErrorMessage(error) });
  return `/admin/lucid-os/clients/${clientSlug}?${params.toString()}#${anchor}`;
}

function clientEditErrorHref(clientSlug: string | null, error: unknown): string {
  const params = new URLSearchParams({ client_error: actionErrorMessage(error) });
  return clientSlug
    ? `/admin/lucid-os/clients/${clientSlug}/edit?${params.toString()}`
    : `/admin/lucid-os/clients/new?${params.toString()}`;
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
  const submittedSlug = formString(formData, 'slug') || null;
  let parsedContext: Awaited<ReturnType<typeof extractClientIntake>> | null = null;

  try {
    parsedContext = rawContext ? await extractClientIntake(rawContext) : null;
  } catch (error) {
    redirect(clientEditErrorHref(submittedSlug, error));
  }
  const resolvedContactName = firstText(primaryContactName, parsedContext?.primaryContactName);
  const resolvedContactEmail = firstText(primaryContactEmail, parsedContext?.primaryContactEmail);
  const resolvedContactPhone = firstText(primaryContactPhone, parsedContext?.primaryContactPhone);
  const name = firstText(submittedName, parsedContext?.name, resolvedContactName, resolvedContactEmail, resolvedContactPhone);
  const statusRaw = formString(formData, 'status') as LucidClientStatus;
  const healthStatusRaw = formString(formData, 'client_health_status') as LucidClientHealthStatus;
  const lifecycleStageRaw = formString(formData, 'lifecycle_stage') as LucidClientLifecycleStage;
  const intakeStageRaw = formString(formData, 'intake_stage') as LucidClientIntakeStage;
  const meetingStatusRaw = formString(formData, 'meeting_status') as LucidClientMeetingStatus;
  const selectedLifecycleStage = lifecycleStages.has(lifecycleStageRaw) ? lifecycleStageRaw : undefined;
  const selectedIntakeStage = intakeStages.has(intakeStageRaw) ? intakeStageRaw : 'potential';
  const selectedMeetingStatus = meetingStatuses.has(meetingStatusRaw) ? meetingStatusRaw : 'not_booked';
  const desiredOutcome = firstText(formString(formData, 'desired_outcome'), parsedContext?.desiredOutcome);
  const meetingNotes = firstText(formString(formData, 'meeting_notes'), parsedContext?.meetingNotes);
  const healthScore = optionalNumber(formData, 'health_score');

  if (!name) redirect(clientEditErrorHref(submittedSlug, new Error('Ajoute un nom, un email, un téléphone ou une note à analyser pour identifier le client.')));

  let result: Awaited<ReturnType<typeof upsertLucidClientIntake>>;
  try {
    result = await upsertLucidClientIntake({
    name,
    firstName: firstName || null,
    lastName: lastName || null,
    slug: submittedSlug,
    status: clientStatuses.has(statusRaw) ? statusRaw : 'lead',
    lifecycleStage: selectedLifecycleStage ?? null,
    ownerLabel: formString(formData, 'owner_label') || null,
    healthStatus: clientHealthStatuses.has(healthStatusRaw) ? healthStatusRaw : 'unknown',
    healthScore,
    healthSummary: formString(formData, 'health_summary') || null,
    industry: firstText(formString(formData, 'industry'), parsedContext?.industry) || null,
    websiteUrl: firstText(formString(formData, 'website_url'), parsedContext?.websiteUrl) || null,
    legalName: formString(formData, 'legal_name') || null,
    siren: formString(formData, 'siren') || null,
    siret: formString(formData, 'siret') || null,
    billingAddress: formString(formData, 'billing_address') || null,
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
    nextActionDueAt: optionalDateTime(formData, 'next_action_due_at'),
    lastContactedAt: optionalDateTime(formData, 'last_contacted_at'),
    source: firstText(formString(formData, 'source'), parsedContext?.source) || null,
    rawContext: rawContext || null,
    indexAsKnowledge: formData.get('index_as_knowledge') === 'on',
    extractionTrace: parsedContext?.trace ?? null,
    });

    const companyLookupText = [formString(formData, 'siren'), formString(formData, 'siret'), rawContext].filter(Boolean).join('\n');
    if (companyLookupText) await updateClientCompanyProfileFromText(result.id, companyLookupText);
  } catch (error) {
    redirect(clientEditErrorHref(submittedSlug, error));
  }

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

export async function updateClientCompanyInfoAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const { clientId, clientSlug } = requireClientActionContext(formData);
  const registrationNumber = digitsOnly(formString(formData, 'registration_number'));

  try {
    await updateLucidClientCompanyProfile({
    clientId,
    legalName: formString(formData, 'legal_name') || null,
    siren: registrationNumber.length === 9 ? registrationNumber : formString(formData, 'siren') || null,
    siret: registrationNumber.length === 14 ? registrationNumber : formString(formData, 'siret') || null,
    billingAddress: formString(formData, 'billing_address') || null,
    industry: formString(formData, 'industry') || null,
    websiteUrl: formString(formData, 'website_url') || null,
    primaryContactName: formString(formData, 'primary_contact_name') || null,
    primaryContactEmail: formString(formData, 'primary_contact_email') || null,
    primaryContactPhone: formString(formData, 'primary_contact_phone') || null,
    source: 'admin',
    });
  } catch (error) {
    redirect(clientActionErrorHref(clientSlug, 'company', error));
  }

  revalidateClientWorkspace(clientSlug);
  redirect(`/admin/lucid-os/clients/${clientSlug}#company`);
}

export async function fetchClientCompanyInfoAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const { clientId, clientSlug } = requireClientActionContext(formData);
  let profile: Awaited<ReturnType<typeof fetchFrenchCompanyProfile>>;

  try {
    profile = await fetchFrenchCompanyProfile(formString(formData, 'registration_number'));
    await updateLucidClientCompanyProfile({
    clientId,
    ...profile,
    source: 'recherche-entreprises.api.gouv.fr',
    fetchedAt: new Date().toISOString(),
    });
  } catch (error) {
    redirect(clientActionErrorHref(clientSlug, 'company', error));
  }

  revalidateClientWorkspace(clientSlug);
  redirect(`/admin/lucid-os/clients/${clientSlug}#company`);
}

export async function recordClientSmartNoteAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const { clientId, clientSlug } = requireClientActionContext(formData);
  const rawContent = formString(formData, 'raw_content');
  if (!rawContent) redirect(clientActionErrorHref(clientSlug, 'notes', new Error('Ajoute une note à traiter.')));

  const title = firstText(formString(formData, 'title'), 'Note de call');
  const sourceTypeRaw = formString(formData, 'source_type') as LucidClientImportSourceType;

  try {
    const parsedContext = await extractClientIntake(rawContent);
    const summary = firstText(parsedContext.meetingNotes, parsedContext.desiredOutcome, rawContent.slice(0, 500));

    await createLucidClientImport({
    clientId,
    title,
    sourceType: importSourceTypes.has(sourceTypeRaw) ? sourceTypeRaw : 'meeting_notes',
    sourceUri: formString(formData, 'source_uri') || null,
    rawContent,
    extractedSummary: summary || null,
    status: parsedContext.trace.error ? 'needs_review' : 'processed',
    indexAsKnowledge: true,
    });

  const existingContacts = await listLucidClientContactsForClient(clientId, 100);
  const extractedContactEmail = parsedContext.primaryContactEmail?.toLowerCase() ?? null;
  const extractedContactName = parsedContext.primaryContactName?.toLowerCase() ?? null;
  const contactAlreadyExists = existingContacts.some((contact) => {
    const emailMatches = extractedContactEmail && contact.email?.toLowerCase() === extractedContactEmail;
    const nameMatches = extractedContactName && contact.fullName.toLowerCase() === extractedContactName;
    return Boolean(emailMatches || nameMatches);
  });

  if (!contactAlreadyExists && (parsedContext.primaryContactName || parsedContext.primaryContactEmail || parsedContext.primaryContactPhone)) {
    await createLucidClientContact({
      clientId,
      fullName: firstText(parsedContext.primaryContactName, parsedContext.primaryContactEmail, parsedContext.primaryContactPhone),
      email: parsedContext.primaryContactEmail,
      phone: parsedContext.primaryContactPhone,
      isPrimary: existingContacts.length === 0,
      status: 'active',
      notes: 'Ajouté automatiquement depuis une note IA.',
    });
  }

  if (parsedContext.nextStep) {
    await createLucidClientTask({
      clientId,
      title: parsedContext.nextStep,
      description: `Créé automatiquement depuis la note : ${title}`,
      status: 'todo',
      priority: 'normal',
      createdBy: 'agent',
    });
  }

    await updateClientCompanyProfileFromText(clientId, rawContent);
    await applyTaskHintsFromNote(clientId, rawContent);
  } catch (error) {
    redirect(clientActionErrorHref(clientSlug, 'notes', error));
  }

  revalidateClientWorkspace(clientSlug);
  revalidatePath('/admin/lucid-os/knowledge');
  redirect(`/admin/lucid-os/clients/${clientSlug}#notes`);
}

export async function updateClientTaskStatusAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const { clientId, clientSlug } = requireClientActionContext(formData);
  const taskId = formString(formData, 'task_id');
  const statusRaw = formString(formData, 'task_status') as LucidClientTaskStatus;
  if (!taskId) throw new Error('Task id is required.');
  if (!taskStatuses.has(statusRaw)) throw new Error('Task status is invalid.');

  await updateLucidClientTaskStatus({ clientId, taskId, status: statusRaw });
  revalidateClientWorkspace(clientSlug);
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
    calendarTimeline: formString(formData, 'calendar_timeline') || null,
    nextSteps: formString(formData, 'next_steps') || null,
    pricingModel: pricingModels.has(formString(formData, 'pricing_model')) ? formString(formData, 'pricing_model') as 'one_shot' | 'monthly' : null,
    clientLegalName: formString(formData, 'client_legal_name') || null,
    clientSiret: formString(formData, 'client_siret') || null,
    clientBillingAddress: formString(formData, 'client_billing_address') || null,
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

export async function createNdaDraftAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const { clientId, clientSlug } = requireClientActionContext(formData);

  await createNdaDraft({
    clientId,
    contactId: formString(formData, 'contact_id') || null,
    opportunityId: formString(formData, 'opportunity_id') || null,
    missionContext: formString(formData, 'mission_context') || null,
    ndaDuration: formString(formData, 'nda_duration') || null,
    signerName: formString(formData, 'signer_name') || null,
    signerEmail: formString(formData, 'signer_email') || null,
    notes: formString(formData, 'document_notes') || null,
  });

  revalidateClientWorkspace(clientSlug);
  redirect(`/admin/lucid-os/clients/${clientSlug}#documents`);
}

export async function sendNdaForSignatureAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const { clientSlug } = requireClientActionContext(formData);
  const documentId = formString(formData, 'document_id');
  if (!documentId) throw new Error('Document id is required.');

  try {
    await sendNdaForSignature(documentId);
  } catch (error) {
    const message = actionErrorMessage(error);
    console.error('[send-nda-action]', message, error);
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
  if (!title) redirect(clientActionErrorHref(clientSlug, 'tasks', new Error('Ajoute un titre de tâche.')));
  const statusRaw = formString(formData, 'task_status') as LucidClientTaskStatus;
  const priorityRaw = formString(formData, 'priority') as LucidClientTaskPriority;

  try {
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
  } catch (error) {
    redirect(clientActionErrorHref(clientSlug, 'tasks', error));
  }

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
