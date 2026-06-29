import type { ComponentType, ReactNode } from 'react';
import { cn } from '@/lib/utils';

/**
 * Shared Lucid OS admin building blocks.
 *
 * Written with the admin's LIGHT base classes (bg-white, border-zinc-200,
 * text-zinc-950, ...). The admin theme toggle (admin-dark.css) remaps these to
 * dark values when `.admin-dark` is present, so every page built from these
 * components works in BOTH light and dark. Never use dark-native classes here
 * (text-zinc-50, border-white/..., bg-white/...): the toggle can't flip them,
 * so they break light mode.
 */

export function LucidOsHeader({
  title,
  action,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  icon?: ComponentType<{ className?: string }>;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-4 border-b border-zinc-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="text-2xl font-semibold tracking-[-0.03em] text-zinc-950 md:text-3xl">{title}</h1>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  href,
}: {
  label: string;
  value: string | number;
  hint: string;
  icon: ComponentType<{ className?: string }>;
  href?: string;
}) {
  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">{label}</p>
        <Icon className="size-4 shrink-0 text-zinc-400" />
      </div>
      <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-zinc-950">{value}</p>
      <p className="mt-1 text-sm text-zinc-500">{hint}</p>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className="block rounded-xl border border-zinc-200 bg-white p-4 shadow-sm transition-colors hover:border-zinc-300 hover:bg-zinc-50"
      >
        {inner}
      </a>
    );
  }

  return <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">{inner}</div>;
}

export function Section({
  title,
  action,
  children,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="grid gap-3">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-sm font-semibold tracking-[-0.01em] text-zinc-900">{title}</h2>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      {children}
    </section>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50 px-4 py-10 text-center text-sm leading-6 text-zinc-500">
      {children}
    </div>
  );
}

export function StatusBadge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'good' | 'warning' | 'danger' }) {
  return (
    <span
      className={cn(
        'inline-flex rounded px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] ring-1',
        tone === 'good' && 'bg-emerald-50 text-emerald-700 ring-emerald-200',
        tone === 'warning' && 'bg-amber-50 text-amber-700 ring-amber-200',
        tone === 'danger' && 'bg-rose-50 text-rose-700 ring-rose-200',
        tone === 'neutral' && 'bg-zinc-100 text-zinc-600 ring-zinc-200',
      )}
    >
      {children}
    </span>
  );
}

export function formatAdminDate(value: string | null): string {
  if (!value) return '-';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

export function formatAdminDateTime(value: string | null): string {
  if (!value) return '-';
  return new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value));
}
