/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Mentions légales — Lucid-Lab",
  description:
    "Mentions légales de Lucid-Lab — informations légales, hébergement, données personnelles et propriété intellectuelle.",
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

      <h1 className="mb-2 text-[32px] font-semibold tracking-tight text-zinc-900">
        Mentions légales
      </h1>
      <p className="mb-10 text-[13px] text-zinc-400">Dernière mise à jour : 15 mai 2026</p>

      <div className="prose prose-zinc max-w-none text-[15px] leading-[1.75] text-zinc-600 [&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:text-[18px] [&_h2]:font-semibold [&_h2]:text-zinc-900 [&_h3]:mb-2 [&_h3]:mt-7 [&_h3]:text-[15px] [&_h3]:font-semibold [&_h3]:text-zinc-800">

        <h2>Éditeur du site</h2>
        <p>
          <strong>Lucid-Lab</strong><br />
          Société par actions simplifiée (SAS) au capital de 999 €<br />
          Siège social : 47 rue Vivienne, 75002 Paris, France<br />
          Immatriculée au Registre du Commerce et des Sociétés de Paris sous le numéro 104 672 050 R.C.S. Paris<br />
          Numéro SIREN : 104 672 050<br />
          Identifiant TVA intracommunautaire : FR 02 104 672 050<br />
          Identifiant unique européen : EUID FR7501.104672050<br />
          Code APE : 6202A (Conseil en systèmes et logiciels informatiques)<br />
          Téléphone : +33 7 59 56 38 47 — (sur demande à{' '}
          <a href="mailto:info@lucid-lab.fr" className="text-zinc-900 underline underline-offset-2">info@lucid-lab.fr</a>)<br />
          Email :{' '}
          <a href="mailto:info@lucid-lab.fr" className="text-zinc-900 underline underline-offset-2">info@lucid-lab.fr</a><br />
          Président : Periscope-X SARL, société de droit belge immatriculée à la BCE sous le numéro
          BE 1035283275, siège social 168 rue de Haerne, 1040 Etterbeek (Belgique), représentée par
          Monsieur Anthony Poirier.
        </p>

        <h2>Directeurs de la publication</h2>
        <p>
          Théo Benard et Jules Gouron, co-fondateurs et associés.<br />
          Contact rédaction :{' '}
          <a href="mailto:info@lucid-lab.fr" className="text-zinc-900 underline underline-offset-2">info@lucid-lab.fr</a>
        </p>

        <h2>Hébergeur du site</h2>
        <p>
          Le site lucid-lab.fr est hébergé par :<br />
          <strong>Vercel Inc.</strong><br />
          440 N Barranca Ave #4133, Covina, CA 91723, États-Unis<br />
          <a
            href="https://vercel.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-900 underline underline-offset-2"
          >
            vercel.com
          </a>
        </p>
        <p>
          Les services Vercel s'appuient sur des infrastructures situées dans l'Union européenne
          (régions Francfort et Paris) pour les contenus servis aux visiteurs européens.
        </p>

        <h2>Encadrement RGPD du transfert de données hors UE</h2>
        <p>
          Les transferts éventuels de données personnelles de visiteurs européens vers les
          États-Unis dans le cadre du fonctionnement technique de l'hébergement sont encadrés
          conformément au RGPD par :
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            les Clauses Contractuelles Types adoptées par la Commission européenne le 4 juin 2021
            (décision d'exécution 2021/914/UE), souscrites entre Lucid-Lab et Vercel Inc. ;
          </li>
          <li>
            l'adhésion de Vercel Inc. au EU-US Data Privacy Framework (Décision d'adéquation de la
            Commission européenne du 10 juillet 2023) ;
          </li>
          <li>
            la priorité donnée par Lucid-Lab à la livraison du contenu depuis les infrastructures
            situées en Union européenne (régions Francfort et Paris).
          </li>
        </ul>

        <h2>Responsabilité civile professionnelle</h2>
        <p>
          Lucid-Lab a souscrit auprès de Hiscox SA (succursale française, 49 avenue de l'Opéra,
          75002 Paris, RCS Paris 833 546 989), par l'intermédiaire du courtier LegalPlace (ORIAS
          n° 17 004 808), un contrat d'assurance Responsabilité civile professionnelle, contrat
          n° RCPLP 3695175450 :
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            Plafond de garantie : 100 000 € par période d'assurance pour la RC Professionnelle,
            10 000 000 € par sinistre pour la RC Exploitation et Employeur.
          </li>
          <li>Couverture territoriale : Monde entier hors USA / Canada.</li>
          <li>
            Protection juridique : CFDP Assurances (RCS Lyon 958 506 156), plafond 50 000 € TTC par
            litige (France, Monaco, Andorre).
          </li>
        </ul>

        <h2>Propriété intellectuelle</h2>
        <p>
          L'ensemble des contenus présents sur le site lucid-lab.fr (textes, structure, charte
          graphique, logo, illustrations, vidéos, photographies, icônes, scripts) est la propriété
          exclusive de Lucid-Lab ou de tiers qui lui ont concédé une licence d'utilisation. Toute
          reproduction, représentation, modification, publication, adaptation, transmission,
          exploitation commerciale ou réutilisation de tout ou partie des éléments du site, par
          quelque procédé que ce soit et sur quelque support que ce soit, est strictement interdite
          sans l'autorisation écrite préalable de Lucid-Lab.
        </p>
        <p>
          Les marques Lucid-Lab et son logo associé sont la propriété de Lucid-Lab. Toute
          reproduction non autorisée engage la responsabilité de son auteur (articles L. 713-2 et
          L. 713-3 du Code de la propriété intellectuelle).
        </p>

        <h2>Données personnelles et cookies</h2>

        <h3>Responsable de traitement</h3>
        <p>
          Le responsable de traitement des données collectées via le site lucid-lab.fr est
          Lucid-Lab, joignable par email à{' '}
          <a
            href="mailto:info@lucid-lab.fr"
            className="text-zinc-900 underline underline-offset-2"
          >
            info@lucid-lab.fr
          </a>{' '}
          ou par courrier à l'adresse du siège social.
        </p>

        <h3>Finalités du traitement</h3>
        <p>Les données collectées via les formulaires du site sont traitées pour :</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Réponse aux demandes de contact, devis et propositions commerciales.</li>
          <li>Suivi de la relation contractuelle avec les clients et prospects.</li>
          <li>Envoi d'informations relatives à nos services (sur consentement explicite).</li>
          <li>Mesure d'audience anonymisée du site.</li>
        </ul>

        <h3>Base légale</h3>
        <p>Les traitements reposent sur :</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            L'exécution de mesures précontractuelles ou contractuelles (article 6.1.b RGPD) pour
            les demandes de devis et propositions.
          </li>
          <li>
            Le consentement (article 6.1.a RGPD) pour la prospection commerciale et les cookies non
            strictement nécessaires.
          </li>
          <li>
            L'intérêt légitime (article 6.1.f RGPD) pour la sécurité du site et la mesure
            d'audience anonymisée.
          </li>
        </ul>

        <h3>Durée de conservation</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>Demandes de contact non converties : 3 ans à compter du dernier contact.</li>
          <li>
            Clients : durée de la relation contractuelle + 10 ans (obligations comptables et
            fiscales).
          </li>
          <li>Cookies de mesure d'audience : 13 mois maximum.</li>
        </ul>

        <h3>Vos droits</h3>
        <p>
          Conformément au Règlement (UE) 2016/679 (RGPD) et à la loi n° 78-17 du 6 janvier 1978
          modifiée, vous disposez d'un droit d'accès, de rectification, d'effacement, d'opposition,
          de limitation du traitement et de portabilité de vos données, ainsi que du droit de
          définir des directives relatives au sort de vos données après votre décès.
        </p>
        <p>
          Pour exercer ces droits, écrivez à{' '}
          <a
            href="mailto:info@lucid-lab.fr"
            className="text-zinc-900 underline underline-offset-2"
          >
            info@lucid-lab.fr
          </a>{' '}
          en joignant la copie d'une pièce d'identité en cours de validité. Réponse sous un mois.
        </p>
        <p>
          En cas de désaccord, vous pouvez introduire une réclamation auprès de la CNIL (3 place de
          Fontenoy, TSA 80715, 75334 Paris Cedex 07 —{' '}
          <a
            href="https://www.cnil.fr"
            target="_blank"
            rel="noopener noreferrer"
            className="text-zinc-900 underline underline-offset-2"
          >
            www.cnil.fr
          </a>
          ).
        </p>

        <h2>Cookies</h2>
        <p>
          Le site lucid-lab.fr utilise des cookies strictement nécessaires à son fonctionnement et,
          sous réserve de votre consentement préalable, des cookies de mesure d'audience anonymisée.
          Vous pouvez à tout moment retirer votre consentement via le module dédié accessible en bas
          de page.
        </p>

        <h2>Conditions générales de vente</h2>
        <p>
          Toute prestation commandée auprès de Lucid-Lab est régie par les{' '}
          <Link href="/cgv" className="text-zinc-900 underline underline-offset-2">
            Conditions Générales de Vente
          </Link>{' '}
          accessibles à l'adresse lucid-lab.fr/cgv. Les CGV applicables sont celles en vigueur au
          jour de la signature du bon de commande ou du contrat de prestation. Le client reconnaît
          en avoir pris connaissance et les accepter sans réserve avant toute commande.
        </p>

        <h2>Médiation entre professionnels</h2>
        <p>
          Lucid-Lab exerce exclusivement à destination d'une clientèle professionnelle (B2B). Les
          présentes mentions légales et les conditions commerciales applicables ne relèvent pas du
          Code de la consommation. En cas de différend entre Lucid-Lab et un Client professionnel,
          les Parties s'engagent à tenter une résolution amiable préalable à toute action
          contentieuse, le cas échéant par recours à un médiateur conventionnel choisi d'un commun
          accord, conformément aux articles 1530 et suivants du Code de procédure civile.
        </p>

        <h2>Limitation de responsabilité</h2>
        <p>
          Lucid-Lab met tout en œuvre pour offrir aux utilisateurs des informations et outils
          disponibles et vérifiés. La société ne saurait toutefois être tenue pour responsable des
          erreurs, d'une absence de disponibilité des fonctionnalités ou de la présence de virus sur
          le site.
        </p>
        <p>
          Les informations diffusées sur lucid-lab.fr sont fournies à titre indicatif et ne
          sauraient engager la responsabilité de Lucid-Lab. Les liens hypertextes vers des sites
          tiers sont fournis pour la commodité de l'utilisateur ; Lucid-Lab n'exerce aucun contrôle
          sur ces sites et décline toute responsabilité quant à leur contenu.
        </p>

        <h2>Droit applicable et juridiction compétente</h2>
        <p>
          Le présent site et les présentes mentions légales sont régis par le droit français. En cas
          de litige, et après tentative de recherche d'une solution amiable, les tribunaux français
          seront seuls compétents.
        </p>
        <p>
          Pour les litiges entre professionnels, compétence exclusive est attribuée au Tribunal des
          activités économiques de Paris (Greffe : 1 quai de la Corse, 75198 Paris Cedex 04). Pour
          les litiges impliquant un consommateur, la juridiction compétente est déterminée selon les
          dispositions du Code de la consommation et du Code de procédure civile.
        </p>

        <h2>Crédits</h2>
        <p>Conception et développement : Lucid-Lab.</p>
      </div>
    </main>
  )
}
