import Link from 'next/link';
import type { ComponentType, ReactNode } from 'react';
import { BarChart3, FileText, MessageSquare, PlayCircle, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export type LeadEngineTabId = 'overview' | 'prospects' | 'campaigns' | 'runs' | 'outreach';

const leadEngineTabs: Array<{ id: LeadEngineTabId; href: string; label: string; icon: ComponentType<{ className?: string }> }> = [
  { id: 'overview', href: '/admin/lucid-os/growth', label: 'Overview', icon: BarChart3 },
  { id: 'prospects', href: '/admin/lucid-os/growth/prospects', label: 'Prospects', icon: Search },
  { id: 'campaigns', href: '/admin/lucid-os/growth/campaigns', label: 'Campaigns', icon: FileText },
  { id: 'runs', href: '/admin/lucid-os/growth/runs', label: 'Runs', icon: PlayCircle },
  { id: 'outreach', href: '/admin/lucid-os/growth/outreach', label: 'Outreach', icon: MessageSquare },
];

export function LeadEngineHeader({
  eyebrow,
  title,
  description,
  icon: Icon,
}: {
  eyebrow: string;
  title: string;
  description: string;
  icon: ComponentType<{ className?: string }>;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex size-10 items-center justify-center rounded-lg bg-zinc-950 text-white">
          <Icon className="size-5" />
        </div>
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.12em] text-zinc-500">{eyebrow}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-[-0.04em] text-zinc-950">{title}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-zinc-500">{description}</p>
        </div>
      </div>
    </div>
  );
}

export function LeadEngineTabs({ active }: { active: LeadEngineTabId }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white p-2 shadow-sm">
      <nav className="flex min-w-max gap-1 text-sm" aria-label="Lead Engine sections">
        {leadEngineTabs.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                'inline-flex h-9 items-center gap-2 rounded-lg px-3 font-medium transition-colors',
                active === item.id ? 'bg-zinc-950 text-white' : 'text-zinc-600 hover:bg-zinc-100 hover:text-zinc-950',
              )}
            >
              <Icon className="size-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
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
    <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase text-zinc-500">{label}</p>
          <p className="mt-2 text-3xl font-semibold tracking-[-0.03em] text-zinc-950">{value}</p>
        </div>
        <div className="flex size-9 items-center justify-center rounded-lg bg-zinc-100 text-zinc-600">
          <Icon className="size-4" />
        </div>
      </div>
      <p className="mt-3 text-sm text-zinc-500">{hint}</p>
    </div>
  );
}

export function Section({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-200 px-4 py-4 sm:px-5">
        <h2 className="text-base font-semibold tracking-[-0.01em]">{title}</h2>
        <p className="mt-1 text-sm text-zinc-500">{description}</p>
      </div>
      <div className="p-4 sm:p-5">{children}</div>
    </section>
  );
}

export function EmptyState({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-lg border border-dashed border-zinc-200 px-4 py-10 text-center text-sm leading-6 text-zinc-500">
      {children}
    </div>
  );
}

export function StatusBadge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'good' | 'warning' | 'danger' }) {
  return (
    <span
      className={cn(
        'inline-flex rounded-full px-2 py-1 text-xs font-medium ring-1',
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