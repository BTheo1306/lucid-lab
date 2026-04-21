import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Politique de confidentialité",
  description: "Politique de confidentialité de Lucid-Lab — comment nous traitons vos données personnelles.",
}

export default function Confidentialite() {
  return (
    <main className="mx-auto max-w-[760px] px-6 py-20 md:py-32">
      <Link
        href="/"
        className="mb-10 inline-flex items-center gap-1.5 text-[13px] text-zinc-500 transition-colors hover:text-black"
      >
        ← Retour
      </Link>

      <h1 className="mb-2 text-[32px] font-semibold tracking-tight text-zinc-900">
        Politique de confidentialité
      </h1>
      <p className="mb-10 text-[13px] text-zinc-400">Dernière mise à jour : avril 2026</p>

      <div className="prose prose-zinc max-w-none text-[15px] leading-[1.75] text-zinc-600 [&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:text-[18px] [&_h2]:font-semibold [&_h2]:text-zinc-900">
        <h2>Responsable du traitement</h2>
        <p>
          <strong>Lucid-Lab</strong>, Paris, France<br />
          Email : <a href="mailto:info@lucid-lab.fr" className="text-zinc-900 underline underline-offset-2">info@lucid-lab.fr</a>
        </p>

        <h2>Données collectées</h2>
        <p>
          Lors de votre visite sur le site ou de la prise de contact, nous pouvons collecter :
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Nom, prénom, adresse email (formulaire de contact / prise de rendez-vous)</li>
          <li>Informations sur votre entreprise et votre projet</li>
          <li>Données de navigation : pages visitées, durée de session (via analytics anonymisés)</li>
        </ul>

        <h2>Finalités du traitement</h2>
        <p>Vos données sont utilisées pour :</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Répondre à vos demandes et organiser les rendez-vous</li>
          <li>Améliorer nos services et le contenu du site</li>
          <li>Vous envoyer des informations relatives à nos prestations (avec votre accord)</li>
        </ul>

        <h2>Base légale</h2>
        <p>
          Le traitement est fondé sur votre consentement et sur l&apos;intérêt légitime de
          Lucid-Lab à développer son activité commerciale.
        </p>

        <h2>Durée de conservation</h2>
        <p>
          Vos données sont conservées pendant 3 ans à compter du dernier contact, sauf
          obligation légale de conservation plus longue.
        </p>

        <h2>Partage des données</h2>
        <p>
          Lucid-Lab ne vend ni ne loue vos données personnelles. Elles peuvent être partagées
          avec des sous-traitants techniques (hébergement, CRM, outil de prise de rendez-vous)
          dans le respect du RGPD.
        </p>

        <h2>Vos droits</h2>
        <p>
          Conformément au RGPD et à la loi Informatique et Libertés, vous disposez d&apos;un droit
          d&apos;accès, de rectification, d&apos;effacement, de portabilité et d&apos;opposition sur vos
          données. Pour exercer ces droits, contactez-nous à{" "}
          <a href="mailto:info@lucid-lab.fr" className="text-zinc-900 underline underline-offset-2">
            info@lucid-lab.fr
          </a>.
        </p>
        <p>
          Vous avez également le droit d&apos;introduire une réclamation auprès de la{" "}
          <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-zinc-900 underline underline-offset-2">
            CNIL
          </a>.
        </p>

        <h2>Cookies</h2>
        <p>
          Ce site utilise des cookies fonctionnels nécessaires à son bon fonctionnement.
          Aucun cookie publicitaire ou de tracking tiers n&apos;est utilisé sans votre consentement.
        </p>
      </div>
    </main>
  )
}
