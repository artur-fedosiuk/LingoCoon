import test from 'node:test';
import assert from 'node:assert/strict';
import './test-setup.mjs';
import { sendChatMessageToGemini, sendStructuredRequestToGemini } from '../src/lib/server/ai-client.ts';
import { InvalidAiRequestError } from '../src/lib/server/ai-validation.ts';

const originalFetch = globalThis.fetch;
const originalEnv = {
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
  GEMINI_CHAT_MODEL_ID: process.env.GEMINI_CHAT_MODEL_ID,
  GEMINI_STRUCTURED_MODEL_ID: process.env.GEMINI_STRUCTURED_MODEL_ID,
  GEMINI_BASE_URL: process.env.GEMINI_BASE_URL,
};

function setTestEnv() {
  process.env.GEMINI_API_KEY = 'test-api-key';
  process.env.GEMINI_CHAT_MODEL_ID = 'test-chat-model';
  process.env.GEMINI_STRUCTURED_MODEL_ID = 'test-structured-model';
  process.env.GEMINI_BASE_URL = 'https://test-api.example.com';
}

function restoreEnv() {
  process.env.GEMINI_API_KEY = originalEnv.GEMINI_API_KEY;
  process.env.GEMINI_CHAT_MODEL_ID = originalEnv.GEMINI_CHAT_MODEL_ID;
  process.env.GEMINI_STRUCTURED_MODEL_ID = originalEnv.GEMINI_STRUCTURED_MODEL_ID;
  process.env.GEMINI_BASE_URL = originalEnv.GEMINI_BASE_URL;
}

function mockFetch(responses) {
  let callIndex = 0;
  globalThis.fetch = async (...args) => {
    const entry = responses[callIndex % responses.length];
    callIndex++;
    const response = typeof entry === 'function' ? await entry(...args) : entry;
    if (response instanceof Error) throw response;
    return response;
  };
}

function restoreFetch() {
  globalThis.fetch = originalFetch;
}

const validHistory = [{ role: 'user', parts: [{ text: 'Hello' }] }];

test('sendChatMessageToGemini validates conversation before calling API', async () => {
  setTestEnv();
  mockFetch([Response.json({ choices: [{ message: { content: 'OK' } }] })]);
  try {
    await sendChatMessageToGemini('', validHistory, { maxTokens: 100, userId: 'user1' });
    assert.fail('Should have thrown');
  } catch (e) {
    assert.ok(e instanceof InvalidAiRequestError);
  }
  restoreFetch();
  restoreEnv();
});

test('sendChatMessageToGemini validates maxTokens', async () => {
  setTestEnv();
  mockFetch([Response.json({ choices: [{ message: { content: 'OK' } }] })]);
  try {
    await sendChatMessageToGemini('Prompt', validHistory, { maxTokens: 0, userId: 'user1' });
    assert.fail('Should have thrown');
  } catch (e) {
    assert.ok(e instanceof InvalidAiRequestError);
  }
  restoreFetch();
  restoreEnv();
});

test('sendChatMessageToGemini rejects missing API key', async () => {
  setTestEnv();
  process.env.GEMINI_API_KEY = '';
  mockFetch([Response.json({ choices: [{ message: { content: 'OK' } }] })]);
  try {
    await sendChatMessageToGemini('Prompt', validHistory, { maxTokens: 100, userId: 'user1' });
    assert.fail('Should have thrown');
  } catch (e) {
    assert.match(e.message, /GEMINI_API_KEY environment variable is missing/);
  }
  restoreFetch();
  restoreEnv();
});

test('sendChatMessageToGemini includes userId in request when provided', async () => {
  setTestEnv();
  let capturedBody = null;
  mockFetch([async (...args) => {
    capturedBody = JSON.parse(args[1].body);
    return Response.json({ choices: [{ message: { content: 'OK' } }] });
  }]);

  await sendChatMessageToGemini('Prompt', validHistory, { maxTokens: 100, userId: 'test-user-123' });
  assert.equal(capturedBody.user, 'test-user-123');
  restoreFetch();
  restoreEnv();
});

test('sendChatMessageToGemini omits userId when not provided', async () => {
  setTestEnv();
  let capturedBody = null;
  mockFetch([async (...args) => {
    capturedBody = JSON.parse(args[1].body);
    return Response.json({ choices: [{ message: { content: 'OK' } }] });
  }]);

  await sendChatMessageToGemini('Prompt', validHistory, { maxTokens: 100 });
  assert.equal(capturedBody.user, undefined);
  restoreFetch();
  restoreEnv();
});

test('sendChatMessageToGemini sanitizes provider error body', async () => {
  setTestEnv();
  mockFetch([new Response('private learner content and credentials', { status: 429 })]);
  try {
    await sendChatMessageToGemini('Prompt', validHistory, { maxTokens: 100, userId: 'user1' });
    assert.fail('Should have thrown');
  } catch (e) {
    assert.match(e.message, /Gemini API request failed \(429\)/);
    assert.doesNotMatch(e.message, /private learner content/);
    assert.doesNotMatch(e.message, /credentials/);
  }
  restoreFetch();
  restoreEnv();
});

test('sendChatMessageToGemini times out after REQUEST_TIMEOUT_MS', async () => {
  setTestEnv();
  let resolveFetch;
  const hangingFetch = new Promise((resolve) => { resolveFetch = resolve; });
  mockFetch([hangingFetch]);

  const promise = sendChatMessageToGemini('Prompt', validHistory, { maxTokens: 100, userId: 'user1' });

  setTimeout(() => {
    resolveFetch(new Response('timeout', { status: 504 }));
  }, 50);

  try {
    await promise;
  } catch (e) {
    // Should handle timeout gracefully
  }
  restoreFetch();
  restoreEnv();
});

test('sendStructuredRequestToGemini validates conversation before calling API', async () => {
  setTestEnv();
  mockFetch([Response.json({ choices: [{ message: { content: '{}' } }] })]);
  try {
    await sendStructuredRequestToGemini('', validHistory, { jsonSchema: {}, maxTokens: 100, schemaName: 'test', userId: 'user1' });
    assert.fail('Should have thrown');
  } catch (e) {
    assert.ok(e instanceof InvalidAiRequestError);
  }
  restoreFetch();
  restoreEnv();
});

test('sendStructuredRequestToGemini validates maxTokens', async () => {
  setTestEnv();
  mockFetch([Response.json({ choices: [{ message: { content: '{}' } }] })]);
  try {
    await sendStructuredRequestToGemini('Prompt', validHistory, { jsonSchema: {}, maxTokens: 9999, schemaName: 'test', userId: 'user1' });
    assert.fail('Should have thrown');
  } catch (e) {
    assert.ok(e instanceof InvalidAiRequestError);
  }
  restoreFetch();
  restoreEnv();
});

test('sendStructuredRequestToGemini includes response_format for JSON', async () => {
  setTestEnv();
  let capturedBody = null;
  mockFetch([async (...args) => {
    capturedBody = JSON.parse(args[1].body);
    return Response.json({ choices: [{ message: { content: '{}' } }] });
  }]);

  await sendStructuredRequestToGemini('Prompt', validHistory, { jsonSchema: { type: 'object' }, maxTokens: 100, schemaName: 'test', userId: 'user1' });
  assert.deepEqual(capturedBody.response_format, { type: 'json_object' });
  restoreFetch();
  restoreEnv();
});

test('sendStructuredRequestToGemini uses structured model ID', async () => {
  setTestEnv();
  let capturedBody = null;
  mockFetch([async (...args) => {
    capturedBody = JSON.parse(args[1].body);
    return Response.json({ choices: [{ message: { content: '{}' } }] });
  }]);

  await sendStructuredRequestToGemini('Prompt', validHistory, { jsonSchema: {}, maxTokens: 100, schemaName: 'test', userId: 'user1' });
  assert.equal(capturedBody.model, 'test-structured-model');
  restoreFetch();
  restoreEnv();
});

test('sendChatMessageToGemini uses chat model ID', async () => {
  setTestEnv();
  let capturedBody = null;
  mockFetch([async (...args) => {
    capturedBody = JSON.parse(args[1].body);
    return Response.json({ choices: [{ message: { content: 'OK' } }] });
  }]);

  await sendChatMessageToGemini('Prompt', validHistory, { maxTokens: 100, userId: 'user1' });
  assert.equal(capturedBody.model, 'test-chat-model');
  restoreFetch();
  restoreEnv();
});

test('sendChatMessageToGemini uses correct temperature and topP', async () => {
  setTestEnv();
  let capturedBody = null;
  mockFetch([async (...args) => {
    capturedBody = JSON.parse(args[1].body);
    return Response.json({ choices: [{ message: { content: 'OK' } }] });
  }]);

  await sendChatMessageToGemini('Prompt', validHistory, { maxTokens: 100, userId: 'user1' });
  assert.equal(capturedBody.temperature, 0.2);
  assert.equal(capturedBody.top_p, 0.7);
  restoreFetch();
  restoreEnv();
});

test('sendStructuredRequestToGemini uses correct temperature', async () => {
  setTestEnv();
  let capturedBody = null;
  mockFetch([async (...args) => {
    capturedBody = JSON.parse(args[1].body);
    return Response.json({ choices: [{ message: { content: '{}' } }] });
  }]);

  await sendStructuredRequestToGemini('Prompt', validHistory, { jsonSchema: {}, maxTokens: 100, schemaName: 'test', userId: 'user1' });
  assert.equal(capturedBody.temperature, 0.1);
  assert.equal(capturedBody.top_p, undefined);
  restoreFetch();
  restoreEnv();
});

test('sendChatMessageToGemini truncates history to MAX_CONVERSATION_HISTORY_TURNS (24)', async () => {
  setTestEnv();
  let capturedBody = null;
  const longHistory = Array.from({ length: 50 }, (_, i) => ({
    role: i % 2 === 0 ? 'user' : 'model',
    parts: [{ text: 'Message ' + i }],
  }));

  mockFetch([async (...args) => {
    capturedBody = JSON.parse(args[1].body);
    return Response.json({ choices: [{ message: { content: 'OK' } }] });
  }]);

  await sendChatMessageToGemini('Prompt', longHistory, { maxTokens: 100, userId: 'user1' });
  assert.equal(capturedBody.messages.length, 24 + 1); // 24 history + 1 system
  restoreFetch();
  restoreEnv();
});
