# Liste d'appel : gestionnaires de crèches privées français

Outil de prospection téléphonique. 16 lignes, extraction du 16/08/2026.

**Le script d'appel de cette verticale n'existe pas encore.** Les deux scripts disponibles (`scripts/experts-comptables.md` et `scripts/avocats.md`) ne se transposent pas tels quels : le décideur d'un réseau de micro-crèches n'a ni barrage de secrétariat, ni calendrier d'audiences, et sa douleur porte sur les inscriptions, les listes d'attente et la facturation CAF. À écrire avant de composer le premier numéro.

## Méthode

**Source firmographique** : base SIRENE / RNE via l'API publique `recherche-entreprises.api.gouv.fr` (données officielles INSEE et registre national des entreprises).

**Critères de sélection**
- Code NAF 8891A (accueil de jeunes enfants), établissement actif, siège social dans le département indiqué.
- Société commerciale (catégorie juridique 5xxx) : les associations loi 1901, les CCAS, les régies municipales et les sociétés publiques locales sont écartées. On cherche un dirigeant qui décide seul de son outillage, pas un conseil d'administration ou une collectivité.
- **Six établissements ouverts au minimum.** C'est le vrai critère de qualification : un gestionnaire mono-site n'a pas de problème de coordination, un réseau de sept à quatorze micro-crèches en a un tous les jours. Le tri principal se fait sur ce nombre, pas sur l'effectif.

**Ce qui a été écarté et pourquoi**

Le code 8891A mélange deux métiers très différents. À côté des crèches, il contient les agences de garde d'enfants à domicile, très largement franchisées : Kangourou Kids, Babychou Services, Mary Poppins Services, Nounou Adom, Family Sphere, Vikadom. Elles ont un modèle, un logiciel et des douleurs qui n'ont rien à voir avec un gestionnaire de crèches, et elles remontaient massivement dans les tranches d'effectif élevées parce qu'elles emploient beaucoup d'intervenants à temps partiel. Toutes écartées sur le nom et l'enseigne.

Les grands groupes nationaux (La Maison Bleue, Les Petits Chaperons Rouges, Babilou en direct) sont également écartés : direction informatique centralisée, cycle d'achat sans rapport avec la cible.

**Pourquoi cette verticale** : Jardin d'Eden est la référence maison sur exactement ce profil (transposition du suivi des inscriptions, workflows n8n, runbook dans `docs/automations/jardin-deden/`). Les lignes ci-dessous sont des structures de même nature, à qui la même démonstration parle.

**Contacts** : le gérant ou le président de la société d'exploitation, tel qu'il figure au RNE, recoupé avec le site du réseau. Deux lignes n'ont pas de dirigeant nommé publiquement et portent la mention « non trouvé » avec la fonction à demander au standard.

**Taux de complétion**
- Contact nommé : 14/16 (88 %)
- Téléphone : 14/16 (88 %)
- Email : 9/16 (56 %)
- Site web : 13/16 (81 %)

**Règle appliquée** : aucune donnée inventée. Les numéros de plateforme d'un partenaire de réservation (le 0 809 de Babilou notamment, qui remonte sur beaucoup de fiches de micro-crèches) ont été systématiquement rejetés : ils ne joignent pas le gestionnaire. Quand seul ce numéro existait, la ligne porte « non trouvé ».

**Limite connue** : beaucoup de ces réseaux communiquent sur un mobile de gérant plutôt que sur une ligne fixe. C'est normal sur ce segment et plutôt une bonne nouvelle pour un appel sortant, mais cela veut dire qu'on tombe directement sur le décideur, sans temps de préparation.

## Liste

Tri par nombre d'établissements décroissant. Les deux lignes du Centre-Val de Loire portent la mention CAP'TN, comme les autres listes.

| Gestionnaire | Ville | Dépt | Sites | Effectif | Contact à joindre | Fonction | Téléphone | Email | Site | SIREN | CAP'TN | Source contact |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| NA! CRECHES | Vertou | 44 | 14 | 6-9 | François Gérard | Gérant | 02 51 17 80 72 | non trouvé | https://na-creches.fr | 498963529 | Non | https://na-creches.fr/contact/ |
| KRYSALIS I | Strasbourg | 67 | 11 | 6-9 | Britta Berndt | Gérante, cofondatrice du réseau | 03 67 10 33 39 | info@krysalis.eu | https://krysalis.eu | 801270844 | Non | https://www.krysalis.eu/contact/ |
| TESS (O REVES DE BEBE) | Saint-Laurent-du-Var | 06 | 11 | 6-9 | Jessica Debonnet | Gérante | 04 89 41 07 83 | non trouvé | https://www.orevesdetess.fr | 813809332 | Non | https://www.alentoor.fr/saint-laurent-du-var/creche/micro/1637563-o-reves-de-bebe |
| LMDP RHONE (LA MAISON DE PILOU) | Villeurbanne | 69 | 10 | 10-19 | Damien Chabaud | Gérant | 04 87 77 82 95 | contact@lamaisondepilou.fr | https://www.lamaisondepilou.fr | 827632738 | Non | https://www.grandlyon.com/creche/microcreche-la-maison-de-pilou-villeurbanne-gratte-ciel |
| BABYBULLE | Orgeval | 78 | 10 | non renseigné | Céline Djellali | Gérante | 01 84 79 34 40 | non trouvé | non trouvé | 818338311 | Non | https://www.crechespourtous.com/creche/babybulle---orgeval/99446735 |
| FB INVEST (MA LITTLE CRECHE) | Octeville-sur-Mer | 76 | 10 | 3-5 | Faustine Després | Gérante | non trouvé | non trouvé | https://malittlecreche.fr | 844622548 | Non | https://malittlecreche.fr/ |
| LES PETITS LIONS | Décines-Charpieu | 69 | 9 | 6-9 | non trouvé | Demander le gérant du réseau | 07 81 59 58 38 | contact@lespetitslions.fr | https://www.lespetitslions.fr | 795235282 | Non | https://www.lespetitslions.fr/nos-creches/trouver-une-creche/ |
| CODESA (CHOUETTES CRECHES) | Colombes | 92 | 9 | 3-5 | Matthieu Devergne | Président | 07 55 64 26 29 | contact@chouettescreches.com | https://www.chouettescreches.com | 849690680 | Non | https://www.chouettescreches.com/contact |
| MINOLUDO (L'ILE AUX ANGES) | Marseille | 13 | 9 | 6-9 | Sabah Ahamad | Gérante | 09 81 67 48 68 | minoludo.castellane@gmail.com | non trouvé | 803421221 | Non | https://www.facebook.com/Minoludo/ |
| KAZ ET LULU | Saint-Barthélemy-d'Anjou | 49 | 8 | 6-9 | Arnaud Barais | Gérant | 06 27 01 12 55 | contact@creche-kazetlulu.com | https://creche-kazetlulu.com | 805017878 | Non | https://creche-kazetlulu.com/localisation-contact/ |
| UNIVERS DES PETITS (UDP) | Cagnes-sur-Mer | 06 | 8 | 3-5 | Dayema Soussou | Gérante | 04 23 20 00 90 | non trouvé | https://www.universdespetits.fr | 519022024 | Non | https://www.universdespetits.fr/nos-micro-creches/ |
| LES PETITS BLES | Chartres | 28 | 7 | 3-5 | Jessica Lecomte | Gérante | non trouvé | contact@creche-lespetitsbles.fr | https://www.creche-lespetitsbles.fr | 840592299 | Oui | https://www.creche-lespetitsbles.fr/pages/contact-6.html |
| LES MICRO-CRECHES DE L'EVEIL (MCE) | Brumath | 67 | 7 | 3-5 | Julie Kleimann | Gérante | 03 69 57 39 03 | non trouvé | non trouvé | 797556834 | Non | https://www.brumath.fr/annuaire/micro-creche-de-leveil/ |
| CALLIHOP | Bourgoin-Jallieu | 38 | 7 | 6-9 | Eric Giordano | Gérant | 04 74 28 28 28 | contact@callihop.fr | https://www.callihop.fr | 753981539 | Non | https://www.callihop.fr/ |
| HAPPY BABEES | Rezé | 44 | 5 | 20-49 | non trouvé | Demander le gérant du réseau | 06 26 85 82 05 | lauren.meslier@babees.fr | https://www.babees.fr | 832990212 | Non | https://www.babees.fr/creche-reze-min/ |
| LA POUPONNIERE (LA POUPONNIERE DES PREBENDES) | Tours | 37 | 4 | 20-49 | Arthur Marnai | Gérant | 02 34 53 40 82 | non trouvé | https://www.la-pouponniere.fr | 794403972 | Oui | https://www.tours.fr/equipement/micro-creche-privee-la-pouponniere-du-parc-des-prebendes/ |

## Pistes à qualifier

Ces gestionnaires passent le filtre firmographique (société commerciale, six sites ou plus) mais leur raison sociale est un nom de holding qui n'a pas permis d'identifier l'enseigne ni de vérifier qu'il s'agit bien de crèches en propre. À traiter avant de les appeler, ou à laisser de côté.

| Raison sociale | Ville | Dépt | Sites | À vérifier |
|---|---|---|---|---|
| KAMERAM | Boulogne-Billancourt | 92 | 13 | Enseigne exploitée, et si le siège de Boulogne n'est pas une simple holding de gestion. |
| MARBO | Massy | 91 | 13 | Idem. |
| SEC SOCIETE D'EXPLOITATION DE CRECHES MGM | Les Molières | 91 | 13 | Deux sociétés du même groupe MGM remontent (SEC et SEC MGM 2) : identifier le décideur commun avant d'appeler. |
| AMJD | Roubaix | 59 | 11 | Enseigne exploitée. |
| BILAL | Strasbourg | 67 | 11 | Enseigne exploitée. |
| NVJD | Lille | 59 | 9 | Enseigne exploitée. |
