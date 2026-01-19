/**
 * Filename: src/lib/validation.ts
 * Description: Flashcard text validation with language detection and profanity filtering
 */

import { franc } from 'franc-min';
import { Profanity, ProfanityOptions } from '@2toad/profanity';

/**
 * Custom interface for franc options
 * The whitelist option is not in the official types but works at runtime
 */
interface FrancOptions {
    whitelist?: string[];
    minLength?: number;
}

/**
 * Initialize profanity filter (Singleton pattern)
 */
const profanity = new Profanity({
    languages: ['en', 'it', 'fr', 'ru'] // 'ru' covers 'uk' for profanity
} as ProfanityOptions);

/**
 * Supported language codes
 */
export type LanguageCode = 'en' | 'it' | 'fr' | 'uk';

/**
 * Map language codes to ISO-639-3 codes used by franc
 */
const LANG_TO_ISO_MAP: Record<LanguageCode, string> = {
    'en': 'eng',
    'it': 'ita',
    'fr': 'fra',
    'uk': 'ukr'
};

/**
 * Human-readable language names for error messages
 */
const LANG_NAMES: Record<string, string> = {
    'eng': 'English',
    'ita': 'Italian',
    'fra': 'French',
    'ukr': 'Ukrainian'
};

/**
 * Validation result interface
 */
export interface ValidationResult {
    isValid: boolean;
    error?: string;
    warning?: string;
}

/**
 * Server-side validation for flashcard text (blocking)
 * Use this in your Server Actions before saving to the database
 * 
 * @param text - The text to validate
 * @param targetLanguage - Expected language code (e.g., 'en', 'it', 'fr', 'uk')
 * @returns Validation result with isValid flag and optional error message
 */
export function validateFlashcardText(
    text: string,
    targetLanguage: LanguageCode
): ValidationResult {
    const cleanText = text.trim();

    // A. Check for empty text
    if (!cleanText) {
        return { isValid: false, error: 'Text cannot be empty' };
    }

    // B. Maximum length check (TTS limit)
    if (cleanText.length > 500) {
        return { isValid: false, error: 'Text too long (max 500 characters)' };
    }

    // C. Profanity filter
    if (profanity.exists(cleanText)) {
        return { isValid: false, error: 'Inappropriate content detected' };
    }

    // D. Language check (only if text is long enough)
    if (cleanText.length >= 20) {
        const detected = franc(cleanText, {
            whitelist: ['eng', 'ita', 'fra', 'ukr'],
            minLength: 15
        } as FrancOptions);

        const expectedISO = LANG_TO_ISO_MAP[targetLanguage];

        // If franc is confident and the language is different
        if (detected !== 'und' && detected !== expectedISO) {
            return {
                isValid: false,
                error: `Wrong language detected. This appears to be ${LANG_NAMES[detected] || detected}, but should be ${LANG_NAMES[expectedISO] || expectedISO}`
            };
        }
    }

    return { isValid: true };
}

/**
 * Client-side validation for real-time feedback (non-blocking)
 * Use this in your form to show warnings while the user is typing
 * 
 * @param text - The text to validate
 * @param targetLanguage - Expected language code
 * @returns Warning message if language mismatch detected
 */
export function quickLanguageCheck(
    text: string,
    targetLanguage: LanguageCode
): { warning?: string } {
    // Text too short to make reliable language detection
    if (text.length < 15) {
        return {};
    }

    const detected = franc(text, {
        whitelist: ['eng', 'ita', 'fra', 'ukr'],
        minLength: 10
    } as FrancOptions);

    const expectedISO = LANG_TO_ISO_MAP[targetLanguage];

    if (detected !== 'und' && detected !== expectedISO) {
        return {
            warning: `⚠️ This appears to be ${LANG_NAMES[detected] || "another language"}. Are you sure?`
        };
    }

    return {};
}