import 'dotenv/config';
import { chromium } from 'playwright';
import { sendConnectionInvite, sendMessage, scanAcceptedInvites, scanReplies } from './linkedin.mjs';

/**
 * Local Chrome runner for the Lucid OS lead engine.
 *
 * Drives Anthony's real logged-in LinkedIn session (a dedicated, persistent
 * Chrome profile on this machine) to send the invites and follow-ups queued in
 * Lucid OS. Safety lives in three places: the server caps the queue per day,
 * this runner paces sends with human jitter inside business hours, and the kill
 * switch is checked every cycle.
 *
 * Modes:
 *   node runner.mjs --login   open LinkedIn once to log Anthony in / verify device
 *   node runner.mjs --once     run a single cycle
 *   node runner.mjs            loop forever (poll every LOOP_INTERVAL_SEC)
 */

const BASE = process.env.LUCID_OS_BASE_URL || 'https://lucid-lab.fr';
const TOKEN = process.env.LEAD_RUNNER_TOKEN || '';
const SENDER = process.env.SENDER_ACCOUNT || 'Anthony';
const PROFILE_DIR = process.env.CHROME_USER_DATA_DIR || './.chrome-anthony';
const LOOP_INTERVAL_SEC = Number(process.env.LOOP_INTERVAL_SEC || 900);
const MIN_DELAY = Number(process.env.MIN_DELAY_SEC || 40);
const MAX_DELAY = Number(process.env.MAX_DELAY_SEC || 180);
const MAX_PER_RUN = Number(process.env.MAX_PER_RUN || 20);

const ONCE = process.argv.includes('--once');
const LOGIN = process.argv.includes('--login');

const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
const rand = (min, max) => Math.floor(min + Math.random() * (max - min));

function headers() {
  return { Authorization: `Bearer ${TOKEN}`, 'X-Sender-Account': SENDER, 'Content-Type': 'application/json' };
}
async function apiGet(path) {
  const r = await fetch(`${BASE}${path}`, { headers: headers() });
  if (!r.ok) throw new Error(`GET ${path} -> ${r.status}`);
  return r.json();
}
async function apiPost(path, body) {
  const r = await fetch(`${BASE}${path}`, { method: 'POST', headers: headers(), body: JSON.stringify(body) });
  if (!r.ok) throw new Error(`POST ${path} -> ${r.status}`);
  return r.json();
}

function withinBusinessHours(account) {
  if (!account || !account.businessHours) return true;
  const h = new Date().getHours();
  return h >= account.businessHours.start && h < account.businessHours.end;
}

async function cycle(page) {
  let hb;
  try {
    hb = await apiPost('/api/lead-engine/runner/heartbeat', { sessionExpired: false });
  } catch (e) {
    console.error('heartbeat failed:', e.message);
    return;
  }
  if (hb.killSwitch) { console.log('kill switch ON, idling'); return; }

  const queue = await apiGet(`/api/lead-engine/runner/queue?account=${encodeURIComponent(SENDER)}`);
  if (queue.killSwitch || queue.paused) { console.log('paused'); return; }

  if (!withinBusinessHours(queue.account)) {
    console.log('outside business hours, skipping sends this cycle');
  } else {
    const messages = (queue.messages || []).slice(0, MAX_PER_RUN);
    console.log(`queue: ${messages.length} due (remaining invites ${queue.account && queue.account.remainingInvites})`);
    const results = [];
    for (const m of messages) {
      await sleep(rand(MIN_DELAY, MAX_DELAY) * 1000);
      const target = {
        profileUrl: m.person && m.person.linkedinUrl,
        name: m.person && m.person.name,
        company: m.company,
        note: m.body,
        text: m.body,
      };
      const res = m.stepKind === 'followup'
        ? await sendMessage(page, target)
        : await sendConnectionInvite(page, target);
      console.log(`  ${m.stepKind} -> ${res.outcome}${res.error ? ' (' + res.error + ')' : ''}`);
      results.push({ messageId: m.id, outcome: res.outcome, error: res.error || null });
    }
    if (results.length) await apiPost('/api/lead-engine/runner/results', { results });
  }

  try {
    const accepted = await scanAcceptedInvites(page);
    const replies = await scanReplies(page);
    const signals = [
      ...accepted.map((u) => ({ type: 'accepted', personLinkedinUrl: u })),
      ...replies.map((r) => ({ type: 'replied', personLinkedinUrl: r.personLinkedinUrl, text: r.text })),
    ];
    if (signals.length) {
      const out = await apiPost('/api/lead-engine/runner/signals', { signals });
      console.log(`signals posted: ${out.processed}`);
    }
  } catch (e) {
    console.error('signal scan failed:', e.message);
  }
}

async function main() {
  if (!TOKEN) { console.error('LEAD_RUNNER_TOKEN missing in .env'); process.exit(1); }
  const context = await chromium.launchPersistentContext(PROFILE_DIR, {
    headless: false,
    channel: 'chrome',
    viewport: null,
  });
  const page = context.pages()[0] || (await context.newPage());

  if (LOGIN) {
    await page.goto('https://www.linkedin.com/login');
    console.log("Log into Anthony's LinkedIn in the opened window, complete any device verification, then press Ctrl+C.");
    await sleep(10 * 60 * 1000);
    await context.close();
    return;
  }

  do {
    try {
      await cycle(page);
    } catch (e) {
      console.error('cycle error:', e.message);
    }
    if (!ONCE) {
      console.log(`sleeping ${LOOP_INTERVAL_SEC}s`);
      await sleep(LOOP_INTERVAL_SEC * 1000);
    }
  } while (!ONCE);

  await context.close();
}

main().catch((e) => { console.error(e); process.exit(1); });
