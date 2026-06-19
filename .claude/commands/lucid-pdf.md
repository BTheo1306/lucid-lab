# Système de génération de PDFs Lucid-Lab

Tu travailles dans le projet `lucid-lab`. Ce projet contient un système de génération de PDFs (propositions commerciales, bons de commande, contrats) via HTML/CSS + Playwright/Jinja2, avec upload automatique vers Google Drive via `rclone`.

## Architecture du système

```
scripts/
  generate_client_docs.py         # Générateur unifié ← à utiliser en priorité
                                  # Génère PropositionBDC + Contrat depuis un seul content file
                                  # Upload automatique sur Drive via rclone si drive_folder_id présent

  proposition_bdc_template.html   # Template combinée proposition + BDC (7 pages) ← document principal
  contrat_template.html           # Template contrat seul (6 pages)
  bdc_template.html               # Template BDC seul (legacy)
  proposition_template.html       # Template proposition seule (legacy)

  content_sinibaldi_proposition_bdc.py   # Contenu Sinibaldi Agency — ALL fields (Prop+BDC+Contrat)

docs/
  client-presentations/           # Sortie PropositionBDC
  legal-templates/generated/      # Sortie Contrat
```

## Commande de génération (pipeline complet)

```bash
# Génère PropositionBDC + Contrat + upload Drive en une seule commande
python3 scripts/generate_client_docs.py scripts/content_sinibaldi_proposition_bdc.py
```

Sorties machine-lisibles en fin d'exécution :
```
PROP_PATH=<chemin absolu PropositionBDC>
CTR_PATH=<chemin absolu Contrat>
DRIVE_FOLDER=<folder_id>
```

## Upload Drive (rclone)

`rclone` est configuré avec le remote `gdrive:`. L'upload est automatique si `drive_folder_id` est défini dans le content file. Commande manuelle :

```bash
rclone copy "/path/to/file.pdf" "gdrive:" --drive-root-folder-id=<FOLDER_ID> --no-traverse
```

## Règles importantes

- **Générateur** : `generate_client_docs.py` lit `template_name` dans le content (défaut : `proposition_bdc_template.html`).
- **Logo** : `logo-256x256-black-on-white.png` (4.9 KB) embedé en base64 — injecté automatiquement.
- **Google Fonts** : fichier tmp + `file://` + `networkidle` → polices Inter/Syne se chargent.
- **page-break** : `<div class="page-break"></div>` pour les sauts de page — ne jamais s'appuyer sur les sauts CSS automatiques.
- **Vérification** : `python3 -c "from pypdf import PdfReader; r = PdfReader('...'); print(len(r.pages))"` + `pdftoppm -r 80 ...`.

## Coordonnées bancaires Lucid-Lab (Revolut)

| Champ     | Valeur                            |
|-----------|-----------------------------------|
| Titulaire | Lucid-Lab                         |
| IBAN      | FR76 2823 3000 0119 9177 3651 869 |
| BIC       | REVOFRP2                          |
| Banque    | Revolut Bank UAB                  |
| Adresse   | 10 avenue Kléber, 75116 Paris     |

**Ne jamais utiliser l'ancien IBAN Swan** (`FR76 1732 8844 0043 2662 8862 178` / `SWNBFR22`).

## Infos légales Lucid-Lab (prestataire)

- Lucid-Lab, SAS au capital de 999 €
- Siège : 47 rue Vivienne, 75002 Paris
- RCS Paris 104 672 050 · TVA FR 02 104 672 050
- Président : Periscope-X SARL, représentée par Anthony Poirier
- RCP : Hiscox SA, police RCPLP 3695175450, plafond 100 000 €, monde entier hors USA/Canada

## Créer un nouveau client

1. Copier `content_sinibaldi_proposition_bdc.py` → `content_<client>_proposition_bdc.py`
2. Mettre à jour : `filename`, `filename_ctr`, `client_name`, `client_short`, `subtitle`, `meta`, `client_block_bdc`, `client_block_ctr`, `objectif`, `perimetre`, `investissement`, `mention_manuscrite`, `signature`, `drive_folder_id`
3. Ajuster les refs (`PROP-2026-0XX`, `CTR-2026-0XX`) dans `meta`, `ref_client_rib`, `cadre_contractuel`, `ctr_ref`, `bdc_ref`
4. Lancer : `python3 scripts/generate_client_docs.py scripts/content_<client>_proposition_bdc.py`

## Convention de nommage

```
<numéro>_<Type>-<Client>-<Mission>.pdf
ex : 10_PropositionBDC-Sinibaldi-Agency-PC-IA.pdf
     10_CTR-Sinibaldi-Agency-PC-IA.pdf
     11_PropositionBDC-NouveauClient-Mission.pdf
```

## Structure template proposition_bdc_template.html (7 pages)

| Page | Contenu                                                             | Variables Jinja2 principales                          |
|------|---------------------------------------------------------------------|-------------------------------------------------------|
| 1    | Couverture : titre, meta, Parties                                   | `client_name`, `subtitle`, `meta`, `client_block_bdc` |
| 2    | Objectif + Périmètre                                                | `objectif`, `perimetre`                               |
| 3    | Calendrier + Timeline + Livrables                                   | `calendrier`, `timeline`, `livrables`                 |
| 4    | Investissement + Coûts exclus                                       | `investissement`, `couts_exclus`                      |
| 5    | Conditions de paiement (RIB Revolut) + Pénalités + CGV + Prochaines étapes | `ref_client_rib`, `prochaines_etapes`         |
| 6    | Cadre contractuel + Acceptation + "Bon pour accord"                 | `cadre_contractuel`, `acceptation`                    |
| 7    | Signatures (mention manuscrite + 2 blocs)                           | `mention_manuscrite`, `signature`                     |

## Client actuel : Sinibaldi Agency (PROP-2026-010)

- Mission : Plateforme IA permis de construire — Phase 1 B2B
- Prix : **8 000 € HT · 1 600 € TVA · 9 600 € TTC**
- Échéancier 30/40/30 : 2 880 € · 3 840 € · 2 880 € TTC
- Contact client : Clément Sinibaldi — contact@sinibaldi-architecte.fr
- SIRET : 947 876 892 00011 — 3 avenue Gozza, 83000 Toulon
- Drive folder ID : `184Uu_LSgbNECrWePoq95n3Db-VDYaBgi`
- Fichiers Drive : `10_PropositionBDC-Sinibaldi-Agency-PC-IA.pdf` + `10_CTR-Sinibaldi-Agency-PC-IA.pdf`
