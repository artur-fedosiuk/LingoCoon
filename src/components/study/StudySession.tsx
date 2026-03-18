// src/components/study/StudySession.tsx
'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import type { Card } from '@/lib/supabase/types';
import { cn } from '@/lib/utils';
import { generateAudio } from '@/lib/actions/google-tts-actions';

interface StudySessionProps {
    cards: Card[];
    deckId: string;
    deckTitle: string;
}

export default function StudySession({ cards, deckId, deckTitle }: StudySessionProps) {
    const router = useRouter();
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    
    // Gestione Audio
    const [audioLoading, setAudioLoading] = useState(false);
    const audioCache = useRef<Record<string, string>>({}); // Cache per non ricaricare parole già sentite

    const currentCard = cards[currentIndex];
    const isCompleted = currentIndex >= cards.length;
    const progress = cards.length > 0 ? ((currentIndex / cards.length) * 100) : 0;

    const handlePlayAudio = async (e: React.MouseEvent, text: string) => {
        e.stopPropagation(); // Evita che il click giri la carta

        if (audioCache.current[text]) {
            new Audio(audioCache.current[text]).play();
            return;
        }

        setAudioLoading(true);
        // NOTA: Qui per ora passiamo 'it' (Italiano). 
        // In futuro lo prenderemo dal database (es. currentCard.language)
        const audioSrc = await generateAudio(text, 'it');
        setAudioLoading(false);

        if (audioSrc) {
            audioCache.current[text] = audioSrc;
            new Audio(audioSrc).play();
        } else {
            console.error("Nessun audio ricevuto.");
        }
    };

    const handleFlip = () => {
        if (!isFlipped) setIsFlipped(true);
    };

    const moveToNext = (e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentIndex(prev => prev + 1);
        setIsFlipped(false);
    };

    const handleReturnToDeck = () => {
        router.push(`/decks/${deckId}`);
    };

    // Schermata finale pulita
    if (isCompleted) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-white dark:bg-black p-4">
                <div className="w-full max-w-md space-y-8 text-center">
                    <h1 className="text-3xl font-bold text-black dark:text-white">Sessione Completata! 🎉</h1>
                    <button
                        onClick={handleReturnToDeck}
                        className="w-full rounded-lg bg-black px-8 py-4 text-lg font-medium text-white hover:bg-black/90 dark:bg-white dark:text-black transition-colors"
                    >
                        Torna al Deck
                    </button>
                </div>
            </div>
        );
    }

    // Schermata della carta
    return (
        <div className="flex min-h-screen flex-col bg-white dark:bg-black">
            {/* Header minimalista */}
            <div className="border-b border-black/10 dark:border-white/10">
                <div className="mx-auto max-w-4xl px-4 py-4">
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-sm text-black/60 dark:text-white/60">{deckTitle}</p>
                        <p className="text-sm font-medium text-black dark:text-white">
                            {currentIndex + 1} / {cards.length}
                        </p>
                    </div>
                    <div className="h-2 w-full overflow-hidden rounded-full bg-black/10 dark:bg-white/10">
                        <div className="h-full bg-black dark:bg-white transition-all duration-300" style={{ width: `${progress}%` }} />
                    </div>
                </div>
            </div>

            {/* Contenitore Carta Centrale */}
            <div className="flex flex-1 items-center justify-center p-4">
                <div className="w-full max-w-md">
                    
                    <div
                        onClick={handleFlip}
                        className={cn(
                            "relative h-[450px] w-full cursor-pointer rounded-2xl border p-8 transition-all duration-200",
                            "flex flex-col items-center justify-center bg-white dark:bg-black shadow-sm",
                            isFlipped ? "border-black/20 dark:border-white/20" : "border-black/10 hover:shadow-lg dark:border-white/10"
                        )}
                    >
                        {/* Sezione Audio + Testo Principale (visibile sia fronte che retro) */}
                        <div className="flex items-center gap-4 mb-4 z-10">
                            <button 
                                onClick={(e) => handlePlayAudio(e, currentCard.front)}
                                disabled={audioLoading}
                                className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-full transition-colors disabled:opacity-50 flex-shrink-0"
                            >
                                {audioLoading ? (
                                    <svg className="animate-spin h-6 w-6" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"></path>
                                    </svg>
                                ) : (
                                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 001.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06zM18.584 5.106a.75.75 0 011.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 11-1.06-1.06 8.25 8.25 0 000-11.668.75.75 0 010-1.06z" />
                                        <path d="M15.932 7.757a.75.75 0 011.061 0 6 6 0 010 8.486.75.75 0 01-1.06-1.061 4.5 4.5 0 000-6.364.75.75 0 010-1.06z" />
                                    </svg>
                                )}
                            </button>
                            <p className="text-4xl font-bold text-black dark:text-white">
                                {currentCard.front}
                            </p>
                        </div>

                        {!isFlipped ? (
                            <p className="absolute bottom-8 text-sm text-black/40 dark:text-white/40">
                                Clicca per girare
                            </p>
                        ) : (
                            <div className="space-y-6 text-center w-full animate-in fade-in duration-300">
                                <p className="text-3xl font-medium text-black/70 dark:text-white/70 mt-4">
                                    {currentCard.back}
                                </p>
                                {currentCard.example_sentence && (
                                    <p className="text-sm text-black/60 dark:text-white/60 italic border-t border-black/10 dark:border-white/10 pt-4 mt-6">
                                        "{currentCard.example_sentence}"
                                    </p>
                                )}
                                
                                <button
                                    onClick={moveToNext}
                                    className="absolute bottom-8 left-1/2 -translate-x-1/2 px-8 py-3 bg-blue-50 text-blue-600 rounded-full font-medium hover:bg-blue-100 transition-colors"
                                >
                                    Prossima →
                                </button>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </div>
    );
}