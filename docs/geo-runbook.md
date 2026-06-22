# GEO/AEO implementation runbook — Lucid-Lab

Living log of the GEO/AEO implementation: what is done, what is verified, and ready-to-use assets for each off-site channel. Built so it can be re-run for clients as a productized "AI visibility" service. Companion to `docs/geo-action-plan.md` (the checklist) and the strategy in the Obsidian vault (`_staging/offre-geo-aeo.md`).

Last updated: 2026-06-22.

## Status dashboard

| Workstream | State | Evidence |
|---|---|---|
| On-page schema (FAQ / Breadcrumb / Service / Org + founders) | Built and verified locally, NOT live | commit 91f4389, SSR HTML confirmed |
| sameAs fix + hreflang + llms.txt | Built and verified locally, NOT live | commit 91f4389 |
| Founding year 2026 | Fixed | commit 08a9b23 |
| Production deploy | DONE, live and verified 2026-06-22 | main 307e6e4; FAQPage + foundingDate 2026 + lucid-lab-fr + llms.txt confirmed on production |
| AI-visibility baseline | Started (Perplexity FR) | table below |
| Off-site presence (directories, Wikidata, GBP, listicles) | PENDING (gate: your accounts + approval) | assets drafted below |

## Verification (2026-06-22)

On-page work checked in a local production build and confirmed present in server-rendered HTML: FAQPage with 6 Q&A, BreadcrumbList + Service on service pages, Organization with 3 founders, corrected sameAs (`lucid-lab-fr`), reciprocal FR/EN hreflang, and `/llms.txt` (HTTP 200).

Important: production `lucid-lab.fr` still serves the OLD schema (`foundingDate 2024`, no FAQPage, old sameAs). The work takes effect for crawlers and AI engines only after the branch is deployed.

## Baseline measurement (the "before")

Protocol: run a fixed panel of buyer prompts on ChatGPT, Perplexity, Gemini, Google AI Mode and Copilot monthly; record whether Lucid-Lab is named and where.

| Date | Engine | Query | Lucid-Lab named? | Notes |
|---|---|---|---|---|
| 2026-06-22 | Perplexity (FR) | "Quelle est la meilleure agence IA en France pour automatiser les process d'une PME ?" | No | Named no specific agency; described categories only; cited 10 sources |

To extend: same query on ChatGPT, Gemini and Google AI Overview, plus the EN query "best AI automation agency in France for SMEs". Optional trackers once a baseline exists: Profound, Peec AI, Otterly, Semrush AI Visibility, Ahrefs Brand Radar.

Interpretation: Lucid-Lab is currently invisible for the core category query, as expected. Perplexity's own selection criteria (bilingual FR/EN, free 60-90 min audit, métier approach, EU hosting and RGPD) match Lucid-Lab's positioning almost exactly, so the upside from becoming visible is large.

## Ready-to-use assets

### Company boilerplate
- FR (wording aligned with lucid-lab.fr): Lucid-Lab construit, déploie et opère des systèmes IA métier en production : agents, outils internes, automatisations, intégrations, monitoring et documentation. Nous auditons vos workflows, vérifions vos données et priorisons les cas d'usage IA, puis construisons les systèmes qui tournent en production. Audit, Roadmap, Build, Run, Documentation. Le client garde le code et les accès. Hébergement EU, conformité RGPD et EU AI Act. Paris, France. Fondée en 2026. Bilingue FR/EN.
- EN: Lucid-Lab builds, deploys and operates business AI systems in production: agents, internal tools, automations, integrations, monitoring and documentation. We audit workflows, check data and prioritize AI use cases, then build the systems that run in production. Audit, Roadmap, Build, Run, Documentation. The client keeps the code and access. EU hosting, GDPR and EU AI Act compliance. Paris, France. Founded 2026. Bilingual FR/EN.

### Directory short description (~160 chars)
Systèmes IA métier en production : agents, automatisations et outils internes, avec monitoring et conformité RGPD / EU AI Act. Paris, FR/EN.

### Founders
Anthony Poirier (CEO), Théo Benard (CTO), Jules Gouron (COO).

### Directory profile data sheet (reusable: Sortlist, Clutch, Crunchbase, DesignRush, etc.)
- Company name: Lucid-Lab
- Website: https://lucid-lab.fr
- HQ: Paris, France
- Founded: 2026
- Team size: 2-10
- Email: info@lucid-lab.fr
- LinkedIn: https://www.linkedin.com/company/lucid-lab-fr/
- Languages: French, English
- Category / expertises: Intelligence artificielle, Automatisation des processus, Agents IA, Outils internes, Integrations (CRM / ERP / data), Conseil IA, Data engineering
- Short and long descriptions: see boilerplate above (wording aligned with lucid-lab.fr, no "studio")

### sameAs URLs to maintain (in `src/lib/seo/schema.ts`)
Currently: `https://www.linkedin.com/company/lucid-lab-fr/`. Add each new profile URL as it goes live (Sortlist, Clutch, Crunchbase, YouTube, etc.), then redeploy.

### Listicle outreach email (FR draft, for your approval before sending)
> Objet : Lucid-Lab pour votre classement des agences IA en France
>
> Bonjour [Nom],
> Je suis Jules Gouron, COO de Lucid-Lab, un studio d'ingénierie IA basé à Paris (agents, automatisations et outils internes en production pour PME et ETI). J'ai lu votre article "[titre]" et je pense que Lucid-Lab y aurait sa place : nous livrons des systèmes en production, le client garde le code, et tout est cadré conformité EU.
> Seriez-vous ouvert à nous ajouter au classement ? Je peux fournir logo, description, références et cas clients anonymisés.
> Merci pour votre temps, Jules

### Wikidata (draft, with caveat)
Caveat: Wikidata and Wikipedia expect notability (independent coverage). For a 2026 company with little press yet, an item may be challenged or deleted, and creating non-notable items reads as spam. Recommendation: do this AFTER securing 2 to 3 independent media mentions. Draft statements: instance of (P31) = enterprise; inception (P571) = 2026; headquarters (P159) = Paris; country (P17) = France; official website (P856) = https://lucid-lab.fr; industry (P452) = artificial intelligence.

## Execution checklist (each ends at a gate where I stop for approval)

- Deploy: merge `feature/geo-onpage-phase1` to `main` (Vercel auto-deploys). GATE: your go-ahead.
- Google Business Profile: business.google.com, create, fill (name, category, Paris, hours, description). GATE: verification and publish.
- Sortlist: sortlist.com, join as agency, fill profile. GATE: account creation and publish.
- Clutch: clutch.co, get listed, fill. GATE: account and publish.
- Crunchbase: add company. GATE: account and publish.
- Listicles (codeur.com, koino.fr, lespepitestech.com, digitallia.fr): send the outreach email above. GATE: your approval to send.
- LinkedIn: optimize the company About and start a posting cadence. GATE: your approval to post.

## Off-site progress

### Sortlist (sortlist.fr/claim/agency) — 2026-06-22
Company name "Lucid-Lab" entered; reached the "Créer le profil" confirmation. Blocked there by a Cloudflare CAPTCHA plus an authority-attestation checkbox, both of which require Jules (Claude cannot solve CAPTCHAs or attest authority). Next: Jules clears that gate, then Claude fills step 2 (company info) from the data sheet and stops before step 3 (manager account creation, which needs a password).

### LinkedIn company page (admin access confirmed 2026-06-22)
Page: linkedin.com/company/lucid-lab-fr (id 119184045). Status: dormant (no posts in 90 days), services not listed, low activity (4 search appearances, 2 page visitors). High-leverage, low-risk fixes (each needs your review before publishing):
- Add the About description. Draft (FR): the company boilerplate above.
- Add Services: Audit IA, Agents IA et outils internes, Automatisations métier, Deploiement n8n et APIs, Data & SI readiness, Build & Run, Monitoring IA, Gouvernance IA (RGPD / EU AI Act).
- Start a posting cadence (2x/week target), each post subject to your approval.

## How to run this for clients (productized service)

1. GEO Audit: crawl access, SSR check, schema audit, sameAs/entity check, off-site footprint search, baseline prompt panel.
2. On-page sprint: Organization + founders, FAQPage, BreadcrumbList, Service, llms.txt, hreflang.
3. Off-site sprint: directories, entity (Wikidata once notable), listicles, content with statistics and sources, community presence.
4. Measure monthly: AI share of voice across engines, reported to the client.

Client deliverable: this runbook filled in for their brand, plus a monthly AI-visibility report.
