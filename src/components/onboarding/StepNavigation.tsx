'use client';

import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, Loader2 } from 'lucide-react';

interface StepNavigationProps {
  /** Callback when back button is clicked */
  onBack: () => void;
  /** Callback when next button is clicked */
  onNext: () => void;
  /** Whether navigation forward is allowed */
  canGoNext: boolean;
  /** Whether navigation backward is allowed */
  canGoBack: boolean;
  /** Whether a save operation is in progress */
  isLoading?: boolean;
  /** Whether this is the final step */
  isLastStep?: boolean;
}

/**
 * Navigation buttons for the onboarding flow.
 * Provides back/next navigation with loading and disabled states.
 */
export function StepNavigation({
  onBack,
  onNext,
  canGoNext,
  canGoBack,
  isLoading = false,
  isLastStep = false,
}: StepNavigationProps) {
  return (
    <div className="flex items-center justify-between gap-4 pt-6">
      <Button
        variant="ghost"
        onClick={onBack}
        disabled={!canGoBack || isLoading}
        className="gap-2"
        aria-label="Go to previous step"
      >
        <ArrowLeft className="h-4 w-4" />
        <span className="hidden sm:inline">Back</span>
      </Button>

      <Button
        onClick={onNext}
        disabled={!canGoNext || isLoading}
        className="gap-2 min-w-[140px]"
        aria-label={isLastStep ? 'Complete setup' : 'Go to next step'}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Saving...</span>
          </>
        ) : (
          <>
            <span>{isLastStep ? 'Complete Setup' : 'Continue'}</span>
            {!isLastStep && <ArrowRight className="h-4 w-4" />}
          </>
        )}
      </Button>
    </div>
  );
}
