import { supabase } from '../supabase';
import { config } from '../../config';

/**
 * Tracks daily AI spend. Simple cost model: cost = tokens × $/token.
 * Rates are approximations — refine per provider.
 */
const COST_PER_1K_TOKENS_EUR: Record<string, number> = {
  anthropic: 0.003, // Claude Sonnet 4.5 ~ $3/1M input, $15/1M output — using blended
  openai: 0.004,
  gemini: 0.0003,
  mistral: 0.0008,
};

export async function recordAiUsage(tokens: number): Promise<void> {
  const date = new Date().toISOString().slice(0, 10);
  const rate = COST_PER_1K_TOKENS_EUR[config.aiProvider] ?? 0.003;
  const costEur = (tokens / 1000) * rate;

  // Upsert + increment
  await supabase.rpc('increment_daily_ai_budget', {
    p_date: date,
    p_tokens: tokens,
    p_cost: costEur,
  }).then(async ({ error }) => {
    if (error) {
      // Fallback if RPC missing
      const { data: existing } = await supabase
        .from('daily_ai_budget')
        .select('*')
        .eq('date', date)
        .maybeSingle();

      if (!existing) {
        await supabase.from('daily_ai_budget').insert({
          date,
          tokens_used: tokens,
          spent_eur: costEur,
          requests_count: 1,
        });
      } else {
        await supabase
          .from('daily_ai_budget')
          .update({
            tokens_used: (existing.tokens_used as number) + tokens,
            spent_eur: Number(existing.spent_eur) + costEur,
            requests_count: (existing.requests_count as number) + 1,
          })
          .eq('date', date);
      }
    }
  });
}

export async function isBudgetExceeded(): Promise<boolean> {
  const date = new Date().toISOString().slice(0, 10);
  const { data } = await supabase
    .from('daily_ai_budget')
    .select('spent_eur')
    .eq('date', date)
    .maybeSingle();

  if (!data) return false;
  return Number(data.spent_eur) >= config.dailyAiBudgetEur;
}
