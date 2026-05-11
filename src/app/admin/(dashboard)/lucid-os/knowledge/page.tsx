import { Brain, ExternalLink, FileText, Save, ShieldCheck } from 'lucide-react';
import { listLucidAuditEvents, listLucidKnowledgeDocuments, type LucidKnowledgeStatus } from '@/lib/admin/lucid-os';
import { EmptyState, formatAdminDateTime, LucidOsHeader, LucidOsTabs, Section, StatusBadge } from '../components';
import { recordKnowledgeDocumentAction } from './actions';

export const dynamic = 'force-dynamic';

function knowledgeTone(status: LucidKnowledgeStatus): 'neutral' | 'good' | 'warning' | 'danger' {
  switch (status) {
    case 'active': return 'good';
    case 'stale': return 'warning';
    case 'archived': return 'neutral';
    default: return 'warning';
  }
}

function sourceLabel(sourceSystem: string): string {
  switch (sourceSystem) {
    case 'obsidian': return 'Obsidian';
    case 'github': return 'GitHub';
    case 'supabase': return 'Supabase';
    case 'integration': return 'Integration';
    case 'web': return 'Web';
    default: return 'Admin';
  }
}

export default async function LucidOsKnowledgePage() {
  const [documents, auditEvents] = await Promise.all([
    listLucidKnowledgeDocuments(100),
    listLucidAuditEvents(20),
  ]);

  const knowledgeAuditEvents = auditEvents.filter((event) => event.eventType.includes('knowledge') || event.targetTable === 'knowledge_documents');

  return (
    <div className="grid gap-6">
      <LucidOsHeader
        eyebrow="Operational memory"
        title="Knowledge"
        description="Obsidian-backed company memory and Supabase records for agent retrieval."
        icon={Brain}
      />

      <LucidOsTabs active="knowledge" />

      <section className="rounded-xl border border-zinc-200 bg-white p-4 text-sm leading-6 text-zinc-600 shadow-sm">
        <div className="flex gap-2">
          <ShieldCheck className="mt-0.5 size-4 shrink-0 text-zinc-500" />
          <p>Significant work should update Obsidian when it changes human business knowledge and update Supabase knowledge records when agents need to retrieve it later.</p>
        </div>
      </section>

      <Section title="Knowledge documents" description="Source-linked summaries available to Lucid OS.">
        {documents.length === 0 ? (
          <EmptyState>No knowledge documents are indexed yet.</EmptyState>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {documents.map((document) => (
              <article key={document.id} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-zinc-950">{document.title}</p>
                      <StatusBadge tone={knowledgeTone(document.status)}>{document.status}</StatusBadge>
                    </div>
                    <p className="mt-1 text-sm text-zinc-500">{sourceLabel(document.sourceSystem)} · {document.visibility}</p>
                  </div>
                  <FileText className="size-5 shrink-0 text-zinc-400" />
                </div>
                {document.summary ? <p className="mt-3 line-clamp-3 text-sm leading-6 text-zinc-600">{document.summary}</p> : null}
                <div className="mt-4 flex flex-col gap-2 text-sm text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
                  <span>Fresh {formatAdminDateTime(document.freshnessAt ?? document.updatedAt)}</span>
                  {document.sourceUri ? (
                    <span className="inline-flex max-w-full items-center gap-1 truncate text-zinc-600">
                      <ExternalLink className="size-4 shrink-0" />
                      <span className="truncate">{document.sourceUri}</span>
                    </span>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        )}
      </Section>

      <Section title="Record knowledge" description="Capture an internal source for agent retrieval and audit traceability.">
        <form action={recordKnowledgeDocumentAction} className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-zinc-700">
              Title
              <input
                name="title"
                required
                className="h-10 rounded-lg border border-zinc-200 px-3 text-sm font-normal text-zinc-950 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
                placeholder="Lucid OS client onboarding workflow"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium text-zinc-700">
              Slug
              <input
                name="slug"
                className="h-10 rounded-lg border border-zinc-200 px-3 text-sm font-normal text-zinc-950 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
                placeholder="lucid-os-client-onboarding-workflow"
              />
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-[180px_1fr]">
            <label className="grid gap-2 text-sm font-medium text-zinc-700">
              Source
              <select
                name="source_system"
                defaultValue="admin"
                className="h-10 rounded-lg border border-zinc-200 px-3 text-sm font-normal text-zinc-950 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
              >
                <option value="admin">Admin</option>
                <option value="obsidian">Obsidian</option>
                <option value="github">GitHub</option>
                <option value="supabase">Supabase</option>
                <option value="integration">Integration</option>
                <option value="web">Web</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium text-zinc-700">
              Source URI
              <input
                name="source_uri"
                className="h-10 rounded-lg border border-zinc-200 px-3 text-sm font-normal text-zinc-950 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
                placeholder="wiki/concepts/lucid-os or repo path"
              />
            </label>
          </div>
          <label className="grid gap-2 text-sm font-medium text-zinc-700">
            Summary
            <textarea
              name="summary"
              required
              rows={3}
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-normal leading-6 text-zinc-950 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
              placeholder="What changed, why it matters, and where future agents should look."
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-zinc-700">
            Retrieval content
            <textarea
              name="content"
              rows={6}
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-normal leading-6 text-zinc-950 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
              placeholder="Full operational note or condensed source content. Leave blank to use the summary."
            />
          </label>
          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-zinc-950 px-4 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              <Save className="size-4" />
              Save knowledge
            </button>
          </div>
        </form>
      </Section>

      <Section title="Knowledge audit" description="Recent memory changes and protocol events.">
        {knowledgeAuditEvents.length === 0 ? (
          <EmptyState>No knowledge audit events yet.</EmptyState>
        ) : (
          <div className="grid gap-3">
            {knowledgeAuditEvents.map((event) => (
              <div key={event.id} className="rounded-lg border border-zinc-200 p-3">
                <div className="flex flex-col justify-between gap-2 md:flex-row md:items-center">
                  <div>
                    <p className="font-medium text-zinc-950">{event.summary}</p>
                    <p className="mt-1 text-sm text-zinc-500">{event.actorType} · {event.eventType}</p>
                  </div>
                  <p className="text-sm text-zinc-500">{formatAdminDateTime(event.createdAt)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
