# LinkedIn automation: build spec

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
