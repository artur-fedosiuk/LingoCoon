'use client';

import { memo, useCallback } from 'react';
import { Play } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import InteractiveSentence from './InteractiveSentence';
import type { ReaderSelection, ReaderToken, ReaderSide, SentencePair } from '@/lib/context-studio/reader-tokens';
import type { SpeechState } from '@/lib/context-studio/speech-player';
import type { ContextSession } from '@/types/context-studio';
import styles from './reader.module.css';

type RowProps = {
  pair: SentencePair; index: number; showTranslation: boolean; session: ContextSession; selection: ReaderSelection | null;
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
  return <section data-sentence-id={pair.id} className={`${styles.row} ${!props.showTranslation ? styles.sourceOnly : ''} ${props.active ? styles.activeRow : ''}`} aria-label={t('context_studio.tokens.sentence', { number: props.index + 1 })}>
    <button type="button" className={styles.sentencePlay} disabled={!props.sourceAudio}
      onClick={() => props.onPlay(pair, 'source')}
      aria-label={t('context_studio.tokens.play_sentence', { number: props.index + 1, language: props.session.sourceLanguage })}>
      <Play size={15} aria-hidden />
    </button>
    {(['source', ...(props.showTranslation ? ['translation'] as const : [])] as const).map((side) => <div className={`${styles.column} ${side === 'translation' ? styles.translation : styles.source}`} key={side}>
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

export default function ContextReadingSurface({ pairs, session, selection, speech, showTranslation, sourceAudio, translationAudio, onSelect, onHover, onLeave, onPlay }: {
  pairs: SentencePair[]; showTranslation: boolean; session: ContextSession; selection: ReaderSelection | null; speech: SpeechState;
  sourceAudio: boolean; translationAudio: boolean;
  onSelect: RowProps['onSelect']; onHover: RowProps['onHover']; onLeave: RowProps['onLeave']; onPlay: RowProps['onPlay'];
}) {
  return <article className={styles.readingSurface} aria-label="Reader">
    {pairs.map((pair, index) => <SentencePairRow key={pair.id} pair={pair} index={index} showTranslation={showTranslation} session={session} selection={selection}
      spokenId={speech.sentenceId === pair.id ? speech.tokenId : null} spokenSide={speech.sentenceId === pair.id ? speech.side : 'source'}
      active={speech.sentenceId === pair.id} sourceAudio={sourceAudio} translationAudio={translationAudio}
      onSelect={onSelect} onHover={onHover} onLeave={onLeave} onPlay={onPlay} />)}
  </article>;
}
