import test from 'node:test';
import assert from 'node:assert/strict';
import {
  countWords,
  normalizeContextLanguage,
  getContextLanguageDefaults,
  contextSourceSchema,
  contextSessionSchema,
  contextSelectionSchema,
  buildContextUnits,
  containingContext,
  CONTEXT_LANGUAGES,
  MIN_SOURCE_WORDS,
  MAX_SOURCE_WORDS,
  MAX_SOURCE_CHARACTERS,
  MAX_SELECTION_CHARACTERS,
  MAX_FOCUS_PHRASES,
} from '../src/lib/context-studio/reader-contract.ts';

test('countWords handles empty and whitespace', () => {
  assert.equal(countWords(''), 0);
  assert.equal(countWords('   '), 0);
  assert.equal(countWords('\n\t '), 0);
});

test('countWords counts words correctly', () => {
  assert.equal(countWords('Hello world'), 2);
  assert.equal(countWords('first\nsecond\t third'), 3);
  assert.equal(countWords('  Hello   world  '), 2);
  assert.equal(countWords('one'), 1);
});

test('countWords handles Unicode', () => {
  assert.equal(countWords('Café naïve résumé'), 3);
  assert.equal(countWords('中文 英文'), 2);
  assert.equal(countWords('😀 😃 😄'), 3);
});

test('normalizeContextLanguage returns correct codes', () => {
  assert.equal(normalizeContextLanguage('en'), 'en');
  assert.equal(normalizeContextLanguage('it'), 'it');
  assert.equal(normalizeContextLanguage('fr'), 'fr');
  assert.equal(normalizeContextLanguage('uk'), 'uk');
  assert.equal(normalizeContextLanguage('english'), 'en');
  assert.equal(normalizeContextLanguage('italian'), 'it');
  assert.equal(normalizeContextLanguage('italiano'), 'it');
  assert.equal(normalizeContextLanguage('french'), 'fr');
  assert.equal(normalizeContextLanguage('ukrainian'), 'uk');
  assert.equal(normalizeContextLanguage('en-US'), 'en');
  assert.equal(normalizeContextLanguage('it-IT'), 'it');
  assert.equal(normalizeContextLanguage('EN'), 'en');
  assert.equal(normalizeContextLanguage('IT'), 'it');
});

test('normalizeContextLanguage returns null for unknown languages', () => {
  assert.equal(normalizeContextLanguage('es'), null);
  assert.equal(normalizeContextLanguage('de'), null);
  assert.equal(normalizeContextLanguage(''), null);
  assert.equal(normalizeContextLanguage(null), null);
  assert.equal(normalizeContextLanguage('unknown'), null);
});

test('getContextLanguageDefaults returns normalized native language', () => {
  assert.deepEqual(getContextLanguageDefaults({ nativeLanguage: 'it-IT', targetLanguage: 'fr' }), { nativeLanguage: 'it', sourceLanguage: null });
  assert.deepEqual(getContextLanguageDefaults({ nativeLanguage: 'english', targetLanguage: 'fr' }), { nativeLanguage: 'en', sourceLanguage: null });
  assert.deepEqual(getContextLanguageDefaults({ nativeLanguage: null, targetLanguage: 'fr' }), { nativeLanguage: null, sourceLanguage: null });
  assert.deepEqual(getContextLanguageDefaults({ nativeLanguage: 'es', targetLanguage: 'fr' }), { nativeLanguage: null, sourceLanguage: null });
});

test('contextSourceSchema accepts valid source text', () => {
  const validText = 'word '.repeat(100).trim(); // 100 words
  assert.equal(contextSourceSchema.safeParse(validText).success, true);
});

test('contextSourceSchema rejects text with too few words', () => {
  const shortText = 'word '.repeat(99).trim(); // 99 words
  assert.equal(contextSourceSchema.safeParse(shortText).success, false);
});

test('contextSourceSchema rejects text with too many words', () => {
  const longText = 'word '.repeat(401).trim(); // 401 words
  assert.equal(contextSourceSchema.safeParse(longText).success, false);
});

test('contextSourceSchema rejects text exceeding MAX_SOURCE_CHARACTERS', () => {
  const longText = 'x'.repeat(3001);
  assert.equal(contextSourceSchema.safeParse(longText).success, false);
});

test('contextSourceSchema accepts text at MAX_SOURCE_CHARACTERS boundary', () => {
  // Need 100-400 words AND <= 3000 chars: 99 words of 29 chars + 1 word of 30 chars + 99 spaces = 3000 chars
  const words99 = Array(99).fill('w'.repeat(29));
  const word30 = 'w'.repeat(30);
  const text = words99.concat([word30]).join(' ');
  assert.ok(text.length === 3000);
  assert.equal(countWords(text), 100);
  assert.equal(contextSourceSchema.safeParse(text).success, true);
});

test('contextSourceSchema rejects empty string', () => {
  assert.equal(contextSourceSchema.safeParse('').success, false);
});

test('contextSessionSchema accepts valid session', () => {
  const session = {
    sourceText: 'word '.repeat(100).trim(),
    sourceLanguage: 'en',
    nativeLanguage: 'it',
    revision: 1,
  };
  assert.equal(contextSessionSchema.safeParse(session).success, true);
});

test('contextSessionSchema rejects invalid sourceLanguage', () => {
  const session = {
    sourceText: 'word '.repeat(100).trim(),
    sourceLanguage: 'es',
    nativeLanguage: 'it',
    revision: 1,
  };
  assert.equal(contextSessionSchema.safeParse(session).success, false);
});

test('contextSessionSchema rejects invalid nativeLanguage', () => {
  const session = {
    sourceText: 'word '.repeat(100).trim(),
    sourceLanguage: 'en',
    nativeLanguage: 'es',
    revision: 1,
  };
  assert.equal(contextSessionSchema.safeParse(session).success, false);
});

test('contextSessionSchema rejects negative revision', () => {
  const session = {
    sourceText: 'word '.repeat(100).trim(),
    sourceLanguage: 'en',
    nativeLanguage: 'it',
    revision: -1,
  };
  assert.equal(contextSessionSchema.safeParse(session).success, false);
});

test('contextSessionSchema rejects non-integer revision', () => {
  const session = {
    sourceText: 'word '.repeat(100).trim(),
    sourceLanguage: 'en',
    nativeLanguage: 'it',
    revision: 1.5,
  };
  assert.equal(contextSessionSchema.safeParse(session).success, false);
});

test('contextSessionSchema rejects extra fields (strict)', () => {
  const session = {
    sourceText: 'word '.repeat(100).trim(),
    sourceLanguage: 'en',
    nativeLanguage: 'it',
    revision: 1,
    extra: 'field',
  };
  assert.equal(contextSessionSchema.safeParse(session).success, false);
});

test('contextSelectionSchema accepts valid selection', () => {
  const sourceText = 'word '.repeat(100).trim();
  const selection = {
    sourceText,
    sourceLanguage: 'en',
    nativeLanguage: 'it',
    revision: 1,
    start: 0,
    end: 4,
    translatedContext: 'traduzione',
  };
  assert.equal(contextSelectionSchema.safeParse(selection).success, true);
});

test('contextSelectionSchema rejects end <= start', () => {
  const sourceText = 'word '.repeat(100).trim();
  for (const [start, end] of [[5, 5], [10, 5], [0, 0]]) {
    const selection = { sourceText, sourceLanguage: 'en', nativeLanguage: 'it', revision: 1, start, end };
    assert.equal(contextSelectionSchema.safeParse(selection).success, false);
  }
});

test('contextSelectionSchema rejects end > sourceText.length', () => {
  const sourceText = 'word '.repeat(100).trim();
  const selection = { sourceText, sourceLanguage: 'en', nativeLanguage: 'it', revision: 1, start: 0, end: sourceText.length + 1 };
  assert.equal(contextSelectionSchema.safeParse(selection).success, false);
});

test('contextSelectionSchema rejects selection exceeding MAX_SELECTION_CHARACTERS', () => {
  const sourceText = 'word '.repeat(100).trim();
  const selection = { sourceText, sourceLanguage: 'en', nativeLanguage: 'it', revision: 1, start: 0, end: MAX_SELECTION_CHARACTERS + 1 };
  assert.equal(contextSelectionSchema.safeParse(selection).success, false);
});

test('contextSelectionSchema accepts selection at MAX_SELECTION_CHARACTERS boundary', () => {
  const sourceText = 'word '.repeat(100).trim() + 'x'.repeat(MAX_SELECTION_CHARACTERS);
  const selection = { sourceText, sourceLanguage: 'en', nativeLanguage: 'it', revision: 1, start: sourceText.length - MAX_SELECTION_CHARACTERS, end: sourceText.length };
  assert.equal(contextSelectionSchema.safeParse(selection).success, true);
});

test('contextSelectionSchema rejects whitespace-only selection', () => {
  const sourceText = '  ' + 'word '.repeat(100).trim();
  const selection = { sourceText, sourceLanguage: 'en', nativeLanguage: 'it', revision: 1, start: 0, end: 2 };
  assert.equal(contextSelectionSchema.safeParse(selection).success, false);
});

test('contextSelectionSchema rejects negative start', () => {
  const sourceText = 'word '.repeat(100).trim();
  const selection = { sourceText, sourceLanguage: 'en', nativeLanguage: 'it', revision: 1, start: -1, end: 4 };
  assert.equal(contextSelectionSchema.safeParse(selection).success, false);
});

test('contextSelectionSchema rejects extra fields (strict)', () => {
  const sourceText = 'word '.repeat(100).trim();
  const selection = { sourceText, sourceLanguage: 'en', nativeLanguage: 'it', revision: 1, start: 0, end: 4, extra: 'field' };
  assert.equal(contextSelectionSchema.safeParse(selection).success, false);
});

test('contextSelectionSchema rejects translatedContext exceeding 6000 chars', () => {
  const sourceText = 'word '.repeat(100).trim();
  const selection = { sourceText, sourceLanguage: 'en', nativeLanguage: 'it', revision: 1, start: 0, end: 4, translatedContext: 'x'.repeat(6001) };
  assert.equal(contextSelectionSchema.safeParse(selection).success, false);
});

test('buildContextUnits creates units with correct structure', () => {
  const text = 'Hello world. This is a test.';
  const units = buildContextUnits(text, 'en');
  assert.ok(units.length >= 2);
  for (const unit of units) {
    assert.ok(unit.id.startsWith('s'));
    assert.ok(typeof unit.paragraph === 'number');
    assert.ok(typeof unit.start === 'number');
    assert.ok(typeof unit.end === 'number');
    assert.ok(unit.end > unit.start);
    assert.equal(unit.text, text.slice(unit.start, unit.end));
  }
});

test('buildContextUnits preserves paragraphs', () => {
  const text = 'First paragraph.\n\nSecond paragraph.';
  const units = buildContextUnits(text, 'en');
  const paragraphs = new Set(units.map(u => u.paragraph));
  assert.ok(paragraphs.size >= 2);
});

test('buildContextUnits handles single sentence', () => {
  const text = 'Single sentence.';
  const units = buildContextUnits(text, 'en');
  assert.equal(units.length, 1);
});

test('buildContextUnits handles empty string', () => {
  const units = buildContextUnits('', 'en');
  assert.equal(units.length, 0);
});

test('containingContext returns intersecting context', () => {
  const text = 'First sentence. Second sentence. Third sentence.';
  const units = buildContextUnits(text, 'en');
  const range = { start: units[1].start, end: units[1].end };
  const context = containingContext(text, units, range);
  assert.ok(context.includes(units[1].text));
});

test('containingContext returns empty for no intersection', () => {
  const text = 'First sentence. Second sentence.';
  const units = buildContextUnits(text, 'en');
  const range = { start: 1000, end: 2000 };
  const context = containingContext(text, units, range);
  assert.equal(context, '');
});

test('containingContext handles range spanning multiple units', () => {
  const text = 'First. Second. Third. Fourth.';
  const units = buildContextUnits(text, 'en');
  const range = { start: units[0].start, end: units[2].end };
  const context = containingContext(text, units, range);
  assert.ok(context.includes(units[0].text));
  assert.ok(context.includes(units[2].text));
});

test('CONTEXT_LANGUAGES has exactly 4 languages', () => {
  assert.equal(CONTEXT_LANGUAGES.length, 4);
  assert.deepEqual(CONTEXT_LANGUAGES.sort(), ['en', 'fr', 'it', 'uk'].sort());
});

test('Constants have expected values', () => {
  assert.equal(MIN_SOURCE_WORDS, 100);
  assert.equal(MAX_SOURCE_WORDS, 400);
  assert.equal(MAX_SOURCE_CHARACTERS, 3000);
  assert.equal(MAX_SELECTION_CHARACTERS, 160);
  assert.equal(MAX_FOCUS_PHRASES, 3);
});
