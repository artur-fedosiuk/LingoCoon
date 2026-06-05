import OpenAI from 'openai';
import { getGroqAiConfig } from '@/lib/server/ai-config';
import { buildOpenAiMessages } from '@/lib/server/ai-messages';
import {
  validateConversation,
  validateMaxTokens,
} from '@/lib/server/ai-validation';
import type { ConversationTurn } from '@/types/ai';

export { getFriendlyAiError } from '@/lib/server/ai-errors';

const MAX_REQUEST_HISTORY_TURNS = 24;
const SLOW_REQUEST_THRESHOLD_MS = 3000;
const cachedClients = new Map<string, OpenAI>();

export async function callFastAi(
  systemPrompt: string,
  history: ConversationTurn[],
  options: { maxTokens?: number; userId: string },
): Promise<string> {
  validateConversation(systemPrompt, history);
  const maxTokens = validateMaxTokens(options.maxTokens ?? 400);
  const config = getGroqAiConfig();

  return callOpenAiCompatible(config, systemPrompt, history, {
    maxTokens,
    modelId: config.chatModelId,
    provider: 'Groq',
    userId: options.userId,
  });
}

export async function callStructuredAi(
  systemPrompt: string,
  history: ConversationTurn[],
  options: { jsonSchema: object; maxTokens: number; schemaName: string; userId: string },
): Promise<string> {
  validateConversation(systemPrompt, history);
  const maxTokens = validateMaxTokens(options.maxTokens);
  const config = getGroqAiConfig();
  const requestHistory = history.slice(-MAX_REQUEST_HISTORY_TURNS);
  const model = config.structuredModelId;
  const startedAt = Date.now();
  const response = await fetch(`${config.baseURL}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      messages: buildOpenAiMessages(systemPrompt, requestHistory),
      temperature: 0.1,
      max_tokens: maxTokens,
      reasoning_effort: 'low',
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: options.schemaName,
          strict: true,
          schema: options.jsonSchema,
        },
      },
      stream: false,
      user: options.userId,
    }),
    signal: AbortSignal.timeout(12_000),
  });
  logSlowRequest('Groq', model, requestHistory.length, startedAt);

  if (!response.ok) {
    throw new Error(`Groq AI request failed: ${response.status}`);
  }

  const result = await response.json() as {
    choices?: Array<{ message?: { content?: unknown } }>;
  };
  const output = result.choices?.[0]?.message?.content;
  if (typeof output !== 'string' || !output) {
    throw new Error('AI returned an empty response.');
  }

  return output;
}

async function callOpenAiCompatible(
  config: { apiKey: string; baseURL: string },
  systemPrompt: string,
  history: ConversationTurn[],
  options: { maxTokens: number; modelId: string; provider: string; userId: string },
): Promise<string> {
  const client = getAiClient(config, options.provider);
  const requestHistory = history.slice(-MAX_REQUEST_HISTORY_TURNS);
  const startedAt = Date.now();
  const response = await client.chat.completions.create({
    model: options.modelId,
    messages: buildOpenAiMessages(systemPrompt, requestHistory),
    temperature: 0.2,
    top_p: 0.7,
    max_tokens: options.maxTokens,
    user: options.userId,
    stream: false,
  });
  logSlowRequest(options.provider, options.modelId, requestHistory.length, startedAt);

  const output = response.choices[0]?.message?.content;
  if (!output) throw new Error('AI returned an empty response.');

  return output;
}

function getAiClient(config: { apiKey: string; baseURL: string }, provider: string): OpenAI {
  const cacheKey = `${provider}:${config.baseURL}`;
  let client = cachedClients.get(cacheKey);
  if (!client) {
    client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseURL,
      maxRetries: 0,
      timeout: 12_000,
    });
    cachedClients.set(cacheKey, client);
  }

  return client;
}

function logSlowRequest(
  provider: string,
  model: string,
  historyTurns: number,
  startedAt: number,
) {
  const durationMs = Date.now() - startedAt;
  if (durationMs < SLOW_REQUEST_THRESHOLD_MS) return;

  console.warn('[callAi] Slow response', { durationMs, historyTurns, model, provider });
}
