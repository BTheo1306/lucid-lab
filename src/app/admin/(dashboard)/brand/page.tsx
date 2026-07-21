import type { Metadata } from 'next';
import { ExternalLink, Palette, RefreshCw } from 'lucide-react';
import { adminBasePath } from '@/lib/admin/auth';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Charte graphique — Admin' };

export default async function BrandGuidePage() {
  const base = await adminBasePath();
  return (
    <div className="-mx-5 -my-6 flex h-[calc(100dvh-64px)] flex-col md:-mx-8 md:-my-8">
      {/* Thin toolbar */}
      <div className="flex shrink-0 items-center justify-between border-b border-zinc-200 bg-white px-5 py-2.5 md:px-8">
        <div className="flex items-center gap-2.5">
          <Palette className="size-4 text-zinc-400" />
          <div>
            <p className="text-sm font-semibold leading-none text-zinc-900">Charte graphique</p>
            <p className="mt-0.5 text-xs text-zinc-500">Logos, couleurs, bannières, signatures</p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <a
            href={`${base}/brand-guide-serve`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50"
          >
            <ExternalLink className="size-3.5" />
            Ouvrir dans un onglet
          </a>
          <a
            href={`${base}/brand-guide-serve`}
            download="lucid-lab-charte-graphique.html"
            className="inline-flex h-8 items-center gap-1.5 rounded-md bg-zinc-950 px-3 text-xs font-medium text-white transition hover:bg-zinc-800"
          >
            <RefreshCw className="size-3.5" />
            Télécharger HTML
          </a>
        </div>
      </div>

      {/* Full-height iframe */}
      <iframe
        src={`${base}/brand-guide-serve`}
        className="min-h-0 w-full flex-1 border-0"
        title="Charte graphique Lucid-Lab"
      />
    </div>
  );
}
