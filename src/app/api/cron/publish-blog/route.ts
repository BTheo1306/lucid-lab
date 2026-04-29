import { NextResponse } from 'next/server';

import { config } from '@/lib/bot/config';
import { supabase } from '@/lib/bot/db/supabase';
import { logSecurityEvent } from '@/lib/bot/db/queries/security-audit';

export const runtime = 'nodejs';
export const maxDuration = 30;

function isAuthorized(req: Request): boolean {
  if (!config.cronSecret) return false;
  return req.headers.get('authorization') === `Bearer ${config.cronSecret}`;
}

/**
 * GET /api/cron/publish-blog
 * Flips `scheduled` posts whose `scheduled_for <= now()` to `published`.
 */
export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    await logSecurityEvent({
      event_type: 'cron_unauthorized',
      details: { route: 'publish-blog' },
    });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const nowIso = new Date().toISOString();

  const { data: due, error: readErr } = await supabase
    .from('blog_posts')
    .select('id,slug,locale,scheduled_for')
    .eq('status', 'scheduled')
    .lte('scheduled_for', nowIso);

  if (readErr) {
    return NextResponse.json({ error: readErr.message }, { status: 500 });
  }

  const toPublish = due ?? [];
  if (toPublish.length === 0) {
    return NextResponse.json({ ok: true, published: 0 });
  }

  const ids = toPublish.map((p) => p.id);
  const { error: updErr } = await supabase
    .from('blog_posts')
    .update({ status: 'published', published_at: nowIso })
    .in('id', ids);

  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    published: toPublish.length,
    posts: toPublish.map((p) => ({ id: p.id, slug: p.slug, locale: p.locale })),
  });
}
