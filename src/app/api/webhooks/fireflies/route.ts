import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import nodemailer from 'nodemailer';
import { supabase } from '@/lib/bot/db/supabase';
import { createHmac, timingSafeEqual } from 'crypto';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const ORG_ID = '2ee10622-ce92-454a-af4e-693b2007b42c';
const FIREFLIES_GRAPHQL = 'https://api.fireflies.ai/graphql';

function verifySignature(rawBody: string, signature: string | null): boolean {
  const secret = process.env.FIREFLIES_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const expected = createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex');
  const provided = signature.replace(/^sha256=/i, '').trim();
  if (provided.length !== expected.length) return false;
  try {
    return timingSafeEqual(Buffer.from(provided, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false;
  }
}

async function fetchTranscript(meetingId: string) {
  const query = `query Transcript($id: String!) {
    transcript(id: $id) {
      id title dateString duration transcript_url
      participants
      summary { overview short_summary action_items keywords }
    }
  }`;
  const res = await fetch(FIREFLIES_GRAPHQL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.FIREFLIES_API_KEY ?? ''}`,
    },
    body: JSON.stringify({ query, variables: { id: meetingId } }),
  });
  if (!res.ok) throw new Error(`Fireflies API ${res.status}`);
  const json = (await res.json()) as { data?: { transcript?: unknown }; errors?: unknown };
  if (!(json.data as { transcript?: unknown })?.transcript) throw new Error('Transcript introuvable');
  return (json.data as { transcript: unknown }).transcript;
}

// ─── Synthesis (human-readable digest) ───────────────────────────────────────

const SYNTHESIS_PROMPT = `Analyse la réunion et produis une synthèse orientée CRM pour l'agence Lucid-Lab, en français, concise et factuelle. Structure : 1) Client ou prospect concerné ; 2) Type de réunion (vente/découverte, suivi client, interne, partenaire) ; 3) Décisions prises ; 4) Périmètre et livrables évoqués ; 5) Budget ou prix mentionnés ; 6) Objections, risques ou blocages ; 7) Prochaine étape avec échéance et responsable ; 8) Action items (qui / quoi / quand). N'invente rien : si une information est absente, écris 'non précisé'. N'utilise jamais de tirets longs.`;

async function extractSynthesis(transcript: unknown): Promise<string> {
  const t = transcript as { title?: string; dateString?: string; participants?: string[]; summary?: { overview?: string; short_summary?: string; action_items?: string } };
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const context = [
    `Titre : ${t.title}`,
    `Date : ${t.dateString}`,
    `Participants : ${(t.participants ?? []).join(', ')}`,
    `Résumé : ${t.summary?.overview ?? t.summary?.short_summary ?? ''}`,
    `Action items : ${t.summary?.action_items ?? ''}`,
  ].join('\n');
  const msg = await anthropic.messages.create({
    model: process.env.AI_MODEL || 'claude-sonnet-4-6',
    max_tokens: 1200,
    messages: [{ role: 'user', content: `${SYNTHESIS_PROMPT}\n\n---\n${context}` }],
  });
  return msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();
}

// ─── Structured action items extraction ──────────────────────────────────────

interface ActionItem {
  title: string;
  owner: string | null;
  dueDate: string | null;
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

const ACTION_ITEMS_PROMPT = `Tu es un assistant CRM de Lucid-Lab, une agence IA française.
Analyse cette réunion et extrais UNIQUEMENT les action items sous forme de JSON strict.
Ne retourne RIEN d'autre que le tableau JSON (pas de markdown, pas d'explication).

Format attendu :
[{"title":"tâche concise à l'infinitif","owner":"prénom du responsable ou null","dueDate":"YYYY-MM-DD ou null","priority":"low|normal|high|urgent"}]

Règles :
- "owner" = la personne QUI DOIT faire la tâche (Jules, Anthony, ou le prénom du client)
- "priority" : urgent si délai < 48h ou mot-clé urgent/asap, high si délai < 1 semaine ou tâche importante, low si aucun délai, normal sinon
- Si aucun action item clair, retourne []
- N'invente rien, reste factuel`;

async function extractActionItems(transcript: unknown): Promise<ActionItem[]> {
  const t = transcript as { title?: string; dateString?: string; participants?: string[]; summary?: { overview?: string; action_items?: string } };
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const context = [
    `Titre : ${t.title}`,
    `Date : ${t.dateString}`,
    `Participants : ${(t.participants ?? []).join(', ')}`,
    `Résumé Fireflies : ${t.summary?.overview ?? ''}`,
    `Action items Fireflies : ${t.summary?.action_items ?? ''}`,
  ].join('\n');
  const msg = await anthropic.messages.create({
    model: process.env.AI_MODEL || 'claude-sonnet-4-6',
    max_tokens: 800,
    messages: [{ role: 'user', content: `${ACTION_ITEMS_PROMPT}\n\n---\n${context}` }],
  });
  const text = msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('');
  try {
    const parsed = JSON.parse(text.trim()) as unknown;
    return Array.isArray(parsed) ? (parsed as ActionItem[]) : [];
  } catch {
    const match = text.match(/\[[\s\S]*?\]/);
    if (match) {
      try { return JSON.parse(match[0]) as ActionItem[]; } catch {}
    }
    return [];
  }
}

// ─── Client matching ──────────────────────────────────────────────────────────

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .trim();
}

function findMatchingClientId(
  meetingTitle: string,
  participants: string[],
  clients: Array<{ id: string; name: string }>,
): string | null {
  const haystack = normalize(`${meetingTitle} ${participants.join(' ')}`);
  let bestScore = 0;
  let bestId: string | null = null;

  for (const client of clients) {
    // Split client name into meaningful words (> 2 chars), check how many appear in the meeting context
    const words = normalize(client.name).split(/\s+/).filter((w) => w.length > 2);
    if (words.length === 0) continue;
    const hits = words.filter((w) => haystack.includes(w));
    const score = hits.length / words.length;
    if (score > bestScore && score >= 0.4) {
      bestScore = score;
      bestId = client.id;
    }
  }

  return bestId;
}

// ─── Email digest ─────────────────────────────────────────────────────────────

async function sendDigest(transcript: unknown, synthesis: string): Promise<void> {
  const t = transcript as { title?: string; transcript_url?: string };
  const to = process.env.TEAM_NOTIFICATION_EMAIL || 'info@lucid-lab.fr';
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to,
    subject: `[Lucid OS] Synthèse réunion : ${t.title}`,
    text: `${synthesis}\n\nTranscript : ${t.transcript_url}`,
  });
}

// ─── Webhook handler ──────────────────────────────────────────────────────────

export async function POST(request: NextRequest): Promise<NextResponse> {
  const rawBody = await request.text();
  if (!verifySignature(rawBody, request.headers.get('x-hub-signature'))) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }
  let payload: { meetingId?: string; eventType?: string };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const meetingId = payload.meetingId;
  if (!meetingId) return NextResponse.json({ ok: true, note: 'no meetingId (test ping)' });

  try {
    const t = await fetchTranscript(meetingId);
    const transcript = t as { title?: string; dateString?: string; participants?: string[]; transcript_url?: string; summary?: unknown };

    // Run synthesis + action item extraction + clients fetch in parallel
    const [synthesis, actionItems, clientsRes] = await Promise.all([
      extractSynthesis(transcript),
      extractActionItems(transcript),
      supabase.from('clients').select('id,name').eq('organization_id', ORG_ID),
    ]);

    const clients = (clientsRes.data ?? []) as Array<{ id: string; name: string }>;
    const clientId = findMatchingClientId(
      transcript.title ?? '',
      transcript.participants ?? [],
      clients,
    );

    // Create tasks for each action item
    let tasksCreated = 0;
    if (actionItems.length > 0) {
      const { error: insertError } = await supabase.from('client_tasks').insert(
        actionItems.map((item) => ({
          organization_id: ORG_ID,
          client_id: clientId,
          title: item.title,
          description: `Action item extrait de la réunion "${transcript.title}" (${transcript.dateString ?? ''})`,
          owner_label: item.owner,
          priority: item.priority,
          due_at: item.dueDate,
          status: 'todo',
        })),
      );
      if (!insertError) tasksCreated = actionItems.length;
      else console.error('[fireflies-webhook] task insert error:', insertError.message);
    }

    await supabase.from('audit_events').insert({
      organization_id: ORG_ID,
      actor_type: 'agent',
      event_type: 'fireflies_webhook',
      target_table: 'client_tasks',
      risk_level: 'low',
      summary: `Réunion Fireflies : ${transcript.title} — ${tasksCreated} tâche(s) créée(s)`,
      details: {
        source: 'fireflies_webhook',
        fireflies_id: meetingId,
        transcript_url: transcript.transcript_url,
        matched_client_id: clientId,
        action_items: actionItems,
        synthesis,
      },
    });

    const WEBHOOK_EMAIL_ENABLED: boolean = false;
    if (WEBHOOK_EMAIL_ENABLED) await sendDigest(transcript, synthesis);

    return NextResponse.json({ ok: true, meetingId, tasksCreated, clientId });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur webhook';
    console.error('[fireflies-webhook]', meetingId, message);
    return NextResponse.json({ ok: false, meetingId, error: message });
  }
}
