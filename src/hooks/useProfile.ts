// src/hooks/useProfile.ts
// Custom hook to load and manage the current user's profile.
// Used in: dashboard, onboarding, settings.
'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import type { Profile, OnboardingData } from '@/lib/supabase/types';

export function useProfile() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Load the profile once when the component mounts
  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    setLoading(true);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single();

    setProfile(data);
    setLoading(false);
  }

  // Saves the onboarding form data to the database and updates local state
  async function completeOnboarding(data: OnboardingData) {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return;

    const now = new Date().toISOString();

    const { data: updated } = await supabase
      .from('profiles')
      .update(
        // @ts-ignore - Supabase type resolves .update payload to never due to complex JSON bindings
        {
          nickname: data.nickname,
          native_language: data.native_language,
          target_language: data.target_language,
          current_level: data.current_level,
          learning_purpose: data.learning_purpose,
          learning_purpose_details: data.learning_purpose_details || null,
          onboarding_completed: true,
          onboarding_completed_at: now,
          updated_at: now,
        }
      )
      .eq('id', user.id)
      .select()
      .single();

    if (updated) {
      setProfile(updated);
    }
  }

  return { profile, loading, completeOnboarding };
}
