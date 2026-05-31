// Description: The full interactive flashcard study experience.
//              Features: 3D card flip, TTS audio, AI tutor, 4-level FSRS rating.
//              This is a CLIENT component — it runs in the browser and handles
//              all the interactivity after the server has loaded the data.

'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, RotateCcw, Volume2, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Rating } from 'ts-fsrs';
import { rateCard, completeStudySession } from '@/lib/actions/deck-actions';
import { askAIWithHistory, type ConversationTurn } from '@/lib/actions/ai-actions';
import { isoToBcp47, getRecommendedVoice, PREFERRED_GENDER } from '@/lib/tts-utils';
import type { Card, Deck } from '@/lib/supabase/types';

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface DeckStudySessionProps {
  cards: Card[];
  deck: Deck;
  deckId: string;
  nativeLanguage: string;
}

// The four ways the student can rate a card after flipping it.
type CardRating = 'again' | 'hard' | 'good' | 'easy';

// ─── RATING → FSRS MAPPING ────────────────────────────────────────────────────

// Map our simple string ratings to the ts-fsrs numeric Rating enum.
// FSRS uses these numbers to calculate the next review date.
const RATING_MAP: Record<CardRating, Rating> = {
  again: Rating.Again, // 1 — forgot completely
  hard:  Rating.Hard,  // 2 — remembered with difficulty
  good:  Rating.Good,  // 3 — remembered correctly
  easy:  Rating.Easy,  // 4 — too easy, knew immediately
};

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function DeckStudySession({
  cards,
  deck,
  deckId,
  nativeLanguage,
}: DeckStudySessionProps) {
  const { t, i18n } = useTranslation();

  // ── State ────────────────────────────────────────────────────────────────

  // Index of the card currently on screen (0 = first card in the array).
  const [currentIndex, setCurrentIndex] = useState(0);

  // Is the card currently showing its BACK side (the answer)?
  const [isFlipped, setIsFlipped] = useState(false);

  // Stores how the student rated each card: { "card-uuid": "easy" | "hard" | ... }
  const [cardRatings, setCardRatings] = useState<Record<string, CardRating>>({});

  // Is the session finished? (all cards have been rated)
  const [sessionComplete, setSessionComplete] = useState(false);

  // Statistics shown on the completion screen.
  const [sessionStats, setSessionStats] = useState<{
    hardCards: Card[];  // Cards rated 'again' or 'hard' — need more review
    easyCount: number;  // Cards rated 'good' or 'easy'
  } | null>(null);

  // The AI tutor conversation history.
  // Each turn is { role: 'user' | 'model', parts: [{ text: '...' }] }
  const [aiHistory, setAiHistory] = useState<ConversationTurn[]>([]);

  // The text the student is typing in the AI chat box.
  const [userInput, setUserInput] = useState('');

  // True while waiting for the AI to respond.
  const [aiLoading, setAiLoading] = useState(false);

  // True while waiting for the TTS audio to load.
  const [audioLoading, setAudioLoading] = useState(false);

  // Audio cache: stores already-fetched audio as data URLs so we don't re-fetch.
  // We use useRef (not useState) because changing the cache shouldn't re-render the page.
  const audioCache = useRef<Record<string, string>>({});

  // ── Derived values ────────────────────────────────────────────────────────

  // The card the student is currently looking at.
  const currentCard = cards[currentIndex];

  // Language codes for front/back sides.
  const langFront = deck.language_from ?? 'en';
  const langBack  = deck.language_to   ?? 'en';

  /**
   * Orientation guard: the study card always shows the TARGET language first.
   * If language_from equals nativeLanguage, the deck was authored with the
   * native word on the front. We swap the displayed sides WITHOUT touching the DB.
   */
  const isNativeOnFront = langFront === nativeLanguage && langFront !== langBack;
  const displayFront     = isNativeOnFront ? currentCard?.back  : currentCard?.front;
  const displayBack      = isNativeOnFront ? currentCard?.front : currentCard?.back;
  const displayLangFront = isNativeOnFront ? langBack   : langFront;
  const displayLangBack  = isNativeOnFront ? langFront  : langBack;

  // ── AI system prompt ──────────────────────────────────────────────────────

  /**
   * buildSystemPrompt — creates the instructions for the AI tutor.
   * We tell the AI what card we're looking at and which language to respond in.
   * useCallback prevents this from being recreated on every render.
   */
  const buildSystemPrompt = useCallback((): string => {
    const langNames: Record<string, string> = {
      en: 'English', it: 'Italian', fr: 'French', uk: 'Ukrainian',
    };
    const studyingLang = langNames[langFront] ?? langFront;
    const nativeLang   = langNames[nativeLanguage] ?? nativeLanguage;

    return `You are a concise language tutor.
The student is learning ${studyingLang}. Their native language is ${nativeLang}.
ALWAYS respond in ${nativeLang}, no matter what language the student writes in.
Keep answers under 4 sentences. Focus on practical usage, not theory.
Current card — Front: "${currentCard?.front ?? ''}", Back: "${currentCard?.back ?? ''}".`;
  }, [langFront, nativeLanguage, currentCard]);

  // ── Audio handler ─────────────────────────────────────────────────────────

  /**
   * handlePlayAudio — plays pronunciation audio for a word using Google TTS.
   *
   * Flow:
   * 1. Check the in-memory cache first (instant if already fetched).
   * 2. If not cached: call our /api/tts/synthesize route (which calls Google Cloud).
   * 3. Store the result in the cache for next time.
   * 4. Play the audio.
   *
   * e.stopPropagation() prevents the click from also flipping the card.
   */
  const handlePlayAudio = async (e: React.MouseEvent, text: string, lang: string) => {
    e.stopPropagation();
    setAudioLoading(true);

    const cacheKey = `${lang}:${text}`;
    if (audioCache.current[cacheKey]) {
      new Audio(audioCache.current[cacheKey]).play();
      setAudioLoading(false);
      return;
    }

    try {
      // Use tts-utils to get voice config — same source of truth as GeneralChat.
      // This ensures DeckStudySession always uses PREFERRED_GENDER consistently.
      const bcp47     = isoToBcp47(lang);
      const voiceName = getRecommendedVoice(bcp47);

      const res = await fetch('/api/tts/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          languageCode: bcp47,
          ...(voiceName ? { voiceName } : { ssmlGender: PREFERRED_GENDER }),
          speakingRate: 0.9,
        }),
      });

      if (!res.ok) throw new Error(`TTS request failed: ${res.status}`);

      const { audioContent } = await res.json();
      const src = `data:audio/mp3;base64,${audioContent}`;
      audioCache.current[cacheKey] = src;
      new Audio(src).play();
    } catch (err) {
      console.error('Audio playback error:', err);
    } finally {
      setAudioLoading(false);
    }
  };

  // ── Rating handler ────────────────────────────────────────────────────────

  /**
   * handleRate — called when the student clicks a rating button.
   *
   * Steps:
   * 1. Save the rating locally (for stats at the end).
   * 2. Call rateCard (Server Action) to update FSRS state in the database immediately.
   *    This is fire-and-forget — we don't wait for it to avoid blocking the UI.
   * 3. Advance to the next card, or finish the session if this was the last card.
   */
  const handleRate = (rating: CardRating) => {
    // Save this card's rating in local state.
    const updatedRatings = { ...cardRatings, [currentCard.id]: rating };
    setCardRatings(updatedRatings);

    // Save to Supabase via FSRS Server Action (fire-and-forget).
    // We don't await this because we don't want to freeze the UI while it saves.
    rateCard(currentCard.id, RATING_MAP[rating]).catch(err =>
      console.error('Failed to save rating:', err)
    );

    const isLastCard = currentIndex === cards.length - 1;

    if (isLastCard) {
      // All cards done — show the completion screen.
      finishSession(updatedRatings);
    } else {
      // Move to the next card and reset the view.
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
      setAiHistory([]);
      setUserInput('');
    }
  };

  // ── Session completion ────────────────────────────────────────────────────

  /**
   * finishSession — called when the student rates the last card.
   * Calculates stats and calls the server to update XP and streak.
   */
  const finishSession = async (finalRatings: Record<string, CardRating>) => {
    // Show the completion screen immediately (don't wait for the server).
    setSessionComplete(true);

    // Calculate local stats.
    const hardCards = cards.filter(c =>
      finalRatings[c.id] === 'again' || finalRatings[c.id] === 'hard'
    );
    const easyCount = cards.length - hardCards.length;
    setSessionStats({ hardCards, easyCount });

    // Tell the server the session is complete (XP + streak update).
    // Map our 4-level ratings to the 2-level format completeStudySession expects.
    const mapped: Record<string, 'easy' | 'hard'> = {};
    Object.entries(finalRatings).forEach(([id, r]) => {
      mapped[id] = (r === 'again' || r === 'hard') ? 'hard' : 'easy';
    });
    await completeStudySession(cards.length, mapped).catch(err =>
      console.error('Failed to complete session:', err)
    );
  };

  // ── AI handlers ───────────────────────────────────────────────────────────

  /**
   * sendToAI — the core AI communication function.
   * Adds the message to the conversation, calls the Server Action, shows the reply.
   */
  const sendToAI = async (message: string) => {
    const newTurn: ConversationTurn = { role: 'user', parts: [{ text: message }] };
    const updatedHistory = [...aiHistory, newTurn];
    setAiHistory(updatedHistory);
    setAiLoading(true);

    try {
      // askAIWithHistory is a Server Action — the Gemini API key stays on the server.
      const reply = await askAIWithHistory(buildSystemPrompt(), updatedHistory);
      setAiHistory(prev => [...prev, { role: 'model', parts: [{ text: reply }] }]);
    } catch {
      setAiHistory(prev => [...prev, {
        role: 'model',
        parts: [{ text: 'Something went wrong. Please try again.' }],
      }]);
    } finally {
      setAiLoading(false);
    }
  };

  // "Explain this word" button — sends a pre-built question to the AI.
  const handleExplain = () => {
    if (aiLoading || !currentCard) return;
    sendToAI(`Explain "${currentCard.front}" (translation: "${currentCard.back}"). Give one example sentence.`);
  };

  // "Send" button or Enter key — sends the student's typed question.
  const handleAiSend = () => {
    if (!userInput.trim() || aiLoading) return;
    const message = userInput.trim();
    setUserInput('');
    sendToAI(message);
  };

  // ── Empty state ───────────────────────────────────────────────────────────

  if (cards.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <Link href={`/decks/${deckId}`} className="flex items-center gap-2 text-gray-900 hover:underline mb-6 text-sm">
          <ArrowLeft className="w-4 h-4" />
          {t('decks.back_to_deck')}
        </Link>
        <div className="text-center py-20">
          <p className="text-xl text-gray-600">{t('study_session.empty_deck')}</p>
          <Link href={`/decks/${deckId}`}>
            <button className="mt-4 bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-gray-800">
              {t('study_session.add_cards')}
            </button>
          </Link>
        </div>
      </div>
    );
  }

  // ── Session complete screen ───────────────────────────────────────────────

  if (sessionComplete) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-6">
        {/* framer-motion animates this div sliding up from below */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
          className="w-full max-w-sm"
        >
          {/* Trophy emoji bounces in */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="text-6xl mb-4"
            >
              🎉
            </motion.div>
            <h1 className="text-2xl font-bold text-white">
              {t('study_session.completed.title')}
            </h1>
            <p className="text-zinc-500 text-sm mt-1">{deck.title}</p>
          </div>

          {/* Stats: either a list of hard cards, or a "perfect!" message */}
          {sessionStats ? (
            <div className="mb-6">
              {sessionStats.hardCards.length > 0 ? (
                <>
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">
                    {t('study_session.completed.review_again')} — {sessionStats.hardCards.length}
                  </p>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {sessionStats.hardCards.map(card => (
                      <div
                        key={card.id}
                        className="bg-zinc-900 border border-zinc-700/60 rounded-xl px-4 py-3"
                      >
                        <p className="text-sm font-semibold text-white">{card.front}</p>
                        <p className="text-xs text-zinc-400 mt-1">{card.back}</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="bg-zinc-900 border border-zinc-700/60 rounded-xl px-5 py-5 text-center">
                  <p className="text-3xl mb-2">⭐</p>
                  <p className="text-white font-semibold">{t('study_session.completed.all_easy')}</p>
                </div>
              )}
            </div>
          ) : (
            /* Loading skeleton shown while the server processes the result */
            <div className="space-y-2 mb-6">
              {[0, 1, 2].map(i => (
                <div key={i} className="bg-zinc-800 rounded-xl h-14 animate-pulse" />
              ))}
            </div>
          )}

          {/* Buttons: study again or go back to deck */}
          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                // Reset all state to start over
                setSessionComplete(false);
                setSessionStats(null);
                setCardRatings({});
                setCurrentIndex(0);
                setIsFlipped(false);
                setAiHistory([]);
              }}
              className="w-full bg-white text-zinc-900 py-3 rounded-xl font-semibold hover:bg-zinc-100 transition-colors"
            >
              {t('study_session.completed.study_again')}
            </button>
            <Link href={`/decks/${deckId}`} className="w-full">
              <button className="w-full bg-zinc-800 border border-zinc-700 text-zinc-300 py-3 rounded-xl font-medium hover:bg-zinc-700 transition-colors">
                {t('decks.back_to_deck')}
              </button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Main study view ───────────────────────────────────────────────────────

  const progressPercent = ((currentIndex + 1) / cards.length) * 100;

  return (
    <div className="container mx-auto p-6 max-w-sm">

      {/* Back link */}
      <Link
        href={`/decks/${deckId}`}
        className="flex items-center gap-2 text-gray-900 hover:text-gray-700 hover:underline mb-6 text-sm"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('decks.back_to_deck')}
      </Link>

      {/* Progress bar + counter */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>
            {t('study.progress', { current: currentIndex + 1, total: cards.length })}
          </span>
          {/* Restart button: go back to card 1 without ending the session */}
          <button
            onClick={() => { setCurrentIndex(0); setIsFlipped(false); setAiHistory([]); }}
            className="flex items-center gap-1 hover:text-gray-900 transition-colors"
            title="Restart"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-gray-900 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* ── 3D FLASHCARD ──────────────────────────────────────────────────── */}
      {/*
        How the 3D flip works:
        - The outer div sets the "perspective" — how deep the 3D space looks.
        - The inner div rotates around the Y axis (like turning a page sideways).
        - FRONT face is visible normally.
        - BACK face is pre-rotated 180° and hidden until the card flips.
        - backface-visibility: hidden ensures each face disappears when facing away.
        - All of this is pure CSS — no JavaScript animation library needed.
      */}
      <div
        className="relative cursor-pointer mb-8"
        style={{ aspectRatio: '2/3', perspective: '1000px' }}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transformStyle: 'preserve-3d',      // Enable 3D space for children
            transition: 'transform 0.5s ease',  // Smooth 500ms flip animation
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* ── FRONT FACE ──────────────────────────────────────────────── */}
          <div
            style={{ backfaceVisibility: 'hidden', position: 'absolute', inset: 0 }}
            className="bg-white border-2 border-gray-200 rounded-xl shadow-lg
                       flex flex-col items-center justify-center p-8 gap-4"
          >
            {/* Audio button for the front (the word to learn) */}
            <button
              onClick={(e) => handlePlayAudio(e, displayFront ?? '', displayLangFront)}
              disabled={audioLoading}
              className="w-10 h-10 rounded-full border border-gray-300 flex items-center
                         justify-center hover:bg-gray-100 transition-colors disabled:opacity-50"
              aria-label="Play pronunciation"
            >
              {audioLoading
                ? <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                : <Volume2 className="w-4 h-4 text-gray-600" />
              }
            </button>

            {/* The word/phrase to learn */}
            <p className="text-3xl font-bold text-gray-900 text-center">
              {displayFront}
            </p>

            {/* Hint: click the card to reveal the answer */}
            <p className="text-sm text-gray-400">
              {t('study_session.evaluation.tap_to_reveal')}
            </p>
          </div>

          {/* ── BACK FACE ───────────────────────────────────────────────── */}
          {/*
            This face starts rotated 180° so it's hidden.
            When the outer div flips to 180°, this face ends up at 360° = visible.
          */}
          <div
            style={{
              backfaceVisibility: 'hidden',
              position: 'absolute',
              inset: 0,
              transform: 'rotateY(180deg)', // Pre-rotated — hidden until card flips
            }}
            className="bg-gray-900 text-white rounded-xl shadow-lg
                       flex flex-col items-center justify-center p-8 gap-4"
          >
            {/* Audio button for the back (the translation) */}
            <button
              onClick={(e) => handlePlayAudio(e, displayBack ?? '', displayLangBack)}
              disabled={audioLoading}
              className="w-10 h-10 rounded-full border border-white/30 flex items-center
                         justify-center hover:bg-white/10 transition-colors disabled:opacity-50"
              aria-label="Play pronunciation"
            >
              {audioLoading
                ? <Loader2 className="w-4 h-4 text-white/60 animate-spin" />
                : <Volume2 className="w-4 h-4 text-white" />
              }
            </button>

            {/* The translation/answer */}
            <p className="text-3xl font-bold text-center">
              {displayBack}
            </p>

            {/* Example sentence — shown only when present, helps retention */}
            {currentCard?.example_sentence && (
              <p className="text-sm text-white/50 italic text-center px-2 leading-relaxed">
                {currentCard.example_sentence}
              </p>
            )}

            <p className="text-sm text-gray-400">{t('study_session.click_to_flip_back')}</p>
          </div>
        </div>
      </div>

      {/* ── AFTER FLIP: rating buttons + AI tutor ──────────────────────── */}
      {isFlipped && (
        <>
          {/* Rating buttons — appear with a slide-up animation */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
            className="flex justify-around items-center py-2 mb-4"
          >
            {/* Forgot — red */}
            <button
              onClick={() => handleRate('again')}
              className="text-red-500 font-semibold text-sm hover:opacity-70 transition-opacity"
            >
              {t('study_session.evaluation.forgot')}
            </button>

            {/* Hard — yellow */}
            <button
              onClick={() => handleRate('hard')}
              className="text-yellow-500 font-semibold text-sm hover:opacity-70 transition-opacity"
            >
              {t('study_session.evaluation.hard')}
            </button>

            {/* Good — blue */}
            <button
              onClick={() => handleRate('good')}
              className="text-blue-500 font-semibold text-sm hover:opacity-70 transition-opacity"
            >
              {t('study_session.evaluation.good')}
            </button>

            {/* Easy — green */}
            <button
              onClick={() => handleRate('easy')}
              className="text-green-500 font-semibold text-sm hover:opacity-70 transition-opacity"
            >
              {t('study_session.evaluation.easy')}
            </button>
          </motion.div>

          {/* ── AI TUTOR PANEL ─────────────────────────────────────────── */}
          <div className="space-y-3">

            {/* Chat history — only shown after at least one message */}
            {aiHistory.length > 0 && (
              <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 space-y-3 max-h-64 overflow-y-auto">
                {aiHistory.map((turn, i) => (
                  <div key={i} className={turn.role === 'user' ? 'text-right' : 'text-left'}>
                    <span className={`inline-block px-3 py-2 rounded-xl text-sm ${
                      turn.role === 'user'
                        ? 'bg-gray-900 text-white'
                        : 'bg-white border border-gray-200 text-gray-700'
                    }`}>
                      {turn.parts[0].text}
                    </span>
                  </div>
                ))}
                {/* Thinking indicator */}
                {aiLoading && (
                  <div className="text-left">
                    <span className="inline-block px-3 py-2 rounded-xl text-sm bg-white border border-gray-200 text-gray-400">
                      {t('study_session.ai_thinking')}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* "Explain this word" quick button */}
            <button
              onClick={handleExplain}
              disabled={aiLoading}
              className="w-full py-2.5 rounded-xl border border-gray-200 text-gray-700
                         text-sm font-medium hover:bg-gray-50 disabled:opacity-40 transition-colors"
            >
              ✦ {t('study_session.explain_word')}
            </button>

            {/* Free-form question input */}
            <div className="flex gap-2">
              <input
                type="text"
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleAiSend()}
                placeholder={t('study_session.ask_placeholder')}
                disabled={aiLoading}
                className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm
                           focus:outline-none focus:ring-2 focus:ring-gray-300 disabled:opacity-50"
              />
              <button
                onClick={handleAiSend}
                disabled={aiLoading || !userInput.trim()}
                className="px-4 py-2.5 bg-gray-900 text-white rounded-xl text-sm
                           hover:bg-gray-800 disabled:opacity-40 transition-colors"
              >
                →
              </button>
            </div>

          </div>
        </>
      )}

      {/* Hint when card is NOT yet flipped */}
      {!isFlipped && (
        <p className="text-center text-xs text-gray-400 mt-2">
          {t('study_session.evaluation.tap_to_reveal')}
        </p>
      )}

    </div>
  );
}
