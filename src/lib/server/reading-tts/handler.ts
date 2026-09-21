import { createHmac, randomUUID } from 'node:crypto';
import { MAX_TTS_CHARACTERS, TtsError, ttsInputSchema, ttsStatus, type TtsInput } from '../../reading-tts/contract';
import { safeTtsError } from './service';

export type TtsHandlerDependencies = {
  authenticate(): Promise<string>;
  open(input: TtsInput, owner: string, ip: string, lease: string, signal: AbortSignal): Promise<ReadableStream<Uint8Array>>;
};
export async function readTtsRequest(request: Request, parse: (value: unknown) => TtsInput = (value) => ttsInputSchema.parse(value)): Promise<TtsInput> {
  const max = MAX_TTS_CHARACTERS * 6 + 1024;
  if (!/^application\/json(?:\s*;|$)/iu.test(request.headers.get('content-type') ?? '') || Number(request.headers.get('content-length') ?? 0) > max || !request.body) throw new TtsError('invalid_input');
  const reader = request.body.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let text = ''; let bytes = 0;
  const timeout = AbortSignal.timeout(5000);
  const signal = AbortSignal.any([request.signal, timeout]);
  const cancel = () => { void reader.cancel().catch(() => {}); };
  signal.addEventListener('abort', cancel, { once: true });
  try {
    while (true) {
      signal.throwIfAborted();
      const { value, done } = await reader.read();
      signal.throwIfAborted();
      if (done) break;
      bytes += value.length;
      if (bytes > max) throw new TtsError('invalid_input');
      text += decoder.decode(value, { stream: true });
    }
    text += decoder.decode();
    return parse(JSON.parse(text) as unknown);
  } catch { throw new TtsError('invalid_input'); }
  finally { signal.removeEventListener('abort', cancel); await reader.cancel().catch(() => {}); reader.releaseLock(); }
}

export function hashTtsIp(request: Request, secret: string): string {
  // Only trust the hosting platform's overwritten header, never arbitrary XFF.
  const ip = process.env.VERCEL === '1' ? request.headers.get('x-vercel-forwarded-for')?.split(',')[0]?.trim() : undefined;
  return createHmac('sha256', secret).update(`${new Date().toISOString().slice(0, 10)}:${ip ?? 'unknown'}`).digest('hex');
}
export function createTtsHandler(dependencies: TtsHandlerDependencies) {
  return async (request: Request): Promise<Response> => {
    try {
      const origin = request.headers.get('origin');
      if ((origin && origin !== new URL(request.url).origin) || request.headers.get('sec-fetch-site') === 'cross-site') throw new TtsError('forbidden');
      const owner = await dependencies.authenticate();
      const input = await readTtsRequest(request);
      const body = await dependencies.open(input, owner, request.headers.get('x-vercel-forwarded-for') ?? '', randomUUID(), request.signal);
      return new Response(body, { headers: { 'Content-Type': 'application/x-ndjson; charset=utf-8', 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff', 'X-Accel-Buffering': 'no' } });
    } catch (error) {
      const failure = safeTtsError(error, request.signal);
      return Response.json({ code: failure.code }, { status: ttsStatus(failure.code), headers: { 'Cache-Control': 'no-store', ...(['queued', 'busy', 'rate_limited'].includes(failure.code) ? { 'Retry-After': '4' } : {}) } });
    }
  };
}
