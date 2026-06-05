'use server';

import { callFastAi, callStructuredAi, getFriendlyAiError } from '@/lib/server/ai-client';
import {
  buildPersonalizedDeckPrompt,
  type AiDeckStudentContext,
} from '@/lib/server/ai-deck-prompt';
import {
  DECK_GENERATION_SYSTEM_PROMPT,
  getDeckGenerationAiOptions,
  InvalidGeneratedDeckError,
  parseGeneratedDeck,
} from '@/lib/server/ai-deck-generation';
import { requireAuthenticatedClaims } from '@/lib/supabase/auth';
import { getProfile } from '@/lib/supabase/profile';
import type { GeneratedDeck } from '@/types/ai-deck';
import type { ConversationTurn } from '@/types/ai';

export type { ConversationTurn } from '@/types/ai';

export type AiDeckGenerationErrorKey =
  | 'invalid_prompt'
  | 'unexpected_format'
  | 'service_unavailable';

export async function askAI(systemPrompt: string, userMessage: string): Promise<string> {
  const history: ConversationTurn[] = [{ role: 'user', parts: [{ text: userMessage }] }];
  return askAIWithHistory(systemPrompt, history);
}

export async function askAIWithHistory(
  systemPrompt: string,
  history: ConversationTurn[],
): Promise<string> {
  try {
    const { claims } = await requireAuthenticatedClaims();
    return await callFastAi(systemPrompt, history, { userId: claims.sub });
  } catch (error) {
    const message = getFriendlyAiError(error);
    console.error('[askAIWithHistory]', message);
    throw new Error(message);
  }
}

export async function generateDeckWithAI(
  userPrompt: string,
): Promise<{ deck?: GeneratedDeck; errorKey?: AiDeckGenerationErrorKey }> {
  if (typeof userPrompt !== 'string') return { errorKey: 'invalid_prompt' };

  const prompt = userPrompt.trim();
  if (!prompt || prompt.length > 1000) return { errorKey: 'invalid_prompt' };

  try {
    const { claims, supabase } = await requireAuthenticatedClaims();
    const profile = await getProfile(supabase, claims.sub);
    const studentContext: AiDeckStudentContext = {
      currentLevel: profile?.current_level ?? null,
      learningPurpose: profile?.learning_purpose ?? null,
      learningPurposeDetails: profile?.learning_purpose_details ?? null,
      nativeLanguage: profile?.native_language ?? null,
      targetLanguage: profile?.target_language ?? null,
    };
    const history: ConversationTurn[] = [{
      role: 'user',
      parts: [{ text: buildPersonalizedDeckPrompt(prompt, studentContext) }],
    }];
    const response = await callStructuredAi(
      DECK_GENERATION_SYSTEM_PROMPT,
      history,
      getDeckGenerationAiOptions(claims.sub),
    );

    return { deck: parseGeneratedDeck(response) };
  } catch (error) {
    const message =
      error instanceof InvalidGeneratedDeckError
        ? error.message
        : getFriendlyAiError(error);

    console.error('[generateDeckWithAI]', message);
    return {
      errorKey:
        error instanceof InvalidGeneratedDeckError
          ? 'unexpected_format'
          : 'service_unavailable',
    };
  }
}
