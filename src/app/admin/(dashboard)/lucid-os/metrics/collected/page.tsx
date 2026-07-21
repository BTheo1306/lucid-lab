import Link from 'next/link';
import { Activity, ArrowLeft } from 'lucide-react';
import { adminBasePath } from '@/lib/admin/auth';
import { getAgencyMetrics } from '@/lib/admin/metrics';
import { EmptyState, LucidOsHeader, formatAdminDate } from '../../components';

export const dynamic = 'force-dynamic';

function eur(value: number): string {
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value)} €`;
}

export default async function CollectedDetailPage() {
  const { collectedDetail, kpis } = await getAgencyMetrics();
  const base = await adminBasePath();

  return (
    <div className="grid gap-6">
      <Link href={`${base}/lucid-os/metrics`} className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-200">
        <ArrowLeft className="size-3.5" />
        Métriques
      </Link>
      <LucidOsHeader
        eyebrow="Métriques"
        title={`Encaissé — ${eur(kpis.revenueCollectedEur)}`}
        description="Détail des factures payées synchronisées depuis Dougs."
        icon={Activity}
      />

      {collectedDetail.length === 0 ? (
        <EmptyState>Aucun encaissement enregistré.</EmptyState>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-500">
              <th className="pb-3 pr-6">Client</th>
              <th className="pb-3 pr-6">Référence</th>
              <th className="pb-3 pr-6 text-right">Montant TTC</th>
              <th className="pb-3 text-right">Date paiement</th>
            </tr>
          </thead>
          <tbody>
            {collectedDetail.map((row, i) => (
              <tr key={i} className="border-b border-white/[0.05] last:border-0">
                <td className="py-3 pr-6 font-medium text-zinc-100">{row.clientName}</td>
                <td className="py-3 pr-6 text-zinc-400">{row.dougsRef ?? '-'}</td>
                <td className="py-3 pr-6 text-right tabular-nums text-zinc-100">{eur(row.amountTtcEur)}</td>
                <td className="py-3 text-right text-zinc-400">{formatAdminDate(row.occurredAt)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-white/20">
              <td colSpan={2} className="pt-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-500">Total</td>
              <td className="pt-3 text-right font-semibold tabular-nums text-zinc-50">{eur(kpis.revenueCollectedEur)}</td>
              <td />
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  );
}
