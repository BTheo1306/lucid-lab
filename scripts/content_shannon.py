"""
Proposition d'accompagnement valant Bon de Commande
Shannon / Accompagnement e-commerce 3 boutiques Shopify + Meta Ads
Référence : PROP-2026-011 · 11 juin 2026

Tarifs HT (TVA 20 %). Coordonnées légales du Client = placeholders [À COMPLÉTER]
à renseigner avant signature.
"""

CONTENT = {
    "filename":      "11_PropositionBDC-Shannon-Ecommerce.pdf",
    "template_name": "proposition_bdc_template.html",
    "client_name":   "Shannon [À COMPLÉTER]",
    "client_short":  "Shannon",
    "subtitle": (
        "Accompagnement e-commerce 12 mois : refonte des 3 boutiques Shopify, "
        "SEO et pilotage Meta Ads."
    ),

    # ── Méta ──────────────────────────────────────────────────────────────────
    "meta": [
        ("Client",    "Shannon [À COMPLÉTER]"),
        ("Date",      "11 juin 2026"),
        ("Contact",   "Lucid-Lab, info@lucid-lab.fr"),
        ("Référence", "PROP-2026-011"),
        ("Validité",  "30 jours à compter de la date d'émission"),
    ],

    # ── Parties ───────────────────────────────────────────────────────────────
    "client_block_bdc": (
        "Le Client : Shannon [NOM COMPLET À COMPLÉTER], [STRUCTURE / SOCIÉTÉ À COMPLÉTER], "
        "siège social : [ADRESSE À COMPLÉTER], immatriculée sous le numéro SIRET "
        "[SIRET À COMPLÉTER], représenté(e) par [REPRÉSENTANT À COMPLÉTER] "
        "en qualité de [QUALITÉ À COMPLÉTER]."
    ),

    # ── Objectif ──────────────────────────────────────────────────────────────
    "objectif": [
        (
            "Le Client opère trois boutiques e-commerce sous Shopify, sur trois marchés distincts : "
            "perruques, accessoires pour animaux, et produits pour personnes autistes ou présentant un TDAH. "
            "Ces sites, développés par un prestataire précédent, présentent aujourd'hui des défauts "
            "structurels à corriger en priorité : expérience utilisateur, fiches produits, performance "
            "technique, et absence de stratégie d'acquisition et de référencement."
        ),
        (
            "L'objectif de cet accompagnement est double : (i) remettre les trois boutiques à niveau ("
            "refonte, optimisation du tunnel de conversion, SEO) puis (ii) construire et piloter une "
            "acquisition payante rentable via Meta Ads (Facebook / Instagram), avec une production de "
            "contenu publicitaire à la demande."
        ),
        (
            "La stratégie retenue est une approche en deux phases : Phase 1 (Mois 1 à 3), intensive, "
            "consacrée à la refonte des sites et au lancement des premières campagnes ; Phase 2 "
            "(Mois 4 à 12), de run, d'optimisation continue et de scaling, sur la base des performances "
            "observées. Engagement total : 12 mois."
        ),
    ],

    # ── Périmètre ─────────────────────────────────────────────────────────────
    "perimetre": [
        {
            "title": "Refonte et optimisation des 3 boutiques Shopify",
            "bullets": [
                "Audit complet des trois boutiques existantes : structure, performance, tunnel de conversion, version mobile.",
                "Refonte UX/UI et correction des problèmes bloquants (navigation, fiches produits, panier, checkout).",
                "Optimisation des fiches produits : structuration, copywriting, cohérence et qualité des visuels.",
                "Optimisation technique : vitesse de chargement, responsive mobile, mise en place du tracking (pixels, conversions, analytics).",
            ],
        },
        {
            "title": "SEO et acquisition organique",
            "bullets": [
                "Audit SEO des trois sites : mots-clés, architecture, balisage, contenu.",
                "Optimisation on-page et recommandations de contenu par boutique.",
                "Mise en place du suivi de positionnement et des fondations de référencement durable.",
            ],
        },
        {
            "title": "Publicité Meta (Facebook / Instagram)",
            "bullets": [
                "Configuration des comptes Meta Ads : Business Manager, pixels, audiences, catalogues produits.",
                "Création, lancement et pilotage des campagnes par boutique.",
                "Suivi des performances et optimisation continue : A/B testing, scaling des campagnes gagnantes.",
                "Production des créations publicitaires (visuels / vidéos) à la demande, facturée à l'unité (voir Investissement).",
            ],
        },
        {
            "title": "Contenu, communautés et méthode de vente",
            "bullets": [
                "Recommandations sur la qualité des visuels et vidéos produits : standards, briefs de production.",
                "Stratégie de présence et d'animation des communautés propres à chaque niche.",
                "Cadrage des offres et des méthodes de vente pour maximiser la conversion.",
            ],
        },
    ],

    # ── Calendrier ────────────────────────────────────────────────────────────
    "timeline": [
        {"date": "Mois 1",     "label": "DÉMARRAGE", "description": "Audit + refonte"},
        {"date": "Mois 2",     "label": None,        "description": "Sites + SEO"},
        {"date": "Mois 3",     "label": "LANCEMENT",  "description": "Campagnes Meta"},
        {"date": "Mois 4-6",   "label": None,        "description": "Run + scaling"},
        {"date": "Mois 7-9",   "label": None,        "description": "Optimisation"},
        {"date": "Mois 10-12", "label": "BILAN",      "description": "Consolidation"},
    ],
    "calendrier": [
        {
            "label": "Phase 1 : Mois 1 à 3 · Refonte & Lancement",
            "text": (
                "Audit et refonte des trois boutiques Shopify, optimisation des fiches produits et du "
                "tunnel de conversion, fondations SEO, configuration des comptes Meta Ads et lancement "
                "des premières campagnes. Tarif : 600 € HT / mois (450 € refonte des 3 sites + 150 € Meta Ads)."
            ),
        },
        {
            "label": "Phase 2 : Mois 4 à 12 · Run & Optimisation",
            "text": (
                "Pilotage continu des campagnes Meta Ads, optimisation SEO, maintenance et améliorations "
                "des sites, reporting mensuel de performance et scaling des leviers rentables. "
                "Tarif : 300 € HT / mois, tout compris."
            ),
        },
    ],
    "livrables": [
        ("Mois 1",      "Audit des 3 boutiques · Plan de refonte priorisé · Démarrage de la refonte"),
        ("Mois 2-3",    "Refonte et optimisation des 3 sites · Fondations SEO · Configuration Meta Ads · Lancement des premières campagnes"),
        ("Mois 4-12",   "Pilotage Meta Ads continu · Optimisation SEO · Maintenance et améliorations des sites · Reporting mensuel de performance"),
    ],

    # ── Investissement ────────────────────────────────────────────────────────
    "investissement": [
        ("Phase 1 · Refonte des 3 sites (Mois 1-3)",   "450,00 € HT / mois (150 €/site)"),
        ("Phase 1 · Pilotage Meta Ads (Mois 1-3)",     "150,00 € HT / mois"),
        ("Phase 2 · Run tout compris (Mois 4-12)",     "300,00 € HT / mois"),
        ("Création publicitaire (à la demande)",       "100,00 € HT / pub"),
        ("Total engagement fixe sur 12 mois",            "4 500,00 € HT"),
        ("TVA (20 %)",                                 "900,00 €"),
        ("Total TTC (hors créations pub)",             "5 400,00 € TTC"),
        ("Modalité",                                   "Abonnement mensuel · engagement 12 mois"),
        ("Échéancier",                                 "Facturation mensuelle à l'avance · Phase 1 : 600 € HT/mois (720 € TTC) · Phase 2 : 300 € HT/mois (360 € TTC)"),
        ("Conditions de paiement",                     "Virement SEPA, à l'avance (voir CGV article 5)"),
        ("Pénalités de retard",                        "Intérêts BCE +10 pts + 40 € (D. 441-5 Cciv)"),
    ],

    # ── Coûts exclus ──────────────────────────────────────────────────────────
    "couts_exclus": {
        "intro": (
            "Le prix de la Prestation rémunère exclusivement le travail de Lucid-Lab. "
            "Restent à votre charge directe les coûts variables suivants :"
        ),
        "bullets": [
            "Le budget média Meta (dépenses publicitaires facturées par Meta sur votre compte) ;",
            "Les abonnements Shopify des trois boutiques et les applications tierces éventuelles ;",
            "La production de visuels ou vidéos nécessitant un prestataire externe (shooting, tournage) ;",
            "Les crédits d'outils IA ou SEO tiers éventuels (génération de visuels, suivi de positionnement) ;",
            "Les noms de domaine et frais d'hébergement spécifiques hors Shopify.",
        ],
        "outro": "Une estimation indicative de ces coûts vous est fournie sur demande, sans engagement de plafond.",
    },

    # ── Conditions de paiement ────────────────────────────────────────────────
    "ref_client_rib": "PROP-2026-011 / Shannon",

    # ── Prochaines étapes ─────────────────────────────────────────────────────
    "prochaines_etapes": [
        "Planifier un appel de cadrage pour valider le périmètre par boutique, les priorités de refonte et les premiers jalons.",
        "Compléter et signer la présente Proposition valant Bon de Commande, et fournir les coordonnées légales définitives.",
        "Communiquer les accès nécessaires : back-office Shopify des 3 boutiques, comptes Meta Business / Ads, analytics.",
        "Procéder au premier versement mensuel (Phase 1 : 600,00 € HT, soit 720,00 € TTC) pour déclencher le démarrage.",
    ],

    # ── Cadre contractuel ─────────────────────────────────────────────────────
    "cadre_contractuel": [
        (
            "Démarrage des Prestations : après signature du présent document, transmission des accès "
            "nécessaires et réception effective du premier versement sur le compte bancaire de Lucid-Lab "
            "(IBAN FR76 2823 3000 0119 9177 3651 869, BIC REVOFRP2, Revolut Bank UAB)."
        ),
        (
            "Documents contractuels remis : (i) la présente Proposition valant Bon de Commande, "
            "(ii) le Contrat de Prestation, (iii) les Conditions Générales de Vente."
        ),
        (
            "Couverture assurantielle : Lucid-Lab est assurée en Responsabilité Civile Professionnelle "
            "auprès de Hiscox SA (police RCPLP 3695175450, plafond 100 000 € par période d'assurance, "
            "monde entier hors USA/Canada)."
        ),
    ],

    # ── Acceptation ───────────────────────────────────────────────────────────
    "acceptation": {
        "intro": "Le Client déclare avoir pris connaissance et accepter sans réserve :",
        "bullets": [
            "le périmètre, les livrables et le calendrier décrits ci-dessus ;",
            "la structure tarifaire en deux phases et la facturation mensuelle associée ;",
            "le tarif de 100,00 € HT par création publicitaire commandée ;",
            "les Conditions Générales de Vente Lucid-Lab accessibles sur lucid-lab.fr/cgv ;",
            "l'obligation de versement préalable au démarrage des Prestations.",
        ],
        "conclusion": (
            "La signature de la présente Proposition vaut acceptation de l'offre, formation du Contrat "
            "et commande ferme pour un engagement de 12 mois, et déclenche l'émission d'une facture "
            "pro forma puis l'exécution des Prestations à compter de la réception effective du premier paiement."
        ),
        "modalite": (
            "Modalité retenue : Abonnement mensuel, engagement 12 mois. Phase 1 (M1-3) : 600,00 € HT/mois. "
            "Phase 2 (M4-12) : 300,00 € HT/mois. Création publicitaire : 100,00 € HT/unité."
        ),
        "mention": (
            "Mention manuscrite obligatoire : « Lu et approuvé, bon pour accord et commande ferme, "
            "engagement 12 mois, 4 500,00 € HT (5 400,00 € TTC) hors créations publicitaires »."
        ),
    },

    # ── Mention manuscrite (page signature) ───────────────────────────────────
    "mention_manuscrite": (
        "Lu et approuvé, bon pour accord et commande ferme, engagement 12 mois, "
        "4 500,00 € HT (5 400,00 € TTC) hors créations publicitaires"
    ),

    # ── Signature ─────────────────────────────────────────────────────────────
    "signature": {
        "client": "Shannon [À COMPLÉTER]",
    },

    # ══════════════════════════════════════════════════════════════════════════
    # Champs Contrat (contrat_template.html)
    # ══════════════════════════════════════════════════════════════════════════

    "filename_ctr": "11_CTR-Shannon-Ecommerce.pdf",
    "ctr_ref":      "CTR-2026-011",
    "bdc_ref":      "PROP-2026-011",
    "date":         "11 juin 2026",

    "client_block_ctr": (
        "Shannon [NOM COMPLET À COMPLÉTER], [STRUCTURE / SOCIÉTÉ À COMPLÉTER], dont le siège social "
        "est situé [ADRESSE À COMPLÉTER], immatriculée sous le numéro SIRET [SIRET À COMPLÉTER], "
        "représenté(e) par [REPRÉSENTANT À COMPLÉTER] en qualité de [QUALITÉ À COMPLÉTER],"
    ),
    "interlocuteur": "Shannon [À COMPLÉTER], [email à compléter]",
    "lieu_client":   "[À COMPLÉTER]",

    "prop_ref_ctr": "PROP-2026-011 · Shannon · 11 juin 2026",

    "mission_title": (
        "Accompagnement e-commerce 12 mois : refonte des 3 boutiques Shopify, "
        "SEO et pilotage Meta Ads."
    ),
    "mission_description": (
        "Refonte et optimisation des trois boutiques Shopify du Client (perruques, accessoires pour "
        "animaux, produits pour personnes autistes / TDAH), accompagnement SEO, configuration et "
        "pilotage des campagnes Meta Ads, et production de contenu publicitaire à la demande. "
        "Engagement de 12 mois structuré en deux phases : Phase 1 (Mois 1-3) refonte et lancement, "
        "Phase 2 (Mois 4-12) run, optimisation continue et scaling."
    ),

    "calendrier_bdc": (
        "Démarrage à compter de la signature, de la transmission des accès et de la réception du "
        "premier versement (juin 2026), pour une durée de 12 mois."
    ),

    "perimetre_ctr": (
        "refonte et optimisation des trois boutiques Shopify (audit, UX/UI, fiches produits, "
        "performance technique, tracking) ; accompagnement SEO (audit, optimisation on-page, suivi "
        "de positionnement) ; configuration et pilotage des campagnes Meta Ads (Business Manager, "
        "pixels, audiences, catalogues, lancement et optimisation des campagnes) ; production de "
        "contenu publicitaire à la demande, facturée à l'unité ; reporting mensuel de performance."
    ),
    "hors_perimetre_ctr": (
        "toute prestation non explicitement listée dans la Proposition Commerciale, notamment "
        "le budget média Meta (dépenses publicitaires), les abonnements Shopify et applications "
        "tierces, la production de visuels / vidéos nécessitant un prestataire externe (shooting, "
        "tournage), les crédits d'outils IA ou SEO tiers, les noms de domaine et l'hébergement hors Shopify."
    ),

    "prix_ht_ctr":  "4 500,00 €",
    "tva_ctr":      "900,00 €",
    "prix_ttc_ctr": "5 400,00 €",
    "modalite_ctr": (
        "Abonnement mensuel sur engagement de 12 mois, facturé à l'avance : Phase 1 (Mois 1-3) "
        "600,00 € HT/mois (450 € refonte des 3 sites + 150 € Meta Ads), Phase 2 (Mois 4-12) "
        "300,00 € HT/mois tout compris. Chaque création publicitaire commandée est facturée "
        "100,00 € HT à l'unité, en sus. Total engagement fixe sur 12 mois : 4 500,00 € HT "
        "(5 400,00 € TTC), hors créations publicitaires et hors coûts variables à la charge du Client."
    ),
}
