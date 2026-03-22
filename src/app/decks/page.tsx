// src/app/decks/page.tsx
// Server component: loads the user's decks and renders the Flashcard Hub page.
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getDecks } from '@/lib/actions/deck-actions';
import AppShell from '@/components/layout/AppShell';
import DecksContent from './DecksContent';

export default async function DecksPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Redirect to login if not authenticated
    if (!user) {
        redirect('/login');
    }

    // Fetch user's decks from the database
    const { decks } = await getDecks();

    return (
        <AppShell userEmail={user.email}>
            <DecksContent initialDecks={decks} />
        </AppShell>
    );
}
