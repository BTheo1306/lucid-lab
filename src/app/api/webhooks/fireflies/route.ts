import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import nodemailer from 'nodemailer';
import { supabase } from '@/lib/bot/db/supabase';
import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Fireflies webhook : déclenché quand une transcription est prête.
 *
 * SCAFFOLD (à relire avant mise en production). Il faut, avant d'activer :
 *   - ajouter les secrets FIREFLIES_API_KEY et FIREFLIES_WEBHOOK_SECRET (cf. docs/fireflies-webhook-setup.md)
 *   - déployer puis enregistrer l'URL dans Fireflies (Settings > Developer > Webhooks)
 *
 * Gouvernance Lucid-Lab : « l'IA propose, l'humain valide, le système exécute ».
 * Ce endpoint CAPTURE la réunion (audit + digest email) mais n'écrit PAS
 * automatiquement de clients/opportunités. La réconciliation CRM reste pilotée
 * par le skill /fireflies-sync (humain dans la boucle). Voir le skill pour la
 * logique A/B/D/F complète.
 */

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

const ORG_ID = '2ee10622-ce92-454a-af4e-693b2007b42c';
const FIREFLIES_GRAPHQL = 'https://api.fireflies.ai/graphql';

/**
 * Vérifie la signature Fireflies : en-tête `x-hub-signature` = HMAC-SHA256 du
 * corps brut, clé = FIREFLIES_WEBHOOK_SECRET (Signing Secret, app.fireflies.ai/settings).
 */
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
  const json = (await res.json()) as { data?: { transcript?: any }; errors?: unknown };
  if (!json.data?.transcript) throw new Error('Transcript introuvable');
  return json.data.transcript;
}

const EXTRACT_PROMPT = `Analyse la réunion et produis une synthèse orientée CRM pour l'agence Lucid-Lab, en français, concise et factuelle. Structure : 1) Client ou prospect concerné ; 2) Type de réunion (vente/découverte, suivi client, interne, partenaire) ; 3) Décisions prises ; 4) Périmètre et livrables évoqués ; 5) Budget ou prix mentionnés ; 6) Objections, risques ou blocages ; 7) Prochaine étape avec échéance et responsable ; 8) Action items (qui / quoi / quand). N'invente rien : si une information est absente, écris 'non précisé'. N'utilise jamais de tirets longs.`;

async function extractSynthesis(transcript: any): Promise<string> {
  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  const context = [
    `Titre : ${transcript.title}`,
    `Date : ${transcript.dateString}`,
    `Participants : ${(transcript.participants ?? []).join(', ')}`,
    `Résumé : ${transcript.summary?.overview ?? transcript.summary?.short_summary ?? ''}`,
    `Action items : ${transcript.summary?.action_items ?? ''}`,
  ].join('\n');
  const msg = await anthropic.messages.create({
    model: process.env.AI_MODEL || 'claude-sonnet-4-6',
    max_tokens: 1200,
    messages: [{ role: 'user', content: `${EXTRACT_PROMPT}\n\n---\n${context}` }],
  });
  return msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('\n')
    .trim();
}

async function sendDigest(transcript: any, synthesis: string): Promise<void> {
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
    subject: `[Lucid OS] Synthèse réunion : ${transcript.title}`,
    text: `${synthesis}\n\nTranscript : ${transcript.transcript_url}`,
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const rawBody = await request.text();
  if (!verifySignature(rawBody, request.headers.get('x-hub-signature'))) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }
  let payload: { meetingId?: string; eventType?: string; clientReferenceId?: string };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Fireflies envoie eventType 'Transcription completed' quand la note est prête.
  if (payload.eventType && payload.eventType !== 'Transcription completed') {
    return NextResponse.json({ ok: true, skipped: payload.eventType });
  }
  const meetingId = payload.meetingId;
  if (!meetingId) return NextResponse.json({ error: 'meetingId manquant' }, { status: 400 });

  try {
    const transcript = await fetchTranscript(meetingId);
    const synthesis = await extractSynthesis(transcript);

    // Capture factuelle (low-risk) : audit + digest. Pas d'upsert clients/opportunités
    // automatique : /fireflies-sync reste la voie validée par un humain.
    await supabase.from('audit_events').insert({
      organization_id: ORG_ID,
      actor_type: 'agent',
      event_type: 'fireflies_webhook',
      target_table: 'client_interactions',
      risk_level: 'low',
      summary: `Réunion Fireflies capturée : ${transcript.title}`,
      details: {
        source: 'fireflies_webhook',
        fireflies_id: meetingId,
        transcript_url: transcript.transcript_url,
        synthesis,
      },
    });

    await sendDigest(transcript, synthesis);
    return NextResponse.json({ ok: true, meetingId });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erreur webhook';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
