'use client';

import { memo, useCallback } from 'react';
import { Play, Square } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import InteractiveSentence from './InteractiveSentence';
import type { ReaderSelection, ReaderToken, ReaderSide, SentencePair } from '@/lib/context-studio/reader-tokens';
import type { SpeechState } from '@/lib/context-studio/speech-player';
import type { ContextSession } from '@/types/context-studio';
import styles from './reader.module.css';

type RowProps = {
  pair: SentencePair; index: number; session: ContextSession; selection: ReaderSelection | null;
  spokenId: string | null; spokenSide: ReaderSide; active: boolean; sourceAudio: boolean; translationAudio: boolean;
  onSelect: (pair: SentencePair, token: ReaderToken, element: HTMLElement) => void;
  onHover: (pair: SentencePair, token: ReaderToken, element: HTMLElement) => void;
  onLeave: () => void; onPlay: (pair: SentencePair, side: ReaderSide) => void;
};
const SentencePairRow = memo(function SentencePairRow(props: RowProps) {
  const { t } = useTranslation(undefined, { lng: props.session.nativeLanguage });
  const { pair, onSelect, onHover } = props;
  const select = useCallback((token: ReaderToken, element: HTMLElement) => onSelect(pair, token, element), [pair, onSelect]);
  const hover = useCallback((token: ReaderToken, element: HTMLElement) => onHover(pair, token, element), [pair, onHover]);
  return <section data-sentence-id={pair.id} className={`${styles.row} ${props.active ? styles.activeRow : ''}`} aria-label={t('context_studio.tokens.sentence', { number: props.index + 1 })}>
    {(['source', 'translation'] as const).map((side) => <div className={styles.column} key={side}>
      <div className="mb-2 flex items-center gap-2 text-xs text-muted-foreground">
        <button type="button" className={styles.control} disabled={side === 'source' ? !props.sourceAudio : !props.translationAudio || !pair.translatedText}
          onClick={() => props.onPlay(pair, side)} aria-pressed={props.active && props.spokenSide === side}
          aria-label={t('context_studio.tokens.play_sentence', { number: props.index + 1, language: side === 'source' ? props.session.sourceLanguage : props.session.nativeLanguage })}>
          {props.active && props.spokenSide === side ? <Square size={14} aria-hidden /> : <Play size={14} aria-hidden />}
        </button>
        <span>{props.index + 1} · {t(`context_studio.immersive.languages.${side === 'source' ? props.session.sourceLanguage : props.session.nativeLanguage}`)}</span>
      </div>
      {side === 'source' || pair.translatedText ? <div className={side === 'translation' ? 'text-muted-foreground' : ''}>
        <InteractiveSentence tokens={side === 'source' ? pair.sourceTokens : pair.translatedTokens}
          language={side === 'source' ? props.session.sourceLanguage : props.session.nativeLanguage}
          selection={side === 'source' ? props.selection : null} spokenId={props.spokenSide === side ? props.spokenId : null}
          onSelect={side === 'source' ? select : undefined} onHover={side === 'source' ? hover : undefined}
          onLeave={props.onLeave} instructions={side === 'source' ? 'reader-keyboard-help' : undefined} />
      </div> : <p className="text-sm text-muted-foreground">{t('context_studio.tokens.no_translation')}</p>}
    </div>)}
  </section>;
});

export default function ContextReadingSurface({ pairs, session, selection, speech, sourceAudio, translationAudio, onSelect, onHover, onLeave, onPlay }: {
  pairs: SentencePair[]; session: ContextSession; selection: ReaderSelection | null; speech: SpeechState;
  sourceAudio: boolean; translationAudio: boolean;
  onSelect: RowProps['onSelect']; onHover: RowProps['onHover']; onLeave: RowProps['onLeave']; onPlay: RowProps['onPlay'];
}) {
  return <article className="min-w-0 overflow-hidden rounded-xl border bg-card" aria-label="Reader">
    {pairs.map((pair, index) => <SentencePairRow key={pair.id} pair={pair} index={index} session={session} selection={selection}
      spokenId={speech.sentenceId === pair.id ? speech.tokenId : null} spokenSide={speech.sentenceId === pair.id ? speech.side : 'source'}
      active={speech.sentenceId === pair.id} sourceAudio={sourceAudio} translationAudio={translationAudio}
      onSelect={onSelect} onHover={onHover} onLeave={onLeave} onPlay={onPlay} />)}
  </article>;
}
