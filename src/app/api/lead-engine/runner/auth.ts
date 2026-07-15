import { config } from '@/lib/bot/config';
import { safeEqual } from '@/lib/security/constant-time';

/**
 * Bearer auth for the local Chrome runner.
 * Phase 1 uses a single shared LEAD_RUNNER_TOKEN; the X-Sender-Account header
 * selects which sender account the runner is acting as (default Anthony).
 * Per-account token hashes (outreach_sender_accounts.runner_token_hash) are for
 * the multi-account phase.
 */

export interface RunnerAuth {
  ok: boolean;
  senderLabel: string;
  error?: string;
}

export function authenticateRunner(req: Request): RunnerAuth {
  const token = config.leadRunnerToken;
  if (!token) return { ok: false, senderLabel: '', error: 'LEAD_RUNNER_TOKEN not configured' };

  const header = req.headers.get('authorization') ?? '';
  const provided = header.toLowerCase().startsWith('bearer ') ? header.slice(7).trim() : '';
  if (!safeEqual(provided, token)) return { ok: false, senderLabel: '', error: 'unauthorized' };

  const senderLabel = req.headers.get('x-sender-account')?.trim() || 'Anthony';
  return { ok: true, senderLabel };
}
