# TidyCal setup — getting your Booking Type ID

The bot uses the TidyCal API to fetch available slots and create bookings. You need:

1. A **Personal Access Token** (API key)
2. The **Booking Type ID** of your discovery-call type

TidyCal will send booking confirmation emails to the visitor automatically — the bot only creates the booking.

---

## 1. Generate a Personal Access Token

1. Log into https://tidycal.com
2. Click your profile → **Settings** → **API**
3. Click **Create Personal Access Token**
4. Name it e.g. `lucid-lab-bot-prod`
5. Copy the token — **you won't see it again**
6. Save it as env var `TIDYCAL_API_KEY`

## 2. Get your Booking Type ID

Run this from your terminal (replace `$TIDYCAL_API_KEY` with your token):

```bash
curl -H "Authorization: Bearer $TIDYCAL_API_KEY" \
     https://tidycal.com/api/v1/booking-types
```

You'll get JSON like:

```json
{
  "data": [
    {
      "id": 12345,
      "title": "Discovery call — Lucid-Lab",
      "duration_minutes": 30,
      "url_slug": "discovery-call",
      ...
    },
    {
      "id": 67890,
      "title": "Deep dive — technical",
      ...
    }
  ]
}
```

Copy the numeric `id` of your **discovery-call** booking type and set it as env var `TIDYCAL_BOOKING_TYPE_ID`.

## 3. Verify slots endpoint works

```bash
TODAY=$(date -u +%Y-%m-%d)
NEXT_WEEK=$(date -u -v+7d +%Y-%m-%d 2>/dev/null || date -u -d '+7 days' +%Y-%m-%d)

curl -H "Authorization: Bearer $TIDYCAL_API_KEY" \
     "https://tidycal.com/api/v1/booking-types/$TIDYCAL_BOOKING_TYPE_ID/timeslots?starts_at=$TODAY&ends_at=$NEXT_WEEK"
```

You should get an array of available slots. If you get 401/403 — token is wrong. If empty — there's no availability configured in the booking type.

## 4. Test booking creation (optional)

> ⚠️ This creates a REAL booking. Skip in production; only run in a test environment.

```bash
curl -X POST \
     -H "Authorization: Bearer $TIDYCAL_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "starts_at": "2026-05-01T10:00:00Z",
       "name": "Test Booking",
       "email": "your-test-email@example.com",
       "timezone": "Europe/Paris"
     }' \
     "https://tidycal.com/api/v1/booking-types/$TIDYCAL_BOOKING_TYPE_ID/bookings"
```

If it succeeds, the test email will receive TidyCal's standard confirmation email — which is exactly what the bot relies on.

---

## Reference

- TidyCal API docs: https://tidycal.com/api
- Support: TidyCal support chat (in dashboard)
