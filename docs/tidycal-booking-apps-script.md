# TidyCal booking → Lucid OS CRM (via Google Apps Script)

TidyCal has **no native webhooks**, and we don't want a paid relay (Zapier/Make).
Instead, a tiny Google Apps Script watches the `info@lucid-lab.fr` inbox for TidyCal
booking emails and POSTs them to our webhook (`/api/webhooks/tidycal`), which creates
the prospect in the CRM Prospects section.

Bookings made through the **website widget** already sync instantly and do not need
this. This only covers **direct TidyCal-link** bookings (LinkedIn, email signature, etc.).

## How it works

1. Someone books a call → TidyCal emails `info@lucid-lab.fr` from `service@tidycal.com`
   with the subject `New booking with <name> - …` (the subject stays English even when
   the body is French, so it's language-proof to filter on).
2. Every 5 minutes the script finds new such emails (not yet labelled `lucid-synced`),
   parses the invitee name, email and start time, and POSTs them to the webhook.
3. The webhook creates/updates the CRM prospect (lead, `meeting_booked`) + a prep task,
   then the thread is labelled `lucid-synced` so it's never sent twice.

## One-time setup

1. In Vercel, set env var `TIDYCAL_WEBHOOK_SECRET` to a long random string (Production).
2. Go to [script.google.com](https://script.google.com), **signed in as the account that
   receives the TidyCal emails** (`info@lucid-lab.fr`), → **New project**.
3. Paste the script below. Set `WEBHOOK_SECRET` to the same value as the Vercel env var.
4. Run `syncTidycalBookings` once and approve the Gmail permission prompt.
5. Left sidebar → **Triggers** (clock icon) → **Add trigger**:
   `syncTidycalBookings` · Head · Time-driven · Minutes timer · **Every 5 minutes**. Save.

That's it. No Zapier, no Make, no server cron.

## The script (`Code.gs`)

```javascript
/**
 * TidyCal booking -> Lucid OS CRM. Runs under info@lucid-lab.fr on a 5-min timer.
 * Finds new "New booking with..." emails from service@tidycal.com and POSTs the
 * invitee to the Lucid OS webhook. Processed threads get the "lucid-synced" label.
 */
const WEBHOOK_URL = 'https://lucid-lab.fr/api/webhooks/tidycal';
const WEBHOOK_SECRET = 'PASTE_TIDYCAL_WEBHOOK_SECRET_HERE'; // == Vercel env TIDYCAL_WEBHOOK_SECRET
const PROCESSED_LABEL = 'lucid-synced';
const SEARCH_QUERY =
  'from:service@tidycal.com subject:"New booking with" newer_than:3d -label:' + PROCESSED_LABEL;

const MONTHS = {
  janvier: 1, 'février': 2, fevrier: 2, mars: 3, avril: 4, mai: 5, juin: 6, juillet: 7,
  'août': 8, aout: 8, septembre: 9, octobre: 10, novembre: 11, 'décembre': 12, decembre: 12,
  january: 1, february: 2, march: 3, april: 4, may: 5, june: 6, july: 7, august: 8,
  september: 9, october: 10, november: 11, december: 12,
};

function syncTidycalBookings() {
  const label = GmailApp.getUserLabelByName(PROCESSED_LABEL) || GmailApp.createLabel(PROCESSED_LABEL);
  GmailApp.search(SEARCH_QUERY, 0, 25).forEach(function (thread) {
    try {
      const parsed = parseBooking_(thread.getMessages()[0]);
      if (!parsed.email) {
        console.warn('No email parsed: ' + thread.getFirstMessageSubject());
        return;
      }
      if (postBooking_(parsed)) thread.addLabel(label);
    } catch (err) {
      console.error('sync error: ' + err);
    }
  });
}

function parseBooking_(msg) {
  const body = msg.getPlainBody();
  const who = body.match(/([^\n<]+?)\s*<\s*([^\s@>]+@[^\s>]+)\s*>/);
  const tz = body.match(/(?:Fuseau horaire|Timezone)\s*:\s*([A-Za-z]+\/[A-Za-z_]+)/);
  const timezone = tz ? tz[1] : 'Europe/Paris';
  return {
    name: who ? who[1].trim() : null,
    email: who ? who[2].trim().toLowerCase() : null,
    starts_at: parseStartsAt_(body, timezone),
    booking_id: null, // the id in the "View Booking" URL is not reliably encoded; not needed for sync
    timezone: timezone,
  };
}

function parseStartsAt_(body, timezone) {
  const d = body.match(/(\d{1,2})\s+([A-Za-zÀ-ÿ]+)\s+(\d{4})/);
  const t = body.match(/(\d{1,2}):(\d{2})/);
  if (!d || !t) return null;
  const month = MONTHS[d[2].toLowerCase()];
  if (!month) return null;
  const iso =
    d[3] + '-' + ('0' + month).slice(-2) + '-' + ('0' + d[1]).slice(-2) +
    ' ' + ('0' + t[1]).slice(-2) + ':' + t[2];
  try {
    return Utilities.parseDate(iso, timezone, 'yyyy-MM-dd HH:mm').toISOString();
  } catch (e) {
    return null;
  }
}

function postBooking_(payload) {
  const res = UrlFetchApp.fetch(WEBHOOK_URL, {
    method: 'post',
    contentType: 'application/json',
    headers: { 'x-webhook-secret': WEBHOOK_SECRET },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true,
  });
  const code = res.getResponseCode();
  if (code >= 200 && code < 300) return true;
  console.error('Webhook ' + code + ': ' + res.getContentText());
  return false;
}
```

## Notes

- If the start time ever fails to parse, the prospect is still created (with a
  "heure à confirmer" task) rather than dropped, because the webhook only requires the email.
- Reschedule / cancellation emails are not handled yet; add a second search + a
  `cancelled: true` POST if that becomes useful (the webhook already supports it).
- To test: run `syncTidycalBookings` manually after a real booking and check the
  execution log + the CRM Prospects section.
