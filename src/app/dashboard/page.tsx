/**
 * Filename: src/app/dashboard/page.tsx
 * Description: Server-side dashboard page that verifies authentication and fetches user profile data.
 */
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import DashboardContent from '@/components/DashboardContent'
import AppShell from '@/components/layout/AppShell'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Security: Redirect to login if not authenticated
    if (!user) {
        redirect('/login')
    }

    // Fetch user profile to get nickname
    const { data: profile } = await supabase
        .from('profiles')
        .select('nickname')
        .eq('id', user.id)
        .single()

    // @ts-ignore - Supabase types need to be regenerated from database schema
    const nickname = profile?.nickname || 'Learner'

    return (
        <AppShell userEmail={user.email}>
            <DashboardContent nickname={nickname} />
        </AppShell>
    )
}
