import Link from 'next/link';
import { ArrowLeft, FolderKanban } from 'lucide-react';
import { adminBasePath } from '@/lib/admin/auth';
import { getAgencyMetrics } from '@/lib/admin/metrics';
import { EmptyState, LucidOsHeader } from '../../components';

export const dynamic = 'force-dynamic';

function eur(value: number): string {
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value)} €`;
}

export default async function PipelineDetailPage() {
  const { pipelineDetail, kpis } = await getAgencyMetrics();
  const base = await adminBasePath();

  return (
    <div className="grid gap-6">
      <Link href={`${base}/lucid-os/metrics`} className="inline-flex items-center gap-1.5 text-sm text-zinc-500 transition-colors hover:text-zinc-200">
        <ArrowLeft className="size-3.5" />
        Métriques
      </Link>
      <LucidOsHeader
        eyebrow="Métriques"
        title={`Pipeline ouvert — ${eur(kpis.openPipelineEur)}`}
        description="Détail des opportunités en cours, triées par valeur estimée."
        icon={FolderKanban}
      />

      {pipelineDetail.length === 0 ? (
        <EmptyState>Aucune opportunité ouverte.</EmptyState>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-white/10 text-left text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-500">
              <th className="pb-3 pr-6">Client</th>
              <th className="pb-3 pr-6">Étape</th>
              <th className="pb-3 text-right">Valeur estimée</th>
            </tr>
          </thead>
          <tbody>
            {pipelineDetail.map((row, i) => (
              <tr key={i} className="border-b border-white/[0.05] last:border-0">
                <td className="py-3 pr-6 font-medium text-zinc-100">{row.clientName}</td>
                <td className="py-3 pr-6 text-zinc-400">{row.stageLabel}</td>
                <td className="py-3 text-right tabular-nums text-zinc-100">{eur(row.valueEstimateEur)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-white/20">
              <td colSpan={2} className="pt-3 text-[11px] font-semibold uppercase tracking-[0.1em] text-zinc-500">Total</td>
              <td className="pt-3 text-right font-semibold tabular-nums text-zinc-50">{eur(kpis.openPipelineEur)}</td>
            </tr>
          </tfoot>
        </table>
      )}
    </div>
  );
}
