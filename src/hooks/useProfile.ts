'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase/client';
import type { Profile, OnboardingData } from '@/lib/supabase/types';
import type { RealtimeChannel } from '@supabase/supabase-js';

/**
 * Return type for the useProfile hook
 */
interface UseProfileReturn {
  /** Current user profile (null if not loaded or user not authenticated) */
  profile: Profile | null;
  /** True during initial load and data mutations */
  loading: boolean;
  /** Any error that occurred during operations */
  error: Error | null;
  /** Manually reload profile from database */
  refreshProfile: () => Promise<void>;
  /** Update specific profile fields */
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  /** Update learning profile JSONB data using RPC function */
  updateLearningProfile: (data: Record<string, unknown>) => Promise<void>;
  /** Reset learning profile while preserving XP/streak */
  resetLearningProfile: () => Promise<void>;
  /** Complete onboarding process with user data */
  completeOnboarding: (data: OnboardingData) => Promise<void>;
}

/**
 * Custom React hook for managing user profiles with Supabase.
 * 
 * Features:
 * - Automatic profile loading on mount for authenticated users
 * - Real-time subscription to profile changes
 * - Optimistic updates with error rollback
 * - Toast notifications for user feedback
 * - Comprehensive error handling
 * 
 * @example
 * ```typescript
 * function ProfilePage() {
 *   const { 
 *     profile, 
 *     loading, 
 *     updateProfile,
 *     completeOnboarding 
 *   } = useProfile();
 *
 *   if (loading) return <div>Loading...</div>;
 *   if (!profile) return <div>Not authenticated</div>;
 *
 *   return (
 *     <div>
 *       <h1>Welcome, {profile.nickname}!</h1>
 *       <p>XP: {profile.xp} | Streak: {profile.streak}</p>
 *     </div>
 *   );
 * }
 * ```
 */
export function useProfile(): UseProfileReturn {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  /**
   * Fetch profile from database for the current authenticated user.
   * Sets loading state and handles errors gracefully.
   */
  const refreshProfile = useCallback(async (): Promise<void> => {
    try {
      setLoading(true);
      setError(null);

      // Get current authenticated user
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError) {
        throw new Error(`Authentication error: ${authError.message}`);
      }

      if (!user) {
        // User not authenticated - clear profile
        setProfile(null);
        setUserId(null);
        setLoading(false);
        return;
      }

      setUserId(user.id);
// yesss
      // Fetch profile from database
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (fetchError) {
        // Profile doesn't exist yet - this is okay, set to null
        if (fetchError.code === 'PGRST116') {
          console.warn('Profile not found for user:', user.id);
          setProfile(null);
        } else {
          throw new Error(`Failed to fetch profile: ${fetchError.message}`);
        }
      } else {
        setProfile(data);
      }
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Unknown error occurred');
      console.error('Error refreshing profile:', errorObj);
      setError(errorObj);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Update specific profile fields in the database.
   * Uses optimistic updates with rollback on error.
   * 
   * @param updates - Partial profile object with fields to update
   */
  const updateProfile = useCallback(async (updates: Partial<Profile>): Promise<void> => {
    if (!userId) {
      toast.error('You must be logged in to update your profile');
      return;
    }

    // Store previous profile for rollback
    const previousProfile = profile;

    try {
      setLoading(true);
      setError(null);

      // Optimistic update - update UI immediately
      if (profile) {
        setProfile({ ...profile, ...updates });
      }

      // Update database - remove readonly fields that shouldn't be updated
      const { id, created_at, ...updateFields } = updates as Partial<Profile>;
      
      const updateData = {
        ...updateFields,
        updated_at: new Date().toISOString(),
      };
      
      // Type assertion needed due to Supabase SSR client type inference issues
      const { data, error: updateError } = await (supabase.from('profiles') as any)
        .update(updateData)
        .eq('id', userId)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to update profile: ${updateError.message}`);
      }

      // Update with actual data from database
      setProfile(data);
      toast.success('Profile updated successfully');
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Unknown error occurred');
      console.error('Error updating profile:', errorObj);
      setError(errorObj);

      // Rollback optimistic update
      setProfile(previousProfile);
      toast.error('Failed to update profile. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [userId, profile]);

  /**
   * Update learning profile JSONB data using Supabase RPC function.
   * Merges new data with existing learning_profile.
   * 
   * @param data - Learning profile data to merge
   */
  const updateLearningProfile = useCallback(async (data: Record<string, unknown>): Promise<void> => {
    if (!userId) {
      toast.error('You must be logged in to update your learning profile');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Call RPC function to update learning profile
      const { data: result, error: rpcError } = await supabase
        .rpc('update_learning_profile', { new_data: data } as any);

      if (rpcError) {
        throw new Error(`Failed to update learning profile: ${rpcError.message}`);
      }

      // Refresh profile to get updated data
      await refreshProfile();

      toast.success('Learning preferences updated');
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Unknown error occurred');
      console.error('Error updating learning profile:', errorObj);
      setError(errorObj);
      toast.error('Failed to update learning preferences');
    } finally {
      setLoading(false);
    }
  }, [userId, refreshProfile]);

  /**
   * Reset learning profile to default state using Supabase RPC function.
   * Preserves XP and streak while clearing AI memory.
   */
  const resetLearningProfile = useCallback(async (): Promise<void> => {
    if (!userId) {
      toast.error('You must be logged in to reset your learning profile');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Call RPC function to reset learning profile
      const { data: result, error: rpcError } = await supabase
        .rpc('reset_learning_profile');

      if (rpcError) {
        throw new Error(`Failed to reset learning profile: ${rpcError.message}`);
      }

      // Refresh profile to get updated data
      await refreshProfile();

      toast.success('Learning profile reset successfully');
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Unknown error occurred');
      console.error('Error resetting learning profile:', errorObj);
      setError(errorObj);
      toast.error('Failed to reset learning profile');
    } finally {
      setLoading(false);
    }
  }, [userId, refreshProfile]);

  /**
   * Complete onboarding process by updating profile with user's choices.
   * Sets onboarding_completed flag and timestamp.
   * 
   * @param data - Onboarding data including language preferences and goals
   */
  const completeOnboarding = useCallback(async (data: OnboardingData): Promise<void> => {
    if (!userId) {
      toast.error('You must be logged in to complete onboarding');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const now = new Date().toISOString();

      // Update profile with onboarding data
      // Type assertion needed due to Supabase SSR client type inference issues
      const { data: updatedProfile, error: updateError } = await (supabase.from('profiles') as any)
        .update({
          nickname: data.nickname,
          native_language: data.native_language,
          target_language: data.target_language,
          current_level: data.current_level,
          learning_purpose: data.learning_purpose,
          learning_purpose_details: data.learning_purpose_details || null,
          learning_profile: data.learning_profile || {},
          onboarding_completed: true,
          onboarding_completed_at: now,
          updated_at: now,
        })
        .eq('id', userId)
        .select()
        .single();

      if (updateError) {
        throw new Error(`Failed to complete onboarding: ${updateError.message}`);
      }

      setProfile(updatedProfile);
      toast.success('Welcome! Your profile is all set up.');
    } catch (err) {
      const errorObj = err instanceof Error ? err : new Error('Unknown error occurred');
      console.error('Error completing onboarding:', errorObj);
      setError(errorObj);
      toast.error('Failed to complete onboarding. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  /**
   * Effect: Load profile on mount and set up real-time subscription
   */
  useEffect(() => {
    let channel: RealtimeChannel | null = null;

    // Initial profile load
    refreshProfile();

    // Set up real-time subscription for profile changes
    const setupRealtimeSubscription = async () => {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) return;

      // Subscribe to changes in the profiles table for this user
      channel = supabase
        .channel(`profile:${user.id}`)
        .on(
          'postgres_changes',
          {
            event: '*', // Listen to all events (INSERT, UPDATE, DELETE)
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${user.id}`,
          },
          (payload) => {
            console.log('Profile changed via real-time:', payload);

            if (payload.eventType === 'DELETE') {
              setProfile(null);
            } else if (payload.new) {
              setProfile(payload.new as Profile);
            }
          }
        )
        .subscribe();
    };

    setupRealtimeSubscription();

    // Cleanup function
    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [refreshProfile]);

  return {
    profile,
    loading,
    error,
    refreshProfile,
    updateProfile,
    updateLearningProfile,
    resetLearningProfile,
    completeOnboarding,
  };
}
