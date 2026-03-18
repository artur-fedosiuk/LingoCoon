// app/decks/[flashcardDeckId]/study/page.tsx
'use client';

import { useState, useEffect, useRef, use } from 'react';
import { getCards, getDeck } from '@/lib/actions/deck-actions';
import Link from 'next/link';
import { ArrowLeft, RotateCcw, Volume2, Loader2 } from 'lucide-react';
import type { Card, Deck } from '@/lib/types';

// Mappa lingua -> voce Neural2 (più naturale possibile)
const VOICE_MAP: Record<string, { languageCode: string; voiceName: string }> = {
  it: { languageCode: 'it-IT', voiceName: 'it-IT-Neural2-A' },
  en: { languageCode: 'en-US', voiceName: 'en-US-Neural2-F' },
  fr: { languageCode: 'fr-FR', voiceName: 'fr-FR-Neural2-A' },
  uk: { languageCode: 'uk-UA', voiceName: 'uk-UA-Wavenet-A' },
  de: { languageCode: 'de-DE', voiceName: 'de-DE-Neural2-A' },
  es: { languageCode: 'es-ES', voiceName: 'es-ES-Neural2-A' },
  pt: { languageCode: 'pt-BR', voiceName: 'pt-BR-Neural2-A' },
};

function getVoiceConfig(lang: string) {
  const key = lang?.toLowerCase().slice(0, 2);
  return VOICE_MAP[key] ?? { languageCode: 'en-US', voiceName: 'en-US-Neural2-F' };
}

export default function StudyPage({ 
  params 
}: { 
  params: Promise<{ flashcardDeckId: string }> 
}) {
  const { flashcardDeckId } = use(params);
  const [deck, setDeck] = useState<Deck | null>(null);
  const [cards, setCards] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);
  const [audioLoading, setAudioLoading] = useState(false);

  // Cache audio per non richiamare l'API per la stessa parola
  const audioCache = useRef<Record<string, string>>({});

  useEffect(() => {
    loadData();
  }, [flashcardDeckId]);

  const loadData = async () => {
    const [{ cards }, { deck }] = await Promise.all([
      getCards(flashcardDeckId),
      getDeck(flashcardDeckId),
    ]);
    setCards(cards);
    setDeck(deck ?? null);
    setLoading(false);
  };

  const handleNext = () => {
    setIsFlipped(false);
    if (currentIndex < cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      setCurrentIndex(0);
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

    const cacheKey = `${lang}:${text}`;

    // Se in cache, riproduci subito
    if (audioCache.current[cacheKey]) {
      new Audio(audioCache.current[cacheKey]).play();
      return;
    }

    setAudioLoading(true);
    try {
      const voice = getVoiceConfig(lang);
      const res = await fetch('/api/tts/synthesize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          languageCode: voice.languageCode,
          voiceName: voice.voiceName,
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

  const currentCard = cards[currentIndex];
  const langFront = deck?.language_from ?? 'en'; // La parola da imparare (es. Francese)
  const langBack  = deck?.language_to ?? 'it';   // La traduzione madrelingua (es. Italiano)

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
            onClick={() => { setCurrentIndex(0); setIsFlipped(false); }} 
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

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentIndex === 0}
          className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <button
          onClick={handleNext}
          className="px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
        >
          {currentIndex === cards.length - 1 ? 'Restart' : 'Next'}
        </button>
      </div>
    </div>
  );
}
