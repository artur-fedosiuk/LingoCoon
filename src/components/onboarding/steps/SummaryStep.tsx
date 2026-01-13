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
export function SummaryStep({
  data,
  onEdit,
  onComplete,
  isLoading,
}: SummaryStepProps) {
  // Helper to get display names from codes
  const getLanguageName = (code: string) =>
    LANGUAGES.find((l) => l.code === code)?.name || code;



  const getLevelTitle = (value: string) =>
    LEVELS.find((l) => l.value === value)?.title || value;

  const getPurposeTitle = (value: string) =>
    PURPOSES.find((p) => p.value === value)?.title || value;

  // Summary items with their step numbers for editing
  const summaryItems = [
    {
      label: 'Native language',
      value: getLanguageName(data.native_language),
      step: 1,
    },
    {
      label: 'Learning',
      value: getLanguageName(data.target_language),
      step: 2,
    },
    {
      label: 'Current level',
      value: getLevelTitle(data.current_level),
      step: 3,
    },
    {
      label: 'Purpose',
      value: getPurposeTitle(data.learning_purpose),
      step: 4,
    },
    ...(data.nickname
      ? [
        {
          label: 'Nickname',
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
        <h2 className="text-2xl font-bold">You're all set!</h2>
        <p className="text-muted-foreground">
          Review your choices before we begin
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
              aria-label={`Edit ${item.label}`}
            >
              <Pencil className="h-4 w-4" />
            </Button>
          </div>
        ))}

        {/* Additional details if present */}
        {data.learning_purpose_details && (
          <div className="p-4 rounded-xl bg-muted/50 border">
            <p className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
              Additional details
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
              Setting up your account...
            </>
          ) : (
            <>
              <Check className="h-5 w-5" />
              Complete Setup
            </>
          )}
        </Button>
      </div>

      <p className="text-xs text-muted-foreground text-center">
        You can always change these in settings later
      </p>
    </div>
  );
}
