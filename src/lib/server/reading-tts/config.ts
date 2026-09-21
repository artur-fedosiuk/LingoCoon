import { z } from 'zod';
import { TtsError } from '../../reading-tts/contract';

const storageSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url().refine((value) => new URL(value).protocol === 'https:'),
  SUPABASE_SERVICE_ROLE_KEY: z.string().trim().min(1),
});
const schema = storageSchema.extend({
  READING_TTS_PROVIDER: z.literal('google').default('google'),
  GOOGLE_TTS_ENABLED: z.literal('true'),
  GOOGLE_TTS_API_KEY: z.string().trim().min(1).max(4096),
  READING_TTS_CACHE_SECRET: z.string().min(32).max(256),
});
export type ReadingTtsStorageConfig = z.infer<typeof storageSchema>;
export type ReadingTtsConfig = z.infer<typeof schema>;
export function getReadingTtsConfig(environment: NodeJS.ProcessEnv = process.env): ReadingTtsConfig {
  const parsed = schema.safeParse(environment);
  if (!parsed.success) throw new TtsError('unavailable');
  return parsed.data;
}
export function getReadingTtsStorageConfig(environment: NodeJS.ProcessEnv = process.env): ReadingTtsStorageConfig {
  const parsed = storageSchema.safeParse(environment);
  if (!parsed.success) throw new TtsError('unavailable');
  return parsed.data;
}
