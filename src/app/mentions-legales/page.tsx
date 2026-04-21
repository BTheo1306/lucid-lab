import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Mentions légales",
  description: "Mentions légales de Lucid-Lab",
}

export default function MentionsLegales() {
  return (
    <main className="mx-auto max-w-[760px] px-6 py-20 md:py-32">
      <Link
        href="/"
        className="mb-10 inline-flex items-center gap-1.5 text-[13px] text-zinc-500 transition-colors hover:text-black"
      >
        ← Retour
      </Link>

      <h1 className="mb-10 text-[32px] font-semibold tracking-tight text-zinc-900">
        Mentions légales
      </h1>

      <div className="prose prose-zinc max-w-none text-[15px] leading-[1.75] text-zinc-600 [&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:text-[18px] [&_h2]:font-semibold [&_h2]:text-zinc-900">
        <h2>Éditeur du site</h2>
        <p>
          <strong>Lucid-Lab</strong><br />
          Société par actions simplifiée (SAS)<br />
          Capital social : en cours de constitution<br />
          Siège social : Paris, France<br />
          SIREN : en cours d&apos;immatriculation<br />
          Email : <a href="mailto:info@lucid-lab.fr" className="text-zinc-900 underline underline-offset-2">info@lucid-lab.fr</a>
        </p>

        <h2>Directeurs de la publication</h2>
        <p>Théo BENARD et Jules GOURON, co-fondateurs</p>

        <h2>Hébergement</h2>
        <p>
          Le site est hébergé par Vercel Inc.<br />
          440 N Barranca Ave #4133, Covina, CA 91723, États-Unis<br />
          <a href="https://vercel.com" target="_blank" rel="noopener noreferrer" className="text-zinc-900 underline underline-offset-2">vercel.com</a>
        </p>

        <h2>Propriété intellectuelle</h2>
        <p>
          L&apos;ensemble du contenu de ce site (textes, images, graphismes, logo, icônes, etc.)
          est la propriété exclusive de Lucid-Lab, sauf mention contraire. Toute reproduction,
          distribution, modification, adaptation, retransmission ou publication de ces éléments
          est strictement interdite sans l&apos;accord exprès écrit de Lucid-Lab.
        </p>

        <h2>Limitation de responsabilité</h2>
        <p>
          Les informations contenues sur ce site sont fournies à titre indicatif et peuvent
          être modifiées à tout moment. Lucid-Lab ne saurait être tenu responsable de
          l&apos;inexactitude ou des omissions portant sur des informations disponibles sur ce site.
        </p>

        <h2>Droit applicable</h2>
        <p>
          Le présent site est régi par le droit français. En cas de litige, et à défaut
          d&apos;accord amiable, les tribunaux français seront seuls compétents.
        </p>
      </div>
    </main>
  )
}
