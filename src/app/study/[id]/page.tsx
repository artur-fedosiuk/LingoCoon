/**
 * Filename: src/app/study/[id]/page.tsx
 * Description: Server page for the Anki-style study mode - fetches cards and renders the study session
 */

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import StudySession from '@/components/study/StudySession';
import type { Card } from '@/lib/supabase/types';

interface StudyPageProps {
    params: Promise<{ id: string }>;
}

export default async function StudyPage({ params }: StudyPageProps) {
    const { id: deckId } = await params;
    const supabase = await createClient();

    // Verify authentication
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        redirect('/login');
    }

    // Fetch the deck to verify ownership and get deck info
    const { data: deck, error: deckError } = await supabase
        .from('decks')
        .select('id, title, user_id')
        .eq('id', deckId)
        .eq('user_id', user.id)
        .single();

    if (deckError || !deck) {
        redirect('/decks');
    }

    // Type assertion for deck
    const deckData = deck as { id: string; title: string; user_id: string };

    // Fetch all cards for this deck
    const { data: cards, error: cardsError } = await supabase
        .from('cards')
        .select('*')
        .eq('deck_id', deckId)
        .order('created_at', { ascending: true });

    if (cardsError) {
        console.error('Error fetching cards:', cardsError);
        redirect('/decks');
    }

    // If no cards exist, show empty state
    if (!cards || cards.length === 0) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-white dark:bg-black p-4">
                <div className="w-full max-w-md space-y-6 text-center">
                    <div className="mb-6 flex h-20 w-20 mx-auto items-center justify-center rounded-full bg-black/5 dark:bg-white/5">
                        <svg
                            className="h-10 w-10 text-black/40 dark:text-white/40"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                            />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-black dark:text-white">
                        This deck is empty
                    </h1>
                    <p className="text-black/60 dark:text-white/60">
                        Add some cards to start studying
                    </p>
                    <a
                        href={`/decks/${deckId}`}
                        className="inline-block rounded-lg bg-black px-6 py-3 text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90 transition-colors font-medium"
                    >
                        Add Cards
                    </a>
                </div>
            </div>
        );
    }

    // Render the study session with cards
    return <StudySession cards={cards as Card[]} deckId={deckId} deckTitle={deckData.title} />;
}
