// File: src/lib/actions/ai-actions.ts
// Created: 2024-01-01
// Last-Updated: 2025-06-01
// Author: Claude
// Description: Server Actions that communicate with the Google Gemini AI API.

// "use server" tells Next.js: this whole file runs on the SERVER only.
// The browser never sees this code, which keeps our API key secret.
'use server';

// ─── TYPES ────────────────────────────────────────────────────────────────────

/**
 * The shape of the JSON response that Gemini sends back.
 * We mark fields as optional (?:) because the API might return errors
 * that don't have a "candidates" field.
 */
interface GeminiResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text: string }>;
    };
  }>;
  error?: {
    message: string;
  };
}

/**
 * A single turn in a multi-turn conversation.
 * - role: "user" means the student wrote it; "model" means the AI wrote it.
 * - parts: the array of text chunks in that turn (Gemini always uses arrays).
 */
export interface ConversationTurn {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

// ─── SHARED HELPER ────────────────────────────────────────────────────────────

/**
 * callGeminiAPI — the single place that talks to Gemini.
 *
 * This helper is PRIVATE (no "export") — only the two public functions below
 * use it. This is the DRY (Don't Repeat Yourself) principle: instead of copy-
 * pasting the same fetch() call in two places, we write it once here.
 *
 * @param systemPrompt  Instructions for the AI (e.g. "you are a language tutor").
 * @param history       The full conversation so far (user + model turns).
 * @returns             The AI's response text.
 * @throws              If the API key is missing, or if the network call fails.
 */
async function callGeminiAPI(
  systemPrompt: string,
  history: ConversationTurn[]
): Promise<string> {

  // Step 1: Read the secret API key from environment variables.
  // Environment variables are set in .env.local and are NEVER exposed to the browser.
  const apiKey = process.env.GEMINI_API_KEY;

  // Step 2: If the key is missing, stop immediately with a clear error message.
  if (!apiKey) {
    throw new Error('Critical Error: GEMINI_API_KEY is missing from environment variables.');
  }

  // Step 3: Build the URL for the Gemini API endpoint.
  const url =
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

  // Step 4: Send the HTTP POST request to Gemini.
  // fetch() is like a courier: it packages our data, sends it to Google's server,
  // and waits for a reply.
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      // Tell Gemini we're sending JSON (a structured text format).
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      // system_instruction: the AI's "job description". It reads this first.
      system_instruction: { parts: [{ text: systemPrompt }] },
      // contents: the actual conversation messages the AI should respond to.
      contents: history,
    }),
  });

  // Step 5: Parse the JSON response body into a JavaScript object.
  const data = (await response.json()) as GeminiResponse;

  // Step 6: Check if the HTTP status code indicates an error (e.g. 400, 500).
  // response.ok is true only for codes 200-299.
  if (!response.ok) {
    throw new Error(
      data.error?.message ?? 'Failed to communicate with the Gemini API.'
    );
  }

  // Step 7: Dig into the nested response to find the actual text.
  // The path is: candidates[0] → content → parts[0] → text
  const outputText = data.candidates?.[0]?.content?.parts?.[0]?.text;

  // Step 8: If there's no text (unexpected response format), throw an error.
  if (!outputText) {
    throw new Error('Gemini returned an unrecognizable response format.');
  }

  // Step 9: Return the clean AI text to the caller.
  return outputText;
}

// ─── PUBLIC ACTIONS ───────────────────────────────────────────────────────────

/**
 * askAI — sends a single, one-shot question to Gemini.
 *
 * Use this when you need one answer and don't need to remember the conversation.
 * Internally it wraps the question as a one-turn "history" array and calls
 * callGeminiAPI().
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
    // Wrap the single message into the ConversationTurn format Gemini expects.
    const singleTurnHistory: ConversationTurn[] = [
      { role: 'user', parts: [{ text: userMessage }] },
    ];

    return await callGeminiAPI(systemPrompt, singleTurnHistory);
  } catch (error) {
    // Convert any error to a plain string message and re-throw so the component
    // can display it to the user in a friendly way.
    const message = error instanceof Error ? error.message : String(error);
    console.error('[askAI Error]:', message);
    throw new Error(message);
  }
}

/**
 * askAIWithHistory — sends a full multi-turn conversation to Gemini.
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
    return await callGeminiAPI(systemPrompt, history);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[askAIWithHistory Error]:', message);
    throw new Error(message);
  }
}
