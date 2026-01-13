'use client';

import { cn } from '@/lib/utils';
import { LEVELS } from '../types';

interface LevelStepProps {
  /** Currently selected level value */
  value: string;
  /** Callback when a level is selected */
  onChange: (value: string) => void;
}

/**
 * Level selection step - asks about current proficiency.
 * Displays 4 large cards with titles and descriptions.
 */
export function LevelStep({ value, onChange }: LevelStepProps) {
  return (
    <div className="space-y-6 py-4">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">What's your current level?</h2>
        <p className="text-muted-foreground">
          This helps us personalize your learning path
        </p>
      </div>

      {/* Level Grid */}
      <div
        className="grid grid-cols-1 sm:grid-cols-2 gap-4"
        role="radiogroup"
        aria-label="Select your current proficiency level"
      >
        {LEVELS.map((level) => {
          const isSelected = value === level.value;

          return (
            <button
              key={level.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              onClick={() => onChange(level.value)}
              className={cn(
                'flex flex-col items-start text-left p-5 rounded-xl border-2 transition-all',
                'hover:border-primary/50 hover:bg-muted/50',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                isSelected
                  ? 'border-primary bg-primary/5 shadow-sm'
                  : 'border-border bg-card'
              )}
            >
              <span
                className={cn(
                  'font-semibold text-lg',
                  isSelected ? 'text-primary' : 'text-foreground'
                )}
              >
                {level.title}
              </span>
              <span className="text-sm text-muted-foreground mt-1">
                {level.description}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
