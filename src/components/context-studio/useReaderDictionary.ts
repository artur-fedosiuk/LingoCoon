'use client';

import { useCallback, useEffect, useState } from 'react';
import { explainContextSelection, lookupContextDictionary } from '@/lib/actions/context-studio-actions';
import { createReaderCache } from '@/lib/context-studio/reader-cache';
import { createLatestRequest } from '@/lib/context-studio/latest-request';
import { localReaderDictionary, readerDictionaryKey, readerExplanationKey, type ReaderDictionary } from '@/lib/context-studio/reader-dictionary';
import type { ReaderSelection, SentencePair } from '@/lib/context-studio/reader-tokens';
import type { ContextExplanation, ContextSession } from '@/types/context-studio';

type Resource<T> = { key: string; status: 'ready'; value: T } | { key: string; status: 'error'; value: null };

function useCachedResource<T>(key: string | null, request: () => Promise<T>, cache: ReturnType<typeof createReaderCache<T>>, delayMs = 0) {
  const [result, setResult] = useState<Resource<T> | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!key) return;
    const gate = createLatestRequest();
    const timer = setTimeout(() => { void gate.run(() => cache.load(key, request), {
      onResult: (value) => setResult({ key, status: 'ready', value }),
      onError: () => setResult({ key, status: 'error', value: null }),
      onSettled: () => {},
    }); }, cache.peek(key) === undefined ? delayMs : 0);
    return () => { clearTimeout(timer); gate.invalidate(); };
  }, [key, request, cache, attempt, delayMs]);
  const cached = key ? cache.peek(key) : undefined;
  const current = result?.key === key ? result : null;
  return {
    value: cached ?? (current?.status === 'ready' ? current.value : null),
    status: key ? cached !== undefined ? 'ready' : current?.status ?? 'loading' : 'idle',
    retry: () => { if (key) { cache.delete(key); setResult(null); setAttempt((value) => value + 1); } },
  };
}

function useContextExplanation(session: ContextSession, selection: ReaderSelection | null, pair: SentencePair | null, cache: ReturnType<typeof createReaderCache<ContextExplanation>>, delayMs = 0) {
  const key = selection && pair ? readerExplanationKey(session, selection, pair) : null;
  const start = selection?.start;
  const end = selection?.end;
  const translatedContext = pair?.translatedText;
  const fetchExplanation = useCallback(async () => {
    const response = await explainContextSelection({ ...session, start, end, ...(translatedContext ? { translatedContext } : {}) });
    if (!response.value) throw new Error('Explanation unavailable.');
    return response.value;
  }, [session, start, end, translatedContext]);
  return useCachedResource(key, fetchExplanation, cache, delayMs);
}

export function useReaderDictionary(session: ContextSession, selection: ReaderSelection | null, pair: SentencePair | null, hovered: ReaderSelection | null, hoveredPair: SentencePair | null) {
  const [lexicalCache] = useState(() => createReaderCache<ReaderDictionary>());
  const [explanationCache] = useState(() => createReaderCache<ContextExplanation>());
  const lexicalKey = selection ? readerDictionaryKey(session, selection) : null;
  const word = selection?.text;
  const { sourceLanguage, nativeLanguage } = session;
  const fetchDictionary = useCallback(async () => {
    const response = await lookupContextDictionary({ sourceLanguage, nativeLanguage, word });
    if (!response.value) throw new Error('Dictionary unavailable.');
    return response.value;
  }, [sourceLanguage, nativeLanguage, word]);
  const dictionary = useCachedResource(lexicalKey, fetchDictionary, lexicalCache);
  const explanation = useContextExplanation(session, selection, pair, explanationCache);
  const preview = useContextExplanation(session, hovered, hoveredPair, explanationCache, 200);
  return {
    dictionary: { ...dictionary, value: dictionary.value ?? (selection ? localReaderDictionary(selection.text, session.sourceLanguage, session.nativeLanguage) : null) },
    explanation,
    preview,
  };
}
