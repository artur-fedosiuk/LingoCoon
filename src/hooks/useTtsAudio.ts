'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { TtsVoicePreset } from '@/lib/tts';
import { fetchAdmittedAudio } from '@/lib/reading-tts/admission-client';
import { TTS_ERROR_CODES } from '@/lib/reading-tts/contract';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface PlayTtsAudioOptions {
  text: string;
  languageCode: string;
  speed?: number;
  voice?: TtsVoicePreset;
}

interface TtsErrorResponse {
  error?: string;
}

function getCacheKey(options: PlayTtsAudioOptions, text: string): string {
  return [
    options.voice ?? 'female',
    options.languageCode ?? 'auto',
    options.speed ?? 1,
    text,
  ].join(':');
}

export function useTtsAudio() {
  const { t } = useTranslation();
  const [loadingRequestId, setLoadingRequestId] = useState<string | null>(null);
  const audioCache = useRef(new Map<string, string>());
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const loadingRequestIdRef = useRef<string | null>(null);
  const playbackVersionRef = useRef(0);
  const requestAbortRef = useRef<AbortController | null>(null);

  useEffect(() => () => {
    playbackVersionRef.current += 1;
    requestAbortRef.current?.abort();
    currentAudioRef.current?.pause();
    audioCache.current.forEach((audioSource) => URL.revokeObjectURL(audioSource));
    audioCache.current.clear();
  }, []);

  const stopAudio = useCallback(() => {
    playbackVersionRef.current += 1;
    requestAbortRef.current?.abort();
    currentAudioRef.current?.pause();
    currentAudioRef.current = null;
  }, []);

  const playAudio = useCallback(async (
    options: PlayTtsAudioOptions,
    requestId = 'audio',
  ) => {
    const text = options.text.trim();
    if (!text || loadingRequestIdRef.current) return;

    const cacheKey = getCacheKey(options, text);
    stopAudio();
    const playbackVersion = playbackVersionRef.current;
    loadingRequestIdRef.current = requestId;
    setLoadingRequestId(requestId);
    const abort = new AbortController();
    requestAbortRef.current = abort;
    let queueNotice: string | number | undefined;

    try {
      let audioSource = audioCache.current.get(cacheKey);

      if (!audioSource) {
        const response = await fetchAdmittedAudio('/api/tts/synthesize', {
          method: 'POST',
          signal: abort.signal,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...options, text }),
        }, { onQueued: () => {
          if (queueNotice === undefined) queueNotice = toast.loading(t('context_studio.audio.queued'), {
            action: { label: t('context_studio.audio.close'), onClick: () => abort.abort() },
          });
        } });

        if (!response.ok) {
          const data = await response.json().catch(() => null) as TtsErrorResponse | null;
          throw new Error(data?.error ?? `TTS request failed: ${response.status}`);
        }

        audioSource = URL.createObjectURL(await response.blob());
        audioCache.current.set(cacheKey, audioSource);
      }

      if (playbackVersion !== playbackVersionRef.current) return;

      const audio = new Audio(audioSource);
      currentAudioRef.current = audio;
      await audio.play();
    } catch (error) {
      if (!abort.signal.aborted) {
        const code = TTS_ERROR_CODES.find((value) => error instanceof Error && error.message === value);
        toast.error(t(`context_studio.audio.errors.${code && code !== 'queued' ? code : 'unavailable'}`));
        console.error('[TTS] Audio playback failed:', code ?? 'unavailable');
      }
    } finally {
      if (queueNotice !== undefined) toast.dismiss(queueNotice);
      loadingRequestIdRef.current = null;
      setLoadingRequestId(null);
    }
  }, [stopAudio, t]);

  return {
    isAudioLoading: loadingRequestId !== null,
    loadingRequestId,
    playAudio,
    stopAudio,
  };
}
