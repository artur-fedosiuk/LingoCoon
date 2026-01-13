import { createClient } from '@/lib/supabase/client';

// Keep the SAME SRS algorithm from old project
export function calculateSRSParameters(
    flashcard: {
        easiness?: number;
        interval?: number;
        review_count?: number;
    },
    quality: number,
    now = new Date()
) {
    let {
        easiness = 2.5,
        interval = 1,
        review_count = 0
    } = flashcard;

    const diff = 5 - quality;
    easiness = Math.max(1.3, easiness + (0.1 - diff * (0.08 + diff * 0.02)));

    if (quality <= 1) {
        review_count = 0;
        interval = 1;
    } else if (quality < 3) {
        review_count = 0;
        interval = 1;
    } else {
        if (review_count === 0) {
            interval = 1;
        } else if (review_count === 1) {
            interval = 6;
        } else {
            interval = Math.round(interval * easiness);
        }
        review_count += 1;
    }

    const nextReview = new Date(now);
    nextReview.setDate(nextReview.getDate() + interval);

    const knowledge_level = Math.min(5, Math.max(1, Math.round(easiness)));

    return {
        easiness,
        interval,
        review_count,
        knowledge_level,
        next_review: nextReview.toISOString()
    };
}

export interface FlashcardData {
    originalWord: string;
    translation: string;
    originalLanguage?: string;
    translationLanguage?: string;
    notes?: string;
    category?: string;
}

export interface FlashcardRecord {
    id: string;
    user_id: string;
    original_word: string;
    translation: string;
    original_language: string;
    translation_language: string;
    notes: string;
    category: string;
    created_at: string;
    updated_at: string;
    knowledge_level: number;
    last_review: string | null;
    next_review: string;
    review_count: number;
    easiness: number;
    interval: number;
}

export async function createFlashcard(userId: string, flashcardData: FlashcardData) {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('flashcards')
        .insert({
            user_id: userId,
            original_word: flashcardData.originalWord.trim(),
            translation: flashcardData.translation.trim(),
            original_language: flashcardData.originalLanguage || 'en-US',
            translation_language: flashcardData.translationLanguage || 'it-IT',
            notes: flashcardData.notes || '',
            category: flashcardData.category || 'general',
            knowledge_level: 1,
            review_count: 0,
            easiness: 2.5,
            interval: 1,
            next_review: new Date().toISOString()
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating flashcard:', error);
        return { success: false, error: error.message };
    }

    return { success: true, data };
}

export async function getFlashcards(userId: string) {
    const supabase = createClient();

    const { data, error } = await supabase
        .from('flashcards')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error getting flashcards:', error);
        return { success: false, error: error.message };
    }

    return { success: true, data: data as FlashcardRecord[] };
}

export async function getFlashcardsForReview(userId: string, limit = 20) {
    const supabase = createClient();
    const today = new Date().toISOString();

    const { data, error } = await supabase
        .from('flashcards')
        .select('*')
        .eq('user_id', userId)
        .lte('next_review', today)
        .order('next_review', { ascending: true })
        .limit(limit);

    if (error) {
        console.error('Error getting flashcards for review:', error);
        return { success: false, error: error.message };
    }

    return { success: true, data: data as FlashcardRecord[], total: data?.length || 0 };
}

export async function recordReview(flashcardId: string, quality: number) {
    const supabase = createClient();

    // Get current flashcard
    const { data: flashcard, error: fetchError } = await supabase
        .from('flashcards')
        .select('*')
        .eq('id', flashcardId)
        .single();

    if (fetchError || !flashcard) {
        return { success: false, error: 'Flashcard not found' };
    }

    // Calculate new SRS parameters
    const updates = calculateSRSParameters(flashcard, quality);

    // Update flashcard
    const { error: updateError } = await supabase
        .from('flashcards')
        .update({
            ...updates,
            last_review: new Date().toISOString()
        })
        .eq('id', flashcardId);

    if (updateError) {
        return { success: false, error: updateError.message };
    }

    return {
        success: true,
        nextReview: updates.next_review,
        interval: updates.interval,
        knowledge_level: updates.knowledge_level
    };
}

export async function updateFlashcard(flashcardId: string, updates: Partial<FlashcardData>) {
    const supabase = createClient();

    const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString()
    };

    if (updates.originalWord) updateData.original_word = updates.originalWord.trim();
    if (updates.translation) updateData.translation = updates.translation.trim();
    if (updates.originalLanguage) updateData.original_language = updates.originalLanguage;
    if (updates.translationLanguage) updateData.translation_language = updates.translationLanguage;
    if (updates.notes !== undefined) updateData.notes = updates.notes;
    if (updates.category) updateData.category = updates.category;

    const { error } = await supabase
        .from('flashcards')
        .update(updateData)
        .eq('id', flashcardId);

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true };
}

export async function deleteFlashcard(flashcardId: string) {
    const supabase = createClient();

    const { error } = await supabase
        .from('flashcards')
        .delete()
        .eq('id', flashcardId);

    if (error) {
        return { success: false, error: error.message };
    }

    return { success: true };
}

export async function getStatistics(userId: string) {
    const supabase = createClient();

    const { data: flashcards, error } = await supabase
        .from('flashcards')
        .select('*')
        .eq('user_id', userId);

    if (error || !flashcards) {
        return { success: false, error: error?.message };
    }

    const today = new Date().toISOString();

    const statistics = {
        total: flashcards.length,
        dueForReview: flashcards.filter((f: FlashcardRecord) => f.next_review <= today).length,
        new: flashcards.filter((f: FlashcardRecord) => f.review_count === 0).length,
        mastered: flashcards.filter((f: FlashcardRecord) => f.knowledge_level >= 4).length,
        averageReviews: flashcards.length > 0
            ? Math.round(flashcards.reduce((sum: number, f: FlashcardRecord) => sum + (f.review_count || 0), 0) / flashcards.length)
            : 0,
        byLevel: {
            level1: flashcards.filter((f: FlashcardRecord) => f.knowledge_level === 1).length,
            level2: flashcards.filter((f: FlashcardRecord) => f.knowledge_level === 2).length,
            level3: flashcards.filter((f: FlashcardRecord) => f.knowledge_level === 3).length,
            level4: flashcards.filter((f: FlashcardRecord) => f.knowledge_level === 4).length,
            level5: flashcards.filter((f: FlashcardRecord) => f.knowledge_level === 5).length,
        }
    };

    return { success: true, data: statistics };
}

// Batch operations for importing flashcards
export async function importFlashcards(userId: string, flashcards: FlashcardData[]) {
    const supabase = createClient();

    const flashcardsToInsert = flashcards.map(card => ({
        user_id: userId,
        original_word: card.originalWord.trim(),
        translation: card.translation.trim(),
        original_language: card.originalLanguage || 'en-US',
        translation_language: card.translationLanguage || 'it-IT',
        notes: card.notes || '',
        category: card.category || 'general',
        knowledge_level: 1,
        review_count: 0,
        easiness: 2.5,
        interval: 1,
        next_review: new Date().toISOString()
    }));

    const { data, error } = await supabase
        .from('flashcards')
        .insert(flashcardsToInsert)
        .select();

    if (error) {
        console.error('Error importing flashcards:', error);
        return { success: false, error: error.message };
    }

    return { success: true, data, count: data?.length || 0 };
}
