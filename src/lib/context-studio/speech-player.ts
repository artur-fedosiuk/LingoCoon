import { buildContextUnits } from './reader-contract';
import { tokenizeText, type ReaderSelection, type ReaderSide, type SentencePair } from './reader-tokens';
import { createAudioSession, type AudioRequest, type AudioSpan, type AudioWordSnapshot } from '../reading-tts/audio-session';
import type { ContextSession } from '../../types/context-studio';

export type SpeechState = Omit<AudioWordSnapshot, 'mode'> & { mode: 'word' | 'sentence' | 'document' };
export const IDLE_SPEECH: SpeechState = { status: 'idle', sentenceId: null, tokenId: null, side: 'source', mode: 'document' };
export const ONLINE_VOICE = { name: 'Online voice' };

/** Translate reader occurrences to the exact request text, never search by word text. */
export function wordAudioRequest(session: ContextSession, word: ReaderSelection): AudioRequest {
  const unit = buildContextUnits(session.sourceText, session.sourceLanguage)
    .find((candidate) => candidate.id === word.sentenceId && candidate.start <= word.start && word.end <= candidate.end);
  if (!unit || session.sourceText.slice(word.start, word.end) !== word.text) throw new Error('Invalid reader occurrence');
  const tokens = tokenizeText(unit.text, `${unit.id}:source`).filter((token) => token.type === 'word');
  const start = word.start - unit.start;
  const end = word.end - unit.start;
  if (!tokens.some((token) => token.id === word.tokenId && token.start === start && token.end === end)) throw new Error('Invalid reader token');
  return {
    // Chirp supplies no word boundaries: pronounce the selection independently.
    input: { text: word.text, language: session.sourceLanguage, voice: 'female', speed: 1, mode: 'sentence' },
    side: 'source', spans: [{ start: 0, end: word.text.length, sentenceId: unit.id, tokens: [] }],
  };
}

export function pairsAudioRequest(session: ContextSession, pairs: readonly SentencePair[], side: ReaderSide, mode: 'sentence' | 'document'): AudioRequest {
  const parts: string[] = [];
  const spans: AudioSpan[] = [];
  let offset = 0;
  for (const pair of pairs) {
    const text = side === 'source' ? pair.text : pair.translatedText;
    if (!text) continue;
    if (parts.length) offset += 1;
    const tokens = (side === 'source' ? pair.sourceTokens : pair.translatedTokens)
      .filter((token) => token.type === 'word').map((token) => ({ id: token.id, start: offset + token.start, end: offset + token.end }));
    spans.push({ start: offset, end: offset + text.length, sentenceId: pair.id, tokens });
    parts.push(text);
    offset += text.length;
  }
  return {
    input: { text: parts.join('\n'), language: side === 'source' ? session.sourceLanguage : session.nativeLanguage, voice: 'female', speed: 1, mode: mode === 'document' ? 'reading' : 'sentence' },
    side, spans,
  };
}

/** Compatibility boundary for the existing reader, backed only by cloud audio. */
export function createSpeechPlayer(options: Parameters<typeof createAudioSession>[0]) {
  const audio = createAudioSession(options);
  let previous = audio.getWordSnapshot();
  let speech: SpeechState = IDLE_SPEECH;
  return {
    ...audio,
    getSpeechSnapshot(): SpeechState {
      const next = audio.getWordSnapshot();
      if (next !== previous) {
        previous = next;
        speech = { ...next, mode: next.mode === 'reading' ? 'document' : next.mode };
      }
      return speech;
    },
  };
}
