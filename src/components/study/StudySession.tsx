/**
 * Filename: src/components/study/StudySession.tsx
 * Description: Client component for Anki-style flashcard study session
 */
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Card } from '@/lib/supabase/types';
import { cn } from '@/lib/utils';

interface StudySessionProps {
    cards: Card[];
    deckId: string;
    deckTitle: string;
}

export default function StudySession({ cards, deckId, deckTitle }: StudySessionProps) {
    const router = useRouter();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [knownCount, setKnownCount] = useState(0);
    const [unknownCount, setUnknownCount] = useState(0);

    const currentCard = cards[currentIndex];
    const isCompleted = currentIndex >= cards.length;
    const progress = cards.length > 0 ? ((currentIndex / cards.length) * 100) : 0;

    const handleFlip = () => {
        if (!isFlipped) {
            setIsFlipped(true);
        }
    };

    const handleKnow = () => {
        setKnownCount(prev => prev + 1);
        moveToNext();
    };

    const handleDontKnow = () => {
        setUnknownCount(prev => prev + 1);
        moveToNext();
    };

    const moveToNext = () => {
        setCurrentIndex(prev => prev + 1);
        setIsFlipped(false);
    };

    const handleReturnToDeck = () => {
        router.push(`/decks/${deckId}`);
    };

    // Completion screen
    if (isCompleted) {
        const totalCards = cards.length;
        const accuracy = totalCards > 0 ? Math.round((knownCount / totalCards) * 100) : 0;

        return (
            <div className="flex min-h-screen items-center justify-center bg-white dark:bg-black p-4">
                <div className="w-full max-w-2xl space-y-8 text-center">
                    {/* Celebration Icon */}
                    <div className="mb-8 flex justify-center">
                        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-black/10 to-black/5 dark:from-white/10 dark:to-white/5">
                            <span className="text-5xl">🎉</span>
                        </div>
                    </div>

                    {/* Title */}
                    <h1 className="text-3xl font-bold text-black dark:text-white sm:text-4xl">
                        Sessione Completata!
                    </h1>

                    {/* Stats Card */}
                    <div className="rounded-2xl border border-black/10 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-black">
                        <div className="mb-6">
                            <p className="text-sm text-black/60 dark:text-white/60">
                                {deckTitle}
                            </p>
                        </div>

                        <div className="grid grid-cols-3 gap-6">
                            {/* Total Cards */}
                            <div className="space-y-2">
                                <p className="text-3xl font-bold text-black dark:text-white">
                                    {totalCards}
                                </p>
                                <p className="text-sm text-black/60 dark:text-white/60">
                                    Carte totali
                                </p>
                            </div>

                            {/* Known Cards */}
                            <div className="space-y-2">
                                <p className="text-3xl font-bold text-green-600 dark:text-green-500">
                                    {knownCount}
                                </p>
                                <p className="text-sm text-black/60 dark:text-white/60">
                                    Lo so
                                </p>
                            </div>

                            {/* Unknown Cards */}
                            <div className="space-y-2">
                                <p className="text-3xl font-bold text-red-600 dark:text-red-500">
                                    {unknownCount}
                                </p>
                                <p className="text-sm text-black/60 dark:text-white/60">
                                    Da rivedere
                                </p>
                            </div>
                        </div>

                        {/* Accuracy */}
                        <div className="mt-8 pt-6 border-t border-black/10 dark:border-white/10">
                            <p className="text-sm text-black/60 dark:text-white/60 mb-2">
                                Precisione
                            </p>
                            <p className="text-4xl font-bold text-black dark:text-white">
                                {accuracy}%
                            </p>
                        </div>
                    </div>

                    {/* Return Button */}
                    <button
                        onClick={handleReturnToDeck}
                        className="w-full rounded-lg bg-black px-8 py-4 text-lg font-medium text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90 transition-colors"
                    >
                        Torna al Deck
                    </button>
                </div>
            </div>
        );
    }

    // Study session screen
    return (
        <div className="flex min-h-screen flex-col bg-white dark:bg-black">
            {/* Header with progress */}
            <div className="border-b border-black/10 dark:border-white/10 bg-white dark:bg-black">
                <div className="mx-auto max-w-4xl px-4 py-4">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-sm text-black/60 dark:text-white/60">
                            {deckTitle}
                        </p>
                        <p className="text-sm font-medium text-black dark:text-white">
                            {currentIndex + 1} / {cards.length}
                        </p>
                    </div>
                    {/* Progress bar */}
                    <div className="h-2 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                        <div
                            className="h-full bg-black dark:bg-white transition-all duration-300"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Card Container */}
            <div className="flex flex-1 items-center justify-center p-4">
                <div className="w-full max-w-2xl">
                    {/* Flashcard */}
                    <div
                        onClick={handleFlip}
                        className={cn(
                            "relative min-h-[400px] cursor-pointer rounded-2xl border p-8 transition-all duration-200",
                            "flex flex-col items-center justify-center",
                            !isFlipped && "hover:shadow-lg",
                            isFlipped
                                ? "border-black/20 bg-white dark:border-white/20 dark:bg-black"
                                : "border-black/10 bg-white dark:border-white/10 dark:bg-black"
                        )}
                    >
                        {!isFlipped ? (
                            // FRONT VIEW
                            <div className="space-y-6 text-center w-full">
                                <div className="space-y-4">
                                    <p className="text-4xl font-bold text-black dark:text-white sm:text-5xl">
                                        {currentCard.front}
                                    </p>
                                </div>
                                <p className="text-sm text-black/40 dark:text-white/40 mt-8">
                                    Click to flip
                                </p>
                            </div>
                        ) : (
                            // BACK VIEW
                            <div className="space-y-6 text-center w-full">
                                {/* Small front text on top */}
                                <p className="text-lg text-black/50 dark:text-white/50">
                                    {currentCard.front}
                                </p>

                                {/* Large back text in center */}
                                <p className="text-4xl font-bold text-black dark:text-white sm:text-5xl">
                                    {currentCard.back}
                                </p>

                                {/* Example sentence at bottom (if exists) */}
                                {currentCard.example_sentence && (
                                    <div className="mt-8 pt-6 border-t border-black/10 dark:border-white/10">
                                        <p className="text-sm text-black/60 dark:text-white/60 italic">
                                            {currentCard.example_sentence}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Action Buttons - Only visible when flipped */}
                    {isFlipped && (
                        <div className="mt-6 grid grid-cols-2 gap-4">
                            {/* Don't Know Button */}
                            <button
                                onClick={handleDontKnow}
                                className="flex items-center justify-center gap-2 rounded-lg border-2 border-red-500 bg-red-50 px-6 py-4 text-lg font-medium text-red-600 hover:bg-red-100 dark:bg-red-950/20 dark:text-red-500 dark:hover:bg-red-950/30 transition-colors"
                            >
                                <span className="text-xl">❌</span>
                                Non lo so
                            </button>

                            {/* Know Button */}
                            <button
                                onClick={handleKnow}
                                className="flex items-center justify-center gap-2 rounded-lg border-2 border-green-500 bg-green-50 px-6 py-4 text-lg font-medium text-green-600 hover:bg-green-100 dark:bg-green-950/20 dark:text-green-500 dark:hover:bg-green-950/30 transition-colors"
                            >
                                <span className="text-xl">✅</span>
                                Lo so
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
