// File: src/app/study/[deckId]/page.tsx
// Created: 2024-01-01
// Last-Updated: 2025-06-01
// Author: Claude
// Description: Server page for the classic (non-AI) flashcard study session.
//              Loads cards due today, the deck metadata, and the user's native
//              language from Supabase, then renders the StudySession component.

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCardsForStudy, getDeck } from '@/lib/actions/deck-actions';
import StudySession from '@/components/study/StudySession';
import type { Deck } from '@/lib/supabase/types';

export default async function StudyPage({
  params,
}: {
  params: Promise<{ deckId: string }>;
}) {
  const { deckId } = await params;

  // Step 1: Connect to Supabase using the server-side client.
  // The server client reads the session from cookies — the browser never
  // sends the API key because this code runs only on the server.
  const supabase = await createClient();

  // Step 2: Verify authentication. getUser() checks the JWT token
  // cryptographically, so this cannot be bypassed.
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Step 3: Fetch all data in parallel for speed.
  // Promise.all starts all three queries at the same time.
  const [{ cards, error }, { deck }, profileResult] = await Promise.all([
    getCardsForStudy(deckId),
    getDeck(deckId),
    supabase
      .from('profiles')
      .select('native_language')
      .eq('id', user.id)
      .single(),
  ]);

  // Step 4: Extract native language with a safe fallback.
  // We define the fallback BEFORE the query result so that even if the
  // database is unavailable or the profile is incomplete, the app still works.
  const nativeLanguage =
    (profileResult.data as { native_language: string | null } | null)
      ?.native_language ?? 'en';

  // Step 5: Handle error states gracefully.
  if (error || !deck) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-500 text-base">{error ?? 'Deck not found'}</p>
      </div>
    );
  }

  // Step 6: If no cards are due for review today, tell the user.
  if (cards.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-gray-500">No cards due today</p>
      </div>
    );
  }

  // Step 7: Render the study session.
  // nativeLanguage is read from the user's profile — never hardcoded.
  return (
    <StudySession
      cards={cards}
      deck={deck as Deck}
      nativeLanguage={nativeLanguage}
    />
  );
}
