import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

export type AiQuotaFeature =
  | 'tutor'
  | 'deck_generation'
  | 'lexicoon'
  | 'card_translation'
  | 'context_studio'
  | 'stt';

const BURST_WINDOW_SECONDS = 60;
const DAILY_WINDOW_SECONDS = 86_400;
const DAILY_BUCKET = 'ai_daily';
const DAILY_LIMIT = 1000;

/** Max requests per user per minute, per feature. */
const BURST_LIMITS: Record<AiQuotaFeature, number> = {
  tutor: 20,
  deck_generation: 5,
  lexicoon: 20,
  card_translation: 30,
  context_studio: 60,
  stt: 10,
};

export class AiQuotaExceededError extends Error {
  constructor() {
    super('AI usage limit reached. Please try again later.');
    this.name = 'AiQuotaExceededError';
  }
}

/**
 * Count one AI request for the current user. Throws AiQuotaExceededError when a
 * limit is exceeded. Any other failure also throws (fail closed, protects cost).
 */
export async function consumeAiQuota(
  supabase: SupabaseClient<Database>,
  feature: AiQuotaFeature,
): Promise<void> {
  await consumeBucket(supabase, feature, BURST_LIMITS[feature], BURST_WINDOW_SECONDS);
  await consumeBucket(supabase, DAILY_BUCKET, DAILY_LIMIT, DAILY_WINDOW_SECONDS);
}

async function consumeBucket(
  supabase: SupabaseClient<Database>,
  bucket: string,
  limit: number,
  windowSeconds: number,
): Promise<void> {
  const { data, error } = await supabase.rpc('consume_ai_quota', {
    p_bucket: bucket,
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });

  if (error || typeof data !== 'boolean') {
    throw new Error('AI quota check failed.');
  }
  if (!data) {
    throw new AiQuotaExceededError();
  }
}