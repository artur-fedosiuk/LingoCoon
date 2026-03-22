// src/components/flashcards/CardItem.tsx
// Displays a single flashcard. Supports inline editing and deletion.
'use client';

import { useState } from 'react';
import { deleteCard, updateCard } from '@/lib/actions/deck-actions';
import { Edit2, Trash2, Save, X } from 'lucide-react';
import type { Card } from '@/lib/supabase/types';

interface CardItemProps {
  card: Card;
  deckId: string;
  deckLanguage: string;
}

export default function CardItem({ card, deckId, deckLanguage }: CardItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [front, setFront] = useState(card.front);
  const [back, setBack] = useState(card.back);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this card?')) {
      return;
    }

    setIsDeleting(true);
    setError('');

    const result = await deleteCard(card.id, deckId);
    
    if (result.error) {
      setError(result.error);
      setIsDeleting(false);
    }
    // If success, the component will be removed via revalidation
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError('');

    const result = await updateCard(card.id, front, back, deckId);
    
    if (result.error) {
      setError(result.error);
      setIsSaving(false);
    } else {
      setIsEditing(false);
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setFront(card.front);
    setBack(card.back);
    setError('');
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="bg-white p-5 rounded-lg border-2 border-gray-900 shadow-md">
        <div className="space-y-3">
          {/* Front Input */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Front ({deckLanguage.toUpperCase()})
            </label>
            <input
              type="text"
              value={front}
              onChange={(e) => setFront(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              placeholder="Front of card"
              disabled={isSaving}
            />
          </div>

          {/* Back Input */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Back (Translation)
            </label>
            <input
              type="text"
              value={back}
              onChange={(e) => setBack(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              placeholder="Back of card"
              disabled={isSaving}
            />
          </div>

          {/* Error Message */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">
              {error}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              disabled={isSaving || !front.trim() || !back.trim()}
              className="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-2 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 disabled:opacity-50"
            >
              <X className="w-4 h-4" />
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm hover:shadow-md group relative">
      {/* Card Content */}
      <div className="font-medium text-lg text-gray-900 mb-2">
        {card.front}
      </div>
      <div className="text-gray-600 pt-2 border-t border-gray-100">
        {card.back}
      </div>
      
      {/* Action Buttons */}
      <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => setIsEditing(true)}
          className="p-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors"
          title="Edit card"
          disabled={isDeleting}
        >
          <Edit2 className="w-4 h-4" />
        </button>
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50"
          title="Delete card"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded">
          {error}
        </div>
      )}
    </div>
  );
}
