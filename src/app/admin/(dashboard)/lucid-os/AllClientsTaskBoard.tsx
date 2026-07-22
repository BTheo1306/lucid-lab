'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff } from 'lucide-react';
import type { DashboardTask } from '@/lib/admin/client-tasks';
import { cn } from '@/lib/utils';
import { setClientTaskVisibilityAction, updateAnyClientTaskStatus } from './task-actions';

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

export function AllClientsTaskBoard({
  initialTasks,
  base,
}: {
  initialTasks: DashboardTask[];
  // Link prefix resolved by the server parent: '' on the admin subdomain,
  // '/admin' when reached directly.
  base: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [tasks, setTasks] = useState(initialTasks);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setTasks(initialTasks);
  }, [initialTasks]);

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

  function toggleVisibility(taskId: string, visible: boolean) {
    const prev = tasks;
    setError(null);
    setTasks((curr) => curr.map((t) => (t.id === taskId ? { ...t, clientVisible: visible } : t)));
    startTransition(async () => {
      try {
        await setClientTaskVisibilityAction(taskId, visible);
        router.refresh();
      } catch (err) {
        setTasks(prev);
        setError(err instanceof Error ? err.message : String(err));
      }
    });
  }

  if (initialTasks.length === 0) {
    return (
      <div className="border border-dashed border-zinc-200 px-4 py-10 text-center text-sm text-zinc-600">
        Aucune tâche active pour l&apos;instant.
      </div>
    );
  }

  return (
    <div className="grid gap-3">
      {error ? (
        <div className="rounded border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">{error}</div>
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
              'min-h-48 border border-zinc-200 bg-zinc-50 p-3 transition-colors',
              draggedTaskId && 'bg-zinc-100',
            )}
          >
            <div className="mb-3 flex items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-zinc-900">{col.label}</h3>
              <span className="text-xs text-zinc-600">{grouped[col.status].length}</span>
            </div>
            <div className="grid gap-2">
              {grouped[col.status].length === 0 ? (
                <div className="border border-dashed border-zinc-200 px-3 py-8 text-center text-sm text-zinc-600">Vide</div>
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
                    className="cursor-grab border border-zinc-200 bg-white p-3 active:cursor-grabbing"
                  >
                    <div className="flex items-start justify-between gap-2">
                      {task.clientSlug ? (
                        <Link
                          href={`${base}/lucid-os/clients/${task.clientSlug}`}
                          className="text-[11px] font-semibold uppercase tracking-[0.1em] text-blue-600 transition-colors hover:text-blue-800"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {task.clientName}
                        </Link>
                      ) : (
                        <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-zinc-600">Interne</span>
                      )}
                      {task.clientId ? (
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => toggleVisibility(task.id, !task.clientVisible)}
                          title={task.clientVisible ? 'Visible sur le portail client. Cliquer pour masquer.' : 'Masquée du portail client. Cliquer pour publier.'}
                          className={cn(
                            'shrink-0 rounded p-1 transition',
                            task.clientVisible ? 'text-blue-600 hover:bg-blue-50' : 'text-zinc-300 hover:bg-zinc-100 hover:text-zinc-600',
                          )}
                        >
                          {task.clientVisible ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
                        </button>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm font-semibold leading-5 text-zinc-950">{task.title}</p>
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
                                ? 'border-blue-200 bg-blue-50 text-blue-700'
                                : 'border-zinc-200 bg-zinc-50 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-900',
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
