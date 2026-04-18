// File: src/app/study/ai/[deckId]/page.tsx
// Created: 2024-01-01
// Last-Updated: 2025-06-01
// Author: Claude
// Description: Server page for the AI-driven flashcard study session.
//              Loads the deck, cards, AND the user's native language from the
//              database, then passes all three to the AiStudySession component.

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCardsForStudy, getDeck } from '@/lib/actions/deck-actions';
import AiStudySession from '@/components/study/AiStudySession';
import type { Deck } from '@/lib/supabase/types';

export default async function AiStudyPage({
  params,
}: {
  params: Promise<{ deckId: string }>;
}) {
  const { deckId } = await params;

  // Step 1: Create the server-side Supabase client.
  // This client reads the user's session from secure HTTP-only cookies.
  const supabase = await createClient();

  // Step 2: Get the currently logged-in user.
  // getUser() verifies the session cryptographically — it cannot be faked.
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Step 3: Load cards, deck, AND user profile in parallel.
  // Promise.all fires all three queries at the same time instead of one by one,
  // which is faster (all three resolve together).
  const [{ cards, error }, { deck }, profileResult] = await Promise.all([
    getCardsForStudy(deckId),
    getDeck(deckId),
    supabase
      .from('profiles')
      .select('native_language')
      .eq('id', user.id)
      .single(),
  ]);

  // Step 4: Read the native language from the profile.
  // We fall back to 'en' if the profile is missing or the field is empty.
  // This is a "defensive default" — the app keeps working even with incomplete data.
  const nativeLanguage =
    (profileResult.data as { native_language: string | null } | null)
      ?.native_language ?? 'en';

  // Step 5: Handle error states before rendering the UI.
  if (error || !deck) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-500 text-base">{error ?? 'Deck not found'}</p>
      </div>
    );
  }

  // Step 6: If no cards are due today, show a friendly "all caught up" screen.
  if (cards.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center space-y-4">
          <p className="text-4xl">✅</p>
          <h1 className="text-xl font-semibold text-gray-900">No cards due today</h1>
          <p className="text-gray-500 text-sm">You&apos;re all caught up with this deck.</p>
          <a
            href={`/decks/${deck.id}`}
            className="inline-block mt-2 border border-gray-300 text-gray-600 px-5 py-2
                       rounded-xl text-sm hover:border-gray-400 hover:text-gray-900 transition-colors"
          >
            Back to deck
          </a>
        </div>
      </div>
    );
  }

  // Step 7: Render the AI study session with all required props.
  // nativeLanguage is now dynamic — it comes from the user's profile in Supabase,
  // not from a hardcoded string in the source code.
  return (
    <AiStudySession
      cards={cards}
      deck={deck as Deck}
      nativeLanguage={nativeLanguage}
    />
  );
}
