'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useProfile } from '@/hooks/useProfile';
import { OnboardingFlow } from '@/components/onboarding/OnboardingFlow';

/**
 * Onboarding page component.
 * Checks if user has already completed onboarding and redirects if so.
 */
export default function OnboardingPage() {
  const router = useRouter();
  const { profile, loading } = useProfile();

  // Redirect to dashboard if onboarding already completed
  useEffect(() => {
    if (!loading && profile?.onboarding_completed) {
      router.replace('/dashboard');
    }
  }, [loading, profile, router]);

  // Show loading state while checking profile
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // If onboarding is completed, don't render (redirect in progress)
  if (profile?.onboarding_completed) {
    return null;
  }

  // Render onboarding flow
  return <OnboardingFlow />;
}
