// Description: Classic (non-AI) flashcard study session. Shows cards one at a time,
//              lets the student flip them and rate how well they remembered.
//              After rating, the FSRS algorithm decides when to show the card next.

'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Rating } from 'ts-fsrs';
import { rateCard } from '@/lib/actions/deck-actions';
import { askAI } from '@/lib/actions/ai-actions';
import AiPanel from '@/components/study/AiPanel';
import type { SessionCard } from '@/types/study';
import type { Deck } from '@/lib/supabase/types';
import type { ChatMessage } from '@/types/chat';

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface StudySessionProps {
  /** The cards the student needs to review today (pre-loaded by the server). */
  cards: SessionCard[];
  /** The deck these cards belong to (needed for the back-link). */
  deck: Deck;
  /** The student's native language — passed to the AI tutor so it responds correctly. */
  nativeLanguage: string;
}

// ─── RATING CONFIG ────────────────────────────────────────────────────────────

/**
 * Each rating button has:
 * - translationKey: the i18n key to look up the button label.
 * - rating: the ts-fsrs Rating enum value sent to the FSRS algorithm.
 * - color: a Tailwind CSS text color class for visual distinction.
 *
 * NOTE: Labels come from the translation file (study.ratings.*),
 * so they automatically change when the user switches the app language.
 */
const RATING_CONFIG: { translationKey: string; rating: Rating; color: string }[] = [
  { translationKey: 'study.ratings.again', rating: Rating.Again, color: 'text-red-500'    },
  { translationKey: 'study.ratings.hard',  rating: Rating.Hard,  color: 'text-yellow-500' },
  { translationKey: 'study.ratings.good',  rating: Rating.Good,  color: 'text-blue-500'   },
  { translationKey: 'study.ratings.easy',  rating: Rating.Easy,  color: 'text-green-500'  },
];

// ─── AI SYSTEM PROMPT BUILDER ─────────────────────────────────────────────────

/**
 * Builds the system prompt (instructions) sent to the AI tutor sidebar.
 *
 * A system prompt tells the AI WHO it is and HOW to behave.
 * We include the current card's data so the AI can answer questions about it.
 *
 * @param card            The card currently being studied.
 * @param nativeLanguage  The student's language — AI must respond in this language.
 */
function buildSystemPrompt(card: SessionCard, nativeLanguage: string): string {
  return `You are a language tutor helping a student study flashcards.

Current card:
- Front: ${card.front}
- Back: ${card.back}
- Example sentence: ${card.exampleSentence ?? 'none'}
- Pronunciation: ${card.pronunciation ?? 'none'}
- Times studied: ${card.repetitions ?? 0}
- Current interval: ${card.interval ?? 0} days

The student may ask anything about this card: meaning, grammar, usage, memory tips.
Keep answers concise. Never reveal you are an AI model unless directly asked.
IMPORTANT: Always respond in ${nativeLanguage}, regardless of what language the student writes in.`;
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function StudySession({ cards: initialCards, deck, nativeLanguage }: StudySessionProps) {
  const { t } = useTranslation();

  // ── State ────────────────────────────────────────────────────────────────

  // The list of cards to study today. We keep it in state so we could add
  // dynamic updates in the future.
  const [cards] = useState<SessionCard[]>(initialCards);

  // Which card we are currently showing (index into the cards array).
  const [currentIndex, setCurrentIndex] = useState(0);

  // Whether the current card is flipped to show its back side (the answer).
  const [isFlipped, setIsFlipped] = useState(false);

  // True when all cards have been rated and the session is over.
  const [sessionComplete, setSessionComplete] = useState(false);

  // Whether the AI Tutor sidebar is visible.
  const [isAiOpen, setIsAiOpen] = useState(false);

  // The chat history for the AI Tutor sidebar (resets when the card changes).
  const [aiMessages, setAiMessages] = useState<ChatMessage[]>([]);

  // The text currently typed in the AI Tutor input field.
  const [aiInput, setAiInput] = useState('');

  // True while waiting for the AI Tutor to respond (prevents double-sending).
  const [aiLoading, setAiLoading] = useState(false);

  // True while a rating is being saved to the database (prevents double-clicking).
  const [isRating, setIsRating] = useState(false);

  // The card the student is currently looking at.
  const currentCard = cards[currentIndex];

  // ── Handlers ─────────────────────────────────────────────────────────────

  /**
   * handleRate — called when the student clicks a rating button (Forgot / Hard / Good / Easy).
   *
   * Steps:
   * 1. Save the rating to the database via the rateCard Server Action.
   * 2. Move to the next card, or mark the session complete if this was the last one.
   * 3. Reset the flipped state and clear AI chat history for the new card.
   */
  const handleRate = async (selectedRating: Rating) => {
    // Prevent the student from clicking twice while the first save is running.
    if (isRating) return;
    setIsRating(true);

    // rateCard is a Server Action — it runs on the server and updates Supabase.
    await rateCard(currentCard.id, selectedRating);

    const nextIndex = currentIndex + 1;

    if (nextIndex >= cards.length) {
      // No more cards — the session is finished.
      setSessionComplete(true);
    } else {
      // Move to the next card and reset the view.
      setCurrentIndex(nextIndex);
      setIsFlipped(false);
      setAiMessages([]); // Clear AI chat for the new card.
    }

    setIsRating(false);
  };

  /**
   * handleAiSend — sends the student's question to the AI Tutor sidebar.
   *
   * Steps:
   * 1. Add the user's message to the chat history immediately.
   * 2. Call the askAI Server Action with the current card as context.
   * 3. Add the AI's reply to the chat history.
   */
  const handleAiSend = async () => {
    const text = aiInput.trim();

    // Do nothing if the input is empty or another request is in flight.
    if (!text || aiLoading) return;

    // Show the user's message in the chat immediately (optimistic UI).
    setAiMessages((prev) => [...prev, { role: 'user', text }]);
    setAiInput('');
    setAiLoading(true);

    try {
      // askAI is a Server Action — the API key stays on the server.
      const response = await askAI(buildSystemPrompt(currentCard, nativeLanguage), text);
      setAiMessages((prev) => [...prev, { role: 'ai', text: response }]);
    } catch {
      // Show a friendly error message if the AI call fails.
      setAiMessages((prev) => [...prev, { role: 'ai', text: t('study.ai_error') }]);
    } finally {
      setAiLoading(false);
    }
  };

  // ── Progress calculation ──────────────────────────────────────────────────

  // Calculate how far through the session we are (0–100%) for the progress bar.
  const progressPercent = Math.round((currentIndex / cards.length) * 100);

  // ── Session Complete Screen ───────────────────────────────────────────────

  if (sessionComplete) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-white">
            {t('study.session_complete_title')}
          </h1>
          <p className="text-zinc-400 text-sm">
            {t('study.session_complete_subtitle', { count: cards.length })}
          </p>
          {/* Link the student back to the deck page. */}
          <a
            href={`/decks/${deck.id}`}
            className="inline-block mt-4 bg-white text-zinc-900 font-semibold px-6 py-2.5
                       rounded-xl hover:bg-zinc-100 transition-colors text-sm"
          >
            {t('study.back_to_deck')}
          </a>
        </div>
      </div>
    );
  }

  // ── Main Study View ───────────────────────────────────────────────────────

  return (
    // Full-screen layout: main study area side by side with the optional AI sidebar.
    <div className="flex h-screen bg-zinc-950 overflow-hidden">

      {/* ── LEFT: MAIN STUDY AREA ─────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* TOP BAR: navigation, progress counter, AI toggle */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800">

          {/* Back link to the deck page */}
          <a href={`/decks/${deck.id}`} className="text-zinc-400 hover:text-white text-sm transition-colors">
            ← {deck.title}
          </a>

          {/* Card counter: "3 / 10" */}
          <span className="text-zinc-500 text-sm">
            {t('study.progress', { current: currentIndex + 1, total: cards.length })}
          </span>

          {/* Toggle button for the AI Tutor sidebar */}
          <button
            onClick={() => setIsAiOpen((prev) => !prev)}
            className={`text-sm px-3 py-1.5 rounded-lg border transition-colors font-medium ${
              isAiOpen
                ? 'bg-white text-zinc-900 border-white'
                : 'border-zinc-700 text-zinc-400 hover:border-zinc-500 hover:text-white'
            }`}
          >
            {t('study.ai_tutor_label')}
          </button>
        </div>

        {/* PROGRESS BAR: a thin white line that grows as the student advances */}
        <div className="h-1 bg-zinc-800">
          <div
            className="h-1 bg-white transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* CARD AREA: centred vertically and horizontally */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-10">
          <div className="w-full max-w-lg">

            {/* THE FLASHCARD */}
            <div className="bg-zinc-900 border border-zinc-700 rounded-2xl p-8 min-h-56
                            flex flex-col justify-center mb-6">

              {/* FRONT: always visible */}
              <p className="text-2xl font-bold text-white text-center mb-2">
                {currentCard.front}
              </p>
              {/* Language code label (e.g. "EN") */}
              <p className="text-xs text-zinc-500 text-center uppercase tracking-widest">
                {deck.language_from}
              </p>

              {/* BACK: only shown after the student flips the card */}
              {isFlipped && (
                <div className="mt-6 pt-6 border-t border-zinc-700 space-y-2 text-center">
                  {/* The answer / translation */}
                  <p className="text-xl text-zinc-100">{currentCard.back}</p>

                  {/* Optional pronunciation guide */}
                  {currentCard.pronunciation && (
                    <p className="text-sm text-zinc-500 italic">{currentCard.pronunciation}</p>
                  )}

                  {/* Optional example sentence */}
                  {currentCard.exampleSentence && (
                    <p className="text-sm text-zinc-400 mt-2">
                      &quot;{currentCard.exampleSentence}&quot;
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* ACTION BUTTONS */}
            {!isFlipped ? (
              // Show Answer button: flips the card to reveal the back.
              <button
                onClick={() => setIsFlipped(true)}
                className="w-full py-3 bg-white text-zinc-900 font-semibold rounded-xl
                           hover:bg-zinc-100 transition-colors"
              >
                {t('study.show_answer')}
              </button>
            ) : (
              // Rating buttons: only visible after the card is flipped.
              // These are text-only (no background) — coloured by difficulty.
              <div className="flex justify-around items-center pt-2">
                {RATING_CONFIG.map(({ translationKey, rating, color }) => (
                  <button
                    key={translationKey}
                    onClick={() => handleRate(rating)}
                    disabled={isRating}
                    className={`text-sm font-semibold transition-opacity
                                disabled:opacity-40 hover:opacity-70 ${color}`}
                  >
                    {t(translationKey)}
                  </button>
                ))}
              </div>
            )}

          </div>
        </div>
      </div>

      {/* ── RIGHT: AI TUTOR SIDEBAR (only shown when isAiOpen is true) ── */}
      {isAiOpen && (
        <div className="w-80 flex-shrink-0">
          <AiPanel
            currentCard={currentCard}
            messages={aiMessages}
            input={aiInput}
            loading={aiLoading}
            nativeLanguage={nativeLanguage}
            onInputChange={setAiInput}
            onSend={handleAiSend}
          />
        </div>
      )}

    </div>
  );
}
