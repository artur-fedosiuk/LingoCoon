'use server';

import { sendStructuredRequestToGemini } from '@/lib/server/ai-client';
import { CONTEXT_EXPLANATION_JSON_SCHEMA, CONTEXT_TRANSLATION_JSON_SCHEMA, InvalidContextStudioResponseError, parseContextExplanation, parseContextTranslation, prepareContextExplanation, prepareContextTranslation } from '@/lib/server/context-studio-ai';
import { isContextStudioEnabled } from '@/lib/server/context-studio-feature-flag';
import { contextFailureCode } from '@/lib/server/context-studio-errors';
import { getContextLanguageDefaults, contextSelectionSchema, contextSessionSchema } from '@/lib/context-studio/reader-contract';
import { requireAuthenticatedClaims } from '@/lib/supabase/auth';
import { getLanguageProfile } from '@/lib/supabase/profile';
import type { ContextExplanation, ContextResult, ContextTranslation } from '@/types/context-studio';
import type { ReaderDictionary } from '@/lib/context-studio/reader-dictionary';
import { CONTEXT_DICTIONARY_JSON_SCHEMA, contextDictionaryRequestSchema, parseContextDictionary, prepareContextDictionary } from '@/lib/server/context-studio-ai';

export async function lookupContextDictionary(input: unknown): Promise<ContextResult<ReaderDictionary>> {
  if (!isContextStudioEnabled()) return { errorKey: 'feature_unavailable' };
  const parsed = contextDictionaryRequestSchema.safeParse(input);
  if (!parsed.success) return { errorKey: 'invalid_input' };
  try {
    await requireAuthenticatedClaims();
    const request = prepareContextDictionary(parsed.data);
    const response = await sendStructuredRequestToGemini(request.prompt, request.history, {
      jsonSchema: CONTEXT_DICTIONARY_JSON_SCHEMA, maxTokens: 1000, schemaName: 'reader_dictionary',
    });
    return { value: parseContextDictionary(response, request.request) };
  } catch (error) {
    console.warn('[ContextStudio] dictionary', contextFailureCode(error));
    return { errorKey: error instanceof InvalidContextStudioResponseError ? 'invalid_response' : 'service_unavailable' };
  }
}

export async function loadContextLanguageDefaults() {
  if (!isContextStudioEnabled()) return { nativeLanguage: null, sourceLanguage: null };
  try {
    const { claims, supabase } = await requireAuthenticatedClaims();
    return getContextLanguageDefaults(await getLanguageProfile(supabase, claims.sub));
  } catch { return { nativeLanguage: null, sourceLanguage: null }; }
}

export async function translateContextText(input: unknown): Promise<ContextResult<ContextTranslation>> {
  if (!isContextStudioEnabled()) return { errorKey: 'feature_unavailable' };
  const parsed = contextSessionSchema.safeParse(input);
  if (!parsed.success) return { errorKey: 'invalid_input' };
  try {
    await requireAuthenticatedClaims();
    const request = prepareContextTranslation(parsed.data);
    const response = await sendStructuredRequestToGemini(request.prompt, request.history, {
      jsonSchema: CONTEXT_TRANSLATION_JSON_SCHEMA, maxTokens: 1_600, schemaName: 'context_units',
    });
    return { value: parseContextTranslation(response, request.session, request.units) };
  } catch (error) {
    console.warn('[ContextStudio] translation', contextFailureCode(error));
    return { errorKey: error instanceof InvalidContextStudioResponseError ? 'invalid_response' : 'service_unavailable' };
  }
}

export async function explainContextSelection(input: unknown): Promise<ContextResult<ContextExplanation>> {
  if (!isContextStudioEnabled()) return { errorKey: 'feature_unavailable' };
  const parsed = contextSelectionSchema.safeParse(input);
  if (!parsed.success) return { errorKey: 'invalid_input' };
  try {
    await requireAuthenticatedClaims();
    const request = prepareContextExplanation(parsed.data);
    const response = await sendStructuredRequestToGemini(request.prompt, request.history, {
      jsonSchema: CONTEXT_EXPLANATION_JSON_SCHEMA, maxTokens: 900, schemaName: 'context_explanation',
    });
    return { value: parseContextExplanation(response, request.selection) };
  } catch (error) {
    console.warn('[ContextStudio] explanation', contextFailureCode(error));
    return { errorKey: error instanceof InvalidContextStudioResponseError ? 'invalid_response' : 'service_unavailable' };
  }
}
