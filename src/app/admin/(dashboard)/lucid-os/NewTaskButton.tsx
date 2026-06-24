'use client';

import { useRef, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, X } from 'lucide-react';
import type { ClientOption } from '@/lib/admin/client-tasks';
import { createClientTaskAction } from './task-actions';

export function NewTaskButton({ clients }: { clients: ClientOption[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setError(null);
    startTransition(async () => {
      try {
        await createClientTaskAction(formData);
        formRef.current?.reset();
        setOpen(false);
        router.refresh();
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err));
      }
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-200"
      >
        <Plus className="size-3.5" />
        Nouvelle tâche
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="grid gap-3 border border-white/[0.08] bg-white/[0.02] p-4"
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold text-zinc-100">Nouvelle tâche</p>
        <button type="button" onClick={() => setOpen(false)}>
          <X className="size-4 text-zinc-500 hover:text-zinc-200" />
        </button>
      </div>

      {error ? <p className="text-sm text-rose-300">{error}</p> : null}

      <input
        name="title"
        required
        placeholder="Titre de la tâche *"
        className="h-9 w-full border border-white/10 bg-[#09090b] px-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-white/30"
      />

      <textarea
        name="description"
        placeholder="Description (optionnel)"
        rows={2}
        className="w-full resize-none border border-white/10 bg-[#09090b] px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-white/30"
      />

      <div className="grid gap-3 sm:grid-cols-2">
        <select
          name="client_id"
          className="h-9 border border-white/10 bg-[#09090b] px-3 text-sm text-zinc-300 outline-none focus:border-white/30"
        >
          <option value="">Pas de client</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>

        <input
          name="owner_label"
          placeholder="Responsable (ex : Jules)"
          className="h-9 border border-white/10 bg-[#09090b] px-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none focus:border-white/30"
        />
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <select
          name="priority"
          defaultValue="normal"
          className="h-9 border border-white/10 bg-[#09090b] px-3 text-sm text-zinc-300 outline-none focus:border-white/30"
        >
          <option value="low">Priorité basse</option>
          <option value="normal">Priorité normale</option>
          <option value="high">Priorité haute</option>
          <option value="urgent">Urgente</option>
        </select>

        <input
          name="due_at"
          type="date"
          className="h-9 border border-white/10 bg-[#09090b] px-3 text-sm text-zinc-300 outline-none focus:border-white/30"
        />
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="h-9 bg-zinc-50 px-4 text-sm font-semibold text-zinc-950 transition hover:bg-white disabled:opacity-60"
      >
        {isPending ? 'Création...' : 'Créer la tâche'}
      </button>
    </form>
  );
}
