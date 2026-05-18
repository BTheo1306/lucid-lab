/* eslint-disable react/no-unescaped-entities */
import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "Conditions Générales de Vente — Lucid-Lab",
  description: "Conditions Générales de Vente de Lucid-Lab. Version 1.0 — mai 2026.",
}

export default function CGV() {
  return (
    <main className="mx-auto max-w-[760px] px-6 py-20 md:py-32">
      <Link
        href="/"
        className="mb-10 inline-flex items-center gap-1.5 text-[13px] text-zinc-500 transition-colors hover:text-black"
      >
        ← Retour
      </Link>

      <h1 className="mb-2 text-[32px] font-semibold tracking-tight text-zinc-900">
        Conditions Générales de Vente
      </h1>
      <p className="mb-1 text-[13px] text-zinc-400">Version 1.0 — Mise à jour au 15 mai 2026</p>
      <p className="mb-10 text-[13px] text-zinc-400">
        Applicables aux relations entre professionnels. Lucid-Lab ne contracte pas, à la date des
        présentes, avec des consommateurs au sens de l'article liminaire du Code de la consommation.
      </p>

      <div className="prose prose-zinc max-w-none text-[15px] leading-[1.75] text-zinc-600 [&_h2]:mb-3 [&_h2]:mt-10 [&_h2]:text-[18px] [&_h2]:font-semibold [&_h2]:text-zinc-900 [&_h3]:mb-2 [&_h3]:mt-7 [&_h3]:text-[15px] [&_h3]:font-semibold [&_h3]:text-zinc-800">

        <h2>Préambule</h2>
        <p>
          Les présentes Conditions Générales de Vente (ci-après les "CGV") régissent l'ensemble des
          prestations fournies par la société Lucid-Lab, société par actions simplifiée au capital de
          999 €, immatriculée au Registre du Commerce et des Sociétés de Paris sous le numéro
          104 672 050, dont le siège social est situé 47 rue Vivienne, 75002 Paris, identifiée au
          numéro de TVA intracommunautaire FR 02 104 672 050 (ci-après le "Prestataire" ou
          "Lucid-Lab"), à ses clients professionnels (ci-après le "Client").
        </p>
        <p>
          Conformément à l'article L. 441-1 du Code de commerce, les présentes CGV constituent le
          socle unique de la négociation commerciale. Toute commande de Prestation passée auprès de
          Lucid-Lab implique l'acceptation pleine et entière, sans réserve, des présentes CGV par le
          Client, à l'exclusion de tout autre document, en particulier des éventuelles conditions
          générales d'achat du Client.
        </p>
        <p>
          Conformément à l'article L. 441-3 du Code de commerce, lorsque les Prestations donnent lieu
          à une relation contractuelle durable ou récurrente entre les Parties, les présentes CGV
          ensemble avec le Bon de Commande signé par le Client valent convention écrite récapitulant
          les obligations auxquelles les Parties se sont engagées.
        </p>

        <h2>Article 1 — Définitions</h2>
        <p>
          Dans les présentes CGV, les termes suivants, qu'ils soient employés au singulier ou au
          pluriel, ont la signification ci-après :
        </p>
        <ul className="list-disc pl-5 space-y-2">
          <li>
            <strong>"Bon de Commande"</strong> : document écrit signé par le Client matérialisant
            son acceptation d'une Proposition Commerciale et faisant référence aux présentes CGV.
          </li>
          <li>
            <strong>"Client"</strong> : toute personne morale ou physique agissant à des fins entrant
            dans le cadre de son activité commerciale, industrielle, artisanale, libérale ou
            agricole, qui passe commande de Prestations auprès de Lucid-Lab.
          </li>
          <li>
            <strong>"Contrat"</strong> : ensemble contractuel composé du Bon de Commande ou du
            Contrat de Prestation, des présentes CGV et de leurs éventuels avenants.
          </li>
          <li>
            <strong>"Livrable"</strong> : tout bien, fichier, document, code source, configuration,
            agent IA, automatisation, contenu ou ouvrage produit par le Prestataire et remis au
            Client en exécution du Contrat.
          </li>
          <li>
            <strong>"Proposition Commerciale"</strong> : document de chiffrage adressé par le
            Prestataire au Client, précisant le périmètre, le calendrier et les conditions
            financières d'une Prestation.
          </li>
          <li>
            <strong>"Prestation"</strong> : ensemble des actions et services fournis par le
            Prestataire au Client en exécution du Contrat.
          </li>
          <li>
            <strong>"Partie"</strong> : individuellement Lucid-Lab ou le Client ; ensemble, les
            "Parties".
          </li>
        </ul>

        <h2>Article 2 — Objet et champ d'application</h2>
        <p>
          Les présentes CGV ont pour objet de définir les conditions dans lesquelles Lucid-Lab
          fournit à ses Clients ses prestations de conseil, conception, développement, intégration et
          maintenance dans les domaines suivants :
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            Développement et intégration d'agents IA et d'automatisations métier (workflows n8n,
            Make, Zapier, OpenAI, agents conversationnels, bots WhatsApp, Instagram et autres
            plateformes).
          </li>
          <li>Conseil en stratégie digitale, transformation opérationnelle et déploiement IA.</li>
          <li>
            Conception, développement et maintenance de sites internet et d'applications web.
          </li>
          <li>Gestion de campagnes publicitaires en ligne (notamment Meta Ads).</li>
          <li>Production de contenus (articles SEO, vidéos institutionnelles, podcasts).</li>
          <li>Tout autre service connexe inscrit à l'objet social de Lucid-Lab.</li>
        </ul>
        <p>
          Les présentes CGV s'appliquent à toute Prestation, sous réserve des Conditions
          Particulières éventuellement convenues entre les Parties dans le Bon de Commande ou le
          Contrat de Prestation, qui priment alors sur les présentes CGV pour les points qu'elles
          traitent expressément.
        </p>

        <h2>Article 3 — Devis, bon de commande et formation du contrat</h2>

        <h3>3.1 Devis et Proposition Commerciale</h3>
        <p>
          Toute prestation fait l'objet d'une Proposition Commerciale écrite établie par Lucid-Lab
          sur la base des éléments transmis par le Client. La Proposition est valable trente (30)
          jours à compter de sa date d'émission, sauf mention contraire.
        </p>
        <p>
          La Proposition précise notamment : l'identification des Parties, le périmètre détaillé,
          les livrables attendus, le calendrier indicatif, les prix HT et TTC, les modalités de
          paiement, la durée d'engagement.
        </p>

        <h3>3.2 Formation du Contrat</h3>
        <p>Le Contrat est formé à la double condition cumulative :</p>
        <ol className="list-decimal pl-5 space-y-1">
          <li>
            de la signature par le Client du Bon de Commande ou du Contrat de Prestation
            accompagnant la Proposition Commerciale ; et
          </li>
          <li>
            de la réception effective, par Lucid-Lab, du premier paiement dans les conditions
            prévues à l'Article 5.
          </li>
        </ol>
        <p>
          Aucune Prestation ne sera engagée tant que ces deux conditions ne sont pas simultanément
          satisfaites. Le Client reconnaît expressément cette stipulation comme une condition
          essentielle et déterminante du consentement de Lucid-Lab.
        </p>

        <h3>3.3 Modifications du périmètre</h3>
        <p>
          Toute demande de modification ou d'extension du périmètre initial doit faire l'objet d'un
          avenant écrit signé par les deux Parties. À défaut, Lucid-Lab se réserve le droit de
          refuser l'exécution de prestations hors périmètre ou de les facturer en supplément au
          tarif journalier en vigueur.
        </p>

        <h2>Article 4 — Prix</h2>

        <h3>4.1 Prix et fiscalité</h3>
        <p>
          Les prix sont exprimés en euros, hors taxes (HT), et majorés de la TVA au taux légal en
          vigueur (20 % à la date des présentes pour les prestations de service en France
          métropolitaine). Toute évolution du taux légal sera répercutée de plein droit sur les
          factures émises postérieurement à cette évolution.
        </p>

        <h3>4.2 Choix de la modalité tarifaire</h3>
        <p>Le Client choisit, lors de la signature du Bon de Commande, entre :</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Modalité one-shot</strong> : paiement intégral en une fois avant démarrage des
            travaux ; ou
          </li>
          <li>
            <strong>Modalité mensuelle 12 mois</strong> : paiement échelonné en douze (12)
            mensualités égales, chacune payable d'avance avant le premier jour du mois concerné,
            dans le cadre d'un engagement ferme et irrévocable de douze (12) mois.
          </li>
        </ul>
        <p>
          La modalité mensuelle 12 mois donne droit à un tarif réduit par rapport à la modalité
          one-shot, en contrepartie de l'engagement de durée. La résiliation anticipée par le Client
          entraîne les conséquences prévues à l'Article 13.
        </p>

        <h3>4.3 Frais et budgets exclus du forfait</h3>
        <p>
          Le prix de la Prestation rémunère exclusivement le travail de conception, de
          développement, d'intégration et d'accompagnement réalisé par Lucid-Lab. Sont en toute
          hypothèse exclus du forfait et restent à la charge directe du Client, qu'ils soient
          acquittés par le Client en direct ou refacturés à l'euro par Lucid-Lab sur présentation
          des justificatifs :
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            les coûts de consommation des services d'intelligence artificielle (jetons OpenAI,
            Anthropic ou tout autre fournisseur de modèle, appels d'API, crédits de traitement,
            instances GPU, services de transcription ou de génération d'images) ;
          </li>
          <li>
            les budgets publicitaires des campagnes pilotées par Lucid-Lab (Meta Ads, Google Ads,
            LinkedIn Ads, TikTok Ads et toute autre régie), dont le Client conserve la maîtrise et
            le débit ;
          </li>
          <li>
            les abonnements et licences des outils tiers utilisés pour le compte du Client (n8n,
            Make, Zapier, Système.io, WordPress, hébergeurs, noms de domaine, CRM, outils
            analytiques) ;
          </li>
          <li>
            les frais de déplacement engagés avec accord préalable écrit du Client (transport,
            hébergement, repas, sur la base réelle ou aux barèmes URSSAF) ;
          </li>
          <li>
            toute prestation tierce sous-traitée à la demande du Client (graphistes, photographes,
            rédacteurs externes, traducteurs).
          </li>
        </ul>
        <p>
          Le Client reconnaît que ces coûts sont par nature variables et dépendent du volume
          d'usage, des tarifs des fournisseurs et des arbitrages stratégiques retenus. Lucid-Lab
          fournit, à la demande du Client, une estimation indicative des consommations attendues,
          sans engagement de plafond et sous réserve d'ajustements en fonction de l'évolution des
          tarifs des fournisseurs tiers.
        </p>

        <h3>4.4 Révision des tarifs</h3>
        <p>
          Les tarifs en vigueur sont ceux figurant dans la Proposition Commerciale signée. Pour les
          Prestations s'étendant sur plus de douze (12) mois, Lucid-Lab se réserve le droit de
          réviser ses tarifs chaque année à la date anniversaire du Contrat, dans la limite de
          l'évolution de l'indice Syntec publié par la Fédération Syntec. Le Client est informé par
          écrit au moins trente (30) jours avant l'entrée en vigueur de la nouvelle tarification.
        </p>

        <h2>Article 5 — Paiement préalable obligatoire</h2>

        <h3>5.1 Principe — Paiement avant prestation</h3>
        <p>
          Conformément à la pratique professionnelle de Lucid-Lab et à l'équilibre économique des
          présentes CGV, toute Prestation est payable d'avance. Aucun travail n'est engagé ni livré
          tant que la fraction de prix correspondante n'a pas été effectivement créditée sur le
          compte bancaire de Lucid-Lab.
        </p>
        <p>
          Les Parties conviennent expressément que cette modalité de paiement anticipé constitue un
          délai de paiement négatif convenu d'un commun accord, dérogatoire au délai supplétif
          prévu à l'article L. 441-10 du Code de commerce. Le Client reconnaît que cette modalité
          est la contrepartie essentielle du tarif consenti par Lucid-Lab.
        </p>

        <h3>5.2 Modalité one-shot</h3>
        <p>
          Le prix total HT, majoré de la TVA applicable, est exigible en une seule fois, à la
          signature du Bon de Commande et au plus tard avant le démarrage de la Prestation. La
          facture pro forma est émise concomitamment à la signature ; la facture définitive est
          émise dès réception du paiement.
        </p>

        <h3>5.3 Modalité mensuelle 12 mois</h3>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            La première mensualité est exigible à la signature du Bon de Commande et avant tout
            démarrage.
          </li>
          <li>
            Les onze (11) mensualités suivantes sont exigibles chacune au plus tard le 1er du mois
            concerné, par virement SEPA à l'initiative du Client.
          </li>
          <li>Une facture est émise au début de chaque mois.</li>
          <li>
            Tout retard de paiement d'une mensualité suspend automatiquement la fourniture des
            Prestations jusqu'à régularisation, sans préjudice des autres droits de Lucid-Lab
            prévus à l'Article 6.
          </li>
        </ul>

        <h3>5.4 Moyens de paiement</h3>
        <p>
          Les paiements sont effectués exclusivement par virement SEPA sur le compte bancaire de
          Lucid-Lab :
        </p>
        <div className="my-4 rounded-lg border border-zinc-200 bg-zinc-50 px-5 py-4 text-[14px] not-prose">
          <p className="mb-1 text-zinc-700"><strong>Titulaire :</strong> Lucid-Lab</p>
          <p className="mb-1 text-zinc-700"><strong>IBAN :</strong> FR76 1732 8844 0043 2662 8862 178</p>
          <p className="mb-1 text-zinc-700"><strong>BIC :</strong> SWNBFR22</p>
          <p className="text-zinc-700"><strong>Banque :</strong> Swan</p>
        </div>
        <p>
          Tout autre moyen de paiement (chèque, espèces, carte bancaire) est exclu, sauf accord
          écrit préalable de Lucid-Lab. Les frais bancaires éventuels (notamment virements
          internationaux) sont à la charge exclusive du Client.
        </p>

        <h3>5.5 Imputation des paiements</h3>
        <p>
          Conformément à l'article 1342-10 du Code civil, et par dérogation à l'imputation légale,
          Lucid-Lab se réserve le droit d'imputer prioritairement les paiements reçus sur les frais,
          pénalités et indemnités de recouvrement, puis sur les factures les plus anciennes,
          indépendamment de la mention portée par le Client lors du règlement.
        </p>

        <h3>5.6 Mentions de facturation</h3>
        <p>
          Toutes les factures émises par Lucid-Lab comportent, conformément à l'article 242 nonies A
          de l'annexe II du Code général des impôts et à l'article L. 441-9 du Code de commerce,
          les mentions suivantes : identification complète des Parties, numéro de facture
          séquentiel, date d'émission, date de vente ou de Prestation, désignation et quantité des
          Prestations, prix unitaires HT, taux et montant de la TVA, prix total HT et TTC, date
          d'échéance, rappel des pénalités de retard et de l'indemnité forfaitaire de recouvrement.
        </p>

        <h2>Article 6 — Retard de paiement, pénalités et clause pénale</h2>

        <h3>6.1 Intérêts moratoires (article L. 441-10 du Code de commerce)</h3>
        <p>
          Tout retard dans le paiement d'une facture, d'une mensualité ou d'une avance, par rapport
          à la date d'exigibilité fixée, entraîne de plein droit, dès le jour suivant la date
          d'exigibilité et sans qu'une mise en demeure préalable soit nécessaire, l'application
          d'intérêts moratoires calculés sur le montant TTC de la somme due, au taux d'intérêt
          appliqué par la Banque Centrale Européenne à son opération de refinancement la plus
          récente majoré de dix (10) points de pourcentage.
        </p>
        <p>
          À titre indicatif, le taux applicable à la date des présentes CGV est d'environ 14,5 %
          annuel ; il évolue automatiquement avec le taux directeur de la BCE, sans formalité.
        </p>

        <h3>6.2 Indemnité forfaitaire de recouvrement (article D. 441-5 du Code de commerce)</h3>
        <p>
          Une indemnité forfaitaire pour frais de recouvrement de quarante (40) euros est due de
          plein droit, sans formalité, par le Client professionnel en retard de paiement, pour
          chaque facture concernée. Lorsque les frais de recouvrement effectivement exposés sont
          supérieurs à ce montant, Lucid-Lab pourra réclamer une indemnisation complémentaire sur
          présentation des justificatifs.
        </p>

        <h3>6.3 Indemnité forfaitaire contractuelle de gestion du retard</h3>
        <p>
          En complément des intérêts moratoires et de l'indemnité forfaitaire légale de
          recouvrement, et au titre des frais administratifs internes occasionnés par le traitement
          du retard (relances, mobilisation comptable, immobilisation de trésorerie, désorganisation
          de la planification opérationnelle), les Parties conviennent d'une indemnité forfaitaire
          contractuelle de deux cent cinquante (250) euros par facture en retard.
        </p>
        <p>
          Cette indemnité est de nature de clause pénale au sens de l'article 1231-5 du Code civil.
          Les Parties reconnaissent expressément qu'elle constitue la juste évaluation forfaitaire
          du préjudice administratif subi par Lucid-Lab du fait du retard, qu'elle est
          proportionnée à la gravité du manquement et qu'elle n'apparaît pas manifestement excessive
          au regard du montant des Prestations facturées.
        </p>

        <h3>6.4 Cumul des pénalités</h3>
        <p>
          Les intérêts moratoires (art. 6.1), l'indemnité forfaitaire légale de recouvrement
          (art. 6.2) et l'indemnité forfaitaire contractuelle de gestion du retard (art. 6.3) sont
          cumulables entre eux et avec toute indemnisation complémentaire dûment justifiée.
        </p>

        <h3>6.5 Suspension des Prestations et déchéance du terme</h3>
        <p>En cas de retard supérieur à dix (10) jours, Lucid-Lab pourra :</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            Suspendre immédiatement et sans préavis la fourniture des Prestations, jusqu'à
            régularisation intégrale (principal, intérêts, indemnités).
          </li>
          <li>
            Pour la modalité mensuelle 12 mois, prononcer la déchéance du terme : la totalité des
            mensualités restant dues jusqu'au terme du Contrat devient immédiatement exigible.
          </li>
          <li>
            Procéder à la rétention des Livrables et codes d'accès non payés, conformément à
            l'Article 8.
          </li>
          <li>
            Engager toute procédure de recouvrement amiable ou contentieuse, les frais d'huissier,
            d'avocat et de justice restant à la charge du Client défaillant.
          </li>
        </ul>

        <h2>Article 7 — Exécution des Prestations</h2>

        <h3>7.1 Engagement de Lucid-Lab</h3>
        <p>
          Lucid-Lab met à disposition du Client son expertise, ses méthodes éprouvées et l'ensemble
          de ses moyens pour mener à bien la mission. À ce titre, Lucid-Lab s'engage à exécuter les
          Prestations avec diligence, sérieux et professionnalisme, conformément aux règles de l'art
          de sa profession et aux meilleurs standards du marché applicables aux activités de conseil,
          de développement et d'intégration IA.
        </p>
        <p>
          Conformément à l'usage applicable aux prestations intellectuelles de conseil et de
          développement, et compte tenu du caractère partagé de la maîtrise des facteurs de réussite
          (qualité des informations transmises par le Client, dépendance à des services tiers,
          évolutions du marché et des technologies), les obligations de Lucid-Lab constituent des
          obligations de moyens renforcés : Lucid-Lab s'engage à mettre en œuvre tous les moyens
          raisonnablement nécessaires à la bonne exécution des Prestations, sans toutefois garantir
          un résultat précis ou un niveau de performance commerciale, lorsque celui-ci dépend de
          facteurs extérieurs (comportement du marché, algorithme des régies publicitaires,
          évolutions des modèles d'IA tiers).
        </p>
        <p>
          Lucid-Lab est libre de la méthode, des outils et des moyens employés pour fournir la
          Prestation. Lucid-Lab peut recourir à des sous-traitants sélectionnés, sous sa
          responsabilité, sans accord préalable du Client. Les éventuelles obligations de résultat
          sont expressément identifiées dans le Bon de Commande lorsqu'elles sont consenties.
        </p>

        <h3>7.2 Obligations du Client</h3>
        <p>Le Client s'engage à :</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Coopérer activement et de bonne foi avec Lucid-Lab.</li>
          <li>
            Désigner un interlocuteur unique disposant des pouvoirs nécessaires pour valider les
            livrables et les décisions opérationnelles.
          </li>
          <li>
            Fournir dans les délais requis l'ensemble des informations, accès, comptes, contenus,
            validations et ressources nécessaires à la bonne exécution des Prestations.
          </li>
          <li>
            Garantir l'exactitude des éléments transmis et leur conformité aux droits de propriété
            intellectuelle et au cadre légal applicable.
          </li>
          <li>Effectuer les paiements aux échéances convenues.</li>
        </ul>

        <h3>7.3 Retards imputables au Client</h3>
        <p>
          Tout retard dans la fourniture des éléments par le Client, dans les validations ou dans
          les paiements suspend de plein droit les délais d'exécution de Lucid-Lab et n'engage pas
          la responsabilité de cette dernière. Le calendrier sera ajusté en conséquence, sans que le
          Client puisse réclamer une quelconque indemnité.
        </p>

        <h3>7.4 Livraison et recette</h3>
        <p>
          Les Livrables sont remis au Client par tout moyen approprié (transfert électronique, accès
          à un dépôt Git, publication sur un environnement de recette).
        </p>
        <p>
          Sauf délai différent indiqué dans le Bon de Commande, le Client dispose d'un délai de
          sept (7) jours calendaires à compter de la mise à disposition du Livrable pour formuler
          ses éventuelles réserves par écrit, motivées et précises. À défaut de réserve dans ce
          délai, le Livrable est réputé accepté tacitement et sans réserve. Les corrections
          demandées dans le délai de recette sont apportées par Lucid-Lab dans un délai raisonnable.
          Les demandes hors périmètre initial donnent lieu à avenant et facturation complémentaire.
        </p>

        <h2>Article 8 — Propriété intellectuelle</h2>

        <h3>8.1 Outils, méthodes et savoir-faire de Lucid-Lab</h3>
        <p>
          Lucid-Lab demeure seul et exclusif titulaire de l'ensemble de ses outils, méthodes,
          savoir-faire, frameworks, scripts génériques, briques logicielles réutilisables,
          bibliothèques internes, prompts système, configurations d'agents et de toute autre
          production préexistante ou indépendante des Prestations fournies au Client. Aucune cession
          de droits ni licence n'est consentie sur ces éléments, sauf accord écrit exprès.
        </p>

        <h3>8.2 Cession exclusive limitée — Livrables spécifiques</h3>
        <p>
          Sous réserve du paiement intégral et inconditionnel du prix HT correspondant à la
          Prestation et conformément aux articles L. 131-3 et suivants du Code de la propriété
          intellectuelle, Lucid-Lab cède au Client, à titre exclusif, les droits patrimoniaux
          suivants sur les Livrables spécifiques créés à son intention dans le périmètre du Contrat :
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>droit de reproduction (par tout procédé et sur tout support, numérique ou matériel) ;</li>
          <li>droit de représentation et de mise à disposition au public ;</li>
          <li>
            droit d'adaptation, modification et traduction, à l'exclusion de toute dénaturation ;
          </li>
          <li>droit d'exploitation commerciale interne.</li>
        </ul>
        <p>Cette cession est consentie pour la durée légale de protection des droits d'auteur et pour le monde entier.</p>
        <p>
          La cession est strictement limitée à l'usage et à la destination définis dans le Bon de
          Commande. Tout usage en dehors de cette destination (revente, sous-licence ou cession à un
          tiers, exploitation au profit d'une activité concurrente, intégration dans un produit
          commercialisé par le Client à des tiers) est expressément exclu et nécessite un avenant
          écrit signé par Lucid-Lab moyennant rémunération complémentaire.
        </p>
        <p>
          Tant que le prix n'est pas intégralement payé, aucun droit d'usage n'est consenti et
          Lucid-Lab se réserve le droit d'interdire toute exploitation des Livrables, y compris au
          moyen d'une revendication par voie d'huissier.
        </p>

        <h3>8.3 Éléments tiers et logiciels open source</h3>
        <p>
          Certains Livrables peuvent intégrer des composants tiers (logiciels open source,
          bibliothèques, services SaaS, API). Ces composants restent régis par leurs licences
          propres dont le Client est tenu de respecter les termes. Lucid-Lab informe le Client des
          licences applicables sur demande.
        </p>

        <h3>8.4 Référence commerciale</h3>
        <p>
          Sauf opposition écrite du Client adressée à Lucid-Lab dans les trente (30) jours suivant
          la signature du Bon de Commande, Lucid-Lab est autorisée à mentionner le nom, le logo du
          Client et une description sommaire des Prestations réalisées dans ses références
          commerciales (site web, plaquettes, propositions, profils LinkedIn, etc.).
        </p>

        <h2>Article 9 — Confidentialité</h2>
        <p>
          Chacune des Parties s'engage à considérer comme strictement confidentielles, et à ne pas
          divulguer à des tiers, l'ensemble des informations techniques, commerciales, financières,
          juridiques, stratégiques et opérationnelles communiquées par l'autre Partie dans le cadre
          du Contrat, sauf les informations relevant du domaine public, déjà connues de la Partie
          réceptrice ou dont la divulgation est imposée par la loi ou une décision de justice.
        </p>
        <p>
          Cet engagement s'applique pendant toute la durée du Contrat et pendant une période de
          cinq (5) ans suivant sa cessation, pour quelque cause que ce soit. Lucid-Lab impose les
          mêmes obligations à l'ensemble de ses préposés et sous-traitants ayant accès à des
          informations confidentielles du Client.
        </p>

        <h2>Article 10 — Protection des données personnelles (RGPD)</h2>

        <h3>10.1 Responsable de traitement et sous-traitant</h3>
        <p>
          Pour les données personnelles dont le Client détermine les finalités et les moyens du
          traitement, le Client est le responsable de traitement au sens du Règlement (UE) 2016/679
          (RGPD) et Lucid-Lab agit en qualité de sous-traitant. Les Parties signent à cette fin un
          accord de sous-traitance des données (DPA) annexé au Contrat de Prestation, conformément
          à l'article 28 du RGPD.
        </p>
        <p>
          Pour les données personnelles que Lucid-Lab traite pour son propre compte (gestion
          comptable, relation commerciale, prospection), Lucid-Lab est responsable de traitement et
          applique sa politique décrite dans les{' '}
          <Link href="/mentions-legales" className="text-zinc-900 underline underline-offset-2">
            mentions légales
          </Link>.
        </p>

        <h3>10.2 Engagements de Lucid-Lab en tant que sous-traitant</h3>
        <p>Lucid-Lab s'engage à :</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            Traiter les données personnelles uniquement sur instruction documentée du Client.
          </li>
          <li>
            Garantir la confidentialité des données et la formation des personnes habilitées à les
            traiter.
          </li>
          <li>
            Mettre en œuvre des mesures techniques et organisationnelles appropriées (chiffrement,
            contrôle d'accès, sauvegardes, authentification forte des administrateurs).
          </li>
          <li>
            Notifier au Client toute violation de données dans un délai de soixante-douze (72)
            heures suivant sa détection.
          </li>
          <li>Restituer ou détruire les données à la fin du Contrat, au choix du Client.</li>
        </ul>

        <h3>10.3 Sous-traitants ultérieurs</h3>
        <p>
          Lucid-Lab pourra recourir à des sous-traitants ultérieurs (hébergeurs, services SaaS)
          après information préalable du Client, qui dispose d'un droit d'opposition motivé.
        </p>

        <h3>10.4 Transferts hors Union européenne</h3>
        <p>
          Certains sous-traitants ultérieurs de Lucid-Lab peuvent être établis en dehors de
          l'Espace économique européen (notamment les fournisseurs de modèles d'IA et hébergeurs
          cloud). Lucid-Lab garantit que ces transferts sont encadrés par les Clauses Contractuelles
          Types (CCT) de la Commission européenne du 4 juin 2021 (décision 2021/914/UE) et, le cas
          échéant, par l'adhésion du sous-traitant au EU-US Data Privacy Framework.
        </p>

        <h2>Article 11 — Garanties et limitation de responsabilité</h2>

        <h3>11.1 Garanties</h3>
        <p>
          Lucid-Lab garantit la conformité des Livrables aux spécifications expressément convenues
          dans le Bon de Commande, pendant une durée de trente (30) jours à compter de la livraison,
          à l'exclusion de toute autre garantie tacite ou implicite.
        </p>
        <p>
          Sont exclues de la garantie : les anomalies résultant d'une modification des Livrables par
          le Client ou un tiers, d'une utilisation non conforme aux spécifications, d'une mise à
          jour d'un service tiers (OpenAI, Meta, n8n, etc.) modifiant unilatéralement les
          comportements attendus, d'un cas de force majeure ou du fait du Client.
        </p>

        <h3>11.2 Limitation de responsabilité — clause Chronopost-proof</h3>
        <p>
          La responsabilité de Lucid-Lab, toutes causes confondues, est expressément limitée au
          montant HT effectivement perçu par Lucid-Lab au titre du Contrat concerné au cours des
          douze (12) mois précédant le fait générateur du dommage (la "Limite Standard").
        </p>
        <p>
          Conformément à la jurisprudence Chronopost (Cass. com. 22 octobre 1996, n° 93-18.632) et
          à l'article 1170 du Code civil, la Limite Standard peut être écartée si elle privait de sa
          substance une obligation essentielle du Contrat. Dans cette hypothèse, les Parties
          conviennent que la responsabilité totale de Lucid-Lab demeurera limitée, en tout état de
          cause, au plafond effectif de la couverture d'assurance Responsabilité Civile
          Professionnelle souscrite par Lucid-Lab, soit cent mille euros (100 000 €) par période
          d'assurance à la date des présentes CGV. Cette limite constitue une stipulation essentielle
          et déterminante du consentement de Lucid-Lab.
        </p>

        <h3>11.3 Dommages indirects</h3>
        <p>
          Sont expressément exclus de toute indemnisation, dans toute la mesure permise par la loi :
          les pertes d'exploitation, le manque à gagner, l'atteinte à la réputation, la perte de
          clientèle, la perte de données, les dommages indirects et immatériels non consécutifs,
          ainsi que tous dommages résultant d'une mauvaise utilisation des Livrables par le Client
          ou ses préposés.
        </p>

        <h3>11.4 Dol, faute lourde et dommages corporels</h3>
        <p>
          Les limitations et exclusions du présent Article 11 ne s'appliquent pas en cas de dol ou
          de faute lourde caractérisée de Lucid-Lab, ni en cas de dommages corporels qui lui
          seraient imputables, conformément aux dispositions légales d'ordre public.
        </p>

        <h3>11.5 Couverture assurantielle</h3>
        <p>
          Lucid-Lab a souscrit une assurance Responsabilité Civile Professionnelle auprès de
          Hiscox SA (succursale française, 49 avenue de l'Opéra, 75002 Paris, RCS Paris
          833 546 989), par l'intermédiaire du courtier LegalPlace (ORIAS n° 17 004 808), sous le
          numéro de police RCPLP 3695175450 :
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Plafond RC Professionnelle : 100 000 € par période d'assurance.</li>
          <li>Plafond RC Exploitation et Employeur : 10 000 000 € par sinistre.</li>
          <li>Protection juridique : 50 000 € TTC par litige (France, Monaco, Andorre).</li>
          <li>Couverture territoriale : monde entier hors États-Unis et Canada.</li>
        </ul>

        <h3>11.6 Particularités liées à l'IA et aux automatisations</h3>
        <p>
          Le Client reconnaît expressément que les services d'IA générative, les agents
          conversationnels et les automatisations métier reposent sur des technologies
          probabilistes qui peuvent produire des résultats imprévisibles, inexacts ou inappropriés
          ("hallucinations", dérives, biais). Lucid-Lab met en œuvre les meilleures pratiques de
          conception (garde-fous, prompts système, tests) mais ne peut garantir l'absence totale
          d'erreur ni la qualité absolue des productions générées.
        </p>
        <p>
          Le Client demeure seul responsable des décisions et des communications réalisées sur la
          base des Livrables d'IA, et s'engage à mettre en place les contrôles humains appropriés
          (validation, modération, supervision) avant toute publication ou exploitation en
          production.
        </p>

        <h2>Article 12 — Force majeure</h2>
        <p>
          Aucune des Parties ne pourra être tenue responsable d'un manquement à ses obligations
          résultant d'un cas de force majeure au sens de l'article 1218 du Code civil, c'est-à-dire
          d'un événement extérieur, imprévisible lors de la conclusion du Contrat et irrésistible
          dans son exécution. Sont notamment considérés comme tels : guerre, attentat, émeute,
          catastrophe naturelle, épidémie ou pandémie déclarée, blocage de moyens de transport,
          défaillance majeure et durable des infrastructures publiques de télécommunication ou
          d'énergie, décision d'une autorité publique restreignant l'activité.
        </p>
        <p>
          Constituent également un cas assimilé à la force majeure : l'indisponibilité prolongée et
          caractérisée d'un service tiers essentiel (modèle de langage OpenAI ou Anthropic,
          plateforme Meta, n8n, hébergeur cloud, fournisseur d'API) sur lequel repose techniquement
          la Prestation, lorsque cette indisponibilité n'est pas imputable à Lucid-Lab et qu'aucune
          solution alternative équivalente n'est immédiatement disponible.
        </p>
        <p>
          La Partie affectée s'engage à notifier l'autre dans les meilleurs délais. Si l'événement
          perdure plus de soixante (60) jours, chaque Partie pourra résilier le Contrat de plein
          droit, sans indemnité.
        </p>

        <h2>Article 13 — Durée, résiliation et conséquences</h2>

        <h3>13.1 Durée</h3>
        <p>
          Le Contrat entre en vigueur à la signature du Bon de Commande et à la réception du
          premier paiement. Sa durée est précisée dans le Bon de Commande :
        </p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            <strong>Modalité one-shot</strong> : durée nécessaire à l'exécution complète des
            Prestations, sans engagement de durée supplémentaire.
          </li>
          <li>
            <strong>Modalité mensuelle 12 mois</strong> : engagement ferme et irrévocable de douze
            (12) mois à compter du démarrage effectif.
          </li>
        </ul>

        <h3>13.2 Résiliation pour faute</h3>
        <p>
          Chaque Partie peut résilier le Contrat de plein droit, sans indemnité au profit de
          l'autre, en cas de manquement grave de l'autre Partie à ses obligations, non régularisé
          dans un délai de quinze (15) jours à compter de la réception d'une mise en demeure écrite
          restée sans effet.
        </p>
        <p>
          Constituent notamment des manquements graves : pour le Client, le défaut de paiement après
          mise en demeure restée sans effet pendant dix (10) jours, l'absence persistante de
          coopération empêchant l'exécution des Prestations, la violation des obligations de
          confidentialité ou de propriété intellectuelle ; pour Lucid-Lab, l'inexécution
          caractérisée et non justifiée des Prestations.
        </p>

        <h3>13.3 Résiliation anticipée par le Client (modalité mensuelle 12 mois) — clause pénale</h3>
        <p>
          En cas de résiliation anticipée du Contrat à l'initiative du Client pour toute autre cause
          que la faute grave de Lucid-Lab ou la force majeure, la totalité des mensualités restant
          dues jusqu'au terme du Contrat devient immédiatement exigible, à titre d'indemnité
          forfaitaire et libératoire.
        </p>
        <p>
          Cette clause constitue une clause pénale au sens de l'article 1231-5 du Code civil, dont
          les Parties reconnaissent expressément qu'elle constitue la juste compensation du manque à
          gagner subi par Lucid-Lab du fait de la rupture anticipée et du rabais consenti en
          contrepartie de l'engagement de durée.
        </p>

        <h3>13.4 Conséquences de la résiliation</h3>
        <p>À la cessation du Contrat, pour quelque cause que ce soit :</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>
            Lucid-Lab cesse toute prestation et procède à la remise des Livrables payés au Client.
          </li>
          <li>
            Le Client verse à Lucid-Lab toutes les sommes restant dues (y compris l'indemnité
            forfaitaire éventuelle de l'Article 13.3).
          </li>
          <li>
            Les obligations de confidentialité, de propriété intellectuelle, de protection des
            données et de non-sollicitation survivent à la résiliation dans les conditions prévues
            aux articles correspondants.
          </li>
        </ul>

        <h2>Article 14 — Données personnelles du Client (relation contractuelle)</h2>
        <p>
          Les données personnelles collectées dans le cadre de l'exécution du Contrat
          (identification, contact, suivi des prestations, facturation) sont traitées par Lucid-Lab
          en qualité de responsable de traitement, sur la base de l'exécution du Contrat et du
          respect d'obligations légales (conservation comptable). Elles sont conservées pendant la
          durée du Contrat puis archivées pendant dix (10) ans au titre des obligations comptables
          et fiscales (article L. 123-22 du Code de commerce).
        </p>
        <p>
          Le Client peut exercer ses droits d'accès, de rectification, d'effacement, d'opposition,
          de limitation et de portabilité en écrivant à{' '}
          <a
            href="mailto:info@lucid-lab.fr"
            className="text-zinc-900 underline underline-offset-2"
          >
            info@lucid-lab.fr
          </a>.
        </p>

        <h2>Article 15 — Réversibilité et migration</h2>
        <p>
          En fin de Contrat, Lucid-Lab s'engage, sur demande écrite du Client formulée dans les
          trente (30) jours suivant la cessation, à fournir au Client l'ensemble des éléments
          nécessaires à la reprise des Livrables payés par un tiers (codes sources, exports de
          données, documentation technique, comptes administrateurs). Ces opérations de réversibilité
          sont fournies pendant une période maximale de soixante (60) jours, à un tarif jour-homme
          préférentiel défini au Bon de Commande ou, à défaut, au tarif standard de Lucid-Lab.
        </p>

        <h2>Article 16 — Non-sollicitation</h2>
        <p>
          Pendant la durée du Contrat et pendant les douze (12) mois suivant son terme, chacune des
          Parties s'interdit de solliciter, débaucher, embaucher ou faire intervenir, directement ou
          indirectement, tout collaborateur ou sous-traitant de l'autre Partie ayant participé
          activement à l'exécution du Contrat, sauf accord écrit préalable de l'autre Partie.
        </p>
        <p>
          En cas de violation, la Partie défaillante versera à l'autre une indemnité forfaitaire
          égale à six (6) mois de rémunération brute ou de facturation HT du collaborateur ou
          sous-traitant concerné, à titre de clause pénale au sens de l'article 1231-5 du Code
          civil.
        </p>

        <h2>Article 17 — Cession du Contrat</h2>
        <p>
          Le Contrat ne peut être cédé par le Client à un tiers sans l'accord écrit préalable de
          Lucid-Lab. Lucid-Lab peut céder le Contrat à toute société affiliée ou dans le cadre
          d'une opération de restructuration, sous réserve d'en informer le Client.
        </p>

        <h2>Article 18 — Modification des CGV</h2>
        <p>
          Lucid-Lab se réserve le droit de modifier les présentes CGV à tout moment. Les CGV
          applicables à un Contrat donné sont celles en vigueur à la date de signature du Bon de
          Commande. Les modifications postérieures ne s'appliquent aux Contrats en cours qu'avec
          l'accord écrit du Client.
        </p>

        <h2>Article 19 — Nullité partielle, intégralité et prescription</h2>
        <p>
          Si une stipulation des présentes CGV était déclarée nulle ou inapplicable par une
          juridiction compétente, cette nullité n'affecterait pas la validité des autres
          stipulations, qui resteraient pleinement applicables. Les Parties s'engagent à négocier
          de bonne foi une stipulation de remplacement reflétant au plus près l'intention initiale.
        </p>
        <p>
          Les présentes CGV, le Bon de Commande ou Contrat de Prestation et leurs avenants
          constituent l'intégralité de l'accord entre les Parties et annulent tout accord, écrit ou
          verbal, antérieur ayant le même objet.
        </p>
        <p>
          Conformément à l'article L. 110-4 du Code de commerce, toute action des Parties dérivant
          du Contrat se prescrit par cinq (5) ans à compter du jour où le titulaire du droit a connu
          ou aurait dû connaître les faits lui permettant de l'exercer.
        </p>

        <h2>Article 20 — Médiation, droit applicable et juridiction</h2>

        <h3>20.1 Médiation préalable</h3>
        <p>
          En cas de différend, les Parties s'engagent à tenter, préalablement à toute action
          contentieuse, une résolution amiable par voie de négociation directe dans un délai de
          trente (30) jours, puis, à défaut d'accord, par recours à un médiateur conventionnel
          choisi d'un commun accord, conformément aux articles 1530 et suivants du Code de
          procédure civile.
        </p>

        <h3>20.2 Droit applicable</h3>
        <p>
          Les présentes CGV et le Contrat sont régis par le droit français, à l'exclusion de toute
          autre législation, y compris la Convention de Vienne sur la vente internationale de
          marchandises (CISG).
        </p>

        <h3>20.3 Juridiction compétente</h3>
        <p>
          À défaut d'accord amiable, tout litige relatif à la formation, l'exécution,
          l'interprétation ou la cessation du Contrat sera de la compétence exclusive du Tribunal
          des activités économiques de Paris (Greffe : 1 quai de la Corse, 75198 Paris Cedex 04),
          même en cas de pluralité de défendeurs, d'appel en garantie ou de procédure de référé.
          Cette clause attributive de juridiction est expressément acceptée par le Client en sa
          qualité de professionnel.
        </p>

        <p className="mt-10 text-[13px] italic text-zinc-400">
          Fait à Paris, en français, le 15 mai 2026. Pour Lucid-Lab — Periscope-X SARL, Président.
        </p>
      </div>
    </main>
  )
}
