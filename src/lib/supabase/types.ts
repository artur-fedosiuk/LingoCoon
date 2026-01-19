/**
 * Filename: src/lib/supabase/types.ts
 * Description: TypeScript definitions matching the Supabase database schema (Profiles, LearningProfile, OnboardingData).
 */
/**
 * TypeScript types for Supabase database schema
 * These types match the database schema exactly and provide type safety
 * for all database operations.
 */

/**
 * Flexible JSONB structure for storing learning-related data.
 * This interface documents expected keys while allowing flexibility
 * for additional properties that may be added over time.
 * 
 * @example
 * ```typescript
 * const learningProfile: LearningProfile = {
 *   preferredStudyTime: 'morning',
 *   dailyGoalMinutes: 30,
 *   topicsOfInterest: ['travel', 'business'],
 *   customPreferences: { enableNotifications: true }
 * };
 * ```
 */
export interface LearningProfile {
  /** Preferred time of day for study sessions */
  preferredStudyTime?: 'morning' | 'afternoon' | 'evening' | 'night';
  /** Daily learning goal in minutes */
  dailyGoalMinutes?: number;
  /** Topics the user is interested in learning */
  topicsOfInterest?: string[];
  /** User's learning style preference */
  learningStyle?: 'visual' | 'auditory' | 'reading' | 'kinesthetic';
  /** Difficulty preference for exercises */
  difficultyPreference?: 'easy' | 'medium' | 'hard' | 'adaptive';
  /** Whether user prefers spaced repetition */
  spacedRepetitionEnabled?: boolean;
  /** Any additional custom preferences - allows flexibility for JSONB */
  [key: string]: unknown;
}

/**
 * User profile as stored in the public.profiles table.
 * All fields match the database schema exactly with proper nullability.
 * 
 * @example
 * ```typescript
 * const { data } = await supabase
 *   .from('profiles')
 *   .select('*')
 *   .single();
 * 
 * const profile: Profile = data;
 * console.log(profile.nickname ?? 'Anonymous User');
 * ```
 */
export interface Profile {
  /** UUID primary key, references auth.users(id) */
  id: string;
  /** User's email address (required) */
  email: string;
  /** Display name/nickname (optional) */
  nickname: string | null;
  /** User's native/first language (optional) */
  native_language: string | null;
  /** Language the user is learning (optional) */
  target_language: string | null;
  /** Current proficiency level (optional) - e.g., 'beginner', 'intermediate', 'advanced' */
  current_level: string | null;
  /** Primary purpose for learning the language (optional) */
  learning_purpose: string | null;
  /** Additional details about learning purpose (optional) */
  learning_purpose_details: string | null;
  /** Flexible JSONB object for learning preferences and settings */
  learning_profile: LearningProfile;
  /** Experience points earned by the user */
  xp: number;
  /** Current learning streak in days */
  streak: number;
  /** Whether the user has completed onboarding */
  onboarding_completed: boolean;
  /** When onboarding was completed (null if not completed) */
  onboarding_completed_at: string | null;
  /** When the profile was created */
  created_at: string;
  /** When the profile was last updated */
  updated_at: string;
}

/**
 * Data required to complete the onboarding process.
 * This interface defines the minimum required fields that must be
 * provided when a user completes onboarding.
 * 
 * @example
 * ```typescript
 * const onboardingData: OnboardingData = {
 *   nickname: 'JohnDoe',
 *   native_language: 'en',
 *   target_language: 'es',
 *   current_level: 'beginner',
 *   learning_purpose: 'travel'
 * };
 * 
 * await supabase
 *   .from('profiles')
 *   .update({
 *     ...onboardingData,
 *     onboarding_completed: true,
 *     onboarding_completed_at: new Date().toISOString()
 *   })
 *   .eq('id', userId);
 * ```
 */
export interface OnboardingData {
  /** User's chosen display name */
  nickname: string;
  /** User's native language code (e.g., 'en', 'es', 'fr') */
  native_language: string;
  /** Language the user wants to learn */
  target_language: string;
  /** Self-assessed current proficiency level */
  current_level: string;
  /** Primary motivation for learning */
  learning_purpose: string;
  /** Optional additional details about learning goals */
  learning_purpose_details?: string;
  /** Optional initial learning profile settings */
  learning_profile?: LearningProfile;
}

/**
 * Partial profile update - all fields optional.
 * Use this type when updating specific profile fields.
 */
export type ProfileUpdate = Partial<Omit<Profile, 'id' | 'created_at'>>;

/**
 * Profile fields that can be selected from the database.
 * Useful for type-safe select queries.
 */
export type ProfileField = keyof Profile;

/**
 * Response type from RPC function: reset_learning_profile()
 * Returns the reset learning profile as JSON
 */
export interface ResetLearningProfileResponse {
  success: boolean;
  learning_profile: LearningProfile;
  message?: string;
}

/**
 * Response type from RPC function: update_learning_profile(new_data: jsonb)
 * Returns the updated learning profile as JSON
 */
export interface UpdateLearningProfileResponse {
  success: boolean;
  learning_profile: LearningProfile;
  message?: string;
}

/**
 * Deck interface - Flashcard deck
 * Matches actual database schema with language_from and language_to
 */
export interface Deck {
  /** UUID primary key */
  id: string;
  /** Owner's user ID, references auth.users(id) */
  user_id: string;
  /** Deck title (1-100 chars) */
  title: string;
  /** Optional deck description */
  description: string | null;
  /** Source language code (e.g., 'en', 'it', 'fr', 'uk') - defaults to 'en' */
  language_from: string;
  /** Target language code (e.g., 'en', 'it', 'fr', 'uk') - defaults to 'it' */
  language_to: string;
  /** Number of cards in this deck */
  card_count: number;
  /** When the deck was created */
  created_at: string;
  /** When the deck was last updated */
  updated_at: string;
}

/**
 * Card interface - Individual flashcard
 * Matches actual database schema with difficulty field
 */
export interface Card {
  /** UUID primary key */
  id: string;
  /** Parent deck ID, references decks(id) */
  deck_id: string;
  /** Front side text (1-500 chars) */
  front: string;
  /** Back side text (1-500 chars) */
  back: string;
  /** Difficulty level: 1 (easy) to 5 (hard) */
  difficulty: number;
  /** When the card was created */
  created_at: string;
  /** When the card was last updated */
  updated_at: string;
}

/**
 * StudyProgress interface - Tracks user progress on individual cards
 */
export interface StudyProgress {
  /** UUID primary key */
  id: string;
  /** User ID, references auth.users(id) */
  user_id: string;
  /** Card ID, references cards(id) */
  card_id: string;
  /** Current ease factor for spaced repetition */
  ease_factor: number;
  /** Current interval in days */
  interval: number;
  /** Number of times reviewed */
  repetitions: number;
  /** When the card should next be reviewed */
  next_review: string;
  /** When the progress was created */
  created_at: string;
  /** When the progress was last updated */
  updated_at: string;
}

/**
 * Database schema type definition for Supabase client.
 * This provides full type safety when using the Supabase client.
 */
export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile;
        Insert: Omit<Profile, 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: ProfileUpdate;
      };
      decks: {
        Row: Deck;
        Insert: Omit<Deck, 'id' | 'created_at' | 'updated_at' | 'card_count'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          card_count?: number;
          language_from?: string; // defaults to 'en'
          language_to?: string;   // defaults to 'it'
        };
        Update: Partial<Omit<Deck, 'id' | 'created_at' | 'user_id'>>;
      };
      cards: {
        Row: Card;
        Insert: Omit<Card, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
          difficulty?: number; // defaults to 3
        };
        Update: Partial<Omit<Card, 'id' | 'created_at' | 'deck_id'>>;
      };
      study_progress: {
        Row: StudyProgress;
        Insert: Omit<StudyProgress, 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<StudyProgress, 'id' | 'created_at' | 'user_id' | 'card_id'>>;
      };
    };
    Functions: {
      reset_learning_profile: {
        Args: Record<string, never>;
        Returns: ResetLearningProfileResponse;
      };
      update_learning_profile: {
        Args: { new_data: LearningProfile };
        Returns: UpdateLearningProfileResponse;
      };
    };
  };
}
