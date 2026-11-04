import test from 'node:test';
import assert from 'node:assert/strict';
import './test-setup.mjs';
import {
  normalizeReaderWord,
  tokenizeText,
  mapSpeechBoundaryToToken,
  buildSentencePairs,
  selectReaderToken,
  currentTextExamples,
  readerWordStyle,
  addReaderFocus,
  MAX_FOCUS_PHRASES,
} from '../src/lib/context-studio/reader-tokens.ts';

test('normalizeReaderWord handles contractions correctly', () => {
  assert.equal(normalizeReaderWord("don't"), "don't");
  assert.equal(normalizeReaderWord("l'amour"), "l'amour");
  assert.equal(normalizeReaderWord("DON'T"), "don't");
  assert.equal(normalizeReaderWord("can't"), "can't");
  assert.equal(normalizeReaderWord("it's"), "it's");
});

test('normalizeReaderWord strips external punctuation', () => {
  assert.equal(normalizeReaderWord('to,'), 'to');
  assert.equal(normalizeReaderWord('.hello'), 'hello');
  assert.equal(normalizeReaderWord('world!'), 'world');
  assert.equal(normalizeReaderWord('(test)'), 'test');
  assert.equal(normalizeReaderWord('"quote"'), 'quote');
});

test('normalizeReaderWord preserves internal punctuation', () => {
  assert.equal(normalizeReaderWord("don't"), "don't");
  assert.equal(normalizeReaderWord("l'amour"), "l'amour");
  assert.equal(normalizeReaderWord("mother-in-law"), "mother-in-law");
});

test('normalizeReaderWord handles Unicode and NFC', () => {
  assert.equal(normalizeReaderWord('École!'), 'école');
  assert.equal(normalizeReaderWord('école'), 'école');
  assert.equal(normalizeReaderWord('café'), 'café');
  assert.equal(normalizeReaderWord('naïve'), 'naïve');
});

test('normalizeReaderWord returns empty for punctuation-only', () => {
  assert.equal(normalizeReaderWord('...'), '');
  assert.equal(normalizeReaderWord('!!!'), '');
  assert.equal(normalizeReaderWord(''), '');
});

test('normalizeReaderWord lowercases', () => {
  assert.equal(normalizeReaderWord('TO'), 'to');
  assert.equal(normalizeReaderWord('Hello'), 'hello');
});

test('tokenizeText preserves exact text reconstruction', () => {
  const text = "😀 To,  to! don't l'amour.\nToday together towards.";
  const tokens = tokenizeText(text, 'sentence');
  assert.equal(tokens.map(t => t.text).join(''), text);
});

test('tokenizeText assigns unique IDs', () => {
  const text = 'Hello world.';
  const tokens = tokenizeText(text, 'sentence');
  const ids = new Set(tokens.map(t => t.id));
  assert.equal(ids.size, tokens.length);
});

test('tokenizeText is deterministic', () => {
  const text = 'Hello world.';
  const tokens1 = tokenizeText(text, 'sentence');
  const tokens2 = tokenizeText(text, 'sentence');
  assert.deepEqual(tokens1, tokens2);
});

test('tokenizeText preserves UTF-16 positions', () => {
  const text = 'Hello world.';
  const tokens = tokenizeText(text, 'sentence');
  for (const token of tokens) {
    assert.equal(text.slice(token.start, token.end), token.text);
  }
});

test('tokenizeText classifies word tokens correctly', () => {
  const text = 'Hello world!';
  const tokens = tokenizeText(text, 'sentence');
  const words = tokens.filter(t => t.type === 'word');
  assert.equal(words.length, 2);
  assert.equal(words[0].text, 'Hello');
  assert.equal(words[1].text, 'world');
});

test('tokenizeText classifies punctuation correctly', () => {
  const text = 'Hello, world!';
  const tokens = tokenizeText(text, 'sentence');
  const punct = tokens.filter(t => t.type === 'punctuation');
  assert.equal(punct.length, 2);
});

test('tokenizeText classifies whitespace correctly', () => {
  const text = 'Hello  world';
  const tokens = tokenizeText(text, 'sentence');
  const ws = tokens.filter(t => t.type === 'whitespace');
  assert.equal(ws.length, 1);
  assert.equal(ws[0].text, '  ');
});

test('tokenizeText handles contractions as single word', () => {
  const text = "don't stop";
  const tokens = tokenizeText(text, 'sentence');
  const words = tokens.filter(t => t.type === 'word');
  assert.equal(words.length, 2);
  assert.equal(words[0].text, "don't");
  assert.equal(words[1].text, 'stop');
});

test('tokenizeText handles emoji as punctuation', () => {
  const text = '😀 Hello';
  const tokens = tokenizeText(text, 'sentence');
  assert.equal(tokens[0].type, 'punctuation');
  assert.equal(tokens[0].text, '😀');
  assert.equal(tokens[1].type, 'whitespace');
  assert.equal(tokens[2].type, 'word');
  assert.equal(tokens[2].text, 'Hello');
});

test('mapSpeechBoundaryToToken maps character to word token', () => {
  const text = "Hello world";
  const tokens = tokenizeText(text, 'speech');
  const hello = tokens.find(t => t.text === 'Hello');
  const world = tokens.find(t => t.text === 'world');
  assert.equal(mapSpeechBoundaryToToken(tokens, 0)?.id, hello?.id);
  assert.equal(mapSpeechBoundaryToToken(tokens, 4)?.id, hello?.id);
  assert.equal(mapSpeechBoundaryToToken(tokens, 6)?.id, world?.id);
  assert.equal(mapSpeechBoundaryToToken(tokens, 10)?.id, world?.id);
});

test('mapSpeechBoundaryToToken returns null for whitespace/punctuation positions', () => {
  const text = "Hello, world";
  const tokens = tokenizeText(text, 'speech');
  assert.equal(mapSpeechBoundaryToToken(tokens, 5), null); // comma
  assert.equal(mapSpeechBoundaryToToken(tokens, 6), null); // space
});

test('mapSpeechBoundaryToToken rejects invalid indices', () => {
  const text = "Hello";
  const tokens = tokenizeText(text, 'speech');
  for (const invalid of [-1, 0.5, NaN, Infinity, 999]) {
    assert.equal(mapSpeechBoundaryToToken(tokens, invalid), null);
  }
});

test('buildSentencePairs creates pairs with correct structure', () => {
  const session = { sourceText: 'Hello world. How are you?', sourceLanguage: 'en', nativeLanguage: 'it', revision: 1 };
  const pairs = buildSentencePairs(session, null);
  assert.equal(pairs.length, 2);
  for (const pair of pairs) {
    assert.ok(pair.id.startsWith('s'));
    assert.equal(typeof pair.start, 'number');
    assert.equal(typeof pair.end, 'number');
    assert.equal(pair.translatedText, null);
    assert.ok(Array.isArray(pair.sourceTokens));
    assert.ok(Array.isArray(pair.translatedTokens));
  }
});

test('buildSentencePairs includes translations when provided', () => {
  const session = { sourceText: 'Hello world.', sourceLanguage: 'en', nativeLanguage: 'it', revision: 1 };
  const translation = { sourceLanguage: 'en', nativeLanguage: 'it', units: [{ id: 's0-12', translation: 'Ciao mondo.' }] };
  const pairs = buildSentencePairs(session, translation);
  assert.equal(pairs[0].translatedText, 'Ciao mondo.');
});

test('buildSentencePairs tokenizes translated text', () => {
  const session = { sourceText: 'Hello world.', sourceLanguage: 'en', nativeLanguage: 'it', revision: 1 };
  const translation = { sourceLanguage: 'en', nativeLanguage: 'it', units: [{ id: 's0-12', translation: 'Ciao mondo.' }] };
  const pairs = buildSentencePairs(session, translation);
  assert.ok(pairs[0].translatedTokens.length > 0);
  assert.equal(pairs[0].translatedTokens[0].type, 'word');
});

test('selectReaderToken returns selection for word token', () => {
  const session = { sourceText: 'Hello world.', sourceLanguage: 'en', nativeLanguage: 'it', revision: 1 };
  const pairs = buildSentencePairs(session, null);
  const token = pairs[0].sourceTokens.find(t => t.text === 'Hello');
  const selection = selectReaderToken(pairs[0], token);
  assert.ok(selection !== null);
  assert.equal(selection.sentenceId, pairs[0].id);
  assert.equal(selection.tokenId, token.id);
  assert.equal(selection.text, 'Hello');
  assert.equal(selection.normalized, 'hello');
});

test('selectReaderToken returns null for punctuation', () => {
  const session = { sourceText: 'Hello, world.', sourceLanguage: 'en', nativeLanguage: 'it', revision: 1 };
  const pairs = buildSentencePairs(session, null);
  const punct = pairs[0].sourceTokens.find(t => t.type === 'punctuation');
  const selection = selectReaderToken(pairs[0], punct);
  assert.equal(selection, null);
});

test('selectReaderToken returns null for whitespace', () => {
  const session = { sourceText: 'Hello  world.', sourceLanguage: 'en', nativeLanguage: 'it', revision: 1 };
  const pairs = buildSentencePairs(session, null);
  const ws = pairs[0].sourceTokens.find(t => t.type === 'whitespace');
  const selection = selectReaderToken(pairs[0], ws);
  assert.equal(selection, null);
});

test('selectReaderToken returns null for token from different sentence', () => {
  const session = { sourceText: 'Hello. World.', sourceLanguage: 'en', nativeLanguage: 'it', revision: 1 };
  const pairs = buildSentencePairs(session, null);
  const token = pairs[1].sourceTokens.find(t => t.text === 'World');
  const selection = selectReaderToken(pairs[0], token);
  assert.equal(selection, null);
});

test('selectReaderToken returns null for forged token object', () => {
  const session = { sourceText: 'Hello world.', sourceLanguage: 'en', nativeLanguage: 'it', revision: 1 };
  const pairs = buildSentencePairs(session, null);
  const forged = { ...pairs[0].sourceTokens[0], id: 'forged' };
  const selection = selectReaderToken(pairs[0], forged);
  assert.equal(selection, null);
});

test('currentTextExamples finds all occurrences', () => {
  const session = { sourceText: 'Bank bank bank.', sourceLanguage: 'en', nativeLanguage: 'it', revision: 1 };
  const pairs = buildSentencePairs(session, null);
  const examples = currentTextExamples(pairs, 'bank');
  assert.equal(examples.length, 1);
});

test('currentTextExamples returns empty for non-existent word', () => {
  const session = { sourceText: 'Hello world.', sourceLanguage: 'en', nativeLanguage: 'it', revision: 1 };
  const pairs = buildSentencePairs(session, null);
  const examples = currentTextExamples(pairs, 'bank');
  assert.equal(examples.length, 0);
});

test('readerWordStyle returns spoken for spokenId', () => {
  const token = { id: 't1', text: 'hello', normalized: 'hello', type: 'word', start: 0, end: 5 };
  const selected = { sentenceId: 's1', tokenId: 't1', text: 'hello', normalized: 'hello', start: 0, end: 5 };
  assert.equal(readerWordStyle(token, selected, 't1'), 'spoken');
});

test('readerWordStyle returns selected for selected token', () => {
  const token = { id: 't1', text: 'hello', normalized: 'hello', type: 'word', start: 0, end: 5 };
  const selected = { sentenceId: 's1', tokenId: 't1', text: 'hello', normalized: 'hello', start: 0, end: 5 };
  assert.equal(readerWordStyle(token, selected, null), 'selected');
});

test('readerWordStyle returns occurrence for same normalized word', () => {
  const token = { id: 't2', text: 'hello', normalized: 'hello', type: 'word', start: 6, end: 11 };
  const selected = { sentenceId: 's1', tokenId: 't1', text: 'hello', normalized: 'hello', start: 0, end: 5 };
  assert.equal(readerWordStyle(token, selected, null), 'occurrence');
});

test('readerWordStyle returns normal for different word', () => {
  const token = { id: 't2', text: 'world', normalized: 'world', type: 'word', start: 6, end: 11 };
  const selected = { sentenceId: 's1', tokenId: 't1', text: 'hello', normalized: 'hello', start: 0, end: 5 };
  assert.equal(readerWordStyle(token, selected, null), 'normal');
});

test('readerWordStyle returns normal for punctuation', () => {
  const token = { id: 't1', text: ',', normalized: '', type: 'punctuation', start: 5, end: 6 };
  const selected = { sentenceId: 's1', tokenId: 't2', text: 'hello', normalized: 'hello', start: 0, end: 5 };
  assert.equal(readerWordStyle(token, selected, null), 'normal');
});

test('addReaderFocus deduplicates by normalized form', () => {
  const word1 = { sentenceId: 's1', tokenId: 't1', text: 'hello', normalized: 'hello', start: 0, end: 5 };
  const word2 = { sentenceId: 's2', tokenId: 't2', text: 'Hello', normalized: 'hello', start: 10, end: 15 };
  const focus = addReaderFocus([], word1);
  const focus2 = addReaderFocus(focus, word2);
  assert.equal(focus2.length, 1);
});

test('addReaderFocus caps at MAX_FOCUS_PHRASES', () => {
  let items = [];
  for (let i = 0; i < MAX_FOCUS_PHRASES + 2; i++) {
    const word = { sentenceId: `s${i}`, tokenId: `t${i}`, text: `word${i}`, normalized: `word${i}`, start: i * 10, end: i * 10 + 5 };
    items = addReaderFocus(items, word);
  }
  assert.equal(items.length, MAX_FOCUS_PHRASES);
});

test('addReaderFocus returns same array reference when no change', () => {
  const word1 = { sentenceId: 's1', tokenId: 't1', text: 'hello', normalized: 'hello', start: 0, end: 5 };
  const focus = addReaderFocus([], word1);
  const focus2 = addReaderFocus(focus, word1);
  assert.strictEqual(focus, focus2);
});

test('MAX_FOCUS_PHRASES is 3', () => {
  assert.equal(MAX_FOCUS_PHRASES, 3);
});