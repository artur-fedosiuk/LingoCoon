/**
 * Filename: src/components/decks/CreateDeckModal.tsx
 * Description: Modal component for creating new flashcard decks with language selection
 */
'use client';

import * as React from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createDeck } from '@/lib/actions/decks';

interface CreateDeckModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (deck: any) => void;
}

const LANGUAGES = [
    { code: 'en', name: 'English' },
    { code: 'it', name: 'Italian' },
    { code: 'fr', name: 'French' },
    { code: 'uk', name: 'Ukrainian' }
];

export default function CreateDeckModal({ isOpen, onClose, onSuccess }: CreateDeckModalProps) {
    const [title, setTitle] = React.useState('');
    const [description, setDescription] = React.useState('');
    const [languageFrom, setLanguageFrom] = React.useState('en');
    const [languageTo, setLanguageTo] = React.useState('it');
    const [isCreating, setIsCreating] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim()) {
            setError('Title is required');
            return;
        }

        setIsCreating(true);
        setError(null);

        try {
            const result = await createDeck({
                title: title.trim(),
                description: description.trim() || undefined,
                languageFrom,
                languageTo
            });

            if (result.success && result.data) {
                onSuccess?.(result.data);
                resetForm();
                onClose();
            } else {
                setError(result.error || 'Failed to create deck');
            }
        } catch (err) {
            setError('An unexpected error occurred');
        } finally {
            setIsCreating(false);
        }
    };

    const resetForm = () => {
        setTitle('');
        setDescription('');
        setLanguageFrom('en');
        setLanguageTo('it');
        setError(null);
    };

    const handleClose = () => {
        resetForm();
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 dark:bg-white/10 p-4">
            <div
                className="w-full max-w-lg rounded-xl border border-black/10 dark:border-white/10 bg-white dark:bg-black p-6 shadow-2xl"
                role="dialog"
                aria-modal="true"
                aria-labelledby="create-deck-title"
            >
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <h2
                        id="create-deck-title"
                        className="text-xl font-bold text-black dark:text-white"
                    >
                        Create New Deck
                    </h2>
                    <button
                        onClick={handleClose}
                        className="rounded-lg p-1 text-black/50 dark:text-white/50 transition-colors hover:bg-black/5 dark:hover:bg-white/5 hover:text-black dark:hover:text-white"
                        aria-label="Close"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Title */}
                    <div>
                        <label
                            htmlFor="deck-title"
                            className="mb-2 block text-sm font-medium text-black dark:text-white"
                        >
                            Deck Title *
                        </label>
                        <Input
                            id="deck-title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="e.g., Italian Vocabulary"
                            className="border-black/20 dark:border-white/20 bg-transparent focus-visible:ring-black dark:focus-visible:ring-white"
                            autoFocus
                            disabled={isCreating}
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label
                            htmlFor="deck-description"
                            className="mb-2 block text-sm font-medium text-black dark:text-white"
                        >
                            Description (Optional)
                        </label>
                        <Input
                            id="deck-description"
                            type="text"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="e.g., Common phrases for travel"
                            className="border-black/20 dark:border-white/20 bg-transparent focus-visible:ring-black dark:focus-visible:ring-white"
                            disabled={isCreating}
                        />
                    </div>

                    {/* Language Selection */}
                    <div className="grid grid-cols-2 gap-4">
                        {/* From Language */}
                        <div>
                            <label
                                htmlFor="language-from"
                                className="mb-2 block text-sm font-medium text-black dark:text-white"
                            >
                                From Language
                            </label>
                            <select
                                id="language-from"
                                value={languageFrom}
                                onChange={(e) => setLanguageFrom(e.target.value)}
                                className="w-full rounded-md border border-black/20 dark:border-white/20 bg-transparent px-3 py-2 text-sm text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                                disabled={isCreating}
                            >
                                {LANGUAGES.map((lang) => (
                                    <option key={lang.code} value={lang.code}>
                                        {lang.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* To Language */}
                        <div>
                            <label
                                htmlFor="language-to"
                                className="mb-2 block text-sm font-medium text-black dark:text-white"
                            >
                                To Language
                            </label>
                            <select
                                id="language-to"
                                value={languageTo}
                                onChange={(e) => setLanguageTo(e.target.value)}
                                className="w-full rounded-md border border-black/20 dark:border-white/20 bg-transparent px-3 py-2 text-sm text-black dark:text-white focus:outline-none focus:ring-2 focus:ring-black dark:focus:ring-white"
                                disabled={isCreating}
                            >
                                {LANGUAGES.map((lang) => (
                                    <option key={lang.code} value={lang.code}>
                                        {lang.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
                    )}

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-2">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            disabled={isCreating}
                            className="flex-1 border-black/20 dark:border-white/20 text-black dark:text-white hover:bg-black/5 dark:hover:bg-white/5"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isCreating || !title.trim()}
                            className="flex-1 gap-2 bg-black dark:bg-white text-white dark:text-black hover:bg-black/90 dark:hover:bg-white/90"
                        >
                            {isCreating ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Creating...
                                </>
                            ) : (
                                'Create Deck'
                            )}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
