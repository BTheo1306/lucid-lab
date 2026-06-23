# LinkedIn automation: build spec

Status: LIVE (2026-06-23). Deployed (commit 2971f56) and connected on Anthony's personal profile. Env vars set, OAuth authorized, banner green. Crons run once per day (forced by the Vercel Hobby limit, see "Hobby cron constraint" below).

## What shipped
- **Validate in the CRM** (`/admin/lucid-os/social`): approve / reject / re-queue / edit, plus "Nouveau post". Server actions in `src/app/admin/(dashboard)/lucid-os/social/actions.ts`.
- **OAuth connect** at `/admin/integrations/linkedin/connect` (+ `/callback`). Lives under `/admin` so the admin session cookie reaches it; CSRF-protected with a `state` cookie. Tokens stored in `integration_accounts.metadata` (service-role only), parent `integrations` row created lazily.
- **Posting cron** `/api/cron/linkedin-post` (daily 08:00 UTC, ~10h Paris): publishes `approved` + due posts on Anthony's feed, then posts the `link_in_comment` URL as the first comment. Failures are captured in `social_posts.metadata.last_error` with an attempt counter (capped at 5).
- **Auto-approve cron** `/api/cron/linkedin-autoapprove` (daily 07:00 UTC): flips `queued` posts within 24h of their slot to `approved` (silence = approval).
- **Weekly email cron** `/api/cron/linkedin-weekly` (Mondays): refreshes engagement on last week's posts, emails `info@lucid-lab.fr` with this week's queue + last week's reactions/comments.
- LinkedIn client: `src/lib/admin/linkedin/client.ts` (API calls) + `account.ts` (token storage + refresh).

### Posting endpoint decision
We post via `/v2/ugcPosts` with a plain-text `shareCommentary`, NOT `/rest/posts`. The newer `commentary` field requires backslash-escaping reserved characters `( ) [ ] { } < > # * _ ~ | @`, and our French copy is full of parentheses and punctuation. ugcPosts takes raw UTF-8. If LinkedIn ever rejects ugcPosts for this app, the fallback is `/rest/posts` plus a commentary escaper; the first real post will surface this (the error lands in the post's `metadata.last_error`, visible in the CRM).

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
