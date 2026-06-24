'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { DashboardTask } from '@/lib/admin/client-tasks';
import { cn } from '@/lib/utils';
import { updateAnyClientTaskStatus } from './task-actions';

type ColStatus = 'todo' | 'in_progress' | 'done';

const COLUMNS: Array<{ status: ColStatus; label: string }> = [
  { status: 'todo', label: 'À faire' },
  { status: 'in_progress', label: 'En cours' },
  { status: 'done', label: 'Terminé' },
];

const PRIORITY_LABELS: Record<string, string> = {
  low: 'basse', normal: 'normal', high: 'haute', urgent: 'urgent',
};

function toCol(status: string): ColStatus {
  if (status === 'done') return 'done';
  if (status === 'todo') return 'todo';
  return 'in_progress';
}

function shortDate(value: string | null): string | null {
  if (!value) return null;
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' }).format(new Date(value));
}

export function AllClientsTaskBoard({ initialTasks }: { initialTasks: DashboardTask[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [tasks, setTasks] = useState(initialTasks);
  const [error, setError] = useState<string | null>(null);

  const grouped = useMemo(
    () =>
      COLUMNS.reduce<Record<ColStatus, DashboardTask[]>>((acc, col) => {
        acc[col.status] = tasks.filter((t) => toCol(t.status) === col.status);
        return acc;
      }, { todo: [], in_progress: [], done: [] }),
    [tasks],
  );

  function moveTask(taskId: string, status: ColStatus) {
    const prev = tasks;
    setError(null);
    setTasks((curr) => curr.map((t) => (t.id === taskId ? { ...t, status } : t)));
    startTransition(async () => {
      try {
        await updateAnyClientTaskStatus(taskId, status);
        router.refresh();
      } catch (err) {
        setTasks(prev);
        setError(err instanceof Error ? err.message : String(err));
      }
    });
  }

  if (initialTasks.length === 0) {
    return (
      <div className="border border-dashed border-white/[0.08] px-4 py-10 text-center text-sm text-zinc-600">
        Aucune tâche active pour l'instant.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {error ? (
        <div className="rounded border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">{error}</div>
      ) : null}
      <div className="grid gap-3 lg:grid-cols-3">
        {COLUMNS.map((col) => (
          <section key={col.status} className="min-h-40 rounded border border-white/[0.08] bg-white/[0.015] p-3">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-zinc-400">{col.label}</h3>
              <span className="text-xs text-zinc-600">{grouped[col.status].length}</span>
            </div>
            <div className="grid gap-2">
              {grouped[col.status].length === 0 ? (
                <div className="border border-dashed border-white/[0.06] px-3 py-6 text-center text-xs text-zinc-700">Vide</div>
              ) : (
                grouped[col.status].map((task) => (
                  <article key={task.id} className="rounded border border-white/[0.08] bg-[#09090b] p-3">
                    <Link
                      href={`/admin/lucid-os/clients/${task.clientSlug}`}
                      className="text-[10px] font-semibold uppercase tracking-[0.1em] text-blue-400/80 hover:text-blue-300 transition-colors"
                    >
                      {task.clientName}
                    </Link>
                    <p className="mt-1 text-sm font-medium leading-5 text-zinc-100">{task.title}</p>
                    {task.description ? (
                      <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-500">{task.description}</p>
                    ) : null}
                    <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] uppercase tracking-[0.08em] text-zinc-600">
                      {task.priority !== 'normal' ? <span>{PRIORITY_LABELS[task.priority] ?? task.priority}</span> : null}
                      {task.ownerLabel ? <span>{task.ownerLabel}</span> : null}
                      {shortDate(task.dueAt) ? <span>{shortDate(task.dueAt)}</span> : null}
                    </div>
                    <div className="mt-2.5 grid grid-cols-3 gap-1">
                      {COLUMNS.map((option) => {
                        const active = toCol(task.status) === option.status;
                        return (
                          <button
                            key={option.status}
                            type="button"
                            disabled={isPending || active}
                            onClick={() => moveTask(task.id, option.status)}
                            className={cn(
                              'h-6 rounded border px-1.5 text-[10px] font-semibold transition',
                              active
                                ? 'border-blue-400/30 bg-blue-500/10 text-blue-200'
                                : 'border-white/[0.08] bg-white/[0.02] text-zinc-500 hover:bg-white/[0.07] hover:text-zinc-200',
                              (isPending || active) && 'cursor-default opacity-60',
                            )}
                          >
                            {option.label}
                          </button>
                        );
                      })}
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
