'use client';

import { createPortal } from 'react-dom';
import * as Popper from '@radix-ui/react-popper';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { dictionaryTranslations, type ReaderDictionary } from '@/lib/context-studio/reader-dictionary';
import type { ReaderSelection } from '@/lib/context-studio/reader-tokens';
import type { ContextLanguage } from '@/types/context-studio';
import styles from './reader.module.css';

export type HoveredWord = { word: ReaderSelection; element: HTMLElement };
export default function WordQuickPopover({ hovered, entry, language, onEnter, onLeave, onOpen, onSave, saved }: {
  hovered: HoveredWord; entry: ReaderDictionary | null; language: ContextLanguage;
  onEnter: () => void; onLeave: () => void; onOpen: () => void; onSave: () => void; saved: boolean;
}) {
  const { t } = useTranslation(undefined, { lng: language });
  const anchor = useMemo(() => ({ current: hovered.element }), [hovered.element]);
  const translations = dictionaryTranslations(entry);
  return createPortal(<div className="dark">
    <Popper.Root>
      <Popper.Anchor virtualRef={anchor} />
      <Popper.Content side="top" sideOffset={8} collisionPadding={12} sticky="always" hideWhenDetached
        className={styles.popup} role="region" aria-label={t('context_studio.tokens.quick')}
        onPointerEnter={onEnter} onPointerLeave={onLeave} onFocus={onEnter} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) onLeave(); }}>
        <strong className="text-lg">{hovered.word.text}</strong>
        <p className="mt-2 border-t pt-2 font-medium">{translations[0] ?? t('context_studio.tokens.preview_missing')}</p>
        {translations.length > 1 && <p className="mt-1 text-sm text-muted-foreground">{translations.slice(1).join(' · ')}</p>}
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className={styles.control} onClick={onSave} disabled={saved}>{t(saved ? 'context_studio.tokens.saved' : 'context_studio.tokens.save')}</button>
          <button type="button" className={styles.control} onClick={onOpen}>{t('context_studio.tokens.dictionary')}</button>
        </div>
      </Popper.Content>
    </Popper.Root>
  </div>, document.body);
}
