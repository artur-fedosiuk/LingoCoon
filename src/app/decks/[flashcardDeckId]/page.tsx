// app/decks/[flashcardDeckId]/page.tsx
import { createClient } from '@/utils/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import CreateCardForm from '@/components/flashcards/CreateCardForm';
import CardItem from '@/components/flashcards/CardItem';
import DeckActionsMenu from '@/components/decks/DeckActionsMenu';
import { ArrowLeft, Play } from 'lucide-react';
import type { Card } from '@/lib/types';

export default async function DeckPage({ 
  params 
}: { 
  params: Promise<{ flashcardDeckId: string }> 
}) {
  const { flashcardDeckId } = await params;
  const supabase = await createClient();

  // Get current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Get deck details
  const { data: deck, error: deckError } = await supabase
    .from('decks')
    .select('*')
    .eq('id', flashcardDeckId)
    .eq('user_id', user.id)
    .single();

  if (deckError || !deck) {
    console.error(deckError);
    return notFound();
  }

  // Get existing cards
  const { data: cards } = await supabase
    .from('cards')
    .select('*')
    .eq('deck_id', flashcardDeckId)
    .order('created_at', { ascending: false });

  return (
    <div className="container mx-auto p-6 space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
        <div className="flex-1">
          <Link 
            href="/dashboard" 
            className="flex items-center gap-2 text-gray-900 hover:text-gray-700 hover:underline mb-3 text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Decks
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">{deck.title}</h1>
          <p className="text-gray-500 mt-1">
            {deck.language_from.toUpperCase()} → {deck.language_to.toUpperCase()}
          </p>
        </div>
        
        <div className="flex gap-3 items-start">
          {cards && cards.length > 0 && (
            <Link href={`/decks/${flashcardDeckId}/study`}>
              <button className="bg-black text-white px-6 py-3 rounded-lg font-medium hover:bg-gray-800 flex items-center gap-2 shadow-lg">
                <Play className="w-5 h-5" />
                Start Study Session
              </button>
            </Link>
          )}
          <DeckActionsMenu deckId={deck.id} deckTitle={deck.title} />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Left Column: Add New Card */}
        <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 h-fit">
          <h2 className="font-semibold text-lg mb-4 text-gray-900">Add New Card</h2>
          <CreateCardForm 
            deckId={deck.id} 
            deckLanguage={deck.language_from}
          />
        </div>

        {/* Right Column: Existing Cards List */}
        <div className="space-y-4">
          <h2 className="font-semibold text-lg flex justify-between items-center text-gray-900">
            Cards in Deck
            <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
              {cards?.length || 0}
            </span>
          </h2>
          
          {!cards || cards.length === 0 ? (
            <div className="text-center py-16 text-gray-400 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
              <p className="text-lg mb-2">No cards yet</p>
              <p className="text-sm">Add one on the left! 👈</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-[700px] overflow-y-auto pr-2">
              {cards.map((card: Card) => (
                <CardItem
                  key={card.id}
                  card={card}
                  deckId={deck.id}
                  deckLanguage={deck.language_from}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}