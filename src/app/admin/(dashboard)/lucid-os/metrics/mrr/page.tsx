import Link from 'next/link';
import { ArrowLeft, BarChart3 } from 'lucide-react';
import { adminBasePath } from '@/lib/admin/auth';
import { getAgencyMetrics } from '@/lib/admin/metrics';
import { EmptyState, LucidOsHeader, formatAdminDate } from '../../components';

export const dynamic = 'force-dynamic';

function eur(value: number): string {
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value)} €`;
}

export default async function MrrDetailPage() {
  const { mrrDetail, kpis } = await getAgencyMetrics();
  const base = await adminBasePath();

  return (
    <div className="grid gap-6">
      <Link href={`${base}/lucid-os/metrics`} className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-200">
        <ArrowLeft className="size-3.5" />
        Métriques
      </Link>
      <LucidOsHeader
        eyebrow="Métriques"
        title={`MRR — ${eur(kpis.mrrEurHt)} / mois HT`}
        description="Détail des opportunités gagnées contribuant au revenu récurrent mensuel."
        icon={BarChart3}
      />

      {mrrDetail.length === 0 ? (
        <EmptyState>Aucune opportunité gagnée enregistrée.</EmptyState>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-500">
              <th className="pb-3 pr-6">Client</th>
              <th className="pb-3 pr-6 text-right">MRR mensuel HT</th>
              <th className="pb-3 text-right">Date signature</th>
            </tr>
          </thead>
          <tbody>
            {mrrDetail.map((row, i) => (
              <tr key={i} className="border-b border-white/[0.05] last:border-0">
                <td className="py-3 pr-6 font-medium text-zinc-100">{row.clientName}</td>
                <td className="py-3 pr-6 text-right tabular-nums text-zinc-100">{eur(row.monthlyValueEur)}</td>
                <td className="py-3 text-right text-zinc-400">{formatAdminDate(row.closedAt)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-white/20">
              <td className="pt-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-500">Total</td>
              <td className="pt-3 text-right font-semibold tabular-nums text-zinc-50">{eur(kpis.mrrEurHt)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  );
}
