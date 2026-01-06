/**
 * FILE: src/components/FlashcardForm.jsx
 * LAST MODIFIED: 2026-01-06
 * DESCRIPTION: Form for creating/editing flashcards - Modern Minimalist Design
 */

import { useState } from 'react';

function FlashcardForm({
  initialData = null,
  onSubmit,
  onCancel,
  onTranslate,
  isEditing = false
}) {
  // Form state
  const [originalWord, setOriginalWord] = useState(initialData?.originalWord || '');
  const [translation, setTranslation] = useState(initialData?.translation || '');
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [category, setCategory] = useState(initialData?.category || '');

  // UI state
  const [loading, setLoading] = useState(false);
  const [translating, setTranslating] = useState(false);
  const [error, setError] = useState('');

  const handleAutoTranslate = async () => {
    if (!originalWord.trim()) {
      setError('Enter text to translate');
      return;
    }

    if (!onTranslate) {
      setError('Translation service not available');
      return;
    }

    setTranslating(true);
    setError('');

    try {
      const translatedText = await onTranslate(originalWord);

      if (translatedText) {
        setTranslation(translatedText);
      } else {
        setError('Translation failed. Please enter manually.');
      }
    } catch (err) {
      console.error('Translation error:', err);
      setError('Translation error. Please try again.');
    } finally {
      setTranslating(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!originalWord.trim()) {
      setError('Original word is required');
      return;
    }

    if (!translation.trim()) {
      setError('Translation is required');
      return;
    }

    setLoading(true);

    try {
      const flashcardData = {
        originalWord: originalWord.trim(),
        translation: translation.trim(),
        notes: notes.trim(),
        category: category.trim() || 'general'
      };

      await onSubmit(flashcardData);

      if (!isEditing) {
        setOriginalWord('');
        setTranslation('');
        setNotes('');
        setCategory('');
      }
    } catch (err) {
      console.error('Form submission error:', err);
      setError('Failed to save flashcard. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Input classes for consistency
  const inputClasses = `
    w-full bg-gray-800 text-white rounded-xl p-4 text-sm
    border-2 border-transparent
    placeholder-gray-500
    focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50
    transition-all duration-200
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const labelClasses = "block text-sm font-medium text-gray-400 mb-2";

  return (
    <div className="space-y-5">
      {/* Title */}
      <h2 className="text-xl font-bold text-center bg-gradient-to-r from-purple-400 via-indigo-400 to-purple-500 bg-clip-text text-transparent">
        {isEditing ? 'Edit Flashcard' : 'New Flashcard'}
      </h2>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-300 text-sm flex items-center gap-2">
          <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Original Word */}
        <div>
          <label htmlFor="originalWord" className={labelClasses}>
            Original Word / Phrase *
          </label>
          <textarea
            id="originalWord"
            value={originalWord}
            onChange={(e) => setOriginalWord(e.target.value)}
            placeholder="Enter word or phrase to learn"
            rows={2}
            disabled={loading}
            required
            className={inputClasses + " resize-none"}
          />
        </div>

        {/* Translation */}
        <div>
          <label htmlFor="translation" className={labelClasses}>
            Translation *
          </label>
          <div className="space-y-2">
            <textarea
              id="translation"
              value={translation}
              onChange={(e) => setTranslation(e.target.value)}
              placeholder="Enter translation"
              rows={2}
              disabled={loading}
              required
              className={inputClasses + " resize-none"}
            />
            {onTranslate && (
              <button
                type="button"
                onClick={handleAutoTranslate}
                disabled={loading || translating || !originalWord.trim()}
                className="text-sm font-medium text-purple-400 hover:text-purple-300 bg-purple-500/10 hover:bg-purple-500/20 px-3 py-1.5 rounded-lg border border-purple-500/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {translating ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Translating...
                  </span>
                ) : (
                  '✨ Auto-translate'
                )}
              </button>
            )}
          </div>
        </div>

        {/* Category */}
        <div>
          <label htmlFor="category" className={labelClasses}>
            Category (optional)
          </label>
          <input
            type="text"
            id="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="e.g., travel, work, daily"
            disabled={loading}
            className={inputClasses}
          />
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className={labelClasses}>
            Notes (optional)
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add context, examples, or usage notes"
            rows={2}
            disabled={loading}
            className={inputClasses + " resize-none"}
          />
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 pt-4">
          {/* Save Button - Gradient */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold rounded-xl shadow-lg shadow-purple-500/25 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                {isEditing ? 'Updating...' : 'Saving...'}
              </>
            ) : (
              <>
                {isEditing ? 'Update Flashcard' : 'Save Flashcard'}
              </>
            )}
          </button>

          {/* Cancel Button - Ghost */}
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="w-full py-2.5 px-6 text-gray-400 hover:text-white hover:bg-gray-800 font-medium rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default FlashcardForm;
