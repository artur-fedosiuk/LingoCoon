import type { TtsEvent, TtsInput } from '../../reading-tts/contract';

export interface TtsProvider {
  readonly id: string;
  readonly model: string;
  readonly voice: string;
  billableCharacters?(input: TtsInput): number;
  stream(input: TtsInput, signal: AbortSignal): AsyncIterable<TtsEvent>;
}
