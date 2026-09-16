import { z } from 'zod';

export const TTS_LANGUAGES = ['en', 'it', 'fr', 'uk'] as const;
export const TTS_SAMPLE_RATE = 24_000;
export const MAX_TTS_CHARACTERS = 6_000;
export const MAX_TTS_STREAM_BYTES = 32 * 1024 * 1024;
export const TTS_ERROR_CODES = ['invalid_input', 'authentication_required', 'forbidden', 'unavailable', 'rate_limited', 'quota_exceeded', 'busy', 'provider_auth', 'provider_failure', 'timeout', 'interrupted', 'invalid_audio', 'alignment_unavailable', 'storage_failure'] as const;
export type TtsErrorCode = typeof TTS_ERROR_CODES[number];

// Preserve the exact Unicode text and offsets. Trimming or NFC conversion would
// invalidate the reader's occurrence positions; blank input is rejected instead.
export function normalizeTtsText(text: string): string { return text; }
export const ttsInputSchema = z.object({
  text: z.string().min(1).max(MAX_TTS_CHARACTERS).refine((text) => text.trim().length > 0 && !/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/u.test(text)),
  language: z.enum(TTS_LANGUAGES),
  voice: z.enum(['female', 'male']).default('female'),
  speed: z.number().min(0.75).max(1.5).default(1),
  mode: z.enum(['word', 'sentence', 'reading']),
  selection: z.object({ start: z.number().int().nonnegative(), end: z.number().int().positive() }).strict().optional(),
}).strict().superRefine((input, context) => {
  if (input.mode === 'word' && (!input.selection || input.selection.end <= input.selection.start || input.selection.end > input.text.length || input.selection.end - input.selection.start > 160 || !input.text.slice(input.selection.start, input.selection.end).trim())) {
    context.addIssue({ code: 'custom', path: ['selection'], message: 'A word requires its exact range in the source sentence.' });
  }
  if (input.mode !== 'word' && input.selection) context.addIssue({ code: 'custom', path: ['selection'], message: 'Unexpected selection.' });
});
export type TtsInput = z.infer<typeof ttsInputSchema>;
export const wordAlignmentSchema = z.object({
  start: z.number().int().nonnegative(), end: z.number().int().positive(),
  startTime: z.number().finite().nonnegative(), endTime: z.number().finite().nonnegative(),
}).strict().refine((word) => word.end > word.start && word.endTime >= word.startTime);
export type WordAlignment = z.infer<typeof wordAlignmentSchema>;
export const ttsEventSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('start'), sampleRate: z.literal(TTS_SAMPLE_RATE) }).strict(),
  z.object({ type: z.literal('audio'), pcm: z.string().min(1).max(2_000_000).regex(/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/u) }).strict(),
  z.object({ type: z.literal('alignment'), words: z.array(wordAlignmentSchema).max(MAX_TTS_CHARACTERS) }).strict(),
  z.object({ type: z.literal('complete'), duration: z.number().finite().positive().max(600) }).strict(),
  z.object({ type: z.literal('error'), code: z.enum(TTS_ERROR_CODES) }).strict(),
]);
export type TtsEvent = z.infer<typeof ttsEventSchema>;

export class TtsError extends Error {
  readonly code: TtsErrorCode;
  constructor(code: TtsErrorCode) { super(code); this.name = 'TtsError'; this.code = code; }
}
export function ttsStatus(code: TtsErrorCode): number {
  if (code === 'invalid_input') return 400;
  if (code === 'authentication_required') return 401;
  if (code === 'forbidden') return 403;
  if (code === 'quota_exceeded' || code === 'rate_limited') return 429;
  if (code === 'busy' || code === 'unavailable' || code === 'storage_failure') return 503;
  if (code === 'timeout') return 504;
  return 502;
}

export async function* readNdjson(stream: ReadableStream<Uint8Array>, maxBytes = MAX_TTS_STREAM_BYTES): AsyncGenerator<unknown> {
  const reader = stream.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let pending = ''; let bytes = 0; let finished = false;
  try {
    while (true) {
      const { value, done } = await reader.read();
      if (done) { pending += decoder.decode(); finished = true; break; }
      bytes += value.byteLength;
      if (bytes > maxBytes) throw new TtsError('invalid_audio');
      pending += decoder.decode(value, { stream: true });
      let end: number;
      while ((end = pending.indexOf('\n')) !== -1) {
        const line = pending.slice(0, end).trim(); pending = pending.slice(end + 1);
        if (line) yield JSON.parse(line) as unknown;
      }
      if (pending.length > 2_100_000) throw new TtsError('invalid_audio');
    }
    if (pending.trim()) yield JSON.parse(pending) as unknown;
  } finally {
    if (!finished) await reader.cancel().catch(() => {});
    reader.releaseLock();
  }
}
