/**
 * Filename: src/components/flashcards/CreateCardForm.tsx
 * Description: Form component for creating new flashcards with real-time language validation
 */
'use client';

import { useState, useEffect } from 'react';
import { quickLanguageCheck, type LanguageCode } from '@/lib/validation';
import { createCardAction } from '@/app/actions/deck-actions';
import { AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

interface CreateCardFormProps {
    deckId: string;
    targetLanguage: LanguageCode; // The deck's language_to (e.g., 'en', 'it', 'fr', 'uk')
}

export default function CreateCardForm({ deckId, targetLanguage }: CreateCardFormProps) {
    const [front, setFront] = useState('');
    const [back, setBack] = useState('');
    const [frontWarning, setFrontWarning] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    // Real-time language check while user types in the "front" field
    useEffect(() => {
        const check = quickLanguageCheck(front, targetLanguage);
        setFrontWarning(check.warning || '');
    }, [front, targetLanguage]);

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setError('');
        setSuccess(false);

        // Create FormData for Server Action
        const formData = new FormData();
        formData.append('deckId', deckId);
        formData.append('front', front);
        formData.append('back', back);
        formData.append('targetLanguage', targetLanguage);

        // Call Server Action
        const result = await createCardAction(formData);

        if (result?.error) {
            setError(result.error);
        } else {
            setSuccess(true);
            // Reset form
            setFront('');
            setBack('');
            // Hide success message after 3 seconds
            setTimeout(() => setSuccess(false), 3000);
        }

        setIsSubmitting(false);
    };

    // Map language code for browser spellcheck
    const getSpellcheckLang = (code: LanguageCode): string => {
        const map: Record<LanguageCode, string> = {
            'en': 'en',
            'it': 'it',
            'fr': 'fr',
            'uk': 'uk'
        };
        return map[code];
    };

    // Get language display name
    const getLanguageName = (code: LanguageCode): string => {
        const names: Record<LanguageCode, string> = {
            'en': 'English',
            'it': 'Italian',
            'fr': 'French',
            'uk': 'Ukrainian'
        };
        return names[code];
    };

    return (
        <div className="space-y-4 bg-white dark:bg-black p-6 rounded-lg border border-black/10 dark:border-white/10 shadow-sm">
            <h3 className="font-semibold text-lg text-black dark:text-white">Add New Card</h3>

            {/* FRONT FIELD (Target Language) */}
            <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                    Front ({getLanguageName(targetLanguage)})
                </label>
                <textarea
                    value={front}
                    onChange={(e) => setFront(e.target.value)}
                    spellCheck={true}
                    lang={getSpellcheckLang(targetLanguage)}
                    className={`w-full p-3 border rounded-md bg-transparent focus:ring-2 focus:ring-black dark:focus:ring-white focus:outline-none transition-colors ${frontWarning
                            ? 'border-yellow-400 bg-yellow-50 dark:bg-yellow-950/20'
                            : 'border-black/20 dark:border-white/20'
                        }`}
                    placeholder="Type the word or phrase to learn..."
                    rows={3}
                />

                {/* Real-time warning */}
                {frontWarning && (
                    <div className="mt-2 flex items-start gap-2 text-sm text-yellow-700 dark:text-yellow-500 bg-yellow-50 dark:bg-yellow-950/20 p-2 rounded border border-yellow-200 dark:border-yellow-800">
                        <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{frontWarning}</span>
                    </div>
                )}

                {/* Positive feedback */}
                {front.length >= 20 && !frontWarning && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-green-600 dark:text-green-500">
                        <CheckCircle className="w-4 h-4" />
                        <span>Language detected correctly ✓</span>
                    </div>
                )}
            </div>

            {/* BACK FIELD (Translation) */}
            <div>
                <label className="block text-sm font-medium text-black dark:text-white mb-2">
                    Back (Translation)
                </label>
                <textarea
                    value={back}
                    onChange={(e) => setBack(e.target.value)}
                    spellCheck={true}
                    className="w-full p-3 border border-black/20 dark:border-white/20 rounded-md bg-transparent focus:ring-2 focus:ring-black dark:focus:ring-white focus:outline-none"
                    placeholder="Type the translation..."
                    rows={3}
                />
            </div>

            {/* ERROR MESSAGE */}
            {error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded text-sm text-red-600 dark:text-red-400">
                    ❌ {error}
                </div>
            )}

            {/* SUCCESS MESSAGE */}
            {success && (
                <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded text-sm text-green-600 dark:text-green-400">
                    ✅ Card created successfully! 🎉
                </div>
            )}

            {/* SUBMIT BUTTON */}
            <button
                onClick={handleSubmit}
                disabled={isSubmitting || !front.trim() || !back.trim()}
                className="w-full bg-black dark:bg-white text-white dark:text-black py-3 rounded-md hover:bg-black/90 dark:hover:bg-white/90 disabled:bg-gray-300 dark:disabled:bg-gray-700 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center gap-2"
            >
                {isSubmitting ? (
                    <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Saving...</span>
                    </>
                ) : (
                    'Create Card'
                )}
            </button>

            {/* INFO BOX */}
            <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded text-xs text-blue-700 dark:text-blue-400">
                <strong>💡 Smart Validation Active:</strong>
                <ul className="mt-1 space-y-1 list-disc list-inside">
                    <li>Automatic language detection</li>
                    <li>Browser spell check</li>
                    <li>Inappropriate content filter</li>
                    <li>TTS optimization</li>
                </ul>
            </div>
        </div>
    );
}