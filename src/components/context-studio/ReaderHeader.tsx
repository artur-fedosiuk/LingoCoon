'use client';

import { ArrowLeft, Eye, EyeOff, MoreHorizontal } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import type { ContextSession } from '@/types/context-studio';
import styles from './reader.module.css';

export default function ReaderHeader({ session, showTranslation, onToggleTranslation, onEdit, onReset }: {
  session: ContextSession; showTranslation: boolean; onToggleTranslation: () => void; onEdit: () => void; onReset: () => void;
}) {
  const { t } = useTranslation(undefined, { lng: session.nativeLanguage });
  const menu = useRef<HTMLDetailsElement>(null);
  useEffect(() => {
    const close = (event: Event) => {
      if (!menu.current?.open) return;
      if (event instanceof KeyboardEvent) {
        if (event.key !== 'Escape') return;
        event.preventDefault();
        menu.current.querySelector('summary')?.focus();
      } else if (event.target instanceof Node && menu.current.contains(event.target)) return;
      menu.current.open = false;
    };
    document.addEventListener('keydown', close);
    document.addEventListener('pointerdown', close);
    return () => { document.removeEventListener('keydown', close); document.removeEventListener('pointerdown', close); };
  }, []);
  return <header className={styles.header}>
    <a href="/dashboard" className={styles.backLink} aria-label={t('context_studio.immersive.back')}><ArrowLeft size={18} aria-hidden /><span>Context Studio</span></a>
    <span className={styles.languages}>{t(`context_studio.immersive.languages.${session.sourceLanguage}`)} <span aria-hidden>→</span> {t(`context_studio.immersive.languages.${session.nativeLanguage}`)}</span>
    <button type="button" className={styles.iconButton} aria-pressed={showTranslation} aria-label={t(showTranslation ? 'context_studio.redesign.hide_translation' : 'context_studio.redesign.show_translation')} title={t(showTranslation ? 'context_studio.redesign.hide_translation' : 'context_studio.redesign.show_translation')} onClick={onToggleTranslation}>
      {showTranslation ? <Eye size={19} aria-hidden /> : <EyeOff size={19} aria-hidden />}
    </button>
    <details ref={menu} className={styles.more}>
      <summary className={styles.iconButton} aria-label={t('context_studio.redesign.more')}><MoreHorizontal size={20} aria-hidden /></summary>
      <div className={styles.morePanel}>
        <button type="button" className={styles.menuAction} onClick={() => { if (menu.current) menu.current.open = false; onEdit(); }}>{t('context_studio.reader.edit_text')}</button>
        <button type="button" className={styles.menuAction} onClick={() => { if (menu.current) menu.current.open = false; onReset(); }}>{t('context_studio.reader.reset')}</button>
        <details><summary>{t('context_studio.redesign.keyboard')}</summary><p id="reader-keyboard-help">{t('context_studio.tokens.keyboard')}</p><p>{t('context_studio.redesign.player_shortcuts')}</p></details>
        <details><summary>{t('context_studio.redesign.about_audio')}</summary><p>{t('context_studio.audio.privacy')}</p><p>{t('context_studio.redesign.timing_note')}</p></details>
      </div>
    </details>
  </header>;
}
