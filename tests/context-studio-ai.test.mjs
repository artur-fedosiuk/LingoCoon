import test from 'node:test';
import assert from 'node:assert/strict';
import './test-setup.mjs';
import {
  prepareContextDictionary,
  parseContextDictionary,
  prepareContextTranslation,
  prepareContextExplanation,
  parseContextExplanation,
  parseContextTranslation,
  InvalidContextStudioResponseError,
  contextDictionaryRequestSchema,
  CONTEXT_DICTIONARY_JSON_SCHEMA,
  CONTEXT_EXPLANATION_JSON_SCHEMA,
  CONTEXT_TRANSLATION_JSON_SCHEMA,
} from '../src/lib/server/context-studio-ai.ts';

const languages = { sourceLanguage: 'en', nativeLanguage: 'it' };
const session = { sourceText: 'Learning a new language opens doors to different cultures and ways of thinking. Every day brings new opportunities to practice vocabulary, grammar, and pronunciation in real conversations. The key to success is consistency, patience, and making mistakes without fear. By reading authentic texts, listening to native speakers, and speaking regularly, learners build confidence and fluency over time. Context helps words stick in memory better than isolated drills, because meaning emerges from how words are used in sentences. This approach mirrors how children acquire their first language, through exposure and repeated meaningful encounters with words in varied situations. Adults can use similar strategies by immersing themselves in comprehensible input that matches their current level while gently stretching beyond it.', sourceLanguage: 'en', nativeLanguage: 'it', revision: 1 };
const units = [
  { id: 's0-12', text: 'Hello world.' },
  { id: 's13-30', text: 'This is a test.' },
  { id: 's31-65', text: 'Sentence for context studio features.' },
];

test('contextDictionaryRequestSchema accepts valid request', () => {
  const result = contextDictionaryRequestSchema.safeParse({ ...languages, word: 'hello' });
  assert.equal(result.success, true);
});

test('contextDictionaryRequestSchema rejects empty word', () => {
  const result = contextDictionaryRequestSchema.safeParse({ ...languages, word: '' });
  assert.equal(result.success, false);
});

test('contextDictionaryRequestSchema rejects word exceeding 160 chars', () => {
  const result = contextDictionaryRequestSchema.safeParse({ ...languages, word: 'x'.repeat(161) });
  assert.equal(result.success, false);
});

test('contextDictionaryRequestSchema rejects invalid sourceLanguage', () => {
  const result = contextDictionaryRequestSchema.safeParse({ ...languages, sourceLanguage: 'es', word: 'hello' });
  assert.equal(result.success, false);
});

test('contextDictionaryRequestSchema rejects invalid nativeLanguage', () => {
  const result = contextDictionaryRequestSchema.safeParse({ ...languages, nativeLanguage: 'es', word: 'hello' });
  assert.equal(result.success, false);
});

test('contextDictionaryRequestSchema rejects extra fields (strict)', () => {
  const result = contextDictionaryRequestSchema.safeParse({ ...languages, word: 'hello', extra: 'field' });
  assert.equal(result.success, false);
});

test('prepareContextDictionary returns request with prompt and history', () => {
  const { request, prompt, history } = prepareContextDictionary({ ...languages, word: 'bank' });
  assert.equal(request.word, 'bank');
  assert.match(prompt, /Return a lexical dictionary entry/);
  assert.match(prompt, /prose is in Italian/);
  assert.match(prompt, /separately from any contextual interpretation/);
  assert.equal(history.length, 1);
  assert.equal(history[0].role, 'user');
  assert.deepEqual(JSON.parse(history[0].parts[0].text), { word: 'bank' });
});

test('parseContextDictionary parses valid response', () => {
  const response = { sourceLanguage: 'en', nativeLanguage: 'it', senses: [{ partOfSpeech: 'noun', translations: ['banca', 'riva'], definition: 'Financial institution or river bank.' }] };
  const result = parseContextDictionary(JSON.stringify(response), languages);
  assert.equal(result.sourceLanguage, 'en');
  assert.equal(result.nativeLanguage, 'it');
  assert.equal(result.senses.length, 1);
  assert.equal(result.senses[0].partOfSpeech, 'sostantivo');
});

test('parseContextDictionary rejects wrong sourceLanguage', () => {
  const response = { sourceLanguage: 'fr', nativeLanguage: 'it', senses: [{ partOfSpeech: 'noun', translations: ['banca'], definition: null }] };
  assert.throws(() => parseContextDictionary(JSON.stringify(response), languages), InvalidContextStudioResponseError);
});

test('parseContextDictionary rejects wrong nativeLanguage', () => {
  const response = { sourceLanguage: 'en', nativeLanguage: 'fr', senses: [{ partOfSpeech: 'noun', translations: ['banca'], definition: null }] };
  assert.throws(() => parseContextDictionary(JSON.stringify(response), languages), InvalidContextStudioResponseError);
});

test('parseContextDictionary rejects empty senses', () => {
  const response = { sourceLanguage: 'en', nativeLanguage: 'it', senses: [] };
  assert.throws(() => parseContextDictionary(JSON.stringify(response), languages), InvalidContextStudioResponseError);
});

test('parseContextDictionary rejects too many senses', () => {
  const response = { sourceLanguage: 'en', nativeLanguage: 'it', senses: Array.from({ length: 7 }, (_, i) => ({ partOfSpeech: 'noun', translations: ['x'], definition: null })) };
  assert.throws(() => parseContextDictionary(JSON.stringify(response), languages), InvalidContextStudioResponseError);
});

test('parseContextDictionary rejects invalid translation length', () => {
  const response = { sourceLanguage: 'en', nativeLanguage: 'it', senses: [{ partOfSpeech: 'noun', translations: ['x'.repeat(121)], definition: null }] };
  assert.throws(() => parseContextDictionary(JSON.stringify(response), languages), InvalidContextStudioResponseError);
});

test('parseContextDictionary rejects extra fields (strict)', () => {
  const response = { sourceLanguage: 'en', nativeLanguage: 'it', senses: [{ partOfSpeech: 'noun', translations: ['banca'], definition: null, extra: 'field' }] };
  assert.throws(() => parseContextDictionary(JSON.stringify(response), languages), InvalidContextStudioResponseError);
});

test('parseContextDictionary rejects HTML in response', () => {
  const response = { sourceLanguage: 'en', nativeLanguage: 'it', senses: [{ partOfSpeech: 'noun', translations: ['<script>'], definition: null }] };
  assert.throws(() => parseContextDictionary(JSON.stringify(response), languages), InvalidContextStudioResponseError);
});

test('prepareContextTranslation returns session, units, prompt, history', () => {
  const { session: s, units: u, prompt, history } = prepareContextTranslation(session);
  assert.equal(s.sourceText, session.sourceText);
  assert.ok(u.length >= 3);
  assert.match(prompt, /Translate each source unit into Italian/);
  assert.match(prompt, /Return JSON/);
  assert.equal(history.length, 1);
  const text = history[0].parts[0].text;
  assert.match(text, /^<untrusted_units>/);
  assert.match(text, /<\/untrusted_units>$/);
  const untrusted = JSON.parse(text.slice('<untrusted_units>'.length, -'</untrusted_units>'.length));
  assert.ok(Array.isArray(untrusted));
  assert.ok(untrusted.length >= 3);
});

test('prepareContextTranslation rejects invalid session', () => {
  assert.throws(() => prepareContextTranslation({ ...session, sourceLanguage: 'es' }));
  assert.throws(() => prepareContextTranslation({ ...session, sourceText: 'short' }));
});

test('prepareContextExplanation returns selection, prompt, history', () => {
  const input = { ...session, start: 0, end: 5 };
  const { selection, prompt, history } = prepareContextExplanation(input);
  assert.equal(selection.start, 0);
  assert.equal(selection.end, 5);
  assert.match(prompt, /Explain the exact selected source occurrence/);
  assert.match(prompt, /prose exclusively in Italian/);
  assert.match(prompt, /example: one NEW sentence in English/);
  assert.equal(history.length, 1);
  const data = JSON.parse(history[0].parts[0].text);
  assert.equal(data.selectedText, 'Learn');
  assert.ok(data.context.length > 0);
});

test('prepareContextExplanation rejects invalid selection', () => {
  for (const bad of [
    { ...session, start: -1, end: 4 },
    { ...session, start: 9, end: 2 },
    { ...session, start: 0, end: 161 },
    { ...session, start: 0, end: 9000 },
    { ...session, start: 0, end: 5, selectedPhrase: 'fake' },
  ]) {
    assert.throws(() => prepareContextExplanation(bad));
  }
});

test('parseContextExplanation parses valid response', () => {
  const response = {
    sourceLanguage: 'en', nativeLanguage: 'it',
    translation: 'banca', partOfSpeech: 'noun', meaning: 'Financial institution.',
    grammar: 'feminine noun', example: 'The bank is closed.', exampleTranslation: 'La banca è chiusa.'
  };
  const result = parseContextExplanation(JSON.stringify(response), languages);
  assert.equal(result.translation, 'banca');
  assert.equal(result.partOfSpeech, 'sostantivo');
  assert.equal(result.grammar, 'sostantivo femminile');
  assert.equal(result.example, 'The bank is closed.');
});

test('parseContextExplanation rejects wrong languages', () => {
  const response = { sourceLanguage: 'fr', nativeLanguage: 'it', translation: 'banca', partOfSpeech: 'noun', meaning: 'x', grammar: null, example: 'x', exampleTranslation: 'x' };
  assert.throws(() => parseContextExplanation(JSON.stringify(response), languages), InvalidContextStudioResponseError);
});

test('parseContextExplanation rejects missing fields', () => {
  const response = { sourceLanguage: 'en', nativeLanguage: 'it', translation: 'banca', partOfSpeech: 'noun', meaning: 'x' };
  assert.throws(() => parseContextExplanation(JSON.stringify(response), languages), InvalidContextStudioResponseError);
});

test('parseContextExplanation rejects invalid translation length', () => {
  const response = { sourceLanguage: 'en', nativeLanguage: 'it', translation: 'x'.repeat(301), partOfSpeech: 'noun', meaning: 'x', grammar: null, example: 'x', exampleTranslation: 'x' };
  assert.throws(() => parseContextExplanation(JSON.stringify(response), languages), InvalidContextStudioResponseError);
});

test('parseContextTranslation parses valid response', () => {
  const response = { sourceLanguage: 'en', nativeLanguage: 'it', units: units.map(u => ({ id: u.id, translation: 'Traduzione ' + u.id })) };
  const result = parseContextTranslation(JSON.stringify(response), languages, units);
  assert.equal(result.units.length, units.length);
});

test('parseContextTranslation rejects missing unit', () => {
  const response = { sourceLanguage: 'en', nativeLanguage: 'it', units: units.slice(0, 2).map(u => ({ id: u.id, translation: 'Traduzione ' + u.id })) };
  assert.throws(() => parseContextTranslation(JSON.stringify(response), languages, units), InvalidContextStudioResponseError);
});

test('parseContextTranslation rejects duplicate unit IDs', () => {
  const response = { sourceLanguage: 'en', nativeLanguage: 'it', units: [{ id: units[0].id, translation: 'a' }, { id: units[0].id, translation: 'b' }] };
  assert.throws(() => parseContextTranslation(JSON.stringify(response), languages, units), InvalidContextStudioResponseError);
});

test('parseContextTranslation rejects unknown unit ID', () => {
  const response = { sourceLanguage: 'en', nativeLanguage: 'it', units: [{ id: 'unknown', translation: 'a' }] };
  assert.throws(() => parseContextTranslation(JSON.stringify(response), languages, units), InvalidContextStudioResponseError);
});

test('parseContextTranslation rejects extra unit', () => {
  const response = { sourceLanguage: 'en', nativeLanguage: 'it', units: [...units.map(u => ({ id: u.id, translation: 'a' })), { id: 'extra', translation: 'b' }] };
  assert.throws(() => parseContextTranslation(JSON.stringify(response), languages, units), InvalidContextStudioResponseError);
});

test('parseContextTranslation rejects total translation length exceeding 12000', () => {
  const longUnits = units.map(u => ({ id: u.id, translation: 'x'.repeat(5000) }));
  const response = { sourceLanguage: 'en', nativeLanguage: 'it', units: longUnits };
  assert.throws(() => parseContextTranslation(JSON.stringify(response), languages, units), InvalidContextStudioResponseError);
});

test('InvalidContextStudioResponseError is proper Error', () => {
  const error = new InvalidContextStudioResponseError();
  assert.ok(error instanceof Error);
  assert.equal(error.name, 'InvalidContextStudioResponseError');
  assert.equal(error.message, 'Invalid Context Studio response.');
});

test('JSON schemas are valid objects', () => {
  assert.ok(typeof CONTEXT_DICTIONARY_JSON_SCHEMA === 'object');
  assert.ok(typeof CONTEXT_EXPLANATION_JSON_SCHEMA === 'object');
  assert.ok(typeof CONTEXT_TRANSLATION_JSON_SCHEMA === 'object');
  assert.equal(CONTEXT_DICTIONARY_JSON_SCHEMA.type, 'object');
  assert.equal(CONTEXT_EXPLANATION_JSON_SCHEMA.type, 'object');
  assert.equal(CONTEXT_TRANSLATION_JSON_SCHEMA.type, 'object');
});