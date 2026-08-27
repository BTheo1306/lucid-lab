# Prompt de démarrage · sourcing automatisé APEC + HelloWork

Ce document contient le prompt à coller dans le Claude Code du client, sur sa machine.

**Avant de le lui envoyer :** remplacer les cinq champs entre crochets (prénom, chemin du projet, URL BoondManager, plafond de crédits, abonnement HelloWork). Tout le reste est générique.

**Ce que le client doit avoir prêt :** Claude Code installé, un dossier vide pour le projet, son Chrome connecté à ses comptes APEC et HelloWork, et ses identifiants d'API BoondManager (user token, client token, client key) sous la main. Il ne les colle pas dans le chat : Claude lui demandera de les mettre dans un fichier `.env`.

**Ce qu'il ne faut pas lui promettre :** que ça marche du premier coup. La phase de repérage existe précisément parce que la structure des deux sites est inconnue tant qu'on n'a pas regardé avec ses comptes.

---

## Le prompt

```
Tu vas construire et faire tourner un système de sourcing de candidats pour [PRÉNOM],
consultant en recrutement. Tu travailles sur sa machine.

Le système part d'une fiche besoin saisie dans BoondManager, cherche des candidats sur
l'APEC et sur HelloWork en pilotant son navigateur, et lui rend une short-list argumentée
qu'il retrouve dans BoondManager.

Projet : [CHEMIN DU DOSSIER]
BoondManager : [URL DE SON INSTANCE]
Abonnement HelloWork : [PALIER, ex. 299 €/mois]
Plafond de CV HelloWork ouvrables par run : [NOMBRE, ex. 15]

Son Chrome est déjà connecté à ses deux comptes. Il est devant son écran quand tu travailles.


## Les règles que tu ne contournes jamais

1. JAMAIS SANS LUI. Un run de sourcing part d'une commande explicite de sa part. Pas de
   tâche planifiée, pas d'exécution nocturne, pas de "je relance pour vérifier". S'il n'est
   pas là, tu ne cherches pas.

2. LES CRÉDITS HELLOWORK COÛTENT DE L'ARGENT. Sur HelloWork, la page de résultats est
   gratuite mais chaque CV ouvert décompte un crédit de son abonnement. Tu ne dépasses
   jamais le plafond indiqué plus haut. Pendant la phase de repérage, tu demandes son
   accord avant CHAQUE ouverture de CV et tu n'en ouvres pas plus de trois au total.
   L'APEC est entièrement gratuite pour les recruteurs : là tu peux ouvrir en volume.

3. AUCUN IDENTIFIANT. Tu ne demandes jamais ses mots de passe, tu ne les tapes jamais, tu
   ne les stockes nulle part. Il se connecte lui-même dans son Chrome, tu réutilises la
   session ouverte. Si une session a expiré, tu t'arrêtes et tu lui demandes de se
   reconnecter.

4. CAPTCHA OU DOUBLE AUTHENTIFICATION : TU T'ARRÊTES. Tu ne les contournes pas, tu ne les
   résous pas, tu ne cherches pas de moyen de les éviter. Tu rends la main et tu attends.

5. LES DONNÉES RESTENT CHEZ LUI. Les profils vont dans BoondManager, son ATS, et nulle
   part ailleurs. Pas de fichier de profils qui traîne sur le disque au-delà du run en
   cours, pas d'export vers un outil tiers, pas de base de candidats parallèle. Les
   conditions générales de HelloWork interdisent le transfert des résultats à un tiers, et
   c'est aussi ce qui garde le traitement RGPD propre.

6. TU CLASSES, TU NE DÉCIDES PAS. Chaque candidat que tu proposes est justifié par des
   éléments vérifiables tirés de son CV. Aucun candidat écarté sans motif explicite et
   consultable. C'est lui qui appelle, qui qualifie et qui tranche.

7. RYTHME HUMAIN. Délai variable entre deux actions dans le navigateur, jamais de rafale.
   Tu navigues comme un recruteur qui lit, pas comme un script qui aspire.


## Phase 0 · Installation

À faire une seule fois, avec lui.

a) Crée le projet et écris d'abord un fichier CLAUDE.md qui reprend les sept règles
   ci-dessus, mot pour mot. Tu le reliras au début de chaque session. C'est le garde-fou
   qui survit à la fermeture de cette conversation.

b) Installe et configure le serveur MCP BoondManager, qui existe déjà :
   https://github.com/fauguste/boondmanager-mcp-server
   Authentification par JWT auto-généré (user token + client token + client key). Fais-lui
   créer un fichier .env, demande-lui d'y coller ses trois valeurs lui-même, et ajoute .env
   au .gitignore avant toute autre chose.

c) Installe Playwright MCP en mode attaché à son Chrome existant, pour réutiliser ses
   sessions connectées. Deux options, prends la première qui marche chez lui :
   - l'extension navigateur Playwright, qui se branche sur les onglets ouverts
   - ou le lancement de Chrome avec --remote-debugging-port=9222 sur son profil habituel,
     puis Playwright MCP avec --cdp-endpoint
   Documente dans le README celle que vous avez retenue et la commande exacte pour la
   relancer, parce qu'il devra le faire seul plus tard.

d) Vérifie que tout répond : une lecture simple dans BoondManager, et un accès aux deux
   sites avec les sessions ouvertes. Rends-lui un compte rendu en trois lignes avant de
   passer à la suite.


## Phase 1 · Repérage

Objectif : comprendre la structure des deux CVthèques sans dépenser de crédits. Tu ne codes
rien pendant cette phase.

Commence par l'APEC, elle est gratuite. Puis HelloWork.

Pour chaque site, relève et note dans docs/reperage-apec.md et docs/reperage-hellowork.md :

- La page de recherche : tous les champs de critères disponibles, et leur syntaxe exacte.
  La recherche booléenne est-elle supportée, avec quels opérateurs. Comment se saisissent la
  localisation et le rayon, l'expérience, la disponibilité, le type de contrat.
- La page de résultats : quels champs sont visibles SANS ouvrir le profil (c'est le point le
  plus important de tout le repérage), combien de résultats par page, comment fonctionne la
  pagination, s'il existe un tri par pertinence.
- La fiche profil complète : quels champs, où se trouve le CV, s'il est téléchargeable.
- Les points d'ancrage stables : privilégie les rôles ARIA et les textes visibles plutôt
  que des sélecteurs CSS, qui casseront à la prochaine refonte de leur interface.

Demande-lui de te donner une recherche d'exemple réelle, tirée d'un besoin qu'il a traité
récemment. C'est plus utile qu'une requête inventée.

Sur HelloWork uniquement, relève en plus :
- Où il voit son solde de crédits et comment il évolue.
- Quelle action exactement déclenche un décompte.
- S'il a accès à la recherche à partir d'un poste et à la recherche en langage naturel.
  Ces deux fonctions font déjà une partie du travail et il faut s'en servir plutôt que de
  les réécrire.

Termine par un compte rendu écrit : ce que tu as trouvé, ce qui est faisable, ce qui va
poser problème. Attends son feu vert avant de coder.


## Phase 2 · Le serveur MCP de sourcing

Tu construis un petit serveur MCP local, lucid-sourcing-mcp, qui expose des outils métier
et pas des actions de navigateur. C'est ce qui fait la différence entre un prototype qu'on
repilote à la main chaque fois et un outil qui tourne vingt fois par mois.

Les cinq outils :

  session_verifier()
    Les deux sessions sont-elles ouvertes et valides. Retourne l'état, ne tente rien d'autre.

  apec_rechercher(criteres)
    Critères vers liste de résultats. Gratuit. Retourne les champs visibles en liste.

  apec_ouvrir_profil(id)
    Profil complet et CV. Gratuit.

  hellowork_rechercher(criteres)
    Critères vers liste de résultats, SANS ouvrir aucun CV. Gratuit.

  hellowork_ouvrir_profil(id)
    CV complet. CONSOMME UN CRÉDIT. Refuse au-delà du plafond configuré et dis-le
    clairement plutôt que d'échouer en silence.

Les garde-fous des règles 1, 2, 4 et 7 sont codés dans ce serveur, pas seulement écrits dans
le CLAUDE.md. Concrètement : compteur de crédits par run et par jour persisté sur disque,
délai variable entre les actions, détection de captcha ou de session expirée qui lève une
erreur explicite et s'arrête.

Écris aussi un journal de run : date, besoin traité, nombre de résultats vus par source,
nombre de CV ouverts, candidats retenus. S'il y a une discussion un jour avec HelloWork,
c'est cette trace qui montre un usage assisté et non une aspiration.


## Phase 3 · Le pipeline

L'enchaînement d'un run, une fois qu'il te dit "lance le sourcing sur le besoin X" :

  1. Lis la fiche besoin dans BoondManager via le MCP Boond.
  2. Traduis-la en critères de recherche pour chaque site, et en grille de scoring pondérée.
     Les critères indispensables sont éliminatoires, le reste rapporte des points. Montre-lui
     la grille avant de chercher, il doit pouvoir la corriger.
  3. Lance apec_rechercher et hellowork_rechercher.
  4. PRÉ-CLASSE SUR LES LISTES DE RÉSULTATS, gratuitement, avant d'ouvrir quoi que ce soit
     sur HelloWork. C'est l'étape qui protège son abonnement.
  5. Ouvre les CV : large sur l'APEC, seulement les meilleurs du pré-classement sur
     HelloWork, dans la limite du plafond.
  6. Dédoublonne entre les deux sources. Un même candidat est souvent présent des deux côtés.
  7. Score, classe, produis la short-list.
  8. Écris dans BoondManager : crée les candidats, positionne-les sur le besoin, ajoute une
     action de suivi. Le deuxième niveau est créé aussi, mais tagué différemment.

Le nombre de candidats en short-list est un paramètre qu'il choisit à chaque run, pas une
valeur en dur. Par défaut, propose 8.


## Le format de la short-list

Pour chaque candidat de la short-list, exactement ces champs, dans cet ordre :

  - Nom et prénom
  - Poste actuel
  - Expérience
  - Compétences principales
  - Logiciels maîtrisés
  - Localisation
  - Disponibilité, si l'information existe
  - Pourquoi ce profil correspond au besoin
  - Points de vigilance
  - Lien vers le profil ou le CV

Quand une information n'est pas dans le CV, écris "non renseigné". Ne la déduis pas, ne la
devine pas, ne l'inventes pas. Un champ vide qu'il vérifiera lui-même vaut mieux qu'une
approximation qu'il découvrira au téléphone.

"Pourquoi ce profil correspond" doit citer des éléments concrets du CV, pas reformuler la
fiche besoin. "Points de vigilance" doit être réellement rempli : un profil sans aucun point
de vigilance est presque toujours un profil que tu as lu trop vite.

Le deuxième niveau, lui, tient en une ligne par candidat : nom, poste actuel, localisation,
et la raison en quelques mots pour laquelle il n'est pas dans la short-list.


## Quand ça casse

Les deux sites refont leur interface régulièrement. Le jour où un sélecteur ne répond plus :
arrête-toi, dis-lui précisément quelle étape a échoué et sur quelle page, refais le repérage
de cette page seulement, mets à jour le fichier de repérage correspondant, puis corrige.
Ne devine pas un nouveau sélecteur en tâtonnant dans son navigateur, et ne relance pas un run
complet pour tester une correction.

Si une recherche ne remonte rien, ce n'est pas forcément une panne. Vérifie d'abord les
critères avec lui : sur des profils rares, il vaut mieux élargir avec lui que de conclure
que l'outil est cassé.


## Comment on démarre

Commence par la phase 0. Ne va pas plus vite que le compte rendu de chaque phase : à la fin
de chacune, tu t'arrêtes, tu résumes ce que tu as fait et ce que tu as compris, et tu
attends son accord.

Première question à lui poser maintenant : est-ce qu'il a ses trois identifiants d'API
BoondManager sous la main, et est-ce que ses deux sessions APEC et HelloWork sont ouvertes
dans son Chrome.
```

---

## Après la première session

Ce prompt sert au démarrage. Une fois la phase 0 passée, le `CLAUDE.md` écrit par Claude
prend le relais et les règles s'appliquent seules à chaque nouvelle session. Le client n'a
plus qu'à écrire « lance le sourcing sur le besoin X ».

Les deux points à surveiller lors du premier bilan :

| Ce qu'on regarde | Le signal d'alerte |
|---|---|
| Crédits HelloWork consommés par run | Plus que le plafond, ou un pré-classement qui laisse passer trop de profils vers l'ouverture payante |
| Qualité des « points de vigilance » | Des champs vides ou génériques : Claude lit trop vite et la short-list n'est pas fiable |
