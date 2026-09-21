import { z } from 'zod';
import { TTS_SAMPLE_RATE, TtsError, type TtsEvent, type TtsInput } from '../../reading-tts/contract';
import { googleVoice, planGoogleSpeech } from './google-plan';
import type { TtsProvider } from './provider';

const responseSchema = z.object({
  audioContent: z.string().min(1).max(30_000_000).regex(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/u),
});

/** LINEAR16 responses have a WAV container, unlike the player's raw PCM. */
export function decodeGoogleWav(bytes: Buffer): Buffer {
  if (bytes.length < 44 || bytes.toString('ascii', 0, 4) !== 'RIFF' || bytes.toString('ascii', 8, 12) !== 'WAVE' || bytes.readUInt32LE(4) + 8 !== bytes.length) throw new TtsError('invalid_audio');
  let format = false; let pcm: Buffer | null = null; let cursor = 12;
  while (cursor + 8 <= bytes.length) {
    const name = bytes.toString('ascii', cursor, cursor + 4);
    const size = bytes.readUInt32LE(cursor + 4); const start = cursor + 8;
    if (start + size > bytes.length) throw new TtsError('invalid_audio');
    if (name === 'fmt ') {
      if (format || size < 16 || bytes.readUInt16LE(start) !== 1 || bytes.readUInt16LE(start + 2) !== 1 || bytes.readUInt32LE(start + 4) !== TTS_SAMPLE_RATE || bytes.readUInt32LE(start + 8) !== TTS_SAMPLE_RATE * 2 || bytes.readUInt16LE(start + 12) !== 2 || bytes.readUInt16LE(start + 14) !== 16) throw new TtsError('invalid_audio');
      format = true;
    }
    if (name === 'data') {
      if (pcm || !size || size % 2) throw new TtsError('invalid_audio');
      pcm = bytes.subarray(start, start + size);
    }
    cursor = start + size + (size % 2);
  }
  if (!format || !pcm || cursor !== bytes.length) throw new TtsError('invalid_audio');
  return pcm;
}

async function readResponse(response: Response): Promise<z.infer<typeof responseSchema>> {
  if (!response.body || !/^application\/json(?:;|$)/iu.test(response.headers.get('content-type') ?? '')) throw new TtsError('invalid_audio');
  const reader = response.body.getReader(); const decoder = new TextDecoder('utf-8', { fatal: true });
  let text = ''; let bytes = 0;
  try {
    while (true) {
      const part = await reader.read(); if (part.done) break;
      bytes += part.value.byteLength;
      if (bytes > 31_000_000) throw new TtsError('invalid_audio');
      text += decoder.decode(part.value, { stream: true });
    }
    const parsed = responseSchema.safeParse(JSON.parse(text + decoder.decode()));
    if (!parsed.success) throw new TtsError('invalid_audio');
    return parsed.data;
  } finally { await reader.cancel().catch(() => {}); reader.releaseLock(); }
}

export class GoogleTtsProvider implements TtsProvider {
  readonly id = 'google';
  readonly model = 'chirp3-hd-plain-v1';
  readonly voice: string;
  private readonly apiKey: string;
  private readonly request: typeof fetch;
  constructor(input: Pick<TtsInput, 'language' | 'voice'>, apiKey: string, request: typeof fetch = fetch) {
    this.voice = googleVoice(input); this.apiKey = apiKey; this.request = request;
  }
  billableCharacters(input: TtsInput): number {
    return planGoogleSpeech(input).reduce((total, segment) => total + segment.characters, 0);
  }
  requestCount(input: TtsInput): number { return planGoogleSpeech(input).length; }
  async *stream(input: TtsInput, signal: AbortSignal): AsyncGenerator<TtsEvent> {
    if (googleVoice(input) !== this.voice) throw new TtsError('invalid_input');
    const segments = planGoogleSpeech(input);
    yield { type: 'start', sampleRate: TTS_SAMPLE_RATE };
    let frames = 0;
    for (const segment of segments) {
      signal.throwIfAborted();
      // No retry here: every new dispatch must be covered by a new reservation.
      // Restrict this server-only key to Cloud Text-to-Speech in its own project.
      const response = await this.request('https://texttospeech.googleapis.com/v1beta1/text:synthesize', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': this.apiKey },
        body: JSON.stringify({ input: { text: segment.text }, voice: { languageCode: this.voice.slice(0, 5), name: this.voice },
          audioConfig: { audioEncoding: 'LINEAR16', sampleRateHertz: TTS_SAMPLE_RATE, speakingRate: input.speed } }),
        signal, cache: 'no-store', redirect: 'error',
      });
      if (!response.ok) {
        await response.body?.cancel();
        throw new TtsError(response.status === 401 || response.status === 403 ? 'provider_auth' : response.status === 429 ? 'rate_limited' : 'provider_failure');
      }
      const result = await readResponse(response);
      signal.throwIfAborted();
      const pcm = decodeGoogleWav(Buffer.from(result.audioContent, 'base64'));
      frames += pcm.length / 2;
      if (frames / TTS_SAMPLE_RATE > 600) throw new TtsError('invalid_audio');
      for (let start = 0; start < pcm.length; start += 48_000) {
        signal.throwIfAborted();
        yield { type: 'audio', pcm: pcm.subarray(start, start + 48_000).toString('base64') };
      }
    }
    yield { type: 'complete', duration: frames / TTS_SAMPLE_RATE };
  }
}
