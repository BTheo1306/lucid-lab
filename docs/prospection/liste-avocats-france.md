# Liste d'appel : cabinets d'avocats français

Outil de prospection téléphonique. 38 lignes, extraction du 16/08/2026, emails nominatifs repris le 17/08/2026. Se lit avec le script d'appel `scripts/avocats.md`.

## Méthode

**Source firmographique** : base SIRENE / RNE via l'API publique `recherche-entreprises.api.gouv.fr` (données officielles INSEE et registre national des entreprises).

**Critères de sélection**
- Code NAF 6910Z (activités juridiques), établissement actif (`etat_administratif = A`), siège social dans le département indiqué.
- Tranche d'effectif INSEE 6 à 49 salariés (tranches 03, 11 et 12), c'est-à-dire des structures qui correspondent à la cible du script : 1 à 30 avocats.
- Deux cabinets au maximum par département dans le bloc métropoles, pour couvrir douze villes plutôt que douze cabinets de la même ville.

**Comment les notaires et les huissiers ont été écartés**

Le code NAF 6910Z ne distingue pas les professions juridiques entre elles : il mélange avocats, notaires, commissaires de justice, administrateurs judiciaires, commissaires-priseurs et associations tutélaires. Le nom du cabinet ne permet pas de trancher, beaucoup de structures portant simplement le patronyme des associés.

Le filtre appliqué est la **convention collective déclarée à l'INSEE** (champ `liste_idcc`), qui est un identifiant officiel :

| IDCC | Convention | Traitement |
|---|---|---|
| 3253 | Salariés des cabinets d'avocats | retenu |
| 1000 et 1850 | Anciennes conventions des cabinets d'avocats | retenus |
| 2205 | Notariat | écarté |
| 3250 | Commissaires de justice et sociétés de ventes volontaires | écarté |
| 3244 | Professions réglementées auprès des juridictions | écarté |

Sur 516 entreprises remontées par l'API, 147 portent la convention des cabinets d'avocats. Aucune ligne de cette liste n'est un office notarial ou une étude de commissaire de justice.

**Deux blocs**
1. Centre-Val de Loire (37, 41, 45, 18, 28, 36) : 16 lignes. Ces cabinets sont implantés en région Centre-Val de Loire, donc a priori éligibles au dispositif régional CAP'TN (prise en charge d'une partie d'une mission de conseil). C'est l'argument d'ouverture. L'éligibilité définitive se confirme dossier par dossier auprès de la Région.
2. Métropoles régionales (Lyon, Marseille, Toulouse, Bordeaux, Nantes, Lille, Strasbourg, Rennes, Montpellier, Grenoble, Dijon, Clermont-Ferrand) : 22 lignes.

Tri par effectif décroissant dans le bloc 1, par département puis effectif décroissant dans le bloc 2.

**Contacts** : chaque ligne vise un avocat associé ou le dirigeant du cabinet. Jamais le standard, jamais une assistante. Les noms viennent du RNE, du site du cabinet, de l'annuaire du barreau local ou de l'annuaire national avocat.fr. La colonne « Source contact » donne l'URL exacte.

**Emails : uniquement des adresses nominatives**

La colonne Email ne contient que l'adresse personnelle de l'avocat visé. Les boîtes génériques du cabinet (`contact@`, `accueil@`, `secretariat@`, `reception@`, `standard@`) ont été retirées : elles arrivent au secrétariat, c'est-à-dire exactement au barrage que le script cherche à contourner. Onze adresses de ce type ont été supprimées lors de la passe du 17/08/2026.

Deux sources ont fourni les adresses nominatives, dans cet ordre de préférence :
1. la fiche de l'avocat sur le site du cabinet (Desnoix, Gerigny, A.B.R.S., PVB, JASO, Gueguen) ;
2. l'annuaire officiel du barreau, quand le cabinet ne publie rien (Chartres, Blois, Nantes, Lille, Bordeaux, Toulouse). Tous les barreaux ne publient pas les emails : Bourges, Rennes et Grenoble ne le font pas.

Une adresse trouvée sur un agrégateur de contacts (RocketReach et assimilés) n'a jamais été retenue seule : ces sites reconstituent les adresses par déduction de format. Celle de Jean-Christophe Coubris n'a été gardée qu'après confirmation par l'annuaire du barreau de Bordeaux.

**Taux de complétion**
- Contact nommé : 38/38 (100 %)
- Téléphone : 36/38 (95 %)
- Email nominatif de l'avocat : 16/38 (42 %)
- Site web : 37/38 (97 %)

**Règle appliquée** : aucune donnée inventée. Aucun email n'a été déduit d'un format type prenom.nom@domaine.fr. Les cases vides portent la mention « non trouvé ». Pour les 22 cabinets sans adresse nominative publiée, le téléphone reste le canal, ce qui correspond de toute façon au script : l'offre ne se transmet jamais par mail.

**Limite connue** : les numéros de téléphone proviennent du site du cabinet quand il en publie un, sinon d'un annuaire professionnel public. La colonne « Source contact » indique dans quel cas on se trouve. Les effectifs sont des tranches INSEE millésime 2023 et comptent les salariés, pas les avocats associés : un cabinet affiché « 10-19 » compte souvent une dizaine d'avocats en plus.

## Pourquoi appeler maintenant

Le script d'appel ouvre sur les vacations judiciaires : août est le seul mois où un avocat n'a pas d'audience, et la rentrée judiciaire arrive début septembre. Cette fenêtre se referme. Passé la rentrée, l'ouverture bascule sur le début de semaine, comme prévu dans le script.

## Bloc 1 : Centre-Val de Loire (argument CAP'TN)

| Cabinet | Ville | Dépt | Effectif | Contact à joindre | Fonction | Téléphone | Email | Site | SIREN | CAP'TN | Source contact |
|---|---|---|---|---|---|---|---|---|---|---|---|
| WALTER & GARANCE AVOCATS | Joué-lès-Tours | 37 | 20-49 | Isabelle Avril | Gérante, avocate associée | 02 47 61 01 32 | non trouvé | https://www.walter-garance.com | 402679823 | Oui | https://www.walter-garance.com/contact/ |
| ARCOLE | Tours | 37 | 10-19 | Fabien Boisgard | Gérant, avocat associé | 02 47 85 28 52 | non trouvé | https://www.arcole-avocats.com | 494667298 | Oui | https://www.arcole-avocats.com/rdv_site_Tours.php |
| CABINETS DESNOIX | Tours | 37 | 10-19 | Emeric Desnoix | Gérant, avocat associé | 09 70 52 00 50 | emeric.desnoix@cabinet-desnoix.com | https://avocat.cabinet-desnoix.com | 922816111 | Oui | https://avocat.cabinet-desnoix.com/les-equipes/ |
| CM & B COTTEREAU MEUNIER BARDON SONNET CHEFNEUX ET ASSOCIES (CM&B AVOCATS) | Tours | 37 | 10-19 | Guillaume Bardon | Gérant, avocat associé | 02 47 61 31 78 | non trouvé | https://cmb-avocats-associes.fr | 811130681 | Oui | https://cmb-avocats-associes.fr/contact/ |
| ALCIAT - JURIS | Bourges | 18 | 6-9 | Bertrand Couderc | Gérant, avocat associé | 02 48 27 10 80 | non trouvé | https://alciat-juris.fr | 348967910 | Oui | https://www.alciat-juris.fr/contact/ |
| CASADEI-JUNG | Orléans | 45 | 6-9 | Jean-Christophe Casadei | Gérant, avocat associé | 02 38 42 24 25 | non trouvé | https://www.cj-avocats.fr | 801698234 | Oui | https://www.cj-avocats.fr/cabinet/presentation |
| LAVILLAT - BOURGON | Montargis | 45 | 6-9 | Cécile Bourgon | Gérante, avocate associée | 02 38 85 46 88 | non trouvé | https://lavillat-bourgon.com | 339887275 | Oui | https://lavillat-bourgon.com/contact-cabinet-avocats-lavillat-bourgon-montargis-html/ |
| LAVISSE-BOUAMRIRENE-GAFTONIUC | Orléans | 45 | 6-9 | Nadjia Bouamrirene | Gérante et associée (nom dans la raison sociale) | 02 38 53 26 82 | non trouvé | https://www.avocats-lavisse-bouamrirene.fr | 380325977 | Oui | https://www.avocats-lavisse-bouamrirene.fr/contact |
| SANDRINE AUDEVAL | Blois | 41 | 6-9 | Sandrine Audeval | Avocate, dirigeante du cabinet | 02 54 57 15 00 | sandrine.audeval@avocat.fr | non trouvé | 401248778 | Oui | https://avocats-blois.com/audeval-sandrine/ |
| SCP GERIGNY CHEVASSON USSEGLIO MERCIER FLEURIER BOUILLAGUET PERRET BOULANGER DALLOIS-SEGURA REGNIER | Bourges | 18 | 6-9 | Béatrice Bouillaguet | Gérante et associée (nom dans la raison sociale) | 02 48 67 50 90 | beatrice-bouillaguet@altajuris.com | https://www.gerigny-associes.com | 775018740 | Oui | https://www.gerigny-associes.com/ |
| SCP MERY-RENDA-KARM (MRK AVOCATS ASSOCIES) | Chartres | 28 | 6-9 | Mathieu Karm | Gérant, avocat associé | 02 37 21 78 45 | mathieu.karm@mrkg.fr | https://www.mrk-avocats-chartres.fr | 343248225 | Oui | https://www.ordredesavocats-chartres.com/Mathieu-KARM.html |
| CONFLUENCES AVOCATS | Chinon | 37 | 3-5 | Magali Devaud-Panneau | Gérante, avocate associée | 02 47 98 55 00 | non trouvé | https://avocats-confluences.com | 451896625 | Oui | https://avocats-confluences.com/confluences-avocats/contact/ |
| SELARL GIBIER - FESTIVI - RIVIERRE - GUEPIN (GFRG) | Chartres | 28 | 3-5 | Justine Garnier | Gérante, avocate associée | 02 37 21 74 74 | non trouvé | https://www.gfrg-avocats.com | 750967002 | Oui | https://www.gfrg-avocats.com/contact |
| A.B.R.S. CONSEIL & DEFENSE | Tours | 37 | non renseigné | Emmanuel Rebillard | Président, avocat associé | 02 47 05 82 95 | emmanuel.rebillard@abrs.fr | https://www.abrs-avocats-niort-tours-37-79.com | 342317153 | Oui | https://www.abrs-avocats-niort-tours-37-79.com/les-avocats/ |
| ORVA - VACCARO ET ASSOCIES | Tours | 37 | non renseigné | Pierre-Alban Bernardin | Gérant, avocat associé | 02 47 20 26 26 | non trouvé | https://www.orva.legal | 491445342 | Oui | https://www.eurojuris.fr/annuaire/cabinets/orva-vaccaro-associes-tours-786.htm |
| SCP AVOCATS CENTRE (AVOCATS CENTRE) | Bourges | 18 | non renseigné | Sandrine Thiault | Gérante, avocate associée | 02 48 27 27 60 | non trouvé | http://www.avocatscentre.fr | 775018765 | Oui | https://www.barreau-bourges.com/cabinet-avocat-bourges/s.c.p.-avocats-centre-bourges/ |

## Bloc 2 : métropoles régionales

| Cabinet | Ville | Dépt | Effectif | Contact à joindre | Fonction | Téléphone | Email | Site | SIREN | Source contact |
|---|---|---|---|---|---|---|---|---|---|---|
| ATORI AVOCATS | Marseille | 13 | 10-19 | Fabien Bousquet | Gérant, avocat associé | 04 96 11 08 08 | non trouvé | https://atori-avocats.fr | 891867616 | https://atori-avocats.fr/contact/ |
| LEGI CONSEILS BOURGOGNE | Dijon | 21 | 20-49 | Arnaud Joubert | Gérant, avocat associé | 03 80 28 05 50 | non trouvé | https://www.groupelegi.com | 351285275 | https://www.groupelegi.com/en/legi-conseils-avocats/ |
| CANNET MIGNOT (LEGASPHERE AVOCATS) | Quétigny | 21 | 10-19 | Laurence Bachelot | Gérante, avocate associée | 03 80 46 12 01 | non trouvé | https://legasphere.fr | 478959000 | https://legasphere.fr/ |
| ALTIJ & ORATIO AVOCATS | Toulouse | 31 | 10-19 | France Charruyer | Associée fondatrice | 05 61 14 61 00 | fcharruyer@altij.com | https://www.altij.fr | 442744850 | https://www.avocats-toulouse.com/annuaire/charruyer-france |
| MORVILLIERS SENTENAC & ASSOCIES | Toulouse | 31 | 10-19 | Gilles Bernat | Gérant, avocat associé | 05 62 27 50 50 | non trouvé | https://www.ms-associes.com | 389470170 | https://www.ms-associes.com/contact/ |
| COUBRIS ET ASSOCIES | Bordeaux | 33 | 10-19 | Jean-Christophe Coubris | Gérant, avocat associé fondateur | 05 56 17 13 03 | jc.coubris@coubris-associes.fr | https://www.avocats-coubris-et-associes.fr | 510430416 | https://www.barreau-bordeaux.com/avocat/coubris-jean-christophe/ |
| LES JURISTES ASSOCIES DU SUD-OUEST | Bordeaux | 33 | 10-19 | Jean Bader | Gérant, avocat associé | 05 56 81 33 18 | jean.bader@jaso.fr | https://www.jaso.fr | 327234092 | https://www.jaso.fr/equipe.html |
| PVB AVOCATS | Montpellier | 34 | 20-49 | Fabrice Baboin | Gérant, avocat associé | 04 67 15 89 00 | fbaboin@pvb-avocats.fr | https://www.pvb-avocats.fr | 342386158 | https://www.pvb-avocats.fr/equipe/ |
| SVA | Montpellier | 34 | 20-49 | Jean-Claude Attali | Gérant, avocat associé | 04 67 58 75 00 | non trouvé | https://www.sva-avocats.fr | 315129981 | https://www.sva-avocats.fr/profiles/jean-claude-attali/ |
| ARES | Rennes | 35 | 20-49 | Pierre-Yves Ardisson | Avocat associé | 02 99 67 83 83 | py.ardisson@aresavocats.com | https://www.ares-avocats-rennes.com | 777743782 | https://www.ares-avocats-rennes.com/contact/ |
| COUDRAY URBANLAW | Rennes | 35 | 20-49 | Raphaële Antona Traversi | Gérante, avocate associée | 02 99 30 16 28 | non trouvé | https://cabinet-coudray.fr | 422218339 | https://cabinet-coudray.fr/implantations/rennes/ |
| CABINET LONJON & ASSOCIES (JDA) | Montbonnot-Saint-Martin | 38 | 10-19 | Jean-Marc Lonjon | Avocat associé fondateur | 04 76 46 12 02 | jml@avocatslonjon.com | https://www.avocatslonjon.com | 403425812 | https://www.avocatslonjon.com/contacter-les-avocats-lonjon-et-associes.html |
| SELARL GUMUSCHIAN-ROGUET-BONZY-POLZELLA (BASTILLE AVOCATS) | Grenoble | 38 | 10-19 | Laurence Gumuschian | Avocate associée (nom dans la raison sociale) | 04 76 03 28 80 | gumuschian@bastille-avocats.fr | https://www.bastille-avocats.fr | 519781447 | https://www.bastille-avocats.fr/implantations/grenoble/ |
| GUEGUEN AVOCATS | La Chapelle-sur-Erdre | 44 | 20-49 | Antoine Blanchard | Gérant, avocat associé | 02 40 29 42 42 | ablanchard@gueguenavocats.com | https://www.gueguenavocats.com | 332264886 | https://www.gueguenavocats.com/equipe/antoine-blanchard/ |
| PARTHEMA AVOCATS | Nantes | 44 | 20-49 | Caroline Autret | Gérante, avocate associée | 02 51 84 33 00 | autret.avocat@gmail.com | https://parthema.fr | 440495992 | https://www.barreaunantes.fr/annuaire/caroline-autret/ |
| SELARL ADEKWA - SOCIETE D'AVOCATS | Marcq-en-Barœul | 59 | 10-19 | Véronique Vitse-Boeuf | Gérante, avocate associée | 03 20 65 65 80 | v.vitseboeuf@adekwa-avocats.com | https://adekwa-avocats.com | 491801304 | https://www.avocats-lille.com/fr/annuaire/tableau/id-1278-vitse-boeuf-veronique |
| AUXIS AVOCATS | La Madeleine | 59 | 6-9 | Amandine Boddaert | Gérante, avocate associée | 03 20 17 72 72 | aboddaert@auxis-avocats.fr | https://auxis-avocats.fr | 439820663 | https://www.avocats-lille.com/fr/annuaire/tableau/id-222-boddaert-amandine |
| CESIS - CABINET D'AVOCATS | Clermont-Ferrand | 63 | 20-49 | Olivier Arnoux de Maison Rouge | Gérant, avocat associé | 04 73 19 25 25 | non trouvé | https://www.cesis-avocats.com | 870200052 | https://www.cesis-avocats.com/contact/ |
| CABINET D'AVOCATS ERIC ESTRAMON | Clermont-Ferrand | 63 | 10-19 | Eric Estramon | Avocat associé, dirigeant du cabinet | non trouvé | non trouvé | https://www.estramonavocats.com | 797428216 | https://consultation.avocat.fr/avocat-clermont-ferrand/eric-estramon-21887.html |
| ALEXANDRE-LEVY-KAHN-BRAUN & ASSOCIES | Strasbourg | 67 | 10-19 | Bernard Alexandre | Avocat associé (nom dans la raison sociale) | 03 88 32 30 75 | non trouvé | https://www.alexandre-avocats.fr | 318517968 | https://www.alexandre-avocats.fr/cabinet/presentation |
| CABINET D'AVOCATS SOLER-COUTEAUX ET ASSOCIES | Schiltigheim | 67 | 10-19 | David Gillig | Gérant, avocat associé | 03 88 76 44 55 | non trouvé | https://scl-avocats.com | 443706031 | https://scl-avocats.com/nous-contacter/ |
| LEGI AVOCATS (LEGI CONSULTANTS) | Lyon | 69 | 10-19 | Géraldine Boeuf | Gérante, avocate associée | 04 78 64 85 86 | non trouvé | https://www.legiavocats.eu | 337974307 | https://www.legiavocats.eu/ |

## Cibles écartées

Ces cabinets sont bien des cabinets d'avocats et passent le filtre firmographique, mais sortent de la cible du script. Ils sont conservés ici pour éviter qu'un prochain passage les remonte à nouveau.

| Cabinet | Ville | Effectif | Motif |
|---|---|---|---|
| REFERENS | Tours | 6-9 | A rejoint le groupe national TGS France Avocats en 2026 : la décision d'outillage remonte désormais au groupe. |
| ABEILLE AVOCATS | Marseille | 10-19 | Plus de 45 avocats répartis sur 8 villes, au-dessus de la cible de 1 à 30 avocats. |
| YDES | Lyon | 20-49 | Une centaine d'associés et collaborateurs sur quatre bureaux (Lyon, Paris, Avignon, Bourg-en-Bresse). |

## Note sur les doublons de réseau

LEGI CONSEILS BOURGOGNE (Dijon) et LEGI AVOCATS (Lyon) appartiennent au même Groupe Legi. Ils sont deux entités juridiques distinctes avec des associés différents, ce qui respecte la règle des deux entités maximum par réseau, mais il vaut mieux ne pas les appeler le même jour avec le même argumentaire.
