/**
 * One-shot script: resolve real LinkedIn company page URLs for all prospects
 * that currently have a Google search fallback URL.
 *
 * Usage:  node scripts/resolve-linkedin-urls.mjs
 */

import Anthropic from '@anthropic-ai/sdk';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as dotenv } from 'dotenv';

dotenv({ path: '.env.local' });

const STATE_PATH = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '../.lead-engine-sandbox/state.json'
);

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = 'claude-sonnet-4-6';

async function findLinkedinUrl(companyName, city, niche) {
  try {
    const response = await client.beta.messages.create({
      model: MODEL,
      max_tokens: 512,
      betas: ['web-search-2025-03-05'],
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages: [
        {
          role: 'user',
          content: `Find the LinkedIn company page URL for "${companyName}", a ${niche} company based in ${city}. I need the exact URL in the format https://www.linkedin.com/company/[slug]/. Reply with only the URL, nothing else.`,
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === 'text');
    if (!textBlock?.text) return null;

    const match = textBlock.text.match(
      /https?:\/\/(?:www\.)?linkedin\.com\/company\/[a-zA-Z0-9_-]+(?:\/[^\s"')>]*)?/
    );
    return match ? match[0].replace(/\/+$/, '') + '/' : null;
  } catch (err) {
    console.error(`  Error for ${companyName}:`, err.message);
    return null;
  }
}

const state = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));

const toResolve = state.prospects.filter(
  (p) => !p.linkedinSearchUrl || p.linkedinSearchUrl.includes('google.com')
);

console.log(`Resolving LinkedIn URLs for ${toResolve.length} prospects...\n`);

for (const prospect of toResolve) {
  process.stdout.write(`  ${prospect.companyName} (${prospect.city})... `);
  const url = await findLinkedinUrl(prospect.companyName, prospect.city, prospect.niche);
  if (url) {
    console.log(`✓ ${url}`);
    // Patch prospects
    const pi = state.prospects.findIndex((p) => p.id === prospect.id);
    if (pi !== -1) state.prospects[pi].linkedinSearchUrl = url;
    // Patch messages with same company
    state.messages = state.messages.map((m) =>
      m.companyName === prospect.companyName ? { ...m, linkedinSearchUrl: url } : m
    );
    // Write immediately so progress is not lost on timeout/interruption
    fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
  } else {
    console.log('✗ not found, keeping Google fallback');
  }
}

console.log('\nDone. State updated.');
