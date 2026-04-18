// src/app/ai/page.tsx
// AI Mode — tabbed between Free Chat (Gemini) and Study with Decks.
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getDecks } from '@/lib/actions/deck-actions';
import AiPageClient from '@/components/ai/AiPageClient';

export default async function AiPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { decks } = await getDecks();

  return <AiPageClient decks={decks} userEmail={user.email} />;
}
