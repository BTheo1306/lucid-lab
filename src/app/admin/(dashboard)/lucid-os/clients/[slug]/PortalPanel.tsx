import { ExternalLink, Send, ShieldCheck, ShieldOff } from 'lucide-react';
import { config } from '@/lib/bot/config';
import { listPortalContactsForClient } from '@/lib/admin/portal';
import { sendPortalInviteAction, setContactPortalAccessAction } from './portal-actions';

function formatDate(value: string | null): string | null {
  if (!value) return null;
  try {
    return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
  } catch {
    return null;
  }
}

/**
 * Agency-side portal access management for one client: per-contact access
 * toggle, invitation email, last login. Rendered in the client page sidebar.
 */
export async function PortalPanel({ clientId, clientSlug }: { clientId: string; clientSlug: string }) {
  const contacts = await listPortalContactsForClient(clientId);
  const portalHost = (() => {
    try {
      return new URL(config.portalBaseUrl).hostname;
    } catch {
      return 'client.lucid-lab.fr';
    }
  })();

  return (
    <section className="grid gap-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold tracking-[-0.01em] text-zinc-900">Portail client</h2>
        <a
          href={config.portalBaseUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:underline"
        >
          {portalHost}
          <ExternalLink className="size-3" />
        </a>
      </div>
      <div className="border-t border-zinc-200 pt-3">
        {contacts.length === 0 ? (
          <p className="text-sm leading-6 text-zinc-600">
            Ajoutez d’abord un contact avec une adresse email pour ouvrir l’accès au portail.
          </p>
        ) : (
          <div className="divide-y divide-zinc-100">
            {contacts.map((contact) => {
              const lastLogin = formatDate(contact.portalLastLoginAt);
              const invitedAt = formatDate(contact.portalInvitedAt);

              return (
                <div key={contact.id} className="grid gap-2 py-3 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-zinc-950">{contact.fullName || 'Contact sans nom'}</p>
                    {contact.portalAccess ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700">
                        <ShieldCheck className="size-3" />
                        Accès actif
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600">
                        <ShieldOff className="size-3" />
                        Pas d’accès
                      </span>
                    )}
                  </div>

                  <p className="break-all text-xs text-zinc-600">
                    {contact.email ?? 'Email manquant : impossible d’inviter ce contact.'}
                  </p>

                  {contact.portalAccess ? (
                    <p className="text-xs text-zinc-500">
                      {lastLogin
                        ? `Dernière connexion le ${lastLogin}`
                        : invitedAt
                          ? `Invité le ${invitedAt}, jamais connecté`
                          : 'Jamais connecté'}
                    </p>
                  ) : null}

                  <div className="flex flex-wrap gap-2">
                    {contact.email ? (
                      <form action={sendPortalInviteAction}>
                        <input type="hidden" name="contact_id" value={contact.id} />
                        <input type="hidden" name="client_slug" value={clientSlug} />
                        <button
                          type="submit"
                          className="inline-flex h-8 items-center gap-1.5 rounded border border-blue-200 bg-blue-50 px-2.5 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
                        >
                          <Send className="size-3.5" />
                          {contact.portalInvitedAt ? 'Renvoyer l’invitation' : 'Inviter'}
                        </button>
                      </form>
                    ) : null}

                    <form action={setContactPortalAccessAction}>
                      <input type="hidden" name="contact_id" value={contact.id} />
                      <input type="hidden" name="client_slug" value={clientSlug} />
                      <input type="hidden" name="enabled" value={contact.portalAccess ? 'false' : 'true'} />
                      <button
                        type="submit"
                        className="inline-flex h-8 items-center rounded border border-zinc-200 bg-white px-2.5 text-xs font-medium text-zinc-700 transition hover:bg-zinc-50"
                      >
                        {contact.portalAccess ? 'Désactiver l’accès' : 'Activer sans invitation'}
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
