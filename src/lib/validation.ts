// src/lib/validation.ts
// Basic text validation for flashcard content.

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

// Checks that the text is not empty and not too long.
// Used on the server before saving a card to the database.
export function validateFlashcardText(text: string): ValidationResult {
  const clean = text.trim();

  if (!clean) {
    return { isValid: false, error: 'Text cannot be empty' };
  }

  if (clean.length > 500) {
    return { isValid: false, error: 'Text too long (max 500 characters)' };
  }

  return { isValid: true };
}