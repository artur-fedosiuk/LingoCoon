/**
 * Filename: src/app/actions/deck-actions.ts
 * Description: Server actions for managing flashcard decks and cards
 */
'use server';

import { createClient } from '@/lib/supabase/server';
import { validateFlashcardText, type LanguageCode } from '@/lib/validation';
import { revalidatePath } from 'next/cache';
import type { Database } from '@/lib/supabase/types';

type CardInsert = Database['public']['Tables']['cards']['Insert'];
type DeckRow = Database['public']['Tables']['decks']['Row'];
type CardRow = Database['public']['Tables']['cards']['Row'];

/**
 * Create a new flashcard in a deck
 * 
 * @param formData - Form data containing deckId, front, back, and targetLanguage
 * @returns Result with success flag and optional error message
 */
export async function createCardAction(formData: FormData) {
    const supabase = await createClient();

    // 1. Verify authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: 'Not authorized' };
    }

    // 2. Extract data from form
    const deckId = formData.get('deckId') as string;
    const front = formData.get('front') as string;
    const back = formData.get('back') as string;
    const targetLanguage = formData.get('targetLanguage') as LanguageCode;

    // 3. Validate FRONT (target language - the deck's language_to)
    const frontCheck = validateFlashcardText(front, targetLanguage);
    if (!frontCheck.isValid) {
        return { error: `Front side error: ${frontCheck.error}` };
    }

    // 4. Validate BACK (translation - basic validation only)
    const backTrimmed = back.trim();
    if (!backTrimmed) {
        return { error: 'Translation cannot be empty' };
    }
    if (backTrimmed.length > 500) {
        return { error: 'Translation too long (max 500 characters)' };
    }

    // 5. Save to database
    const cardData: CardInsert = {
        deck_id: deckId,
        front: front.trim(),
        back: backTrimmed,
        difficulty: 3 // Default difficulty (medium)
    };

    const { error } = await supabase
        .from('cards')
        .insert(cardData as never);

    if (error) {
        console.error('Database error:', error);
        return { error: 'Failed to save card: ' + error.message };
    }

    // 6. Revalidate cache
    revalidatePath('/decks');
    revalidatePath(`/decks/${deckId}`);

    return { success: true };
}

/**
 * Create a new deck
 * 
 * @param title - Deck title
 * @param description - Optional deck description
 * @param languageFrom - Source language (defaults to 'en')
 * @param languageTo - Target language (defaults to 'it')
 * @returns Result with created deck data or error
 */
export async function createDeckAction(data: {
    title: string;
    description?: string;
    languageFrom?: string;
    languageTo?: string;
}) {
    const supabase = await createClient();

    // 1. Verify authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: 'Not authorized' };
    }

    // 2. Validate input
    if (!data.title || data.title.trim().length === 0) {
        return { success: false, error: 'Title is required' };
    }

    // 3. Insert deck
    const { data: deck, error } = await supabase
        .from('decks')
        .insert({
            user_id: user.id,
            title: data.title.trim(),
            description: data.description?.trim() || null,
            language_from: data.languageFrom || 'en',
            language_to: data.languageTo || 'it'
        } as never)
        .select()
        .single();

    if (error) {
        console.error('Error creating deck:', error);
        return { success: false, error: 'Failed to create deck' };
    }

    revalidatePath('/decks');
    return { success: true, data: deck as DeckRow };
}

/**
 * Get all cards for a specific deck
 * 
 * @param deckId - The deck ID
 * @returns Result with array of cards or error
 */
export async function getDeckCards(deckId: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { success: false, error: 'Not authorized' };
    }

    // Verify deck ownership
    const { data: deck, error: deckError } = await supabase
        .from('decks')
        .select('id, user_id')
        .eq('id', deckId)
        .eq('user_id', user.id)
        .single();

    if (deckError || !deck) {
        return { success: false, error: 'Deck not found' };
    }

    // Get cards
    const { data: cards, error: cardsError } = await supabase
        .from('cards')
        .select('*')
        .eq('deck_id', deckId)
        .order('created_at', { ascending: false });

    if (cardsError) {
        console.error('Error fetching cards:', cardsError);
        return { success: false, error: 'Failed to fetch cards' };
    }

    return { success: true, data: cards as CardRow[] };
}

/**
 * Delete a card
 * 
 * @param cardId - The card ID to delete
 * @returns Result with success flag or error
 */
export async function deleteCardAction(cardId: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return { error: 'Not authorized' };
    }

    // Verify ownership through deck
    const { data: card } = await supabase
        .from('cards')
        .select('deck_id, decks!inner(user_id)')
        .eq('id', cardId)
        .single();

    // Type guard for the joined data
    type CardWithDeck = {
        deck_id: string;
        decks: { user_id: string } | { user_id: string }[];
    };

    const cardData = card as CardWithDeck | null;

    if (!cardData) {
        return { error: 'Card not found' };
    }

    // Handle both single object and array responses
    const deckUserId = Array.isArray(cardData.decks)
        ? cardData.decks[0]?.user_id
        : cardData.decks?.user_id;

    if (deckUserId !== user.id) {
        return { error: 'Card not found' };
    }

    const { error } = await supabase
        .from('cards')
        .delete()
        .eq('id', cardId);

    if (error) {
        console.error('Error deleting card:', error);
        return { error: 'Failed to delete card' };
    }

    revalidatePath('/decks');
    return { success: true };
}