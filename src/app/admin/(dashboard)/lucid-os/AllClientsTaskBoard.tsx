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
  { status: 'done', label: 'Fini' },
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
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
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
          <section
            key={col.status}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              const taskId = e.dataTransfer.getData('text/plain') || draggedTaskId;
              if (taskId) moveTask(taskId, col.status);
              setDraggedTaskId(null);
            }}
            className={cn(
              'min-h-48 border border-white/[0.08] bg-white/[0.02] p-3 transition-colors',
              draggedTaskId && 'bg-white/[0.04]',
            )}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-zinc-100">{col.label}</h3>
              <span className="text-xs text-zinc-600">{grouped[col.status].length}</span>
            </div>
            <div className="grid gap-2">
              {grouped[col.status].length === 0 ? (
                <div className="border border-dashed border-white/[0.08] px-3 py-8 text-center text-sm text-zinc-600">Vide</div>
              ) : (
                grouped[col.status].map((task) => (
                  <article
                    key={task.id}
                    draggable
                    onDragStart={(e) => {
                      setDraggedTaskId(task.id);
                      e.dataTransfer.effectAllowed = 'move';
                      e.dataTransfer.setData('text/plain', task.id);
                    }}
                    onDragEnd={() => setDraggedTaskId(null)}
                    className="cursor-grab border border-white/[0.08] bg-[#09090b] p-3 active:cursor-grabbing"
                  >
                    <Link
                      href={`/admin/lucid-os/clients/${task.clientSlug}`}
                      className="text-[10px] font-semibold uppercase tracking-[0.1em] text-blue-400/80 transition-colors hover:text-blue-300"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {task.clientName}
                    </Link>
                    <p className="mt-1 text-sm font-semibold leading-5 text-zinc-50">{task.title}</p>
                    {task.description ? (
                      <p className="mt-2 line-clamp-2 text-xs leading-5 text-zinc-500">{task.description}</p>
                    ) : null}
                    <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.08em] text-zinc-600">
                      <span>{PRIORITY_LABELS[task.priority] ?? task.priority}</span>
                      {task.ownerLabel ? <span>{task.ownerLabel}</span> : null}
                      {shortDate(task.dueAt) ? <span>{shortDate(task.dueAt)}</span> : null}
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-1">
                      {COLUMNS.map((option) => {
                        const active = toCol(task.status) === option.status;
                        return (
                          <button
                            key={option.status}
                            type="button"
                            disabled={isPending || active}
                            onClick={() => moveTask(task.id, option.status)}
                            className={cn(
                              'h-8 rounded border px-2 text-[11px] font-semibold transition',
                              active
                                ? 'border-blue-400/30 bg-blue-500/10 text-blue-200'
                                : 'border-white/10 bg-white/[0.03] text-zinc-400 hover:bg-white/[0.07] hover:text-zinc-100',
                              (isPending || active) && 'cursor-default opacity-70',
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
