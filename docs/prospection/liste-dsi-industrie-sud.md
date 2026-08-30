# DSI industrie Sud : liste de prospection téléphonique

## Origine

Fichier Excel transmis par Tom (Consulteis) le 30 août 2026, en retour du setup Claude
livré pour son entreprise. Le fichier brut contient 1 529 contacts et 670 sociétés :
directeurs des systèmes d'information, RSSI et responsables informatiques, très
majoritairement en PACA et en Occitanie (Marseille, Montpellier, Toulouse, Nice,
Aix-en-Provence, Avignon), sur des secteurs industrie, énergie, BTP, pharma et
agroalimentaire.

Le fichier source n'est pas versionné : il contient les coordonnées personnelles
telles que Tom nous les a transmises. Seule la liste triée ci-dessous entre dans le
dépôt, et seule la partie retenue entre dans le CRM.

## Ce qui a été corrigé dans le fichier brut

Le fichier mélangeait deux mises en page. Sur environ 350 lignes, les colonnes étaient
décalées : les téléphones se trouvaient dans les colonnes « Secteurs » et « Métiers »,
le secteur dans la colonne « Ville », et l'email dans une colonne annexe. Les deux
formats ont été réalignés avant tri, sinon un contact sur cinq serait arrivé dans le
CRM avec un numéro de téléphone en guise de secteur.

Vingt-sept variantes de nom ont aussi été fusionnées : `FONDASOL` / `Fondasol`,
`Aeroports de la Côte d'Azur` / `Aéroports de la Côte d'Azur`, `Ingerop` / `Ingérop`,
`setec tpi` / `SETEC TPI`, etc.

## Critères de tri

Les effectifs viennent de l'API publique `recherche-entreprises.api.gouv.fr`
(tranche INSEE, millésime 2023) : 609 des 670 sociétés ont été rapprochées d'un SIREN.
L'effectif ne sert qu'à écarter un grand groupe passé au travers des listes nominatives,
jamais à déclasser une société : un « 0 salarié » désigne presque toujours la holding
d'un groupe (Boccard, CNIM, PONANT, TERREAL…), pas une petite structure.

Trois motifs d'exclusion, détaillés société par société dans
`liste-dsi-industrie-sud-ecartes.csv` :

| Motif | Sociétés | Contacts | Pourquoi |
| --- | --- | --- | --- |
| Trop gros | 181 | 877 | CAC 40, SBF 120, multinationales et filiales de ces groupes. Achats centralisés, équipes IA internes, cycle de vente hors de portée d'un appel sortant fait par une agence de trois personnes. |
| Secteur public | 144 | 188 | Mairies, départements, métropoles, hôpitaux publics, agences d'État, organismes sociaux, écoles. L'achat passe par marché public : pas de référencement, pas d'antériorité marchés. |
| ESN / concurrent | 100 | 134 | SSII, cabinets de conseil IT, intégrateurs, éditeurs, cybersécurité. Ils vendent eux-mêmes du conseil SI et IA. |

À elles seules, six sociétés représentaient 458 contacts du fichier de départ :
Schneider Electric (141), Danone (108), TotalEnergies (73), CMA CGM (47),
Air Liquide (45) et Egis (44).

Les 29 contacts sans nom de société n'ont pas été importés : impossible de juger la
taille de l'entreprise, donc impossible de les qualifier avant l'appel.

## Résultat

**218 sociétés, 266 contacts** (218 principaux et 48 secondaires), dont 155 avec un
numéro de téléphone direct, 203 avec un email, 141 avec les deux, et **198 avec le site
de l'entreprise**. Trente-cinq lignes en double à l'identique dans le fichier de Tom ont
été supprimées au passage.

Deux niveaux de priorité :

- **A (133 sociétés)** : effectif connu entre 10 et 2 000 salariés. Cœur de cible,
  à appeler en premier.
- **B (85 sociétés)** : effectif à confirmer (SIREN de holding ou société non
  rapprochée), ou ETI de 2 000 à 5 000 salariés au cycle de décision plus long.

Quand une société comptait plusieurs interlocuteurs, le contact le mieux qualifié
devient le contact principal : intitulé réellement SI d'abord, puis portable direct,
puis email, puis séniorité du poste (DSI et CIO avant responsable, responsable avant
chef de projet). Les 48 contacts secondaires sont conservés en note sur la fiche, avec
leur fonction et leurs coordonnées : de quoi rebondir si le premier fait barrage.

Six fiches portent la note « Fonction non SI : vérifier l'interlocuteur avant
d'appeler ». Le fichier de Tom a été constitué en cherchant « technology » dans les
intitulés, ce qui a fait entrer quelques ingénieurs procédés (Axens, NEMERA, Mecalac,
Akuoenergy, Bertin Technologies) qui ne sont pas des décideurs SI.

## Sites des entreprises

Le fichier de Tom ne contient pas les sites. Ils ont été reconstitués, puis vérifiés
avant écriture dans le CRM :

- **192 depuis le domaine de l'email professionnel du contact.** C'est le domaine de
  la société par construction ; il suffit qu'il existe pour être retenu. Une
  redirection qui sort de ce domaine n'est pas suivie : `actia.fr` renvoyait vers
  `actiaenergy.com`, une autre entité du groupe.
- **6 depuis un nom de domaine deviné, retenu seulement si la page cite la société.**
  Ce garde-fou a écarté `mpsa.fr` (« est en vente »), un domaine parqué chez GoDaddy
  pour le Groupe Blachère, et `fr.shop-orchestra.com`, qui est le vêtement enfant
  alors que notre ORCHESTRA est un éditeur de logiciels parisien.
- **20 sans site** : champ laissé vide plutôt qu'un lien approximatif.

Deux sociétés sont sorties de la liste à cette occasion :

- **GUARANÍ**, dont le site annonce « Entreprise de Services du Numérique, 350
  collaborateurs » : c'est un concurrent, il rejoint les écartés.
- **Hotel Martinez**, dont le contact écrit depuis `maregionsud.fr` : il travaille en
  réalité à la Région Sud, une collectivité déjà écartée. La ligne était fausse à la
  source.

## Réserves

- Les fonctions sont libellées en anglais dans le fichier de Tom (« Director of
  Information Systems » pour un DSI). Elles ont été laissées telles quelles : les
  retraduire aurait risqué d'inventer un intitulé que la personne ne porte pas.
- Aucune vérification n'a été faite sur la fraîcheur des coordonnées. Le fichier ne
  porte pas de date de collecte, et une ligne indique « Dsi Retired… » : il faut
  s'attendre à des numéros et des postes périmés.
- Un rapprochement automatique entre le nom de la société et le domaine de l'email a
  signalé onze écarts. Dix sont légitimes (sigles, domaines de groupe : `ami-indus.com`
  pour Atelier Métallurgique Industriel, `groupe-rdt.com` pour RDT Logistic). Le
  onzième était l'erreur Hotel Martinez ci-dessus.
- L'appartenance à un groupe n'est pas toujours visible dans le nom. Quelques filiales
  de grands groupes ont pu rester dans la liste retenue ; elles se disqualifient d'elles-mêmes
  au téléphone.

## Import

```bash
NODE_OPTIONS=--conditions=react-server npx tsx scripts/import-prospection.ts --dry
```

Secteur CRM : `dsi-industrie-sud`, filtre « DSI industrie (Sud) » dans
Lucid OS > Prospection. L'import est idempotent par nom et secteur.
