// Description: Server page for the classic (non-AI) flashcard study session.
//              Loads cards due today (or ALL cards if ?mode=all), the deck metadata,
//              and the user's native language from Supabase, then renders StudySession.

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCardsForStudy, getCardsForStudyAll, getDeck } from '@/lib/actions/deck-actions';
import StudySession from '@/components/study/StudySession';
import { DeckNotFound, NoCardsDue } from '@/components/study/StudyFeedback';
import type { Deck } from '@/lib/supabase/types';

export default async function StudyPage({
  params,
  searchParams,
}: {
  params: Promise<{ deckId: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { deckId } = await params;
  const { mode } = await searchParams;
  const studyAll = mode === 'all';

  // Step 1: Connect to Supabase using the server-side client.
  const supabase = await createClient();

  // Step 2: Verify authentication.
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Step 3: Fetch all data in parallel for speed.
  const [{ cards, error }, { deck }, profileResult] = await Promise.all([
    studyAll ? getCardsForStudyAll(deckId) : getCardsForStudy(deckId),
    getDeck(deckId),
    supabase
      .from('profiles')
      .select('native_language')
      .eq('id', user.id)
      .single(),
  ]);

  // Step 4: Extract native language with a safe fallback.
  const nativeLanguage =
    (profileResult.data as { native_language: string | null } | null)
      ?.native_language ?? 'en';

  // Step 5: Handle error states gracefully.
  if (error || !deck) {
    return <DeckNotFound error={error ?? undefined} />;
  }

  // Step 6: If no cards are due for review today (and not in free-study mode), tell the user.
  if (cards.length === 0) {
    return <NoCardsDue deckId={deck.id} mode="classic" />;
  }

  // Step 7: Render the study session.
  return (
    <StudySession
      cards={cards}
      deck={deck as Deck}
      nativeLanguage={nativeLanguage}
    />
  );
}
