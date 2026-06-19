"""
Contenu BDC + Contrat — Sinibaldi Agency / Plateforme IA Permis de Construire
Référence : PROP-2026-010 / CTR-2026-010 · 9 juin 2026
"""

CONTENT = {
    "filename_bdc": "10_BDC-Sinibaldi-Agency-PC-IA.pdf",
    "filename_ctr": "10_CTR-Sinibaldi-Agency-PC-IA.pdf",

    # ── Identifiants ──────────────────────────────────────────────────────────
    "bdc_ref":     "PROP-2026-010",
    "ctr_ref":     "CTR-2026-010",
    "date":        "9 juin 2026",
    "client_short": "Sinibaldi Agency",

    # ── Parties ───────────────────────────────────────────────────────────────
    "client_block_bdc": (
        "Le Client — Clément Sinibaldi, SASU Sinibaldi Agency, siège social : "
        "3 avenue Gozza, 83000 Toulon, France, immatriculée sous le numéro SIRET "
        "947 876 892 00011, représentée par Clément Sinibaldi en qualité de Président."
    ),
    "client_block_ctr": (
        "Clément Sinibaldi, SASU Sinibaldi Agency, dont le siège social est situé "
        "3 avenue Gozza, 83000 Toulon, France, immatriculée sous le numéro SIRET "
        "947 876 892 00011, représentée par Clément Sinibaldi en qualité de Président,"
    ),
    "interlocuteur": "Clément Sinibaldi — Président — contact@sinibaldi-architecte.fr",
    "lieu_client":   "Toulon",

    # ── Mission ───────────────────────────────────────────────────────────────
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
    "livrables": [
        (
            "Moteur IA : génération automatique des plans cadastraux, notices architecturales, "
            "élévations de façades (existant + projet) et rendus à partir des données de projet "
            "(adresse, références cadastrales, photos, description des travaux)."
        ),
        (
            "Interface de saisie structurée et génération du dossier complet en PDF au format "
            "attendu par les services instructeurs. Pré-remplissage des formulaires CERFA "
            "(13703, 16702, 13406...)."
        ),
        (
            "Onboarding Sinibaldi Agency comme client pilote, collecte structurée des retours "
            "terrain, métriques de phase, rapport et recommandations Phase 2 B2C."
        ),
    ],
    "calendrier_bdc": (
        "Démarrage à compter de la signature et réception du premier paiement "
        "(juillet 2026, durée 3 mois, livraison fin septembre 2026)."
    ),

    # ── Financier ─────────────────────────────────────────────────────────────
    "prix_ht":     "8 000,00 €",
    "tva":         "1 600,00 €",
    "prix_ttc":    "9 600,00 €",
    "modalite_bdc": "Forfait fixe Phase 1 B2B, 3 mois",
    "echeancier_bdc": (
        "30 % à la signature (2 880,00 € TTC) · "
        "40 % à mi-parcours M1 (3 840,00 € TTC) · "
        "30 % à la livraison M3 (2 880,00 € TTC)"
    ),
    "ref_client_rib": "PROP-2026-010 / Sinibaldi Agency",
    "mention_manuscrite": (
        "Lu et approuvé, bon pour accord et commande ferme, "
        "Prix : 9 600,00 € TTC, Modalité : Forfait Phase 1 B2B"
    ),

    # ── Contrat ───────────────────────────────────────────────────────────────
    "prop_ref_ctr": "PROP-2026-010 — Sinibaldi Agency — 9 juin 2026",
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
