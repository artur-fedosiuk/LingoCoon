'use client';

import { useCallback, useEffect, useState } from 'react';
import { explainContextSelection, lookupContextDictionary } from '@/lib/actions/context-studio-actions';
import { createReaderCache } from '@/lib/context-studio/reader-cache';
import { createLatestRequest } from '@/lib/context-studio/latest-request';
import { localReaderDictionary, readerDictionaryKey, readerExplanationKey, type ReaderDictionary } from '@/lib/context-studio/reader-dictionary';
import type { ReaderSelection, SentencePair } from '@/lib/context-studio/reader-tokens';
import type { ContextExplanation, ContextSession } from '@/types/context-studio';

type Resource<T> = { key: string; status: 'ready'; value: T } | { key: string; status: 'error'; value: null };

function useCachedResource<T>(key: string | null, request: () => Promise<T>, cache: ReturnType<typeof createReaderCache<T>>) {
  const [result, setResult] = useState<Resource<T> | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!key) return;
    const gate = createLatestRequest();
    void gate.run(() => cache.load(key, request), {
      onResult: (value) => setResult({ key, status: 'ready', value }),
      onError: () => setResult({ key, status: 'error', value: null }),
      onSettled: () => {},
    });
    return () => gate.invalidate();
  }, [key, request, cache, attempt]);
  const current = result?.key === key ? result : null;
  return {
    value: current?.status === 'ready' ? current.value : null,
    status: key ? current?.status ?? 'loading' : 'idle',
    retry: () => { if (key) { cache.delete(key); setResult(null); setAttempt((value) => value + 1); } },
  };
}

export function useReaderDictionary(session: ContextSession, selection: ReaderSelection | null, pair: SentencePair | null) {
  const [lexicalCache] = useState(() => createReaderCache<ReaderDictionary>());
  const [explanationCache] = useState(() => createReaderCache<ContextExplanation>());
  const lexicalKey = selection ? readerDictionaryKey(session, selection) : null;
  const contextualKey = selection && pair ? readerExplanationKey(session, selection, pair) : null;
  const word = selection?.text;
  const { sourceLanguage, nativeLanguage } = session;
  const fetchDictionary = useCallback(async () => {
    const response = await lookupContextDictionary({ sourceLanguage, nativeLanguage, word });
    if (!response.value) throw new Error('Dictionary unavailable.');
    return response.value;
  }, [sourceLanguage, nativeLanguage, word]);
  const start = selection?.start;
  const end = selection?.end;
  const translatedContext = pair?.translatedText;
  const fetchExplanation = useCallback(async () => {
    const response = await explainContextSelection({ ...session, start, end, ...(translatedContext ? { translatedContext } : {}) });
    if (!response.value) throw new Error('Explanation unavailable.');
    return response.value;
  }, [session, start, end, translatedContext]);
  const dictionary = useCachedResource(lexicalKey, fetchDictionary, lexicalCache);
  const explanation = useCachedResource(contextualKey, fetchExplanation, explanationCache);
  return {
    dictionary: { ...dictionary, value: dictionary.value ?? (selection ? localReaderDictionary(selection.text, session.sourceLanguage, session.nativeLanguage) : null) },
    explanation,
    preview: (word: ReaderSelection) => lexicalCache.peek(readerDictionaryKey(session, word)) ?? localReaderDictionary(word.text, session.sourceLanguage, session.nativeLanguage),
  };
}
