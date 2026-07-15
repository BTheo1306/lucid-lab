# Admin login: Google SSO

The Lucid OS dashboard (`lucid-lab.fr/admin`) is gated by Google sign-in,
restricted to an explicit email allowlist. There is no password login. The
shared `ADMIN_API_KEY` stays only as a backend credential for two machine API
routes (GDPR contact-delete, debug BDC send); it can no longer open a browser
session.

## One-time Google Cloud setup

1. Google Cloud Console → APIs & Services → **Credentials** → Create
   credentials → **OAuth client ID**.
2. Application type: **Web application**.
3. Authorized redirect URIs (add every origin you sign in from):
   - `https://lucid-lab.fr/admin/auth/google/callback` (production)
   - `http://localhost:3000/admin/auth/google/callback` (local dev, optional)
   - the Vercel preview origin if you want to test on a preview deploy
4. Consent screen: **External**, publishing status can stay "Testing" since only
   three users are allowed. Add the three emails as test users, or publish it.
5. Copy the **Client ID** and **Client secret**.

Only the `openid email` scope is requested. No Google data is read or stored
beyond the verified email address.

## Environment variables (Vercel: Production + Preview)

| Variable | Value |
| --- | --- |
| `GOOGLE_OAUTH_CLIENT_ID` | the OAuth client ID |
| `GOOGLE_OAUTH_CLIENT_SECRET` | the OAuth client secret |
| `ADMIN_ALLOWED_EMAILS` | the three admin Google emails, comma-separated (set in Vercel only, never committed) |
| `ADMIN_SESSION_SECRET` | a fresh random value, e.g. `openssl rand -base64 48` |
| `GOOGLE_OAUTH_REDIRECT_URI` | optional; only if you want to pin the callback URL instead of deriving it from the request origin |

Notes:
- `ADMIN_ALLOWED_EMAILS` is the allowlist. Empty = nobody can log in (fail
  closed). Editing it and redeploying instantly grants or revokes access, and
  revokes any live session on the removed account's next request.
- `ADMIN_SESSION_SECRET` signs the session cookie. Setting it explicitly means
  rotating `ADMIN_API_KEY` will not log everyone out. If unset, the session
  falls back to signing with `ADMIN_API_KEY`.

## Recommended after cutover

- **Rotate `ADMIN_API_KEY`** in Vercel. It was the old human password, so it may
  live in browser history or notes. Rotating does not affect Google login.
- **Enable 2FA** on all three Google accounts. Login security now rests on those
  accounts.

## How it works

- `/admin/auth/google` sets a short-lived CSRF `state` cookie and redirects to
  Google's account chooser.
- `/admin/auth/google/callback` verifies the state, exchanges the code, reads the
  verified email, checks it against `ADMIN_ALLOWED_EMAILS`, and issues the
  `ll_admin_session` cookie (12h) carrying that email.
- Every admin request re-checks the signature, expiry, and the allowlist.
- All three users see exactly the same data; the difference is identity: sign-in
  and denied attempts are written to the security audit log with the email.

## Recovery

If Google OAuth is ever misconfigured and no one can log in, fix the env vars and
redeploy, or roll back to the previous deployment in Vercel. There is
intentionally no browser password fallback.
