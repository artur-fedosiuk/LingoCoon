/**
 * Filename: src/components/onboarding/types.ts
 * Description: Type definitions and constants (Language, Level, Purpose) used across the onboarding components.
 */
/**
 * Shared types and constants for the onboarding flow
 */

/**
 * Form data collected during onboarding
 */
export interface OnboardingFormData {
  native_language: string;
  target_language: string;
  current_level: string;
  learning_purpose: string;
  learning_purpose_details: string;
  nickname: string;
}

/**
 * Language option for selection
 */
export interface Language {
  /** ISO 639-1 language code (e.g., 'en', 'fr', 'it') */
  code: string;
  /** Display name of the language in English */
  name: string;
}

/**
 * Proficiency level option
 */
export interface Level {
  /** Unique identifier for the level */
  value: string;
  /** Display title for the level */
  title: string;
  /** Descriptive text explaining what this level means */
  description: string;
}

/**
 * Learning purpose option
 */
export interface Purpose {
  /** Unique identifier for the purpose */
  value: string;
  /** Display title for the purpose */
  title: string;
}

/**
 * Available languages for selection
 */
export const LANGUAGES: Language[] = [
  { code: 'it', name: 'Italian' },
  { code: 'ua', name: 'Ukrainian' },
  { code: 'gb', name: 'English' },
  { code: 'fr', name: 'French' },
];

/**
 * Map language codes to translation keys
 */
export const LANG_KEY_MAP: Record<string, string> = {
  it: 'it-IT',
  ua: 'ua-UA',
  gb: 'en-US',
  fr: 'fr-FR',
};

/**
 * Proficiency levels with descriptions
 */
export const LEVELS: Level[] = [
  {
    value: 'absolute_beginner',
    title: 'Absolute Beginner',
    description: "I've never studied this language before",
  },
  {
    value: 'beginner',
    title: 'Beginner',
    description: 'I know some basic words and phrases',
  },
  {
    value: 'intermediate',
    title: 'Intermediate',
    description: 'I can hold simple conversations',
  },
  {
    value: 'advanced',
    title: 'Advanced',
    description: 'I can discuss complex topics fluently',
  },
];

/**
 * Learning purposes with icons
 */
export const PURPOSES: Purpose[] = [
  { value: 'work', title: 'Work' },
  { value: 'study', title: 'Study' },
  { value: 'travel', title: 'Travel' },
  { value: 'hobby', title: 'Hobby' },
];

/**
 * Total number of onboarding steps
 */
export const TOTAL_STEPS = 7;

/**
 * Step labels for display
 */
export const STEP_LABELS = [
  'Welcome',
  'Native Language',
  'Target Language',
  'Current Level',
  'Learning Purpose',
  'Nickname',
  'Summary',
];

/**
 * Initial form data state
 */
export const INITIAL_FORM_DATA: OnboardingFormData = {
  native_language: '',
  target_language: '',
  current_level: '',
  learning_purpose: '',
  learning_purpose_details: '',
  nickname: '',
};
