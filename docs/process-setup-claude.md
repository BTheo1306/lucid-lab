# Process : installation d'un second cerveau Claude + Obsidian

Le déroulé complet d'une vente de setup Claude, du premier contact au deuxième call de suivi.
Qui fait quoi, quel document part à quel moment, et ce qui bloque le passage à l'étape suivante.

**J0 = le jour de la séance d'installation.** Toutes les dates se comptent à partir de là.

Documents : `docs/brand-kit/templates/` (voir `ORDRE-DOCUMENTS.md` pour la convention générale).
Exemple rempli de bout en bout : `docs/brand-kit/clients/astrid-helferstorfer/`.

---

## Vue d'ensemble

| Quand | Étape | Ce qui part au client | Ce qui débloque la suite |
|---|---|---|---|
| J-14 | Premier contact | One-pager | Le client accepte un call |
| J-10 | Call de cadrage (30 min) | Rien | On comprend l'usage réel |
| J-9 | Proposition | Proposition commerciale + devis | Accord verbal |
| J-7 | Engagement | Bon de commande | Signature |
| J-7 | Facturation | Facture | **Paiement reçu** |
| J-5 | Préparation | Questionnaire pré-installation + guide client | Réponses reçues |
| J-2 | Contrôle interne | Rien | Zéro surprise technique |
| **J0** | **Séance d'installation (2 h)** | Rien | Le système tourne chez le client |
| J+1 | Livraison | Compte rendu de livraison + accès portail | Le client sait s'en servir seul |
| **J+7** | **Call de suivi n°1 (20 min)** | Note de suivi | L'usage est réellement pris |
| **J+28** | **Call de suivi n°2 (30 min)** | Bilan 1 mois + devis si suite | La suite est décidée |

Durée totale : environ six semaines entre le premier contact et le deuxième call de suivi.
Le travail facturé reste de deux jours.

---

## Phase 1 : vendre (J-14 à J-7)

### J-14 · Premier contact
**On envoie :** le one-pager (`templates/one-pager.pdf`).
Rien d'autre. Le but est d'obtenir un échange, pas d'expliquer le produit.

### J-10 · Call de cadrage (30 minutes)
**On envoie :** rien avant, rien pendant.
On écoute. Les trois questions qui décident de la suite :
- Qu'est-ce que vous refaites plusieurs fois par semaine et qui vous agace ?
- Où vivent vos documents aujourd'hui, et est-ce que vous les retrouvez ?
- Qui d'autre aurait besoin d'y accéder ?

La troisième réponse détermine Obsidian Sync ou non, donc le prix.

### J-9 · Proposition
**On envoie :** la proposition commerciale (`templates/document.pdf`) et le devis (`templates/devis.pdf`).
Prix : **1 500 à 2 000 € HT** pour une installation individuelle, deux jours de travail.
Un montant inférieur est un geste commercial, et il doit être écrit comme tel dans le document,
avec la mention qu'il ne constitue ni tarif catalogue ni précédent.

**Règle :** on ne transmet jamais une offre par mail sans l'avoir présentée en call.

### J-7 · Engagement et facturation
**On envoie :** le bon de commande (`templates/bon-de-commande.pdf`), puis la facture une fois signé.

Pour un petit projet, le bon pour accord (`templates/bon-pour-accord.pdf`) suffit et va plus vite.

> **Le paiement conditionne le démarrage.** On ne bloque pas de créneau d'installation avant
> réception effective du virement. C'est ce qui évite les Turismo.

Client hors de France : vérifier le traitement de TVA avant d'émettre, et poser la mention
d'autoliquidation sur la facture. Le détail figure dans l'en-tête du bon de commande d'Astrid.

---

## Phase 2 : préparer (J-5 à J-2)

### J-5 · Kit de préparation
**On envoie deux documents ensemble :**
1. **Le questionnaire pré-installation** (`docs/obsidian-wiki/questionnaire-pre-installation.md`),
   11 questions : machine et OS, droits administrateur, compte Claude existant, activité en une
   phrase, trois premiers cas d'usage, documents à reprendre et où ils vivent.
2. **Le guide client** (`templates/guide-wiki-claude-obsidian.pdf`), 7 pages, à lire avant la séance.

Si l'installation se fait à distance sur un poste qu'on doit piloter, ajouter le
**guide RustDesk** (`templates/guide-rustdesk.pdf`).

### J-2 · Contrôle interne
**On envoie :** rien. C'est du travail interne.

On relit les réponses et on tranche les trois points qui font dérailler une séance :
- **Droits administrateur.** Sans eux, impossible d'installer quoi que ce soit. À débloquer avant, jamais pendant.
- **Compte Claude.** S'il n'existe pas, le client souscrit lui-même avant la séance. On ne paie jamais à sa place.
- **Documents sources.** Le dossier doit être prêt le jour J. Rassembler des fichiers éparpillés
  pendant la séance consomme la moitié du temps.

Si un point n'est pas réglé, **on décale la séance**. Une séance mal préparée coûte une journée
et produit un client déçu.

---

## Phase 3 : installer et livrer (J0 à J+1)

### J0 · Séance d'installation (environ 2 heures en visio ou sur place)
Installation d'Obsidian et de Claude, création du coffre, structure de rangement adaptée à
l'activité, règles d'écriture et garde-fous, reprise des documents désignés, puis prise en main
sur un cas d'usage réel apporté par le client.

On termine toujours par une démonstration sur **son** contenu, pas sur un exemple générique.

Le reste des deux jours facturés sert à la mise en forme du coffre après la séance.

### J+1 · Livraison
**On envoie :** le compte rendu de livraison (`templates/compte-rendu.pdf`) et l'accès au portail client.

Le compte rendu dit trois choses : ce qui a été installé, comment s'en servir au quotidien,
et ce qu'on attend du client d'ici le premier call de suivi.

**Dans le CRM :** créer les deux tâches de suivi tout de suite, avec leur échéance, et les rendre
visibles sur le portail. C'est ce qui fait que le client voit sa prochaine étape au lieu d'une
liste de tâches terminées.

---

## Phase 4 : les deux calls de suivi

C'est la partie qui manquait au process. Sans elle, on livre un outil et on ne sait jamais s'il
sert. Avec elle, on transforme une installation à 300 ou 2 000 € en relation qui dure.

### J+7 · Call de suivi n°1 (20 minutes) : est-ce que ça sert ?

À une semaine, on ne mesure pas la valeur, on mesure **l'usage**. Soit le client a pris
l'habitude, soit elle est déjà morte, et c'est le seul moment où on peut la relancer.

**Ce qu'on demande, dans cet ordre :**
1. Combien de fois vous l'avez ouvert cette semaine ? (la réponse honnête est souvent « deux ou trois »)
2. Qu'est-ce que vous y avez mis ?
3. Qu'est-ce qui vous a arrêté ou agacé ?
4. Qu'est-ce que vous avez continué à faire à l'ancienne, par réflexe ?

La question 4 est la plus utile : elle révèle le point de friction que le client ne signalera pas
spontanément.

**Ce qu'on fait pendant le call :** on corrige en direct. Une règle d'écriture à ajuster, un
dossier mal nommé, un raccourci à montrer. Rien qui demande à être reprogrammé.

**On envoie après :** une note de suivi courte, deux ou trois lignes par ajustement décidé,
publiée sur le portail client.

> Si le client ne l'a pas ouvert du tout, le dire franchement et comprendre pourquoi.
> C'est récupérable à une semaine, plus du tout à un mois.

### J+28 · Call de suivi n°2 (30 minutes) : qu'est-ce que ça a changé ?

À un mois, l'habitude est prise ou elle ne le sera jamais. Ce call a deux fonctions :
constater la valeur, et **ouvrir la suite**.

**Ce qu'on demande :**
1. Qu'est-ce que vous faites aujourd'hui que vous ne faisiez pas il y a un mois ?
2. Combien de temps ça vous a fait gagner, à la louche, par semaine ?
3. Qu'est-ce que vous aimeriez qu'il fasse et qu'il ne fait pas ?

La question 3 est le devis suivant. Les réponses tournent presque toujours autour de trois
choses : automatiser une tâche récurrente, ouvrir l'accès à un collègue, ou former l'équipe.

**On envoie après :**
- un **bilan à un mois** (format compte rendu), avec le chiffre de la question 2 écrit noir sur blanc ;
- si une suite se dessine, un **devis** pour la prestation identifiée (automatisation,
  accompagnement mensuel, formation d'équipe), au tarif courant et non au tarif du setup.

**Et on demande l'accord pour une étude de cas.** C'est le meilleur moment : la valeur vient
d'être formulée par le client lui-même. Un mois plus tard, il ne s'en souviendra plus.

---

## Ce qui compte pour Anthony

Trois règles issues du point du 02/08, qui s'appliquent à tout le déroulé :

- **Toujours une prochaine étape écrite.** À la fin de chaque échange, le client sait ce qui vient
  et quand. Sur le portail, pas seulement dans un mail.
- **On ne fait pas traîner.** Pas de rendez-vous qui existe pour exister. Les deux calls de suivi
  ont un objet précis et se tiennent en 20 et 30 minutes.
- **On prend l'habitude sur les petits clients.** Ce déroulé s'applique à une installation à 300 €
  comme à une mission à 30 000 €. C'est en le tenant sur les petites qu'il tiendra sur les grosses.

## Récapitulatif des documents

| # | Document | Emplacement | Étape |
|---|---|---|---|
| 1 | One-pager | `templates/one-pager.pdf` | J-14 |
| 2 | Proposition commerciale | `templates/document.pdf` | J-9 |
| 3 | Devis | `templates/devis.pdf` | J-9 |
| 4 | Bon de commande | `templates/bon-de-commande.pdf` | J-7 |
| 4 bis | Bon pour accord (petit projet) | `templates/bon-pour-accord.pdf` | J-7 |
| 5 | Facture | Dougs | J-7 |
| 6 | Questionnaire pré-installation | `docs/obsidian-wiki/questionnaire-pre-installation.md` | J-5 |
| 7 | Guide client second cerveau | `templates/guide-wiki-claude-obsidian.pdf` | J-5 |
| 8 | Guide RustDesk (si à distance) | `templates/guide-rustdesk.pdf` | J-5 |
| 9 | Compte rendu de livraison | `templates/compte-rendu.pdf` | J+1 |
| 10 | Note de suivi | Portail client | J+7 |
| 11 | Bilan à un mois | `templates/compte-rendu.pdf` | J+28 |
| 12 | Devis de suite | `templates/devis.pdf` | J+28 si suite |
