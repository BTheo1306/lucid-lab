import { ArrowDownLeft, ArrowUpRight, Send } from 'lucide-react';
import { listClientRequestsForClient } from '@/lib/admin/portal';
import { answerClientRequestAction, createAgencyRequestAction } from './portal-actions';

const STATUS_LABELS: Record<string, string> = {
  open: 'Ouverte',
  in_progress: 'En cours',
  waiting: 'En attente',
  approved: 'Approuvée',
  changes_requested: 'Modifications demandées',
  done: 'Traitée',
  declined: 'Déclinée',
};

const TYPE_LABELS: Record<string, string> = {
  question: 'Question',
  change_request: 'Demande de modification',
  asset_request: 'Éléments à fournir',
  approval: 'Validation',
  info_request: 'Informations à compléter',
};

function statusTone(status: string): string {
  switch (status) {
    case 'approved':
    case 'done':
      return 'border-emerald-200 bg-emerald-50 text-emerald-700';
    case 'declined':
      return 'border-rose-200 bg-rose-50 text-rose-700';
    case 'changes_requested':
    case 'waiting':
    case 'in_progress':
      return 'border-amber-200 bg-amber-50 text-amber-700';
    default:
      return 'border-blue-200 bg-blue-50 text-blue-700';
  }
}

function formatDateTime(value: string): string {
  try {
    return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
  } catch {
    return value;
  }
}

/** Portal exchanges of one client: answer incoming requests, send new ones. */
export async function RequestsPanel({ clientId, clientSlug }: { clientId: string; clientSlug: string }) {
  const requests = await listClientRequestsForClient(clientId);

  return (
    <section className="grid gap-3">
      <h2 className="text-sm font-semibold tracking-[-0.01em] text-zinc-900">Échanges portail</h2>
      <div className="border-t border-zinc-200 pt-3">
        <details className="group border-b border-zinc-200 pb-4">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold text-zinc-900 [&::-webkit-details-marker]:hidden">
            <Send className="size-4 text-zinc-500" />
            Envoyer une demande au client
          </summary>
          <form action={createAgencyRequestAction} className="mt-4 grid gap-3">
            <input type="hidden" name="client_id" value={clientId} />
            <input type="hidden" name="client_slug" value={clientSlug} />
            <div className="grid gap-3 md:grid-cols-2">
              <label className="grid gap-1.5 text-sm font-medium text-zinc-700">
                Type
                <select name="request_type" className="h-10 rounded border border-zinc-200 bg-white px-2.5 text-sm">
                  <option value="approval">Validation à donner</option>
                  <option value="asset_request">Éléments à fournir</option>
                  <option value="info_request">Informations à compléter</option>
                  <option value="question">Question</option>
                </select>
              </label>
              <label className="grid gap-1.5 text-sm font-medium text-zinc-700">
                Échéance (optionnel)
                <input type="date" name="due_at" className="h-10 rounded border border-zinc-200 bg-white px-2.5 text-sm" />
              </label>
            </div>
            <label className="grid gap-1.5 text-sm font-medium text-zinc-700">
              Objet
              <input type="text" name="title" required maxLength={200} className="h-10 rounded border border-zinc-200 bg-white px-2.5 text-sm" />
            </label>
            <label className="grid gap-1.5 text-sm font-medium text-zinc-700">
              Détail (optionnel)
              <textarea name="body" rows={3} maxLength={5000} className="rounded border border-zinc-200 bg-white px-2.5 py-2 text-sm leading-6" />
            </label>
            <button
              type="submit"
              className="inline-flex h-9 items-center justify-center gap-2 rounded bg-zinc-950 px-3 text-sm font-semibold text-white transition hover:bg-zinc-800 md:justify-self-start"
            >
              <Send className="size-4" />
              Envoyer au client
            </button>
          </form>
        </details>

        {requests.length === 0 ? (
          <p className="pt-4 text-sm text-zinc-600">Aucun échange portail avec ce client pour le moment.</p>
        ) : (
          <div className="divide-y divide-zinc-100">
            {requests.map((request) => {
              const incoming = request.direction === 'client_to_agency';
              const openIncoming = incoming && ['open', 'in_progress', 'waiting'].includes(request.status);

              return (
                <div key={request.id} className="grid gap-2 py-4 last:pb-0">
                  <div className="flex flex-wrap items-center gap-2">
                    {incoming ? (
                      <ArrowDownLeft className="size-4 text-blue-600" />
                    ) : (
                      <ArrowUpRight className="size-4 text-zinc-500" />
                    )}
                    <p className="text-sm font-medium text-zinc-950">{request.title}</p>
                    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${statusTone(request.status)}`}>
                      {STATUS_LABELS[request.status] ?? request.status}
                    </span>
                    <span className="text-[11px] text-zinc-500">{TYPE_LABELS[request.requestType] ?? request.requestType}</span>
                  </div>
                  <p className="text-xs text-zinc-500">
                    {incoming ? `Reçue de ${request.createdByContactName ?? 'contact inconnu'}` : 'Envoyée par Lucid-Lab'}
                    {' · '}
                    {formatDateTime(request.createdAt)}
                  </p>
                  {request.body ? <p className="text-sm leading-6 whitespace-pre-line text-zinc-700">{request.body}</p> : null}
                  {request.responseNote ? (
                    <p className="rounded border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm leading-6 whitespace-pre-line text-zinc-700">
                      {request.responseNote}
                    </p>
                  ) : null}

                  {openIncoming ? (
                    <form action={answerClientRequestAction} className="grid gap-2">
                      <input type="hidden" name="request_id" value={request.id} />
                      <input type="hidden" name="client_slug" value={clientSlug} />
                      <textarea
                        name="response_note"
                        rows={2}
                        maxLength={5000}
                        placeholder="Réponse envoyée au client par email"
                        className="rounded border border-zinc-200 bg-white px-2.5 py-2 text-sm leading-6"
                      />
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="submit"
                          name="request_status"
                          value="done"
                          className="inline-flex h-8 items-center rounded border border-emerald-200 bg-emerald-50 px-2.5 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
                        >
                          Répondre et clore
                        </button>
                        <button
                          type="submit"
                          name="request_status"
                          value="in_progress"
                          className="inline-flex h-8 items-center rounded border border-blue-200 bg-blue-50 px-2.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                        >
                          Marquer en cours
                        </button>
                        <button
                          type="submit"
                          name="request_status"
                          value="declined"
                          className="inline-flex h-8 items-center rounded border border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
                        >
                          Décliner
                        </button>
                      </div>
                    </form>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
