# Coffre Obsidian partagé Lucid-Lab : mode d'emploi

Pour Anthony. Décision de la réunion du 02/08/2026 : on crée un coffre Obsidian **partagé** pour Lucid-Lab, distinct des coffres personnels. Objectif : rendre le matériel de missions et de formations interrogeable par l'équipe, sans y mettre quoi que ce soit de personnel.

Temps de mise en place : environ 30 minutes.

## 1. Créer le second coffre

Un coffre Obsidian n'est **qu'un dossier de fichiers**. Rien de plus. On peut en avoir autant qu'on veut, et passer de l'un à l'autre en deux clics. Créer le coffre partagé ne touche pas au coffre existant.

1. Dans Obsidian, cliquer sur le nom du coffre (en bas à gauche), puis « Gérer les coffres ».
2. « Créer un nouveau coffre ».
3. Nom : `Vault-Lucid-Lab`. Emplacement : `~/Documents/`, donc le dossier `~/Documents/Vault-Lucid-Lab`.
4. Ouvrir. C'est fait.

Deux règles pour éviter les ennuis :

- Le coffre partagé doit être **à côté** du coffre perso, jamais **dedans**. Un coffre imbriqué dans un autre casse la synchro et fait écrire Claude au mauvais endroit.
- On **copie** le matériel vers le coffre partagé, on ne déplace pas. Tant que la bascule n'est pas finie, l'original reste dans le perso.

Copier aussi la charte du wiki et l'index dans le nouveau coffre : le partagé suit exactement les mêmes conventions d'écriture que le perso, sinon les deux divergent en trois semaines.

## 2. Ce qui va dans le partagé, ce qui reste perso

**Coffre partagé (`Vault-Lucid-Lab`)**

- Clients et prospects Lucid-Lab : comptes rendus, décisions, contexte de projet.
- Offres, tarifs, argumentaires, scripts de vente.
- Supports de mission et de formation réutilisables : c'est le cœur de ce qu'on veut rendre interrogeable.
- Process, méthodes, runbooks, modèles de documents.
- Comptes rendus de réunion d'équipe.

**Coffre perso (celui qui existe déjà)**

- Vie privée, journal, santé, famille.
- Finances personnelles.
- Notes sur des personnes, jugements, ressentis.
- Missions couvertes par un NDA ou par un engagement de confidentialité qui interdit le partage.
- Brouillons pas encore présentables.

**Le test qui tranche** : si un membre de l'équipe lisait cette note demain matin, est-ce que ça pose un problème ? Si oui, elle reste dans le perso. Une note ne vit que dans un seul coffre, jamais les deux, sinon on ne sait plus laquelle fait foi.

## 3. Le coût

Le partage passe par **Obsidian Sync**, la synchro chiffrée d'Obsidian, qui gère les coffres partagés entre plusieurs personnes.

- **4 $ par personne et par mois** en facturation annuelle.
- **5 $ par personne et par mois** en facturation mensuelle.
- Source : [obsidian.md/pricing](https://obsidian.md/pricing), tarif vérifié le 02/08/2026.

Donc à trois, il faut compter environ 12 à 15 $ par mois au total, pas les 5 à 8 € par personne annoncés en réunion : c'est moins cher que prévu. L'abonnement se compte par personne. La page tarifs ne mentionne pas de limite de nombre de coffres, mais autant le revérifier au moment de souscrire.

À noter : **Obsidian lui-même est gratuit, y compris en usage professionnel**, la licence commerciale est facultative et purement un soutien à l'éditeur ([obsidian.md/license](https://obsidian.md/license)). On ne paie donc que la synchro.

Chaque personne qui doit accéder au coffre partagé a besoin de son propre abonnement Sync. Alternative gratuite possible (dossier partagé iCloud ou Drive, ou dépôt Git), mais sans historique de versions ni gestion propre des conflits : à trois qui écrivent, ça finit en fichiers en double. Sync reste le choix simple.

## 4. La ligne à coller dans le `CLAUDE.md`

Dans `~/.claude/CLAUDE.md`, section « Obsidian Vault », coller ce bloc tel quel. Il suffit à router les ingests automatiquement.

```
Routage des coffres Obsidian : tout ce qui concerne Lucid-Lab et le travail d'équipe (clients, prospects, offres et tarifs, comptes rendus de réunion, process, supports de mission et de formation réutilisables) s'écrit dans le coffre partagé `~/Documents/Vault-Lucid-Lab` ; tout ce qui est personnel ou confidentiel (vie privée, journal, finances, notes sur des personnes, missions sous NDA) reste dans le coffre perso `~/Documents/Vault`. Une note ne va que dans un seul coffre, jamais les deux. En cas de doute, écrire dans le coffre perso et me signaler l'hésitation en fin de réponse.
```

Deux ajustements possibles :

- Si le coffre perso n'est pas dans `~/Documents/Vault`, remplacer le chemin par le bon. Les deux chemins doivent être exacts, sinon Claude écrit à côté.
- Si un type de contenu revient souvent et hésite entre les deux (par exemple un support de formation client sous NDA), l'ajouter nommément dans la liste concernée plutôt que de laisser Claude arbitrer à chaque fois.

## 5. Vérifier que ça marche

Trois tests, deux minutes :

1. Demander à Claude : « Où écris-tu une note sur un client Lucid-Lab ? » Il doit répondre le coffre partagé.
2. Demander : « Où écris-tu une note personnelle ? » Il doit répondre le coffre perso.
3. Lui faire créer une vraie note Lucid-Lab, puis vérifier dans le Finder qu'elle est bien dans `~/Documents/Vault-Lucid-Lab`.

Si un des trois se trompe, c'est presque toujours un chemin mal orthographié dans le bloc collé.

## 6. Ensuite

- Basculer le matériel de missions et de formations par lots, pas d'un coup, en retirant au passage ce qui est nominatif ou confidentiel.
- Inviter les autres membres sur le coffre partagé une fois qu'il contient quelque chose d'utile, pas avant.
- Refaire un point à deux semaines : ce qui a été partagé, ce qui manque, ce qui a été routé au mauvais endroit.

## Sources

- Tarif Obsidian Sync : [obsidian.md/pricing](https://obsidian.md/pricing), consulté le 02/08/2026.
- Usage commercial gratuit : [obsidian.md/license](https://obsidian.md/license), consulté le 02/08/2026.
- Décision de création du coffre partagé : réunion d'équipe du 02/08/2026.
