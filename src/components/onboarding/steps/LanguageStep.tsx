// LanguageStep.tsx
// This step lets the user pick a language (either their native language or the one they want to learn).
'use client';

import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import { LANGUAGES, LANG_KEY_MAP } from '../types';

interface LanguageStepProps {
  // Text shown at the top of the step
  title: string;
  // Description shown below the title
  subtitle: string;
  // The currently selected language code
  value: string;
  // Called when the user clicks a language
  onChange: (code: string) => void;
  // Whether this is for native or target language
  type: 'native' | 'target';
  // A language code to hide from the list (so the user can't pick the same language twice)
  excludeLanguage?: string;
}

// Shows all available languages as clickable cards
export function LanguageStep({
  title,
  subtitle,
  value,
  onChange,
  type,
  excludeLanguage,
}: LanguageStepProps) {
  const { t } = useTranslation();

  // Filter out excluded language if provided
  const availableLanguages = excludeLanguage
    ? LANGUAGES.filter((lang) => lang.code !== excludeLanguage)
    : LANGUAGES;

  return (
    <div className="space-y-6 py-4">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-muted-foreground">{subtitle}</p>
      </div>

      {/* Language Grid */}
      <div
        className="grid grid-cols-2 sm:grid-cols-3 gap-3"
        role="radiogroup"
        aria-label={
          type === 'native'
            ? t('onboarding.step1.native_language')
            : t('onboarding.step1.target_language')
        }
      >
        {availableLanguages.map((language) => {
          const isSelected = value === language.code;
          const nameKey = LANG_KEY_MAP[language.code] || 'en-US';

          return (
            <button
              key={language.code}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(language.code)}
              className={cn(
                'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all',
                'hover:border-primary/50 hover:bg-muted/50',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                isSelected
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border bg-card'
              )}
            >
              <span
                className={cn(
                  'font-medium text-sm',
                  isSelected ? 'text-primary' : 'text-foreground'
                )}
              >
                {t(`languages.${nameKey}`)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
