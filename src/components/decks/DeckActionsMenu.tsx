'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteDeckAction } from '@/lib/actions/deck-actions';
import { Trash2 } from 'lucide-react';

interface DeckActionsMenuProps {
  deckId: string;
  deckTitle: string;
}

export default function DeckActionsMenu({ deckId, deckTitle }: DeckActionsMenuProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${deckTitle}"?\n\nThis will permanently delete the deck and all its cards. This action cannot be undone.`
    );

    if (!confirmed) return;

    setIsDeleting(true);
    setError('');

    const result = await deleteDeckAction(deckId);

    if (result.error) {
      setError(result.error);
      setIsDeleting(false);
    } else {
      // Redirect to dashboard on success
      router.push('/dashboard');
    }
  };

  return (
    <div className="flex flex-col items-end gap-2">
      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Trash2 className="w-4 h-4" />
        {isDeleting ? 'Deleting...' : 'Delete Deck'}
      </button>
      
      {error && (
        <div className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded">
          {error}
        </div>
      )}
    </div>
  );
}
