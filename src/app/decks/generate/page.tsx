// src/app/decks/generate/page.tsx
// Server component: authenticates the user, loads their profile,
// and renders the AI deck generator page.

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AppShell from '@/components/layout/AppShell';
import AiDeckGenerator from '@/components/ai/AiDeckGenerator';

export default async function GenerateDeckPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Load the user's language profile so the generator can hint at the language pair.
  const { data: profile } = await supabase
    .from('profiles')
    .select('native_language, target_language')
    .eq('id', user.id)
    .single();

  return (
    <AppShell userEmail={user.email}>
      <AiDeckGenerator
        nativeLanguage={profile?.native_language ?? null}
        targetLanguage={profile?.target_language ?? null}
      />
    </AppShell>
  );
}
