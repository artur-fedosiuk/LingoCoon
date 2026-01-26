// app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { getDecks } from '@/lib/actions/deck-actions';
import CreateDeckModal from '@/components/decks/CreateDeckModal';
import Link from 'next/link';
import { Plus, Book, ArrowRight } from 'lucide-react';
import type { Deck } from '@/lib/types';

export default function DashboardPage() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDecks();
  }, []);

  const loadDecks = async () => {
    setLoading(true);
    const { decks } = await getDecks();
    setDecks(decks);
    setLoading(false);
  };

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Decks</h1>
          <p className="text-gray-500 mt-1">Manage your flashcard collections</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 shadow-sm"
        >
          <Plus className="w-5 h-5" />
          New Deck
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex justify-center items-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      ) : decks.length === 0 ? (
        <div className="text-center py-20">
          <Book className="w-20 h-20 text-gray-300 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No decks yet</h3>
          <p className="text-gray-500 mb-6">Create your first deck to start learning</p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-gray-900 text-white px-6 py-3 rounded-lg hover:bg-gray-800 inline-flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create First Deck
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {decks.map((deck) => (
            <Link
              key={deck.id}
              href={`/decks/${deck.id}`}
              className="group block p-6 bg-white border border-gray-200 rounded-lg hover:shadow-lg hover:border-gray-400"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="font-semibold text-lg text-gray-900 group-hover:text-gray-900">
                  {deck.title}
                </h3>
                <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-900 group-hover:translate-x-1" />
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <span className="px-2 py-1 bg-gray-100 rounded">
                  {deck.language_from.toUpperCase()}
                </span>
                <span>→</span>
                <span className="px-2 py-1 bg-gray-100 rounded">
                  {deck.language_to.toUpperCase()}
                </span>
              </div>
              <div className="mt-4 text-xs text-gray-400">
                Created {new Date(deck.created_at).toLocaleDateString()}
              </div>
            </Link>
          ))}
        </div>
      )}

      <CreateDeckModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </div>
  );
}