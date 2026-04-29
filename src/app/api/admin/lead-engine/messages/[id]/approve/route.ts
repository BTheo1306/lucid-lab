import { NextResponse, type NextRequest } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin/auth';
import { approveLeadEngineSandboxDraft } from '@/lib/admin/lead-engine-sandbox';

export async function POST(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  await approveLeadEngineSandboxDraft(id);
  return NextResponse.json({ ok: true, id, status: 'approved' });
}