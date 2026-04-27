// Description: The main AI Mode page — a tabbed layout with "Free Chat" and
//              "Study with Decks" tabs. Fully translated via i18n.

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Bot, MessageSquare, BookOpen, ArrowRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import AppShell from '@/components/layout/AppShell';
import GeneralChat from '@/components/ai/GeneralChat';
import type { Deck } from '@/lib/supabase/types';

// ─── TYPES ────────────────────────────────────────────────────────────────────

// The two possible tabs on this page.
type Tab = 'chat' | 'decks';

interface AiPageClientProps {
  /** The user's flashcard decks (pre-loaded by the server page). */
  decks: Deck[];
  /** The user's email — passed down to AppShell for display. */
  userEmail?: string;
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function AiPageClient({ decks, userEmail }: AiPageClientProps) {
  const { t } = useTranslation();

  // Track which tab is currently active.
  const [activeTab, setActiveTab] = useState<Tab>('chat');

  return (
    <AppShell userEmail={userEmail}>
      {/*
        The outer div limits the page to a readable width and fills the viewport
        height minus the navigation bar height.
      */}
      <div className="flex flex-col h-[calc(100vh-4rem)] md:h-[calc(100vh-2rem)] max-w-3xl mx-auto">

        {/* ── HEADER ──────────────────────────────────────────────────── */}
        <div className="flex-shrink-0 px-4 pt-6 pb-4">

          {/* Brand row: icon + title + subtitle */}
          <div className="flex items-center gap-3 mb-5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-indigo-600
                            flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900 leading-tight">
                {t('ai_page.title')}
              </h1>
            </div>
          </div>

          {/* TAB SWITCHER: a pill-shaped container with two buttons inside. */}
          <div className="flex gap-1 bg-gray-100 rounded-xl p-1">

            {/* Free Chat tab */}
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg
                          text-sm font-medium transition-all duration-200 ${
                activeTab === 'chat'
                  ? 'bg-white text-gray-900 shadow-sm'   // Active: white background
                  : 'text-gray-500 hover:text-gray-700'  // Inactive: transparent
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              {t('ai_page.tab_chat')}
            </button>

            {/* Study with Decks tab */}
            <button
              onClick={() => setActiveTab('decks')}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg
                          text-sm font-medium transition-all duration-200 ${
                activeTab === 'decks'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              {t('ai_page.tab_decks')}
            </button>

          </div>
        </div>

        {/* ── TAB CONTENT PANELS ──────────────────────────────────────── */}
        {/*
          The border + rounded container wraps both panels. overflow-hidden
          ensures the chat scrollbar doesn't leak outside the rounded corners.
        */}
        <div className="flex-1 overflow-hidden border border-gray-100 rounded-2xl mx-4 mb-4 bg-white">

          {/* FREE CHAT PANEL: rendered directly from the GeneralChat component */}
          {activeTab === 'chat' && <GeneralChat />}

          {/* STUDY WITH DECKS PANEL */}
          {activeTab === 'decks' && (
            <div className="h-full overflow-y-auto p-4 space-y-3">

              {/* Empty state: shown when the user has no decks. */}
              {decks.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-16">
                  <div className="text-4xl mb-4">📚</div>
                  <p className="text-gray-500 text-sm mb-3">
                    {t('ai_page.no_decks')}
                  </p>
                  <Link
                    href="/decks"
                    className="text-sm font-medium text-violet-600 underline underline-offset-4
                               hover:text-violet-700"
                  >
                    {t('ai_page.create_first_deck')}
                  </Link>
                </div>
              ) : (
                <>
                  {/* Hint text above the deck list */}
                  <p className="text-xs text-gray-400 px-1 pb-1">
                    {t('ai_page.deck_hint')}
                  </p>

                  {/* One clickable card per deck — links to the AI study session. */}
                  {decks.map((deck) => (
                    <Link
                      key={deck.id}
                      href={`/study/ai/${deck.id}`}
                      className="flex items-center justify-between p-4 border border-gray-100
                                 rounded-xl hover:border-violet-200 hover:bg-violet-50/50
                                 transition-all group"
                    >
                      <div>
                        {/* Deck title */}
                        <p className="font-semibold text-gray-900 text-sm
                                      group-hover:text-violet-700 transition-colors">
                          {deck.title}
                        </p>
                        {/* Language pair and card count */}
                        <p className="text-xs text-gray-400 mt-0.5">
                          {deck.language_from.toUpperCase()} → {deck.language_to.toUpperCase()}
                          {' · '}
                          {deck.card_count}{' '}
                          {/* Use singular or plural card label depending on count. */}
                          {deck.card_count === 1
                            ? t('decks.card_count_single', { count: deck.card_count })
                            : t('decks.card_count', { count: deck.card_count })}
                        </p>
                      </div>

                      {/* Right side: "Start" label + arrow icon (appear on hover) */}
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-violet-500 font-medium opacity-0
                                         group-hover:opacity-100 transition-opacity">
                          {t('ai_page.start')}
                        </span>
                        <ArrowRight className="w-4 h-4 text-gray-300 group-hover:text-violet-500
                                               group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </Link>
                  ))}
                </>
              )}
            </div>
          )}

        </div>
      </div>
    </AppShell>
  );
}
