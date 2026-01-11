import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { signOut } from '@/app/login/actions'
import { Button } from '@/components/ui/button'
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { BookOpen, Trophy, Zap, LogOut } from 'lucide-react'

export default async function DashboardPage() {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    // Security: Redirect to login if not authenticated
    if (!user) {
        redirect('/login')
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-950 dark:to-slate-900">
            {/* Header */}
            <header className="border-b bg-white/80 backdrop-blur-sm dark:bg-slate-950/80">
                <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
                    <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                        LinguaFlow
                    </h1>
                    <div className="flex items-center gap-4">
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

            {/* Main Content */}
            <main className="mx-auto max-w-6xl px-4 py-8">
                {/* Welcome Section */}
                <div className="mb-8">
                    <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                        Bentornato! 👋
                    </h2>
                    <p className="mt-2 text-slate-600 dark:text-slate-400">
                        Continua il tuo percorso di apprendimento
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="mb-8 grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600">
                                Streak Attuale
                            </CardTitle>
                            <Zap className="h-4 w-4 text-amber-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">0 giorni</div>
                            <p className="text-xs text-muted-foreground">
                                Inizia oggi per creare il tuo streak!
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600">
                                Lezioni Completate
                            </CardTitle>
                            <BookOpen className="h-4 w-4 text-blue-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">0</div>
                            <p className="text-xs text-muted-foreground">
                                Inizia la tua prima lezione
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium text-slate-600">
                                Punti Totali
                            </CardTitle>
                            <Trophy className="h-4 w-4 text-emerald-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">0 XP</div>
                            <p className="text-xs text-muted-foreground">
                                Guadagna punti completando le lezioni
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Start Learning Section */}
                <Card className="border-2 border-dashed border-slate-300 bg-white/50 dark:border-slate-700 dark:bg-slate-900/50">
                    <CardHeader className="text-center">
                        <CardTitle className="text-2xl">
                            Inizia ad Imparare
                        </CardTitle>
                        <CardDescription>
                            Seleziona una lingua e inizia il tuo percorso di apprendimento personalizzato
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center gap-6">
                        <div className="flex flex-wrap justify-center gap-4">
                            <Button variant="outline" size="lg" className="h-auto flex-col gap-2 px-6 py-4" disabled>
                                <span className="text-3xl">🇬🇧</span>
                                <span className="font-medium">Inglese</span>
                                <span className="text-xs text-muted-foreground">Prossimamente</span>
                            </Button>
                            <Button variant="outline" size="lg" className="h-auto flex-col gap-2 px-6 py-4" disabled>
                                <span className="text-3xl">🇫🇷</span>
                                <span className="font-medium">Francese</span>
                                <span className="text-xs text-muted-foreground">Prossimamente</span>
                            </Button>
                            <Button variant="outline" size="lg" className="h-auto flex-col gap-2 px-6 py-4" disabled>
                                <span className="text-3xl">🇩🇪</span>
                                <span className="font-medium">Tedesco</span>
                                <span className="text-xs text-muted-foreground">Prossimamente</span>
                            </Button>
                            <Button variant="outline" size="lg" className="h-auto flex-col gap-2 px-6 py-4" disabled>
                                <span className="text-3xl">🇪🇸</span>
                                <span className="font-medium">Spagnolo</span>
                                <span className="text-xs text-muted-foreground">Prossimamente</span>
                            </Button>
                        </div>
                    </CardContent>
                    <CardFooter className="flex flex-col items-center gap-2">
                        <p className="text-sm text-muted-foreground">
                            Il tuo progresso verso il prossimo livello
                        </p>
                        <div className="flex w-full max-w-md items-center gap-3">
                            <Progress value={0} className="flex-1" />
                            <span className="text-sm font-medium text-slate-600">0%</span>
                        </div>
                    </CardFooter>
                </Card>
            </main>
        </div>
    )
}
