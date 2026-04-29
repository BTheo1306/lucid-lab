import { NextResponse } from 'next/server';
import { isAdminAuthenticated } from '@/lib/admin/auth';
import { resetLeadEngineSandbox } from '@/lib/admin/lead-engine-sandbox';

export async function POST() {
  if (!(await isAdminAuthenticated())) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  await resetLeadEngineSandbox();
  return NextResponse.json({ ok: true });
}