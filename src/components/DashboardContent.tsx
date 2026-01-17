/**
 * Filename: src/components/DashboardContent.tsx
 * Description: Client-side component for the dashboard that displays personalized greeting and learning options.
 */
'use client';

import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';

interface DashboardContentProps {
  nickname: string;
}

export default function DashboardContent({ nickname }: DashboardContentProps) {
  const { t, i18n } = useTranslation();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Removed manual getGreeting in favor of i18n


  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-6 py-12">
        <h1 className="text-3xl font-medium text-slate-900">
          {t('home.welcome')} {nickname}
        </h1>
      </div>
    </main>
  );
}