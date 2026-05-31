// Description: Server Actions for all deck, card, and study session operations.
//              "use server" means ALL of this code runs on the server only.
//              The browser never sees this code — it calls it like a regular function.

'use server';

import { createClient } from '@/lib/supabase/server';
import { validateFlashcardText } from '@/lib/validation';
import { revalidatePath } from 'next/cache';
import type { Deck, Card, StudyProgress } from '@/lib/supabase/types';
import {
  createEmptyCard,
  fsrs,
  generatorParameters,
  Rating,
  type Card as FSRSCard,
  type RecordLogItem,
} from 'ts-fsrs';
import type { SessionCard } from '@/types/study';

// ─── AUTH HELPER ──────────────────────────────────────────────────────────────

/**
 * getAuth — creates a Supabase client and reads the currently logged-in user.
 * Called at the start of every action so we always know WHO is making the request.
 */
async function getAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

// ─── VALIDATION HELPER ────────────────────────────────────────────────────────

/**
 * validateCard — checks that front and back text are not empty and not too long.
 * Returns either { front, back } (clean text) or { error } (problem description).
 */
function validateCard(front: string, back: string) {
  const frontCheck = validateFlashcardText(front);
  if (!frontCheck.isValid) return { error: frontCheck.error };

  const backCheck = validateFlashcardText(back);
  if (!backCheck.isValid) return { error: backCheck.error };

  return { front: front.trim(), back: back.trim() };
}

// ─── DECK ACTIONS ─────────────────────────────────────────────────────────────

/** Creates a new flashcard deck for the logged-in user. */
export async function createDeck(
  title: string,
  languageFrom: string,
  languageTo: string
): Promise<{ deck?: Deck; error?: string }> {
  const { supabase, user } = await getAuth();
  if (!user) return { error: 'Unauthorized' };
  if (!title.trim()) return { error: 'Title cannot be empty' };
  if (languageFrom === languageTo) return { error: 'Languages must be different' };

  const { data, error } = await supabase
    .from('decks')
    .insert({ title: title.trim(), language_from: languageFrom, language_to: languageTo, user_id: user.id } as never)
    .select()
    .single();

  if (error) return { error: error.message };

  // Tell Next.js to refresh the cached data for these pages.
  revalidatePath('/dashboard');
  revalidatePath('/decks');
  return { deck: data };
}

/** Returns all decks belonging to the logged-in user, with card counts. */
export async function getDecks(): Promise<{ decks: Deck[] }> {
  const { supabase, user } = await getAuth();
  if (!user) return { decks: [] };

  const { data, error } = await supabase
    .from('decks')
    .select('*, cards(count)')
    .eq('user_id', user.id)
    .order('created_at');

  if (error) return { decks: [] };

  const decks = (data ?? []).map((deck: any) => ({
    ...deck,
    card_count: deck.cards?.[0]?.count ?? 0,
  }));
  return { decks };
}

/** Returns a single deck by ID (must belong to the logged-in user). */
export async function getDeck(deckId: string): Promise<{ deck: Deck | null }> {
  const { supabase, user } = await getAuth();
  if (!user) return { deck: null };

  const { data, error } = await supabase
    .from('decks')
    .select('*')
    .eq('user_id', user.id)
    .eq('id', deckId)
    .single();

  if (error) return { deck: null };
  return { deck: data };
}

/** Permanently deletes a deck and all its cards. */
export async function deleteDeck(deckId: string): Promise<{ error?: string }> {
  const { supabase, user } = await getAuth();
  if (!user) return { error: 'Unauthorized' };

  const { error } = await supabase
    .from('decks')
    .delete()
    .eq('id', deckId)
    .eq('user_id', user.id);

  if (error) return { error: error.message };

  revalidatePath('/dashboard');
  revalidatePath('/decks');
  return {};
}

// ─── CARD ACTIONS ─────────────────────────────────────────────────────────────

/** Returns ALL cards in a deck (no due-date filter). Used by the deck study page. */
export async function getCards(deckId: string): Promise<{ cards: Card[]; error?: string }> {
  const { supabase, user } = await getAuth();
  if (!user) return { cards: [] };

  const { data, error } = await supabase
    .from('cards')
    .select('*')
    .eq('deck_id', deckId)
    .order('created_at');

  if (error) return { cards: [], error: error.message };
  return { cards: data ?? [] };
}

/** Creates a new flashcard in a deck. */
export async function createCard(
  deckId: string,
  front: string,
  back: string
): Promise<{ card?: Card; error?: string }> {
  const { supabase, user } = await getAuth();
  if (!user) return { error: 'Unauthorized' };

  const validated = validateCard(front, back);
  if ('error' in validated) return { error: validated.error };

  const { data, error } = await supabase
    .from('cards')
    .insert({ deck_id: deckId, front: validated.front, back: validated.back } as never)
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath(`/decks/${deckId}`);
  return { card: data };
}

/** Updates the front and back text of a flashcard. */
export async function updateCard(
  cardId: string,
  deckId: string,
  front: string,
  back: string
): Promise<{ card?: Card; error?: string }> {
  const { supabase, user } = await getAuth();
  if (!user) return { error: 'Unauthorized' };

  const validated = validateCard(front, back);
  if ('error' in validated) return { error: validated.error };

  const { data, error } = await supabase
    .from('cards')
    .update({ front: validated.front, back: validated.back } as never)
    .eq('id', cardId)
    .eq('deck_id', deckId)
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath(`/decks/${deckId}`);
  return { card: data };
}

/** Permanently deletes a single flashcard. */
export async function deleteCard(
  cardId: string,
  deckId: string
): Promise<{ error?: string }> {
  const { supabase, user } = await getAuth();
  if (!user) return { error: 'Unauthorized' };

  const { error } = await supabase
    .from('cards')
    .delete()
    .eq('id', cardId)
    .eq('deck_id', deckId);

  if (error) return { error: error.message };

  revalidatePath(`/decks/${deckId}`);
  return {};
}

// ─── STUDY SESSION ────────────────────────────────────────────────────────────

/**
 * getCardsForStudy — returns only the cards that are DUE for review today.
 * Uses the FSRS next_review_date to filter.
 * Cards never studied before are always included.
 * Used by the /study routes (FSRS-scheduled review sessions).
 */
export async function getCardsForStudy(deckId: string): Promise<{ cards: SessionCard[]; error?: string }> {
  const { supabase, user } = await getAuth();
  if (!user) return { cards: [], error: 'Unauthorized' };

  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('cards')
    .select(`
      id,
      deck_id,
      front,
      back,
      example_sentence,
      pronunciation,
      study_progress (
        ease_factor,
        interval,
        repetitions,
        next_review_date
      )
    `)
    .eq('deck_id', deckId);

  if (error) return { cards: [], error: error.message };

  const cards: SessionCard[] = (data ?? [])
    .filter((card: any) => {
      const progress = card.study_progress?.[0];
      if (!progress) return true; // Never studied → always include
      return progress.next_review_date <= now; // Due today or overdue
    })
    .map((card: any) => {
      const progress = card.study_progress?.[0] ?? null;
      return {
        id: card.id,
        deckId: card.deck_id,
        front: card.front,
        back: card.back,
        exampleSentence: card.example_sentence ?? null,
        pronunciation: card.pronunciation ?? null,
        easeFactor: progress?.ease_factor ?? null,
        interval: progress?.interval ?? null,
        repetitions: progress?.repetitions ?? null,
        nextReviewDate: progress?.next_review_date ?? null,
        isFlipped: false,
      };
    });

  return { cards };
}

/**
 * getCardsForStudyAll — returns ALL cards in a deck as SessionCard[], regardless of due date.
 * Used when the user explicitly chooses to study beyond their scheduled cards for the day.
 */
export async function getCardsForStudyAll(deckId: string): Promise<{ cards: SessionCard[]; error?: string }> {
  const { supabase, user } = await getAuth();
  if (!user) return { cards: [], error: 'Unauthorized' };

  const { data, error } = await supabase
    .from('cards')
    .select(`
      id,
      deck_id,
      front,
      back,
      example_sentence,
      pronunciation,
      study_progress (
        ease_factor,
        interval,
        repetitions,
        next_review_date
      )
    `)
    .eq('deck_id', deckId)
    .order('created_at');

  if (error) return { cards: [], error: error.message };

  const cards: SessionCard[] = (data ?? []).map((card: any) => {
    const progress = card.study_progress?.[0] ?? null;
    return {
      id: card.id,
      deckId: card.deck_id,
      front: card.front,
      back: card.back,
      exampleSentence: card.example_sentence ?? null,
      pronunciation: card.pronunciation ?? null,
      easeFactor: progress?.ease_factor ?? null,
      interval: progress?.interval ?? null,
      repetitions: progress?.repetitions ?? null,
      nextReviewDate: progress?.next_review_date ?? null,
      isFlipped: false,
    };
  });

  return { cards };
}

/**
 * rateCard — saves the student's rating for a card and computes the next review date.
 *
 * This uses the FSRS (Free Spaced Repetition Scheduler) algorithm.
 * FSRS decides HOW MANY DAYS until the card should be shown again,
 * based on how well the student remembered it and how many times they've seen it.
 *
 * The rating scale:
 *   Rating.Again (1) = forgot completely → show again very soon
 *   Rating.Hard  (2) = remembered with difficulty → show in a few days
 *   Rating.Good  (3) = remembered correctly → show in ~1-2 weeks
 *   Rating.Easy  (4) = too easy → show in a month or more
 */
export async function rateCard(
  cardId: string,
  rating: Rating
): Promise<{ error?: string }> {
  const { supabase, user } = await getAuth();
  if (!user) return { error: 'Unauthorized' };

  // Load the existing study progress for this card (if any).
  const { data: raw } = await supabase
    .from('study_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('card_id', cardId)
    .maybeSingle();

  const existing = raw as StudyProgress | null;

  // Create the FSRS scheduler with default parameters.
  const f = fsrs(generatorParameters());
  const now = new Date();

  // Reconstruct the FSRS card state from our database values.
  // If the card has never been studied, createEmptyCard gives a fresh starting state.
  const baseCard: FSRSCard = existing
    ? {
        ...createEmptyCard(now),          // Start with valid defaults for all fields
        due: new Date(existing.next_review_date),
        stability: existing.ease_factor,  // ease_factor stores the FSRS stability value
        // ─── FIX ─────────────────────────────────────────────────────────────
        // difficulty: 0 was causing "Invalid memory state" crash.
        // The FSRS difficulty scale is 1–10 (5 = average).
        // We don't store difficulty yet, so we use 5.0 as a safe neutral default.
        // The algorithm will recalculate the correct difficulty after this rating.
        difficulty: 5.0,
        // ─────────────────────────────────────────────────────────────────────
        elapsed_days: existing.interval,
        scheduled_days: existing.interval,
        reps: existing.repetitions,
        lapses: 0,
        state: existing.repetitions === 0 ? 0 : 2, // 0=New, 2=Review
        last_review: now,
      }
    : createEmptyCard(now); // First time seeing this card — use fresh state

  // Ask FSRS: "if the student rates this card X, when should it appear next?"
  // f.repeat() returns a schedule for ALL four possible ratings at once.
  const scheduled = f.repeat(baseCard, now);

  // Clamp the rating to a valid value (default to Good if something unexpected arrives).
  const safeRating = ([Rating.Again, Rating.Hard, Rating.Good, Rating.Easy] as Rating[]).includes(rating)
    ? rating
    : Rating.Good;

  // Pick the result for the actual rating the student gave.
  const entry = scheduled[safeRating as keyof typeof scheduled] as RecordLogItem;
  const result = entry.card;

  // Save the new FSRS state back to the database.
  // upsert = "insert if not exists, update if exists" — one operation handles both cases.
  const { error } = await supabase
    .from('study_progress')
    .upsert(
      {
        user_id: user.id,
        card_id: cardId,
        ease_factor: result.stability,        // How well the student knows this card
        interval: result.scheduled_days,      // Days until next review
        repetitions: result.reps,             // Total number of times reviewed
        next_review_date: result.due.toISOString(), // Exact date/time of next review
      } as never,
      { onConflict: 'user_id,card_id' }
    );

  if (error) return { error: error.message };
  return {};
}

// ─── BULK DECK + CARDS CREATION ─────────────────────────────────────────────

/**
 * createDeckWithCards — atomically creates a deck and bulk-inserts all its cards.
 *
 * Used by the AI deck generator after the user approves the generated content.
 *
 * Atomicity note:
 *   Supabase JS does not expose transactions directly. If the card insert fails
 *   after the deck is created, we do a best-effort DELETE of the deck.
 *   This is NOT a true atomic transaction — for full atomicity, move this logic
 *   to a Postgres function (RPC) and call it via supabase.rpc().
 *   Accepted trade-off for now: failure rate is low and the UX recovers gracefully.
 *
 * Why bulk insert over N createCard() calls?
 *   N sequential round-trips to the DB = N × network latency.
 *   One INSERT with N rows = 1 round-trip regardless of deck size.
 *   On a 50-card deck this is the difference between ~2 500 ms and ~50 ms.
 */
export async function createDeckWithCards(
  title: string,
  languageFrom: string,
  languageTo: string,
  cards: ReadonlyArray<{ front: string; back: string; example_sentence?: string | null }>,
): Promise<{ deck?: Deck; error?: string }> {
  const { supabase, user } = await getAuth();
  if (!user) return { error: 'Unauthorized' };

  if (!title.trim()) return { error: 'Title cannot be empty.' };
  if (languageFrom === languageTo) return { error: 'Languages must be different.' };
  if (cards.length === 0) return { error: 'At least one card is required.' };
  if (cards.length > 100) return { error: 'Maximum 100 cards per deck.' };

  // Validate ALL cards before touching the database.
  // Fail-fast: if any card is invalid, abort before creating anything.
  // This prevents partial state (deck exists, some cards missing).
  for (const card of cards) {
    const frontCheck = validateFlashcardText(card.front);
    if (!frontCheck.isValid) return { error: `Card validation failed: ${frontCheck.error}` };
    const backCheck = validateFlashcardText(card.back);
    if (!backCheck.isValid) return { error: `Card validation failed: ${backCheck.error}` };
  }

  // Step 1: Create the deck.
  const { data: deckData, error: deckError } = await supabase
    .from('decks')
    .insert({
      title: title.trim(),
      language_from: languageFrom,
      language_to: languageTo,
      user_id: user.id,
    } as never)
    .select()
    .single();

  if (deckError || !deckData) {
    return { error: deckError?.message ?? 'Failed to create deck.' };
  }

  const deck = deckData as Deck;

  // Step 2: Bulk-insert all cards in a single query.
  const rows = cards.map((card) => ({
    deck_id: deck.id,
    front: card.front.trim(),
    back: card.back.trim(),
    example_sentence: card.example_sentence?.trim() ?? null,
  }));

  const { error: cardsError } = await supabase
    .from('cards')
    .insert(rows as never);

  if (cardsError) {
    // Best-effort rollback: clean up the orphaned deck.
    await supabase.from('decks').delete().eq('id', deck.id);
    return { error: cardsError.message };
  }

  revalidatePath('/dashboard');
  revalidatePath('/decks');

  return { deck: { ...deck, card_count: rows.length } };
}

// ─── SESSION COMPLETION ───────────────────────────────────────────────────────

/**
 * completeStudySession — called when the student finishes all cards.
 * Awards XP and increments the daily streak in the user's profile.
 */
export async function completeStudySession(
  cardsStudied: number,
  ratings: Record<string, 'easy' | 'hard'>
): Promise<{ xpGained?: number; newXp?: number; newStreak?: number; error?: string }> {
  const { supabase, user } = await getAuth();
  if (!user) return { error: 'Unauthorized' };

  // Calculate XP: easy cards = 10 points, hard cards = 5 points.
  const easyCount = Object.values(ratings).filter(r => r === 'easy').length;
  const xpGained = easyCount * 10 + (cardsStudied - easyCount) * 5;

  const { data: rawProfile, error: fetchError } = await supabase
    .from('profiles')
    .select('xp, streak')
    .eq('id', user.id)
    .single();

  if (fetchError) return { error: fetchError.message };

  const profile = rawProfile as { xp: number; streak: number } | null;
  const newXp = (profile?.xp ?? 0) + xpGained;
  const newStreak = (profile?.streak ?? 0) + 1;

  const { error: updateError } = await supabase
    .from('profiles')
    .update({ xp: newXp, streak: newStreak } as never)
    .eq('id', user.id);

  if (updateError) return { error: updateError.message };

  revalidatePath('/dashboard');
  return { xpGained, newXp, newStreak };
}
