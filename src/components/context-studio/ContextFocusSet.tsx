'use client';

import { useTranslation } from 'react-i18next';
import type { ReaderSelection } from '@/lib/context-studio/reader-tokens';
import type { ContextLanguage } from '@/types/context-studio';
import styles from './reader.module.css';

export default function ContextFocusSet({ language, items, onRemove, onSelect }: {
  language: ContextLanguage; items: ReaderSelection[]; onRemove: (word: ReaderSelection) => void; onSelect: (word: ReaderSelection) => void;
}) {
  const { t } = useTranslation(undefined, { lng: language });
  return <section className="mt-6 border-t py-5" aria-label={t('context_studio.reader.focus_phrases')}>
    <h2 className="mb-3 text-sm font-semibold">{t('context_studio.reader.focus_phrases')} · {items.length}/3</h2>
    <ul className="flex flex-wrap gap-2">{items.map((word) => <li key={word.tokenId} className="flex max-w-full items-center rounded-lg border">
      <button type="button" className="min-h-11 break-words px-3 text-sm underline" onClick={() => onSelect(word)}>{word.text}</button>
      <button type="button" className={styles.control} aria-label={t('context_studio.reader.remove_focus', { phrase: word.text })} onClick={() => onRemove(word)}>×</button>
    </li>)}</ul>
    {!items.length && <p className="text-sm text-muted-foreground">{t('context_studio.reader.save_up_to_three_expressions_you_want_to_reuse_after_reading')}</p>}
  </section>;
}
