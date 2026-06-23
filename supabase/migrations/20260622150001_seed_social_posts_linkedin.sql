-- Seed the first LinkedIn content batch (founder-led, large-org / AI-readiness lane).
-- Idempotent: only seeds when the organization has no social posts yet.

INSERT INTO social_posts (organization_id, platform, author_label, pillar, hook, body, link_in_comment, status, scheduled_for)
SELECT org.id, 'linkedin', 'Anthony Poirier', v.pillar, v.hook, v.body, 'https://lucid-lab.fr/audit-flash', 'queued', v.scheduled_for
FROM (SELECT id FROM organizations WHERE slug = 'lucid-lab' LIMIT 1) org
CROSS JOIN (VALUES
  ('poc-graveyard',
   $h$80% des projets IA en grande entreprise ne passent jamais en production. Et le problème n'est presque jamais le modèle.$h$,
   $b$80% des projets IA en grande entreprise ne passent jamais en production. Et le problème n'est presque jamais le modèle.

On nous appelle souvent après le POC. L'IA marche en démo, puis elle reste bloquée là. Ce qui coince, ce n'est pas la techno, c'est tout le reste :
- l'intégration au SI existant (ERP, CRM, données éparpillées)
- la gouvernance (RGPD, EU AI Act, traçabilité, sécurité)
- le monitoring et la fiabilité en conditions réelles
- l'adoption par les équipes

Un POC, c'est 20% du travail. La mise en production, c'est les 80% que personne ne montre en démo.

C'est exactement là qu'on intervient : transformer une idée qui marche en système qui tourne, que vos équipes utilisent et que vous gardez (code, accès, doc).

Combien de POC IA dorment dans vos tiroirs en ce moment ?$b$,
   now() + interval '3 days'),
  ('automatisation',
   $h$Dans une grande organisation, le coût caché ce n'est pas l'IA. C'est le travail manuel que personne ne mesure.$h$,
   $b$Dans une grande organisation, le coût caché ce n'est pas l'IA. C'est le travail manuel que personne ne mesure.

Ressaisies entre outils. Validations qui transitent par 6 boîtes mail. Reporting reconstruit à la main chaque mois. Pris isolément, ça paraît anodin. À l'échelle d'une direction, c'est des milliers d'heures par an.

L'automatisation IA en entreprise, ce n'est pas remplacer des gens. C'est rendre du temps à vos experts pour ce qui a vraiment de la valeur.

Notre méthode : on cartographie les workflows, on score chaque cas d'usage (valeur, faisabilité, risque), on construit d'abord là où le ROI est défendable devant un comité, puis on déploie en production avec monitoring et conformité.

Quel processus chez vous coûte le plus de temps pour le moins de valeur ?$b$,
   now() + interval '5 days'),
  ('gouvernance',
   $h$Un projet IA en grande entreprise, c'est 20% de modèle et 80% de gouvernance. La plupart des prestataires font l'inverse.$h$,
   $b$Un projet IA en grande entreprise, c'est 20% de modèle et 80% de gouvernance. La plupart des prestataires font l'inverse.

Hébergement EU, RGPD, EU AI Act, matrice d'accès, logs, traçabilité des décisions. Pour une PME c'est un bonus. Pour une banque, un assureur ou un grand groupe, c'est la condition d'entrée.

Ce qui fait passer un projet en production, c'est de pouvoir répondre oui à la question « et si ça dérape, qu'est-ce qui se passe ? » avant même de parler de ROI.

L'IA gouvernée n'est pas un frein à la production. C'est ce qui la rend possible en environnement régulé.

Où en êtes-vous de votre mise en conformité EU AI Act ?$b$,
   now() + interval '8 days'),
  ('opinion',
   $h$Arrêtez d'acheter des outils IA. Commencez à livrer des systèmes IA.$h$,
   $b$Arrêtez d'acheter des outils IA. Commencez à livrer des systèmes IA.

Un outil, c'est une licence de plus dans un SI saturé. Personne ne l'utilise dans 6 mois.
Un système, c'est intégré à vos données, branché à vos process, monitoré, documenté, adopté.

Les grandes organisations n'ont pas un déficit d'outils IA. Elles ont un déficit de systèmes IA qui tiennent en production.

C'est tout ce qu'on fait.$b$,
   now() + interval '10 days'),
  ('ai-readiness',
   $h$Avant d'écrire la moindre ligne de code IA, la plupart des grandes entreprises sautent l'étape qui décide de tout.$h$,
   $b$Avant d'écrire la moindre ligne de code IA, la plupart des grandes entreprises sautent l'étape qui décide de tout.

Une feuille de route IA (AI readiness), ce n'est pas un énième rapport. C'est répondre à 4 questions avant de construire :
- Quels cas d'usage valent vraiment le coup ? (valeur, faisabilité, risque)
- Vos données sont-elles prêtes ? (sources, accès, qualité, hébergement EU)
- Quelle conformité pour chacun ? (RGPD, EU AI Act)
- Quel premier chantier livrer en production, et dans quel ordre ?

Sans ça, on empile des POC. Avec, on sait quoi construire, pourquoi, et avec quel ROI défendable devant un comité.

On a cartographié plus de 90 cas d'usage IA pour un grand compte financier, scorés et priorisés à travers Finance, Conformité, Crédit, Légal et Risque.

Où en est votre feuille de route IA ?$b$,
   now() + interval '12 days')
) AS v(pillar, hook, body, scheduled_for)
WHERE NOT EXISTS (SELECT 1 FROM social_posts sp WHERE sp.organization_id = org.id);
