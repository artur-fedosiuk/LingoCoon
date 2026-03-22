// src/app/decks/DecksContent.tsx
// Client-side page for the Flashcard Hub.
// Shows the list of decks, handles the "create deck" modal, navigates to study/edit.
'use client';

import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Plus, Play, Pencil, Library, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { createDeck } from '@/lib/actions/deck-actions';
import type { Deck } from '@/lib/supabase/types';
import { cn } from '@/lib/utils';
import Link from 'next/link';

interface DecksContentProps {
    initialDecks: Deck[];
}

export default function DecksContent({ initialDecks }: DecksContentProps) {
    const { t } = useTranslation();
    const [decks, setDecks] = React.useState<Deck[]>(initialDecks);
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [newDeckTitle, setNewDeckTitle] = React.useState('');
    const [languageFrom, setLanguageFrom] = React.useState('en');
    const [languageTo, setLanguageTo] = React.useState('it');
    const [isCreating, setIsCreating] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const handleCreateDeck = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDeckTitle.trim()) {
            setError(t('decks.errors.title_required'));
            return;
        }

        setIsCreating(true);
        setError(null);

        try {
            const result = await createDeck(newDeckTitle.trim(), languageFrom, languageTo);

            if (result.deck) {
                setDecks((prev) => [result.deck!, ...prev]);
                setNewDeckTitle('');
                setLanguageFrom('en');
                setLanguageTo('it');
                setIsModalOpen(false);
            } else {
                setError(result.error || t('decks.errors.create_failed'));
            }
        } catch {
            setError(t('decks.errors.create_failed'));
        } finally {
            setIsCreating(false);
        }
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setNewDeckTitle('');
        setError(null);
    };

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-black dark:text-white sm:text-3xl">
                        {t('decks.title')}
                    </h1>
                    <p className="mt-1 text-sm text-black/60 dark:text-white/60">
                        {t('decks.subtitle')}
                    </p>
                </div>
                <Button
                    onClick={() => setIsModalOpen(true)}
                    className="gap-2 bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
                >
                    <Plus className="h-4 w-4" />
                    {t('decks.create_new')}
                </Button>
            </div>

            {/* Decks Grid or Empty State */}
            {decks.length === 0 ? (
                <EmptyState onCreateClick={() => setIsModalOpen(true)} />
            ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {decks.map((deck) => (
                        <DeckCard key={deck.id} deck={deck} />
                    ))}
                </div>
            )}

            {/* Create Deck Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 dark:bg-white/10">
                    <div
                        className="w-full max-w-md rounded-xl border border-black/10 bg-white p-6 shadow-2xl dark:border-white/10 dark:bg-black"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="create-deck-title"
                    >
                        <div className="mb-6 flex items-center justify-between">
                            <h2
                                id="create-deck-title"
                                className="text-xl font-bold text-black dark:text-white"
                            >
                                {t('decks.modal.create_title')}
                            </h2>
                            <button
                                onClick={closeModal}
                                className="rounded-lg p-1 text-black/50 transition-colors hover:bg-black/5 hover:text-black dark:text-white/50 dark:hover:bg-white/5 dark:hover:text-white"
                                aria-label={t('common.cancel')}
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <form onSubmit={handleCreateDeck} className="space-y-4">
                            {/* Deck title */}
                            <div>
                                <label
                                    htmlFor="deck-title"
                                    className="mb-2 block text-sm font-medium text-black dark:text-white"
                                >
                                    {t('decks.modal.deck_title')}
                                </label>
                                <Input
                                    id="deck-title"
                                    type="text"
                                    value={newDeckTitle}
                                    onChange={(e) => setNewDeckTitle(e.target.value)}
                                    placeholder={t('decks.modal.title_placeholder')}
                                    className="border-black/20 bg-transparent focus-visible:ring-black dark:border-white/20 dark:focus-visible:ring-white"
                                    autoFocus
                                    disabled={isCreating}
                                />
                            </div>

                            {/* Language selectors */}
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                                        {t('decks.modal.study_language')}
                                    </label>
                                    <select
                                        value={languageFrom}
                                        onChange={(e) => setLanguageFrom(e.target.value)}
                                        className="w-full rounded-lg border border-black/20 bg-transparent p-2 text-sm dark:border-white/20 dark:text-white"
                                        disabled={isCreating}
                                    >
                                        <option value="en">🇬🇧 English</option>
                                        <option value="it">🇮🇹 Italian</option>
                                        <option value="fr">🇫🇷 French</option>
                                        <option value="uk">🇺🇦 Ukrainian</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="mb-2 block text-sm font-medium text-black dark:text-white">
                                        {t('decks.modal.translate_language')}
                                    </label>
                                    <select
                                        value={languageTo}
                                        onChange={(e) => setLanguageTo(e.target.value)}
                                        className="w-full rounded-lg border border-black/20 bg-transparent p-2 text-sm dark:border-white/20 dark:text-white"
                                        disabled={isCreating}
                                    >
                                        <option value="en">🇬🇧 English</option>
                                        <option value="it">🇮🇹 Italian</option>
                                        <option value="fr">🇫🇷 French</option>
                                        <option value="uk">🇺🇦 Ukrainian</option>
                                    </select>
                                </div>
                            </div>

                            {error && (
                                <p className="mt-2 text-sm text-red-500">{error}</p>
                            )}

                            <div className="flex gap-3">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={closeModal}
                                    disabled={isCreating}
                                    className="flex-1 border-black/20 text-black hover:bg-black/5 dark:border-white/20 dark:text-white dark:hover:bg-white/5"
                                >
                                    {t('common.cancel')}
                                </Button>
                                <Button
                                    type="submit"
                                    disabled={isCreating || !newDeckTitle.trim()}
                                    className="flex-1 gap-2 bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
                                >
                                    {isCreating ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            {t('decks.modal.creating')}
                                        </>
                                    ) : (
                                        t('decks.modal.create_button')
                                    )}
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// Empty state shown when the user has no decks yet
function EmptyState({ onCreateClick }: { onCreateClick: () => void }) {
    const { t } = useTranslation();

    return (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-black/20 bg-black/[0.02] py-16 dark:border-white/20 dark:bg-white/[0.02]">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-black/5 dark:bg-white/5">
                <Library className="h-8 w-8 text-black/40 dark:text-white/40" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-black dark:text-white">
                {t('decks.empty.title')}
            </h3>
            <p className="mb-6 max-w-sm text-center text-sm text-black/60 dark:text-white/60">
                {t('decks.empty.description')}
            </p>
            <Button
                onClick={onCreateClick}
                className="gap-2 bg-black text-white hover:bg-black/90 dark:bg-white dark:text-black dark:hover:bg-white/90"
            >
                <Plus className="h-4 w-4" />
                {t('decks.empty.create_button')}
            </Button>
        </div>
    );
}

// A single deck card with Study and Edit buttons
function DeckCard({ deck }: { deck: Deck }) {
    const { t } = useTranslation();
    const cardCount = deck.card_count || 0;

    return (
        <Card className="group relative overflow-hidden border-black/10 bg-white transition-all duration-300 hover:border-black/20 hover:shadow-lg dark:border-white/10 dark:bg-black dark:hover:border-white/20">
            <CardContent className="p-5">
                {/* Deck Info */}
                <div className="mb-4">
                    <h3 className="mb-1 text-lg font-semibold text-black dark:text-white">
                        {deck.title}
                    </h3>
                    <p className="text-sm text-black/60 dark:text-white/60">
                        {cardCount === 1
                            ? t('decks.card_count_single', { count: cardCount })
                            : t('decks.card_count', { count: cardCount })}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                    {/* Study button — route is /decks/[id]/study */}
                    <Link href={`/decks/${deck.id}/study`} className="flex-1">
                        <Button
                            className={cn(
                                'w-full gap-2 bg-black text-white hover:bg-black/90',
                                'dark:bg-white dark:text-black dark:hover:bg-white/90',
                                'transition-all duration-200'
                            )}
                        >
                            <Play className="h-4 w-4" />
                            {t('decks.study')}
                        </Button>
                    </Link>

                    {/* Edit button */}
                    <Link href={`/decks/${deck.id}`}>
                        <Button
                            variant="outline"
                            size="icon"
                            className="border-black/20 text-black hover:bg-black/5 dark:border-white/20 dark:text-white dark:hover:bg-white/5"
                            aria-label={t('decks.edit')}
                        >
                            <Pencil className="h-4 w-4" />
                        </Button>
                    </Link>
                </div>
            </CardContent>

            {/* Subtle accent line at top on hover */}
            <div className="absolute left-0 right-0 top-0 h-1 bg-gradient-to-r from-black/20 via-black/40 to-black/20 opacity-0 transition-opacity duration-300 group-hover:opacity-100 dark:from-white/20 dark:via-white/40 dark:to-white/20" />
        </Card>
    );
}
