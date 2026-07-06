# LinkedIn automation: build spec

Status: LIVE (2026-06-23). Deployed (commit 2971f56) and connected on Anthony's personal profile. Env vars set, OAuth authorized, banner green. Crons run once per day (forced by the Vercel Hobby limit, see "Hobby cron constraint" below).

## 2026-07-06 update: newsletter engine + page reshare + blog split

### Weekly newsletter-style generation (3 posts/week)
The seeded batch was the only content source; once it ran out nothing new appeared, and the posts read as isolated dumps. Now `/api/cron/linkedin-autoapprove` (daily 07:00 UTC) also generates content every **Friday**: one Claude call (`src/lib/admin/social-content-generator.ts`) writes the 3 posts of the coming week, landing as `queued` in the cockpit (silence = approval still applies, review window = the weekend + the Monday email).

Recurring rubriques, so the feed reads like a newsletter with rendez-vous:
- **lundi** "[Le décryptage du lundi]": one AI mechanism explained properly for a PME decision-maker, educational stats only with a real source (institution + chiffre + année), never invented.
- **mercredi** "[Sur le terrain]": a real Lucid-Lab delivery story, drawn from a whitelist of cases baked into the prompt (Universal, Turismo, Périscope, le groupe assurantiel et financier belge, BSP37, setups Claude+Obsidian). No invented client numbers.
- **vendredi** "[Point de vue]": a clear stance on a live AI debate (ton: François Rivard).

Slots are Monday/Wednesday/Friday 07:30 UTC (published by the 08:00 UTC posting run, ~10h Paris). If the coming week already has any post scheduled (manual planning), generation skips entirely. The prompt receives the last 12 hooks to avoid repeating angles. Editorial bans enforced in the prompt: emojis, long dashes, "feuille de route", corporate jargon, unverifiable claims.

### Company page: why mentions never showed on the page, and the fix
A mention (`LINKEDIN_ORGANIZATION_ID`) is just a clickable citation inside Anthony's personal post: LinkedIn never surfaces it on the page feed, and LinkedIn has no Instagram-style "collaboration post". The closest supported mechanism is a **page reshare**: the page publishes a repost of Anthony's post, so the company feed shows it with Anthony's post embedded (both identities visible).

Implemented in `client.ts` (`createOrganizationReshare`, `/rest/posts` + `reshareContext`) and wired into the posting cron.

**LinkedIn requires the Community Management API to be the only product on a developer app** ("for legal and security reasons" per the app dashboard's own tooltip): it cannot be added to the existing app that already has "Share on LinkedIn" + "Sign In with LinkedIn". So this is a **second, dedicated LinkedIn developer app**, with its own OAuth client and its own connected account:
- `src/lib/admin/linkedin/org-account.ts` stores the page's token under a separate `integration_accounts` row (`provider = 'linkedin_org'`), independent of the member account in `account.ts`.
- `client.ts` exposes `buildOrgAuthorizeUrl` / `exchangeOrgCodeForToken` / `refreshOrgAccessToken`, scoped to just `w_organization_social` (no openid/profile: that product isn't on this app).
- New routes `/admin/integrations/linkedin-org/{connect,callback}`, separate from the member `/admin/integrations/linkedin/{connect,callback}`.
- The cockpit at `/admin/lucid-os/social` shows a second connection banner ("Page Lucid-Lab connectée / non connectée") next to the existing member one.

Go-live steps (only Anthony can do these):
1. On developer.linkedin.com, create a **new app** dedicated to the Lucid-Lab page and apply for the **"Community Management API"** product on it (LinkedIn approval process; do not add any other product to this app).
2. Anthony must be admin of the Lucid-Lab page.
3. Set `LINKEDIN_ORG_CLIENT_ID` / `LINKEDIN_ORG_CLIENT_SECRET` on Vercel (see `.env.example`), then connect from the cockpit's page banner (`/admin/integrations/linkedin-org/connect`). This does not touch or require reconnecting the existing member LinkedIn login.

Until the page account is connected, behavior is unchanged (mention only + the manual 1-click "Reposter" from the page). Reshare is best-effort and independent per post: a missing or expired page token never blocks the member post. The page post URN is stored in `social_posts.metadata.org_post_urn`.

### Blog decoupled from LinkedIn (SEO pipeline)
Blog articles are no longer expansions of LinkedIn posts. `/api/cron/blog-generate` (daily 06:30 UTC) now runs the blog's own SEO pipeline:
1. **Idea backlog**: when fewer than 4 `idea` rows exist in `blog_posts`, Claude generates 6 SEO topics (title, angle, category, funnel stage, target keyword stored in `notes`), deduped against every existing title. Ideas are visible/editable in `/admin/blog` before any content is written.
2. **Article generation**: keeps 2 articles queued ahead, scheduled Tuesday/Thursday 06:00 UTC (published by publish-blog 07:00 UTC). The article prompt now enforces target-keyword placement, search-query H2s and a "Questions fréquentes" section (AEO).

Consequences: the posting cron no longer holds LinkedIn posts back waiting for a blog article, publish-blog no longer rewrites `link_in_comment` (the "raccord" is gone; generated posts default their first comment to `https://lucid-lab.fr/audit-flash`), and the LinkedIn cockpit's blog link column only shows for historical rows.

## What shipped
- **Validate in the CRM** (`/admin/lucid-os/social`): approve / reject / re-queue / edit, plus "Nouveau post". Server actions in `src/app/admin/(dashboard)/lucid-os/social/actions.ts`.
- **OAuth connect** at `/admin/integrations/linkedin/connect` (+ `/callback`). Lives under `/admin` so the admin session cookie reaches it; CSRF-protected with a `state` cookie. Tokens stored in `integration_accounts.metadata` (service-role only), parent `integrations` row created lazily.
- **Posting cron** `/api/cron/linkedin-post` (daily 08:00 UTC, ~10h Paris): publishes `approved` + due posts on Anthony's feed, then posts the `link_in_comment` URL as the first comment. Failures are captured in `social_posts.metadata.last_error` with an attempt counter (capped at 5).
- **Auto-approve cron** `/api/cron/linkedin-autoapprove` (daily 07:00 UTC): flips `queued` posts within 24h of their slot to `approved` (silence = approval).
- **Weekly email cron** `/api/cron/linkedin-weekly` (Mondays): refreshes engagement on last week's posts, emails `info@lucid-lab.fr` with this week's queue + last week's reactions/comments.
- LinkedIn client: `src/lib/admin/linkedin/client.ts` (API calls) + `account.ts` (token storage + refresh).

### Posting endpoint decision
We post via `/v2/ugcPosts` with a plain-text `shareCommentary`, NOT `/rest/posts`. The newer `commentary` field requires backslash-escaping reserved characters `( ) [ ] { } < > # * _ ~ | @`, and our French copy is full of parentheses and punctuation. ugcPosts takes raw UTF-8. If LinkedIn ever rejects ugcPosts for this app, the fallback is `/rest/posts` plus a commentary escaper; the first real post will surface this (the error lands in the post's `metadata.last_error`, visible in the CRM).

### Tag de la page Lucid-Lab
Chaque post auto-publié peut mentionner la page entreprise Lucid-Lab pour lui donner un peu d'activité (aujourd'hui les posts ne citent que le profil personnel d'Anthony, la page reste muette).

**Ce que ça fait** : une mention cliquable "Lucid-Lab" est ajoutée en fin de post (`\n\n` puis le nom). La mention pointe vers la page entreprise et notifie les admins de la page qu'ils ont été cités.

**Activation** : définir la variable d'environnement `LINKEDIN_ORGANIZATION_ID` sur Vercel avec l'ID numérique de la page. Pour le trouver : se connecter en tant qu'admin de la page, aller sur `linkedin.com/company/lucid-lab-fr/admin/`, l'ID numérique apparaît dans l'URL une fois la page chargée (ou dans les paramètres de la page). Tant que la variable n'est pas définie, le comportement est identique à aujourd'hui (aucune mention).

**Fallback** : si LinkedIn refuse l'annotation (payload rejeté, page mal configurée, etc.), le cron republie automatiquement le même post sans le tag, pour que la mention ne bloque jamais une publication. La tentative avec tag échouée est loguée en `console.error`.

**Limites et pour aller plus loin** : la mention ne fait PAS apparaître le post dans le feed de la page Lucid-Lab, c'est une simple citation dans un post personnel. Pour publier directement au nom de la page (et donc peupler son feed), il faut le produit LinkedIn "Community Management API" : candidature depuis l'app développeur LinkedIn, scope `w_organization_social`, et Anthony doit être admin de la page. C'est un processus d'approbation LinkedIn, pas juste un flag à activer. Plus simple en attendant : un admin de la page reposte le post en un clic depuis la page Lucid-Lab (bouton "Reposter"), la notification de mention rend ce repost facile à repérer chaque jour.

### Known follow-ups
- No `audit_events` row is written per publication yet (no other side-effect flow in this repo writes them either). The `social_posts` row (status / posted_at / post_url / metadata.post_urn) is the per-post trail for now.
- Impressions stay null (LinkedIn does not expose them for personal posts via API); reactions + comments are pulled.

### Hobby cron constraint (important)
Vercel **Hobby caps cron jobs at once per day**: any sub-daily schedule makes Vercel **reject the whole deployment** at deploy time (error links to `cron-jobs/usage-and-pricing`). The original build (`df166ac`) shipped `linkedin-post` every 30 min and `linkedin-autoapprove` every 6h, so it **silently failed to deploy**: production stayed on the prior commit (`bf501c1`, which has no connect UI), which for a while looked like an env-var / missing-button bug. Fixed in `2971f56` by making both schedules daily (`linkedin-post` 08:00 UTC, `linkedin-autoapprove` 07:00 UTC; `linkedin-weekly` was already weekly). Consequence: a post publishes at the daily 08:00 UTC run that follows its `scheduled_for`, not the exact minute. To restore 30-min granularity, upgrade Vercel to Pro and revert the two schedules.

---

(Original spec below, kept for reference.)

Status: decided, not yet built. Next phase after the `social_posts` content page (live at `/admin/lucid-os/social`).

## Decisions (Jules, 2026-06-23)
- **Posting mechanism**: LinkedIn API ("Share on LinkedIn" product, `w_member_social`) + a Vercel cron. No browser bot (ToS risk).
- **Account**: Anthony's **personal profile** (personal reach >> company page).
- **Validation**: done in the CRM (`/admin/lucid-os/social`): approve / edit / reject, then the cron posts automatically at `scheduled_for`.
- **Silence = approval**: a `queued` post left unchanged past its review window auto-flips to `approved`.
- **Weekly email**: to **info@lucid-lab.fr**, containing this week's queue + last week's performance.

## Data model
Uses the existing `social_posts` table (migration `20260622150000`). Status flow:
`draft -> queued -> approved -> posted` (or `rejected` / `skipped`).
- The posting cron posts rows where `status = 'approved'` AND `scheduled_for <= now()`.
- On success: set `status='posted'`, `posted_at=now()`, `post_url`, store the LinkedIn URN in `metadata`.
- Store Anthony's OAuth token in an `integration_accounts` row (per Lucid OS data model), NOT in env, so it can be refreshed. Add the table if it does not exist yet.

## Components to build
1. **LinkedIn OAuth connect flow** (`/admin/lucid-os/integrations/linkedin`): Anthony clicks "Connecter LinkedIn", authorizes `w_member_social` (+ `openid profile` for his member URN), token stored in `integration_accounts`. Handle refresh.
2. **Posting cron** (`/api/cron/linkedin-post`, every ~15 min): for each due `approved` post, call the LinkedIn Posts API as the member; then post the `link_in_comment` URL as the first comment via the socialActions comments endpoint; update the row to `posted` + metrics seed.
3. **Auto-approve cron** (daily): flip `queued` posts whose review window passed to `approved` (silence = approval), unless `rejected`.
4. **Validate-in-CRM actions** (`actions.ts` server actions on the social page): approve, reject, edit (hook/body/scheduled_for/link), and "Nouveau post". Mirror `lucid-os/clients/actions.ts`.
5. **Metrics fetch** (cron or on-demand): pull engagement (reactions, comments, reposts) for posted posts via the share's socialActions; update `impressions/reactions/comments/reposts` + `metrics_updated_at`.
6. **Weekly email cron** (`/api/cron/linkedin-weekly`, Monday AM): email info@lucid-lab.fr via the existing SMTP, with (a) this week's scheduled/approved posts, (b) last week's posted posts + their metrics.

## Prerequisites (need Anthony / Jules; Claude cannot do these)
- **Anthony creates a LinkedIn Developer app** (developer.linkedin.com), adds the "Share on LinkedIn" + "Sign In with LinkedIn using OpenID Connect" products, sets the redirect URL to the OAuth callback.
- Provide **LINKEDIN_CLIENT_ID** and **LINKEDIN_CLIENT_SECRET** as env vars (Vercel + Infisical/Doppler).
- **Anthony authorizes** the app once via the connect flow (his token is the posting identity).

## Honest caveats
- **Member-post impressions are limited via the API.** Reactions / comments / reposts counts are available for a member's own post; reliable *impression* counts for personal posts are generally NOT exposed by LinkedIn's API. So the weekly "performance" will be solid on engagement, partial on impressions (impressions may need a manual entry or a periodic extension-assisted pull).
- **First comment**: posting the link as the first comment via the API is feasible with `w_member_social` (socialActions comments); verify during build, else fall back to putting the link at the end of the post body.
- LinkedIn member access tokens are short-lived (~60 days) and need refresh-token handling.

## Build order
1. Validate-in-CRM actions (no external dependency, immediately useful). 
2. OAuth connect flow + `integration_accounts`.
3. Posting cron + first comment.
4. Metrics fetch + weekly email.
5. Auto-approve (silence = approval) cron.

---

## Go-live checklist (operational)

1. **In Anthony's LinkedIn Developer app** (developer.linkedin.com):
   - Products enabled: "Share on LinkedIn" (grants `w_member_social`) and "Sign In with LinkedIn using OpenID Connect" (grants `openid profile email`).
   - Authorized redirect URL (exact match): `https://lucid-lab.fr/admin/integrations/linkedin/callback`
     - If the admin runs on another domain, set `LINKEDIN_REDIRECT_URI` to match and register that value instead.

2. **Env vars** (Vercel project, production; mirror locally for testing):
   - `LINKEDIN_CLIENT_ID`
   - `LINKEDIN_CLIENT_SECRET`
   - `LINKEDIN_REDIRECT_URI` (optional; defaults to the URL above)
   - `CRON_SECRET` (already used by the existing crons; confirm it is set)
   - SMTP vars + `TEAM_NOTIFICATION_EMAIL` already default to `info@lucid-lab.fr`.

3. **Connect once**: from `/admin/lucid-os/social`, while logged into the admin AND into LinkedIn as Anthony, click "Connecter LinkedIn" and authorize. The banner turns green.

4. **Verify**: the seeded posts are `queued` and scheduled 3 to 12 days out, so nothing publishes immediately. To smoke-test, create a draft, set its time a few minutes out, approve it, and wait for the posting cron (or hit the cron endpoint with the `CRON_SECRET` bearer).

Notes:
- LinkedIn member access tokens last about 60 days. If no refresh token is issued for the app, the banner will show "Reconnexion requise" when the token lapses and Anthony just clicks "Reconnecter".
- Tokens are stored in `integration_accounts.metadata` (service-role only). For stricter hygiene later, move them to Infisical/Doppler and keep only a `secret_ref`.
