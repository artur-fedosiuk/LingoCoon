// src/components/flashcards/CreateCardForm.tsx
// Form to add a new flashcard to a deck.
'use client';

import { useState } from 'react';
import { createCard } from '@/lib/actions/deck-actions';
import { Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface CreateCardFormProps {
  deckId: string;
  deckLanguage: string;
  languageTo: string;
}

export default function CreateCardForm({ deckId, deckLanguage, languageTo }: CreateCardFormProps) {
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const { t } = useTranslation();

  // Maps a language code to its display name using the translation file
  const getLanguageName = (code: string): string => {
    const keyMap: Record<string, string> = {
      en: 'en-US',
      it: 'it-IT',
      fr: 'fr-FR',
      uk: 'uk-UA',
    };
    const key = keyMap[code];
    return key ? (t(`languages.${key}`) as string) : code.toUpperCase();
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');

    const result = await createCard(deckId, front, back);

    if (result?.error) {
      setError(result.error);
    } else {
      setFront('');
      setBack('');
    }

    setIsSubmitting(false);
  };

  return (
    <div className="space-y-4">
      {/* Front Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('flashcards.form.front_label', 'Word to learn')} ({getLanguageName(deckLanguage)})
        </label>
        <textarea
          value={front}
          onChange={(e) => setFront(e.target.value)}
          rows={3}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:outline-none resize-none"
          placeholder={t('flashcards.form.front_placeholder', 'Enter word or phrase to learn...')}
        />
      </div>

      {/* Back Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {t('flashcards.form.back_label', 'Translation')} ({getLanguageName(languageTo)})
        </label>
        <textarea
          value={back}
          onChange={(e) => setBack(e.target.value)}
          rows={3}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:outline-none resize-none"
          placeholder={t('flashcards.form.back_placeholder', 'Enter translation...')}
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          {error}
        </div>
      )}

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={isSubmitting || !front.trim() || !back.trim()}
        className="w-full bg-gray-900 text-white py-3 rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            <span>{t('flashcards.form.creating', 'Creating...')}</span>
          </>
        ) : (
          t('flashcards.form.create_button', 'Create Card')
        )}
      </button>
    </div>
  );
}