// src/components/decks/CreateDeckModal.tsx
// Modal dialog to create a new flashcard deck.
// Shown from the dashboard when the user clicks "New Deck".
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createDeck } from '@/lib/actions/deck-actions';
import { X, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface CreateDeckModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CreateDeckModal({ isOpen, onClose }: CreateDeckModalProps) {
  const router = useRouter();
  const [title, setTitle] = useState('');
  const [languageFrom, setLanguageFrom] = useState('en');
  const [languageTo, setLanguageTo] = useState('it');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { t } = useTranslation();

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Title cannot be empty');
      return;
    }

    if (languageFrom === languageTo) {
      setError('Source and target languages must be different');
      return;
    }

    setLoading(true);
    setError('');

    const result = await createDeck(title, languageFrom, languageTo);

    setLoading(false);

    if (result.error) {
      setError(result.error);
    } else {
      setTitle('');
      setError('');
      onClose();
      // Refresh server-side data without reloading the whole page
      router.refresh();
    }
  };

  const handleClose = () => {
    setTitle('');
    setError('');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg w-full max-w-md shadow-xl">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-900">{t('decks.modal.create_title', 'Create New Deck')}</h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Title Input */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('decks.modal.deck_title', 'Deck Title')}
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:outline-none"
              placeholder={t('decks.modal.title_placeholder', 'e.g. English Verbs')}
              autoFocus
            />
          </div>

          {/* Language Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('decks.modal.study_language', 'Study Language')}
              </label>
              <select
                value={languageFrom}
                onChange={(e) => setLanguageFrom(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500"
              >
                <option value="en">🇬🇧 English</option>
                <option value="it">🇮🇹 Italian</option>
                <option value="fr">🇫🇷 French</option>
                <option value="uk">🇺🇦 Ukrainian</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t('decks.modal.translate_language', 'Translate language')}
              </label>
              <select
                value={languageTo}
                onChange={(e) => setLanguageTo(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500"
              >
                <option value="en">🇬🇧 English</option>
                <option value="it">🇮🇹 Italian</option>
                <option value="fr">🇫🇷 French</option>
                <option value="uk">🇺🇦 Ukrainian</option>
              </select>
            </div>
          </div>



          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
              {error}
            </div>
          )}
        </div>

        {/* Footer Buttons */}
        <div className="flex justify-end gap-3 p-6 border-t bg-gray-50">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
            disabled={loading}
          >
            {t('common.cancel', 'Cancel')}
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim() || loading}
            className="px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                {t('decks.modal.creating', 'Creating...')}
              </>
            ) : (
              t('decks.modal.create_button', 'Create Deck')
            )}
          </button>
        </div>
      </div>
    </div>
  );
}