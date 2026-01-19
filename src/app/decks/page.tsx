/**
 * Filename: src/app/decks/page.tsx
 * Description: Flashcard Hub page - centralized management for decks, cards, and studying.
 */
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getUserDecks } from '@/lib/actions/decks';
import AppShell from '@/components/layout/AppShell';
import DecksContent from './DecksContent';

export default async function DecksPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Security: Redirect to login if not authenticated
    if (!user) {
        redirect('/login');
    }

    // Fetch user's decks
    const result = await getUserDecks();
    const decks = result.success ? result.data || [] : [];

    return (
        <AppShell userEmail={user.email}>
            <DecksContent initialDecks={decks} />
        </AppShell>
    );
}
