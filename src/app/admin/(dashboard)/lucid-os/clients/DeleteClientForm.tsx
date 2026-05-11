'use client';

import { Trash2 } from 'lucide-react';
import { deleteClientAction } from './actions';

export function DeleteClientForm({ clientId, clientSlug, clientName }: { clientId: string; clientSlug: string; clientName: string }) {
  return (
    <form
      action={deleteClientAction}
      onSubmit={(event) => {
        if (!window.confirm(`Delete ${clientName} from Lucid OS? This hard-deletes the client row and cascades CRM records in Supabase.`)) {
          event.preventDefault();
        }
      }}
    >
      <input type="hidden" name="client_id" value={clientId} />
      <input type="hidden" name="client_slug" value={clientSlug} />
      <button type="submit" className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-rose-200 bg-white px-3 text-sm font-medium text-rose-700 transition hover:bg-rose-50">
        <Trash2 className="size-4" />
        Delete client
      </button>
    </form>
  );
}
