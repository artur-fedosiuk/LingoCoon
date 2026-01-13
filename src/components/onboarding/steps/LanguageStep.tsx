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

/**
 * Language selection step - reusable for both native and target language.
 * Displays a grid of language cards with flags.
 */
export function LanguageStep({
  title,
  subtitle,
  value,
  onChange,
  type,
  excludeLanguage,
}: LanguageStepProps) {
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
        aria-label={`Select your ${type} language`}
      >
        {availableLanguages.map((language) => {
          const isSelected = value === language.code;

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
              <span className="text-4xl" role="img" aria-label={`${language.name} flag`}>
                {language.flag}
              </span>
              <span
                className={cn(
                  'font-medium text-sm',
                  isSelected ? 'text-primary' : 'text-foreground'
                )}
              >
                {language.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
