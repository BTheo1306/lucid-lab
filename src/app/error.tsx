'use client'

import { useEffect } from 'react'
import Link from 'next/link'

// Error boundary de segment : évite l'écran d'erreur générique de Next quand
// une page lève au runtime. `global-error.tsx` couvre le cas où le layout
// racine lui-même échoue.
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Le digest est le seul identifiant corrélable avec les logs Vercel.
    console.error('Erreur de rendu:', error.digest ?? error.message)
  }, [error])

  return (
    <main className="mx-auto flex min-h-[60vh] max-w-[1264px] flex-col items-center justify-center border-x border-[#e5e5e5] px-6 py-24 text-center">
      <p className="mb-3 text-[12px] uppercase tracking-wider text-zinc-500">
        Erreur
      </p>
      <h1 className="mb-4 text-[32px] font-bold leading-[1.1] tracking-[-0.03em] text-[#0A0A0A] sm:text-[40px]">
        Quelque chose s&apos;est cassé de notre côté.
      </h1>
      <p className="mb-8 max-w-[520px] text-[15px] leading-[1.6] text-[#525252]">
        La page n&apos;a pas pu s&apos;afficher. Vous pouvez réessayer, ou
        revenir à l&apos;accueil et nous écrire si le problème persiste.
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-[#C85E1A] px-6 py-2.5 text-[14px] font-semibold text-white transition-colors hover:bg-[#a94d15]"
        >
          Réessayer
        </button>
        <Link
          href="/"
          className="rounded-full border border-[#E5E5E5] bg-white px-6 py-2.5 text-[14px] font-medium text-[#525252] transition-colors hover:border-[#0A0A0A] hover:text-[#0A0A0A]"
        >
          Retour à l&apos;accueil
        </Link>
      </div>
    </main>
  )
}
