'use server';

import { createClient } from '@/lib/supabase/server';
import { validateFlashcardText } from '@/lib/validation';
import { revalidatePath } from 'next/cache';
import type { Deck, Card, StudyProgress } from '@/lib/supabase/types';
import { createEmptyCard, fsrs, generatorParameters, Rating, type Card as FSRSCard, type RecordLogItem } from 'ts-fsrs';
import type { SessionCard } from '@/types/study';

// ─── AUTH ─────────────────────────────────────────────────────────────────────

async function getAuth() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  return { supabase, user };
}

// ─── VALIDATION ───────────────────────────────────────────────────────────────

function validateCard(front: string, back: string) {
  const frontCheck = validateFlashcardText(front);
  if (!frontCheck.isValid) return { error: frontCheck.error };

  const backCheck = validateFlashcardText(back);
  if (!backCheck.isValid) return { error: backCheck.error };

  return { front: front.trim(), back: back.trim() };
}

// ─── DECK FUNCTIONS ───────────────────────────────────────────────────────────

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

  revalidatePath('/dashboard');
  revalidatePath('/decks');

  return { deck: data };
}

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

// ─── CARD FUNCTIONS ───────────────────────────────────────────────────────────

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

// Fetch all cards due today for a deck, merged with FSRS progress
export async function getCardsForStudy(deckId: string): Promise<{ cards: SessionCard[]; error?: string }> {
  const { supabase, user } = await getAuth();

  if (!user) return { cards: [], error: 'Unauthorized' };

  const now = new Date().toISOString();

  // Load all cards for the deck with their study progress (left join via nested select)
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
      // Include card if: never studied OR due today/past
      if (!progress) return true;
      return progress.next_review_date <= now;
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

// Rate a card and update FSRS state in Supabase
export async function rateCard(
  cardId: string,
  rating: Rating
): Promise<{ error?: string }> {
  const { supabase, user } = await getAuth();

  if (!user) return { error: 'Unauthorized' };

  const { data: raw } = await supabase
    .from('study_progress')
    .select('*')
    .eq('user_id', user.id)
    .eq('card_id', cardId)
    .maybeSingle();

  const existing = raw as StudyProgress | null;

  const f = fsrs(generatorParameters());
  const now = new Date();

  const baseCard: FSRSCard = existing
    ? {
        ...createEmptyCard(now),
        due: new Date(existing.next_review_date),
        stability: existing.ease_factor,
        difficulty: 0,
        elapsed_days: existing.interval,
        scheduled_days: existing.interval,
        reps: existing.repetitions,
        lapses: 0,
        state: existing.repetitions === 0 ? 0 : 2,
        last_review: now,
      }
    : createEmptyCard(now);

  const scheduled = f.repeat(baseCard, now);
  const safeRating = ([Rating.Again, Rating.Hard, Rating.Good, Rating.Easy] as Rating[]).includes(rating)
    ? rating
    : Rating.Good;
  const entry = scheduled[safeRating as keyof typeof scheduled] as RecordLogItem;
  const result = entry.card;

  const { error } = await supabase
    .from('study_progress')
    .upsert(
      {
        user_id: user.id,
        card_id: cardId,
        ease_factor: result.stability,
        interval: result.scheduled_days,
        repetitions: result.reps,
        next_review_date: result.due.toISOString(),
      } as never,
      { onConflict: 'user_id,card_id' }
    );

  if (error) return { error: error.message };

  return {};
}

// ─── SESSION COMPLETION ───────────────────────────────────────────────────────

export async function completeStudySession(
  cardsStudied: number,
  ratings: Record<string, 'easy' | 'hard'>
): Promise<{ xpGained?: number; newXp?: number; newStreak?: number; error?: string }> {
  const { supabase, user } = await getAuth();

  if (!user) return { error: 'Unauthorized' };

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