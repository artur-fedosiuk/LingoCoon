import { MAX_TTS_CHARACTERS, readNdjson, TTS_ERROR_CODES, TTS_SAMPLE_RATE, TtsError, ttsEventSchema, ttsInputSchema, type TtsErrorCode, type TtsInput, type WordAlignment } from './contract';
import { decodePcm16, type AudioDriver } from './web-audio-driver';
import { fetchAdmittedAudio } from './admission-client';

export type AudioSide = 'source' | 'translation';
export interface AudioSpan {
  start: number; end: number; sentenceId: string;
  tokens: ReadonlyArray<{ id: string; start: number; end: number }>;
}
export interface AudioRequest { input: TtsInput; side: AudioSide; spans: readonly AudioSpan[] }
export type AudioStatus = 'idle' | 'loading' | 'playing' | 'paused' | 'error';
export interface AudioSnapshot {
  queued: boolean;
  status: AudioStatus; currentTime: number; bufferedDuration: number; duration: number | null;
  playbackRate: number; mode: TtsInput['mode']; side: AudioSide;
  error: TtsErrorCode | null; hasPausedReading: boolean;
}
export interface AudioWordSnapshot {
  status: AudioStatus; sentenceId: string | null; tokenId: string | null;
  mode: TtsInput['mode']; side: AudioSide;
}
export const IDLE_AUDIO: AudioSnapshot = { queued: false, status: 'idle', currentTime: 0, bufferedDuration: 0, duration: null, playbackRate: 1, mode: 'reading', side: 'source', error: null, hasPausedReading: false };
export const IDLE_AUDIO_WORD: AudioWordSnapshot = { status: 'idle', sentenceId: null, tokenId: null, mode: 'reading', side: 'source' };

type Chunk = { samples: Float32Array; start: number };
type Recording = {
  queued: boolean;
  request: AudioRequest; abort: AbortController; chunks: Chunk[]; frames: number;
  words: WordAlignment[]; complete: boolean; clip: { start: number; end: number } | null;
  position: number; anchorTime: number | null; anchorFrame: number; scheduledFrame: number;
  wantsPlay: boolean; ready: boolean; error: TtsErrorCode | null;
  timeout?: ReturnType<typeof setTimeout>;
};
type Options = {
  driver: AudioDriver;
  fetch?: typeof fetch;
  /** Tests advance the injected audio clock and call tick; no second timing algorithm. */
  autoTick?: boolean;
  streamTimeoutMs?: number;
};

function errorCode(error: unknown, fallback: TtsErrorCode): TtsErrorCode {
  if (error instanceof TtsError) return error.code;
  if (typeof error === 'object' && error !== null && 'code' in error && TTS_ERROR_CODES.some((code) => code === error.code)) return error.code as TtsErrorCode;
  return error instanceof SyntaxError ? 'invalid_audio' : fallback;
}

export function createAudioSession({ driver, fetch: fetchAudio = (...args) => fetch(...args), autoTick = true, streamTimeoutMs = 45_000 }: Options) {
  let active: Recording | null = null;
  let heldReading: Recording | null = null;
  let disposed = false;
  let rate = 1;
  let snapshot = IDLE_AUDIO;
  let wordSnapshot = IDLE_AUDIO_WORD;
  let timer: ReturnType<typeof setInterval> | undefined;
  let lastPositionNotice = -Infinity;
  const listeners = new Set<() => void>();
  const wordListeners = new Set<() => void>();
  const live = (recording: Recording) => !disposed && (recording === active || recording === heldReading) && !recording.abort.signal.aborted;
  const startFrame = (recording: Recording) => recording.clip?.start ?? 0;
  const endFrame = (recording: Recording) => recording.clip?.end ?? recording.frames;
  const position = (recording: Recording) => recording.anchorTime === null ? recording.position : Math.min(recording.scheduledFrame, recording.anchorFrame + Math.max(0, driver.currentTime - recording.anchorTime) * rate * TTS_SAMPLE_RATE);
  const status = (recording: Recording): AudioStatus => recording.error ? 'error' : !recording.wantsPlay ? 'paused' : recording.anchorTime !== null && position(recording) < recording.scheduledFrame ? 'playing' : 'loading';

  function notify(forcePosition = false) {
    const recording = active;
    const state = recording ? status(recording) : 'idle';
    const frame = recording ? position(recording) : 0;
    const time = frame / TTS_SAMPLE_RATE;
    // Alignment is searched by the audio clock. No estimated word intervals.
    let word: WordAlignment | undefined;
    if (recording && state === 'playing') {
      let low = 0; let high = recording.words.length - 1;
      while (low <= high) {
        const middle = (low + high) >>> 1;
        if (recording.words[middle].startTime <= time) { word = recording.words[middle]; low = middle + 1; }
        else high = middle - 1;
      }
      if (word && time >= word.endTime) word = undefined;
    }
    const span = word ? recording?.request.spans.find((item) => item.start <= word.start && word.end <= item.end) : undefined;
    const token = word ? span?.tokens.find((item) => item.start <= word.start && word.start < item.end) : undefined;
    const nextWord: AudioWordSnapshot = recording ? {
      status: state, sentenceId: span?.sentenceId ?? null, tokenId: token?.id ?? null,
      mode: recording.request.input.mode, side: recording.request.side,
    } : IDLE_AUDIO_WORD;
    if (Object.keys(nextWord).some((key) => nextWord[key as keyof AudioWordSnapshot] !== wordSnapshot[key as keyof AudioWordSnapshot])) {
      wordSnapshot = nextWord;
      wordListeners.forEach((listener) => listener());
    }
    const next: AudioSnapshot = recording ? {
      queued: recording.queued,
      status: state, currentTime: Math.max(0, frame - startFrame(recording)) / TTS_SAMPLE_RATE,
      bufferedDuration: recording.request.input.mode === 'word' && !recording.clip ? 0 : Math.max(0, Math.min(recording.frames, endFrame(recording)) - startFrame(recording)) / TTS_SAMPLE_RATE,
      duration: recording.clip ? (recording.clip.end - recording.clip.start) / TTS_SAMPLE_RATE : recording.complete ? recording.frames / TTS_SAMPLE_RATE : null,
      playbackRate: rate, mode: recording.request.input.mode, side: recording.request.side,
      error: recording.error, hasPausedReading: !!heldReading,
    } : { ...IDLE_AUDIO, playbackRate: rate };
    const structuralChange = next.queued !== snapshot.queued || next.status !== snapshot.status || next.error !== snapshot.error || next.mode !== snapshot.mode || next.side !== snapshot.side || next.hasPausedReading !== snapshot.hasPausedReading || next.playbackRate !== snapshot.playbackRate;
    if (forcePosition || structuralChange || driver.currentTime - lastPositionNotice >= 0.25) {
      if (Object.keys(next).some((key) => next[key as keyof AudioSnapshot] !== snapshot[key as keyof AudioSnapshot])) {
        snapshot = next;
        lastPositionNotice = driver.currentTime;
        listeners.forEach((listener) => listener());
      }
    }
  }

  function freeze(recording: Recording) {
    recording.position = Math.floor(position(recording));
    recording.anchorTime = null;
    if (recording === active) driver.stop();
  }
  function cancel(recording: Recording | null) {
    if (!recording) return;
    clearTimeout(recording.timeout);
    recording.abort.abort();
  }
  function fail(recording: Recording, code: TtsErrorCode) {
    if (!live(recording)) return;
    freeze(recording);
    recording.error = code;
    recording.wantsPlay = false;
    cancel(recording);
    notify(true);
  }
  function restoreReading() {
    if (!heldReading) return false;
    cancel(active);
    driver.stop();
    active = heldReading;
    heldReading = null;
    active.wantsPlay = false;
    notify(true);
    return true;
  }
  function pump() {
    const recording = active;
    if (!recording || recording.error || !recording.wantsPlay || !recording.ready) return;
    if (!driver.running) { freeze(recording); recording.wantsPlay = false; return; }
    if (recording.request.input.mode === 'word' && (!recording.clip || recording.frames < recording.clip.end)) return;
    const frame = position(recording);
    const end = endFrame(recording);
    if (recording.anchorTime !== null && frame >= recording.scheduledFrame) freeze(recording);
    if (frame >= end) {
      if (recording.complete || recording.clip) {
        recording.wantsPlay = false;
        if (recording.request.input.mode === 'word') {
          if (!restoreReading()) { cancel(recording); driver.stop(); active = null; }
        }
      }
      return;
    }
    if (recording.anchorTime === null) {
      recording.anchorTime = driver.currentTime + 0.015;
      recording.anchorFrame = recording.position;
      recording.scheduledFrame = recording.position;
    }
    for (const chunk of recording.chunks) {
      const from = Math.max(chunk.start, recording.scheduledFrame);
      const to = Math.min(chunk.start + chunk.samples.length, end);
      if (to <= from) continue;
      driver.schedule(chunk.samples, TTS_SAMPLE_RATE, recording.anchorTime + (from - recording.anchorFrame) / (rate * TTS_SAMPLE_RATE), from - chunk.start, to - from, rate);
      recording.scheduledFrame = to;
    }
  }
  function tick() {
    try { pump(); } catch (error) { if (active) fail(active, errorCode(error, 'unavailable')); }
    notify();
    if (!active?.wantsPlay) { clearInterval(timer); timer = undefined; }
  }
  function runClock() {
    if (autoTick && !timer) timer = setInterval(tick, 50);
    tick();
  }
  function activate(recording: Recording) {
    try {
      void driver.activate().then(() => {
        if (!live(recording) || recording !== active) return;
        recording.ready = true;
        runClock();
      }).catch((error: unknown) => fail(recording, errorCode(error, 'unavailable')));
    } catch (error) { fail(recording, errorCode(error, 'unavailable')); }
  }
  function resolveClip(recording: Recording) {
    const selection = recording.request.input.selection;
    if (!selection || recording.clip) return;
    const words = recording.words.filter((word) => word.start >= selection.start && word.end <= selection.end);
    if (!words.length || words[0].start !== selection.start || words.at(-1)?.end !== selection.end) return;
    if (words.some((word, index) => index > 0 && recording.request.input.text.slice(words[index - 1].end, word.start).trim())) return;
    const start = Math.round(words[0].startTime * TTS_SAMPLE_RATE);
    const end = Math.round(words[words.length - 1].endTime * TTS_SAMPLE_RATE);
    if (end <= start) return;
    recording.clip = { start, end };
    recording.position = start;
  }
  async function load(recording: Recording) {
    const { signal } = recording.abort;
    const armTimeout = () => {
      clearTimeout(recording.timeout);
      recording.timeout = setTimeout(() => fail(recording, 'timeout'), streamTimeoutMs);
    };
    armTimeout();
    try {
      const response = await fetchAdmittedAudio('/api/tts', {
        method: 'POST', mode: 'same-origin', credentials: 'same-origin', redirect: 'error', signal,
        headers: { 'Content-Type': 'application/json', Accept: 'application/x-ndjson' },
        body: JSON.stringify(recording.request.input),
      }, { fetch: fetchAudio, onQueued: () => { recording.queued = true; armTimeout(); notify(true); } });
      recording.queued = false;
      armTimeout();
      if (!live(recording)) { void response.body?.cancel().catch(() => {}); return; }
      if (!response.ok) {
        const error: unknown = await response.json().catch(() => null);
        throw new TtsError(errorCode(error, 'provider_failure'));
      }
      if (!response.headers.get('content-type')?.toLowerCase().startsWith('application/x-ndjson') || !response.body) throw new TtsError('invalid_audio');
      let started = false;
      // Pipe cancellation reaches a pending reader even if a mocked fetch ignores abort.
      const stream = response.body.pipeThrough(new TransformStream<Uint8Array, Uint8Array>(), { signal });
      for await (const raw of readNdjson(stream)) {
        if (!live(recording)) return;
        armTimeout();
        const parsed = ttsEventSchema.safeParse(raw);
        if (!parsed.success || recording.complete) throw new TtsError('invalid_audio');
        const event = parsed.data;
        if (event.type === 'error') throw new TtsError(event.code);
        if (event.type === 'start') {
          if (started) throw new TtsError('invalid_audio');
          started = true;
        } else {
          if (!started) throw new TtsError('invalid_audio');
          if (event.type === 'audio') {
            const samples = decodePcm16(event.pcm);
            if (recording.frames + samples.length > 600 * TTS_SAMPLE_RATE) throw new TtsError('invalid_audio');
            recording.chunks.push({ samples, start: recording.frames });
            recording.frames += samples.length;
          } else if (event.type === 'alignment') {
            for (const word of event.words) {
              const previous = recording.words.at(-1);
              if (word.end > recording.request.input.text.length || word.endTime > 600 || (previous && (word.start < previous.end || word.startTime < previous.endTime))) throw new TtsError('invalid_audio');
              recording.words.push(word);
            }
            if (recording.words.length > MAX_TTS_CHARACTERS) throw new TtsError('invalid_audio');
            resolveClip(recording);
          } else if (event.type === 'complete') {
            if (!recording.frames || Math.abs(event.duration - recording.frames / TTS_SAMPLE_RATE) > 0.05 || recording.words.some((word) => word.endTime > recording.frames / TTS_SAMPLE_RATE + 0.05)) throw new TtsError('invalid_audio');
            if (recording.request.input.mode === 'word' && (!recording.clip || recording.clip.end > recording.frames)) throw new TtsError('alignment_unavailable');
            recording.complete = true;
          }
        }
        if (recording === active) runClock();
      }
      if (live(recording) && !recording.complete) throw new TtsError('interrupted');
      if (recording === active) notify(true);
    } catch (error) {
      if (live(recording)) fail(recording, errorCode(error, 'interrupted'));
    } finally { clearTimeout(recording.timeout); }
  }

  function play(request: AudioRequest) {
    if (disposed) return;
    if (active) freeze(active);
    if (request.input.mode === 'word' && active?.request.input.mode === 'reading') {
      cancel(heldReading);
      heldReading = active;
      heldReading.wantsPlay = false;
    } else cancel(active);
    if (request.input.mode !== 'word') { cancel(heldReading); heldReading = null; }
    const recording: Recording = {
      queued: false, request, abort: new AbortController(), chunks: [], frames: 0, words: [], complete: false, clip: null,
      position: 0, anchorTime: null, anchorFrame: 0, scheduledFrame: 0, wantsPlay: true, ready: false, error: null,
    };
    active = recording;
    const parsed = ttsInputSchema.safeParse(request.input);
    if (!parsed.success) { fail(recording, 'invalid_input'); return; }
    recording.request = { ...request, input: parsed.data };
    notify(true);
    activate(recording);
    if (live(recording)) void load(recording);
  }
  function pause() {
    if (!active || active.error) return;
    freeze(active);
    active.wantsPlay = false;
    tick(); notify(true);
  }
  function resume() {
    if (!active || active.error) return;
    if ((active.complete || active.clip) && active.position >= endFrame(active)) active.position = startFrame(active);
    active.wantsPlay = true;
    active.ready = false;
    activate(active);
    notify(true);
  }
  function seek(seconds: number) {
    if (!active || active.error || !Number.isFinite(seconds) || (active.request.input.mode === 'word' && !active.clip)) return;
    freeze(active);
    active.position = Math.max(startFrame(active), Math.min(Math.floor(seconds * TTS_SAMPLE_RATE) + startFrame(active), Math.min(active.frames, endFrame(active))));
    runClock(); notify(true);
  }
  function stop() {
    cancel(active); cancel(heldReading);
    active = null; heldReading = null;
    driver.stop();
    clearInterval(timer); timer = undefined;
    notify(true);
  }
  return {
    play, pause, resume, seek, stop, tick,
    getSnapshot: () => snapshot,
    getWordSnapshot: () => wordSnapshot,
    subscribe(listener: () => void) { listeners.add(listener); return () => { listeners.delete(listener); }; },
    subscribeWords(listener: () => void) { wordListeners.add(listener); return () => { wordListeners.delete(listener); }; },
    skip(seconds: number) { if (active) seek((position(active) - startFrame(active)) / TTS_SAMPLE_RATE + seconds); },
    setRate(value: number) {
      if (!Number.isFinite(value)) return;
      if (active) freeze(active);
      rate = Math.min(1.5, Math.max(0.75, value));
      runClock(); notify(true);
    },
    retry() { if (active?.error) play(active.request); },
    resumeReading() { if (restoreReading()) resume(); },
    dispose() { stop(); disposed = true; listeners.clear(); wordListeners.clear(); driver.dispose(); },
  };
}
export type AudioSession = ReturnType<typeof createAudioSession>;
