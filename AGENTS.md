<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices. test
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:lucid-lab-agency-ai-os-rules -->
# Lucid-Lab Agency AI OS Rules

## Business Context

Lucid-Lab is an agency that sells websites and AI services: AI agents, automations, lead generation systems, marketing workflows, chat/support assistants, and business process automation.

The internal product direction is `Lucid OS`: an AI operating system used to run the agency. It should manage clients, projects, websites, domains, databases, integrations, agents, automations, approvals, incidents, analytics, and operational knowledge. Build in a way that can later become a productized client-facing platform.

Future agents must optimize for a scalable agency model, not one-off custom infrastructure per client.

## Golden Stack

Use this stack by default unless the user explicitly asks for another provider or there is a strong technical reason to diverge:

| Layer | Default |
| --- | --- |
| Websites and frontends | Next.js on Vercel |
| App database, auth, storage, realtime, vector memory | Supabase |
| DNS, domains, WAF, edge security | Cloudflare |
| Custom backends, workers, Docker apps, self-hosted tools | Railway |
| Durable jobs and production workflows | Trigger.dev or Inngest |
| Low-code/client integration workflows | n8n Cloud or Pipedream |
| AI app and agent runtime | Vercel AI SDK first |
| Advanced agent orchestration | Mastra or OpenAI Agents SDK when needed |
| Complex stateful agent graphs | LangGraph only when the workflow truly needs graph durability/state |
| LLM providers | Anthropic, OpenAI, Gemini, Mistral |
| LLM gateway/cost controls | Vercel AI Gateway, LiteLLM, or Helicone |
| AI traces, prompt debugging, evals | Langfuse or LangSmith |
| Product analytics and feature flags | PostHog |
| App errors/performance | Sentry |
| Uptime/status/incident alerts | Better Stack |
| Secrets | Infisical or Doppler |
| Source control and CI | GitHub and GitHub Actions |
| Human company knowledge | Obsidian vaults |
| Infrastructure as code, later | OpenTofu or Terraform |

## Provider Decision Rules

- Use Vercel for Next.js websites, SEO pages, marketing sites, Lucid OS frontend, preview deployments, ISR/caching, image optimization, and frontend-heavy apps.
- Use Supabase for product data, auth, row-level security, storage, realtime, pgvector, AI memory, client portals, app dashboards, and audit-friendly operational data.
- Use Railway for custom APIs, FastAPI/Django/Rails/Express services, long-running workers, Dockerized services, scraping/browser automation, self-hosted n8n, self-hosted Langfuse, Metabase, private services, and service-specific databases.
- Do not use Railway Postgres as the default client database for sensitive or productized app data unless the user accepts managing backups, disaster recovery, tuning, security, and monitoring. Prefer Supabase for the default agency database layer.
- Use Cloudflare as the standard DNS/domain/WAF layer even when Vercel or Railway hosts the app.
- Use n8n/Pipedream for quick client integrations and business-user automations.
- Use Trigger.dev/Inngest for production-grade workflows requiring retries, queues, schedules, concurrency limits, and durable AI jobs.

## Client Delivery Models

Choose the simplest model that preserves isolation and operability:

1. Standard marketing/lead-gen website:
	- Prefer a shared multi-tenant website engine on Vercel.
	- Use Cloudflare for DNS.
	- Use Supabase for site config, pages, content blocks, form submissions, leads, and client workspace metadata.
	- Do not create a separate deployment for every simple site if one multi-tenant app can safely serve it.

2. Custom website or custom app:
	- Use a dedicated Vercel project when the site/app has custom code, special routing, or significant bespoke behavior.
	- Use a dedicated Supabase project when it stores sensitive client data, real app users, auth, business records, or client-specific operational data.
	- Register the deployment, database, domain, monitors, and integrations back into Lucid OS.

3. Client AI agents and automations:
	- Keep Lucid OS central. Do not deploy a full OS clone per client by default.
	- Connect clients through scoped workspaces, API keys, webhooks, OAuth integrations, widgets, and MCP/tools where useful.
	- Store runtime state, traces, costs, artifacts, approvals, and audit events centrally with client/organization scoping.

4. Enterprise or regulated clients:
	- Use dedicated Vercel/Supabase projects or client-owned infrastructure.
	- Require stronger access controls, backups, audit logs, monitoring, and written runbooks.

## Lucid OS Data Model Direction

When building the agency OS, prefer structured operational tables over loose notes or hidden agent chat. Useful core entities include:

- `organizations`
- `clients`
- `projects`
- `websites`
- `domains`
- `databases`
- `deployments`
- `integrations`
- `integration_accounts`
- `agents`
- `agent_runs`
- `agent_steps`
- `agent_tool_calls`
- `agent_artifacts`
- `agent_tasks`
- `agent_approvals`
- `automation_runs`
- `incidents`
- `monitors`
- `billing_plans`
- `knowledge_documents`
- `knowledge_chunks`
- `audit_events`

Agents should communicate through shared state, events, artifacts, tasks, handoffs, and approvals. Avoid opaque agent-to-agent conversations as the source of truth.

## Memory and Knowledge Rules

- Obsidian is the human-readable company brain: strategy, SOPs, client notes, meeting notes, positioning, offers, and long-form context.
- Supabase is the production runtime memory: permissions, records, embeddings, operational state, agent runs, artifacts, approvals, and audit logs.
- Use both when needed. Do not replace production memory with Obsidian.
- Ingest selected Obsidian/Markdown knowledge into Supabase as indexed documents/chunks with metadata, permissions, and freshness tracking.
- Do not dump the entire company brain into every prompt. Build scoped context packs based on client, project, task, permissions, and recency.

## AI Agent Rules

- Prefer Vercel AI SDK for straightforward tool-calling agents in this TypeScript/Next.js codebase.
- Add Mastra or OpenAI Agents SDK only when the project needs a more formal agent framework.
- Add LangGraph only for genuinely complex, long-running, stateful graph workflows.
- Every agent run should be traceable, replayable where possible, and tied to a client/project/user.
- Track model, prompt version, tools used, tokens/cost, latency, outcome, and errors.
- Use Langfuse or LangSmith for AI observability; use PostHog for product usage and feature analytics.
- For external side effects, use human approval by default: publishing, sending outreach, editing CRM records, deploying, modifying production data, or charging money.
- AI proposes; humans approve; systems execute; everything is logged.

## Security and Isolation Rules

- Never expose Supabase service-role keys to client/browser code.
- Keep service-role logic server-only and use `import 'server-only'` in server data-access modules.
- Use `organization_id`, `client_id`, or `workspace_id` scoping for multi-tenant data.
- Prefer RLS for user-facing/client-facing data access.
- Do not store real client data in this repo.
- Do not create a `clients/` folder in this app repo for sensitive client work or operational data.
- Store secrets in Infisical/Doppler or provider secret stores, not in Git, Obsidian, docs, or plain shared `.env` files.
- Add audit logs for admin actions, agent side effects, integration changes, and production data mutations.

## Observability and Operations Rules

- Every production website/app should have uptime monitoring, error monitoring, and a clear owner/runbook.
- Use Sentry for application errors, performance issues, traces, and release health.
- Use Better Stack for uptime checks, status pages, incident alerts, and simple operational monitoring across many client sites.
- Use PostHog for product analytics, funnels, feature flags, beta rollouts, kill switches, experiments, and LLM/product usage analytics.
- Use Langfuse/LangSmith for prompts, traces, evaluations, and AI debugging.
- Lucid OS should eventually show a client health dashboard: website status, DNS/SSL, database status, backups, incidents, Sentry issues, uptime, AI usage, automation status, and integration health.

## Productization Rules

Build toward repeatable agency tiers:

| Tier | Typical Stack |
| --- | --- |
| Managed Website | Vercel, Cloudflare, Sentry, Better Stack |
| Managed Website + Database | Vercel, Supabase, Cloudflare, monitoring |
| AI Automation Package | Lucid OS, n8n/Pipedream, Trigger.dev/Inngest, integrations |
| AI Agent Package | Lucid OS, Supabase memory, Vercel AI SDK, Langfuse, PostHog |
| Custom App Package | Dedicated Vercel, dedicated Supabase, optional Railway services |
| Enterprise/Dedicated | Dedicated infrastructure, stricter isolation, custom SLA |

Prefer reusable templates, repeatable onboarding, and standard runbooks over bespoke setups.

## What To Avoid

- Avoid 50 random hosting providers.
- Avoid cPanel/VPS-by-default delivery.
- Avoid Kubernetes until there is a clear operational need and team capacity.
- Avoid one Git branch per client as a scaling strategy.
- Avoid custom one-off infrastructure when a standard Lucid stack pattern works.
- Avoid self-hosting critical components on day one unless it creates clear business value.
- Avoid adding new frameworks or infrastructure providers without documenting why the golden stack is insufficient.

<!-- END:lucid-lab-agency-ai-os-rules -->

<!-- BEGIN:vault-rules -->
# Obsidian Vault — Business Knowledge Base

## Location

The vault lives at `~/Documents/Vault /Vault` (note the trailing space in the outer folder name).

```
~/Documents/Vault /Vault/
├── CLAUDE.md        ← vault schema + all operational rules (READ THIS FIRST)
├── index.md         ← content catalog, one line per wiki page
├── log.md           ← append-only chronological operation log
├── raw/             ← immutable source documents — READ ONLY, never modify
└── wiki/            ← maintained wiki pages — you read and write here
    ├── sources/
    ├── entities/
    ├── concepts/
    ├── comparisons/
    └── synthesis/
```

## Start here for Lucid-Lab context

- `wiki/synthesis/lucid-lab-overview.md` — single hub for all Lucid-Lab knowledge (people, offering, clients, financials, open items).
- `wiki/entities/lucid-lab.md` — company entity page.
- `wiki/concepts/lucid-lab-offering.md`, `lucid-lab-methodology.md`, `lucid-lab-tech-stack.md`, `lucid-lab-icp.md` — core business concepts.
- `wiki/synthesis/jules-personal-os.md` — Jules's personal OS (goals, finances, life context).

All Lucid-Lab pages are tagged `#business`; Jules's profile is tagged `#shared`.

## Reading the vault

1. **Read `index.md` first.** It is your map. Find the relevant pages.
2. Drill into the specific `wiki/` pages. Only fall through to `raw/` if you need primary evidence.
3. Every claim in the wiki cites a `[[wiki/sources/<slug>]]` page. Follow those links if you need to verify.

## Writing to the vault

Follow the full workflow in `CLAUDE.md` — reading it before any write operation is mandatory. Key rules:

- **Never modify `raw/`.** It is read-only source material.
- **Discuss before writing.** Surface key takeaways first, get a steer, then write.
- **One source can touch 10–15 wiki pages.** Do the full backlink and cross-reference pass.
- **Cite everything.** Every non-trivial claim links back to a source page.
- **After every write**, update `index.md` and append to `log.md`.
  - Log format: `## [YYYY-MM-DD] <type> | <one-line title>` then `- pages:`, `- raw:`, `- notes:`.
  - Log types: `ingest`, `query`, `lint`, `merge`, `split`, `rename`, `delete`, `synth`, `bootstrap`.
- **Filenames** are kebab-case ASCII slugs. Title goes in YAML frontmatter.
- **Tag every page**: `#business`, `#personal`, or `#shared`.
- **Confirm before destructive ops** (rename, merge, delete).
- **Suggest a git commit** after meaningful changes. Never push silently.

## YAML frontmatter (minimum required)

```yaml
---
title: "<human title>"
type: source|entity|concept|comparison|synthesis
slug: <kebab-slug>
created: YYYY-MM-DD
updated: YYYY-MM-DD
status: stub|draft|stable|needs-review
tags: [business|personal|shared]
sources: []
related: []
confidence: low|med|high
---
```

## Scope tags

| Tag | Meaning |
|---|---|
| `#business` | Lucid-Lab business knowledge |
| `#personal` | Jules's personal life, finances, relationships |
| `#shared` | Cross-cutting (e.g., Jules's profile, methodology concepts) |

When working on this codebase (lucid-lab), only read/write `#business` and `#shared` tagged pages unless explicitly asked to access personal content.

<!-- END:vault-rules -->
