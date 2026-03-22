// AppShell.tsx
// This is the main layout of the app after the user logs in.
// It shows the sidebar on desktop and the bottom navigation bar on mobile.
'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Home, Library, Settings, LogOut } from 'lucide-react';
import { cn } from '@/lib/utils';
import { signOut } from '@/app/login/actions';
import { Button } from '@/components/ui/button';

interface NavItem {
    key: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    labelKey: string;
}

const navItems: NavItem[] = [
    {
        key: 'dashboard',
        href: '/dashboard',
        icon: Home,
        labelKey: 'navigation.dashboard',
    },
    {
        key: 'decks',
        href: '/decks',
        icon: Library,
        labelKey: 'navigation.flashcards',
    },
    {
        key: 'settings',
        href: '/settings',
        icon: Settings,
        labelKey: 'navigation.settings',
    },
];

import { useProfile } from '@/hooks/useProfile';

interface AppShellProps {
    children: React.ReactNode;
    userEmail?: string;
}

export default function AppShell({ children, userEmail }: AppShellProps) {
    const pathname = usePathname();
    const { t, i18n } = useTranslation();
    const { profile } = useProfile();

    const isActive = (href: string) => {
        if (href === '/dashboard') {
            return pathname === '/dashboard';
        }
        return pathname.startsWith(href);
    };

    return (
        <div className="min-h-screen bg-white dark:bg-black">
            {/* Desktop Sidebar */}
            <aside className="fixed left-0 top-0 z-40 hidden h-screen w-60 flex-col border-r border-black/10 bg-white dark:border-white/10 dark:bg-black md:flex">
                {/* Logo / Brand */}
                <div className="flex h-16 items-center border-b border-black/10 px-6 dark:border-white/10">
                    <Link href="/dashboard" className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-black dark:bg-white">
                            <span className="text-sm font-bold text-white dark:text-black">LC</span>
                        </div>
                        <span className="text-lg font-bold tracking-tight text-black dark:text-white">
                            LinguaCoon
                        </span>
                    </Link>
                </div>

                {/* Navigation Items */}
                <nav className="flex-1 space-y-1 px-3 py-4">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const active = isActive(item.href);
                        return (
                            <Link
                                key={item.key}
                                href={item.href}
                                className={cn(
                                    'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200',
                                    active
                                        ? 'bg-black text-white dark:bg-white dark:text-black'
                                        : 'text-black/70 hover:bg-black/5 hover:text-black dark:text-white/70 dark:hover:bg-white/5 dark:hover:text-white'
                                )}
                            >
                                <Icon
                                    className={cn(
                                        'h-5 w-5 transition-transform duration-200 group-hover:scale-110',
                                        active ? 'text-white dark:text-black' : ''
                                    )}
                                />
                                <span>{t(item.labelKey)}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom Section - User & Logout */}
                <div className="border-t border-black/10 p-4 dark:border-white/10">
                    {userEmail && (
                        <p className="mb-3 truncate text-xs text-black/50 dark:text-white/50">
                            {userEmail}
                        </p>
                    )}
                    <form>
                        <Button
                            formAction={signOut}
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start gap-2 text-black/70 hover:bg-black/5 hover:text-black dark:text-white/70 dark:hover:bg-white/5 dark:hover:text-white"
                        >
                            <LogOut className="h-4 w-4" />
                            <span>{t('common.logout')}</span>
                        </Button>
                    </form>
                </div>
            </aside>

            {/* Mobile Header */}
            <header className="fixed left-0 right-0 top-0 z-40 flex h-14 items-center border-b border-black/10 bg-white px-4 dark:border-white/10 dark:bg-black md:hidden">
                <Link href="/dashboard" className="flex items-center gap-2">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-black dark:bg-white">
                        <span className="text-xs font-bold text-white dark:text-black">LC</span>
                    </div>
                    <span className="text-base font-bold tracking-tight text-black dark:text-white">
                        LinguaCoon
                    </span>
                </Link>
            </header>

            {/* Mobile Bottom Navigation */}
            <nav className="fixed bottom-0 left-0 right-0 z-40 flex h-16 items-center justify-around border-t border-black/10 bg-white dark:border-white/10 dark:bg-black md:hidden">
                {navItems.map((item) => {
                    const Icon = item.icon;
                    const active = isActive(item.href);
                    return (
                        <Link
                            key={item.key}
                            href={item.href}
                            className={cn(
                                'flex flex-col items-center gap-1 px-4 py-2 transition-all duration-200',
                                active
                                    ? 'text-black dark:text-white'
                                    : 'text-black/50 dark:text-white/50'
                            )}
                        >
                            <div
                                className={cn(
                                    'rounded-lg p-1.5 transition-all duration-200',
                                    active ? 'bg-black dark:bg-white' : ''
                                )}
                            >
                                <Icon
                                    className={cn(
                                        'h-5 w-5',
                                        active ? 'text-white dark:text-black' : ''
                                    )}
                                />
                            </div>
                            <span className="text-[10px] font-medium">{t(item.labelKey)}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Main Content Area */}
            <main className="min-h-screen pt-14 pb-20 md:ml-60 md:pt-0 md:pb-0">
                <div className="mx-auto max-w-6xl px-4 py-6 md:px-6 md:py-8">
                    {children}
                </div>
            </main>
        </div>
    );
}
