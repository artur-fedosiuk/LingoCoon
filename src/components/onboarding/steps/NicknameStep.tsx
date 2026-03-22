// NicknameStep.tsx
// This step asks the user to choose a nickname. It is optional and can be skipped.
'use client';

import { useTranslation } from 'react-i18next';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { User } from 'lucide-react';

interface NicknameStepProps {
  // The current nickname text
  value: string;
  // Called when the user types in the input
  onChange: (value: string) => void;
  // Called when the user clicks Skip
  onSkip: () => void;
}

export function NicknameStep({ value, onChange, onSkip }: NicknameStepProps) {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 py-4">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-2">
          <User className="w-8 h-8 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold">{t('onboarding.nickname_step.title')}</h2>
        <p className="text-muted-foreground">
          {t('onboarding.nickname_step.subtitle')}
        </p>
      </div>

      {/* Input */}
      <div className="max-w-sm mx-auto space-y-4">
        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={t('onboarding.nickname_step.placeholder')}
          className="text-center text-lg py-6"
          maxLength={30}
          aria-label={t('onboarding.nickname_step.aria_label')}
          autoFocus
        />

        <p className="text-xs text-muted-foreground text-center">
          {t('onboarding.nickname_step.helper')}
        </p>
      </div>

      {/* Skip Option */}
      <div className="text-center">
        <Button
          variant="ghost"
          onClick={onSkip}
          className="text-muted-foreground"
        >
          {t('onboarding.skip')}
        </Button>
      </div>
    </div>
  );
}
