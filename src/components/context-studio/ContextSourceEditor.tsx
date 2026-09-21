'use client';

import { useTranslation } from 'react-i18next';
import { CONTEXT_LANGUAGES, countWords, MAX_SOURCE_CHARACTERS, MAX_SOURCE_WORDS, MIN_SOURCE_WORDS } from '@/lib/context-studio/reader-contract';
import type { ContextLanguage } from '@/types/context-studio';

type Props = {
  value: string; onChange: (value: string) => void;
  sourceLanguage: ContextLanguage | ''; nativeLanguage: ContextLanguage | '';
  onSourceLanguage: (value: ContextLanguage | '') => void;
  onNativeLanguage: (value: ContextLanguage | '') => void;
};
export default function ContextSourceEditor(props: Props) {
  const { t } = useTranslation(undefined, { lng: props.nativeLanguage || undefined });
  const words = countWords(props.value);
  return <div className="space-y-6">
    <div className="grid gap-4 sm:grid-cols-2">
      {(['source', 'native'] as const).map((kind) => <div key={kind}>
        <label className="mb-2 block text-sm font-semibold" htmlFor={`context-${kind}`}>{t(`context_studio.immersive.${kind}_language`)}</label>
        <select id={`context-${kind}`} className="min-h-11 w-full rounded-lg border border-input bg-card px-3 focus-visible:outline-2" value={kind === 'source' ? props.sourceLanguage : props.nativeLanguage} onChange={(event) => (kind === 'source' ? props.onSourceLanguage : props.onNativeLanguage)(event.target.value as ContextLanguage | '')}>
          <option value="">{t('context_studio.immersive.choose_language')}</option>
          {CONTEXT_LANGUAGES.map((language) => <option key={language} value={language}>{t(`context_studio.immersive.languages.${language}`)}</option>)}
        </select>
      </div>)}
    </div>
    <p className="text-sm leading-6 text-muted-foreground">{t('context_studio.immersive.language_help')}</p>
    <div>
      <label htmlFor="context-source-text" className="mb-2 block text-sm font-semibold">{t('context_studio.reader.text_to_learn_from')}</label>
      <textarea id="context-source-text" value={props.value} onChange={(event) => props.onChange(event.target.value)} rows={12} maxLength={MAX_SOURCE_CHARACTERS} className="w-full rounded-lg border border-input bg-card p-4 text-base leading-7 focus-visible:outline-2" aria-describedby="context-source-help" />
      <p id="context-source-help" className="mt-2 text-sm leading-6 text-muted-foreground">{t('context_studio.reader.word_count', { count: words, max: MAX_SOURCE_WORDS })} · {t('context_studio.reader.source_help', { min: MIN_SOURCE_WORDS, max: MAX_SOURCE_WORDS })}</p>
    </div>
  </div>;
}
