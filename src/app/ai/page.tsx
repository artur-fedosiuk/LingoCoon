// src/app/ai/page.tsx
// AI Mode — tabbed between Free Chat (AI) and Study with Decks.
// Loads decks AND user profile in parallel for a dynamic, user-aware AI tutor.
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getDecks } from '@/lib/actions/deck-actions';
import AiPageClient from '@/components/ai/AiPageClient';

export default async function AiPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Load decks AND the user profile in parallel — faster than sequential awaits.
  // We need native_language and target_language to build a personalised system prompt.
  const [{ decks }, profileRes] = await Promise.all([
    getDecks(),
    supabase
      .from('profiles')
      .select('native_language, target_language')
      .eq('id', user.id)
      .single(),
  ]);

  const profile = profileRes.data;

  return (
    <AiPageClient
      decks={decks}
      userEmail={user.email}
      nativeLanguage={profile?.native_language ?? null}
      targetLanguage={profile?.target_language ?? null}
    />
  );
}
