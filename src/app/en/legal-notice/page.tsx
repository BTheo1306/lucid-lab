import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Legal Notice",
  description: "Legal notice for Lucid-Lab",
}

export default function LegalNotice() {
  return (
    <main className="mx-auto max-w-[760px] px-6 py-20 md:py-32">
      <Link
        href="/en"
        className="mb-10 inline-flex items-center gap-1.5 text-[13px] text-zinc-500 transition-colors hover:text-black"
      >
        ← Back
      </Link>

      <h1 className="mb-10 text-[32px] font-semibold tracking-tight text-zinc-900">
        Legal Notice
      </h1>

      <div className="prose prose-zinc max-w-none text-[15px] leading-[1.75] text-zinc-600 [&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:text-[18px] [&_h2]:font-semibold [&_h2]:text-zinc-900">
        <h2>Site publisher</h2>
        <p>
          <strong>Lucid-Lab</strong><br />
          Société par actions simplifiée (SAS) under French law<br />
          Share capital: in formation<br />
          Registered office: Paris, France<br />
          SIREN: pending registration<br />
          Email: <a href="mailto:info@lucid-lab.fr" className="text-zinc-900 underline underline-offset-2">info@lucid-lab.fr</a>
        </p>

        <h2>Publication directors</h2>
        <p>Théo BENARD and Jules GOURON, co-founders</p>

        <h2>Hosting</h2>
        <p>
          The site is hosted by Vercel Inc.<br />
          440 N Barranca Ave #4133, Covina, CA 91723, United States<br />
          <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-zinc-900 underline underline-offset-2">vercel.com</a>
        </p>

        <h2>Intellectual property</h2>
        <p>
          All content on this site (text, images, graphics, logo, icons, etc.)
          is the exclusive property of Lucid-Lab, unless otherwise stated. Any reproduction,
          distribution, modification, adaptation, retransmission or publication of these elements
          is strictly prohibited without Lucid-Lab's express written consent.
        </p>

        <h2>Limitation of liability</h2>
        <p>
          The information on this site is provided for guidance and may be modified at any
          time. Lucid-Lab cannot be held liable for the inaccuracy or omissions in the
          information available on this site.
        </p>

        <h2>Applicable law</h2>
        <p>
          This site is governed by French law. In the event of a dispute, and failing an
          amicable agreement, the French courts shall have sole jurisdiction.
        </p>
      </div>
    </main>
  )
}
