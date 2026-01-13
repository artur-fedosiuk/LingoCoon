'use client';

import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { BookOpen, Trophy, Zap } from 'lucide-react';

interface DashboardContentProps {
    nickname: string;
}

export default function DashboardContent({ nickname }: DashboardContentProps) {
    const { t, i18n } = useTranslation();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Get greeting based on language
    const getGreeting = () => {
        if (!mounted) return 'Welcome Back';

        const greetings: Record<string, string> = {
            'en': 'Welcome Back',
            'it': 'Bentornato',
            'fr': 'Salut',
            'uk': 'Ласкаво просимо'
        };

        return greetings[i18n.language] || greetings['en'];
    };

    return (
        <main className="mx-auto max-w-6xl px-4 py-8">
            {/* Welcome Section with personalized greeting */}
            <div className="mb-8">
                <h2 className="text-3xl font-bold text-slate-900 dark:text-white">
                    {getGreeting()}, {nickname}!
                </h2>
                <p className="mt-2 text-slate-600 dark:text-slate-400">
                    {mounted ? t('dashboard.subtitle') : 'Continue your learning journey'}
                </p>
            </div>

            {/* Stats Grid */}
            <div className="mb-8 grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">
                            {mounted ? t('dashboard.current_streak') : 'Current Streak'}
                        </CardTitle>
                        <Zap className="h-4 w-4 text-amber-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {mounted ? t('dashboard.days_count', { count: 0 }) : '0 days'}
                        </div>
                        <p className="text-xs text-muted-foreground">
                            {mounted ? t('dashboard.start_streak') : 'Start today to create your streak!'}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">
                            {mounted ? t('dashboard.completed_lessons') : 'Completed Lessons'}
                        </CardTitle>
                        <BookOpen className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0</div>
                        <p className="text-xs text-muted-foreground">
                            {mounted ? t('dashboard.start_first_lesson') : 'Start your first lesson'}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-sm font-medium text-slate-600">
                            {mounted ? t('dashboard.total_points') : 'Total Points'}
                        </CardTitle>
                        <Trophy className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">0 XP</div>
                        <p className="text-xs text-muted-foreground">
                            {mounted ? t('dashboard.earn_points') : 'Earn points by completing lessons'}
                        </p>
                    </CardContent>
                </Card>
            </div>

            {/* Start Learning Section */}
            <Card className="border-2 border-dashed border-slate-300 bg-white/50 dark:border-slate-700 dark:bg-slate-900/50">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">
                        {mounted ? t('dashboard.start_learning') : 'Start Learning'}
                    </CardTitle>
                    <CardDescription>
                        {mounted ? t('dashboard.select_language') : 'Select a language and start your personalized learning path'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-center gap-6">
                    <div className="flex flex-wrap justify-center gap-4">
                        <Button variant="outline" size="lg" className="h-auto flex-col gap-2 px-6 py-4" disabled>
                            <span className="font-medium">{mounted ? t('languages.en-GB') : 'English'}</span>
                            <span className="text-xs text-muted-foreground">{mounted ? t('dashboard.coming_soon') : 'Coming Soon'}</span>
                        </Button>
                        <Button variant="outline" size="lg" className="h-auto flex-col gap-2 px-6 py-4" disabled>
                            <span className="font-medium">{mounted ? t('languages.fr-FR') : 'French'}</span>
                            <span className="text-xs text-muted-foreground">{mounted ? t('dashboard.coming_soon') : 'Coming Soon'}</span>
                        </Button>
                        <Button variant="outline" size="lg" className="h-auto flex-col gap-2 px-6 py-4" disabled>
                            <span className="font-medium">{mounted ? t('languages.de-DE') : 'German'}</span>
                            <span className="text-xs text-muted-foreground">{mounted ? t('dashboard.coming_soon') : 'Coming Soon'}</span>
                        </Button>
                        <Button variant="outline" size="lg" className="h-auto flex-col gap-2 px-6 py-4" disabled>
                            <span className="font-medium">{mounted ? t('languages.es-ES') : 'Spanish'}</span>
                            <span className="text-xs text-muted-foreground">{mounted ? t('dashboard.coming_soon') : 'Coming Soon'}</span>
                        </Button>
                    </div>
                </CardContent>
                <CardFooter className="flex flex-col items-center gap-2">
                    <p className="text-sm text-muted-foreground">
                        {mounted ? t('dashboard.progress_next_level') : 'Your progress toward the next level'}
                    </p>
                    <div className="flex w-full max-w-md items-center gap-3">
                        <Progress value={0} className="flex-1" />
                        <span className="text-sm font-medium text-slate-600">0%</span>
                    </div>
                </CardFooter>
            </Card>
        </main>
    );
}
