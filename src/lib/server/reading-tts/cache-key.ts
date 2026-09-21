import { createHmac } from 'node:crypto';
import { normalizeTtsText, type TtsInput } from '../../reading-tts/contract';
import type { TtsProvider } from './provider';

export function ttsCacheKey(owner: string, input: TtsInput, provider: Pick<TtsProvider, 'id' | 'model' | 'voice'>, secret: string): string {
  // Word clips reuse the containing sentence. Private text never shares a cache
  // namespace with another learner; HMAC also prevents dictionary hash probing.
  return createHmac('sha256', secret).update(JSON.stringify([
    'reading-tts-v1-pcm24', owner, normalizeTtsText(input.text), input.language,
    provider.id, provider.model, provider.voice, input.speed,
  ])).digest('hex');
}
