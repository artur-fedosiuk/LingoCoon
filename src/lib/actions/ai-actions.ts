// Created: 2024-01-01
// Description: Server Actions that communicate with the NVIDIA NIM AI API.

// "use server" tells Next.js: this whole file runs on the SERVER only.
// The browser never sees this code, which keeps our API key secret.
'use server';

import OpenAI from 'openai';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import type { GeneratedDeck } from '@/types/ai-deck';

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
  history: ConversationTurn[],
  options: { maxTokens?: number; userId?: string } = {},
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

  // Step 3: Call the OpenAI-compatible API.
  // The `user` field is forwarded to NVIDIA NIM and enables per-user rate limiting.
  // This prevents a single abusive user from exhausting the API quota for everyone
  // ("Denial of Wallet" attack). The value is always the server-verified user ID,
  // never a value from the client, so it cannot be spoofed.
  const response = await client.chat.completions.create({
    model: 'meta/llama-3.3-70b-instruct',
    messages: messages,
    temperature: 0.2,
    top_p: 0.7,
    // Default 400 tokens — enough for 3-4 sentences (chat, study session).
    // Deck generation overrides this to 1200 via options.maxTokens.
    // Llama 3.3 70B generates ~35 tok/s on NVIDIA NIM free tier:
    //   400 tokens ≈ 11s  (was 1024 = ~29s — a 60% latency reduction).
    max_tokens: options.maxTokens ?? 400,
    // Pass the authenticated user ID for provider-side rate limiting.
    // Undefined if called from an unauthenticated context (deck generation).
    ...(options.userId ? { user: options.userId } : {}),
    stream: false,
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
    // Read the authenticated user so we can pass their ID for rate limiting.
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Wrap the single message into the ConversationTurn format expected by callAI.
    const singleTurnHistory: ConversationTurn[] = [
      { role: 'user', parts: [{ text: userMessage }] },
    ];

    return await callAI(systemPrompt, singleTurnHistory, { userId: user?.id });
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
    // Read the authenticated user so we can pass their ID for rate limiting.
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    return await callAI(systemPrompt, history, { userId: user?.id });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[askAIWithHistory Error]:', message);
    throw new Error(message);
  }
}

// ─── DECK GENERATION ──────────────────────────────────────────────────────────

/**
 * Zod schema that validates the AI's JSON response for deck generation.
 *
 * This is the contract between our code and the AI model.
 * If the AI returns a malformed response, safeParse() fails and we reject it
 * BEFORE touching the database — preventing garbage data from being persisted.
 *
 * Why Zod over manual checks?
 * Zod gives us exhaustive structural validation + TypeScript inference in one call.
 * A manual approach would need 10+ if-statements and still miss edge cases.
 */
const aiCardSchema = z.object({
  front: z.string().min(1).max(500).trim(),
  back: z.string().min(1).max(500).trim(),
  // AI may omit example_sentence or send null — normalise both to null.
  example_sentence: z
    .string()
    .max(1000)
    .trim()
    .nullable()
    .optional()
    .transform((v) => v ?? null),
});

const aiDeckSchema = z.object({
  title: z.string().min(1).max(100).trim(),
  language_from: z.string().min(2).max(5).trim().toLowerCase(),
  language_to: z.string().min(2).max(5).trim().toLowerCase(),
  cards: z.array(aiCardSchema).min(1).max(50),
});

/**
 * System prompt for the deck generation action.
 *
 * Key design choices:
 * - Demands JSON-only output with no markdown fences (some models add them anyway;
 *   we strip them defensively in the action).
 * - Specifies the exact schema so the model has no ambiguity.
 * - Caps card count at 40 to prevent runaway token usage.
 * - Requires example_sentence for ≥70% of cards — context improves retention.
 */
const DECK_GENERATION_SYSTEM_PROMPT = `You are a language learning assistant for LingoCoon, a flashcard app.

MANDATORY: Respond with ONLY a single valid JSON object. No markdown. No code fences. No text before or after.

Required schema:
{
  "title": "Descriptive deck title, max 60 chars. Include topic + language + level if inferable.",
  "language_from": "ISO 639-1 code for card fronts (e.g. 'en', 'it', 'fr', 'uk', 'de', 'es')",
  "language_to": "ISO 639-1 code for card backs",
  "cards": [
    {
      "front": "Word or phrase in language_from",
      "back": "Translation or definition in language_to",
      "example_sentence": "Natural sentence in language_from showing the word in context, or null"
    }
  ]
}

Rules:
1. Generate the number of cards the user requests, or 15 if unspecified. Hard cap: 40.
2. Cards must be practical, high-frequency vocabulary. No duplicates.
3. Add example_sentence for at least 70% of cards. Context significantly improves retention.
4. Infer language_from and language_to from the user's request. Use ISO 639-1 codes only.
5. Title examples: "Cucina italiana \u2014 A2", "Business English \u2014 Meetings".
6. Return ONLY the JSON object. Nothing else.`;

/**
 * generateDeckWithAI — Server Action that calls the AI to create a flashcard deck.
 *
 * Flow:
 *   1. Validate the user's prompt (server-side — never trust the client).
 *   2. Call the AI with a structured JSON output instruction.
 *   3. Strip accidental markdown fences from the response.
 *   4. Parse and validate with Zod.
 *   5. Assign a localId to each card (UUID for React keying only).
 *   6. Return a GeneratedDeck ready for the review UI.
 *
 * Returns { deck } on success or { error } on failure — never throws.
 * The caller (AiDeckGenerator component) handles all error display.
 */
export async function generateDeckWithAI(
  userPrompt: string,
): Promise<{ deck?: GeneratedDeck; error?: string }> {
  const cleanPrompt = userPrompt.trim();
  if (!cleanPrompt) return { error: 'Prompt cannot be empty.' };
  if (cleanPrompt.length > 1000) return { error: 'Prompt too long (max 1000 characters).' };

  try {
    const history: ConversationTurn[] = [
      { role: 'user', parts: [{ text: cleanPrompt }] },
    ];

    const rawResponse = await callAI(DECK_GENERATION_SYSTEM_PROMPT, history, { maxTokens: 1200 });

    // Strip accidental markdown fences that some models add despite instructions.
    // e.g. ```json { ... } ``` → { ... }
    const clean = rawResponse
      .replace(/^```(?:json)?\s*/i, '')
      .replace(/```\s*$/i, '')
      .trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(clean);
    } catch {
      console.error('[generateDeckWithAI] Model returned non-JSON:', rawResponse.slice(0, 300));
      return { error: 'The AI returned an unreadable response. Please try again.' };
    }

    // Validate the shape — if the AI ignores the schema, we reject it here.
    // This prevents type-unsafe data from reaching the UI or the database.
    const result = aiDeckSchema.safeParse(parsed);
    if (!result.success) {
      console.error('[generateDeckWithAI] Zod validation failed:', result.error.format());
      return { error: 'The AI response had an unexpected format. Please try again.' };
    }

    // Assign client-side UUIDs for React keying.
    // crypto.randomUUID() is available globally in Node.js 18+ (Web Crypto API).
    const deck: GeneratedDeck = {
      title: result.data.title,
      language_from: result.data.language_from,
      language_to: result.data.language_to,
      cards: result.data.cards.map((card) => ({
        localId: crypto.randomUUID(),
        front: card.front,
        back: card.back,
        example_sentence: card.example_sentence,
      })),
    };

    return { deck };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[generateDeckWithAI Error]:', message);
    return { error: 'Generation failed. Check your connection and try again.' };
  }
}