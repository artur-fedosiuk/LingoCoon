/**
 * Filename: src/app/settings/page.tsx
 * Description: Settings page wrapped in AppShell layout.
 */
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import AppShell from '@/components/layout/AppShell';
import SettingsContent from './SettingsContent';

export default async function SettingsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    // Security: Redirect to login if not authenticated
    if (!user) {
        redirect('/login');
    }

    // Fetch user profile
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

    return (
        <AppShell userEmail={user.email}>
            <SettingsContent profile={profile} />
        </AppShell>
    );
}
