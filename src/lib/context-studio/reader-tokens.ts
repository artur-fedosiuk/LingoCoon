import type { ContextSession, ContextTranslation, ContextUnit } from '../../types/context-studio';
import { buildContextUnits, MAX_FOCUS_PHRASES } from './reader-contract';

export interface ReaderToken {
  id: string;
  text: string;
  normalized: string;
  type: 'word' | 'punctuation' | 'whitespace';
  /** UTF-16 positions relative to the exact sentence passed to speech synthesis. */
  start: number;
  end: number;
}
export type ReaderSide = 'source' | 'translation';
export interface SentencePair extends ContextUnit {
  translatedText: string | null;
  sourceTokens: ReaderToken[];
  translatedTokens: ReaderToken[];
}
export interface ReaderSelection {
  sentenceId: string;
  tokenId: string;
  text: string;
  normalized: string;
  start: number;
  end: number;
}

export function normalizeReaderWord(text: string): string {
  return text.normalize('NFC').replace(/[’ʼ]/gu, "'")
    .replace(/^[^\p{L}\p{M}\p{N}]+|[^\p{L}\p{M}\p{N}]+$/gu, '').toLowerCase();
}

export function tokenizeText(text: string, identity: string): ReaderToken[] {
  // Preserve every character; apostrophes inside a word do not split contractions.
  return Array.from(text.matchAll(/[\p{L}\p{M}\p{N}]+(?:['’ʼ][\p{L}\p{M}\p{N}]+)*|\s+|[^\p{L}\p{M}\p{N}\s]+/gu), (match) => {
    const value = match[0];
    const type = /^\s+$/u.test(value) ? 'whitespace' : /^[\p{L}\p{M}\p{N}]/u.test(value) ? 'word' : 'punctuation';
    return { id: `${identity}:${match.index}`, text: value, type, normalized: type === 'word' ? normalizeReaderWord(value) : '', start: match.index, end: match.index + value.length };
  });
}

export function mapSpeechBoundaryToToken(tokens: readonly ReaderToken[], charIndex: number): ReaderToken | null {
  if (!Number.isInteger(charIndex) || charIndex < 0) return null;
  return tokens.find((token) => token.type === 'word' && token.start <= charIndex && charIndex < token.end) ?? null;
}

export function buildSentencePairs(session: ContextSession, translation: ContextTranslation | null): SentencePair[] {
  const translated = new Map(translation?.units.map((unit) => [unit.id, unit.translation]) ?? []);
  return buildContextUnits(session.sourceText, session.sourceLanguage).map((unit) => ({
    ...unit, translatedText: translated.get(unit.id) ?? null,
    sourceTokens: tokenizeText(unit.text, `${unit.id}:source`),
    translatedTokens: tokenizeText(translated.get(unit.id) ?? '', `${unit.id}:translation`),
  }));
}

export function selectReaderToken(pair: SentencePair, token: ReaderToken): ReaderSelection | null {
  if (token.type !== 'word' || !pair.sourceTokens.includes(token)) return null;
  return { sentenceId: pair.id, tokenId: token.id, text: token.text, normalized: token.normalized, start: pair.start + token.start, end: pair.start + token.end };
}

export function currentTextExamples(pairs: SentencePair[], normalized: string): SentencePair[] {
  return pairs.filter((pair) => pair.sourceTokens.some((token) => token.type === 'word' && token.normalized === normalized));
}

export function readerWordStyle(token: ReaderToken, selected: ReaderSelection | null, spokenId: string | null) {
  if (token.id === spokenId) return 'spoken';
  if (token.id === selected?.tokenId) return 'selected';
  if (token.type === 'word' && token.normalized === selected?.normalized) return 'occurrence';
  return 'normal';
}

export function addReaderFocus(items: ReaderSelection[], word: ReaderSelection): ReaderSelection[] {
  if (items.length >= MAX_FOCUS_PHRASES || items.some((item) => item.normalized === word.normalized)) return items;
  return [...items, word];
}
