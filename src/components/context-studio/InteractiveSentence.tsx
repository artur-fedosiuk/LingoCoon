'use client';

import { memo, useMemo, useState } from 'react';
import type { KeyboardEvent } from 'react';
import { readerWordStyle, type ReaderSelection, type ReaderToken } from '@/lib/context-studio/reader-tokens';
import styles from './reader.module.css';

type Props = {
  tokens: ReaderToken[]; language: string; selection: ReaderSelection | null; spokenId: string | null;
  onSelect?: (token: ReaderToken, element: HTMLElement) => void;
  onHover?: (token: ReaderToken, element: HTMLElement) => void;
  onLeave?: () => void;
  instructions?: string;
};
export default memo(function InteractiveSentence({ tokens, language, selection, spokenId, onSelect, onHover, onLeave, instructions }: Props) {
  const words = useMemo(() => tokens.filter((token) => token.type === 'word'), [tokens]);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  function navigate(event: KeyboardEvent<HTMLButtonElement>, token: ReaderToken) {
    const index = words.indexOf(token);
    const next = event.key === 'ArrowRight' ? index + 1 : event.key === 'ArrowLeft' ? index - 1 : event.key === 'Home' ? 0 : event.key === 'End' ? words.length - 1 : null;
    if (next === null) return;
    event.preventDefault();
    const target = words[Math.max(0, Math.min(next, words.length - 1))];
    if (target) { setFocusedId(target.id); document.getElementById(target.id)?.focus({ preventScroll: true }); }
  }
  return <p lang={language} className={styles.sentence} aria-describedby={instructions}>
    {tokens.map((token) => {
      if (token.type !== 'word') return token.text;
      const state = readerWordStyle(token, selection, spokenId);
      if (!onSelect) return <span key={token.id} className={styles.word} data-state={state}>{token.text}</span>;
      return <button key={token.id} id={token.id} type="button" className={styles.word} data-state={state}
        tabIndex={token.id === (focusedId ?? words[0]?.id) ? 0 : -1}
        aria-pressed={token.id === selection?.tokenId}
        onFocus={() => setFocusedId(token.id)}
        onKeyDown={(event) => navigate(event, token)}
        onClick={(event) => onSelect(token, event.currentTarget)}
        onPointerEnter={(event) => { if (event.pointerType === 'mouse') onHover?.(token, event.currentTarget); }}
        onPointerLeave={onLeave}>{token.text}</button>;
    })}
  </p>;
});
