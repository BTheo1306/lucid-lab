"""
Proposition d'accompagnement valant Bon de Commande
Sinibaldi Agency / Plateforme IA Permis de Construire
Référence : PROP-2026-010 · 9 juin 2026
"""

CONTENT = {
    "filename":     "10_PropositionBDC-Sinibaldi-Agency-PC-IA.pdf",
    "template_name": "proposition_bdc_template.html",
    "client_name":  "Sinibaldi Agency, Clément Sinibaldi",
    "client_short": "Sinibaldi Agency",
    "subtitle": (
        "Développement d'une plateforme IA de génération automatique "
        "de dossiers de permis de construire. Phase 1 B2B."
    ),

    # ── Méta ──────────────────────────────────────────────────────────────────
    "meta": [
        ("Client",    "Sinibaldi Agency, Clément Sinibaldi"),
        ("Date",      "9 juin 2026"),
        ("Contact",   "Lucid-Lab, info@lucid-lab.fr"),
        ("Référence", "PROP-2026-010"),
        ("Validité",  "30 jours à compter de la date d'émission"),
    ],

    # ── Parties ───────────────────────────────────────────────────────────────
    "client_block_bdc": (
        "Le Client — Clément Sinibaldi, SASU Sinibaldi Agency, siège social : "
        "3 avenue Gozza, 83000 Toulon, France, immatriculée sous le numéro SIRET "
        "947 876 892 00011, représentée par Clément Sinibaldi en qualité de Président."
    ),

    # ── Objectif ──────────────────────────────────────────────────────────────
    "objectif": [
        (
            "Sinibaldi Agency produit chaque mois des dossiers complets de Déclarations Préalables "
            "et Permis de Construire pour ses clients : plans de situation, plans cadastraux, notices "
            "architecturales, élévations de façades (état existant et état projet), rendus. "
            "Chaque dossier mobilise plusieurs heures de production manuelle."
        ),
        (
            "L'objectif de cet accompagnement est de concevoir et de développer une plateforme IA "
            "capable de générer automatiquement l'ensemble de ces pièces graphiques et écrites, à "
            "partir des données de projet : adresse, références cadastrales, description des travaux, "
            "photos de l'existant. L'IA produit les plans, les élévations, les rendus et les notices "
            "en quelques minutes, au standard attendu par les services instructeurs."
        ),
        (
            "La stratégie retenue est une approche en deux phases : Phase 1 B2B (3 mois, 8 000 € HT) "
            "pour développer et valider le MVP avec Sinibaldi Agency et un premier panel professionnel. "
            "Phase 2 B2C, budget à définir conjointement à l'issue de la Phase 1, pour un lancement "
            "auprès des particuliers souhaitant gérer eux-mêmes leur dossier de travaux."
        ),
    ],

    # ── Périmètre ─────────────────────────────────────────────────────────────
    "perimetre": [
        {
            "title": "Moteur IA : génération des pièces du dossier",
            "bullets": [
                "Plans de situation et plans cadastraux générés automatiquement à partir de l'adresse et des références parcellaires (intégration des données cadastrales officielles : Géoportail, API cadastre).",
                "Notices architecturales rédigées automatiquement à partir de la description du projet : nature des travaux, matériaux, dimensions, caractéristiques de l'existant.",
                "Élévations de façades (état existant et état projet) générées par IA à partir de photos de la construction et de la description des modifications.",
                "Rendus architecturaux produits par IA pour illustrer le dossier.",
                "Pré-remplissage des formulaires CERFA (13703, 16702, 13406...) à partir des données saisies.",
            ],
        },
        {
            "title": "Interface et workflow",
            "bullets": [
                "Interface de saisie structurée : adresse, références cadastrales, type de travaux, photos de l'existant, description du projet.",
                "Génération du dossier complet en PDF au format attendu par les services instructeurs.",
                "Relecture et ajustement possibles par l'architecte avant envoi.",
                "Archivage et gestion des dossiers par client / projet.",
            ],
        },
        {
            "title": "Go-to-market B2B et préparation Phase 2",
            "bullets": [
                "Onboarding de Sinibaldi Agency comme premier client pilote et co-développeur produit.",
                "Identification et approche d'un panel complémentaire : cabinets d'architecture d'intérieur, agences immobilières avec activité travaux, entreprises générales de rénovation.",
                "Collecte structurée des retours terrain pour prioriser les itérations.",
                "Définition du modèle tarifaire B2B (abonnement par siège ou à la consommation par dossier) et recommandations pour le périmètre de la Phase 2 B2C.",
            ],
        },
    ],

    # ── Calendrier ────────────────────────────────────────────────────────────
    "timeline": [
        {"date": "Juillet",    "label": "DÉMARRAGE", "description": "Cadrage + socle"},
        {"date": "Mi-juillet", "label": None,         "description": "Plans cadastraux"},
        {"date": "Août",       "label": None,         "description": "Élévations + rendus"},
        {"date": "Mi-août",    "label": None,         "description": "Interface + PDF"},
        {"date": "Septembre",  "label": None,         "description": "Tests + onboarding"},
        {"date": "Fin sept.",  "label": "LIVRAISON",  "description": "Rapport + reco. B2C"},
    ],
    "calendrier": [
        {
            "label": "Mois 1",
            "text": (
                "Architecture de la plateforme, intégration des API cadastrales, développement du "
                "moteur de génération des plans de situation et cadastraux, premiers prototypes d'élévations."
            ),
        },
        {
            "label": "Mois 2",
            "text": (
                "Notices architecturales automatisées, élévations façades (existant + projet), rendus, "
                "pré-remplissage CERFA, interface de saisie et génération PDF. "
                "Test interne sur dossiers réels Sinibaldi Agency."
            ),
        },
        {
            "label": "Mois 3",
            "text": (
                "Ajustements sur retours terrain, onboarding des premiers clients B2B externes, "
                "collecte des métriques, rapport de phase et recommandations Phase 2 B2C."
            ),
        },
    ],
    "livrables": [
        ("Mois 1", "Architecture technique validée · Intégration API cadastrales · Moteur de génération des plans de situation et cadastraux · Premiers prototypes d'élévations"),
        ("Mois 2", "Notices architecturales automatisées · Élévations façades (existant + projet) · Rendus IA · Pré-remplissage CERFA · Interface de saisie · Génération PDF complète · Tests sur dossiers réels"),
        ("Mois 3", "Ajustements sur retours terrain · Onboarding 1er panel B2B · Tableau de bord métriques · Rapport de phase · Recommandations Phase 2 B2C"),
    ],

    # ── Investissement ────────────────────────────────────────────────────────
    "investissement": [
        ("Forfait Phase 1 B2B (3 mois)",  "8 000,00 € HT"),
        ("TVA (20 %)",                    "1 600,00 €"),
        ("Total TTC",                     "9 600,00 € TTC"),
        ("Modalité retenue",              "Forfait fixe Phase 1 B2B, 3 mois"),
        ("Échéancier",                    "30 % à la signature (2 880,00 € TTC) · 40 % à mi-parcours M1 (3 840,00 € TTC) · 30 % à la livraison M3 (2 880,00 € TTC)"),
        ("Phase 2 B2C",                   "Budget à définir conjointement à l'issue de la Phase 1, selon résultats et orientations validées"),
        ("Conditions de paiement",        "Virement SEPA exclusivement, à l'avance (voir CGV article 5)"),
        ("Pénalités de retard",           "Intérêts BCE +10 pts + 40 € (D. 441-5 Cciv) + 250 € par facture"),
    ],

    # ── Coûts exclus ──────────────────────────────────────────────────────────
    "couts_exclus": {
        "intro": (
            "Le prix de la Prestation rémunère exclusivement le travail de Lucid-Lab. "
            "Restent à votre charge directe les coûts variables suivants :"
        ),
        "bullets": [
            "Crédits API des modèles IA de génération d'images et de texte (OpenAI, Mistral, Stability, ou équivalents) ;",
            "Coûts d'hébergement de la plateforme selon usage réel (serveur, stockage, bande passante) ;",
            "Accès aux API cadastrales et géographiques au-delà des quotas gratuits ;",
            "Budget marketing ou acquisition B2B éventuel ;",
            "Frais de déplacement éventuels, sur accord préalable écrit.",
        ],
        "outro": "Une estimation indicative de ces coûts vous est fournie sur demande, sans engagement de plafond.",
    },

    # ── Conditions de paiement ────────────────────────────────────────────────
    "ref_client_rib": "PROP-2026-010 / Sinibaldi Agency",

    # ── Prochaines étapes ─────────────────────────────────────────────────────
    "prochaines_etapes": [
        "Planifier un appel de cadrage pour valider définitivement le périmètre technique, les priorités et les premiers jalons avant démarrage.",
        "Signer la présente Proposition valant Bon de Commande et procéder au premier versement (30 %, soit 2 880,00 € TTC).",
        "Planifier le kick-off de démarrage.",
        "Confirmer le panel de clients B2B à onboarder en Mois 3.",
    ],

    # ── Cadre contractuel ─────────────────────────────────────────────────────
    "cadre_contractuel": [
        (
            "Démarrage des Prestations : après signature du présent document et réception effective "
            "du premier paiement sur le compte bancaire de Lucid-Lab "
            "(IBAN FR76 2823 3000 0119 9177 3651 869, BIC REVOFRP2, Revolut Bank UAB)."
        ),
        (
            "Documents contractuels remis : (i) la présente Proposition valant Bon de Commande, "
            "(ii) le Contrat de Prestation, (iii) les Conditions Générales de Vente, "
            "(iv) le cas échéant l'Accord de sous-traitance des données (DPA)."
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
            "la modalité tarifaire retenue et l'échéancier de paiement associé ;",
            "les Conditions Générales de Vente Lucid-Lab accessibles sur lucid-lab.fr/cgv ;",
            "l'obligation de versement préalable au démarrage des Prestations.",
        ],
        "conclusion": (
            "La signature de la présente Proposition vaut acceptation de l'offre, formation du Contrat "
            "et commande ferme, et déclenche l'émission d'une facture pro forma puis l'exécution des "
            "Prestations à compter de la réception effective du premier paiement."
        ),
        "modalite": "Modalité retenue : Forfait Phase 1 B2B, 8 000,00 € HT / 3 mois, échéancier 30/40/30.",
        "mention": (
            "Mention manuscrite obligatoire : « Lu et approuvé, bon pour accord et commande ferme, "
            "Prix : 9 600,00 € TTC, Modalité : Forfait Phase 1 B2B »."
        ),
    },

    # ── Mention manuscrite (page signature) ───────────────────────────────────
    "mention_manuscrite": (
        "Lu et approuvé, bon pour accord et commande ferme, "
        "Prix : 9 600,00 € TTC, Modalité : Forfait Phase 1 B2B"
    ),

    # ── Signature ─────────────────────────────────────────────────────────────
    "signature": {
        "client": "Sinibaldi Agency / Clément Sinibaldi",
    },

    # ══════════════════════════════════════════════════════════════════════════
    # Champs Contrat (contrat_template.html)
    # ══════════════════════════════════════════════════════════════════════════

    "filename_ctr": "10_CTR-Sinibaldi-Agency-PC-IA.pdf",
    "ctr_ref":      "CTR-2026-010",
    "bdc_ref":      "PROP-2026-010",
    "date":         "9 juin 2026",

    # Google Drive — dossier client Sinibaldi
    "drive_folder_id": "184Uu_LSgbNECrWePoq95n3Db-VDYaBgi",

    "client_block_ctr": (
        "Clément Sinibaldi, SASU Sinibaldi Agency, dont le siège social est situé "
        "3 avenue Gozza, 83000 Toulon, France, immatriculée sous le numéro SIRET "
        "947 876 892 00011, représentée par Clément Sinibaldi en qualité de Président,"
    ),
    "interlocuteur": "Clément Sinibaldi — Président — contact@sinibaldi-architecte.fr",
    "lieu_client":   "Toulon",

    "prop_ref_ctr": "PROP-2026-010 — Sinibaldi Agency — 9 juin 2026",

    "mission_title": (
        "Développement d'une plateforme IA de génération automatique de dossiers "
        "de permis de construire. Phase 1 B2B."
    ),
    "mission_description": (
        "Conception et développement d'une plateforme IA capable de générer automatiquement "
        "l'ensemble des pièces graphiques et écrites d'un dossier de Déclaration Préalable "
        "ou Permis de Construire : plans de situation, plans cadastraux, élévations de façades "
        "(état existant et état projet), rendus architecturaux, notices architecturales, "
        "pré-remplissage CERFA. Phase 1 B2B : MVP développé et validé avec Sinibaldi Agency "
        "comme premier client pilote, en 3 mois."
    ),

    "calendrier_bdc": (
        "Démarrage à compter de la signature et réception du premier paiement "
        "(juillet 2026, durée 3 mois, livraison fin septembre 2026)."
    ),

    "perimetre_ctr": (
        "développement d'un moteur IA de génération automatique de l'ensemble des pièces "
        "graphiques et écrites d'un dossier de Déclaration Préalable ou Permis de Construire : "
        "plans de situation et cadastraux via intégration des API Géoportail et API cadastre, "
        "élévations de façades (état existant et état projet) générées par IA à partir de photos "
        "de la construction et de la description des modifications, rendus architecturaux, "
        "notices architecturales automatisées à partir de la description du projet, "
        "pré-remplissage des formulaires CERFA (13703, 16702, 13406...) ; interface de saisie "
        "structurée (adresse, références cadastrales, type de travaux, photos, description) "
        "et génération du dossier PDF complet au format attendu par les services instructeurs ; "
        "onboarding de Sinibaldi Agency comme premier client pilote, collecte des retours terrain, "
        "métriques de phase, rapport de phase et recommandations Phase 2 B2C."
    ),
    "hors_perimetre_ctr": (
        "toute prestation non explicitement listée dans la Proposition Commerciale, notamment "
        "les crédits API des modèles IA tiers (OpenAI, Mistral, Stability ou équivalents), "
        "les coûts d'hébergement, de stockage et de bande passante selon usage réel, "
        "les accès aux API cadastrales et géographiques au-delà des quotas gratuits, "
        "les budgets marketing ou acquisition B2B, et le périmètre Phase 2 B2C "
        "(à traiter dans un avenant ou contrat séparé)."
    ),

    "prix_ht_ctr":  "8 000,00 €",
    "tva_ctr":      "1 600,00 €",
    "prix_ttc_ctr": "9 600,00 €",
    "modalite_ctr": (
        "Forfait fixe Phase 1 B2B, 3 mois, échéancier 30/40/30 : "
        "2 880,00 € TTC à la signature, 3 840,00 € TTC à mi-parcours M1, "
        "2 880,00 € TTC à la livraison M3."
    ),
}
