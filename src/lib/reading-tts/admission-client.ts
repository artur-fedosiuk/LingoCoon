import { TtsError } from './contract';

function wait(milliseconds: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    signal.throwIfAborted();
    const aborted = () => { clearTimeout(timer); reject(signal.reason); };
    const timer = setTimeout(() => { signal.removeEventListener('abort', aborted); resolve(); }, milliseconds);
    signal.addEventListener('abort', aborted, { once: true });
  });
}

/** Only an explicit pre-dispatch queue response permits another attempt.
 * Never retry network failures, quota errors, provider failures or audio streams.
 * Waiting occurs in the browser, not in a long-lived serverless request.
 */
export async function fetchAdmittedAudio(
  url: string,
  init: RequestInit & { body: string; signal: AbortSignal },
  options: {
    fetch?: typeof fetch;
    onQueued?: () => void;
    maxWaitMs?: number;
    now?: () => number;
    random?: () => number;
    wait?: typeof wait;
  } = {},
): Promise<Response> {
  const request = options.fetch ?? fetch;
  const now = options.now ?? Date.now;
  const random = options.random ?? Math.random;
  const pause = options.wait ?? wait;
  const deadline = now() + (options.maxWaitMs ?? 180_000);
  for (let attempt = 0; attempt < 46; attempt += 1) {
    init.signal.throwIfAborted();
    if (now() >= deadline) throw new TtsError('busy');
    const timeout = AbortSignal.timeout(Math.max(1, Math.min(45_000, deadline - now())));
    const response = await request(url, { ...init, signal: AbortSignal.any([init.signal, timeout]) });
    if (init.signal.aborted) { await response.body?.cancel(); init.signal.throwIfAborted(); }
    if (response.status !== 202) return response;
    const data: unknown = await response.json();
    if (!data || typeof data !== 'object'
      || !(('code' in data && data.code === 'queued') || ('error' in data && data.error === 'queued'))) {
      throw new TtsError('invalid_audio');
    }
    options.onQueued?.();
    const seconds = Number(response.headers.get('Retry-After'));
    const delay = Math.max(4, Math.min(8, Number.isFinite(seconds) ? seconds : 4)) * 1000 + random() * 1000;
    if (now() + delay >= deadline) throw new TtsError('busy');
    await pause(delay, init.signal);
  }
  throw new TtsError('busy');
}
