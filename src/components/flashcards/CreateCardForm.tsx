// components/flashcards/CreateCardForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { createCardAction } from '@/lib/actions/deck-actions';
import { quickLanguageCheck } from '@/lib/validation';
import { AlertTriangle, CheckCircle, Loader2 } from 'lucide-react';

interface CreateCardFormProps {
  deckId: string;
  deckLanguage: string;
  languageTo: string;
}

export default function CreateCardForm({ deckId, deckLanguage, languageTo }: CreateCardFormProps) {
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [frontWarning, setFrontWarning] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Real-time language validation
  useEffect(() => {
    const check = quickLanguageCheck(front, deckLanguage);
    setFrontWarning(check.warning || '');
  }, [front, deckLanguage]);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setError('');
    setSuccess(false);

    const formData = new FormData();
    formData.append('deckId', deckId);
    formData.append('front', front);
    formData.append('back', back);
    formData.append('deckLanguage', deckLanguage);

    const result = await createCardAction(formData);

    if (result?.error) {
      setError(result.error);
    } else {
      setSuccess(true);
      setFront('');
      setBack('');
      setTimeout(() => setSuccess(false), 3000);
    }

    setIsSubmitting(false);
  };

  const getLangCode = (code: string): string => {
    const map: Record<string, string> = {
      en: 'en',
      it: 'it',
      fr: 'fr',
      uk: 'uk'
    };
    return map[code] || 'en';
  };

  const getFullLanguageName = (code: string): string => {
    const map: Record<string, string> = {
      en: 'English',
      it: 'Italian',
      fr: 'French',
      uk: 'Ukrainian',
      de: 'German',
      es: 'Spanish',
      pt: 'Portuguese'
    };
    return map[code] || code.toUpperCase();
  };

  return (
    <div className="space-y-4">
      {/* Front Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Front - Word to learn ({getFullLanguageName(deckLanguage)})
        </label>
        <textarea
          value={front}
          onChange={(e) => setFront(e.target.value)}
          spellCheck={true}
          lang={getLangCode(deckLanguage)}
          rows={3}
          className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-gray-500 focus:outline-none transition-colors resize-none ${
            frontWarning 
              ? 'border-yellow-400 bg-yellow-50' 
              : 'border-gray-300'
          }`}
          placeholder="Enter word or phrase to learn..."
        />
        
        {frontWarning && (
          <div className="mt-2 flex items-start gap-2 text-sm text-yellow-700 bg-yellow-50 p-3 rounded-lg border border-yellow-200">
            <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{frontWarning}</span>
          </div>
        )}

        {front.length >= 20 && !frontWarning && (
          <div className="mt-2 flex items-center gap-2 text-sm text-green-600">
            <CheckCircle className="w-4 h-4" />
            <span>Language detected correctly ✓</span>
          </div>
        )}
      </div>

      {/* Back Input */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Back - Translation ({getFullLanguageName(languageTo)})
        </label>
        <textarea
          value={back}
          onChange={(e) => setBack(e.target.value)}
          spellCheck={true}
          rows={3}
          className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:outline-none resize-none"
          placeholder="Enter translation..."
        />
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
          ❌ {error}
        </div>
      )}

      {/* Success Message */}
      {success && (
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-600">
          ✅ Card created successfully!
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
            <span>Creating...</span>
          </>
        ) : (
          'Create Card'
        )}
      </button>

      {/* Info Box */}

    </div>
  );
}