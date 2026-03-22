// src/lib/actions/deck-actions.ts
// Server-side functions for decks and cards.
// These run on the server — the user never sees this code in the browser.
'use server';

import { createClient } from '@/lib/supabase/server';
import { validateFlashcardText } from '@/lib/validation';
import { revalidatePath } from 'next/cache';
import type { Deck, Card, Database } from '@/lib/supabase/types';

type DeckInsert = Database['public']['Tables']['decks']['Insert'];
type CardInsert = Database['public']['Tables']['cards']['Insert'];
type CardUpdate = Database['public']['Tables']['cards']['Update'];
type ProfileUpdate = Database['public']['Tables']['profiles']['Update'];

// Creates a new deck in the database for the logged-in user
export async function createDeck(
  title: string,
  languageFrom: string,
  languageTo: string
): Promise<{ deck?: Deck; error?: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  if (!title.trim()) {
    return { error: 'Title cannot be empty' };
  }

  if (languageFrom === languageTo) {
    return { error: 'Source and target languages must be different' };
  }

  const insertData: DeckInsert = {
    title: title.trim(),
    language_from: languageFrom,
    language_to: languageTo,
    user_id: user.id,
  };

  const { data, error } = await supabase
    .from('decks')
    .insert(insertData as never)
    .select()
    .single();

  if (error) {
    console.error('Error creating deck:', error);
    return { error: error.message };
  }

  revalidatePath('/dashboard');
  revalidatePath('/decks');
  return { deck: data };
}

// Returns all decks belonging to the logged-in user, with real card counts
export async function getDecks(): Promise<{ decks: Deck[] }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { decks: [] };

  // Fetch decks with a count of cards for each deck
  const { data, error } = await supabase
    .from('decks')
    .select('*, cards(count)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching decks:', error);
    return { decks: [] };
  }

  // Map the result: Supabase returns cards as [{ count: N }]
  // We write it into card_count so the rest of the code doesn't change
  const decks = (data || []).map((deck: any) => ({
    ...deck,
    card_count: deck.cards?.[0]?.count ?? 0,
  }));

  return { decks };
}

// Returns a single deck by ID (only if it belongs to the logged-in user)
export async function getDeck(deckId: string): Promise<{ deck?: Deck; error?: string }> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('decks')
    .select('*')
    .eq('id', deckId)
    .single();

  if (error) {
    console.error('Error fetching deck:', error);
    return { error: error.message };
  }

  return { deck: data };
}

// Deletes a deck — only if it belongs to the logged-in user
export async function deleteDeck(deckId: string): Promise<{ error?: string }> {
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
  revalidatePath('/decks');
  return {};
}

// Returns all cards in a given deck
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

// Creates a new card in a deck after validating the text
export async function createCard(
  deckId: string,
  front: string,
  back: string
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  // Validate front text
  const frontCheck = validateFlashcardText(front);
  if (!frontCheck.isValid) {
    return { error: frontCheck.error };
  }

  // Validate back text (basic length check only)
  const backTrimmed = back.trim();
  if (!backTrimmed) {
    return { error: 'Translation cannot be empty' };
  }
  if (backTrimmed.length > 500) {
    return { error: 'Translation too long (max 500 characters)' };
  }

  const insertData: CardInsert = {
    deck_id: deckId,
    front: front.trim(),
    back: backTrimmed,
  };

  const { error } = await supabase
    .from('cards')
    .insert(insertData as never);

  if (error) {
    console.error('Error creating card:', error);
    return { error: 'Failed to save card: ' + error.message };
  }

  revalidatePath(`/decks/${deckId}`);
  return {};
}

// Updates the front and back text of an existing card
export async function updateCard(
  cardId: string,
  front: string,
  back: string,
  deckId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  // Validate front text
  const frontCheck = validateFlashcardText(front);
  if (!frontCheck.isValid) {
    return { error: frontCheck.error };
  }

  // Validate back text (basic length check only)
  const backTrimmed = back.trim();
  if (!backTrimmed) {
    return { error: 'Translation cannot be empty' };
  }
  if (backTrimmed.length > 500) {
    return { error: 'Translation too long (max 500 characters)' };
  }

  const updateData: CardUpdate = { front: front.trim(), back: backTrimmed };

  const { error } = await supabase
    .from('cards')
    .update(updateData as never)
    .eq('id', cardId);

  if (error) {
    console.error('Error updating card:', error);
    return { error: 'Failed to update card: ' + error.message };
  }

  revalidatePath(`/decks/${deckId}`);
  return {};
}

// Deletes a single card by ID
export async function deleteCard(
  cardId: string,
  deckId: string
): Promise<{ error?: string }> {
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
  return {};
}

// Registers the end of a study session: awards XP and increments the streak
export async function completeStudySession(
  cardsStudied: number
): Promise<{ xpGained?: number; newXp?: number; newStreak?: number; error?: string }> {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Unauthorized' };

  const { data: profileData, error: profileError } = await supabase
    .from('profiles')
    .select('xp, streak')
    .eq('id', user.id)
    .single();

  if (profileError) return { error: profileError.message };

  // profileData is typed as 'never' by Supabase due to partial select — cast to known shape
  const profile = profileData as unknown as { xp: number; streak: number };

  const xpGained = cardsStudied * 10;
  const newXp = (profile.xp ?? 0) + xpGained;
  const newStreak = (profile.streak ?? 0) + 1;

  const updateData: ProfileUpdate = { xp: newXp, streak: newStreak, updated_at: new Date().toISOString() };

  const { error: updateError } = await supabase
    .from('profiles')
    .update(updateData as never)
    .eq('id', user.id);

  if (updateError) return { error: updateError.message };

  return { xpGained, newXp, newStreak };
}