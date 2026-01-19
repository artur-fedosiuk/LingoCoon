/**
 * Filename: src/lib/actions/decks.ts
 * Description: Server actions for managing flashcard decks (create, read, delete)
 */
'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/types';

type DeckRow = Database['public']['Tables']['decks']['Row'];
type DeckInsert = Database['public']['Tables']['decks']['Insert'];

export interface Deck {
    id: string;
    user_id: string;
    title: string;
    description: string | null;
    language_from: string;
    language_to: string;
    card_count: number;
    created_at: string;
    updated_at: string;
}

export interface CreateDeckInput {
    title: string;
    description?: string;
    languageFrom?: string;
    languageTo?: string;
}

export interface ActionResult<T = void> {
    success: boolean;
    data?: T;
    error?: string;
}

/**
 * Create a new flashcard deck for the current user
 */
export async function createDeck(input: CreateDeckInput): Promise<ActionResult<Deck>> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        if (!input.title || input.title.trim().length === 0) {
            return { success: false, error: 'Title is required' };
        }

        const deckData: DeckInsert = {
            user_id: user.id,
            title: input.title.trim(),
            description: input.description?.trim() || null,
            language_from: input.languageFrom || 'en',
            language_to: input.languageTo || 'it'
        };

        const { data, error } = await supabase
            .from('decks')
            .insert(deckData as never)
            .select()
            .single();

        if (error) {
            console.error('Error creating deck:', error);
            return { success: false, error: 'Failed to create deck' };
        }

        revalidatePath('/decks');
        return { success: true, data: data as Deck };
    } catch (err) {
        console.error('Unexpected error creating deck:', err);
        return { success: false, error: 'An unexpected error occurred' };
    }
}

/**
 * Get all decks for the current user with card counts
 */
export async function getUserDecks(): Promise<ActionResult<Deck[]>> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        // Get all decks for the user (card_count is automatically updated by trigger)
        const { data: decks, error: decksError } = await supabase
            .from('decks')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (decksError) {
            console.error('Error fetching decks:', decksError);
            return { success: false, error: 'Failed to fetch decks' };
        }

        return { success: true, data: (decks || []) as Deck[] };
    } catch (err) {
        console.error('Unexpected error fetching decks:', err);
        return { success: false, error: 'An unexpected error occurred' };
    }
}

/**
 * Delete a deck and all its cards (cascade handled by database)
 */
export async function deleteDeck(deckId: string): Promise<ActionResult> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        // Verify the deck belongs to the user
        const { data: deck, error: fetchError } = await supabase
            .from('decks')
            .select('id')
            .eq('id', deckId)
            .eq('user_id', user.id)
            .single();

        if (fetchError || !deck) {
            return { success: false, error: 'Deck not found' };
        }

        // Delete the deck (cards will be deleted by CASCADE)
        const { error: deleteError } = await supabase
            .from('decks')
            .delete()
            .eq('id', deckId);

        if (deleteError) {
            console.error('Error deleting deck:', deleteError);
            return { success: false, error: 'Failed to delete deck' };
        }

        revalidatePath('/decks');
        return { success: true };
    } catch (err) {
        console.error('Unexpected error deleting deck:', err);
        return { success: false, error: 'An unexpected error occurred' };
    }
}

/**
 * Get a single deck by ID
 */
export async function getDeck(deckId: string): Promise<ActionResult<Deck>> {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: 'Not authenticated' };
        }

        const { data: deck, error } = await supabase
            .from('decks')
            .select('*')
            .eq('id', deckId)
            .eq('user_id', user.id)
            .single();

        if (error || !deck) {
            return { success: false, error: 'Deck not found' };
        }

        return {
            success: true,
            data: deck as Deck
        };
    } catch (err) {
        console.error('Unexpected error fetching deck:', err);
        return { success: false, error: 'An unexpected error occurred' };
    }
}
