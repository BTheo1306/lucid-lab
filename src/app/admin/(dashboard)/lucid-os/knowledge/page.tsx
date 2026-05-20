import { Brain, ExternalLink, FileText, Save } from 'lucide-react';
import { listLucidAuditEvents, listLucidKnowledgeDocuments, type LucidKnowledgeStatus } from '@/lib/admin/lucid-os';
import { EmptyState, formatAdminDateTime, LucidOsHeader, Section, StatusBadge } from '../components';
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
    case 'obsidian': return 'Note interne';
    case 'github': return 'GitHub';
    case 'supabase': return 'Supabase';
    case 'integration': return 'Intégration';
    case 'web': return 'Web';
    default: return 'Admin';
  }
}

function statusLabel(status: LucidKnowledgeStatus): string {
  switch (status) {
    case 'active': return 'actif';
    case 'stale': return 'à mettre à jour';
    case 'archived': return 'archivé';
    default: return status;
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
        eyebrow="Mémoire opérationnelle"
        title="Connaissance"
        description="Mémoire d’entreprise récupérable par les agents."
        icon={Brain}
      />

      <Section title="Documents de connaissance" description="Résumés reliés à leurs sources et disponibles dans Lucid OS.">
        {documents.length === 0 ? (
          <EmptyState>Aucun document de connaissance n’est encore indexé.</EmptyState>
        ) : (
          <div className="divide-y divide-white/10">
            {documents.map((document) => (
              <article key={document.id} className="grid gap-4 py-5 first:pt-0 last:pb-0 xl:grid-cols-[minmax(280px,0.9fr)_minmax(320px,1.1fr)_minmax(220px,0.75fr)] xl:items-start">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-zinc-950">{document.title}</p>
                      <StatusBadge tone={knowledgeTone(document.status)}>{statusLabel(document.status)}</StatusBadge>
                    </div>
                    <p className="mt-1 text-sm text-zinc-500">{sourceLabel(document.sourceSystem)} · {document.visibility}</p>
                  </div>
                  <FileText className="size-5 shrink-0 text-zinc-400" />
                </div>
                {document.summary ? <p className="line-clamp-3 text-sm leading-6 text-zinc-600">{document.summary}</p> : <p className="text-sm text-zinc-500">Aucun résumé enregistré.</p>}
                <div className="flex flex-col gap-2 text-sm text-zinc-500">
                  <span>Fraîcheur {formatAdminDateTime(document.freshnessAt ?? document.updatedAt)}</span>
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

      <Section title="Enregistrer une connaissance" description="Capture une source interne pour la récupération par les agents et la traçabilité d’audit.">
        <form action={recordKnowledgeDocumentAction} className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2">
            <label className="grid gap-2 text-sm font-medium text-zinc-700">
              Titre
              <input
                name="title"
                required
                className="h-10 rounded-lg border border-zinc-200 px-3 text-sm font-normal text-zinc-950 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
                placeholder="Processus d’onboarding client Lucid OS"
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
                <option value="obsidian">Note interne</option>
                <option value="github">GitHub</option>
                <option value="supabase">Supabase</option>
                <option value="integration">Integration</option>
                <option value="web">Web</option>
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium text-zinc-700">
              Lien source
              <input
                name="source_uri"
                className="h-10 rounded-lg border border-zinc-200 px-3 text-sm font-normal text-zinc-950 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
                placeholder="wiki/concepts/lucid-os ou chemin repo"
              />
            </label>
          </div>
          <label className="grid gap-2 text-sm font-medium text-zinc-700">
            Résumé
            <textarea
              name="summary"
              required
              rows={3}
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-normal leading-6 text-zinc-950 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
              placeholder="Ce qui a changé, pourquoi c’est important et où les futurs agents doivent regarder."
            />
          </label>
          <label className="grid gap-2 text-sm font-medium text-zinc-700">
            Contenu récupérable
            <textarea
              name="content"
              rows={6}
              className="rounded-lg border border-zinc-200 px-3 py-2 text-sm font-normal leading-6 text-zinc-950 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-100"
              placeholder="Note opérationnelle complète ou contenu source condensé. Laisse vide pour utiliser le résumé."
            />
          </label>
          <div className="flex justify-end">
            <button
              type="submit"
              className="inline-flex h-10 items-center gap-2 rounded-lg bg-zinc-950 px-4 text-sm font-medium text-white transition hover:bg-zinc-800"
            >
              <Save className="size-4" />
              Enregistrer
            </button>
          </div>
        </form>
      </Section>

      <Section title="Audit connaissance" description="Changements mémoire et événements de protocole récents.">
        {knowledgeAuditEvents.length === 0 ? (
          <EmptyState>Aucun événement d’audit connaissance pour le moment.</EmptyState>
        ) : (
          <div className="divide-y divide-white/10">
            {knowledgeAuditEvents.map((event) => (
              <div key={event.id} className="py-3 first:pt-0 last:pb-0">
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
