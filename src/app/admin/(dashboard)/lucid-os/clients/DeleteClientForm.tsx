'use client';

import { Trash2 } from 'lucide-react';
import { deleteClientAction } from './actions';

export function DeleteClientForm({ clientId, clientSlug, clientName }: { clientId: string; clientSlug: string; clientName: string }) {
  return (
    <form
      action={deleteClientAction}
      onSubmit={(event) => {
        if (!window.confirm(`Supprimer ${clientName} de Lucid OS ? Cette action supprime définitivement la fiche client et les enregistrements CRM liés dans Supabase.`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="client_id" value={clientId} />
      <input type="hidden" name="client_slug" value={clientSlug} />
      <button type="submit" className="inline-flex h-9 items-center justify-center gap-2 rounded border border-rose-400/30 bg-rose-500/10 px-3 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/15">
        <Trash2 className="size-4" />
        Supprimer le client
      </button>
    </form>
  );
}
