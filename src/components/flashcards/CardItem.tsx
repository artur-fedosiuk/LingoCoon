// File: src/components/flashcards/CardItem.tsx
// Created: 2024-01-01
// Last-Updated: 2025-06-01
// Author: Claude
// Description: Displays a single flashcard in the deck management view.
//              Supports inline editing (click edit icon → save/cancel)
//              and one-click deletion with a confirmation dialog.

'use client';

import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Edit2, Trash2, Save, X } from 'lucide-react';
import { deleteCard, updateCard } from '@/lib/actions/deck-actions';
import type { Card } from '@/lib/supabase/types';

// ─── PROPS ────────────────────────────────────────────────────────────────────

interface CardItemProps {
  /** The card data from the database. */
  card: Card;
  /** The parent deck's ID — needed when calling update/delete actions. */
  deckId: string;
  /** The deck's source language code (e.g. "en") — shown as a label. */
  deckLanguage: string;
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function CardItem({ card, deckId, deckLanguage }: CardItemProps) {
  const { t } = useTranslation();

  // ── State ────────────────────────────────────────────────────────────────

  // Whether we are in "edit mode" (showing input fields) or "view mode" (showing text).
  const [isEditing, setIsEditing] = useState(false);

  // Local copies of front/back text — updated as the user types.
  const [front, setFront] = useState(card.front);
  const [back, setBack] = useState(card.back);

  // True while the delete Server Action is running.
  const [isDeleting, setIsDeleting] = useState(false);

  // True while the update Server Action is running.
  const [isSaving, setIsSaving] = useState(false);

  // Any error message returned by the server.
  const [error, setError] = useState('');

  // ── Handlers ─────────────────────────────────────────────────────────────

  /**
   * handleDelete — asks for confirmation, then permanently removes this card.
   */
  const handleDelete = async () => {
    // Native browser confirmation dialog (translated).
    if (!window.confirm(t('flashcards.edit.delete_confirm'))) return;

    setIsDeleting(true);
    setError('');

    const result = await deleteCard(card.id, deckId);

    if (result.error) {
      setError(result.error);
      setIsDeleting(false);
    }
    // If successful, the card disappears from the list automatically because
    // the Server Action calls revalidatePath(), which triggers a server re-render.
  };

  /**
   * handleSave — sends the edited front/back text to the server.
   */
  const handleSave = async () => {
    setIsSaving(true);
    setError('');

    const result = await updateCard(card.id, deckId, front, back);

    if (result.error) {
      setError(result.error);
      setIsSaving(false);
    } else {
      // Exit edit mode on success.
      setIsEditing(false);
      setIsSaving(false);
    }
  };

  /**
   * handleCancel — exits edit mode and restores the original values.
   */
  const handleCancel = () => {
    // Reset local state back to the original card values.
    setFront(card.front);
    setBack(card.back);
    setError('');
    setIsEditing(false);
  };

  // ── EDIT MODE VIEW ────────────────────────────────────────────────────────

  if (isEditing) {
    return (
      // Highlighted border to visually indicate we're in edit mode.
      <div className="bg-white p-5 rounded-lg border-2 border-gray-900 shadow-md">
        <div className="space-y-3">

          {/* FRONT INPUT */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {/* Shows "Front (EN)" using the deck language code. */}
              {t('flashcards.edit.front_label')} ({deckLanguage.toUpperCase()})
            </label>
            <input
              type="text"
              value={front}
              onChange={(e) => setFront(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg
                         focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              placeholder={t('flashcards.edit.front_placeholder')}
              disabled={isSaving}
            />
          </div>

          {/* BACK INPUT */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              {t('flashcards.edit.back_label')}
            </label>
            <input
              type="text"
              value={back}
              onChange={(e) => setBack(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg
                         focus:ring-2 focus:ring-gray-500 focus:border-transparent"
              placeholder={t('flashcards.edit.back_placeholder')}
              disabled={isSaving}
            />
          </div>

          {/* ERROR MESSAGE */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">
              {error}
            </p>
          )}

          {/* SAVE / CANCEL BUTTONS */}
          <div className="flex gap-2 pt-2">
            <button
              onClick={handleSave}
              // Disable while saving or if either field is empty.
              disabled={isSaving || !front.trim() || !back.trim()}
              className="flex-1 flex items-center justify-center gap-2 bg-gray-900 text-white
                         px-4 py-2 rounded-lg hover:bg-gray-800 disabled:opacity-50
                         disabled:cursor-not-allowed"
            >
              <Save className="w-4 h-4" />
              {isSaving ? t('flashcards.edit.saving') : t('flashcards.edit.save')}
            </button>
            <button
              onClick={handleCancel}
              disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-2 bg-gray-200 text-gray-700
                         px-4 py-2 rounded-lg hover:bg-gray-300 disabled:opacity-50"
            >
              <X className="w-4 h-4" />
              {t('flashcards.edit.cancel')}
            </button>
          </div>

        </div>
      </div>
    );
  }

  // ── VIEW MODE (default) ───────────────────────────────────────────────────

  return (
    // "group" enables the group-hover CSS utility on child elements.
    // The edit/delete buttons only appear when the card is hovered.
    <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm
                    hover:shadow-md group relative">

      {/* FRONT TEXT */}
      <div className="font-medium text-lg text-gray-900 mb-2">
        {card.front}
      </div>

      {/* BACK TEXT (separated by a subtle border) */}
      <div className="text-gray-600 pt-2 border-t border-gray-100">
        {card.back}
      </div>

      {/* ACTION BUTTONS — hidden until the card is hovered */}
      <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">

        {/* EDIT BUTTON */}
        <button
          onClick={() => setIsEditing(true)}
          className="p-2 bg-gray-100 text-gray-900 rounded-lg hover:bg-gray-200 transition-colors"
          title={t('flashcards.edit.edit_title')}
          disabled={isDeleting}
        >
          <Edit2 className="w-4 h-4" />
        </button>

        {/* DELETE BUTTON */}
        <button
          onClick={handleDelete}
          disabled={isDeleting}
          className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200
                     transition-colors disabled:opacity-50"
          title={t('flashcards.edit.delete_title')}
        >
          <Trash2 className="w-4 h-4" />
        </button>

      </div>

      {/* ERROR MESSAGE (only shown if an action failed) */}
      {error && (
        <div className="mt-2 text-sm text-red-600 bg-red-50 px-3 py-2 rounded">
          {error}
        </div>
      )}

    </div>
  );
}
