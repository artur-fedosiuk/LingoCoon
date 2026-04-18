import { getCardsForStudy, getDeck } from '@/lib/actions/deck-actions';
import AiStudySession from '@/components/study/AiStudySession';
import type { Deck } from '@/lib/supabase/types';

export default async function AiStudyPage({
  params,
}: {
  params: Promise<{ deckId: string }>;
}) {
  const { deckId } = await params;

  const [{ cards, error }, { deck }] = await Promise.all([
    getCardsForStudy(deckId),
    getDeck(deckId),
  ]);

  if (error || !deck) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-500 text-base">{error ?? 'Deck not found'}</p>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="text-center space-y-4">
          <p className="text-4xl">✅</p>
          <h1 className="text-xl font-semibold text-gray-900">No cards due today</h1>
          <p className="text-gray-500 text-sm">You&apos;re all caught up with this deck.</p>
          <a
            href={`/decks/${deck.id}`}
            className="inline-block mt-2 border border-gray-300 text-gray-600 px-5 py-2 rounded-xl text-sm hover:border-gray-400 hover:text-gray-900 transition-colors"
          >
            Back to deck
          </a>
        </div>
      </div>
    );
  }

  return <AiStudySession cards={cards} deck={deck as Deck} />;
}
