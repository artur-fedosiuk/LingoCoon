import { useSyncExternalStore } from 'react';
import { Pause, Play, RotateCcw, RotateCw, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { IDLE_AUDIO, type AudioSession } from '@/lib/reading-tts/audio-session';
import type { ContextLanguage } from '@/types/context-studio';
import styles from './reader.module.css';

function timeLabel(seconds: number) {
  const value = Math.max(0, Math.floor(seconds));
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, '0')}`;
}

export default function ReadingAudioPlayer({ player, language, sourceLanguage, nativeLanguage, onClose }: {
  player: AudioSession; language: ContextLanguage; sourceLanguage: ContextLanguage; nativeLanguage: ContextLanguage; onClose: () => void;
}) {
  const { t } = useTranslation(undefined, { lng: language });
  // Only this compact toolbar receives position notifications (at most 4Hz).
  const state = useSyncExternalStore(player.subscribe, player.getSnapshot, () => IDLE_AUDIO);
  if (state.status === 'idle') return null;
  const canPause = state.status === 'playing' || state.status === 'loading';
  const current = timeLabel(state.currentTime);
  const buffered = timeLabel(state.bufferedDuration);
  const duration = state.duration === null ? state.error ? '—' : t('context_studio.audio.awaiting_duration') : timeLabel(state.duration);
  const status = state.error ? t(`context_studio.audio.errors.${state.error}`) : state.status === 'loading' ? t('context_studio.audio.buffering') : t(`context_studio.immersive.audio_${state.status}`);
  return <section className={styles.audioPlayer} data-reading-audio-player aria-label={t('context_studio.audio.label')}>
    <div className={styles.audioHeading}>
      <span className="text-sm font-medium">{t('context_studio.audio.label')} · {t(`context_studio.immersive.languages.${state.side === 'source' ? sourceLanguage : nativeLanguage}`)}</span>
      <button type="button" className={`${styles.control} ${styles.audioIcon}`} aria-label={t('context_studio.audio.close')} onClick={onClose}><X size={18} aria-hidden="true" /></button>
    </div>
    <div className={styles.audioControls}>
      <button type="button" className={`${styles.control} ${styles.audioIcon}`} aria-label={t('context_studio.audio.back')} disabled={!!state.error || state.currentTime <= 0} onClick={() => player.skip(-10)}><RotateCcw size={18} aria-hidden="true" /><span aria-hidden="true">10</span></button>
      <button type="button" className={`${styles.control} ${styles.primary} ${styles.audioIcon}`} aria-label={t(canPause ? 'context_studio.audio.pause' : state.currentTime > 0 ? 'context_studio.audio.resume' : 'context_studio.audio.play')} disabled={!!state.error} aria-pressed={canPause}
        onClick={canPause ? player.pause : player.resume}>{canPause ? <Pause size={18} aria-hidden="true" /> : <Play size={18} aria-hidden="true" />}</button>
      <button type="button" className={`${styles.control} ${styles.audioIcon}`} aria-label={t('context_studio.audio.forward')} disabled={!!state.error || state.currentTime >= state.bufferedDuration} onClick={() => player.skip(10)}><RotateCw size={18} aria-hidden="true" /><span aria-hidden="true">10</span></button>
      <label className={styles.audioSpeed}>
        <span>{t('context_studio.audio.speed')}</span>
        <select value={state.playbackRate} onChange={(event) => player.setRate(Number(event.target.value))}>
          {[0.75, 1, 1.25, 1.5].map((speed) => <option key={speed} value={speed}>{speed}×</option>)}
        </select>
      </label>
    </div>
    <div className={styles.audioTimeline}>
      <input type="range" min={0} max={Math.max(state.bufferedDuration, 0.01)} step={0.01} value={Math.min(state.currentTime, state.bufferedDuration)}
        aria-label={t('context_studio.audio.timeline')} aria-valuetext={`${current} / ${duration}; ${t('context_studio.audio.buffered')}: ${buffered}`}
        disabled={!state.bufferedDuration || !!state.error} onChange={(event) => player.seek(Number(event.target.value))} />
      <span className={styles.audioTimes}>{current} / {duration} · {t('context_studio.audio.buffered')}: {buffered}</span>
    </div>
    <div className={styles.audioStatus}>
      <p role="status" aria-atomic="true">{status}</p>
      {state.error && <button type="button" className={styles.control} onClick={player.retry}>{t('context_studio.audio.retry')}</button>}
      {state.hasPausedReading && <button type="button" className={styles.control} onClick={player.resumeReading}>{t('context_studio.audio.resume')} · {t('context_studio.immersive.play_all')}</button>}
    </div>
  </section>;
}
