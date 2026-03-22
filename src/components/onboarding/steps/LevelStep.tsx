// LevelStep.tsx
// This step lets the user choose their current proficiency level in the target language.
'use client';

import { cn } from '@/lib/utils';
import { LEVELS } from '../types';
import { useTranslation } from 'react-i18next';

interface LevelStepProps {
  // The currently selected level
  value: string;
  // Called when the user picks a level
  onChange: (value: string) => void;
}

export function LevelStep({ value, onChange }: LevelStepProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 py-4">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">{t('onboarding.step3.title')}</h2>
        <p className="text-muted-foreground">
          {t('onboarding.step3.subtitle')}
        </p>
      </div>

      {/* Levels List */}
      <div className="space-y-3">
        {LEVELS.map((level) => {
          const isSelected = value === level.value;

          return (
            <button
              key={level.value}
              onClick={() => onChange(level.value)}
              className={cn(
                'w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all text-left',
                'hover:border-primary/50 hover:bg-muted/50',
                isSelected
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border bg-card'
              )}
            >
              <div>
                <h3
                  className={cn(
                    'font-semibold',
                    isSelected ? 'text-primary' : 'text-foreground'
                  )}
                >
                  {t(`onboarding.step3.levels.${level.value}`)}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t(`onboarding.step3.levels.${level.value}_desc`)}
                </p>
              </div>
              <div
                className={cn(
                  'h-5 w-5 rounded-full border-2 flex items-center justify-center ml-4',
                  isSelected
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-muted-foreground'
                )}
              >
                {isSelected && <div className="h-2.5 w-2.5 rounded-full bg-white" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
