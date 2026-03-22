// app/decks/[flashcardDeckId]/study/page.tsx
'use client';

import { useState, useEffect, useRef, use } from 'react';
import { getCards, getDeck, completeStudySession } from '@/lib/actions/deck-actions';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, RotateCcw, Volume2, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import '@/lib/i18n';
import type { Card, Deck } from '@/lib/supabase/types';

// Removed VOICE_MAP, getVoiceConfig, UI_LABELS, and getUiLabels as they are now in translation.json

export default function StudyPage({ 
  params 
}: { 
  params: Promise<{ flashcardDeckId: string }> 
}) {
  const { flashcardDeckId } = use(params);
  const { t, i18n } = useTranslation();
  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [audioLoading, setAudioLoading] = useState(false);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [sessionStats, setSessionStats] = useState<{
    xpGained: number;
    newXp: number;
    newStreak: number;
    cardsStudied: number;
    easyCount: number;
    hardCount: number;
    hardCards: Card[];
  } | null>(null);
  // Map cardId → 'easy' | 'hard', populated during the session
  const [cardRatings, setCardRatings] = useState<Record<string, 'easy' | 'hard'>>({});

  // Audio cache to avoid calling the API for the same word
  const audioCache = useRef<Record<string, string>>({});


  useEffect(() => {
    loadData();
  }, [flashcardDeckId]);

  // Pre-load audio in background without showing spinner or errors
  const prefetchAudio = async (text: string, lang: string) => {
    if (!text || !lang) return;
    const cacheKey = `${lang}:${text}`;
    if (audioCache.current[cacheKey]) return; // already in cache, nothing to do

    try {
      const languageCode = i18n.t('tts.languageCode', { lng: lang, fallbackLng: 'en' });
      const voiceName = i18n.t('tts.voiceName', { lng: lang, fallbackLng: 'en' });

      const res = await fetch('/api/tts/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          languageCode,
          voiceName,
          speakingRate: 0.9,
        }),
      });
      if (!res.ok) return; // silent: it's just a pre-load
      const { audioContent } = await res.json();
      if (audioContent) {
        audioCache.current[cacheKey] = `data:audio/mp3;base64,${audioContent}`;
      }
    } catch {
      // Silent: if it fails it doesn't matter, the user will use the normal path
    }
  };

  // Simple loop to pick one word at a time and avoid consecutive repeating words
  const filterConsecutiveDuplicates = (cardsArray: Card[]) => {
    const result: Card[] = [];
    for (let i = 0; i < cardsArray.length; i++) {
      if (result.length === 0 || result[result.length - 1].front.toLowerCase() !== cardsArray[i].front.toLowerCase()) {
        result.push(cardsArray[i]);
      }
    }
    return result;
  };

  const loadData = async () => {
    const [{ cards: newCards }, { deck: newDeck }] = await Promise.all([
      getCards(flashcardDeckId),
      getDeck(flashcardDeckId),
    ]);

    // Use our simple loop to ensure no word is given 3 times in a row
    const cleanCards = filterConsecutiveDuplicates(newCards);

    setCards(cleanCards);
    setDeck(newDeck ?? null);
    setLoading(false);

    // Pre-load the first 3 cards immediately upon page load
    const initialCards = cleanCards.slice(0, 3);
    const deckLangFrom = newDeck?.language_from ?? 'en';
    const deckLangTo = newDeck?.language_to ?? 'it';
    initialCards.forEach(card => {
      prefetchAudio(card.front, deckLangFrom);
      prefetchAudio(card.back, deckLangTo);
    });
  };

  const handleRate = (rating: 'easy' | 'hard') => {
    const updatedRatings = { ...cardRatings, [currentCard.id]: rating };
    setCardRatings(updatedRatings);

    const isLastCard = currentIndex === cards.length - 1;

    if (isLastCard) {
      finishSession(updatedRatings);
      return;
    }

    setIsFlipped(false);
    setCurrentIndex(prev => prev + 1);

    // Pre-fetch look-ahead
    const lookAheadIndex = currentIndex + 2 < cards.length ? currentIndex + 2 : 0;
    const lookAheadCard = cards[lookAheadIndex];
    if (lookAheadCard) {
      prefetchAudio(lookAheadCard.front, langFront);
      prefetchAudio(lookAheadCard.back, langBack);
    }
  };

  const handlePrevious = () => {
    setIsFlipped(false);
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handlePlayAudio = async (e: React.MouseEvent, text: string, lang: string) => {
    e.stopPropagation();
    setAudioLoading(true); // immediate feedback

    const cacheKey = `${lang}:${text}`;

    if (audioCache.current[cacheKey]) {
      new Audio(audioCache.current[cacheKey]).play();
      setAudioLoading(false); // immediate reset, it was already ready
      return;
    }

    try {
      const languageCode = i18n.t('tts.languageCode', { lng: lang, fallbackLng: 'en' });
      const voiceName = i18n.t('tts.voiceName', { lng: lang, fallbackLng: 'en' });

      const res = await fetch('/api/tts/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          languageCode,
          voiceName,
          speakingRate: 0.9,
        }),
      });

      if (!res.ok) throw new Error('TTS API error');

      const { audioContent } = await res.json();
      const src = `data:audio/mp3;base64,${audioContent}`;
      audioCache.current[cacheKey] = src;
      new Audio(src).play();
    } catch (err) {
      console.error('Audio error:', err);
    } finally {
      setAudioLoading(false);
    }
  };

  const finishSession = async (finalRatings: Record<string, 'easy' | 'hard'>) => {
    setSessionComplete(true);

    // Calculate stats locally — do not depend on the server
    const easyCount = Object.values(finalRatings).filter(r => r === 'easy').length;
    const hardCount = Object.values(finalRatings).filter(r => r === 'hard').length;
    const hardCards = cards.filter(c => finalRatings[c.id] === 'hard');

    const result = await completeStudySession(cards.length);

    if (!result.error) {
      setSessionStats({
        xpGained: result.xpGained ?? 0,
        newXp: result.newXp ?? 0,
        newStreak: result.newStreak ?? 0,
        cardsStudied: cards.length,
        easyCount,
        hardCount,
        hardCards,
      });
    } else {
      // If the server fails, we still show the local data
      setSessionStats({
        xpGained: 0,
        newXp: 0,
        newStreak: 0,
        cardsStudied: cards.length,
        easyCount,
        hardCount,
        hardCards,
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <Link 
          href={`/decks/${flashcardDeckId}`} 
          className="flex items-center gap-2 text-gray-900 hover:text-gray-700 hover:underline mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Deck
        </Link>
        <div className="text-center py-20">
          <p className="text-xl text-gray-600">No cards to study yet</p>
          <Link href={`/decks/${flashcardDeckId}`}>
            <button className="mt-4 bg-gray-900 text-white px-6 py-2 rounded-lg hover:bg-gray-800">
              Add Cards
            </button>
          </Link>
        </div>
      </div>
    );
  }

  if (sessionComplete) {
    const targetLng = deck?.language_to ?? 'en';
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-950 p-6">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
          className="w-full max-w-sm"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="text-6xl mb-4"
            >
              🎉
            </motion.div>
            <h1 className="text-2xl font-bold text-white">{i18n.t('study_session.completed.title', { lng: targetLng })}</h1>
            <p className="text-zinc-500 text-sm mt-1">{deck?.title}</p>
          </div>

          {/* Content: Hard list or positive message */}
          {sessionStats ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="mb-6"
            >
              {sessionStats.hardCards.length > 0 ? (
                <>
                  <p className="text-xs font-semibold text-zinc-500 uppercase tracking-widest mb-3">
                    {i18n.t('study_session.completed.review_again', { lng: targetLng })} — {sessionStats.hardCards.length}
                  </p>
                  <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                    {sessionStats.hardCards.map(card => (
                      <div
                        key={card.id}
                        className="bg-zinc-900 border border-zinc-700/60 rounded-xl px-4 py-3"
                      >
                        <p className="text-sm font-semibold text-white">{card.front}</p>
                        <p className="text-xs text-zinc-400 mt-1.5">{card.back}</p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="bg-zinc-900 border border-zinc-700/60 rounded-xl px-5 py-5 text-center">
                  <p className="text-3xl mb-2">⭐</p>
                  <p className="text-white font-semibold">{i18n.t('study_session.completed.all_easy', { lng: targetLng })}</p>
                </div>
              )}
            </motion.div>
          ) : (
            /* Skeleton loading */
            <div className="space-y-2 mb-6">
              {[0, 1, 2].map(i => (
                <div key={i} className="bg-zinc-800 rounded-xl h-14 animate-pulse" />
              ))}
            </div>
          )}

          {/* Buttons */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="flex flex-col gap-2"
          >
            <button
              onClick={() => {
                setSessionComplete(false);
                setSessionStats(null);
                setCardRatings({});
                setCurrentIndex(0);
                setIsFlipped(false);
              }}
              className="w-full bg-white text-zinc-900 py-3 rounded-xl font-semibold hover:bg-zinc-100 transition-colors"
            >
              {i18n.t('study_session.completed.study_again', { lng: targetLng })}
            </button>
            <Link href={`/decks/${flashcardDeckId}`}>
              <button className="w-full bg-zinc-800 border border-zinc-700 text-zinc-300 py-3 rounded-xl font-medium hover:bg-zinc-700 transition-colors">
                {i18n.t('decks.back_to_deck', { lng: targetLng })}
              </button>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    );
  }


  const currentCard = cards[currentIndex];
  const langFront = deck?.language_from ?? 'en'; // The word to learn (e.g. French)
  const langBack  = deck?.language_to ?? 'it';   // The native translation (e.g. Italian)

  return (
    <div className="container mx-auto p-6 max-w-sm">
      <Link 
        href={`/decks/${flashcardDeckId}`} 
        className="flex items-center gap-2 text-gray-900 hover:text-gray-700 hover:underline mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Deck
      </Link>

      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Card {currentIndex + 1} of {cards.length}</span>
          <button 
            onClick={() => { 
              setCurrentIndex(0); 
              setIsFlipped(false); 
            }} 
            className="flex items-center gap-1 hover:text-gray-900"
          >
            <RotateCcw className="w-4 h-4" />
            Restart
          </button>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gray-900 h-2 rounded-full duration-300"
            style={{ width: `${((currentIndex + 1) / cards.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Flashcard — vertical 2:3 */}
      <div 
        className="relative cursor-pointer perspective-1000 mb-8"
        style={{ aspectRatio: '2/3' }}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div className={`absolute inset-0 duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>

          {/* Front */}
          <div className="absolute inset-0 bg-white border-2 border-gray-200 rounded-xl shadow-lg flex flex-col items-center justify-center p-8 backface-hidden gap-4">
            <button
              onClick={(e) => handlePlayAudio(e, currentCard.front, langFront)}
              disabled={audioLoading}
              className="w-10 h-10 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-50"
              aria-label="Play"
            >
              {audioLoading 
                ? <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                : <Volume2 className="w-4 h-4 text-gray-600" />
              }
            </button>
            <p className="text-3xl font-bold text-gray-900 text-center">{currentCard.front}</p>
            <p className="text-sm text-gray-400">Click to reveal</p>
          </div>

          {/* Back */}
          <div className="absolute inset-0 bg-gray-900 text-white rounded-xl shadow-lg flex flex-col items-center justify-center p-8 backface-hidden rotate-y-180 gap-4">
            <button
              onClick={(e) => handlePlayAudio(e, currentCard.back, langBack)}
              disabled={audioLoading}
              className="w-10 h-10 rounded-full border border-white/30 flex items-center justify-center hover:bg-white/10 transition-colors disabled:opacity-50"
              aria-label="Play"
            >
              {audioLoading
                ? <Loader2 className="w-4 h-4 text-white/60 animate-spin" />
                : <Volume2 className="w-4 h-4 text-white" />
              }
            </button>
            <p className="text-3xl font-bold text-center">{currentCard.back}</p>
            <p className="text-sm text-gray-400">Click to flip back</p>
          </div>

        </div>
      </div>

      {/* Navigation — Easy/Hard only after flip, Previous when not on first one */}
      <div className="space-y-3">

        {/* Easy/Hard buttons: appear only when card is flipped */}
        {isFlipped && (() => {
          const easyLabel = i18n.t('study_session.evaluation.easy', { lng: langBack });
          const hardLabel = i18n.t('study_session.evaluation.hard', { lng: langBack });
          return (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="grid grid-cols-2 gap-3"
            >
              <button
                onClick={() => handleRate('easy')}
                className="py-3.5 rounded-xl bg-zinc-700 hover:bg-zinc-600 text-white font-semibold text-base border border-zinc-600 transition-colors flex items-center justify-center gap-2"
              >
                <span className="text-emerald-400 text-lg">✓</span>
                {easyLabel}
              </button>
              <button
                onClick={() => handleRate('hard')}
                className="py-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-base border border-zinc-700 transition-colors flex items-center justify-center gap-2"
              >
                <span className="text-red-400 text-lg">✗</span>
                {hardLabel}
              </button>
            </motion.div>
          );
        })()}

        {/* Previous: visible only when not on first card and card is not flipped */}
        {currentIndex > 0 && !isFlipped && (
          <button
            onClick={handlePrevious}
            className="w-full py-3 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors text-sm"
          >
            ← Previous
          </button>
        )}

        {/* Hint when card is not yet flipped */}
        {!isFlipped && (
          <p className="text-center text-xs text-gray-400">
            {i18n.t('study_session.evaluation.tap_to_reveal', { lng: langBack })}
          </p>
        )}

      </div>
    </div>
  );
}
