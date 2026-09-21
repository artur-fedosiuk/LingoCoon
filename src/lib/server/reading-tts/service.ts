import { MAX_TTS_STREAM_BYTES, TtsError, ttsEventSchema, type TtsEvent, type TtsInput } from '../../reading-tts/contract';
import type { TtsProvider } from './provider';

export type Reservation = { status: 'hit' | 'wait' | 'reserved' | 'queued' | 'rate_limited' | 'quota_exceeded' | 'busy'; objectPath?: string };
export interface TtsStore {
  reserve(owner: string, key: string, characters: number, ipHash: string, lease: string, billableCharacters?: number, providerRequests?: number): Promise<Reservation>;
  find(owner: string, key: string): Promise<{ status: string; objectPath: string | null } | null>;
  read(path: string): Promise<ReadableStream<Uint8Array>>;
  save(owner: string, key: string, lease: string, body: Uint8Array): Promise<void>;
  fail(owner: string, key: string, lease: string): Promise<void>;
}
type Job = { events: Uint8Array[]; bytes: number; listeners: Set<() => void>; subscribers: number; done: boolean; abort: AbortController };
const encoder = new TextEncoder();
export function encodeTtsEvent(event: TtsEvent): Uint8Array { return encoder.encode(JSON.stringify(event) + '\n'); }
export function safeTtsError(error: unknown, signal?: AbortSignal): TtsError {
  if (error instanceof TtsError) return error;
  if (signal?.aborted) return new TtsError(signal.reason instanceof DOMException && signal.reason.name === 'TimeoutError' ? 'timeout' : 'interrupted');
  if (error instanceof SyntaxError) return new TtsError('invalid_audio');
  return new TtsError('provider_failure');
}

/** Process-local fan-out optimizes delivery; database reservations enforce the
 * actual cross-instance single-flight, concurrency and budget boundaries. */
export function createTtsService(store: TtsStore, provider: TtsProvider, options: { timeoutMs?: number; waitMs?: number } = {}) {
  const jobs = new Map<string, Job>();
  const timeoutMs = options.timeoutMs ?? 30_000;
  const waitMs = options.waitMs ?? 250;
  function emit(job: Job, event: TtsEvent) {
    const bytes = encodeTtsEvent(event);
    if (job.bytes + bytes.byteLength > MAX_TTS_STREAM_BYTES) throw new TtsError('invalid_audio');
    job.events.push(bytes); job.bytes += bytes.byteLength;
    for (const notify of job.listeners) notify();
  }
  async function generate(job: Job, input: TtsInput, owner: string, key: string, lease: string) {
    const signal = AbortSignal.any([job.abort.signal, AbortSignal.timeout(timeoutMs)]);
    const started = Date.now();
    let complete = false;
    let terminal: TtsEvent | null = null;
    let initialized = false; let frames = 0; let firstAudioMs: number | null = null;
    try {
      for await (const raw of provider.stream(input, signal)) {
        signal.throwIfAborted();
        const parsed = ttsEventSchema.safeParse(raw);
        if (!parsed.success || complete) throw new TtsError('invalid_audio');
        const event = parsed.data;
        if (event.type === 'error') throw new TtsError(event.code);
        if (event.type === 'start') {
          if (initialized) throw new TtsError('invalid_audio');
          initialized = true;
        } else if (!initialized) throw new TtsError('invalid_audio');
        if (event.type === 'audio') {
          firstAudioMs ??= Date.now() - started;
          const bytes = Buffer.from(event.pcm, 'base64');
          if (!bytes.length || bytes.length % 2) throw new TtsError('invalid_audio');
          frames += bytes.length / 2;
        }
        if (event.type === 'alignment' && event.words.some((word) => word.end > input.text.length)) throw new TtsError('invalid_audio');
        if (event.type === 'complete') {
          if (!frames || Math.abs(event.duration - frames / 24_000) > 0.002) throw new TtsError('invalid_audio');
          complete = true;
          terminal = event;
          continue;
        }
        emit(job, event);
      }
      if (!complete || !terminal) throw new TtsError('interrupted');
      signal.throwIfAborted();
      // Cache only a successfully ended provider stream, not an early complete
      // followed by invalid data or a late upstream failure.
      const ending = encodeTtsEvent(terminal);
      if (job.bytes + ending.byteLength > MAX_TTS_STREAM_BYTES) throw new TtsError('invalid_audio');
      const body = new Uint8Array(job.bytes + ending.byteLength);
      let offset = 0;
      for (const part of [...job.events, ending]) { body.set(part, offset); offset += part.byteLength; }
      await store.save(owner, key, lease, body);
      emit(job, terminal);
      console.info('[ReadingTts]', { operation: 'synthesize', provider: provider.id, outcome: 'ok', firstAudioMs, milliseconds: Date.now() - started, bytes: job.bytes });
    } catch (error) {
      const failure = safeTtsError(error, signal);
      await store.fail(owner, key, lease).catch(() => {});
      // A terminal failure is always delivered, even after hitting the byte cap.
      job.events.push(encodeTtsEvent({ type: 'error', code: failure.code }));
      console.warn('[ReadingTts]', { operation: 'synthesize', provider: provider.id, outcome: failure.code, firstAudioMs, milliseconds: Date.now() - started });
    } finally {
      job.done = true; jobs.delete(key);
      for (const notify of job.listeners) notify();
    }
  }
  function subscribe(job: Job, signal: AbortSignal): ReadableStream<Uint8Array> {
    let index = 0; let detached = false; let wake: (() => void) | null = null;
    job.subscribers += 1;
    const notify = () => { wake?.(); wake = null; };
    const detach = () => {
      if (detached) return;
      detached = true; job.subscribers -= 1; job.listeners.delete(notify); signal.removeEventListener('abort', aborted);
      if (!job.subscribers && !job.done) job.abort.abort();
      notify();
    };
    const aborted = () => detach();
    signal.addEventListener('abort', aborted, { once: true });
    job.listeners.add(notify);
    return new ReadableStream({
      async pull(controller) {
        while (index >= job.events.length && !job.done && !detached) await new Promise<void>((resolve) => { wake = resolve; });
        if (detached || signal.aborted) { detach(); controller.close(); return; }
        const bytes = job.events[index++];
        if (bytes) controller.enqueue(bytes);
        else { detach(); controller.close(); }
      },
      cancel() { detach(); },
    });
  }
  return {
    async open(input: TtsInput, owner: string, key: string, ipHash: string, lease: string, signal: AbortSignal): Promise<ReadableStream<Uint8Array>> {
      signal.throwIfAborted();
      // Reserve UTF-16 units conservatively; never undercount supplementary
      // characters if the provider's billing unit differs from code points.
      const billableCharacters = provider.billableCharacters?.(input) ?? input.text.length;
      if (!Number.isSafeInteger(billableCharacters) || billableCharacters < input.text.length || billableCharacters > 50_000) throw new TtsError('invalid_input');
      const providerRequests = provider.requestCount?.(input) ?? 1;
      if (!Number.isSafeInteger(providerRequests) || providerRequests < 1 || providerRequests > 100) throw new TtsError('invalid_input');
      const reservation = await store.reserve(owner, key, input.text.length, ipHash, lease, billableCharacters, providerRequests);
      if (signal.aborted) {
        if (reservation.status === 'reserved') await store.fail(owner, key, lease).catch(() => {});
        throw new TtsError('interrupted');
      }
      if (reservation.status === 'hit' && reservation.objectPath) return store.read(reservation.objectPath);
      if (reservation.status === 'reserved') {
        const job: Job = { events: [], bytes: 0, listeners: new Set(), subscribers: 0, done: false, abort: new AbortController() };
        jobs.set(key, job);
        const stream = subscribe(job, signal);
        void generate(job, input, owner, key, lease);
        return stream;
      }
      if (reservation.status !== 'wait') throw new TtsError(reservation.status === 'hit' ? 'storage_failure' : reservation.status);
      const deadline = Date.now() + timeoutMs + 5000;
      while (Date.now() < deadline) {
        signal.throwIfAborted();
        const local = jobs.get(key);
        if (local) return subscribe(local, signal);
        const entry = await store.find(owner, key);
        if (entry?.status === 'ready' && entry.objectPath) return store.read(entry.objectPath);
        if (!entry || entry.status === 'failed') throw new TtsError('provider_failure');
        await new Promise<void>((resolve, reject) => {
          const abort = () => { clearTimeout(timer); signal.removeEventListener('abort', abort); reject(new TtsError('interrupted')); };
          const timer = setTimeout(() => { signal.removeEventListener('abort', abort); resolve(); }, waitMs);
          signal.addEventListener('abort', abort, { once: true });
        });
      }
      throw new TtsError('busy');
    },
  };
}
