// src/components/onboarding/types.ts
// Types, constants, and lists used in the onboarding flow.

// All the data collected from the user during onboarding
export interface OnboardingFormData {
  native_language: string;
  target_language: string;
  current_level: string;
  learning_purpose: string;
  learning_purpose_details: string;
  nickname: string;
}

// A language the user can select
export interface Language {
  code: string;  // short code used in the database: 'en', 'it', 'fr', 'uk'
  name: string;  // display name in English
}

// A proficiency level the user can select
export interface Level {
  value: string;
  title: string;
  description: string;
}

// A learning purpose the user can select
export interface Purpose {
  value: string;
  title: string;
}

// Languages available to select during onboarding
// code must match what gets saved in the database
export const LANGUAGES: Language[] = [
  { code: 'it', name: 'Italian' },
  { code: 'uk', name: 'Ukrainian' },
  { code: 'en', name: 'English' },
  { code: 'fr', name: 'French' },
];

// Maps each language code to the key used in the translation JSON files
export const LANG_KEY_MAP: Record<string, string> = {
  it: 'it-IT',
  uk: 'uk-UA',
  en: 'en-US',
  fr: 'fr-FR',
};

// Proficiency levels the user can choose from
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

// Learning purposes the user can choose from
export const PURPOSES: Purpose[] = [
  { value: 'work', title: 'Work' },
  { value: 'study', title: 'Study' },
  { value: 'travel', title: 'Travel' },
  { value: 'hobby', title: 'Hobby' },
];

// Total number of steps in the onboarding flow
export const TOTAL_STEPS = 7;

// Starting empty state for the form
export const INITIAL_FORM_DATA: OnboardingFormData = {
  native_language: '',
  target_language: '',
  current_level: '',
  learning_purpose: '',
  learning_purpose_details: '',
  nickname: '',
};
