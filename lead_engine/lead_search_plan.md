# lead_search_plan.md

Date: 27 avril 2026  
Project: Lucid-Lab  
Workspace: `/Users/julesgouron/Projects/lucid-lab`

## Purpose

This document is the full implementation plan for Lucid-Lab's Lead Search Engine.

The goal is to build an internal admin feature that can find, validate, score, and contact leads for Lucid-Lab, while designing the process so it can later be reused and sold to clients as an AI-powered lead search and outreach system.

The final system should not be just a LinkedIn scraper. It should be a CRM-native Lead Engine:

1. Discover target companies.
2. Enrich company and decision-maker data.
3. Detect business pain signals.
4. Score and validate prospects.
5. Generate personalized outreach drafts.
6. Require manual approval before sending in the MVP.
7. Track outreach, replies, bookings, and conversions.
8. Convert qualified outbound prospects into the existing CRM.
9. Keep everything reusable for future client implementations.

Recommended internal feature name: **Lead Engine**.

Recommended client-facing offer name: **AI Lead Search & Outreach Engine**.

Client-facing positioning:

> We build a system that finds, validates, scores, and contacts prospects based on real business-fit signals, then hands qualified replies into your CRM.

---

## Business Context

Lucid-Lab sells custom AI automation and operational systems.

The strongest positioning is not generic "AI automation for everyone." The strongest wedge is helping operationally busy companies stop losing leads, time, and customer satisfaction because of:

- Slow follow-up.
- Manual customer handling.
- Poor CRM discipline.
- Scattered tools.
- Repetitive customer questions.
- Missed booking or quote requests.
- Poor review follow-up.

Lucid-Lab proof point:

- A long-term rental company.
- Can be referenced as a long-term rental company.
- Use anonymized details unless client permission exists.
- System includes customer support automation, FAQ, review management, marketing campaign support, sales escalation tools, and future CRM build-out.

Commercial model:

- Free 30-minute discovery call.
- Paid audit if the prospect is interested but does not know what to build.
- Paid audit starts at EUR 2k and scales with company size/complexity.
- Custom builds start at EUR 5k/month retainer.
- Recommended audit name: **Lead Leakage & Operations Audit**.
- French version: **Audit Fuites de Leads & Operations**.

---

## Target ICP For Lucid-Lab

Primary geography:

- France.

Secondary geography:

- Belgium.
- Switzerland.
- Luxembourg.

Languages:

- French.
- English.

Minimum company size:

- 5 employees.

Ideal company size:

- 10-100 employees.

Also acceptable:

- Larger companies if they do not have strong internal automation resources.
- Owner-led companies if they have clear budget and operational pain.

Primary niche:

1. Mobility.
2. Vehicle rental.
3. Long-term rental.
4. Private transport.
5. Airport transfer.
6. Premium tourism.
7. Experience operators.

Expansion niches:

1. High-ticket service businesses.
2. E-commerce/logistics operations.
3. B2B SaaS only later, because competition and internal resources are stronger.

Avoid or deprioritize:

- Real estate.
- Medical fields.
- Restaurants, unless premium, multi-location, or unusually operationally complex.

Target buyer roles:

- Founder.
- CEO.
- Managing Director.
- COO.
- Operations Manager.
- Sales Director.
- Revenue Lead.
- Marketing Lead.
- Customer Support Lead.
- Customer Experience Manager.

Core pain signals:

- Too many inbound messages.
- Slow lead follow-up.
- Manual booking or quoting.
- Poor CRM discipline.
- Leads falling through the cracks.
- Weak customer support process.
- Bad or unmanaged reviews.
- Manual marketing follow-up.
- Repetitive customer questions.
- Multiple tools that do not communicate.
- Heavy reliance on WhatsApp, email, forms, phone, spreadsheets.
- Multiple locations or teams.
- Many Google reviews.
- Premium/high-ticket services.
- Recent growth, hiring, new locations, or expansion.

Existing strategy file:

- `LEAD_TARGETING_STRATEGY.md`

This should remain the source of truth for ICP and targeting decisions.

---

## Existing Repository Context

Current app:

- Next.js 16.2.3.
- React 19.
- TypeScript.
- Supabase.
- Existing admin dashboard under `src/app/admin/(dashboard)`.
- Existing admin auth via custom HMAC-signed cookie session.
- Existing server actions in `src/app/admin/actions.ts`.
- Existing admin data fetching and DTO normalization in `src/lib/admin/dashboard.ts`.

Important files:

- `AGENTS.md`
- `COMPANY_CONTEXT.md`
- `LEAD_TARGETING_STRATEGY.md`
- `supabase/migrations/20260423000000_lucid_lab_schema.sql`
- `src/app/admin/(dashboard)/layout.tsx`
- `src/app/admin/(dashboard)/AdminNav.tsx`
- `src/app/admin/(dashboard)/page.tsx`
- `src/app/admin/(dashboard)/leads/page.tsx`
- `src/app/admin/(dashboard)/conversations/page.tsx`
- `src/app/admin/(dashboard)/bookings/page.tsx`
- `src/app/admin/(dashboard)/contacts/[id]/page.tsx`
- `src/app/admin/actions.ts`
- `src/lib/admin/auth.ts`
- `src/lib/admin/dashboard.ts`
- `src/lib/bot/db/supabase.ts`
- `src/lib/bot/db/queries/leads.ts`
- `src/lib/bot/services/lead.ts`
- `src/lib/bot/integrations/email-client.ts`

Current admin nav:

- Overview.
- Leads.
- Conversations.
- Bookings.

Add:

- Lead Engine.

Suggested route:

- `/admin/lead-engine`

Suggested subroutes:

- `/admin/lead-engine/prospects`
- `/admin/lead-engine/campaigns`
- `/admin/lead-engine/runs`
- `/admin/lead-engine/outreach`
- `/admin/lead-engine/settings` later.

---

## Current CRM Data Model

Existing CRM tables:

- `contacts`
- `conversations`
- `messages`
- `leads`
- `tidycal_bookings`
- `security_audit_log`
- `daily_ai_budget`
- `ai_knowledge_base`
- `rate_limit_buckets`

Existing relationship:

```text
contacts
  -> conversations
       -> messages
  -> leads
  -> tidycal_bookings