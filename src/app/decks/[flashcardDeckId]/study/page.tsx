// Description: SERVER component — loads all the data before the page renders.
//              Passes pre-loaded data to DeckStudySession (the interactive client component).
//
// Why server component?
// The server can securely read the database (via cookies/session).
// The client (browser) only receives the final data — never the API keys.

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCards, getDeck } from '@/lib/actions/deck-actions';
import DeckStudySession from '@/components/study/DeckStudySession';
import { DeckNotFound } from '@/components/study/StudyFeedback';
import type { Deck } from '@/lib/supabase/types';

export default async function DeckStudyPage({
  params,
}: {
  params: Promise<{ flashcardDeckId: string }>;
}) {
  // Step 1: Get the deck ID from the URL (e.g. /decks/abc-123/study → "abc-123").
  const { flashcardDeckId } = await params;

  // Step 2: Create a server-side Supabase connection.
  const supabase = await createClient();

  // Step 3: Get the logged-in user. Redirect to login if not authenticated.
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Step 4: Load all data in parallel (faster than one after another).
  const [{ cards }, { deck }, profileResult] = await Promise.all([
    // getCards returns ALL cards in the deck (not filtered by due date).
    // This is intentional: the deck study page lets you study any card any time.
    getCards(flashcardDeckId),
    getDeck(flashcardDeckId),
    supabase.from('profiles').select('native_language').eq('id', user.id).single(),
  ]);

  // Step 5: Get native language with 'en' as fallback.
  const nativeLanguage =
    (profileResult.data as { native_language: string | null } | null)
      ?.native_language ?? 'en';

  // Step 6: If the deck doesn't exist or belongs to someone else, show an error.
  if (!deck) {
    return <DeckNotFound />;
  }

  // Step 7: Render the interactive study session with all pre-loaded data.
  return (
    <DeckStudySession
      cards={cards}
      deck={deck as Deck}
      deckId={flashcardDeckId}
      nativeLanguage={nativeLanguage}
    />
  );
}
