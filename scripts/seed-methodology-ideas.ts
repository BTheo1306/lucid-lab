/**
 * Seed blog ideas for the "méthode" and "outils-internes" categories.
 * These are drawn from the Lucid-Lab vault (methodology + tech stack pages).
 *
 * Run once:  npx tsx scripts/seed-methodology-ideas.ts
 */
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

interface IdeaRow {
  title: string;
  description: string;
  category: string;
  tags: string[];
  funnel_stage: string;
  locale: string;
  is_pillar: boolean;
  notes: string;
}

const IDEAS: IdeaRow[] = [
  // ──────────────────────────────────────────────
  // MÉTHODE
  // ──────────────────────────────────────────────
  {
    title: 'Diagnostiquer avant de construire : la phase Audit Flash expliquée',
    description:
      'Comment Lucid-Lab identifie les vrais blocages en 30 minutes, sans PowerPoint — et pourquoi c\'est la seule façon de lancer un projet qui tient.',
    category: 'methode',
    tags: ['audit', 'diagnostic', 'méthode', 'Audit Flash'],
    funnel_stage: 'TOFU',
    locale: 'fr',
    is_pillar: false,
    notes:
      'Couvrir la phase Diagnose de la méthode Lucid-Lab : 3 fuites de temps détectées, tooling actuel, livrables concrets (diagnostic écrit). Mentionner que l\'audit est gratuit et qu\'il aboutit systématiquement à un budget indicatif. Insister sur "strategy is never an isolated deliverable".',
  },
  {
    title: 'Cartographier un système métier avant d\'automatiser',
    description:
      'État actuel, état cible, chemin critique : comment on transforme une liste de problèmes en un plan d\'exécution concret.',
    category: 'methode',
    tags: ['cartographie', 'processus', 'roadmap', 'état cible'],
    funnel_stage: 'MOFU',
    locale: 'fr',
    is_pillar: false,
    notes:
      'Couvrir la phase Map : diagramme état actuel vs état cible, intégrations clés, jalons. Montrer pourquoi on ne démarre pas le build sans un plan clair. Exemple concret avec Turismo (pricing dashboard).',
  },
  {
    title: 'Livrer en production sans se planter : la méthode Build & Run',
    description:
      'Code dans votre dépôt, schéma Supabase, observabilité, runbook — ce que Lucid-Lab livre à chaque projet et pourquoi c\'est non-négociable.',
    category: 'methode',
    tags: ['build', 'production', 'observabilité', 'runbook', 'no vendor lock-in'],
    funnel_stage: 'MOFU',
    locale: 'fr',
    is_pillar: true,
    notes:
      'Couvrir la phase Build de la méthode : builds incrémentiels + testables, livrables concrets (repo GitHub client, schema Supabase, logs structurés, alerts, runbook). Insister sur le no vendor lock-in. Mentionner les cas Universal (lead gen), Turismo (scaling), Périscope (monitoring).',
  },
  {
    title: 'Passer la main : comment structurer le transfert d\'un système IA',
    description:
      'Documentation, formation, tuning de prompts : ce qui fait qu\'un système livré reste utilisé 6 mois après.',
    category: 'methode',
    tags: ['transfert', 'documentation', 'accompagnement', 'ownership'],
    funnel_stage: 'BOFU',
    locale: 'fr',
    is_pillar: false,
    notes:
      'Couvrir la phase Automate / Accompagnement au changement : documentation, formation équipes, prompt tuning, retainer optionnel vs full handover. Pourquoi les projets meurent sans cette phase. Éviter de vendre le retainer — présenter les 3 options sans biais.',
  },

  // ──────────────────────────────────────────────
  // OUTILS INTERNES
  // ──────────────────────────────────────────────
  {
    title: 'Notre stack technique en 2026 : pourquoi Next.js, Supabase et Vercel',
    description:
      'Pas de choix ésotériques : comment on a sélectionné notre stack par défaut et ce qu\'elle garantit à chaque client livré.',
    category: 'outils-internes',
    tags: ['Next.js', 'Supabase', 'Vercel', 'Cloudflare', 'stack technique'],
    funnel_stage: 'TOFU',
    locale: 'fr',
    is_pillar: true,
    notes:
      'Présenter le golden stack Lucid-Lab : Next.js App Router, Supabase (DB + Auth + Storage + pgvector), Vercel, Cloudflare DNS/WAF. Insister sur les garanties : no vendor lock-in (repo client), observabilité (logs + alerts), builds testables (TypeScript strict, ESLint, Vitest). Mentionner pourquoi on n\'utilise PAS n8n par défaut (custom code first) — mais sans critique négative.',
  },
  {
    title: 'Pourquoi on construit en custom plutôt qu\'avec n8n',
    description:
      'n8n est excellent dans certains cas. Pour le reste, on code. Voici comment on tranche — et ce que ça change pour la maintenance.',
    category: 'outils-internes',
    tags: ['n8n', 'custom code', 'workflow', 'automatisation', 'maintenabilité'],
    funnel_stage: 'TOFU',
    locale: 'fr',
    is_pillar: false,
    notes:
      'Expliquer le choix "custom code by default, n8n where it fits". Cas où n8n a du sens : intégrations rapides client, business-user automations. Cas où on code : logique complexe, observabilité fine, ownership client, performance. Éviter de dénigrer n8n — c\'est une décision de contexte, pas de dogme.',
  },
  {
    title: 'Comment on choisit un LLM par projet : Anthropic, OpenAI ou Gemini',
    description:
      'Pas de provider unique : on sélectionne le modèle selon le cas d\'usage, le budget token et les contraintes RGPD.',
    category: 'outils-internes',
    tags: ['LLM', 'Anthropic', 'OpenAI', 'Gemini', 'Claude', 'choix modèle'],
    funnel_stage: 'TOFU',
    locale: 'fr',
    is_pillar: false,
    notes:
      'Décrire l\'approche provider-agnostic : Claude (Anthropic) pour raisonnement long, GPT-4o-mini pour coût/vitesse, Gemini 2.5 Flash comme fallback coût. Critères de choix : latence, coût tokens, contexte fenêtre, RGPD/hébergement EU, capacités multimodales. Éviter les benchmarks qui datent.',
  },
  {
    title: 'Construire un bot WhatsApp en production : architecture et pièges',
    description:
      'Fastify + Supabase + WhatsApp Cloud API + escalade Slack : comment on structure un agent conversationnel qui tient en prod.',
    category: 'outils-internes',
    tags: ['WhatsApp', 'bot', 'Fastify', 'Supabase', 'Slack', 'escalade'],
    funnel_stage: 'MOFU',
    locale: 'fr',
    is_pillar: false,
    notes:
      'Basé sur le template wa-bot-template (Fastify + Supabase + WhatsApp Cloud API + Slack bidirectionnel). Couvrir : architecture message routing, session management, escalade humaine avec contexte complet, template messages, gestion rate limits Meta. Mentionner le cas Universal (lead gen WhatsApp).',
  },
];

async function main() {
  let ok = 0;
  let skip = 0;
  let fail = 0;

  for (const idea of IDEAS) {
    // Check if a post with the same title already exists (avoid duplicates)
    const { data: existing } = await supabase
      .from('blog_posts')
      .select('id')
      .eq('title', idea.title)
      .maybeSingle();

    if (existing) {
      console.log(`⟳ skip  "${idea.title}"`);
      skip++;
      continue;
    }

    const { error } = await supabase.from('blog_posts').insert({
      status: 'idea',
      locale: idea.locale,
      title: idea.title,
      description: idea.description,
      category: idea.category,
      tags: idea.tags,
      funnel_stage: idea.funnel_stage,
      is_pillar: idea.is_pillar,
      notes: idea.notes,
    });

    if (error) {
      console.error(`✗ fail  "${idea.title}": ${error.message}`);
      fail++;
    } else {
      console.log(`✓ added "${idea.title}"`);
      ok++;
    }
  }

  console.log(`\nDone. ${ok} added, ${skip} skipped, ${fail} failed.`);
  if (fail > 0) process.exit(1);
}

main();
