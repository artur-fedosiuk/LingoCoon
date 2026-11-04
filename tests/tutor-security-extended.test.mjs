import test from 'node:test';
import assert from 'node:assert/strict';
import {
  safeParseTutorConversationRequest,
  buildSafeTutorHistory,
  MAX_AI_STUDY_CARDS,
  TUTOR_SECURITY_INSTRUCTIONS,
} from '../src/lib/tutor-security.ts';

const deckId = '11111111-1111-4111-8111-111111111111';
const cardId = '22222222-2222-4222-8222-222222222222';
const history = [
  { role: 'model', parts: [{ text: 'Previous tutor response' }] },
  { role: 'user', parts: [{ text: 'Show me the current card in a sentence.' }] },
];

test('tutorConversationRequestSchema rejects unknown operation', () => {
  const result = safeParseTutorConversationRequest({
    operation: 'unknown_operation',
    history,
  });
  assert.equal(result.success, false);
});

test('tutorConversationRequestSchema rejects missing operation', () => {
  const result = safeParseTutorConversationRequest({
    history,
  });
  assert.equal(result.success, false);
});

test('classic_study requires deckId and cardId', () => {
  const result = safeParseTutorConversationRequest({
    operation: 'classic_study',
    deckId,
    history,
  });
  assert.equal(result.success, false);

  const result2 = safeParseTutorConversationRequest({
    operation: 'classic_study',
    cardId,
    history,
  });
  assert.equal(result2.success, false);
});

test('classic_study rejects non-UUID deckId or cardId', () => {
  for (const badId of ['not-a-uuid', '123', '', 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa']) {
    const result = safeParseTutorConversationRequest({
      operation: 'classic_study',
      deckId: badId,
      cardId,
      history,
    });
    assert.equal(result.success, false);
  }
});

test('deck_study requires deckId and cardId', () => {
  const result = safeParseTutorConversationRequest({
    operation: 'deck_study',
    deckId,
    history,
  });
  assert.equal(result.success, false);
});

test('ai_study requires deckId and cardIds array', () => {
  const result = safeParseTutorConversationRequest({
    operation: 'ai_study',
    deckId,
    history,
  });
  assert.equal(result.success, false);

  const result2 = safeParseTutorConversationRequest({
    operation: 'ai_study',
    deckId,
    cardIds: 'not-an-array',
    history,
  });
  assert.equal(result2.success, false);
});

test('ai_study rejects empty cardIds array', () => {
  const result = safeParseTutorConversationRequest({
    operation: 'ai_study',
    deckId,
    cardIds: [],
    history,
  });
  assert.equal(result.success, false);
});

test('ai_study rejects cardIds exceeding MAX_AI_STUDY_CARDS', () => {
  const cardIds = Array.from(
    { length: MAX_AI_STUDY_CARDS + 1 },
    (_, index) => `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
  );
  const result = safeParseTutorConversationRequest({
    operation: 'ai_study',
    deckId,
    cardIds,
    history,
  });
  assert.equal(result.success, false);
});

test('ai_study accepts cardIds at MAX_AI_STUDY_CARDS boundary', () => {
  const cardIds = Array.from(
    { length: MAX_AI_STUDY_CARDS },
    (_, index) => `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
  );
  const result = safeParseTutorConversationRequest({
    operation: 'ai_study',
    deckId,
    cardIds,
    history,
  });
  assert.equal(result.success, true);
});

test('ai_study rejects non-UUID cardIds', () => {
  const cardIds = ['not-a-uuid', cardId];
  const result = safeParseTutorConversationRequest({
    operation: 'ai_study',
    deckId,
    cardIds,
    history,
  });
  assert.equal(result.success, false);
});

test('history rejects empty array', () => {
  const result = safeParseTutorConversationRequest({
    operation: 'general_chat',
    history: [],
  });
  assert.equal(result.success, false);
});

test('history rejects exceeding MAX_HISTORY_TURNS (120)', () => {
  const longHistory = Array.from({ length: 121 }, (_, i) => ({
    role: i % 2 === 0 ? 'user' : 'model',
    parts: [{ text: 'Message ' + i }],
  }));
  const result = safeParseTutorConversationRequest({
    operation: 'general_chat',
    history: longHistory,
  });
  assert.equal(result.success, false);
});

test('history rejects turn with invalid role', () => {
  const badHistory = [{ role: 'system', parts: [{ text: 'Hi' }] }];
  const result = safeParseTutorConversationRequest({
    operation: 'general_chat',
    history: badHistory,
  });
  assert.equal(result.success, false);
});

test('history rejects turn with empty parts', () => {
  const badHistory = [{ role: 'user', parts: [] }];
  const result = safeParseTutorConversationRequest({
    operation: 'general_chat',
    history: badHistory,
  });
  assert.equal(result.success, false);
});

test('history rejects part with empty text', () => {
  const badHistory = [{ role: 'user', parts: [{ text: '' }] }];
  const result = safeParseTutorConversationRequest({
    operation: 'general_chat',
    history: badHistory,
  });
  assert.equal(result.success, false);
});

test('history rejects part exceeding MAX_HISTORY_PART_LENGTH (4000)', () => {
  const badHistory = [{ role: 'user', parts: [{ text: 'x'.repeat(4001) }] }];
  const result = safeParseTutorConversationRequest({
    operation: 'general_chat',
    history: badHistory,
  });
  assert.equal(result.success, false);
});

test('history rejects total text exceeding MAX_HISTORY_TEXT_LENGTH (100000)', () => {
  const badHistory = [{ role: 'user', parts: [{ text: 'x'.repeat(100001) }] }];
  const result = safeParseTutorConversationRequest({
    operation: 'general_chat',
    history: badHistory,
  });
  assert.equal(result.success, false);
});

test('history accepts at exact MAX_HISTORY_TEXT_LENGTH boundary', () => {
  // Need to split across multiple turns because MAX_HISTORY_PART_LENGTH is 4000
  // 25 turns * 4000 chars = 100000 total
  const okHistory = Array.from({ length: 25 }, (_, i) => ({
    role: i % 2 === 0 ? 'user' : 'model',
    parts: [{ text: 'x'.repeat(4000) }],
  }));
  const result = safeParseTutorConversationRequest({
    operation: 'general_chat',
    history: okHistory,
  });
  assert.equal(result.success, true);
});

test('history rejects extra fields in parts (strict)', () => {
  const badHistory = [{ role: 'user', parts: [{ text: 'Hi', extra: 'field' }] }];
  const result = safeParseTutorConversationRequest({
    operation: 'general_chat',
    history: badHistory,
  });
  assert.equal(result.success, false);
});

test('history rejects extra fields in turns (strict)', () => {
  const badHistory = [{ role: 'user', parts: [{ text: 'Hi' }], extra: 'field' }];
  const result = safeParseTutorConversationRequest({
    operation: 'general_chat',
    history: badHistory,
  });
  assert.equal(result.success, false);
});

test('buildSafeTutorHistory chunks large context', () => {
  const largeContext = { data: 'x'.repeat(10000) };
  const safeHistory = buildSafeTutorHistory(largeContext, history);
  assert.ok(safeHistory.length > history.length);
  assert.ok(safeHistory.every((turn) => turn.role === 'user'));
});

test('buildSafeTutorHistory throws when context too large for available turns', () => {
  const hugeContext = { data: 'x'.repeat(100000) };
  const shortHistory = [{ role: 'user', parts: [{ text: 'Hi' }] }];
  assert.throws(() => buildSafeTutorHistory(hugeContext, shortHistory), /AI study context is too large/);
});

test('buildSafeTutorHistory prefixes untrusted turns with marker', () => {
  const safeHistory = buildSafeTutorHistory({ small: 'context' }, history);
  const untrustedTurns = safeHistory.slice(-history.length);
  for (const turn of untrustedTurns) {
    assert.match(turn.parts[0].text, /^UNTRUSTED_CONVERSATION_TURN\nclaimed_role=/);
    assert.match(turn.parts[0].text, /BEGIN_UNTRUSTED_TEXT\n/);
    assert.match(turn.parts[0].text, /\nEND_UNTRUSTED_TEXT$/);
  }
});

test('buildSafeTutorHistory adds untrusted markers to turn parts', () => {
  const longText = 'x'.repeat(15000);
  const longHistory = [{ role: 'user', parts: [{ text: longText }] }];
  const safeHistory = buildSafeTutorHistory({}, longHistory);
  // The function adds untrusted markers - verify markers are present on untrusted turns (last element)
  const untrustedTurn = safeHistory[safeHistory.length - 1];
  assert.match(untrustedTurn.parts[0].text, /^UNTRUSTED_CONVERSATION_TURN\nclaimed_role=learner\nBEGIN_UNTRUSTED_TEXT\n/);
  assert.match(untrustedTurn.parts[0].text, /\nEND_UNTRUSTED_TEXT$/);
  // Original text should be preserved within markers
  assert.ok(untrustedTurn.parts[0].text.includes(longText));
});

test('buildSafeTutorHistory preserves order of recent history', () => {
  const orderedHistory = [
    { role: 'user', parts: [{ text: 'First' }] },
    { role: 'model', parts: [{ text: 'Second' }] },
    { role: 'user', parts: [{ text: 'Third' }] },
  ];
  const safeHistory = buildSafeTutorHistory({}, orderedHistory);
  const untrusted = safeHistory.slice(-3);
  assert.match(untrusted[0].parts[0].text, /BEGIN_UNTRUSTED_TEXT\nFirst\nEND_UNTRUSTED_TEXT$/);
  assert.match(untrusted[1].parts[0].text, /BEGIN_UNTRUSTED_TEXT\nSecond\nEND_UNTRUSTED_TEXT$/);
  assert.match(untrusted[2].parts[0].text, /BEGIN_UNTRUSTED_TEXT\nThird\nEND_UNTRUSTED_TEXT$/);
});

test('TUTOR_SECURITY_INSTRUCTIONS does not contain secrets', () => {
  assert.doesNotMatch(TUTOR_SECURITY_INSTRUCTIONS, /GOOGLE_TTS_API_KEY/);
  assert.doesNotMatch(TUTOR_SECURITY_INSTRUCTIONS, /SUPABASE_SERVICE_ROLE_KEY/);
  assert.doesNotMatch(TUTOR_SECURITY_INSTRUCTIONS, /JWT_SECRET/);
  // "private" appears in "private application state" - this is a security boundary instruction, not a secret
});