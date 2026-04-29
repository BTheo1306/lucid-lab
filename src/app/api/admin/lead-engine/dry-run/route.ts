import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin/auth';
import { runLeadEngineSandboxDiscovery } from '@/lib/admin/lead-engine-sandbox';

export async function POST() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const state = await runLeadEngineSandboxDiscovery();
  return NextResponse.json({
    ok: true,
    prospects: state.prospects.length,
    drafts: state.messages.filter((message) => message.status === 'draft').length,
    approved: state.messages.filter((message) => message.status === 'approved').length,
    sent: state.messages.filter((message) => message.status === 'sent').length,
  });
}