import 'server-only';

import { supabase } from '@/lib/bot/db/supabase';
import type { Contact } from '@/lib/bot/db/queries/contacts';
import type { Conversation } from '@/lib/bot/db/queries/conversations';
import type { Lead } from '@/lib/bot/db/queries/leads';

export type LeadStatus = Lead['status'];
export type ConversationStatus = Conversation['status'];

export interface AdminContactSummary {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  company: string | null;
  source: string;
  language: string;
  marketingConsent: boolean;
  createdAt: string;
}

export interface AdminLeadSummary {
  id: string;
  contactId: string;
  status: LeadStatus;
  projectBrief: string | null;
  notes: string | null;
  followUpAt: string | null;
  followupStep: number;
  marketingConsent: boolean;
  createdAt: string;
  updatedAt: string;
  urgency: string | null;
  budgetRange: string | null;
  services: string[];
  contact: AdminContactSummary | null;
}

export interface AdminMessageSummary {
  id: string;
  direction: 'inbound' | 'outbound_bot';
  contentType: string;
  text: string;
  tokens: number | null;
  model: string | null;
  createdAt: string;
}

export interface AdminConversationSummary {
  id: string;
  contactId: string;
  status: ConversationStatus;
  escalationReason: string | null;
  startedAt: string;
  lastMessageAt: string;
  escalatedAt: string | null;
  closedAt: string | null;
  contact: AdminContactSummary | null;
  messages?: AdminMessageSummary[];
}

export interface AdminBookingSummary {
  id: string;
  contactId: string | null;
  conversationId: string | null;
  tidycalBookingId: number | null;
  startsAt: string;
  name: string;
  email: string;
  timezone: string;
  status: string;
  createdAt: string;
  contact: AdminContactSummary | null;
}

export interface AdminBudgetDay {
  date: string;
  spentEur: number;
  tokensUsed: number;
  requestsCount: number;
}

export interface AdminAuditEvent {
  id: string;
  contactId: string | null;
  eventType: string;
  details: Record<string, unknown>;
  ipHash: string | null;
  createdAt: string;
}

export interface AdminDashboardData {
  stats: {
    leadsTotal: number;
    leadsNew: number;
    leadsContacted: number;
    leadsQualified: number;
    leadsConverted: number;
    leadsLost: number;
    contactsLast24h: number;
    activeConversations: number;
    escalatedConversations: number;
    messagesLast7d: number;
    upcomingBookings: number;
    todayAiSpendEur: number;
    todayAiRequests: number;
  };
  recentLeads: AdminLeadSummary[];
  recentConversations: AdminConversationSummary[];
  upcomingBookings: AdminBookingSummary[];
  budgetHistory: AdminBudgetDay[];
  auditEvents: AdminAuditEvent[];
}

export interface AdminContactDetail {
  contact: AdminContactSummary;
  leads: AdminLeadSummary[];
  conversations: AdminConversationSummary[];
  bookings: AdminBookingSummary[];
}

export interface AdminLeadsPageData {
  leads: AdminLeadSummary[];
}

export interface AdminConversationsPageData {
  conversations: AdminConversationSummary[];
}

export interface AdminBookingsPageData {
  bookings: AdminBookingSummary[];
}

type CountResult = {
  count: number | null;
  error: Error | null;
};

function daysAgo(days: number): Date {
  return new Date(Date.now() - days * 24 * 60 * 60 * 1000);
}

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (Array.isArray(value)) return asRecord(value[0]);
  if (!value || typeof value !== 'object') return null;
  return value as Record<string, unknown>;
}

function asString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function asNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') return Number(value) || 0;
  return 0;
}

function normalizeServices(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((item): item is string => typeof item === 'string');
  if (typeof value === 'string' && value.trim()) return [value];
  return [];
}

async function countRows(query: PromiseLike<CountResult>): Promise<number> {
  const { count, error } = await query;
  if (error) throw error;
  return count ?? 0;
}

async function selectRows<T>(query: PromiseLike<{ data: T[] | null; error: Error | null }>): Promise<T[]> {
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

async function selectMaybe<T>(query: PromiseLike<{ data: T | null; error: Error | null }>): Promise<T | null> {
  const { data, error } = await query;
  if (error) throw error;
  return data ?? null;
}

function normalizeContact(value: unknown): AdminContactSummary | null {
  const record = asRecord(value);
  if (!record) return null;

  return {
    id: String(record.id ?? ''),
    email: asString(record.email),
    firstName: asString(record.first_name),
    lastName: asString(record.last_name),
    company: asString(record.company),
    source: asString(record.source) ?? 'chat_widget',
    language: asString(record.language) ?? 'fr',
    marketingConsent: Boolean(record.marketing_consent),
    createdAt: String(record.created_at ?? ''),
  };
}

function normalizeLead(value: unknown): AdminLeadSummary {
  const record = asRecord(value) ?? {};
  const interest = asRecord(record.interest);

  return {
    id: String(record.id ?? ''),
    contactId: String(record.contact_id ?? ''),
    status: (asString(record.status) ?? 'new') as LeadStatus,
    projectBrief: asString(record.project_brief),
    notes: asString(record.notes),
    followUpAt: asString(record.follow_up_at),
    followupStep: asNumber(record.followup_step),
    marketingConsent: Boolean(record.marketing_consent),
    createdAt: String(record.created_at ?? ''),
    updatedAt: String(record.updated_at ?? ''),
    urgency: asString(interest?.urgency),
    budgetRange: asString(interest?.budget_range),
    services: normalizeServices(interest?.services),
    contact: normalizeContact(record.contact),
  };
}

function normalizeConversation(value: unknown): AdminConversationSummary {
  const record = asRecord(value) ?? {};

  return {
    id: String(record.id ?? ''),
    contactId: String(record.contact_id ?? ''),
    status: (asString(record.status) ?? 'active') as ConversationStatus,
    escalationReason: asString(record.escalation_reason),
    startedAt: String(record.started_at ?? ''),
    lastMessageAt: String(record.last_message_at ?? ''),
    escalatedAt: asString(record.escalated_at),
    closedAt: asString(record.closed_at),
    contact: normalizeContact(record.contact),
  };
}

function normalizeMessage(value: unknown): AdminMessageSummary {
  const record = asRecord(value) ?? {};
  const content = asRecord(record.content);
  const metadata = asRecord(record.ai_metadata);

  return {
    id: String(record.id ?? ''),
    direction: (asString(record.direction) ?? 'inbound') as AdminMessageSummary['direction'],
    contentType: asString(record.content_type) ?? 'text',
    text: asString(content?.text) ?? JSON.stringify(content ?? {}),
    tokens: metadata?.tokens === undefined ? null : asNumber(metadata.tokens),
    model: asString(metadata?.model),
    createdAt: String(record.created_at ?? ''),
  };
}

function normalizeBooking(value: unknown): AdminBookingSummary {
  const record = asRecord(value) ?? {};

  return {
    id: String(record.id ?? ''),
    contactId: asString(record.contact_id),
    conversationId: asString(record.conversation_id),
    tidycalBookingId: record.tidycal_booking_id === null ? null : asNumber(record.tidycal_booking_id),
    startsAt: String(record.starts_at ?? ''),
    name: asString(record.name) ?? 'Unknown',
    email: asString(record.email) ?? 'unknown',
    timezone: asString(record.timezone) ?? 'Europe/Paris',
    status: asString(record.status) ?? 'confirmed',
    createdAt: String(record.created_at ?? ''),
    contact: normalizeContact(record.contact),
  };
}

function normalizeBudgetDay(value: unknown): AdminBudgetDay {
  const record = asRecord(value) ?? {};

  return {
    date: String(record.date ?? ''),
    spentEur: asNumber(record.spent_eur),
    tokensUsed: asNumber(record.tokens_used),
    requestsCount: asNumber(record.requests_count),
  };
}

function normalizeAuditEvent(value: unknown): AdminAuditEvent {
  const record = asRecord(value) ?? {};

  return {
    id: String(record.id ?? ''),
    contactId: asString(record.contact_id),
    eventType: asString(record.event_type) ?? 'unknown',
    details: asRecord(record.details) ?? {},
    ipHash: asString(record.ip_hash),
    createdAt: String(record.created_at ?? ''),
  };
}

export async function getAdminDashboardData(): Promise<AdminDashboardData> {
  const now = new Date().toISOString();
  const since24h = daysAgo(1).toISOString();
  const since7d = daysAgo(7).toISOString();
  const budgetStart = daysAgo(13).toISOString().slice(0, 10);

  const [
    leadsTotal,
    leadsNew,
    leadsContacted,
    leadsQualified,
    leadsConverted,
    leadsLost,
    contactsLast24h,
    activeConversations,
    escalatedConversations,
    messagesLast7d,
    upcomingBookingsCount,
    budgetTodayRows,
    recentLeadRows,
    recentConversationRows,
    upcomingBookingRows,
    budgetRows,
    auditRows,
  ] = await Promise.all([
    countRows(supabase.from('leads').select('*', { count: 'exact', head: true })),
    countRows(supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'new')),
    countRows(supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'contacted')),
    countRows(supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'qualified')),
    countRows(supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'converted')),
    countRows(supabase.from('leads').select('*', { count: 'exact', head: true }).eq('status', 'lost')),
    countRows(supabase.from('contacts').select('*', { count: 'exact', head: true }).gte('created_at', since24h)),
    countRows(supabase.from('conversations').select('*', { count: 'exact', head: true }).eq('status', 'active')),
    countRows(supabase.from('conversations').select('*', { count: 'exact', head: true }).eq('status', 'escalated')),
    countRows(supabase.from('messages').select('*', { count: 'exact', head: true }).gte('created_at', since7d)),
    countRows(supabase.from('tidycal_bookings').select('*', { count: 'exact', head: true }).gte('starts_at', now).eq('status', 'confirmed')),
    selectRows<unknown>(supabase.from('daily_ai_budget').select('date, spent_eur, tokens_used, requests_count').eq('date', todayKey()).limit(1)),
    selectRows<unknown>(supabase
      .from('leads')
      .select('id, contact_id, status, project_brief, interest, notes, follow_up_at, followup_step, marketing_consent, created_at, updated_at, contact:contacts(id, email, first_name, last_name, company, source, language, marketing_consent, created_at)')
      .order('created_at', { ascending: false })
      .limit(12)),
    selectRows<unknown>(supabase
      .from('conversations')
      .select('id, contact_id, status, escalation_reason, started_at, last_message_at, escalated_at, closed_at, contact:contacts(id, email, first_name, last_name, company, source, language, marketing_consent, created_at), messages!inner(direction)')
      .eq('messages.direction', 'inbound')
      .order('last_message_at', { ascending: false })
      .limit(10)),
    selectRows<unknown>(supabase
      .from('tidycal_bookings')
      .select('id, contact_id, conversation_id, tidycal_booking_id, starts_at, name, email, timezone, status, created_at, contact:contacts(id, email, first_name, last_name, company, source, language, marketing_consent, created_at)')
      .gte('starts_at', now)
      .eq('status', 'confirmed')
      .order('starts_at', { ascending: true })
      .limit(8)),
    selectRows<unknown>(supabase
      .from('daily_ai_budget')
      .select('date, spent_eur, tokens_used, requests_count')
      .gte('date', budgetStart)
      .order('date', { ascending: true })),
    selectRows<unknown>(supabase
      .from('security_audit_log')
      .select('id, contact_id, event_type, details, ip_hash, created_at')
      .order('created_at', { ascending: false })
      .limit(8)),
  ]);

  const todayBudget = budgetTodayRows.map(normalizeBudgetDay)[0];

  return {
    stats: {
      leadsTotal,
      leadsNew,
      leadsContacted,
      leadsQualified,
      leadsConverted,
      leadsLost,
      contactsLast24h,
      activeConversations,
      escalatedConversations,
      messagesLast7d,
      upcomingBookings: upcomingBookingsCount,
      todayAiSpendEur: todayBudget?.spentEur ?? 0,
      todayAiRequests: todayBudget?.requestsCount ?? 0,
    },
    recentLeads: recentLeadRows.map(normalizeLead),
    recentConversations: recentConversationRows.map(normalizeConversation),
    upcomingBookings: upcomingBookingRows.map(normalizeBooking),
    budgetHistory: budgetRows.map(normalizeBudgetDay),
    auditEvents: auditRows.map(normalizeAuditEvent),
  };
}

export async function getAdminContactDetail(contactId: string): Promise<AdminContactDetail | null> {
  const [contactRow, leadRows, conversationRows, bookingRows] = await Promise.all([
    selectMaybe<unknown>(supabase
      .from('contacts')
      .select('id, email, first_name, last_name, company, source, language, marketing_consent, created_at')
      .eq('id', contactId)
      .maybeSingle()),
    selectRows<unknown>(supabase
      .from('leads')
      .select('id, contact_id, status, project_brief, interest, notes, follow_up_at, followup_step, marketing_consent, created_at, updated_at')
      .eq('contact_id', contactId)
      .order('created_at', { ascending: false })),
    selectRows<unknown>(supabase
      .from('conversations')
      .select('id, contact_id, status, escalation_reason, started_at, last_message_at, escalated_at, closed_at')
      .eq('contact_id', contactId)
      .order('last_message_at', { ascending: false })),
    selectRows<unknown>(supabase
      .from('tidycal_bookings')
      .select('id, contact_id, conversation_id, tidycal_booking_id, starts_at, name, email, timezone, status, created_at')
      .eq('contact_id', contactId)
      .order('starts_at', { ascending: false })),
  ]);

  const contact = normalizeContact(contactRow);
  if (!contact) return null;

  const conversations = await Promise.all(conversationRows.map(async (conversationRow) => {
    const conversation = normalizeConversation(conversationRow);
    const messageRows = await selectRows<unknown>(supabase
      .from('messages')
      .select('id, direction, content_type, content, ai_metadata, created_at')
      .eq('conversation_id', conversation.id)
      .order('created_at', { ascending: true })
      .limit(120));

    return {
      ...conversation,
      contact,
      messages: messageRows.map(normalizeMessage),
    };
  }));

  return {
    contact,
    leads: leadRows.map((leadRow) => ({ ...normalizeLead(leadRow), contact })),
    conversations,
    bookings: bookingRows.map((bookingRow) => ({ ...normalizeBooking(bookingRow), contact })),
  };
}

export async function getAdminLeadsPageData(): Promise<AdminLeadsPageData> {
  const rows = await selectRows<unknown>(supabase
    .from('leads')
    .select('id, contact_id, status, project_brief, interest, notes, follow_up_at, followup_step, marketing_consent, created_at, updated_at, contact:contacts(id, email, first_name, last_name, company, source, language, marketing_consent, created_at)')
    .order('created_at', { ascending: false })
    .limit(100));

  return { leads: rows.map(normalizeLead) };
}

export async function getAdminConversationsPageData(): Promise<AdminConversationsPageData> {
  const rows = await selectRows<unknown>(supabase
    .from('conversations')
    .select('id, contact_id, status, escalation_reason, started_at, last_message_at, escalated_at, closed_at, contact:contacts(id, email, first_name, last_name, company, source, language, marketing_consent, created_at), messages!inner(direction)')
    .eq('messages.direction', 'inbound')
    .order('last_message_at', { ascending: false })
    .limit(100));

  return { conversations: rows.map(normalizeConversation) };
}

export async function getAdminBookingsPageData(): Promise<AdminBookingsPageData> {
  const rows = await selectRows<unknown>(supabase
    .from('tidycal_bookings')
    .select('id, contact_id, conversation_id, tidycal_booking_id, starts_at, name, email, timezone, status, created_at, contact:contacts(id, email, first_name, last_name, company, source, language, marketing_consent, created_at)')
    .order('starts_at', { ascending: false })
    .limit(100));

  return { bookings: rows.map(normalizeBooking) };
}

export type AdminContact = Contact;
