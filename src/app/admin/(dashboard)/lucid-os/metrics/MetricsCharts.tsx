'use client';

import { useEffect, useState, type ReactNode } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type RevenuePoint = { month: string; label: string; mrr: number; collected: number };
type PipelinePoint = { stage: string; label: string; valueEur: number; count: number };
type StatusPoint = { status: string; label: string; count: number };

const AXIS = '#71717a';
const GRID = 'rgba(255,255,255,0.06)';
const BLUE = '#60a5fa';
const EMERALD = '#34d399';

const tooltipStyle = {
  background: '#17171a',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: 6,
  color: '#fafafa',
  fontSize: 12,
} as const;

function eur(value: number | string): string {
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(Number(value) || 0)} €`;
}

// Short axis labels so they never wrap/clip (e.g. 1200 -> "1,2 k€").
function compactEur(value: number | string): string {
  const n = Number(value) || 0;
  if (Math.abs(n) >= 1000) return `${(n / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} k€`;
  return `${n} €`;
}

// recharts ResponsiveContainer needs a real, laid-out parent to measure. With
// force-dynamic SSR it renders at width(-1)/height(-1) and collapses, so only
// mount the charts on the client after layout. The fixed height reserves space.
function ChartShell({ height, children }: { height: number; children: ReactNode }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  return (
    <div className="w-full min-w-0 overflow-hidden" style={{ height }}>
      {mounted ? children : null}
    </div>
  );
}

export function RevenueByMonthChart({ data }: { data: RevenuePoint[] }) {
  return (
    <ChartShell height={260}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: 0 }} barGap={2}>
          <CartesianGrid vertical={false} stroke={GRID} />
          <XAxis dataKey="label" stroke={AXIS} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} tickMargin={8} />
          <YAxis stroke={AXIS} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={56} tickMargin={4} tickFormatter={(v) => compactEur(v as number)} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.04)' }} formatter={(v) => eur(v as number)} />
          <Bar dataKey="mrr" name="MRR" fill={BLUE} radius={[3, 3, 0, 0]} maxBarSize={28} />
          <Bar dataKey="collected" name="Encaissé" fill={EMERALD} radius={[3, 3, 0, 0]} maxBarSize={28} />
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

export function PipelineByStageChart({ data }: { data: PipelinePoint[] }) {
  if (data.length === 0) {
    return <p className="py-12 text-center text-sm text-zinc-500">Aucune opportunité ouverte.</p>;
  }
  return (
    <ChartShell height={Math.max(180, data.length * 52)}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
          <CartesianGrid horizontal={false} stroke={GRID} />
          <XAxis type="number" stroke={AXIS} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} tickFormatter={(v) => compactEur(v as number)} />
          <YAxis type="category" dataKey="label" stroke={AXIS} tickLine={false} axisLine={false} tick={{ fontSize: 11 }} width={150} />
          <Tooltip contentStyle={tooltipStyle} cursor={{ fill: 'rgba(255,255,255,0.04)' }} formatter={(v) => eur(v as number)} />
          <Bar dataKey="valueEur" name="Valeur" fill={BLUE} radius={[0, 3, 3, 0]} maxBarSize={26} />
        </BarChart>
      </ResponsiveContainer>
    </ChartShell>
  );
}

const STATUS_COLORS: Record<string, string> = {
  Actifs: '#34d399',
  Prospects: '#60a5fa',
  'En pause': '#fbbf24',
  Terminés: '#f87171',
  Archivés: '#a1a1aa',
};

export function ClientsByStatusChart({ data }: { data: StatusPoint[] }) {
  if (data.length === 0) {
    return <p className="py-12 text-center text-sm text-zinc-500">Aucun client.</p>;
  }
  return (
    <div className="w-full min-w-0">
      <ChartShell height={200}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={data} dataKey="count" nameKey="label" innerRadius={50} outerRadius={80} paddingAngle={2} stroke="none">
              {data.map((d) => (
                <Cell key={d.status} fill={STATUS_COLORS[d.label] ?? '#a1a1aa'} />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} formatter={(v) => String(v)} />
          </PieChart>
        </ResponsiveContainer>
      </ChartShell>
      <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1">
        {data.map((d) => (
          <span key={d.status} className="inline-flex items-center gap-1.5 text-xs text-zinc-400">
            <span className="size-2 shrink-0 rounded-full" style={{ background: STATUS_COLORS[d.label] ?? '#a1a1aa' }} />
            {d.label} ({d.count})
          </span>
        ))}
      </div>
    </div>
  );
}
