// OnboardingFlow.tsx
// This is the main component that controls the onboarding steps.
// It keeps track of which step the user is on and saves the form data.
'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { useProfile } from '@/hooks/useProfile';
import { createClient } from '@/lib/supabase/client';
import LanguageSelector from '@/components/LanguageSelector';
import { ProgressBar } from './ProgressBar';
import { StepNavigation } from './StepNavigation';
import { WelcomeStep } from './steps/WelcomeStep';
import { LanguageStep } from './steps/LanguageStep';
import { LevelStep } from './steps/LevelStep';
import { PurposeStep } from './steps/PurposeStep';
import { NicknameStep } from './steps/NicknameStep';
import { SummaryStep } from './steps/SummaryStep';
import { TOTAL_STEPS, INITIAL_FORM_DATA } from './types';
import type { OnboardingFormData } from './types';

export function OnboardingFlow() {
  const router = useRouter();
  const { completeOnboarding } = useProfile();
  const { t } = useTranslation();

  // Which step we are on (starts at 0)
  const [currentStep, setCurrentStep] = useState(0);

  // All the data the user fills in across the steps
  const [formData, setFormData] = useState<OnboardingFormData>(INITIAL_FORM_DATA);

  // True while we are saving the data to the server
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Update one field in the form data
  const updateField = useCallback(
    <K extends keyof OnboardingFormData>(field: K, value: OnboardingFormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    },
    []
  );

  // Check if the current step has all required info filled in
  const isStepValid = useCallback((): boolean => {
    switch (currentStep) {
      case 0: // Welcome - always valid
        return true;
      case 1: // Native language
        return formData.native_language !== '';
      case 2: // Target language
        return formData.target_language !== '';
      case 3: // Level
        return formData.current_level !== '';
      case 4: // Purpose
        return formData.learning_purpose !== '';
      case 5: // Nickname - always valid
        return true;
      case 6: // Summary - always valid if we got here
        return true;
      default:
        return false;
    }
  }, [currentStep, formData]);

  // Go to the next step if the current step is valid
  const goToNextStep = useCallback(() => {
    if (currentStep < TOTAL_STEPS - 1 && isStepValid()) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep, isStepValid]);

  // Go back to the previous step
  const goToPrevStep = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  // Jump directly to a specific step (used when editing from the summary screen)
  const goToStep = useCallback((step: number) => {
    if (step >= 0 && step < TOTAL_STEPS) {
      setCurrentStep(step);
    }
  }, []);

  // Called when the user finishes all steps and clicks submit
  const handleComplete = useCallback(async () => {
    if (!isStepValid()) {
      toast.error(t('onboarding.errors.invalid_data'));
      return;
    }

    setIsSubmitting(true);

    try {
      const dataToSave = {
        nickname: formData.nickname || 'Learner',
        native_language: formData.native_language,
        target_language: formData.target_language,
        current_level: formData.current_level,
        learning_purpose: formData.learning_purpose,
        learning_purpose_details: formData.learning_purpose_details || undefined,
      };

      // Check if user is logged in
      const supabase = createClient();
      const { data: { session } } = await supabase.auth.getSession();

      if (!session) {
        // User not logged in: save to localStorage and go to register
        localStorage.setItem('pending_onboarding', JSON.stringify(dataToSave));
        router.push('/login?message=onboarding_complete');
        return;
      }

      await completeOnboarding(dataToSave);

      // Redirect to dashboard on success
      router.push('/dashboard');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      console.error('Failed to complete onboarding:', errorMessage, error);
      toast.error(t('onboarding.errors.generic_save'));
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, completeOnboarding, router, t, isStepValid]);

  // Decide which step component to show
  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return <WelcomeStep onNext={goToNextStep} />;

      case 1:
        return (
          <LanguageStep
            title={t('onboarding.step1.native_language')}
            subtitle={t('onboarding.step1.native_subtitle')}
            type="native"
            value={formData.native_language}
            onChange={(code) => updateField('native_language', code)}
          />
        );

      case 2:
        return (
          <LanguageStep
            title={t('onboarding.step1.target_language')}
            subtitle={t('onboarding.step1.target_subtitle')}
            type="target"
            value={formData.target_language}
            onChange={(code) => updateField('target_language', code)}
            excludeLanguage={formData.native_language}
          />
        );

      case 3:
        return (
          <LevelStep
            value={formData.current_level}
            onChange={(value) => updateField('current_level', value)}
          />
        );

      case 4:
        return (
          <PurposeStep
            value={formData.learning_purpose}
            details={formData.learning_purpose_details}
            onChange={(value) => updateField('learning_purpose', value)}
            onDetailsChange={(details) =>
              updateField('learning_purpose_details', details)
            }
          />
        );

      case 5:
        return (
          <NicknameStep
            value={formData.nickname}
            onChange={(value) => updateField('nickname', value)}
            onSkip={goToNextStep}
          />
        );

      case 6:
        return (
          <SummaryStep
            data={formData}
            onEdit={goToStep}
            onComplete={handleComplete}
            isLoading={isSubmitting}
          />
        );

      default:
        return null;
    }
  };


  // Do not show navigation buttons on the welcome screen or the summary screen
  const showNavigation = currentStep > 0 && currentStep < 6;
  const isLastStep = currentStep === TOTAL_STEPS - 1;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Language Selector Header */}
      <header className="relative z-50 flex justify-end p-4 sm:p-6 border-b border-gray-200">
        <LanguageSelector />
      </header>

      {/* Loading overlay during submission */}
      {isSubmitting && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-muted-foreground">{t('onboarding.creating_account')}</p>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full px-4 py-8">
        {/* Progress bar - hide on welcome step */}
        {currentStep > 0 && (
          <div className="mb-8">
            <ProgressBar currentStep={currentStep} totalSteps={TOTAL_STEPS} />
          </div>
        )}

        {/* Step content */}
        <div className="flex-1 flex flex-col justify-center">
          <div
            key={currentStep}
            className="animate-in fade-in-0 slide-in-from-right-4 duration-300"
          >
            {renderStep()}
          </div>
        </div>

        {/* Navigation - hide on welcome and summary */}
        {showNavigation && (
          <StepNavigation
            onBack={goToPrevStep}
            onNext={goToNextStep}
            canGoBack={currentStep > 0}
            canGoNext={isStepValid()}
            isLoading={isSubmitting}
            isLastStep={isLastStep}
          />
        )}
      </div>
    </div>
  );
}
