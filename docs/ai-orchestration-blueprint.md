# Lucid OS AI Orchestration Blueprint

## Purpose

Lucid OS should become the operational control plane for Lucid-Lab: one place where humans, agents, automations, clients, projects, documents, approvals, incidents, knowledge, and integrations are coordinated.

The goal is not to clone Hermes or OpenHuman. The right architecture is a Lucid OS-native orchestration layer, with Telegram and the web app as entry points, Supabase as operational memory, durable workflows for real execution, and Railway only where long-running custom services are useful.

## Principles

- Lucid OS is the source of truth.
- Agents communicate through records: runs, tasks, tool calls, artifacts, approvals, audit events, and workflow state.
- External side effects require approval by default: invoices, outreach, CRM writes, publishing, deployments, production data changes, payments, and client-visible messages.
- Every agent run must be traceable: model, prompt version, tools, inputs, outputs, latency, tokens, cost, status, and errors.
- Telegram is an access surface, not the brain. It should route requests into Lucid OS, where they are logged and governed.
- Hermes can inspire runtime/gateway design, but the agency OS should not depend on a fork as its core source of truth.

## Target Architecture

```text
Humans
  - Lucid OS web app
  - Telegram COO bot
  - Admin/API triggers

Control Plane
  - Next.js app routes and server actions
  - COO agent router
  - Agent registry and tool registry
  - Approval queue
  - Audit/event log

Durable Execution
  - Inngest first for workflows, retries, queues, schedules, and concurrency
  - Trigger.dev for heavy browser/media/external integration workers when needed
  - Railway workers for long-running custom services or self-hosted tools

State and Memory
  - Supabase Postgres for operational records
  - Supabase Auth/RLS for future team and client access
  - Supabase Storage for generated files
  - pgvector for scoped knowledge retrieval
  - Obsidian for human-readable business knowledge

Observability
  - Langfuse or LangSmith for AI traces
  - Sentry for app errors
  - PostHog for product analytics and feature flags
  - Better Stack for uptime and incidents
```

## Current Repository Foundation

The repo already contains the right base tables for a serious agency OS:

- `agents`
- `agent_runs`
- `agent_steps`
- `agent_tool_calls`
- `agent_tasks`
- `agent_approvals`
- `agent_artifacts`
- `automation_runs`
- `clients`, `projects`, `websites`, `domains`, `deployments`, `integrations`
- `client_documents`, `client_document_recipients`, `client_document_events`, `client_billing_events`
- `knowledge_documents`, `knowledge_chunks`
- `incidents`, `monitors`
- `audit_events`

This means the first implementation should connect these tables into practical flows before introducing a larger external runtime.

## Human Entry Points

### Lucid OS Web App

The web app is the admin surface for structured work:

- inspect clients, projects, websites, and documents
- create and review tasks
- approve agent side effects
- review runs, errors, artifacts, and audit logs
- manage integrations and credentials metadata
- launch agent workflows from forms and command surfaces

### Telegram COO Bot

Telegram should be used for fast operational capture:

- team members message the COO bot directly or in a team group
- webhook validates Telegram secret token
- allowlist validates sender IDs and/or chat IDs
- COO creates `agent_runs`, `agent_tasks`, and `audit_events`
- COO replies with acknowledgement and the Lucid OS reference
- execution is delegated to specialized agents and approval workflows

Telegram must not become an unaudited admin backdoor. It is a fast command surface that still writes into Lucid OS.

## Team Access Model For Telegram

The Telegram COO bot supports team access with two allowlists:

- `TELEGRAM_COO_ALLOWED_USER_IDS`: individual team members who can command the bot from direct messages or groups.
- `TELEGRAM_COO_ALLOWED_CHAT_IDS`: approved internal team chats or groups where the bot can respond.

Recommended policy:

- For direct messages, require the sender user ID.
- For internal group usage, allow the group chat ID and preferably also add core team member user IDs.
- Log every denied request with sender ID and chat ID so setup is easy.
- Keep side-effect actions behind Lucid OS approvals even when the Telegram sender is trusted.

Webhook security:

- Telegram calls `POST /api/webhooks/telegram/coo`.
- The route requires `x-telegram-bot-api-secret-token` to match `TELEGRAM_COO_WEBHOOK_SECRET`.
- The bot token is server-only and only used to call Telegram `sendMessage`.

## Agent Roles

### COO Agent

The COO is the router and coordinator. It should:

- receive natural-language requests from Telegram and Lucid OS
- classify intent and urgency
- resolve client/project context when possible
- create tasks and runs
- delegate work to specialized agents
- request approvals for side effects
- summarize status back to the human
- monitor blocked workflows and failures

The COO should not silently perform high-risk actions. It coordinates; specialized agents execute through typed tools.

### CRM / Sales Agent

Responsibilities:

- create and update leads, clients, contacts, opportunities, and interactions
- summarize pipeline changes
- enrich CRM records from approved sources
- prepare follow-up drafts
- surface stale leads and next actions

Approval required for:

- sending outreach
- bulk CRM changes
- deleting or overwriting client data

### Finance / Document Agent

Responsibilities:

- draft invoices, quotes, bons de commande, and contract documents
- prepare DocuSeal submissions
- archive signed documents
- record billing events
- summarize payment/document state

Approval required for:

- sending documents to clients
- charging, invoicing, or payment collection side effects
- changing signed document records

### Meeting Ops Agent

Responsibilities:

- ingest notes, transcripts, and meeting summaries
- extract client context, decisions, risks, and next actions
- update tasks and knowledge documents
- draft follow-up emails

Approval required for:

- sending follow-up emails
- making material CRM changes when confidence is low

### Delivery / Project Agent

Responsibilities:

- track project milestones, blockers, and deliverables
- create delivery checklists
- coordinate website/app deployment steps
- raise incidents when delivery risks appear

Approval required for:

- deployments
- DNS changes
- production data changes

### Monitoring / Incident Agent

Responsibilities:

- ingest Sentry, Better Stack, Vercel, Railway, Supabase, and Cloudflare signals
- open incidents
- propose diagnosis and remediation steps
- keep stakeholders updated through Lucid OS

Approval required for:

- customer-facing incident communications
- production changes
- provider configuration changes

### Knowledge Agent

Responsibilities:

- sync selected Obsidian knowledge into Supabase knowledge documents/chunks
- maintain source links, freshness, scope, and retrieval metadata
- prepare scoped context packs for other agents

Approval required for:

- writing durable business knowledge
- ingesting sensitive or client-specific sources

## Tool Registry

Agents should call typed tools rather than importing arbitrary app internals. A tool should define:

- name and description
- input schema
- output schema
- permissions and risk level
- whether it has external side effects
- idempotency strategy
- audit event type
- approval requirements

Initial tool groups:

- CRM read/write tools
- document draft/create/send tools
- task create/update tools
- approval request/decision tools
- knowledge search/write tools
- incident create/update tools
- notification tools
- integration health tools

## Workflow Engine Direction

Use Inngest first for durable agency workflows:

- retries
- schedules
- event-driven orchestration
- idempotency
- concurrency limits
- visibility into failed jobs

Use Trigger.dev when workflows need heavier external workers, browser automation, file processing, or longer-running jobs.

Use Railway for custom services and workers that need persistent runtime behavior, self-hosted tools, or Dockerized systems.

Do not introduce Temporal until the operational complexity is justified.

## Memory And Knowledge

Use three levels of context:

- Runtime records in Supabase: clients, projects, tasks, runs, approvals, artifacts, audit logs.
- Retrieval knowledge in Supabase: `knowledge_documents` and `knowledge_chunks`, with organization/client/project scoping.
- Human knowledge in Obsidian: strategy, SOPs, client notes, offers, source material, and long-form business context.

Agents should retrieve scoped context packs. They should not receive the entire company brain in every prompt.

## Approval Model

Default policy: human approval for side effects.

Risk levels:

- low: internal summaries, internal task creation, read-only analysis
- medium: internal CRM/document drafts, non-public artifact generation
- high: emails, CRM writes, document sending, deployment preparation
- critical: payments, production data mutation, DNS/provider changes, client-visible bulk actions

Approval records should include:

- requested action
- proposed payload
- agent/run/task references
- risk level
- expiration
- decision notes
- approving human
- final execution result

## Observability

Every meaningful agent execution should record:

- `agent_runs` for the high-level run
- `agent_steps` for reasoning/execution phases
- `agent_tool_calls` for tool attempts and results
- `agent_artifacts` for generated drafts, documents, reports, links, datasets
- `audit_events` for business-relevant state changes
- AI trace metadata for model/provider/cost/latency/tokens

Operational dashboards should show:

- pending approvals
- failed runs
- blocked tasks
- recent Telegram COO requests
- open incidents
- automation run health
- model cost and latency trends

## First Implementation Slice

The first safe slice is:

1. Seed a COO agent in the `agents` registry.
2. Add `POST /api/webhooks/telegram/coo`.
3. Require `TELEGRAM_COO_WEBHOOK_SECRET`.
4. Add team allowlists for Telegram user IDs and chat IDs.
5. Create an `agent_run` for each authorized request.
6. Create an `agent_task` for non-help requests.
7. Record `audit_events` for authorized and denied requests.
8. Reply to Telegram using `TELEGRAM_COO_BOT_TOKEN`.
9. Keep execution non-destructive until approval workflows and specialized tools are connected.

## Roadmap

### Phase 1: Safe COO Capture

- Telegram webhook and allowlist
- COO agent seed
- request triage and task creation
- audit trail
- basic Lucid OS visibility

### Phase 2: Tool Registry And Approvals

- typed tool registry
- approval creation and execution flows
- Lucid OS approval inbox improvements
- route invoice/document requests to draft-only tools

### Phase 3: Durable Workflows

- add Inngest
- convert key actions into event-driven workflows
- add retries, idempotency keys, dead-letter handling, and failure dashboards

### Phase 4: Specialized Agents

- Finance / Document Agent
- CRM / Sales Agent
- Meeting Ops Agent
- Delivery Agent
- Monitoring / Incident Agent
- Knowledge Agent

### Phase 5: Observability And Productization

- Langfuse/LangSmith traces
- PostHog events and feature flags
- Sentry instrumentation
- Better Stack integration
- team/user permissions
- client-facing scoped views where useful

## Telegram Setup Runbook

1. Create a bot in BotFather and copy the token into `TELEGRAM_COO_BOT_TOKEN`.
2. Generate a random secret and store it in `TELEGRAM_COO_WEBHOOK_SECRET`.
3. Message the bot directly or add it to the internal team group.
4. Send a test message and copy the denied sender/chat IDs from the bot reply or audit events.
5. Add trusted IDs to `TELEGRAM_COO_ALLOWED_USER_IDS` and/or `TELEGRAM_COO_ALLOWED_CHAT_IDS`.
6. Set the webhook:

```bash
curl -X POST "https://api.telegram.org/bot$TELEGRAM_COO_BOT_TOKEN/setWebhook" \
  -H "content-type: application/json" \
  -d '{"url":"https://YOUR_DOMAIN/api/webhooks/telegram/coo","secret_token":"YOUR_TELEGRAM_COO_WEBHOOK_SECRET"}'
```

7. Send `/help` to confirm the COO is active.

## Near-Term Decisions

- Choose Inngest account/project for durable Lucid OS workflows.
- Decide whether Telegram group access should require both allowed chat ID and allowed user ID for production.
- Decide where COO status and runs should be surfaced in the admin UI first.
- Decide which document action is the first real side-effect flow: draft invoice, draft BDC, or DocuSeal submission preparation.