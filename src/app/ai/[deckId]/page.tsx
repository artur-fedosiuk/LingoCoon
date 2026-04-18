// src/app/ai/[deckId]/page.tsx
// Loads the deck and its cards, then starts the AI study session.
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getCardsForStudy, getDeck } from '@/lib/actions/deck-actions';
import AiStudySession from '@/components/study/AiStudySession';
import type { Deck } from '@/lib/supabase/types';

export default async function AiDeckPage({
  params,
}: {
  params: Promise<{ deckId: string }>;
}) {
  const { deckId } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const [{ cards, error }, { deck }, profileRes] = await Promise.all([
    getCardsForStudy(deckId),
    getDeck(deckId),
    supabase.from('profiles').select('native_language').eq('id', user.id).single(),
  ]);

  const nativeLanguage = (profileRes.data as { native_language: string | null } | null)?.native_language ?? 'italiano';

  if (error || !deck) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-500">{error ?? 'Deck not found'}</p>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center space-y-4">
          <h1 className="text-xl font-semibold text-gray-900">Nessuna carta da ripassare oggi</h1>
          <p className="text-gray-500 text-sm">Sei in pari con questo mazzo.</p>
          <a
            href={`/decks/${deck.id}`}
            className="inline-block mt-2 border border-gray-300 text-gray-600 px-5 py-2 rounded-xl text-sm hover:border-gray-400 hover:text-gray-900 transition-colors"
          >
            Torna al mazzo
          </a>
        </div>
      </div>
    );
  }

  return <AiStudySession cards={cards} deck={deck as Deck} nativeLanguage={nativeLanguage} />;
}
