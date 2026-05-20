import type { ComponentType, ReactNode } from 'react';
import { cn } from '@/lib/utils';

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
    <header className="flex flex-col gap-4 border-b border-white/[0.08] pb-4 sm:flex-row sm:items-center sm:justify-between">
      <h1 className="text-2xl font-semibold tracking-[-0.03em] text-zinc-50 md:text-3xl">{title}</h1>
      {action ? <div className="shrink-0">{action}</div> : null}
    </header>
  );
}

export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  hint: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="border-t border-white/10 py-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-zinc-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-zinc-50">{value}</p>
        </div>
        <Icon className="mt-1 size-4 shrink-0 text-zinc-600" />
      </div>
      <p className="mt-3 text-sm text-zinc-500">{hint}</p>
    </div>
  );
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
        <h2 className="text-sm font-semibold tracking-[-0.01em] text-zinc-100">{title}</h2>
        {action ? <div className="shrink-0">{action}</div> : null}
      </div>
      <div className="border-t border-white/[0.08] pt-3">{children}</div>
    </section>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-md border border-dashed border-white/10 bg-white/[0.02] px-4 py-10 text-center text-sm leading-6 text-zinc-500">
      {children}
    </div>
  );
}

export function StatusBadge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'good' | 'warning' | 'danger' }) {
  return (
    <span
      className={cn(
        'inline-flex rounded px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.08em] ring-1',
        tone === 'good' && 'bg-emerald-500/10 text-emerald-300 ring-emerald-400/20',
        tone === 'warning' && 'bg-blue-500/10 text-blue-300 ring-blue-400/20',
        tone === 'danger' && 'bg-rose-500/10 text-rose-300 ring-rose-400/20',
        tone === 'neutral' && 'bg-white/[0.04] text-zinc-400 ring-white/10',
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
