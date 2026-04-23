import { NextResponse } from 'next/server';
import { config } from '@/lib/bot/config';
import { anonymizeContact, findContactById } from '@/lib/bot/db/queries/contacts';
import { supabase } from '@/lib/bot/db/supabase';
import { logSecurityEvent } from '@/lib/bot/db/queries/security-audit';

export const runtime = 'nodejs';
export const maxDuration = 30;

function isAuthorized(req: Request): boolean {
  if (!config.adminApiKey) return false;
  return req.headers.get('authorization') === `Bearer ${config.adminApiKey}`;
}

/** DELETE /api/admin/contacts/[id] — GDPR erasure for a contact. */
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  const resolved = 'then' in params ? await params : params;
  const { id } = resolved;

  if (!isAuthorized(req)) {
    await logSecurityEvent({
      event_type: 'admin_unauthorized',
      details: { route: 'contacts/delete', id },
    });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const contact = await findContactById(id);
  if (!contact) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Delete messages, leads, tidycal_bookings, then anonymize contact.
  const { data: convs } = await supabase
    .from('conversations')
    .select('id')
    .eq('contact_id', id);

  for (const c of convs ?? []) {
    await supabase.from('messages').delete().eq('conversation_id', c.id);
  }
  await supabase.from('conversations').delete().eq('contact_id', id);
  await supabase.from('leads').delete().eq('contact_id', id);
  await supabase.from('tidycal_bookings').delete().eq('contact_id', id);

  await anonymizeContact(id);

  await logSecurityEvent({
    contact_id: id,
    event_type: 'erasure_completed',
    details: { triggered_by: 'admin_api' },
  });

  return NextResponse.json({ ok: true, contact_id: id });
}

/** GET /api/admin/contacts/[id] — Return contact + conversation metadata for support. */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } },
) {
  const resolved = 'then' in params ? await params : params;
  const { id } = resolved;

  if (!isAuthorized(req)) {
    await logSecurityEvent({
      event_type: 'admin_unauthorized',
      details: { route: 'contacts/get', id },
    });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const contact = await findContactById(id);
  if (!contact) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { data: conversations } = await supabase
    .from('conversations')
    .select('*')
    .eq('contact_id', id)
    .order('started_at', { ascending: false });

  const { data: leads } = await supabase
    .from('leads')
    .select('*')
    .eq('contact_id', id)
    .order('created_at', { ascending: false });

  await logSecurityEvent({
    contact_id: id,
    event_type: 'admin_access',
    details: { route: 'contacts/get' },
  });

  return NextResponse.json({ contact, conversations, leads });
}
