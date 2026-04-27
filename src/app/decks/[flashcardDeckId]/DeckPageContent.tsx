// Description: Client component for the individual deck page.
//              Left column: "Add New Card" form. Right column: existing cards list.
//              Header: study buttons (Classic + AI) and delete button.

'use client';

import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { ArrowLeft, Play } from 'lucide-react';
import AppShell from '@/components/layout/AppShell';
import CreateCardForm from '@/components/flashcards/CreateCardForm';
import CardItem from '@/components/flashcards/CardItem';
import DeckActionsMenu from '@/components/decks/DeckActionsMenu';
import type { Deck, Card } from '@/lib/supabase/types';

// ─── PROPS ────────────────────────────────────────────────────────────────────

interface DeckPageContentProps {
  /** The deck metadata (title, language codes, etc.) */
  deck: Deck;
  /** All cards that belong to this deck. */
  cards: Card[];
  /** The logged-in user's email — shown in the AppShell navigation. */
  userEmail?: string;
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function DeckPageContent({ deck, cards, userEmail }: DeckPageContentProps) {
  const { t } = useTranslation();

  return (
    <AppShell userEmail={userEmail}>
      <div className="container mx-auto p-6 space-y-8 max-w-6xl">

        {/* ── HEADER ──────────────────────────────────────────────────── */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center
                        gap-4 border-b pb-6">

          {/* Left: back link, deck title, language pair */}
          <div className="flex-1">
            {/* Back link navigates to the main decks list. */}
            <Link
              href="/decks"
              className="flex items-center gap-2 text-gray-900 hover:text-gray-700
                         hover:underline mb-3 text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              {t('decks.back_to_decks')}
            </Link>

            {/* Deck title */}
            <h1 className="text-3xl font-bold text-gray-900">{deck.title}</h1>

            {/* Language direction: e.g. "EN → IT" */}
            <p className="text-gray-500 mt-1">
              {deck.language_from.toUpperCase()} → {deck.language_to.toUpperCase()}
            </p>
          </div>

          {/* Right: action buttons — only shown if there are cards to study */}
          <div className="flex gap-3 items-start flex-wrap">
            {cards.length > 0 && (
              <>
                {/* Classic study session */}
                <Link href={`/decks/${deck.id}/study`}>
                  <button className="bg-black text-white px-6 py-3 rounded-lg font-medium
                                     hover:bg-gray-800 flex items-center gap-2 shadow-lg">
                    <Play className="w-5 h-5" />
                    {t('decks.start_study')}
                  </button>
                </Link>

                {/* AI-powered study session */}
                <Link href={`/study/ai/${deck.id}`}>
                  <button className="bg-gradient-to-r from-violet-600 to-indigo-600 text-white
                                     px-6 py-3 rounded-lg font-medium hover:from-violet-500
                                     hover:to-indigo-500 flex items-center gap-2 shadow-lg
                                     transition-all">
                    {/* ✦ is a decorative star used as the AI icon throughout the app */}
                    <span className="text-base">✦</span>
                    {t('decks.study_with_ai')}
                  </button>
                </Link>
              </>
            )}

            {/* Delete deck button (with confirmation dialog) */}
            <DeckActionsMenu deckId={deck.id} deckTitle={deck.title} />
          </div>
        </div>

        {/* ── TWO-COLUMN LAYOUT ────────────────────────────────────────── */}
        <div className="grid md:grid-cols-2 gap-8">

          {/* LEFT COLUMN: Add New Card form */}
          <div className="bg-gray-50 p-6 rounded-xl border border-gray-200 h-fit">
            <h2 className="font-semibold text-lg mb-4 text-gray-900">
              {t('flashcards.create_new')}
            </h2>
            {/*
              CreateCardForm handles its own state and calls the createCard
              Server Action directly — no props needed for that logic.
            */}
            <CreateCardForm
              deckId={deck.id}
              deckLanguage={deck.language_from}
              languageTo={deck.language_to}
            />
          </div>

          {/* RIGHT COLUMN: Existing cards list */}
          <div className="space-y-4">

            {/* Section header with card count badge */}
            <h2 className="font-semibold text-lg flex justify-between items-center text-gray-900">
              {t('decks.cards_in_deck')}
              <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-sm">
                {cards.length}
              </span>
            </h2>

            {/* Empty state: shown when no cards exist yet */}
            {cards.length === 0 ? (
              <div className="text-center py-16 text-gray-400 border-2 border-dashed
                              border-gray-300 rounded-xl bg-gray-50">
                <p className="text-lg mb-2">{t('flashcards.empty_state')}</p>
                <p className="text-sm">{t('flashcards.empty_state_cta')}</p>
              </div>
            ) : (
              // Scrollable list of cards — max height prevents the column from
              // growing too tall on decks with many cards.
              <div className="space-y-3 max-h-[700px] overflow-y-auto pr-2">
                {cards.map((card: Card) => (
                  <CardItem
                    key={card.id}
                    card={card}
                    deckId={deck.id}
                    deckLanguage={deck.language_from}
                  />
                ))}
              </div>
            )}

          </div>
        </div>

      </div>
    </AppShell>
  );
}
