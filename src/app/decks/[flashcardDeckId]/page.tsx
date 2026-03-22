// src/app/decks/[flashcardDeckId]/page.tsx
// Server component: loads deck and its cards, then renders the deck detail page.
import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import DeckPageContent from './DeckPageContent';

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
    <DeckPageContent 
      deck={deck} 
      cards={cards || []} 
      userEmail={user.email} 
    />
  );
}