/**
 * Filename: src/app/settings/SettingsContent.tsx
 * Description: Client-side settings content component.
 */
'use client';

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Settings, User, Globe, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

interface Profile {
    id: string;
    email: string;
    nickname: string | null;
    native_language: string | null;
    target_language: string | null;
    current_level: string | null;
    learning_purpose: string | null;
}

interface SettingsContentProps {
    profile: Profile | null;
}

export default function SettingsContent({ profile }: SettingsContentProps) {
    const { t } = useTranslation();

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-black dark:text-white sm:text-3xl">
                    {t('settings.title')}
                </h1>
                <p className="mt-1 text-sm text-black/60 dark:text-white/60">
                    {t('settings.coming_soon')}
                </p>
            </div>

            {/* Profile Card */}
            <Card className="border-black/10 bg-white dark:border-white/10 dark:bg-black">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-black dark:text-white">
                        <User className="h-5 w-5" />
                        {t('settings.your_profile')}
                    </CardTitle>
                    <CardDescription className="text-black/60 dark:text-white/60">
                        {t('settings.under_construction')}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {profile ? (
                        <div className="grid gap-4 sm:grid-cols-2">
                            <ProfileItem
                                icon={<Globe className="h-4 w-4" />}
                                label={t('settings.native_language')}
                                value={profile.native_language || '-'}
                            />
                            <ProfileItem
                                icon={<Target className="h-4 w-4" />}
                                label={t('settings.target_language')}
                                value={profile.target_language || '-'}
                            />
                            <ProfileItem
                                icon={<Settings className="h-4 w-4" />}
                                label={t('settings.level')}
                                value={profile.current_level || '-'}
                            />
                            <ProfileItem
                                icon={<User className="h-4 w-4" />}
                                label={t('settings.goals')}
                                value={profile.learning_purpose || '-'}
                            />
                        </div>
                    ) : (
                        <p className="text-sm text-black/50 dark:text-white/50">
                            {t('common.loading')}
                        </p>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

function ProfileItem({
    icon,
    label,
    value,
}: {
    icon: React.ReactNode;
    label: string;
    value: string;
}) {
    return (
        <div className="flex items-start gap-3 rounded-lg border border-black/10 bg-black/[0.02] p-4 dark:border-white/10 dark:bg-white/[0.02]">
            <div className="text-black/40 dark:text-white/40">{icon}</div>
            <div>
                <p className="text-xs font-medium text-black/50 dark:text-white/50">{label}</p>
                <p className="text-sm font-semibold text-black dark:text-white">{value}</p>
            </div>
        </div>
    );
}
