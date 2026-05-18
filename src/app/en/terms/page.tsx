import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Terms & Conditions — Lucid-Lab",
  description: "Terms and Conditions of Lucid-Lab (document subject to French law).",
}

export default function Terms() {
  return (
    <main className="mx-auto max-w-[760px] px-6 py-20 md:py-32">
      <Link
        href="/en"
        className="mb-10 inline-flex items-center gap-1.5 text-[13px] text-zinc-500 transition-colors hover:text-black"
      >
        ← Back
      </Link>

      <h1 className="mb-2 text-[32px] font-semibold tracking-tight text-zinc-900">
        Terms &amp; Conditions
      </h1>
      <p className="mb-10 text-[13px] text-zinc-400">Version 1.0 — May 2026</p>

      <div className="prose prose-zinc max-w-none text-[15px] leading-[1.75] text-zinc-600 [&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:text-[18px] [&_h2]:font-semibold [&_h2]:text-zinc-900">
        <p>
          Lucid-Lab&apos;s Terms &amp; Conditions are drafted in French and governed by French law.
          They apply to all services provided by Lucid-Lab to its professional clients.
        </p>
        <p>
          <Link href="/cgv" className="text-zinc-900 underline underline-offset-2">
            Read the Conditions Générales de Vente (French) →
          </Link>
        </p>
        <p>
          For any questions regarding our terms, please contact us at{' '}
          <a
            href="mailto:info@lucid-lab.fr"
            className="text-zinc-900 underline underline-offset-2"
          >
            info@lucid-lab.fr
          </a>
          .
        </p>
      </div>
    </main>
  )
}
