/**
 * Filename: src/components/onboarding/ProgressBar.tsx
 * Description: Visual progress indicator component showing the current step in the onboarding flow.
 */
'use client';

import { useTranslation } from 'react-i18next';
import { Progress } from '@/components/ui/progress';

interface ProgressBarProps {
  /** Current step index (0-based) */
  currentStep: number;
  /** Total number of steps */
  totalSteps: number;
}

// Map step index to translation label key suffix or full key
// 0: Welcome, 1: Native, 2: Target, 3: Level, 4: Purpose, 5: Nickname, 6: Summary
const STEP_LABEL_KEYS = [
  'welcome',
  'native_label',
  'target_label',
  'level_label',
  'purpose_label',
  'nickname_label',
  'summary_label'
];

/**
 * Visual progress indicator for the onboarding flow.
 * Shows current step label and an animated progress bar.
 */
export function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  const { t } = useTranslation();
  // Calculate progress percentage (step 0 = 0%, last step = 100%)
  const progressPercentage = (currentStep / (totalSteps - 1)) * 100;

  // Derive label
  const key = STEP_LABEL_KEYS[currentStep] || 'steps';
  // Use 'onboarding.step_labels.' + key
  // Add missing keys: onboarding.step_labels.welcome, etc.

  return (
    <div className="w-full space-y-2" role="region" aria-label={t('onboarding.progress_region')}>
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">
          {t(`onboarding.step_labels.${key}`)}
        </span>
        <span className="text-muted-foreground" aria-live="polite">
          {t('onboarding.step_indicator', { current: currentStep + 1, total: totalSteps })}
        </span>
      </div>
      <Progress
        value={progressPercentage}
        className="h-2"
        aria-label={t('onboarding.progress_aria', { current: currentStep + 1, total: totalSteps })}
        aria-valuenow={currentStep + 1}
        aria-valuemin={1}
        aria-valuemax={totalSteps}
      />
    </div>
  );
}
