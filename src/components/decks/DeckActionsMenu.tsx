// File: src/components/decks/DeckActionsMenu.tsx
// Created: 2024-01-01
// Last-Updated: 2025-06-01
// Author: Claude
// Description: Delete button for a flashcard deck. Shows a confirmation dialog
//              before permanently removing the deck and all its cards.

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react';
import { deleteDeck } from '@/lib/actions/deck-actions';

// ─── PROPS ────────────────────────────────────────────────────────────────────

interface DeckActionsMenuProps {
  /** The UUID of the deck to delete. */
  deckId: string;
  /** The deck title — shown in the confirmation dialog so the user knows what they're deleting. */
  deckTitle: string;
}

// ─── COMPONENT ────────────────────────────────────────────────────────────────

export default function DeckActionsMenu({ deckId, deckTitle }: DeckActionsMenuProps) {
  const router = useRouter();
  const { t } = useTranslation();

  // True while the delete Server Action is running — disables the button.
  const [isDeleting, setIsDeleting] = useState(false);

  // Holds any error message returned by the server.
  const [error, setError] = useState('');

  /**
   * handleDelete — asks the user to confirm, then calls the deleteDeck Server Action.
   *
   * window.confirm() is a native browser dialog. It blocks the thread and returns
   * true if the user clicked "OK", or false if they clicked "Cancel".
   * The confirmation message is fetched from the translation file so it works in
   * all four supported languages.
   */
  const handleDelete = async () => {
    // Build the confirmation message using the t() function with interpolation.
    // {{title}} inside the translation string gets replaced with the deck title.
    const confirmed = window.confirm(
      t('deck_actions.delete_confirm', { title: deckTitle })
    );

    // If the user pressed Cancel, do nothing.
    if (!confirmed) return;

    setIsDeleting(true);
    setError('');

    // deleteDeck is a Server Action — it runs on the server and talks to Supabase.
    const result = await deleteDeck(deckId);

    if (result.error) {
      // Show the error without redirecting.
      setError(result.error);
      setIsDeleting(false);
    } else {
      // On success, redirect the user back to the dashboard.
      // router.push() changes the URL without a full page reload.
      router.push('/dashboard');
    }
  };

  return (
    // Flex column so the error message appears below the button.
    <div className="flex flex-col items-end gap-2">

      {/* DELETE BUTTON */}
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg
                   hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed
                   transition-colors"
      >
        <Trash2 className="w-4 h-4" />
        {/* Show "Deleting..." while the server call is running. */}
        {isDeleting ? t('deck_actions.deleting') : t('deck_actions.delete')}
      </button>

      {/* ERROR MESSAGE: only shown if the server returned an error. */}
      {error && (
        <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">
          {error}
        </div>
      )}

    </div>
  );
}
