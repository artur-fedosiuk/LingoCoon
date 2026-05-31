// Description: Server page for the AI-driven flashcard study session.
//              Loads the deck, cards (due today OR all if ?mode=all), and the user's
//              native language from the database, then passes all three to AiStudySession.

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCardsForStudy, getCardsForStudyAll, getDeck } from '@/lib/actions/deck-actions';
import AiStudySession from '@/components/study/AiStudySession';
import { DeckNotFound, NoCardsDue } from '@/components/study/StudyFeedback';
import type { Deck } from '@/lib/supabase/types';

export default async function AiStudyPage({
  params,
  searchParams,
}: {
  params: Promise<{ deckId: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { deckId } = await params;
  const { mode } = await searchParams;
  const studyAll = mode === 'all';

  // Step 1: Create the server-side Supabase client.
  const supabase = await createClient();

  // Step 2: Get the currently logged-in user.
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Step 3: Load cards, deck, AND user profile in parallel.
  const [{ cards, error }, { deck }, profileResult] = await Promise.all([
    studyAll ? getCardsForStudyAll(deckId) : getCardsForStudy(deckId),
    getDeck(deckId),
    supabase
      .from('profiles')
      .select('native_language')
      .eq('id', user.id)
      .single(),
  ]);

  // Step 4: Read the native language from the profile.
  const nativeLanguage =
    (profileResult.data as { native_language: string | null } | null)
      ?.native_language ?? 'en';

  // Step 5: Handle error states before rendering the UI.
  if (error || !deck) {
    return <DeckNotFound error={error ?? undefined} />;
  }

  // Step 6: If no cards are due today (and not in free-study mode), show "all caught up" screen.
  if (cards.length === 0) {
    return <NoCardsDue deckId={deck.id} mode="ai" />;
  }

  // Step 7: Render the AI study session with all required props.
  return (
    <AiStudySession
      cards={cards}
      deck={deck as Deck}
      nativeLanguage={nativeLanguage}
    />
  );
}
