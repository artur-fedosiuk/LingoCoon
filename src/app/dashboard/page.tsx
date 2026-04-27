// Description: Dashboard — the first page the user sees after logging in.
//              Shows three quick-access cards: Flashcard Hub, Create Deck, and AI Mode.
//              All visible text comes from the translation file (i18n).

'use client';

import Link from 'next/link';
import { Library, Plus, Bot, MessageSquare, BookOpen, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AppShell from '@/components/layout/AppShell';

export default function DashboardPage() {
  // t() is the translation function. When the user switches the app language,
  // every call to t() automatically returns the text in the new language.
  const { t } = useTranslation();

  return (
    <AppShell>
      <div className="max-w-2xl mx-auto py-12 px-6">

        {/* ── WELCOME HEADER ──────────────────────────────────────────── */}
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {/* 👋 is a Unicode emoji — no emoji library needed. */}
            {t('home.welcome')} 👋
          </h1>
          <p className="text-gray-500 text-sm">
            {/* Subtitle reused from the decks section translation. */}
            {t('decks.subtitle')}
          </p>
        </div>

        {/* ── QUICK ACTION CARDS (2-column grid) ──────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">

          {/* CARD 1: Flashcard Hub — links to /decks */}
          <Link
            href="/decks"
            className="group flex flex-col justify-between rounded-2xl border border-gray-200
                       bg-white p-6 hover:border-gray-900 hover:shadow-md transition-all duration-200"
          >
            <div>
              {/* Icon */}
              <div className="w-10 h-10 rounded-xl bg-gray-900 flex items-center justify-center mb-4">
                <Library className="w-5 h-5 text-white" />
              </div>
              {/* Title */}
              <h2 className="text-base font-bold text-gray-900 mb-1">{t('decks.title')}</h2>
              {/* Description */}
              <p className="text-sm text-gray-500 leading-relaxed">{t('home.decks_desc')}</p>
            </div>
            {/* "Open →" link at the bottom, arrow moves right on hover */}
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-gray-900
                            group-hover:gap-2 transition-all">
              {t('home.open')} <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

          {/* CARD 2: Create Deck shortcut — also links to /decks */}
          <Link
            href="/decks"
            className="group flex flex-col justify-between rounded-2xl border border-dashed
                       border-gray-300 bg-gray-50 p-6 hover:border-gray-400 hover:bg-white
                       hover:shadow-sm transition-all duration-200"
          >
            <div>
              {/* Icon */}
              <div className="w-10 h-10 rounded-xl bg-gray-200 flex items-center justify-center mb-4">
                <Plus className="w-5 h-5 text-gray-700" />
              </div>
              {/* Title */}
              <h2 className="text-base font-bold text-gray-900 mb-1">{t('decks.create_new')}</h2>
              {/* Description */}
              <p className="text-sm text-gray-500 leading-relaxed">{t('home.create_desc')}</p>
            </div>
            {/* "Create →" link */}
            <div className="mt-4 flex items-center gap-1 text-xs font-semibold text-gray-700
                            group-hover:gap-2 transition-all">
              {t('home.create')} <ArrowRight className="w-3.5 h-3.5" />
            </div>
          </Link>

        </div>

        {/* ── AI MODE CARD (full width) ────────────────────────────────── */}
        <Link
          href="/ai"
          className="group flex items-center justify-between rounded-2xl border border-violet-200
                     bg-gradient-to-br from-violet-50 to-indigo-50 p-6 hover:border-violet-400
                     hover:shadow-md transition-all duration-200"
        >
          {/* Left: icon + title + description + feature chips */}
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600
                            flex items-center justify-center flex-shrink-0">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              {/* "AI" badge */}
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-bold uppercase tracking-widest text-violet-500">AI</span>
              </div>
              {/* Title */}
              <h2 className="text-base font-bold text-gray-900 mb-1">{t('ai_page.title')}</h2>
              {/* Description */}
              <p className="text-sm text-gray-500 leading-relaxed">{t('home.ai_desc')}</p>

              {/* Feature chips: small pill tags showing the two sub-features. */}
              <div className="mt-3 flex items-center gap-3 flex-wrap">
                <span className="inline-flex items-center gap-1.5 text-xs text-violet-700
                                 bg-violet-100 rounded-full px-2.5 py-0.5">
                  <MessageSquare className="w-3 h-3" />
                  {t('ai_page.free_chat')}
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-indigo-700
                                 bg-indigo-100 rounded-full px-2.5 py-0.5">
                  <BookOpen className="w-3 h-3" />
                  {t('ai_page.study_with_decks')}
                </span>
              </div>
            </div>
          </div>

          {/* Right: arrow icon that moves on hover */}
          <ArrowRight className="w-5 h-5 text-violet-400 group-hover:text-violet-600
                                  group-hover:translate-x-1 transition-all flex-shrink-0 ml-4" />
        </Link>

      </div>
    </AppShell>
  );
}
