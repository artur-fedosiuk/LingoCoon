'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ContextReadingSurface from './ContextReadingSurface';
import ContextSelectionPanel from './ContextSelectionPanel';
import ContextFocusSet from './ContextFocusSet';
import WordQuickPopover, { type HoveredWord } from './WordQuickPopover';
import { useContextSpeech } from './useContextSpeech';
import ReadingAudioPlayer from './ReadingAudioPlayer';
import ReaderHeader from './ReaderHeader';
import { useReaderFollow } from './useReaderFollow';
import { useReaderDictionary } from './useReaderDictionary';
import { translateContextText } from '@/lib/actions/context-studio-actions';
import { addReaderFocus, buildSentencePairs, selectReaderToken, type ReaderSelection, type ReaderSide, type ReaderToken, type SentencePair } from '@/lib/context-studio/reader-tokens';
import { MAX_FOCUS_PHRASES } from '@/lib/context-studio/reader-contract';
import { createLatestRequest } from '@/lib/context-studio/latest-request';
import { withReaderTimeout } from '@/lib/context-studio/reader-cache';
import type { ContextSession, ContextTranslation } from '@/types/context-studio';
import styles from './reader.module.css';

type Props = { session: ContextSession; hidden: boolean; onEdit: () => void; onReset: () => void; onFocusCount: (count: number) => void };

export default function ContextReader({ session, hidden, onEdit, onReset, onFocusCount }: Props) {
  const { t } = useTranslation(undefined, { lng: session.nativeLanguage });
  const [translation, setTranslation] = useState<ContextTranslation | null>(null);
  const [translationStatus, setTranslationStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [translationGate] = useState(createLatestRequest);
  const pairs = useMemo(() => buildSentencePairs(session, translation), [session, translation]);
  const [selection, setSelection] = useState<ReaderSelection | null>(null);
  const [hovered, setHovered] = useState<HoveredWord | null>(null);
  const [focus, setFocus] = useState<ReaderSelection[]>([]);
  const [notice, setNotice] = useState('');
  const [resetConfirm, setResetConfirm] = useState(false);
  const [showTranslation, setShowTranslation] = useState(() => {
    try { return typeof window === 'undefined' || localStorage.getItem('reader:translation') !== 'hidden'; } catch { return true; }
  });
  const hoverOpen = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const hoverClose = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const root = useRef<HTMLDivElement>(null);
  const chrome = useRef<HTMLDivElement>(null);
  const speech = useContextSpeech(session);
  const { speakWord, playPairs, stop, player } = speech;
  const follow = useReaderFollow(speech.state, root, chrome, !!selection);
  const playDocument = useCallback((side: ReaderSide) => playPairs(pairs, side, 'document'), [pairs, playPairs]);
  const pair = pairs.find((item) => item.id === selection?.sentenceId) ?? null;
  const hoveredPair = pairs.find((item) => item.id === hovered?.word.sentenceId) ?? null;
  const lookup = useReaderDictionary(session, hidden ? null : selection, pair, hidden ? null : hovered?.word ?? null, hoveredPair);

  const requestTranslation = useCallback(async () => {
    setTranslationStatus('loading');
    await translationGate.run(() => withReaderTimeout(() => translateContextText(session)), {
      onResult: (result) => {
        if (result.value) { setTranslation(result.value); setTranslationStatus('ready'); }
        else setTranslationStatus('error');
      },
      onError: () => setTranslationStatus('error'),
      onSettled: () => {},
    });
  }, [session, translationGate]);
  useEffect(() => {
    const timer = setTimeout(() => { void requestTranslation(); }, 0);
    return () => { clearTimeout(timer); translationGate.invalidate(); };
  }, [requestTranslation, translationGate]);
  useEffect(() => { onFocusCount(focus.length); }, [focus.length, onFocusCount]);
  useEffect(() => () => { clearTimeout(hoverOpen.current); clearTimeout(hoverClose.current); }, []);
  const dismissHover = useCallback(() => {
    clearTimeout(hoverOpen.current); clearTimeout(hoverClose.current); setHovered(null);
  }, []);
  const enterPopup = useCallback(() => { clearTimeout(hoverClose.current); }, []);
  const leaveWord = useCallback(() => {
    clearTimeout(hoverOpen.current); clearTimeout(hoverClose.current);
    hoverClose.current = setTimeout(() => setHovered(null), 250);
  }, []);
  const hoverWord = useCallback((row: SentencePair, token: ReaderToken, element: HTMLElement) => {
    if (selection) return;
    const word = selectReaderToken(row, token);
    if (!word) return;
    clearTimeout(hoverOpen.current); clearTimeout(hoverClose.current);
    hoverOpen.current = setTimeout(() => setHovered({ word, element }), 150);
  }, [selection]);
  const select = useCallback((word: ReaderSelection) => {
    const row = document.getElementById(word.tokenId)?.closest<HTMLElement>('[data-sentence-id]');
    const top = row?.getBoundingClientRect().top;
    dismissHover(); setSelection(word); speakWord(word);
    requestAnimationFrame(() => { if (row && top !== undefined) window.scrollBy({ top: row.getBoundingClientRect().top - top, behavior: 'instant' }); });
  }, [dismissHover, speakWord]);
  const selectWord = useCallback((row: SentencePair, token: ReaderToken) => {
    const word = selectReaderToken(row, token);
    if (word) select(word);
  }, [select]);
  const closeDictionary = useCallback(() => {
    const id = selection?.tokenId;
    const row = id ? document.getElementById(id)?.closest<HTMLElement>('[data-sentence-id]') : null;
    const top = row?.getBoundingClientRect().top;
    setSelection(null);
    requestAnimationFrame(() => { if (row && top !== undefined) window.scrollBy({ top: row.getBoundingClientRect().top - top, behavior: 'instant' }); });
    requestAnimationFrame(() => { if (id) document.getElementById(id)?.focus({ preventScroll: true }); });
  }, [selection]);
  useEffect(() => {
    const escape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape' || event.defaultPrevented) return;
      if (hovered) dismissHover();
      else closeDictionary();
    };
    window.addEventListener('keydown', escape);
    return () => window.removeEventListener('keydown', escape);
  }, [closeDictionary, dismissHover, hovered]);

  const playSentence = useCallback((row: SentencePair, side: ReaderSide) => {
    const playback = player.getSpeechSnapshot();
    if (playback.sentenceId === row.id && playback.side === side) stop();
    else playPairs([row], side, 'sentence');
  }, [playPairs, stop, player]);
  useEffect(() => { if (hidden) stop(); }, [hidden, stop]);
  function save(word: ReaderSelection) {
    if (focus.some((item) => item.normalized === word.normalized)) return;
    if (focus.length === MAX_FOCUS_PHRASES) { setNotice(t('context_studio.immersive.focus_full')); return; }
    setFocus((items) => addReaderFocus(items, word)); setNotice(t('context_studio.tokens.saved'));
  }
  function edit() {
    speech.stop(); dismissHover(); translationGate.invalidate();
    if (!translation) setTranslationStatus('error');
    onEdit();
  }
  function goToExample(row: SentencePair) {
    closeDictionary();
    requestAnimationFrame(() => {
      root.current?.querySelector<HTMLElement>(`[data-sentence-id="${row.id}"]`)?.scrollIntoView({ block: 'center', behavior: 'instant' });
      const word = row.sourceTokens.find((token) => token.normalized === selection?.normalized);
      if (word) document.getElementById(word.id)?.focus({ preventScroll: true });
    });
  }
  const isSaved = (word: ReaderSelection) => focus.some((item) => item.normalized === word.normalized);
  function toggleTranslation() {
    const rows = root.current?.querySelectorAll<HTMLElement>('[data-sentence-id]');
    const topLimit = chrome.current?.getBoundingClientRect().bottom ?? 0;
    const anchor = Array.from(rows ?? []).find((row) => row.getBoundingClientRect().bottom > topLimit);
    const top = anchor?.getBoundingClientRect().top;
    setShowTranslation((value) => !value);
    try { localStorage.setItem('reader:translation', showTranslation ? 'hidden' : 'shown'); } catch { /* Optional device preference. */ }
    requestAnimationFrame(() => { if (anchor && top !== undefined) window.scrollBy({ top: anchor.getBoundingClientRect().top - top, behavior: 'instant' }); });
  }
  return <div hidden={hidden} ref={root} className={styles.reader}>
    <div className={styles.chrome} ref={chrome}>
      <ReaderHeader session={session} showTranslation={showTranslation} onToggleTranslation={toggleTranslation} onEdit={edit} onReset={() => setResetConfirm(true)} />
      <ReadingAudioPlayer player={player} language={session.nativeLanguage} sourceLanguage={session.sourceLanguage} nativeLanguage={session.nativeLanguage}
        onPlay={playDocument} translationAvailable={!!translation} enabled={!hidden} />
      {follow.showReturn && <div className={styles.audioStatus}><button type="button" className={`${styles.textAction} ${styles.follow}`} onClick={follow.returnToSpeech}>{t('context_studio.redesign.return_playback')}</button></div>}
    </div>
    <div className={styles.notice} role="status">
      {translationStatus === 'loading' && t('context_studio.reader.translating_you_can_already_read_the_original_text')}
      {translationStatus === 'error' && <div className="flex flex-wrap items-center gap-3"><span>{t('context_studio.immersive.translation_error')}</span><button type="button" className={styles.control} onClick={() => void requestTranslation()}>{t('context_studio.immersive.retry')}</button></div>}
      {notice && <p>{notice}</p>}
    </div>
    <div className={`${styles.layout} ${selection ? styles.withDictionary : ''}`}>
      <ContextReadingSurface pairs={pairs} session={session} selection={selection} speech={speech.state} showTranslation={showTranslation}
        sourceAudio={!!speech.sourceVoice} translationAudio={!!speech.translationVoice}
        onSelect={selectWord} onHover={hoverWord} onLeave={leaveWord} onPlay={playSentence} />
      {selection && pair && !hidden && <ContextSelectionPanel session={session} selection={selection} pair={pair} pairs={pairs}
        dictionary={lookup.dictionary} explanation={lookup.explanation} onClose={closeDictionary} onSave={() => save(selection)}
        saved={isSaved(selection)} onExample={goToExample} onPronounce={() => speakWord(selection)} />}
    </div>
    {hovered && !hidden && <WordQuickPopover hovered={hovered} preview={lookup.preview} language={session.nativeLanguage}
      onEnter={enterPopup} onLeave={leaveWord} />}
    {!!focus.length && <ContextFocusSet language={session.nativeLanguage} items={focus} onRemove={(word) => setFocus((items) => items.filter((item) => item !== word))}
      onSelect={(word) => { select(word); requestAnimationFrame(() => document.getElementById(word.tokenId)?.scrollIntoView({ block: 'center' })); }} />}
    <footer className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
      {resetConfirm && <div role="group" className="w-full rounded-lg border p-4"><p>{t('context_studio.immersive.reset_confirm')}</p><button type="button" className={styles.control} onClick={() => setResetConfirm(false)}>{t('context_studio.immersive.cancel')}</button><button type="button" className={`${styles.control} mt-3`} onClick={() => { speech.stop(); onReset(); }}>{t('context_studio.immersive.reset_now')}</button></div>}
    </footer>
  </div>;
}
