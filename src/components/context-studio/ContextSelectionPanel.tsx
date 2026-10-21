'use client';

import { useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { Volume2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { DICTIONARY_PROVIDERS, dictionaryTranslations, type ReaderDictionary } from '@/lib/context-studio/reader-dictionary';
import { currentTextExamples, type ReaderSelection, type SentencePair } from '@/lib/context-studio/reader-tokens';
import type { ContextExplanation, ContextSession } from '@/types/context-studio';
import InteractiveSentence from './InteractiveSentence';
import styles from './reader.module.css';

const subscribe = (listener: () => void) => {
  const query = window.matchMedia('(max-width: 1199px)');
  query.addEventListener('change', listener);
  return () => query.removeEventListener('change', listener);
};
const isNarrow = () => window.matchMedia('(max-width: 1199px)').matches;
type Props = {
  session: ContextSession; selection: ReaderSelection; pair: SentencePair; pairs: SentencePair[];
  dictionary: { value: ReaderDictionary | null; status: string; retry: () => void };
  explanation: { value: ContextExplanation | null; status: string; retry: () => void };
  onPronounce: () => void; onClose: () => void; onSave: () => void; saved: boolean; onExample: (pair: SentencePair) => void;
};
export default function ContextSelectionPanel(props: Props) {
  const { t } = useTranslation(undefined, { lng: props.session.nativeLanguage });
  const narrow = useSyncExternalStore(subscribe, isNarrow, () => false);
  const dialog = useRef<HTMLDialogElement>(null);
  const [limit, setLimit] = useState(4);
  const [height, setHeight] = useState(55);
  const drag = useRef<{ y: number; height: number } | null>(null);
  const dragged = useRef(false);
  const examples = currentTextExamples(props.pairs, props.selection.normalized);
  const explanation = props.explanation.value;
  useEffect(() => {
    const element = dialog.current;
    const previous = document.body.style.overflow;
    if (narrow && element && !element.open) { element.showModal(); document.body.style.overflow = 'hidden'; }
    return () => { element?.close(); document.body.style.overflow = previous; };
  }, [narrow]);
  const content = <>
    <header className={styles.dictionaryHeading}>
      <div className="min-w-0"><p className="mb-1 text-xs uppercase tracking-widest text-muted-foreground">{t('context_studio.tokens.dictionary')}</p>
        <h2 id="reader-dictionary-title" lang={props.session.sourceLanguage} className="text-2xl font-semibold">{props.selection.text}</h2>
        <p lang={props.session.nativeLanguage} className="mt-1 text-sm">{dictionaryTranslations(props.dictionary.value).join(', ')}</p>
      </div>
      <button type="button" className={styles.iconButton} aria-label={t('context_studio.immersive.close')} onClick={props.onClose}><X size={18} aria-hidden /></button>
    </header>
    <div className={styles.dictionaryContent}>
      <div className={styles.dictionaryActions}>
        <button type="button" className={`${styles.control} ${styles.primary}`} onClick={props.onSave} disabled={props.saved}>{t(props.saved ? 'context_studio.tokens.saved' : 'context_studio.tokens.save')}</button>
        <button type="button" className={styles.iconButton} onClick={props.onPronounce} aria-label={t('context_studio.redesign.pronounce')}><Volume2 size={18} aria-hidden /></button>
      </div>
      <section aria-busy={props.explanation.status === 'loading'}>
        <h3 className="mb-2 font-semibold">{t('context_studio.reader.meaning_here')}</h3>
        {props.explanation.status === 'loading' && <p role="status" className="text-sm text-muted-foreground">{t('context_studio.immersive.lookup_loading')}</p>}
        {props.explanation.status === 'error' && <div role="status"><p className="text-sm">{t('context_studio.reader.explanation_unavailable')}</p><button type="button" className={styles.control} onClick={props.explanation.retry}>{t('context_studio.immersive.retry')}</button></div>}
        {explanation && <div lang={props.session.nativeLanguage} className="space-y-2 text-sm leading-6"><p className="font-semibold">{explanation.translation}</p><p>{explanation.meaning}</p>{explanation.grammar && <p className="text-muted-foreground">{explanation.grammar}</p>}</div>}
      </section>
      <section><h3 className="mb-2 font-semibold">{t('context_studio.tokens.current_sentence')}</h3>
        <InteractiveSentence tokens={props.pair.sourceTokens} language={props.session.sourceLanguage} selection={props.selection} spokenId={null} />
        <p lang={props.session.nativeLanguage} className="mt-2 text-sm leading-6 text-muted-foreground">{props.pair.translatedText ?? t('context_studio.tokens.no_translation')}</p>
      </section>
      <section aria-busy={props.dictionary.status === 'loading'}><h3 className="mb-2 font-semibold">{t('context_studio.tokens.definitions')}</h3>
        <p className="mb-2 text-xs text-muted-foreground">{t(props.dictionary.status === 'ready' ? 'context_studio.tokens.ai_dictionary' : 'context_studio.tokens.local_dictionary')}</p>
        {props.dictionary.value?.senses.map((sense, index) => <div key={index} lang={props.session.nativeLanguage} className="mb-3 text-sm leading-6"><p><span className="text-muted-foreground">({sense.partOfSpeech})</span> {sense.translations.join(', ')}</p>{sense.definition && <p className="mt-1">{sense.definition}</p>}</div>)}
        {props.dictionary.status === 'loading' && <p role="status" className="text-sm text-muted-foreground">{t('context_studio.tokens.dictionary_loading')}</p>}
        {props.dictionary.status === 'error' && <div role="status"><p className="text-sm">{t('context_studio.tokens.dictionary_error')}</p><button type="button" className={styles.control} onClick={props.dictionary.retry}>{t('context_studio.immersive.retry')}</button></div>}
      </section>
      <details><summary className="text-sm">{t('context_studio.tokens.sources')}</summary><div className="flex flex-wrap gap-2">{DICTIONARY_PROVIDERS.map((provider) => <a key={provider.id} className={styles.control} href={provider.origin + encodeURIComponent(props.selection.normalized)} target="_blank" rel="noopener noreferrer">{provider.label} ↗</a>)}</div></details>
      <section><h3 className="mb-2 font-semibold">{t('context_studio.tokens.examples', { count: examples.length })}</h3><ol className="space-y-4">{examples.slice(0, limit).map((pair) => <li key={pair.id}>
        <InteractiveSentence tokens={pair.sourceTokens} language={props.session.sourceLanguage} selection={props.selection} spokenId={null} />
        <button type="button" className="mt-1 min-h-11 text-sm underline underline-offset-4" onClick={() => props.onExample(pair)}>{t('context_studio.tokens.go_sentence')}</button>
      </li>)}</ol>{examples.length > limit && <button type="button" className={styles.control} onClick={() => setLimit((value) => value + 8)}>{t('context_studio.tokens.more')}</button>}</section>
      {explanation && <section><h3 className="mb-2 font-semibold">{t('context_studio.reader.another_example')} · AI</h3><p lang={props.session.sourceLanguage} className="text-sm leading-6">{explanation.example}</p><p lang={props.session.nativeLanguage} className="mt-2 text-sm leading-6 text-muted-foreground">{explanation.exampleTranslation}</p></section>}
    </div>
  </>;
  if (narrow) return <dialog ref={dialog} style={{ height: `${height}dvh` }} className={styles.drawer} aria-labelledby="reader-dictionary-title" onCancel={(event) => { event.preventDefault(); props.onClose(); }}>
    <button type="button" className={styles.sheetHandle} aria-label={t(height < 70 ? 'context_studio.redesign.expand_dictionary' : 'context_studio.redesign.collapse_dictionary')}
      onClick={(event) => { if (!dragged.current || event.detail === 0) setHeight((value) => value < 70 ? 88 : 55); dragged.current = false; }}
      onPointerDown={(event) => { dragged.current = false; drag.current = { y: event.clientY, height }; event.currentTarget.setPointerCapture(event.pointerId); }}
      onPointerMove={(event) => { if (drag.current) { if (Math.abs(drag.current.y - event.clientY) > 8) dragged.current = true; setHeight(Math.max(40, Math.min(90, drag.current.height + (drag.current.y - event.clientY) / window.innerHeight * 100))); } }}
      onPointerUp={(event) => { drag.current = null; event.currentTarget.releasePointerCapture(event.pointerId); }}
      onPointerCancel={() => { drag.current = null; }} />
    {content}</dialog>;
  return <aside className={styles.dictionary} aria-labelledby="reader-dictionary-title">{content}</aside>;
}
