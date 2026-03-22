// src/app/dashboard/page.tsx
// Dashboard: welcomes the user and links to their decks.
'use client';

import Link from 'next/link';
import { Library, Plus } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import { useTranslation } from 'react-i18next';

export default function DashboardPage() {
  const { t } = useTranslation();

  return (
    <AppShell>
      <div className="max-w-xl mx-auto py-16 px-6 text-center">

        {/* Welcome message */}
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t('home.welcome')}
        </h1>
        <p className="text-gray-500 mb-10">
          {t('decks.subtitle')}
        </p>

        {/* Two simple action buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/decks"
            className="inline-flex items-center justify-center gap-2 bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 font-medium"
          >
            <Library className="w-5 h-5" />
            {t('decks.title')}
          </Link>
          <Link
            href="/decks"
            className="inline-flex items-center justify-center gap-2 bg-gray-100 text-gray-900 px-6 py-3 rounded-lg hover:bg-gray-200 font-medium"
          >
            <Plus className="w-5 h-5" />
            {t('decks.create_new')}
          </Link>
        </div>



      </div>
    </AppShell>
  );
}
