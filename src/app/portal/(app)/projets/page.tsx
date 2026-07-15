import type { Metadata } from 'next';
import { CheckCircle2 } from 'lucide-react';
import { requirePortalUser } from '@/lib/portal/auth';
import { listPortalProjects, listPortalTasks, type PortalTask } from '@/lib/portal/data';
import { portalStrings } from '@/lib/portal/strings';
import {
  PortalCard,
  PortalEmptyState,
  PortalPageHeader,
  StatusPill,
  formatPortalDate,
  type PortalPillTone,
} from '../../components';

export const metadata: Metadata = {
  title: 'Projets',
};

function projectTone(status: string): PortalPillTone {
  switch (status) {
    case 'active':
      return 'info';
    case 'completed':
      return 'good';
    case 'blocked':
      return 'warning';
    default:
      return 'neutral';
  }
}

function TaskRow({ task }: { task: PortalTask }) {
  const s = portalStrings.tasks;
  const done = task.status === 'done';

  return (
    <div className="flex items-start justify-between gap-4 py-3.5 first:pt-0 last:pb-0">
      <div className="min-w-0">
        <div className="flex items-start gap-2">
          {done ? <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600" /> : null}
          <p className={done ? 'text-sm font-medium text-zinc-500' : 'text-sm font-medium text-zinc-950'}>
            {task.title}
          </p>
        </div>
        {task.description ? (
          <p className="mt-1 line-clamp-2 text-xs leading-5 text-zinc-500">{task.description}</p>
        ) : null}
      </div>
      <div className="shrink-0 text-right text-xs text-zinc-500">
        {done
          ? task.completedAt
            ? `${s.doneOn} ${formatPortalDate(task.completedAt)}`
            : s.done
          : task.dueAt
            ? `${s.due} ${formatPortalDate(task.dueAt)}`
            : null}
      </div>
    </div>
  );
}

function TaskGroup({ title, tasks, tone }: { title: string; tasks: PortalTask[]; tone: PortalPillTone }) {
  if (tasks.length === 0) return null;

  return (
    <PortalCard>
      <div className="mb-3 flex items-center gap-2">
        <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
        <StatusPill tone={tone}>{tasks.length}</StatusPill>
      </div>
      <div className="divide-y divide-zinc-100">
        {tasks.map((task) => (
          <TaskRow key={task.id} task={task} />
        ))}
      </div>
    </PortalCard>
  );
}

export default async function PortalProjectsPage() {
  const session = await requirePortalUser();
  const [projects, tasks] = await Promise.all([
    listPortalProjects(session),
    listPortalTasks(session),
  ]);

  const p = portalStrings.projects;
  const s = portalStrings.tasks;

  const todo = tasks.filter((t) => t.status === 'todo');
  const inProgress = tasks.filter((t) => t.status === 'in_progress');
  const waiting = tasks.filter((t) => t.status === 'waiting');
  const done = tasks
    .filter((t) => t.status === 'done')
    .sort((a, b) => (b.completedAt ?? '').localeCompare(a.completedAt ?? ''))
    .slice(0, 15);

  const hasAnyTask = tasks.length > 0;

  return (
    <div>
      <PortalPageHeader title={p.title} description={p.description} />

      <section className="grid gap-4">
        <h2
          className="text-lg font-bold tracking-tight"
          style={{ fontFamily: 'var(--font-syne), sans-serif' }}
        >
          {p.listTitle}
        </h2>
        {projects.length === 0 ? (
          <PortalEmptyState message={p.empty} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {projects.map((project) => (
              <PortalCard key={project.id}>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-semibold text-zinc-950">{project.name}</p>
                  <StatusPill tone={projectTone(project.status)}>
                    {p.statusLabels[project.status] ?? project.status}
                  </StatusPill>
                </div>
                <p className="mt-1 text-xs text-zinc-500">
                  {p.typeLabels[project.projectType] ?? project.projectType}
                  {project.dueAt ? ` · ${s.due} ${formatPortalDate(project.dueAt)}` : ''}
                </p>
                {project.summary ? (
                  <p className="mt-3 text-sm leading-relaxed text-zinc-600">{project.summary}</p>
                ) : null}
              </PortalCard>
            ))}
          </div>
        )}
      </section>

      <section className="mt-10 grid gap-4">
        <h2
          className="text-lg font-bold tracking-tight"
          style={{ fontFamily: 'var(--font-syne), sans-serif' }}
        >
          {s.title}
        </h2>
        {!hasAnyTask ? (
          <PortalEmptyState message={s.empty} />
        ) : (
          <div className="grid gap-4">
            <TaskGroup title={s.inProgress} tasks={inProgress} tone="info" />
            <TaskGroup title={s.todo} tasks={todo} tone="neutral" />
            <TaskGroup title={s.waiting} tasks={waiting} tone="warning" />
            <TaskGroup title={s.done} tasks={done} tone="good" />
          </div>
        )}
      </section>
    </div>
  );
}
