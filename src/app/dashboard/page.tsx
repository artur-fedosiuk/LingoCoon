import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/app/login/actions'
import { Button } from '@/components/ui/button'
import LanguageSelector from '@/components/LanguageSelector'
import DashboardContent from '@/components/DashboardContent'
import { LogOut } from 'lucide-react'

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
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
            {/* Header */}
            <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-slate-950/80">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                        LinguaFlow
                    </h1>
                    <div className="flex items-center gap-4">
                        <LanguageSelector />
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                            {user.email}
                        </span>
                        <form>
                            <Button
                                formAction={signOut}
                                variant="ghost"
                                size="sm"
                                className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-950"
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                Logout
                            </Button>
                        </form>
                    </div>
                </div>
            </header>

            {/* Main Content - Pass nickname to client component */}
            <DashboardContent nickname={nickname} />
        </div>
    )
}
