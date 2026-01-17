/**
 * Filename: src/components/onboarding/steps/LanguageStep.tsx
 * Description: Reusable onboarding step component for selecting native or target languages.
 */
'use client';

import { cn } from '@/lib/utils';
import { LANGUAGES } from '../types';

interface LanguageStepProps {
  /** Title to display */
  title: string;
  /** Subtitle/description */
  subtitle: string;
  /** Currently selected language code */
  value: string;
  /** Callback when a language is selected */
  onChange: (code: string) => void;
  /** Type of language selection */
  type: 'native' | 'target';
  /** Language to exclude from options (e.g., native language when selecting target) */
  excludeLanguage?: string;
}

import { useTranslation } from 'react-i18next';

// Map for translation keys
const LANG_KEY_MAP: Record<string, string> = {
  it: 'it-IT',
  ua: 'ua-UA',
  gb: 'en-US',
  fr: 'fr-FR',
};

/**
 * Language selection step - reusable for both native and target language.
 * Displays a grid of language cards with language names.
 */
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
