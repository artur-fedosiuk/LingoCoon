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
  code: string;
  name: string;
  flag: string;
}

/**
 * Proficiency level option
 */
export interface Level {
  value: string;
  title: string;
  description: string;
}

/**
 * Learning purpose option
 */
export interface Purpose {
  value: string;
  title: string;
  emoji: string;
}

/**
 * Available languages for selection
 */
export const LANGUAGES: Language[] = [
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'ua', name: 'Ukrainian', flag: '🇺🇦' },
  { code: 'gb', name: 'English', flag: '🇬🇧' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },

];

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
  { value: 'work', title: 'Work', emoji: '💼' },
  { value: 'study', title: 'Study', emoji: '🎓' },
  { value: 'travel', title: 'Travel', emoji: '✈️' },
  { value: 'hobby', title: 'Hobby', emoji: '🎯' },
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
