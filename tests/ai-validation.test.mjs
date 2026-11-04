import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validateMaxTokens,
  validateConversation,
  InvalidAiRequestError,
  MAX_OUTPUT_TOKENS,
} from '../src/lib/server/ai-validation.ts';

test('validateMaxTokens accepts valid integer within bounds', () => {
  assert.equal(validateMaxTokens(1), 1);
  assert.equal(validateMaxTokens(100), 100);
  assert.equal(validateMaxTokens(MAX_OUTPUT_TOKENS), MAX_OUTPUT_TOKENS);
});

test('validateMaxTokens rejects non-integer values', () => {
  for (const value of [0, -1, 1.5, MAX_OUTPUT_TOKENS + 1, 9999, NaN, Infinity, -Infinity]) {
    assert.throws(() => validateMaxTokens(value), InvalidAiRequestError);
  }
});

test('validateMaxTokens rejects non-numeric values', () => {
  for (const value of ['100', null, undefined, {}, []]) {
    assert.throws(() => validateMaxTokens(value), InvalidAiRequestError);
  }
});

test('validateConversation accepts valid system prompt and history', () => {
  const history = [{ role: 'user', parts: [{ text: 'Hello' }] }];
  assert.doesNotThrow(() => validateConversation('You are a helpful assistant.', history));
});

test('validateConversation rejects empty or missing system prompt', () => {
  const history = [{ role: 'user', parts: [{ text: 'Hello' }] }];
  for (const prompt of ['', '   ', null, undefined, 123, {}]) {
    assert.throws(() => validateConversation(prompt, history), InvalidAiRequestError);
  }
});

test('validateConversation rejects system prompt exceeding MAX_SYSTEM_PROMPT_LENGTH', () => {
  const history = [{ role: 'user', parts: [{ text: 'Hello' }] }];
  const longPrompt = 'x'.repeat(20001);
  assert.throws(() => validateConversation(longPrompt, history), InvalidAiRequestError);
});

test('validateConversation rejects empty history array', () => {
  assert.throws(() => validateConversation('Prompt', []), InvalidAiRequestError);
});

test('validateConversation rejects history exceeding MAX_HISTORY_TURNS', () => {
  const history = Array.from({ length: 121 }, (_, i) => ({
    role: i % 2 === 0 ? 'user' : 'model',
    parts: [{ text: 'Message ' + i }],
  }));
  assert.throws(() => validateConversation('Prompt', history), InvalidAiRequestError);
});

test('validateConversation rejects history with invalid turn structure', () => {
  const badTurns = [
    [{ role: 'invalid', parts: [{ text: 'Hi' }] }],
    [{ role: 'user', parts: [] }],
    [{ role: 'user', parts: [{}] }],
    [{ role: 'user', parts: [{ text: 123 }] }],
    [{ role: 'user', parts: 'not an array' }],
    [null],
    [{ role: 'user', parts: [{ text: 'x'.repeat(10001) }] }],
  ];
  for (const history of badTurns) {
    assert.throws(() => validateConversation('Prompt', history), InvalidAiRequestError);
  }
});

test('validateConversation rejects history with total text exceeding MAX_HISTORY_TEXT_LENGTH', () => {
  const history = [{ role: 'user', parts: [{ text: 'x'.repeat(100001) }] }];
  assert.throws(() => validateConversation('Prompt', history), InvalidAiRequestError);
});

test('validateConversation accepts history at exact MAX_HISTORY_TEXT_LENGTH boundary', () => {
  // Split across 10 parts of 10000 each (MAX_TURN_PART_LENGTH) to stay within per-part limit
  const parts = Array.from({ length: 10 }, () => ({ text: 'x'.repeat(10000) }));
  const history = [{ role: 'user', parts }];
  assert.doesNotThrow(() => validateConversation('Prompt', history));
});

test('validateConversation rejects turn part exceeding MAX_TURN_PART_LENGTH', () => {
  const history = [{ role: 'user', parts: [{ text: 'x'.repeat(10001) }] }];
  assert.throws(() => validateConversation('Prompt', history), InvalidAiRequestError);
});

test('validateConversation accepts turn part at exact MAX_TURN_PART_LENGTH boundary', () => {
  const history = [{ role: 'user', parts: [{ text: 'x'.repeat(10000) }] }];
  assert.doesNotThrow(() => validateConversation('Prompt', history));
});

test('InvalidAiRequestError is a proper Error subclass', () => {
  const error = new InvalidAiRequestError('Test message');
  assert.ok(error instanceof Error);
  assert.ok(error instanceof InvalidAiRequestError);
  assert.equal(error.name, 'InvalidAiRequestError');
  assert.equal(error.message, 'Test message');
});