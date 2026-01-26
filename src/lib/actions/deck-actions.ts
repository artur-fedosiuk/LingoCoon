// lib/actions/deck-actions.ts
'use server';

import { createClient } from '@/utils/supabase/server';
import { validateFlashcardText } from '@/lib/validation';
import { revalidatePath } from 'next/cache';
import type { Deck, Card } from '@/lib/types';

/**
 * Create a new deck
 */
export async function createDeckAction(
  title: string,
  languageFrom: string,
  languageTo: string
): Promise<{ success?: boolean; deck?: Deck; error?: string }> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  if (!title.trim()) {
    return { error: 'Title cannot be empty' };
  }

  if (languageFrom === languageTo) {
    return { error: 'Source and target languages must be different' };
  }

  const { data, error } = await supabase
    .from('decks')
    .insert({
      title: title.trim(),
      language_from: languageFrom,
      language_to: languageTo,
      user_id: user.id
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating deck:', error);
    return { error: error.message };
  }

  revalidatePath('/dashboard');
  return { success: true, deck: data };
}

/**
 * Create a new card in a deck
 */
export async function createCardAction(
  formData: FormData
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const deckId = formData.get('deckId') as string;
  const front = formData.get('front') as string;
  const back = formData.get('back') as string;
  const deckLanguage = formData.get('deckLanguage') as string;

  // Validate front text (in target language)
  const frontCheck = validateFlashcardText(front, deckLanguage);
  if (!frontCheck.isValid) {
    return { error: `Front: ${frontCheck.error}` };
  }

  // Validate back text (basic checks only)
  const backTrimmed = back.trim();
  if (!backTrimmed) {
    return { error: 'Translation cannot be empty' };
  }
  if (backTrimmed.length > 500) {
    return { error: 'Translation too long (max 500 characters)' };
  }

  const { error } = await supabase
    .from('cards')
    .insert({
      deck_id: deckId,
      front: front.trim(),
      back: backTrimmed
    });

  if (error) {
    console.error('Error creating card:', error);
    return { error: 'Failed to save card: ' + error.message };
  }

  revalidatePath(`/decks/${deckId}`);
  return { success: true };
}

/**
 * Get all decks for current user
 */
export async function getDecks(): Promise<{ decks: Deck[] }> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { decks: [] };

  const { data, error } = await supabase
    .from('decks')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching decks:', error);
    return { decks: [] };
  }

  return { decks: data || [] };
}

/**
 * Get all cards for a specific deck
 */
export async function getCards(deckId: string): Promise<{ cards: Card[] }> {
  const supabase = await createClient();
  
  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .eq('deck_id', deckId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching cards:', error);
    return { cards: [] };
  }

  return { cards: data || [] };
}

/**
 * Delete a deck
 */
export async function deleteDeckAction(
  deckId: string
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { error } = await supabase
    .from('decks')
    .delete()
    .eq('id', deckId)
    .eq('user_id', user.id);

  if (error) {
    console.error('Error deleting deck:', error);
    return { error: error.message };
  }

  revalidatePath('/dashboard');
  return { success: true };
}

/**
 * Delete a card
 */
export async function deleteCardAction(
  cardId: string,
  deckId: string
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { error } = await supabase
    .from('cards')
    .delete()
    .eq('id', cardId);

  if (error) {
    console.error('Error deleting card:', error);
    return { error: error.message };
  }

  revalidatePath(`/decks/${deckId}`);
  return { success: true };
}

/**
 * Update a card
 */
export async function updateCardAction(
  cardId: string,
  front: string,
  back: string,
  deckId: string,
  deckLanguage: string
): Promise<{ success?: boolean; error?: string }> {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  // Validate front text (in target language)
  const frontCheck = validateFlashcardText(front, deckLanguage);
  if (!frontCheck.isValid) {
    return { error: `Front: ${frontCheck.error}` };
  }

  // Validate back text (basic checks only)
  const backTrimmed = back.trim();
  if (!backTrimmed) {
    return { error: 'Translation cannot be empty' };
  }
  if (backTrimmed.length > 500) {
    return { error: 'Translation too long (max 500 characters)' };
  }

  const { error } = await supabase
    .from('cards')
    .update({
      front: front.trim(),
      back: backTrimmed
    })
    .eq('id', cardId);

  if (error) {
    console.error('Error updating card:', error);
    return { error: 'Failed to update card: ' + error.message };
  }

  revalidatePath(`/decks/${deckId}`);
  return { success: true };
}