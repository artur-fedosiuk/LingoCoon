import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { existsSync, readFileSync } from 'node:fs';
import { pathToFileURL, fileURLToPath } from 'node:url';
import path from 'node:path';

// Resolve the app's existing TypeScript aliases without changing shipped modules.
registerHooks({ resolve(specifier, context, next) {
  if (specifier.startsWith('@/')) return next(pathToFileURL(path.resolve('src', specifier.slice(2)) + '.ts').href, context);
  if (specifier.startsWith('.') && context.parentURL?.includes('/src/')) {
    const candidate = new URL(specifier + '.ts', context.parentURL);
    if (existsSync(fileURLToPath(candidate))) return next(candidate.href, context);
  }
  return next(specifier, context);
} });
const contract = await import('../src/lib/context-studio/reader-contract.ts');
const ai = await import('../src/lib/server/context-studio-ai.ts');
const sourceText = `My colleague entered the bank to deposit money before meeting her brother. The clerk explained why the transfer would arrive on Monday, although she had expected it sooner and had already promised to pay the builder that afternoon.\n\nLater, they sat on the bank of the river and watched two ducks move slowly past the bridge. After the heavy rain, the bank was muddy, so they kept their bags on a dry rock and talked about the journey home.\n\nBefore leaving, my colleague photographed the bank across the water. She wanted to remember the quiet path, the tall trees, and the small wooden sign that pointed visitors towards the village.`;
const session = { sourceText, sourceLanguage: 'en', nativeLanguage: 'it', revision: 1 };
const units = contract.buildContextUnits(sourceText, 'en');
const tokens = await import('../src/lib/context-studio/reader-tokens.ts');
const dictionary = await import('../src/lib/context-studio/reader-dictionary.ts');
const pairs = tokens.buildSentencePairs(session, null);
const select = (text, occurrence = 0) => pairs.flatMap((pair) => pair.sourceTokens.filter((token) => token.normalized === text).map((token) => tokens.selectReaderToken(pair, token)))[occurrence];
const banks = [0, 1, 2, 3].map((index) => select('bank', index));

test('normalization preserves contractions and Unicode while stripping external punctuation', () => {
  for (const [input, expected] of [['to', 'to'], ['To', 'to'], ['to,', 'to'], ["don't", "don't"], ["l'amour", "l'amour"], ['DON’T', "don't"], ['École!', 'école'], ['e\u0301cole', 'école'], ['…', '']]) {
    assert.equal(tokens.normalizeReaderWord(input), expected);
  }
});

test('tokens reconstruct punctuation, contractions, repeated spaces and UTF-16 positions exactly', () => {
  const text = "😀 To,  to! don't l’amour.\nToday together towards.";
  const result = tokens.tokenizeText(text, 'sentence');
  assert.equal(result.map((token) => token.text).join(''), text);
  assert.equal(new Set(result.map((token) => token.id)).size, result.length);
  assert.deepEqual(tokens.tokenizeText(text, 'sentence'), result);
  for (const token of result) assert.equal(text.slice(token.start, token.end), token.text);
  assert.equal(result.find((token) => token.text === 'To').start, 3);
  assert.deepEqual(result.filter((token) => token.type === 'word').map((token) => token.normalized), ['to', 'to', "don't", "l'amour", 'today', 'together', 'towards']);
});

test('selection highlights exact normalized tokens only, replaces matches, and respects speech precedence', () => {
  const pair = tokens.buildSentencePairs({ ...session, sourceText: 'To, to today together towards success.' }, null)[0];
  const words = pair.sourceTokens.filter((token) => token.type === 'word');
  const first = tokens.selectReaderToken(pair, words[0]);
  assert.deepEqual(words.map((token) => tokens.readerWordStyle(token, first, null)), ['selected', 'occurrence', 'normal', 'normal', 'normal', 'normal']);
  assert.equal(tokens.readerWordStyle(words[0], first, words[0].id), 'spoken');
  const last = tokens.selectReaderToken(pair, words.at(-1));
  assert.deepEqual(words.map((token) => tokens.readerWordStyle(token, last, null)), ['normal', 'normal', 'normal', 'normal', 'normal', 'selected']);
  assert.equal(tokens.selectReaderToken(pair, pair.sourceTokens.find((token) => token.type === 'punctuation')), null);
  assert.equal(tokens.selectReaderToken(pair, { ...words[0] }), null);
});

test('speech boundaries resolve repeated words by exact character position, never by text or percentage', () => {
  const result = tokens.tokenizeText("😀 To,  to! don't l’amour.", 'speech');
  for (const token of result) {
    assert.equal(tokens.mapSpeechBoundaryToToken(result, token.start)?.id ?? null, token.type === 'word' ? token.id : null);
    if (token.type === 'word') assert.equal(tokens.mapSpeechBoundaryToToken(result, token.end - 1)?.id, token.id);
  }
  for (const invalid of [-1, 0.5, NaN, Infinity, 999]) assert.equal(tokens.mapSpeechBoundaryToToken(result, invalid), null);
});

test('source validator retains offsets and enforces 100–400 words and 3000 UTF-16 characters', () => {
  const words = (count) => Array.from({ length: count }, () => 'word').join(' ');
  for (const [count, valid] of [[99, false], [100, true], [400, true], [401, false]]) assert.equal(contract.contextSourceSchema.safeParse(words(count)).success, valid);
  const boundary = 'x'.repeat(2505) + ' ' + words(99);
  assert.equal(boundary.length, 3000);
  assert.equal(contract.contextSourceSchema.safeParse(boundary).success, true);
  assert.equal(contract.contextSourceSchema.safeParse(boundary + 'x').success, false);
  assert.equal(contract.contextSourceSchema.parse('  ' + sourceText), '  ' + sourceText);
  assert.equal(contract.countWords(' \n\t '), 0);
  assert.equal(contract.countWords('first\nsecond\t third'), 3);
});

test('Italian native + French profile target never defaults or leaks French into English reading', () => {
  assert.deepEqual(contract.getContextLanguageDefaults({ nativeLanguage: 'it-IT', targetLanguage: 'fr' }), { nativeLanguage: 'it', sourceLanguage: null });
  assert.deepEqual(contract.getContextLanguageDefaults({ nativeLanguage: null, targetLanguage: 'fr' }), { nativeLanguage: null, sourceLanguage: null });
  assert.equal(contract.normalizeContextLanguage('Italian'), 'it');
  assert.equal(contract.contextSessionSchema.safeParse({ ...session, sourceLanguage: '' }).success, false);
  const word = select('colleague');
  const request = ai.prepareContextExplanation({ ...session, start: word.start, end: word.end });
  assert.match(request.prompt, /example: one NEW sentence in English/);
  assert.match(request.prompt, /prose exclusively in Italian/);
  assert.doesNotMatch(request.prompt, /French/);
});

test('four bank occurrences retain context and contextual cache identity but share lexical identity', () => {
  assert.equal(tokens.currentTextExamples(pairs, 'bank').length, 4);
  assert.equal(tokens.currentTextExamples(pairs, 'ban').length, 0);
  const keys = banks.map((word) => dictionary.readerExplanationKey(session, word, pairs.find((pair) => pair.id === word.sentenceId)));
  assert.equal(new Set(keys).size, 4);
  assert.equal(new Set(banks.map((word) => dictionary.readerDictionaryKey(session, word))).size, 1);
  assert.notEqual(dictionary.readerDictionaryKey(session, banks[0]), dictionary.readerDictionaryKey({ ...session, nativeLanguage: 'fr' }, banks[0]));
  const word = banks[1];
  const request = ai.prepareContextExplanation({ ...session, start: word.start, end: word.end, translatedContext: 'Si sedettero sulla riva del fiume.' });
  const data = JSON.parse(request.history[0].parts[0].text);
  assert.match(data.context, /river/);
  assert.equal(data.selectedText, 'bank');
  assert.equal(data.context.slice(data.startInContext, data.startInContext + 4), 'bank');
  assert.match(data.translatedContext, /riva/);
  const sameSentence = tokens.buildSentencePairs({ ...session, sourceText: 'To read, to learn.' }, null)[0];
  const repeated = sameSentence.sourceTokens.filter((token) => token.normalized === 'to').map((token) => tokens.selectReaderToken(sameSentence, token));
  assert.notEqual(...repeated.map((word) => dictionary.readerExplanationKey(session, word, sameSentence)));
});

test('selection validator rejects forged, empty, oversized and unknown ranges/fields', () => {
  for (const range of [{ start: -1, end: 4 }, { start: 9, end: 2 }, { start: 0, end: 161 }, { start: 0, end: 9000 }, { start: 2, end: 3 }]) assert.equal(contract.contextSelectionSchema.safeParse({ ...session, ...range }).success, false);
  const range = { start: banks[0].start, end: banks[0].end };
  assert.equal(contract.contextSelectionSchema.safeParse({ ...session, ...range, selectedPhrase: 'fake' }).success, false);
  assert.equal(contract.contextSelectionSchema.safeParse({ ...session, ...range, translatedContext: 'x'.repeat(6001) }).success, false);
});

test('sentence pairs align by ID, preserve paragraphs/absolute offsets and reject incomplete translation sets', () => {
  const result = { sourceLanguage: 'en', nativeLanguage: 'it', units: units.map((unit) => ({ id: unit.id, translation: 'Traduzione ' + unit.id })).reverse() };
  const translated = ai.parseContextTranslation(JSON.stringify(result), session, units);
  const aligned = tokens.buildSentencePairs(session, translated);
  for (const pair of aligned) {
    assert.equal(pair.translatedText, 'Traduzione ' + pair.id);
    assert.equal(sourceText.slice(pair.start, pair.end), pair.text);
    assert.equal(pair.translatedTokens.map((token) => token.text).join(''), pair.translatedText);
    assert.ok(pair.sourceTokens.every((source) => pair.translatedTokens.every((target) => source.id !== target.id)));
  }
  for (const invalid of [result.units.slice(1), [...result.units, result.units[0]], [...result.units.slice(1), { id: 'invented', translation: 'x' }]]) assert.throws(() => ai.parseContextTranslation(JSON.stringify({ ...result, units: invalid }), session, units));
  assert.equal(new Set(aligned.map((pair) => pair.paragraph)).size, 3);
});

test('dictionary previews are local, language-scoped and honestly absent when unknown', () => {
  assert.deepEqual(dictionary.dictionaryTranslations(dictionary.localReaderDictionary('To,', 'en', 'it')), ['a', 'verso', 'per', 'di']);
  assert.equal(dictionary.localReaderDictionary('unknownword', 'en', 'it'), null);
  assert.equal(dictionary.localReaderDictionary('colleague', 'fr', 'it'), null);
  assert.equal(dictionary.localReaderDictionary('colleague', 'en', 'en'), null);
  assert.deepEqual(dictionary.dictionaryTranslations(null), []);
});

test('standard provider grammar tags are localized without rewriting free-form quotations', () => {
  assert.equal(dictionary.localizeReaderGrammar('noun, countable, singular', 'it'), 'sostantivo, numerabile, singolare');
  assert.equal(dictionary.localizeReaderGrammar('noun', 'fr'), 'nom');
  assert.equal(dictionary.localizeReaderGrammar('verb', 'uk'), 'дієслово');
  assert.equal(dictionary.localizeReaderGrammar('noun, singular', 'en'), 'noun, singular');
  assert.equal(dictionary.localizeReaderGrammar('Qui “bank” è preceduto da “the”.', 'it'), 'Qui “bank” è preceduto da “the”.');
});

test('AI contracts separate lexical/contextual data and reject wrong languages/extra fields', () => {
  const response = { sourceLanguage: 'en', nativeLanguage: 'it', translation: 'collega', partOfSpeech: 'sostantivo', meaning: 'Persona con cui lavori.', grammar: null, example: 'My colleague is helpful.', exampleTranslation: 'Il mio collega è disponibile.' };
  assert.equal(ai.parseContextExplanation(JSON.stringify(response), session).example, response.example);
  assert.throws(() => ai.parseContextExplanation(JSON.stringify({ ...response, sourceLanguage: 'fr' }), session));
  assert.throws(() => ai.parseContextExplanation(JSON.stringify({ ...response, meaning: '' }), session));
  const entry = { sourceLanguage: 'en', nativeLanguage: 'it', senses: [{ partOfSpeech: 'nome', translations: ['banca', 'riva'], definition: null }] };
  assert.deepEqual(ai.parseContextDictionary(JSON.stringify(entry), session), entry);
  for (const invalid of [{ ...entry, nativeLanguage: 'fr' }, { ...entry, senses: [] }, { ...entry, html: '<script>' }]) assert.throws(() => ai.parseContextDictionary(JSON.stringify(invalid), session));
  const request = ai.prepareContextDictionary({ sourceLanguage: 'en', nativeLanguage: 'it', word: 'bank' });
  assert.match(request.prompt, /separately from any contextual interpretation/);
  assert.match(request.prompt, /prose is in Italian/);
  assert.deepEqual(JSON.parse(request.history[0].parts[0].text), { word: 'bank' });
  assert.equal(ai.contextDictionaryRequestSchema.safeParse({ ...session, word: 'bank' }).success, false);
});

test('saved vocabulary deduplicates normalized words and caps at three without mutation', () => {
  const first = [banks[0]];
  assert.strictEqual(tokens.addReaderFocus(first, banks[1]), first);
  const second = tokens.addReaderFocus(first, select('colleague'));
  const third = tokens.addReaderFocus(second, select('river'));
  assert.equal(first.length, 1);
  assert.equal(third.length, 3);
  assert.strictEqual(tokens.addReaderFocus(third, select('the')), third);
});

test('all four reader locales expose the same keys without obsolete interaction strings', () => {
  const locales = ['en', 'it', 'fr', 'uk'].map((language) => JSON.parse(readFileSync(`public/locales/${language}/translation.json`, 'utf8')).context_studio);
  for (const section of ['reader', 'immersive', 'tokens']) {
    const expected = Object.keys(locales[0][section]).sort();
    for (const locale of locales) assert.deepEqual(Object.keys(locale[section]).sort(), expected);
  }
  for (const locale of locales) {
    assert.equal(locale.reader.pronunciation_audio_is_not_available_yet, undefined);
    assert.equal(locale.immersive.select_help, undefined);
  }
});

// Exercise the shipped transport with isolated configuration and a mocked HTTP boundary.
registerHooks({ resolve(specifier, context, next) {
  if (specifier === '@/lib/server/ai-config') return { shortCircuit: true, url: 'data:text/javascript,export function getGeminiConnectionConfig(){return {apiKey:"test-only",baseUrl:"https://reader.invalid",structuredModelId:"test",chatModelId:"test"}}' };
  // The unused re-export imports Next request context; it is outside the transport test.
  if (specifier === '@/lib/server/ai-errors') return { shortCircuit: true, url: 'data:text/javascript,export function getHumanReadableAiError(){throw new Error("Outside transport test scope")}' };
  return next(specifier, context);
} });
const transport = await import('../src/lib/server/ai-client.ts');
const history = [{ role: 'user', parts: [{ text: 'Synthetic reader input' }] }];
const options = { jsonSchema: {}, schemaName: 'reader_test', maxTokens: 100 };

test('reader transport omits account identifiers while preserving legacy callers', async (t) => {
  const bodies = [];
  t.mock.method(globalThis, 'fetch', async (_url, init) => {
    bodies.push(JSON.parse(init.body));
    return Response.json({ choices: [{ message: { content: '{}' } }] });
  });
  await transport.sendStructuredRequestToGemini('Translate the supplied text.', history, options);
  await transport.sendStructuredRequestToGemini('Translate the supplied text.', history, { ...options, userId: 'synthetic-legacy-user' });
  assert.equal(Object.hasOwn(bodies[0], 'user'), false);
  assert.equal(bodies[1].user, 'synthetic-legacy-user');
  assert.equal(bodies[0].max_tokens, 100);
});

test('provider failures discard raw bodies instead of logging or throwing their content', async (t) => {
  const errors = t.mock.method(console, 'error', () => {});
  t.mock.method(globalThis, 'fetch', async () => new Response('private echoed learner material', { status: 429 }));
  await assert.rejects(transport.sendStructuredRequestToGemini('Translate the supplied text.', history, options), { message: 'Gemini API request failed (429).' });
  assert.equal(errors.mock.callCount(), 0);
});
