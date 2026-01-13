'use client';

import { cn } from '@/lib/utils';
import { PURPOSES } from '../types';

interface PurposeStepProps {
  /** Currently selected purpose value */
  value: string;
  /** Optional additional details */
  details: string;
  /** Callback when a purpose is selected */
  onChange: (value: string) => void;
  /** Callback when details text changes */
  onDetailsChange: (details: string) => void;
}

/**
 * Purpose selection step - asks why the user is learning.
 * Displays 5 cards with emojis and an optional details textarea.
 */
export function PurposeStep({
  value,
  details,
  onChange,
  onDetailsChange,
}: PurposeStepProps) {
  return (
    <div className="space-y-6 py-4">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Why are you learning?</h2>
        <p className="text-muted-foreground">
          This helps us tailor content to your goals
        </p>
      </div>

      {/* Purpose Grid */}
      <div
        className="grid grid-cols-2 sm:grid-cols-3 gap-3"
        role="radiogroup"
        aria-label="Select your learning purpose"
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
                {purpose.title}
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
          Tell us more{' '}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </label>
        <textarea
          id="purpose-details"
          value={details}
          onChange={(e) => onDetailsChange(e.target.value)}
          placeholder="E.g., I want to get a job in Italy, I'm preparing for a trip to Japan..."
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
