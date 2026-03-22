// SummaryStep.tsx
// This is the last step. It shows a summary of all the user's choices before saving.
'use client';

import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Pencil, Check, Loader2 } from 'lucide-react';
import { LANGUAGES, LEVELS, PURPOSES, LANG_KEY_MAP } from '../types';
import type { OnboardingFormData } from '../types';

interface SummaryStepProps {
  // All the data the user filled in during onboarding
  data: OnboardingFormData;
  // Called when the user clicks the edit button for a step
  onEdit: (step: number) => void;
  // Called when the user clicks the finish button
  onComplete: () => void;
  // True while we are saving the data
  isLoading: boolean;
}

export function SummaryStep({
  data,
  onEdit,
  onComplete,
  isLoading,
}: SummaryStepProps) {
  const { t } = useTranslation();

  // Helper functions to turn codes into readable names
  const getLanguageName = (code: string) => {
    const key = LANG_KEY_MAP[code] || 'en-US';
    return t(`languages.${key}`);
  };

  const getLevelTitle = (value: string) =>
    t(`onboarding.step3.levels.${value}`);

  const getPurposeTitle = (value: string) =>
    t(`onboarding.step2.goals.${value}`);

  // Summary items with their step numbers for editing
  const summaryItems = [
    {
      label: t('onboarding.step1.native_language'),
      value: getLanguageName(data.native_language),
      step: 1,
    },
    {
      label: t('onboarding.step1.target_language'),
      value: getLanguageName(data.target_language),
      step: 2,
    },
    {
      label: t('onboarding.summary.level'),
      value: getLevelTitle(data.current_level),
      step: 3,
    },
    {
      label: t('onboarding.summary.purpose'),
      value: getPurposeTitle(data.learning_purpose),
      step: 4,
    },
    ...(data.nickname
      ? [
        {
          label: t('onboarding.summary.nickname'),
          value: data.nickname,
          step: 5,
        },
      ]
      : []),
  ];

  return (
    <div className="space-y-6 py-4">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 mx-auto mb-4 rounded-lg bg-black flex items-center justify-center">
          <span className="text-5xl font-bold text-white">L</span>
        </div>
        <h2 className="text-2xl font-bold">{t('onboarding.summary.title')}</h2>
        <p className="text-muted-foreground">
          {t('onboarding.summary.subtitle')}
        </p>
      </div>

      {/* Summary List */}
      <div className="space-y-3 max-w-md mx-auto">
        {summaryItems.map((item) => (
          <div
            key={item.label}
            className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border"
          >
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">
                {item.label}
              </p>
              <p className="font-medium">{item.value}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onEdit(item.step)}
              disabled={isLoading}
              aria-label={`${t('common.edit')} ${item.label}`}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        ))}

        {/* Additional details if present */}
        {data.learning_purpose_details && (
          <div className="p-4 rounded-xl bg-muted/50 border">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              {t('onboarding.summary.additional_details')}
            </p>
            <p className="text-sm text-foreground">
              {data.learning_purpose_details}
            </p>
          </div>
        )}
      </div>

      {/* Complete Button */}
      <div className="max-w-md mx-auto pt-4">
        <Button
          size="lg"
          onClick={onComplete}
          disabled={isLoading}
          className="w-full text-lg py-6 gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin" />
              {t('onboarding.creating_account')}
            </>
          ) : (
            <>
              <Check className="h-5 w-5" />
              {t('common.complete')}
            </>
          )}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        {t('onboarding.summary.change_later')}
      </p>
    </div>
  );
}
