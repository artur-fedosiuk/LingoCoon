import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { normalizeLanguageCode } from '../../languages';
import { prepareTtsText } from '../../tts-utils';
import { TtsError, ttsInputSchema, ttsStatus, readNdjson, ttsEventSchema } from '../../reading-tts/contract';
import { readTtsRequest } from './handler';
import type { TtsInput } from '../../reading-tts/contract';
import { safeTtsError } from './service';

const schema = z.object({
  text: z.string().min(1).max(5000),
  languageCode: z.string().min(2).max(40),
  speed: z.number().min(0.75).max(1.5).default(1),
  voice: z.enum(['female', 'male']).default('female'),
}).strict();

/** Compatibility endpoint for HTML audio consumers; uses the same quota as Reading. */
export function createWavTtsHandler(dependencies: {
  authenticate(): Promise<string>;
  open(request: Request, input: TtsInput, owner: string, lease: string, signal: AbortSignal): Promise<ReadableStream<Uint8Array>>;
}) {
  return async (request: Request): Promise<Response> => {
    try {
      if ((request.headers.get('origin') && request.headers.get('origin') !== new URL(request.url).origin)
        || request.headers.get('sec-fetch-site') === 'cross-site') throw new TtsError('forbidden');
      const owner = await dependencies.authenticate();
      const input = await readTtsRequest(request, (value) => {
        const body = schema.parse(value);
        return ttsInputSchema.parse({ text: prepareTtsText(body.text), language: normalizeLanguageCode(body.languageCode),
          voice: body.voice, speed: body.speed, mode: 'reading' });
      });
      const stream = await dependencies.open(request, input, owner, randomUUID(), request.signal);
      const parts: Buffer[] = [];
      let size = 0;
      let complete = false;
      for await (const raw of readNdjson(stream)) {
        const event = ttsEventSchema.parse(raw);
        if (event.type === 'error') throw new TtsError(event.code);
        if (event.type === 'audio') {
          const part = Buffer.from(event.pcm, 'base64');
          size += part.length;
          if (size > 32 * 1024 * 1024 || part.length % 2 !== 0) throw new TtsError('invalid_audio');
          parts.push(part);
        }
        if (event.type === 'complete') complete = true;
      }
      if (!complete || !size) throw new TtsError('invalid_audio');
      const wav = Buffer.alloc(44 + size);
      wav.write('RIFF'); wav.writeUInt32LE(36 + size, 4); wav.write('WAVEfmt ', 8);
      wav.writeUInt32LE(16, 16); wav.writeUInt16LE(1, 20); wav.writeUInt16LE(1, 22);
      wav.writeUInt32LE(24000, 24); wav.writeUInt32LE(48000, 28);
      wav.writeUInt16LE(2, 32); wav.writeUInt16LE(16, 34);
      wav.write('data', 36); wav.writeUInt32LE(size, 40);
      let offset = 44;
      for (const part of parts) { part.copy(wav, offset); offset += part.length; }
      return new Response(wav, { headers: { 'Content-Type': 'audio/wav', 'Cache-Control': 'private, no-store',
        'X-Content-Type-Options': 'nosniff' } });
    } catch (error) {
      const failure = safeTtsError(error, request.signal);
      return Response.json({ error: failure.code }, { status: ttsStatus(failure.code),
        headers: { 'Cache-Control': 'no-store', ...(failure.code === 'queued' ? { 'Retry-After': '4' } : {}) } });
    }
  };
}
