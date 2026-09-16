import { TtsError } from './contract';

export interface AudioDriver {
  readonly currentTime: number;
  readonly running: boolean;
  activate(): Promise<void>;
  schedule(samples: Float32Array, sampleRate: number, when: number, offsetFrames: number, frames: number, rate: number): void;
  stop(): void;
  dispose(): void;
}

/** Raw signed 16-bit little-endian mono PCM, without a WAV/container header. */
export function decodePcm16(pcm: string): Float32Array {
  let bytes: string;
  try { bytes = atob(pcm); } catch { throw new TtsError('invalid_audio'); }
  if (!bytes.length || bytes.length % 2 || /^(RIFF|OggS|fLaC|ID3)/u.test(bytes)) throw new TtsError('invalid_audio');
  const samples = new Float32Array(bytes.length / 2);
  for (let index = 0; index < samples.length; index += 1) {
    const value = bytes.charCodeAt(index * 2) | bytes.charCodeAt(index * 2 + 1) << 8;
    samples[index] = (value >= 0x8000 ? value - 0x10000 : value) / 0x8000;
  }
  return samples;
}

/** One lazy AudioContext for this reader, shared by document and word previews. */
export function createWebAudioDriver(): AudioDriver {
  let context: AudioContext | null = null;
  let disposed = false;
  const sources = new Set<AudioBufferSourceNode>();
  let buffers = new WeakMap<Float32Array, AudioBuffer>();
  const stop = () => {
    for (const source of sources) {
      source.onended = null;
      try { source.stop(); } catch { /* A source may already have ended. */ }
      source.disconnect();
    }
    sources.clear();
  };
  return {
    get currentTime() { return context?.currentTime ?? 0; },
    get running() { return context?.state === 'running'; },
    async activate() {
      if (disposed || typeof AudioContext === 'undefined') throw new TtsError('unavailable');
      // Called synchronously from the play gesture, before waiting for the network.
      context ??= new AudioContext({ latencyHint: 'interactive' });
      await context.resume();
      if (context.state !== 'running') throw new TtsError('unavailable');
    },
    schedule(samples, sampleRate, when, offsetFrames, frames, rate) {
      if (!context || context.state !== 'running' || frames <= 0) throw new TtsError('unavailable');
      let buffer = buffers.get(samples);
      if (!buffer) {
        buffer = context.createBuffer(1, samples.length, sampleRate);
        buffer.getChannelData(0).set(samples);
        buffers.set(samples, buffer);
      }
      const source = context.createBufferSource();
      source.buffer = buffer;
      // Web Audio playbackRate changes pitch as well as tempo.
      source.playbackRate.value = rate;
      source.connect(context.destination);
      source.onended = () => { sources.delete(source); source.disconnect(); };
      sources.add(source);
      try { source.start(when, offsetFrames / sampleRate, frames / sampleRate); }
      catch (error) { sources.delete(source); source.disconnect(); throw error; }
    },
    stop,
    dispose() {
      disposed = true;
      stop();
      buffers = new WeakMap();
      if (context) void context.close().catch(() => {});
      context = null;
    },
  };
}
