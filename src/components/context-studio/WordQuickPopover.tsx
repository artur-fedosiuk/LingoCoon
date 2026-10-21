'use client';

import { createPortal } from 'react-dom';
import * as Popper from '@radix-ui/react-popper';
import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { ReaderSelection } from '@/lib/context-studio/reader-tokens';
import type { ContextExplanation, ContextLanguage } from '@/types/context-studio';
import styles from './reader.module.css';

export type HoveredWord = { word: ReaderSelection; element: HTMLElement };
export default function WordQuickPopover({ hovered, preview, language, onEnter, onLeave }: {
  hovered: HoveredWord; preview: { value: ContextExplanation | null; status: string; retry: () => void }; language: ContextLanguage;
  onEnter: () => void; onLeave: () => void;
}) {
  const { t } = useTranslation(undefined, { lng: language });
  const anchor = useMemo(() => ({ current: hovered.element }), [hovered.element]);
  return createPortal(<Popper.Root>
    <Popper.Anchor virtualRef={anchor} />
    <Popper.Content side="top" sideOffset={6} collisionPadding={12} sticky="always" hideWhenDetached
      className={styles.popup} role="region" aria-label={t('context_studio.tokens.quick')}
      onPointerEnter={onEnter} onPointerLeave={onLeave} onFocus={onEnter} onBlur={(event) => { if (!event.currentTarget.contains(event.relatedTarget)) onLeave(); }}>
      <span className={styles.previewWord}>{hovered.word.text}</span>
      <div role="status" aria-atomic="true" aria-busy={preview.status === 'loading'} lang={language}>
        {preview.status === 'loading' && <span className={styles.previewLoading}>{t('context_studio.immersive.lookup_loading')}</span>}
        {preview.status === 'error' && <><span className={styles.previewLoading}>{t('context_studio.reader.explanation_unavailable')}</span> <button type="button" className={styles.textAction} onClick={preview.retry}>{t('context_studio.immersive.retry')}</button></>}
        {preview.value && <span>{preview.value.translation}</span>}
      </div>
    </Popper.Content>
  </Popper.Root>, document.body);
}
