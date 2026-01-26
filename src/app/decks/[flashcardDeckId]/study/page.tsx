// app/decks/[flashcardDeckId]/study/page.tsx
'use client';

import { useState, useEffect, use } from 'react';
import { getCards } from '@/lib/actions/deck-actions';
import Link from 'next/link';
import { ArrowLeft, RotateCcw } from 'lucide-react';
import type { Card } from '@/lib/types';

export default function StudyPage({ 
  params 
}: { 
  params: Promise<{ flashcardDeckId: string }> 
}) {
  const { flashcardDeckId } = use(params);
  const [cards, setCards] = useState<Card[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCards();
  }, [flashcardDeckId]);

  const loadCards = async () => {
    const { cards } = await getCards(flashcardDeckId);
    setCards(cards);
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

  return (
    <div className="container mx-auto p-6 max-w-2xl">
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
            onClick={() => setCurrentIndex(0)} 
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
          ></div>
        </div>
      </div>

      {/* Flashcard with 3D flip */}
      <div 
        className="relative h-80 cursor-pointer perspective-1000"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <div className={`absolute inset-0 duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
          {/* Front */}
          <div className="absolute inset-0 bg-white border-2 border-gray-200 rounded-xl shadow-lg flex items-center justify-center p-8 backface-hidden">
            <div className="text-center">
              <p className="text-3xl font-bold text-gray-900 mb-4">{currentCard.front}</p>
              <p className="text-sm text-gray-400">Click to reveal</p>
            </div>
          </div>
          
          {/* Back */}
          <div className="absolute inset-0 bg-gray-900 text-white rounded-xl shadow-lg flex items-center justify-center p-8 backface-hidden rotate-y-180">
            <div className="text-center">
              <p className="text-3xl font-bold mb-4">{currentCard.back}</p>
              <p className="text-sm text-gray-400">Click to flip back</p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
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
