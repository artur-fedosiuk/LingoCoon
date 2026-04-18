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
        <p className="text-red-500 text-base">{error ?? 'Deck not found'}</p>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-lg text-gray-500">No cards due today</p>
      </div>
    );
  }

  return <StudySession cards={cards} deck={deck as Deck} nativeLanguage={nativeLanguage} />;
}
