import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Documents signes | Lucid-Lab',
  robots: { index: false, follow: false },
};

export default function SignedDocumentsPage() {
  return (
    <main className="min-h-screen bg-zinc-950 px-6 py-16 text-white">
      <div className="mx-auto flex min-h-[70vh] max-w-2xl flex-col justify-center">
        <p className="text-sm font-medium uppercase tracking-[0.18em] text-zinc-400">Lucid-Lab</p>
        <h1 className="mt-6 text-4xl font-semibold tracking-normal text-white sm:text-5xl">
          Merci, les documents ont bien &eacute;t&eacute; sign&eacute;s.
        </h1>
        <p className="mt-6 text-lg leading-8 text-zinc-300">
          Vous pouvez maintenant fermer cette page. Nous avons re&ccedil;u la confirmation de signature et nous revenons vers vous pour la suite.
        </p>
        <div className="mt-10">
          <Link href="/" className="inline-flex h-11 items-center rounded-md border border-white/20 px-5 text-sm font-medium text-white transition hover:border-white/40 hover:bg-white/10">
            Retour au site Lucid-Lab
          </Link>
        </div>
      </div>
    </main>
  );
}
