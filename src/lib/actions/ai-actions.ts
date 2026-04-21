// File: src/lib/actions/ai-actions.ts
// Created: 2024-01-01
// Last-Updated: 2025-06-01
// Description: Server Actions that communicate with the NVIDIA NIM AI API.

// "use server" tells Next.js: this whole file runs on the SERVER only.
// The browser never sees this code, which keeps our API key secret.
'use server';

import OpenAI from 'openai';

// ─── TYPES ────────────────────────────────────────────────────────────────────

/**
 * A single turn in a multi-turn conversation.
 * - role: "user" means the student wrote it; "model" means the AI wrote it.
 * - parts: the array of text chunks in that turn.
 */
export interface ConversationTurn {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

// ─── SHARED HELPER ────────────────────────────────────────────────────────────

/**
 * callAI — the single place that talks to the AI endpoint.
 *
 * This helper is PRIVATE (no "export") — only the two public functions below
 * use it.
 *
 * @param systemPrompt  Instructions for the AI (e.g. "you are a language tutor").
 * @param history       The full conversation so far (user + model turns).
 * @returns             The AI's response text.
 * @throws              If the API key is missing, or if the network call fails.
 */
async function callAI(
  systemPrompt: string,
  history: ConversationTurn[]
): Promise<string> {

  // Step 1: Check if the key is missing, stop immediately with a clear error message.
  if (!process.env.NVIDIA_API_KEY) {
    throw new Error('Critical Error: NVIDIA_API_KEY is missing from environment variables.');
  }

  // Instantiate the client here (not at module level) so the OpenAI constructor
  // never runs during Next.js build time — it only runs at request time when the
  // env var is actually available. Instantiating at module level causes a build
  // error on Vercel: "OpenAIError: The OPENAI_API_KEY environment variable is missing".
  const client = new OpenAI({
    apiKey: process.env.NVIDIA_API_KEY,
    baseURL: 'https://integrate.api.nvidia.com/v1',
  });

  // Step 2: Convert conversation turns to OpenAI messages format
  const messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    { role: 'system', content: systemPrompt },
    ...history.map((turn) => ({
      role: turn.role === 'model' ? 'assistant' : 'user',
      content: turn.parts.map((p) => p.text).join('\n'),
    }) as OpenAI.Chat.Completions.ChatCompletionMessageParam),
  ];

  // Step 3: Call the OpenAI-compatible API
  const response = await client.chat.completions.create({
    model: 'meta/llama-3.3-70b-instruct',
    messages: messages,
    temperature: 0.2,
    top_p: 0.7,
    max_tokens: 1024,
    stream: false
  });

  // Step 4: Extract the text from the response
  const outputText = response.choices[0]?.message?.content;

  // Step 5: If there's no text, throw an error.
  if (!outputText) {
    throw new Error('AI returned an empty or unrecognizable response format.');
  }

  // Step 6: Return the clean AI text to the caller.
  return outputText;
}

// ─── PUBLIC ACTIONS ───────────────────────────────────────────────────────────

/**
 * askAI — sends a single, one-shot question to the AI.
 *
 * Use this when you need one answer and don't need to remember the conversation.
 * Internally it wraps the question as a one-turn "history" array and calls callAI().
 *
 * @param systemPrompt  Context/instructions for the AI.
 * @param userMessage   The user's question.
 * @returns             The AI's text response.
 *
 * @example
 *   const answer = await askAI('You are a teacher.', 'What does "bonjour" mean?');
 */
export async function askAI(
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  try {
    // Wrap the single message into the ConversationTurn format expected.
    const singleTurnHistory: ConversationTurn[] = [
      { role: 'user', parts: [{ text: userMessage }] },
    ];

    return await callAI(systemPrompt, singleTurnHistory);
  } catch (error) {
    // Convert any error to a plain string message and re-throw so the component
    // can display it to the user in a friendly way.
    const message = error instanceof Error ? error.message : String(error);
    console.error('[askAI Error]:', message);
    throw new Error(message);
  }
}

/**
 * askAIWithHistory — sends a full multi-turn conversation to the AI.
 *
 * Use this for chat interfaces where the AI needs to remember what was said
 * before. The caller must pass the ENTIRE conversation history, including the
 * latest user message as the last item.
 *
 * @param systemPrompt  Context/instructions for the AI (sent every time).
 * @param history       All previous turns PLUS the newest user message.
 * @returns             The AI's text response for the latest message.
 *
 * @example
 *   const history = [
 *     { role: 'user',  parts: [{ text: 'What is "casa"?' }] },
 *     { role: 'model', parts: [{ text: '"Casa" means house in Italian.' }] },
 *     { role: 'user',  parts: [{ text: 'And "gatto"?' }] },  // ← latest message
 *   ];
 *   const reply = await askAIWithHistory('You are a tutor.', history);
 */
export async function askAIWithHistory(
  systemPrompt: string,
  history: ConversationTurn[]
): Promise<string> {
  try {
    return await callAI(systemPrompt, history);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[askAIWithHistory Error]:', message);
    throw new Error(message);
  }
}
