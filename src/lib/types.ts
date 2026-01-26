// lib/types.ts
export interface Deck {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  language_from: string;
  language_to: string;
  created_at: string;
  updated_at: string;
}

export interface Card {
  id: string;
  deck_id: string;
  front: string;
  back: string;
  example_sentence?: string;
  pronunciation?: string;
  difficulty: number;
  created_at: string;
  updated_at: string;
}

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  warning?: string;
}