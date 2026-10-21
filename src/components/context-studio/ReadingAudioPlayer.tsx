'use client';

import { useEffect, useState, useSyncExternalStore } from 'react';
import { Pause, Play, RotateCcw, RotateCw, SkipBack, SkipForward, Square } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { IDLE_AUDIO, type AudioSide, type AudioSession } from '@/lib/reading-tts/audio-session';
import type { ContextLanguage } from '@/types/context-studio';
import styles from './reader.module.css';

function timeLabel(seconds: number) {
  const value = Math.max(0, Math.floor(seconds));
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`;
}

export default function ReadingAudioPlayer({ player, language, sourceLanguage, nativeLanguage, onPlay, translationAvailable, enabled }: {
  player: AudioSession; language: ContextLanguage; sourceLanguage: ContextLanguage; nativeLanguage: ContextLanguage;
  onPlay: (side: AudioSide) => void; translationAvailable: boolean; enabled: boolean;
}) {
  const { t } = useTranslation(undefined, { lng: language });
  // The document and dictionary do not subscribe to the audio clock.
  const state = useSyncExternalStore(player.subscribe, player.getSnapshot, () => IDLE_AUDIO);
  const [side, setSide] = useState<AudioSide>('source');
  const canPause = state.status === 'playing' || state.status === 'loading';
  const toggle = () => {
    if (state.hasPausedReading) player.resumeReading();
    else if (state.status === 'idle' || state.mode === 'word') onPlay(side);
    else if (canPause) player.pause();
    else player.resume();
  };
  useEffect(() => {
    if (!enabled) return;
    const shortcut = (event: KeyboardEvent) => {
      if (event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey || document.querySelector('dialog[open]')) return;
      const element = event.target;
      if (element instanceof HTMLElement && element.closest('input, textarea, select, button, a, summary, [contenteditable="true"]')) return;
      if (event.code === 'Space') {
        event.preventDefault();
        const current = player.getSnapshot();
        if (current.error) return;
        if (current.hasPausedReading) player.resumeReading();
        else if (current.status === 'idle' || current.mode === 'word') onPlay(side);
        else if (current.status === 'playing' || current.status === 'loading') player.pause();
        else player.resume();
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        event.preventDefault();
        const direction = event.key === 'ArrowLeft' ? -1 : 1;
        if (event.shiftKey) player.stepSentence(direction); else player.skip(direction * 10);
      }
    };
    window.addEventListener('keydown', shortcut);
    return () => window.removeEventListener('keydown', shortcut);
  }, [player, onPlay, side, enabled]);
  const duration = state.duration === null ? '—' : timeLabel(state.duration);
  return <>
    <section className={styles.audioPlayer} data-reading-audio-player aria-label={t('context_studio.audio.label')}>
      <div className={styles.audioControls}>
        <button type="button" className={`${styles.iconButton} ${styles.audioIcon}`} aria-label={t('context_studio.redesign.previous')} disabled={!state.canPrevious || !!state.error} onClick={() => player.stepSentence(-1)}><SkipBack size={17} aria-hidden /></button>
        <button type="button" className={`${styles.iconButton} ${styles.audioIcon}`} aria-label={t('context_studio.audio.back')} disabled={!!state.error || state.currentTime <= 0} onClick={() => player.skip(-10)}><RotateCcw size={24} aria-hidden /><span className={styles.skipSeconds} aria-hidden>10</span></button>
        <button type="button" className={`${styles.iconButton} ${styles.primary} ${styles.audioMain}`} aria-label={t(state.hasPausedReading ? 'context_studio.audio.resume' : canPause ? 'context_studio.audio.pause' : 'context_studio.audio.play')} disabled={!!state.error && !state.hasPausedReading} onClick={toggle}>
          {canPause && !state.hasPausedReading ? <Pause size={19} aria-hidden /> : <Play size={19} aria-hidden />}
        </button>
        <button type="button" className={`${styles.iconButton} ${styles.audioIcon}`} aria-label={t('context_studio.audio.forward')} disabled={!!state.error || state.currentTime >= state.bufferedDuration} onClick={() => player.skip(10)}><RotateCw size={24} aria-hidden /><span className={styles.skipSeconds} aria-hidden>10</span></button>
        <button type="button" className={`${styles.iconButton} ${styles.audioIcon}`} aria-label={t('context_studio.redesign.next')} disabled={!state.canNext || !!state.error} onClick={() => player.stepSentence(1)}><SkipForward size={17} aria-hidden /></button>
      </div>
      <div className={styles.audioTimeline}>
        <span className={styles.audioTime}>{timeLabel(state.currentTime)}</span>
        <input type="range" min={0} max={Math.max(state.bufferedDuration, 0.01)} step={0.01} value={Math.min(state.currentTime, state.bufferedDuration)}
          aria-label={t('context_studio.audio.timeline')} aria-valuetext={`${timeLabel(state.currentTime)} / ${duration}; ${t('context_studio.audio.buffered')}: ${timeLabel(state.bufferedDuration)}`}
          disabled={!state.bufferedDuration || !!state.error} onChange={(event) => player.seek(Number(event.target.value))} />
        <span className={styles.audioTime} title={state.duration === null ? t('context_studio.audio.awaiting_duration') : undefined}>{duration}</span>
      </div>
      <label className={styles.audioSpeed}><span className="sr-only">{t('context_studio.audio.speed')}</span>
        <select value={state.playbackRate} onChange={(event) => player.setRate(Number(event.target.value))}>{[0.75, 1, 1.25, 1.5].map((speed) => <option key={speed} value={speed}>{speed}×</option>)}</select>
      </label>
      <select className={styles.audioSide} value={state.status === 'idle' ? side : state.side} aria-label={t('context_studio.redesign.audio_language')}
        onChange={(event) => { const next = event.target.value as AudioSide; setSide(next); player.stop(); }}>
        <option value="source">{t(`context_studio.immersive.languages.${sourceLanguage}`)}</option>
        <option value="translation" disabled={!translationAvailable}>{t(`context_studio.immersive.languages.${nativeLanguage}`)}</option>
      </select>
      {state.status !== 'idle' && <button type="button" className={styles.iconButton} aria-label={t('context_studio.immersive.stop')} onClick={player.stop}><Square size={14} aria-hidden /></button>}
    </section>
    <div className={styles.audioStatus}>
      {(state.error || state.queued || state.status === 'loading' || state.mode === 'word') && <p role="status" aria-atomic="true">{state.error ? t(`context_studio.audio.errors.${state.error}`) : state.mode === 'word' ? t('context_studio.redesign.pronouncing') : state.queued ? t('context_studio.audio.queued') : t('context_studio.audio.buffering')}</p>}
      {state.error && <button type="button" className={styles.textAction} onClick={player.retry}>{t('context_studio.audio.retry')}</button>}
      {state.hasPausedReading && <button type="button" className={styles.textAction} onClick={player.resumeReading}>{t('context_studio.redesign.resume_document')}</button>}
    </div>
  </>;
}
