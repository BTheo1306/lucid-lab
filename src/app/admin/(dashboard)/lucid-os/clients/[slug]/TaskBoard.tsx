'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { LucidClientTaskStatus, LucidClientTaskSummary } from '@/lib/admin/lucid-os';
import { cn } from '@/lib/utils';
import { updateClientTaskStatusAction } from '../actions';

type BoardTask = Pick<LucidClientTaskSummary, 'id' | 'title' | 'description' | 'status' | 'priority' | 'ownerLabel' | 'dueAt'>;

type BoardColumnStatus = Extract<LucidClientTaskStatus, 'todo' | 'in_progress' | 'done'>;

const columns: Array<{ status: BoardColumnStatus; label: string }> = [
  { status: 'todo', label: 'À faire' },
  { status: 'in_progress', label: 'En cours' },
  { status: 'done', label: 'Fini' },
];

function boardStatus(status: LucidClientTaskStatus): BoardColumnStatus {
  if (status === 'done') return 'done';
  if (status === 'todo') return 'todo';
  return 'in_progress';
}

function formatDate(value: string | null): string | null {
  if (!value) return null;
  return new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: 'short' }).format(new Date(value));
}

function priorityLabel(priority: BoardTask['priority']): string {
  const labels: Record<BoardTask['priority'], string> = {
    low: 'basse',
    normal: 'normal',
    high: 'haute',
    urgent: 'urgent',
  };
  return labels[priority];
}

export function ClientTaskBoard({ clientId, clientSlug, tasks }: { clientId: string; clientSlug: string; tasks: BoardTask[] }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [localTasks, setLocalTasks] = useState(tasks.filter((task) => task.status !== 'cancelled'));
  const [error, setError] = useState<string | null>(null);

  const groupedTasks = useMemo(() => {
    return columns.reduce<Record<BoardColumnStatus, BoardTask[]>>((groups, column) => {
      groups[column.status] = localTasks.filter((task) => boardStatus(task.status) === column.status);
      return groups;
    }, { todo: [], in_progress: [], done: [] });
  }, [localTasks]);

  function moveTask(taskId: string, status: BoardColumnStatus) {
    const previousTasks = localTasks;
    setError(null);
    setLocalTasks((current) => current.map((task) => task.id === taskId ? { ...task, status } : task));
    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.set('client_id', clientId);
        formData.set('client_slug', clientSlug);
        formData.set('task_id', taskId);
        formData.set('task_status', status);
        await updateClientTaskStatusAction(formData);
        router.refresh();
      } catch (moveError) {
        setLocalTasks(previousTasks);
        setError(moveError instanceof Error ? moveError.message : String(moveError));
      }
    });
  }

  return (
    <div className="grid gap-3">
      {error ? <div className="border border-rose-400/25 bg-rose-500/10 px-3 py-2 text-sm text-rose-100">{error}</div> : null}
      <div className="grid gap-3 lg:grid-cols-3">
        {columns.map((column) => (
        <section
          key={column.status}
          onDragOver={(event) => event.preventDefault()}
          onDrop={(event) => {
            event.preventDefault();
            const taskId = event.dataTransfer.getData('text/plain') || draggedTaskId;
            if (taskId) moveTask(taskId, column.status);
            setDraggedTaskId(null);
          }}
          className={cn(
            'min-h-48 border border-white/[0.08] bg-white/[0.02] p-3 transition-colors',
            draggedTaskId && 'bg-white/[0.04]',
          )}
        >
          <div className="mb-3 flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-zinc-100">{column.label}</h3>
            <span className="text-xs text-zinc-600">{groupedTasks[column.status].length}</span>
          </div>

          <div className="grid gap-2">
            {groupedTasks[column.status].length === 0 ? (
              <div className="border border-dashed border-white/[0.08] px-3 py-8 text-center text-sm text-zinc-600">Vide</div>
            ) : groupedTasks[column.status].map((task) => (
              <article
                key={task.id}
                draggable
                onDragStart={(event) => {
                  setDraggedTaskId(task.id);
                  event.dataTransfer.effectAllowed = 'move';
                  event.dataTransfer.setData('text/plain', task.id);
                }}
                onDragEnd={() => setDraggedTaskId(null)}
                className="cursor-grab border border-white/[0.08] bg-[#09090b] p-3 active:cursor-grabbing"
              >
                <p className="text-sm font-semibold leading-5 text-zinc-50">{task.title}</p>
                {task.description ? <p className="mt-2 line-clamp-2 text-xs leading-5 text-zinc-500">{task.description}</p> : null}
                <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.08em] text-zinc-600">
                  <span>{priorityLabel(task.priority)}</span>
                  {task.ownerLabel ? <span>{task.ownerLabel}</span> : null}
                  {formatDate(task.dueAt) ? <span>{formatDate(task.dueAt)}</span> : null}
                </div>
                <div className="mt-3 grid grid-cols-3 gap-1">
                  {columns.map((option) => {
                    const active = boardStatus(task.status) === option.status;

                    return (
                      <button
                        key={option.status}
                        type="button"
                        disabled={isPending || active}
                        onClick={() => moveTask(task.id, option.status)}
                        className={cn(
                          'h-8 rounded border px-2 text-[11px] font-semibold transition',
                          active ? 'border-blue-400/30 bg-blue-500/10 text-blue-200' : 'border-white/10 bg-white/[0.03] text-zinc-400 hover:bg-white/[0.07] hover:text-zinc-100',
                          (isPending || active) && 'cursor-default opacity-70',
                        )}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
                <select
                  value={boardStatus(task.status)}
                  onChange={(event) => moveTask(task.id, event.target.value as BoardColumnStatus)}
                  disabled={isPending}
                  className="mt-3 h-8 w-full border border-white/10 bg-[#050506] px-2 text-xs text-zinc-300 outline-none focus:border-[#60a5fa]/60"
                >
                  {columns.map((option) => <option key={option.status} value={option.status}>{option.label}</option>)}
                </select>
              </article>
            ))}
          </div>
        </section>
        ))}
      </div>
    </div>
  );
}
