/**
 * Filename: src/hooks/useProfile.examples.tsx
 * Description: Example usage components demonstrating how to implement the useProfile hook in various scenarios.
 */
/**
 * Usage Examples for useProfile Hook
 * 
 * This file demonstrates various ways to use the useProfile hook
 * in your Next.js application components.
 */

import React, { useState } from 'react';
import { useProfile } from '@/hooks/useProfile';
import { toast } from 'sonner';

// =============================================================================
// Example 1: Basic Profile Display
// =============================================================================
export function ProfileDisplay() {
  const { profile, loading, error } = useProfile();

  if (loading) {
    return <div className="animate-pulse">Loading profile...</div>;
  }

  if (error) {
    return (
      <div className="text-red-600">
        Error: {error.message}
      </div>
    );
  }

  if (!profile) {
    return <div>Please log in to view your profile</div>;
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">
        Welcome, {profile.nickname || 'User'}!
      </h1>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-sm text-gray-600">XP</p>
          <p className="text-xl font-semibold">{profile.xp}</p>
        </div>
        <div>
          <p className="text-sm text-gray-600">Streak</p>
          <p className="text-xl font-semibold">{profile.streak} days</p>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Example 2: Update Profile Form
// =============================================================================
export function EditProfileForm() {
  const { profile, loading, updateProfile } = useProfile();
  const [nickname, setNickname] = useState(profile?.nickname || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await updateProfile({
      nickname,
    });
  };

  if (!profile) return null;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="nickname" className="block text-sm font-medium">
          Nickname
        </label>
        <input
          id="nickname"
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          className="mt-1 block w-full rounded-md border-gray-300"
          disabled={loading}
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded-md disabled:opacity-50"
      >
        {loading ? 'Saving...' : 'Save Changes'}
      </button>
    </form>
  );
}

// =============================================================================
// Example 3: Onboarding Flow
// =============================================================================
export function OnboardingPage() {
  const { completeOnboarding, loading } = useProfile();
  const [formData, setFormData] = useState({
    nickname: '',
    native_language: '',
    target_language: '',
    current_level: 'beginner',
    learning_purpose: '',
  });

  const handleComplete = async () => {
    if (!formData.nickname || !formData.native_language || !formData.target_language) {
      toast.error('Please fill in all required fields');
      return;
    }

    await completeOnboarding(formData);
    // User will be redirected or shown next steps
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <h1 className="text-3xl font-bold">Welcome to LinguaCoon!</h1>
      <p className="text-gray-600">Let's set up your learning profile</p>

      <div className="space-y-4">
        <input
          type="text"
          placeholder="Your nickname"
          value={formData.nickname}
          onChange={(e) => setFormData({ ...formData, nickname: e.target.value })}
          className="w-full px-4 py-2 border rounded-md"
        />

        <select
          value={formData.native_language}
          onChange={(e) => setFormData({ ...formData, native_language: e.target.value })}
          className="w-full px-4 py-2 border rounded-md"
        >
          <option value="">Select your native language</option>
          <option value="en">English</option>
          <option value="fr">French</option>
          <option value="it">Italian</option>
        </select>

        <select
          value={formData.target_language}
          onChange={(e) => setFormData({ ...formData, target_language: e.target.value })}
          className="w-full px-4 py-2 border rounded-md"
        >
          <option value="">Language you want to learn</option>
          <option value="en">English</option>
          <option value="fr">French</option>
          <option value="it">Italian</option>
        </select>

        <select
          value={formData.current_level}
          onChange={(e) => setFormData({ ...formData, current_level: e.target.value })}
          className="w-full px-4 py-2 border rounded-md"
        >
          <option value="beginner">Beginner</option>
          <option value="elementary">Elementary</option>
          <option value="intermediate">Intermediate</option>
          <option value="advanced">Advanced</option>
        </select>

        <select
          value={formData.learning_purpose}
          onChange={(e) => setFormData({ ...formData, learning_purpose: e.target.value })}
          className="w-full px-4 py-2 border rounded-md"
        >
          <option value="">Why are you learning?</option>
          <option value="travel">Travel</option>
          <option value="work">Work/Career</option>
          <option value="school">School/University</option>
          <option value="personal">Personal Interest</option>
        </select>

        <button
          onClick={handleComplete}
          disabled={loading}
          className="w-full px-6 py-3 bg-indigo-600 text-white rounded-md font-semibold disabled:opacity-50 hover:bg-indigo-700"
        >
          {loading ? 'Setting up...' : 'Complete Setup'}
        </button>
      </div>
    </div>
  );
}

// =============================================================================
// Example 4: Learning Preferences
// =============================================================================
export function LearningPreferencesPanel() {
  const { profile, updateLearningProfile, loading } = useProfile();

  const handlePreferenceChange = async (key: string, value: any) => {
    await updateLearningProfile({ [key]: value });
  };

  if (!profile) return null;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-bold">Learning Preferences</h2>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Daily Goal (minutes)
          </label>
          <select
            onChange={(e) => handlePreferenceChange('dailyGoalMinutes', parseInt(e.target.value))}
            disabled={loading}
            className="w-full px-4 py-2 border rounded-md"
            defaultValue={profile.learning_profile?.dailyGoalMinutes || 15}
          >
            <option value="10">10 minutes</option>
            <option value="15">15 minutes</option>
            <option value="30">30 minutes</option>
            <option value="60">1 hour</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">
            Preferred Study Time
          </label>
          <select
            onChange={(e) => handlePreferenceChange('preferredStudyTime', e.target.value)}
            disabled={loading}
            className="w-full px-4 py-2 border rounded-md"
            defaultValue={profile.learning_profile?.preferredStudyTime || 'evening'}
          >
            <option value="morning">Morning</option>
            <option value="afternoon">Afternoon</option>
            <option value="evening">Evening</option>
            <option value="night">Night</option>
          </select>
        </div>

        <div>
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              onChange={(e) => handlePreferenceChange('spacedRepetitionEnabled', e.target.checked)}
              disabled={loading}
              defaultChecked={profile.learning_profile?.spacedRepetitionEnabled ?? true}
              className="rounded"
            />
            <span className="text-sm">Enable spaced repetition</span>
          </label>
        </div>
      </div>
    </div>
  );
}

// =============================================================================
// Example 5: Reset Learning Profile
// =============================================================================
export function DangerZone() {
  const { resetLearningProfile, loading } = useProfile();
  const [showConfirm, setShowConfirm] = useState(false);

  const handleReset = async () => {
    await resetLearningProfile();
    setShowConfirm(false);
  };

  return (
    <div className="border border-red-300 bg-red-50 rounded-lg p-6">
      <h3 className="text-lg font-semibold text-red-900 mb-2">
        Danger Zone
      </h3>
      <p className="text-sm text-red-700 mb-4">
        Reset your learning profile. This will clear your AI learning history 
        but preserve your XP and streak.
      </p>

      {!showConfirm ? (
        <button
          onClick={() => setShowConfirm(true)}
          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
        >
          Reset Learning Profile
        </button>
      ) : (
        <div className="space-x-2">
          <button
            onClick={handleReset}
            disabled={loading}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? 'Resetting...' : 'Confirm Reset'}
          </button>
          <button
            onClick={() => setShowConfirm(false)}
            disabled={loading}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Example 6: Manual Refresh
// =============================================================================
export function ProfileRefreshButton() {
  const { refreshProfile, loading } = useProfile();

  return (
    <button
      onClick={refreshProfile}
      disabled={loading}
      className="flex items-center space-x-2 px-4 py-2 bg-gray-100 rounded-md hover:bg-gray-200 disabled:opacity-50"
      aria-label="Refresh profile"
    >
      <svg
        className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`}
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
      <span>{loading ? 'Refreshing...' : 'Refresh'}</span>
    </button>
  );
}
