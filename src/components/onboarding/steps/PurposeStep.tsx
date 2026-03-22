// PurposeStep.tsx
// This step lets the user pick their main reason for learning the language.
'use client';

import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { PURPOSES } from '../types';

interface PurposeStepProps {
  // The currently selected purpose
  value: string;
  // Any extra notes the user has typed
  details: string;
  // Called when the user selects a purpose
  onChange: (value: string) => void;
  // Called when the user types in the details box
  onDetailsChange: (details: string) => void;
}

export function PurposeStep({
  value,
  details,
  onChange,
  onDetailsChange,
}: PurposeStepProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 py-4">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">{t('onboarding.step2.title')}</h2>
        <p className="text-muted-foreground">
          {t('onboarding.step2.subtitle')}
        </p>
      </div>

      {/* Purpose Grid */}
      <div
        className="grid grid-cols-2 sm:grid-cols-3 gap-3"
        role="radiogroup"
        aria-label={t('onboarding.step2.subtitle')}
      >
        {PURPOSES.map((purpose) => {
          const isSelected = value === purpose.value;

          return (
            <button
              key={purpose.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(purpose.value)}
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
                {t(`onboarding.step2.goals.${purpose.value}`)}
              </span>
            </button>
          );
        })}
      </div>

      {/* Optional Details */}
      <div className="space-y-2">
        <label
          htmlFor="purpose-details"
          className="block text-sm font-medium text-foreground"
        >
          {t('onboarding.tell_us_more')}{' '}
          <span className="text-muted-foreground font-normal">({t('onboarding.optional')})</span>
        </label>
        <textarea
          id="purpose-details"
          value={details}
          onChange={(e) => onDetailsChange(e.target.value)}
          placeholder={t('onboarding.tell_us_more_placeholder')}
          className={cn(
            'w-full min-h-[100px] px-4 py-3 rounded-xl border bg-card',
            'text-foreground placeholder:text-muted-foreground',
            'focus:outline-none focus:ring-2 focus:ring-ring focus:border-primary',
            'resize-none transition-all'
          )}
          maxLength={500}
        />
        <p className="text-xs text-muted-foreground text-right">
          {details.length}/500
        </p>
      </div>
    </div>
  );
}
