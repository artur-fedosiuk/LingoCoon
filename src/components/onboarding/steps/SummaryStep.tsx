/**
 * Filename: src/components/onboarding/steps/SummaryStep.tsx
 * Description: Final onboarding step that summarizes user choices and allows for editing before submission.
 */
'use client';

import { Button } from '@/components/ui/button';
import { Pencil, Check, Loader2 } from 'lucide-react';
import { LANGUAGES, LEVELS, PURPOSES } from '../types';
import type { OnboardingFormData } from '../types';

interface SummaryStepProps {
  /** All collected form data */
  data: OnboardingFormData;
  /** Callback to edit a specific step */
  onEdit: (step: number) => void;
  /** Callback to complete onboarding */
  onComplete: () => void;
  /** Whether save is in progress */
  isLoading: boolean;
}

/**
 * Summary step - displays all collected data with edit options.
 * Final step before completing onboarding.
 */
import { useTranslation } from 'react-i18next';

// ... existing imports

// Map for translation keys (should be shared or duplicated if not exporting)
const LANG_KEY_MAP: Record<string, string> = {
  it: 'it-IT',
  ua: 'ua-UA',
  gb: 'en-US',
  fr: 'fr-FR',
};

export function SummaryStep({
  data,
  onEdit,
  onComplete,
  isLoading,
}: SummaryStepProps) {
  const { t } = useTranslation();

  // Helper to get display names from codes
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
