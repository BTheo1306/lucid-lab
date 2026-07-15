import { Eye, EyeOff, ExternalLink, Save } from 'lucide-react';
import { listMeetingInteractionsForClient } from '@/lib/admin/portal';
import { setInteractionVisibilityAction, updateInteractionClientSummaryAction } from './portal-actions';

function formatDateTime(value: string): string {
  try {
    return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
  } catch {
    return value;
  }
}

/**
 * Meeting recaps with portal controls: visibility toggle and edition of the
 * client-facing summary (the internal synthesis stays in the notes field,
 * never shown on the portal).
 */
export async function MeetingRecapsPanel({ clientId, clientSlug }: { clientId: string; clientSlug: string }) {
  const meetings = await listMeetingInteractionsForClient(clientId);
  if (meetings.length === 0) return null;

  return (
    <section className="grid gap-3">
      <h2 className="text-sm font-semibold tracking-[-0.01em] text-zinc-900">Comptes rendus de réunion (portail)</h2>
      <div className="border-t border-zinc-200 pt-3">
        <div className="divide-y divide-zinc-100">
          {meetings.map((meeting) => (
            <div key={meeting.id} className="grid gap-2 py-4 first:pt-0 last:pb-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-medium text-zinc-950">{meeting.summary}</p>
                {meeting.clientVisible ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-2 py-0.5 text-[11px] font-medium text-blue-700">
                    <Eye className="size-3" />
                    Visible client
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600">
                    <EyeOff className="size-3" />
                    Masqué
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500">
                {formatDateTime(meeting.occurredAt)}
                {meeting.sourceUri ? (
                  <>
                    {' · '}
                    <a href={meeting.sourceUri} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-blue-700 hover:underline">
                      Transcript <ExternalLink className="size-3" />
                    </a>
                  </>
                ) : null}
              </p>

              <form action={updateInteractionClientSummaryAction} className="grid gap-2">
                <input type="hidden" name="interaction_id" value={meeting.id} />
                <input type="hidden" name="client_slug" value={clientSlug} />
                <textarea
                  name="client_summary"
                  rows={4}
                  defaultValue={meeting.clientSummary ?? ''}
                  placeholder="Compte rendu affiché au client (vide = rien d'affichable)"
                  className="w-full rounded border border-zinc-200 bg-white px-3 py-2 text-sm leading-6 text-zinc-800 outline-none transition focus:border-zinc-400"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="submit"
                    className="inline-flex h-8 items-center gap-1.5 rounded border border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
                  >
                    <Save className="size-3.5" />
                    Enregistrer le compte rendu client
                  </button>
                </div>
              </form>

              <form action={setInteractionVisibilityAction}>
                <input type="hidden" name="interaction_id" value={meeting.id} />
                <input type="hidden" name="client_slug" value={clientSlug} />
                <input type="hidden" name="visible" value={meeting.clientVisible ? 'false' : 'true'} />
                <button
                  type="submit"
                  className="inline-flex h-8 items-center gap-1.5 rounded border border-blue-200 bg-blue-50 px-2.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                >
                  {meeting.clientVisible ? <EyeOff className="size-3.5" /> : <Eye className="size-3.5" />}
                  {meeting.clientVisible ? 'Masquer du portail' : 'Publier sur le portail'}
                </button>
              </form>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
