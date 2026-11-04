'use client';

import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';
import type { SpeechState } from '@/lib/context-studio/speech-player';

export function useReaderFollow(state: SpeechState, root: RefObject<HTMLDivElement | null>, chrome: RefObject<HTMLDivElement | null>, dictionaryOpen: boolean) {
  const [following, setFollowing] = useState(true);
  const automaticScrollUntil = useRef(0);
  const scrollToSpeech = useCallback(() => {
    if (!state.sentenceId || state.mode === 'word' || state.status !== 'playing') return;
    const row = root.current?.querySelector<HTMLElement>(`[data-sentence-id="${state.sentenceId}"]`);
    if (!row) return;
    const box = row.getBoundingClientRect();
    const top = Math.max((chrome.current?.getBoundingClientRect().bottom ?? 0) + 16, window.innerHeight * .25);
    const bottom = Math.max(top + 80, window.innerHeight * .75);
    if (box.top < top || box.bottom > bottom) {
      // Scroll events also cover scrollbar dragging; ignore our own smooth animation.
      automaticScrollUntil.current = performance.now() + 1000;
      window.scrollBy({ top: box.top - top, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
    }
  }, [state.sentenceId, state.mode, state.status, root, chrome]);
  useEffect(() => {
    const manualScroll = (event: Event) => {
      if (event.type === 'scroll' && performance.now() < automaticScrollUntil.current) return;
      if (event.target instanceof Element && event.target.closest('dialog, aside, [data-reading-audio-player]')) return;
      if (event instanceof KeyboardEvent && (!['PageUp', 'PageDown', 'Home', 'End', 'ArrowUp', 'ArrowDown'].includes(event.key) || (event.target instanceof HTMLElement && event.target.closest('input, select, textarea, button')))) return;
      setFollowing(false);
    };
    window.addEventListener('wheel', manualScroll, { passive: true });
    window.addEventListener('touchmove', manualScroll, { passive: true });
    window.addEventListener('keydown', manualScroll);
    window.addEventListener('scroll', manualScroll, { passive: true });
    return () => { window.removeEventListener('wheel', manualScroll); window.removeEventListener('touchmove', manualScroll); window.removeEventListener('keydown', manualScroll); window.removeEventListener('scroll', manualScroll); };
  }, []);
  useEffect(() => { if (following && !dictionaryOpen) scrollToSpeech(); }, [following, dictionaryOpen, scrollToSpeech]);
  return { showReturn: !following && !!state.sentenceId && state.mode !== 'word', returnToSpeech: () => { setFollowing(true); scrollToSpeech(); } };
}
