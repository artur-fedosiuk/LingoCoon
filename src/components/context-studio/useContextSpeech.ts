'use client';

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { createSpeechPlayer, IDLE_SPEECH, ONLINE_VOICE, pairsAudioRequest, wordAudioRequest } from '@/lib/context-studio/speech-player';
import { createWebAudioDriver } from '@/lib/reading-tts/web-audio-driver';
import type { ReaderSelection, ReaderSide, SentencePair } from '@/lib/context-studio/reader-tokens';
import type { ContextSession } from '@/types/context-studio';

export function useContextSpeech(session: ContextSession) {
  // Construction is inert; the AudioContext is created by a user's play gesture.
  const [player] = useState(() => createSpeechPlayer({ driver: createWebAudioDriver() }));
  const disposal = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const state = useSyncExternalStore(player.subscribeWords, player.getSpeechSnapshot, () => IDLE_SPEECH);
  useEffect(() => {
    clearTimeout(disposal.current);
    const leave = () => player.stop();
    window.addEventListener('pagehide', leave);
    return () => {
      window.removeEventListener('pagehide', leave);
      player.stop();
      // Strict Mode immediately replays setup; a real unmount closes the context.
      disposal.current = setTimeout(() => player.dispose(), 0);
    };
  }, [player]);
  useEffect(() => () => player.stop(), [player, session.sourceText, session.sourceLanguage, session.nativeLanguage, session.revision]);
  const speakWord = useCallback((word: ReaderSelection) => {
    player.play(wordAudioRequest(session, word));
  }, [player, session]);
  const playPairs = useCallback((pairs: SentencePair[], side: ReaderSide, mode: 'sentence' | 'document') => {
    player.play(pairsAudioRequest(session, pairs, side, mode));
  }, [player, session]);
  return {
    state, player, speakWord, playPairs, stop: player.stop,
    sourceVoice: ONLINE_VOICE, translationVoice: ONLINE_VOICE,
    pause: player.pause, resume: player.resume,
  };
}
