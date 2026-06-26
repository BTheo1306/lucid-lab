# Lucid Lead Runner

The local "hands" of the Lucid OS lead engine. It drives Anthony's real, logged-in
LinkedIn session (a dedicated Chrome profile on this machine) to send the connection
invites and follow-ups that Lucid OS has queued, and reports accepts/replies back.

Lucid OS is the brain (sourcing, scoring, drafting, daily caps). This runner only
sends what it is told, paced like a human.

## Setup (one time)

```bash
cd tools/lead-runner
npm install
npm run install-browser        # installs Chromium for Playwright
cp .env.example .env           # then fill LEAD_RUNNER_TOKEN + LUCID_OS_BASE_URL
```

`LEAD_RUNNER_TOKEN` must match the `LEAD_RUNNER_TOKEN` set in Vercel.

Log Anthony in once so the session persists in the dedicated profile:

```bash
npm run login                  # opens LinkedIn; log in, pass any device check, Ctrl+C
```

## Run

```bash
npm run once                   # a single cycle (good for testing)
npm start                      # loop: poll, send, scan, sleep
```

## Safety model (do not weaken these)

- **Caps come from the server.** The queue endpoint never returns more than the
  remaining daily cap (default ~20 invites/day). Keep it that way.
- **Human pacing.** Sends are spaced by a random `MIN_DELAY_SEC..MAX_DELAY_SEC`
  and only run inside the account's business hours.
- **Single session.** Do not use Anthony's LinkedIn from another device/browser
  while the runner is mid-cycle. Two concurrent sessions from two locations is the
  main ban signal. The dedicated profile here is the only place it should run.
- **Kill switch.** Toggling outreach off in Lucid OS stops this runner on its next
  cycle (it checks every loop).
- **Keep volume low during warm-up** (start ~5/day, climb over 3 to 4 weeks).

## Known limitations

- LinkedIn DOM changes often. The selectors live in `linkedin.mjs`; expect to
  adjust them occasionally. Run `npm run once` and watch the logs after any LinkedIn
  UI change.
- Acceptance detection is approximate (LinkedIn exposes no clean "accepted" list),
  so the primary value is the invite + personalized note; follow-ups are best-effort.
