import { createHash } from 'node:crypto';
import { AuthenticationRequiredError, requireAuthenticatedClaims } from '@/lib/supabase/auth';
import { TtsError, type TtsInput } from '../../reading-tts/contract';
import { getReadingTtsConfig } from './config';
import { GoogleTtsProvider } from './google';
import { createTtsService } from './service';
import { createSupabaseTtsStore, createTtsStorageClient } from './store';
import { ttsCacheKey } from './cache-key';
import { hashTtsIp } from './handler';

const services = new Map<string, ReturnType<typeof createTtsService>>();

export async function authenticateTts(): Promise<string> {
  try { return (await requireAuthenticatedClaims()).claims.sub; }
  catch (error) {
    if (error instanceof AuthenticationRequiredError) throw new TtsError('authentication_required');
    throw error;
  }
}

/** Every surface shares durable reservations and the owner-private cache. */
export async function openTts(request: Request, input: TtsInput, owner: string, lease: string, signal: AbortSignal) {
  const config = getReadingTtsConfig();
  const provider = new GoogleTtsProvider(input, config.GOOGLE_TTS_API_KEY);
  const identity = createHash('sha256').update(JSON.stringify([config, provider.voice, provider.model])).digest('hex');
  let service = services.get(identity);
  if (!service) {
    service = createTtsService(createSupabaseTtsStore(createTtsStorageClient(config)), provider);
    if (services.size >= 8) services.clear();
    services.set(identity, service);
  }
  return service.open(input, owner, ttsCacheKey(owner, input, provider, config.READING_TTS_CACHE_SECRET),
    hashTtsIp(request, config.READING_TTS_CACHE_SECRET), lease, signal);
}
