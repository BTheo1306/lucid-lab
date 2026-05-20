import { NextResponse } from 'next/server';
import { processQueuedAgentWorkflowRuns } from '@/lib/admin/agents/workflow-runner';
import { config } from '@/lib/bot/config';
import { logSecurityEvent } from '@/lib/bot/db/queries/security-audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function isAuthorized(req: Request): boolean {
  if (!config.cronSecret) return false;
  return req.headers.get('authorization') === `Bearer ${config.cronSecret}`;
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) {
    await logSecurityEvent({ event_type: 'cron_unauthorized', details: { route: 'agent-workflows' } });
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await processQueuedAgentWorkflowRuns(5);
    return NextResponse.json({ ok: true, result });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown agent workflow cron error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}