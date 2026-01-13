'use client';

import { Progress } from '@/components/ui/progress';
import { STEP_LABELS } from './types';

interface ProgressBarProps {
  /** Current step index (0-based) */
  currentStep: number;
  /** Total number of steps */
  totalSteps: number;
}

/**
 * Visual progress indicator for the onboarding flow.
 * Shows current step label and an animated progress bar.
 */
export function ProgressBar({ currentStep, totalSteps }: ProgressBarProps) {
  // Calculate progress percentage (step 0 = 0%, last step = 100%)
  const progressPercentage = (currentStep / (totalSteps - 1)) * 100;

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">
          {STEP_LABELS[currentStep] || `Step ${currentStep + 1}`}
        </span>
        <span className="text-muted-foreground">
          {currentStep + 1} of {totalSteps}
        </span>
      </div>
      <Progress 
        value={progressPercentage} 
        className="h-2"
        aria-label={`Onboarding progress: step ${currentStep + 1} of ${totalSteps}`}
      />
    </div>
  );
}
