# Webhook Fireflies : mise en service

Endpoint : `src/app/api/webhooks/fireflies/route.ts` (POST). Statut : scaffold à relire et activer.

Quand une réunion est transcrite, Fireflies appelle ce endpoint. Le endpoint récupère la transcription, en extrait une synthèse CRM (Anthropic), écrit un `audit_events`, et envoie un digest email à `info@lucid-lab.fr` via le SMTP existant.

## Ce qu'il fait (et ne fait pas)

- Fait : capture factuelle (audit) + digest email automatique, sans intervention.
- Ne fait pas : créer ou modifier des clients/opportunités automatiquement. La réconciliation CRM complète (A/B/D/F) reste pilotée par le skill `/fireflies-sync`, avec un humain dans la boucle, conformément à la règle Lucid-Lab « l'IA propose, l'humain valide, le système exécute ».

## 1. Secrets à ajouter

Dans Vercel (et `.env.local` pour le dev) :

| Variable | Rôle |
|---|---|
| `FIREFLIES_API_KEY` | clé API Fireflies (Settings > Developer > API). Lecture des transcriptions. |
| `FIREFLIES_WEBHOOK_SECRET` | Signing Secret Fireflies (app.fireflies.ai/settings) ; le route vérifie la signature `x-hub-signature` (HMAC-SHA256). |

Déjà présents et réutilisés : `ANTHROPIC_API_KEY`, `AI_MODEL`, `SMTP_*`, `EMAIL_FROM`, `TEAM_NOTIFICATION_EMAIL`, `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`.

## 2. Déployer

Pousser sur `main` (Vercel déploie en production). L'URL de production :
`https://lucid-lab.fr/api/webhooks/fireflies`

## 3. Enregistrer le webhook dans Fireflies

Page Integrations > webhook > ajouter l'URL ci-dessus. Renseigner le **Signing Secret** = la valeur `FIREFLIES_WEBHOOK_SECRET`, et s'abonner à l'événement **Transcription completed**. Fireflies signe alors chaque payload (`x-hub-signature`, HMAC-SHA256) et le route le vérifie. Ne jamais mettre de secret dans l'URL.

## 4. Tester

Lancer une courte réunion (ou réémettre un webhook depuis Fireflies). Vérifier : un email de digest reçu sur `info@lucid-lab.fr` et une ligne dans `audit_events` (`event_type = 'fireflies_webhook'`).

## 5. Aller plus loin (optionnel)

- Consolider l'envoi email dans `src/lib/bot/integrations/email-client.ts` (ajouter `sendFirefliesDigest`) plutôt que le transport inline.
- Brancher la réconciliation CRM : au lieu d'un simple audit, créer un `agent_tasks` « Relire et synchroniser la réunion <titre> » qui déclenche `/fireflies-sync`.
- Filtrer par channel (Clients, Ventes & Prospection, Interne, Partenaires) pour router le traitement.

## Lien avec le reste du dispositif

- Skill moteur : `~/.claude/skills/fireflies-sync/SKILL.md`
- Registry clients (dossiers Drive + matching) : `scripts/clients_registry.json`
- AI Skill natif Fireflies « Synthèse CRM de réunion pour Lucid-Lab » : envoie déjà un email par réunion. Le webhook ajoute la couche CRM/audit côté Lucid OS.
