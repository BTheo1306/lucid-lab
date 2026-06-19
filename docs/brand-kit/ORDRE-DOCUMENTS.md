# Lucid-Lab · Ordre chronologique des documents

Quel document envoyer, à quel moment du cycle client, et dans quel but.
Du premier contact jusqu'au démarrage du projet.

Chaque document existe en `.pdf` (prêt à envoyer) et `.html` (éditable, à imprimer en PDF).
Emplacement : `docs/brand-kit/templates/`, sauf le pitch deck (`docs/brand-kit/pitch-deck/`)
et le document de démarrage (`docs/brand-kit/clients/<client>/`).

---

## Vue d'ensemble

| Ordre | Document | Phase | Quand l'envoyer | Objectif |
|------:|----------|-------|-----------------|----------|
| 1 | One-pager | Prospection | Premier contact (email, DM, après un événement) | Donner envie, présenter l'offre en une page |
| 2 | Pitch deck | Prospection | En rendez-vous de découverte, ou en pièce jointe juste après | Présenter Lucid-Lab, l'équipe, la méthode |
| 3 | Proposition commerciale | Proposition | Après le call de cadrage, une fois le besoin compris | Détailler la solution proposée (6 pages) |
| 4 | Devis | Proposition | Avec la proposition (ou juste après) | Chiffrer la prestation |
| 5 | Feuille de route (timeline) | Proposition | À présenter avec le devis | Montrer les étapes et le calendrier du projet |
| 6a | Bon pour accord | Engagement | Petit projet : pour valider vite le devis | Accord léger sur un devis, sans contrat complet |
| 6b | Bon de commande | Engagement | Projet standard : quand le client dit oui | Engagement ferme de commande (vaut acceptation) |
| 6c | Contrat de prestation | Engagement | Avec le bon de commande, pour signature | Encadrer juridiquement la prestation |
| 7 | Facture (pro forma puis facture) | Démarrage | Après signature, avant de démarrer | Encaisser le 1er paiement (déclenche le travail) |
| 8 | Guide RustDesk | Démarrage | Au lancement, pour récupérer les accès | Installer l'accès à distance chez le client |
| 9 | Document de démarrage | Démarrage | Juste après le call de lancement | Récapituler accès à fournir, actions client, fonctionnement |

---

## Phase 0 : Prospection (premier contact)

**1. One-pager** (`templates/one-pager`)
Le document d'accroche, une seule page. À envoyer en tout premier : email à froid, message LinkedIn,
ou laissé après un rendez-vous. But : donner envie d'un échange, pas de tout expliquer.

**2. Pitch deck** (`pitch-deck/deck.pdf`)
La présentation de Lucid-Lab (11 slides : qui on est, l'équipe, l'approche, les résultats).
À montrer pendant le rendez-vous de découverte, ou à envoyer en pièce jointe juste après le premier échange.

> Objectif de la phase : décrocher un call de cadrage pour comprendre le besoin réel.

---

## Phase 1 : Proposition (après avoir compris le besoin)

**3. Proposition commerciale** (`templates/document`)
La proposition détaillée (6 pages), envoyée une fois le besoin cadré. Reprend le contexte,
la solution, le périmètre, la valeur. C'est le document qui « vend » la mission.

**4. Devis** (`templates/devis`)
Le chiffrage. À envoyer avec la proposition (ou juste après). Lignes de prestation, HT / TVA / TTC,
conditions de paiement. Valable 30 jours.

**5. Feuille de route / timeline** (`pitch-deck/timeline.pdf`)
Les étapes du projet (4 slides). À présenter **avec le devis** : le client voit le chiffre et le déroulé
en même temps, ce qui rend l'engagement concret.

> Objectif de la phase : obtenir un accord verbal. Dès qu'il est là, on passe à la signature.

---

## Phase 2 : Engagement et signature (le client dit oui)

Deux chemins selon la taille du projet. **On ne mélange pas les deux.**

### Chemin A : projet simple / rapide
**6a. Bon pour accord** (`templates/bon-pour-accord`)
Une page : objet, montant, engagement signé. Suffit pour un petit projet one-shot où l'on ne veut
pas dérouler un contrat complet. Le client signe, on facture, on démarre.

### Chemin B : projet standard (recommandé dès qu'il y a un vrai engagement)
**6b. Bon de commande** (`templates/bon-de-commande`)
« Proposition valant bon de commande » : engagement ferme. La signature vaut acceptation de l'offre
et commande ferme. Contient la mention manuscrite obligatoire et les coordonnées bancaires.

**6c. Contrat de prestation** (`templates/contrat`)
Le cadre juridique complet (14 articles : objet, prix, propriété intellectuelle, responsabilité,
RGPD, résiliation...). Le contrat **complète le bon de commande**.

> Ordre pratique du chemin B : envoyer le **bon de commande + le contrat ensemble** pour signature.
> Le client signe les deux. Le bon de commande prime en cas de contradiction.

> Note signature électronique : pour signer en ligne, des versions DocuSeal (pré-remplies depuis
> Lucid OS) existent dans `docs/legal-templates/`. Les PDF de ce kit servent à l'envoi et l'impression manuels.

---

## Phase 3 : Facturation et démarrage (après signature)

**7. Facture** (via Dougs, skill `/facturation`)
Facture pro forma émise après signature, puis facture. À régler **avant** de démarrer (one-shot)
ou pour le 1er mois (mensuel). Le travail ne démarre qu'à réception effective du paiement.

**8. Guide RustDesk** (`templates/guide-rustdesk`)
Guide d'installation de l'accès à distance (FR + EN, 4 pages). À envoyer au lancement pour pouvoir
intervenir sur la machine du client lors de la mise en place.

**9. Document de démarrage** (`clients/<client>/document-demarrage`)
Le récapitulatif de lancement, **personnalisé par client** (voir l'exemple `clients/jardin-eden/`).
À envoyer juste après le call de lancement : accès à fournir, actions à mener côté client,
fonctionnement de l'automatisation, prochaines étapes.

> Objectif de la phase : récupérer les accès, encaisser, et lancer la construction.

---

## Récapitulatif en une ligne

One-pager → Pitch deck → Proposition → Devis (+ Feuille de route) →
Bon de commande + Contrat (ou Bon pour accord si petit projet) →
Facture → Guide RustDesk + Document de démarrage.
