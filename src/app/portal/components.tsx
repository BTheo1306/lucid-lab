import { cn } from '@/lib/utils';

/** Shared portal UI primitives, Lucid-Lab brand look (light, Figtree + Syne). */

export function PortalCard({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={cn('rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm', className)}>
      {children}
    </div>
  );
}

export function PortalPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1
          className="text-2xl font-bold tracking-tight text-zinc-950"
          style={{ fontFamily: 'var(--font-syne), sans-serif' }}
        >
          {title}
        </h1>
        {description ? <p className="mt-1 max-w-2xl text-sm text-zinc-600">{description}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}

export type PortalPillTone = 'neutral' | 'good' | 'warning' | 'danger' | 'info';

const pillToneClasses: Record<PortalPillTone, string> = {
  neutral: 'bg-zinc-100 text-zinc-700 border-zinc-200',
  good: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  danger: 'bg-rose-50 text-rose-700 border-rose-200',
  info: 'bg-blue-50 text-blue-700 border-blue-200',
};

export function StatusPill({
  tone = 'neutral',
  children,
}: {
  tone?: PortalPillTone;
  children: React.ReactNode;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
        pillToneClasses[tone],
      )}
    >
      {children}
    </span>
  );
}

export function PortalEmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-zinc-300 bg-white/60 px-6 py-10 text-center text-sm text-zinc-500">
      {message}
    </div>
  );
}

export function formatPortalDate(value: string | null | undefined): string {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium' }).format(new Date(value));
  } catch {
    return '';
  }
}

export function formatPortalDateTime(value: string | null | undefined): string {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat('fr-FR', { dateStyle: 'medium', timeStyle: 'short' }).format(
      new Date(value),
    );
  } catch {
    return '';
  }
}

export function formatPortalAmount(value: number | null | undefined): string {
  if (value == null) return '';
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: Number.isInteger(value) ? 0 : 2,
  }).format(value);
}
