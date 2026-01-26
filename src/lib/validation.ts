// lib/validation.ts
import { franc } from 'franc-min';
import { Profanity, ProfanityOptions } from '@2toad/profanity';
import type { ValidationResult } from './types';

// Supported language codes
export type LanguageCode = 'en' | 'it' | 'fr' | 'uk';

const profanity = new Profanity({
  languages: ['en', 'it', 'fr', 'ru']
} as ProfanityOptions);

/**
 * Server-side validation for flashcard text
 */
export function validateFlashcardText(
  text: string,
  expectedLanguage: string
): ValidationResult {
  const cleanText = text.trim();

  if (!cleanText) {
    return { isValid: false, error: 'Text cannot be empty' };
  }

  if (cleanText.length > 500) {
    return { isValid: false, error: 'Text too long (max 500 characters)' };
  }

  if (profanity.exists(cleanText)) {
    return { isValid: false, error: 'Inappropriate content detected' };
  }

  if (cleanText.length >= 20) {
    const langMap: Record<string, string> = {
      en: 'eng',
      it: 'ita',
      fr: 'fra',
      uk: 'ukr'
    };

    const detected = franc(cleanText, {
      only: ['eng', 'ita', 'fra', 'ukr'],
      minLength: 15
    });

    const expectedCode = langMap[expectedLanguage];

    if (detected !== 'und' && detected !== expectedCode) {
      return {
        isValid: false,
        error: `Wrong language detected. This looks like ${detected}, but expected ${expectedCode}`
      };
    }
  }

  return { isValid: true };
}

/**
 * Client-side quick check for real-time feedback
 */
export function quickLanguageCheck(
  text: string,
  expectedLanguage: string
): { warning?: string } {
  if (text.length < 15) return {};

  const langMap: Record<string, string> = {
    en: 'eng',
    it: 'ita',
    fr: 'fra',
    uk: 'ukr'
  };

  const detected = franc(text, {
    only: ['eng', 'ita', 'fra', 'ukr'],
    minLength: 10
  });

  const expectedCode = langMap[expectedLanguage];

  if (detected !== 'und' && detected !== expectedCode) {
    return {
      warning: '⚠️ This looks like a different language. Are you sure?'
    };
  }

  return {};
}