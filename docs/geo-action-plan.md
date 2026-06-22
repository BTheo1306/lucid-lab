# GEO/AEO action plan — Lucid-Lab

Goal: get Lucid-Lab named by AI engines (ChatGPT, Perplexity, Gemini, Google AI Overviews, Copilot) when prospects ask for an AI agency in France, in French and English.

Core principle: AI engines name the brands that recur across the third-party pages they retrieve (listicles, Reddit, LinkedIn, YouTube, Wikidata). On-page schema makes you citable; off-site mentions make you cited. This list is ordered by impact. Items marked `[done]` were implemented on branch `feature/geo-onpage-phase1` (commit 91f4389).

Full strategy and sources: Obsidian vault `_staging/offre-geo-aeo.md` and `_staging/lucid-lab-geo-plan-90j.md`.

## Phase 0 — Ship the on-page foundation (this week)

Already coded and verified (build passes, JSON-LD + hreflang confirmed in server-rendered HTML):

- [x] FAQPage + BreadcrumbList + Service schema
- [x] 3 co-founders as Person nodes on Organization
- [x] Fixed sameAs LinkedIn URL (dead 999 -> live 200)
- [x] Reciprocal FR/EN hreflang
- [x] public/llms.txt

Your steps:

- [ ] Review the diff: `git diff main...feature/geo-onpage-phase1`
- [ ] Merge to main and deploy (Vercel auto-deploys on push to main)
- [ ] After deploy, validate the homepage and one service page with the Google Rich Results Test (https://search.google.com/test/rich-results): expect Organization, FAQ, Breadcrumb, Service
- [ ] Confirm https://lucid-lab.fr/llms.txt is live
- [ ] Google Search Console: resubmit the sitemap and request indexing of the homepage

## Phase 1 — Entity and directories (weeks 1-4), high impact

- [ ] Create a Wikidata entity for Lucid-Lab (company, founded 2026, Paris, founders, official site). Single biggest entity signal.
- [ ] Create or claim agency directory profiles (these are exactly the pages engines retrieve for "best agency" queries):
  - [ ] Sortlist (strong in France)
  - [ ] Clutch
  - [ ] DesignRush
  - [ ] The Manifest
  - [ ] Malt
  - [ ] Welcome to the Jungle
  - [ ] Google Business Profile
  - [ ] France Num, Bpifrance hub, La French Tech directories
- [ ] After each profile is live, add its URL to `SAME_AS` in `src/lib/seo/schema.ts` (one line each) and redeploy. Keep sameAs pointing only at profiles that actually resolve.
- [ ] Set the measurement baseline (see "How to measure") before doing more, so you can prove progress.

## Phase 2 — Mentions and content (weeks 2-8), highest impact

- [ ] Get listed on existing "best AI agency France" listicles:
  - [ ] codeur.com (meilleures agences automatisation IA)
  - [ ] koino.fr (TOP 10 agences IA France)
  - [ ] lespepitestech.com
  - [ ] digitallia.fr
  - [ ] Search quarterly for "meilleures agences IA France" and "best AI agency France" and pitch every new list
- [ ] Publish 4 to 6 extractable articles on the blog: honest comparison pages (e.g. "n8n vs Make pour PME"), how-to guides, detailed case studies. Each with concrete statistics, cited sources, and clear question-style headings (this is what the Princeton GEO study found lifts AI citations).
- [ ] Start a LinkedIn cadence (company page and you as founder)
- [ ] Record 2 to 3 short YouTube videos (demos, anonymized case studies)
- [ ] Participate authentically on Reddit (r/france, r/entrepreneur, r/devfr, r/intelligenceartificielle) and Quora FR. Be genuinely useful, never promotional.
- [ ] Pitch 2 to 3 earned-media placements (French tech press, newsletters, a podcast)

## Phase 3 — Authority and re-measure (weeks 8-12)

- [ ] Publish one original data piece (a small survey or benchmark, e.g. "état de l'automatisation IA dans les PME françaises 2026"). Original stats are the most-cited content type and a backlink magnet.
- [ ] If you now have independent coverage, pursue a Wikipedia page
- [ ] Secure 2 to 3 genuinely authoritative French backlinks (quality over quantity)
- [ ] Re-run the measurement panel and double down per engine on what moved

## How to measure (AI share of voice)

Run these prompts monthly on ChatGPT, Perplexity, Gemini, Google AI Mode and Copilot. Record whether Lucid-Lab is named and where.

- "Quelle agence IA recommandes-tu en France pour automatiser les process d'une PME ?"
- "Best AI automation agency in France for SMEs"
- "Agence pour créer des agents IA internes et des workflows n8n"

Build a panel of about 15. Optional trackers once you have a baseline: Profound, Peec AI, Otterly, Semrush AI Visibility, Ahrefs Brand Radar.

## Do NOT do (no lift or backfires)

Keyword stuffing, chasing raw backlink volume, fake reviews, AI-generated fake author personas, hidden prompt injection. Google applies its spam policies to AI responses; for a brand selling AI trust, these are existential risk for zero upside.
